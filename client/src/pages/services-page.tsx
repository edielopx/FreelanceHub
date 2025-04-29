import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Service, InsertService } from "@shared/schema";
import { useLocation } from "wouter";
import { AlertTriangle, Edit, Plus, Trash2, PencilLine, Loader2, CheckCircle2 } from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

// Esquema para validação do formulário
const serviceFormSchema = z.object({
  title: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }),
  description: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres" }),
  price: z.number().min(1, { message: "Preço deve ser maior que zero" }),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export default function ServicesPage() {
  const { user, isLoading: isLoadingUser } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteService, setDeleteService] = useState<Service | null>(null);
  
  // UseForm hook para o formulário de serviço
  const serviceForm = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
    }
  });

  // Buscar perfil de freelancer
  const { data: freelancerProfile, isLoading: isLoadingFreelancerProfile } = useQuery({
    queryKey: ["/api/freelancer-profile"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/freelancer-profile");
        if (res.status === 404) return null;
        return await res.json();
      } catch (error) {
        console.error("Erro ao buscar perfil de freelancer:", error);
        return null;
      }
    },
    enabled: user?.userType === "freelancer",
  });

  // Buscar serviços do freelancer
  const { 
    data: services, 
    isLoading: isLoadingServices,
    refetch: refetchServices 
  } = useQuery({
    queryKey: ["/api/services"],
    queryFn: async () => {
      if (!freelancerProfile?.id) return [];
      
      const res = await apiRequest("GET", `/api/services/freelancer/${freelancerProfile.id}`);
      return await res.json();
    },
    enabled: !!freelancerProfile?.id,
  });

  // Mutation para criar ou atualizar serviço
  const servicesMutation = useMutation({
    mutationFn: async (data: Partial<InsertService>) => {
      if (editingService) {
        // Atualizar serviço existente
        const res = await apiRequest("PATCH", `/api/services/${editingService.id}`, data);
        return await res.json();
      } else {
        // Criar novo serviço
        const payload = {
          ...data,
          freelancerId: freelancerProfile?.id,
        };
        const res = await apiRequest("POST", "/api/services", payload);
        return await res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: editingService ? "Serviço atualizado" : "Serviço criado",
        description: editingService 
          ? "O serviço foi atualizado com sucesso." 
          : "O serviço foi criado com sucesso.",
      });
      setIsDialogOpen(false);
      setEditingService(null);
      serviceForm.reset({
        title: "",
        description: "",
        price: 0,
      });
      refetchServices();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao ${editingService ? "atualizar" : "criar"} serviço: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para deletar serviço
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      const res = await apiRequest("DELETE", `/api/services/${serviceId}`);
      return res.status === 204;
    },
    onSuccess: () => {
      toast({
        title: "Serviço excluído",
        description: "O serviço foi excluído com sucesso.",
      });
      setDeleteService(null);
      refetchServices();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: `Erro ao excluir serviço: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Abrir modal para editar serviço
  const handleEditService = (service: Service) => {
    setEditingService(service);
    serviceForm.reset({
      title: service.title,
      description: service.description,
      price: service.price,
    });
    setIsDialogOpen(true);
  };

  // Abrir modal para criar novo serviço
  const handleAddService = () => {
    setEditingService(null);
    serviceForm.reset({
      title: "",
      description: "",
      price: 0,
    });
    setIsDialogOpen(true);
  };

  // Enviar formulário de serviço
  const onSubmit = (data: ServiceFormValues) => {
    servicesMutation.mutate(data);
  };

  // Se o usuário ainda não tiver perfil de freelancer, redirecionar para a página de perfil
  if (!isLoadingUser && !isLoadingFreelancerProfile && user?.userType === "freelancer" && !freelancerProfile) {
    return (
      <div className="container mx-auto py-10 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Perfil profissional não encontrado</CardTitle>
            <CardDescription>
              Para criar anúncios de serviços, você precisa completar seu perfil profissional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-4 rounded-md bg-yellow-50 text-yellow-800 mb-4">
              <AlertTriangle className="h-5 w-5" />
              <p>É necessário completar seu perfil profissional antes de oferecer serviços.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setLocation("/profile")}>Completar Perfil</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Se o usuário não for freelancer, mostrar mensagem de erro
  if (!isLoadingUser && user?.userType !== "freelancer") {
    return (
      <div className="container mx-auto py-10 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Esta página é exclusiva para freelancers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-4 rounded-md bg-red-50 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <p>Apenas usuários com perfil de freelancer podem criar e gerenciar serviços.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setLocation("/")}>Voltar para o Início</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meus Serviços</h1>
        <Button onClick={handleAddService}>
          <Plus className="mr-2 h-4 w-4" /> Novo Serviço
        </Button>
      </div>

      {isLoadingFreelancerProfile || isLoadingServices ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : services && services.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((service: Service) => (
            <Card key={service.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle>{service.title}</CardTitle>
                <div className="text-xl font-bold text-primary">
                  R$ {service.price.toFixed(2)}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-gray-600 line-clamp-4">{service.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEditService(service)}
                >
                  <Edit className="h-4 w-4 mr-2" /> Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir serviço</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o serviço "{service.title}"? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteServiceMutation.mutate(service.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteServiceMutation.isPending 
                          ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                          : <Trash2 className="h-4 w-4 mr-2" />
                        }
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum serviço cadastrado</CardTitle>
            <CardDescription>
              Você ainda não tem serviços cadastrados. Crie seu primeiro serviço para começar a receber propostas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="rounded-full bg-primary-50 p-4">
                <PencilLine className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Crie seu primeiro serviço</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Descreva em detalhes o serviço que você oferece, defina um preço e comece a receber agendamentos.
                </p>
              </div>
              <Button onClick={handleAddService}>
                <Plus className="mr-2 h-4 w-4" /> Criar Serviço
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal para adicionar/editar serviço */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Editar Serviço" : "Criar Novo Serviço"}
            </DialogTitle>
            <DialogDescription>
              {editingService 
                ? "Atualize as informações do seu serviço." 
                : "Preencha os detalhes do serviço que você deseja oferecer."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...serviceForm}>
            <form onSubmit={serviceForm.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={serviceForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Design de Logo Profissional" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Um título claro e atrativo para seu serviço.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={serviceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva em detalhes o serviço que você oferece, incluindo o que está incluso, prazos, e qualquer outra informação relevante." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Uma descrição detalhada aumenta suas chances de conseguir clientes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={serviceForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      O preço fixo para este serviço, em Reais (R$).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button 
                  type="submit"
                  disabled={servicesMutation.isPending}
                >
                  {servicesMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingService ? "Atualizando..." : "Criando..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {editingService ? "Atualizar" : "Criar"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}