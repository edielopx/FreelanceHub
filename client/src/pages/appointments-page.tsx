import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, CheckIcon, XIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

// Tipos
type Appointment = {
  id: number;
  serviceId: number;
  clientId: number;
  appointmentDate: string;
  endTime: string;
  status: "pending" | "confirmed" | "canceled" | "completed";
  notes?: string;
  createdAt: string;
};

type Service = {
  id: number;
  freelancerId: number;
  title: string;
  description: string;
  price: number;
};

type StatusBadge = {
  [key: string]: {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline" | null;
  }
};

const statusBadges: StatusBadge = {
  "pending": { label: "Pendente", variant: "secondary" },
  "confirmed": { label: "Confirmado", variant: "default" },
  "canceled": { label: "Cancelado", variant: "destructive" },
  "completed": { label: "Concluído", variant: "outline" }
};

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>(user?.userType === "freelancer" ? "asFreelancer" : "asClient");

  // Buscar agendamentos como cliente
  const { 
    data: clientAppointments,
    isLoading: isLoadingClientAppointments
  } = useQuery({
    queryKey: ["/api/appointments", "client"],
    queryFn: () => apiRequest("GET", "/api/appointments?role=client").then(res => res.json()),
    enabled: !!user
  });

  // Buscar agendamentos como freelancer
  const { 
    data: freelancerAppointments,
    isLoading: isLoadingFreelancerAppointments
  } = useQuery({
    queryKey: ["/api/appointments", "freelancer"],
    queryFn: () => apiRequest("GET", "/api/appointments?role=freelancer").then(res => res.json()),
    enabled: !!user && user.userType === "freelancer"
  });

  // Mutação para atualizar status de agendamento
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const response = await apiRequest("PUT", `/api/appointments/${id}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status do agendamento foi atualizado com sucesso.",
      });
      // Atualizar os dados
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Confirmar agendamento (para freelancers)
  const handleConfirmAppointment = (id: number) => {
    updateStatusMutation.mutate({ id, status: "confirmed" });
  };

  // Cancelar agendamento (para ambos)
  const handleCancelAppointment = (id: number) => {
    updateStatusMutation.mutate({ id, status: "canceled" });
  };

  // Marcar como concluído (para freelancers)
  const handleCompleteAppointment = (id: number) => {
    updateStatusMutation.mutate({ id, status: "completed" });
  };

  // Formatação de data e hora
  const formatDateTime = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Renderizar um agendamento
  const renderAppointment = (appointment: Appointment, isFreelancer = false) => {
    return (
      <Card key={appointment.id} className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Agendamento #{appointment.id}</CardTitle>
              <CardDescription>
                <div className="flex items-center mt-1">
                  <CalendarIcon className="mr-1 h-4 w-4" />
                  {formatDateTime(appointment.appointmentDate)}
                </div>
              </CardDescription>
            </div>
            <Badge variant={statusBadges[appointment.status].variant || "default"}>
              {statusBadges[appointment.status].label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {appointment.notes && (
              <div>
                <h4 className="text-sm font-medium">Notas:</h4>
                <p className="text-sm text-gray-500">{appointment.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          {appointment.status === "pending" && (
            <>
              {isFreelancer && (
                <Button onClick={() => handleConfirmAppointment(appointment.id)} size="sm">
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Confirmar
                </Button>
              )}
              <Button 
                onClick={() => handleCancelAppointment(appointment.id)} 
                variant="outline" 
                size="sm"
              >
                <XIcon className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </>
          )}
          {appointment.status === "confirmed" && isFreelancer && (
            <Button onClick={() => handleCompleteAppointment(appointment.id)} size="sm">
              <CheckIcon className="h-4 w-4 mr-1" />
              Concluir
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  // Renderizar esqueleto de carregamento
  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <Card key={index} className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-56 mt-2" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </CardFooter>
      </Card>
    ));
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Agendamentos</h1>
        <Button onClick={() => setLocation("/new-appointment")}>
          Novo Agendamento
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="asClient">Como Cliente</TabsTrigger>
          {user?.userType === "freelancer" && (
            <TabsTrigger value="asFreelancer">Como Freelancer</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="asClient" className="mt-4">
          <h2 className="text-xl font-semibold mb-4">Meus Agendamentos</h2>
          
          {isLoadingClientAppointments ? (
            renderSkeletons()
          ) : clientAppointments?.length > 0 ? (
            clientAppointments.map((appointment: Appointment) => 
              renderAppointment(appointment, false)
            )
          ) : (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium">Você ainda não tem agendamentos</h3>
              <p className="text-gray-500 mt-1">
                Encontre um freelancer e agende um serviço
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setLocation("/freelancers")}
              >
                Procurar Freelancers
              </Button>
            </div>
          )}
        </TabsContent>

        {user?.userType === "freelancer" && (
          <TabsContent value="asFreelancer" className="mt-4">
            <h2 className="text-xl font-semibold mb-4">Solicitações de Agendamento</h2>
            
            {isLoadingFreelancerAppointments ? (
              renderSkeletons()
            ) : freelancerAppointments?.length > 0 ? (
              freelancerAppointments.map((appointment: Appointment) => 
                renderAppointment(appointment, true)
              )
            ) : (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium">Você ainda não tem solicitações de agendamento</h3>
                <p className="text-gray-500 mt-1">
                  Quando clientes agendarem seus serviços, eles aparecerão aqui
                </p>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}