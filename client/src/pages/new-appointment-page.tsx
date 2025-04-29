import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isToday, isTomorrow, isThisWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

// Schema para validação do formulário
const appointmentSchema = z.object({
  serviceId: z.number(),
  appointmentDate: z.date({
    required_error: "Por favor, selecione uma data",
  }),
  timeSlot: z.string({
    required_error: "Por favor, selecione um horário",
  }),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

// Tipo de serviço
type Service = {
  id: number;
  freelancerId: number;
  title: string;
  description: string;
  price: number;
};

// Tipo de slot de horário
type TimeSlot = {
  startTime: string;
  endTime: string;
};

export default function NewAppointmentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Extrair serviceId da URL se existir
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const serviceIdFromUrl = searchParams.get("serviceId");
  
  // UseForm hook
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      serviceId: serviceIdFromUrl ? parseInt(serviceIdFromUrl) : undefined,
      notes: "",
    }
  });

  // Buscar informações do serviço se serviceId estiver disponível
  const serviceId = form.watch("serviceId");
  const { data: service, isLoading: isLoadingService } = useQuery({
    queryKey: ["/api/services", serviceId],
    queryFn: () => apiRequest("GET", `/api/services/${serviceId}`).then(res => res.json()),
    enabled: !!serviceId
  });

  // Buscar slots de horários disponíveis para a data selecionada
  const { data: availableSlots, isLoading: isLoadingSlots } = useQuery({
    queryKey: ["/api/available-slots", serviceId, selectedDate],
    queryFn: () => {
      if (!selectedDate) return Promise.resolve([]);
      const dateParam = format(selectedDate, "yyyy-MM-dd");
      return apiRequest("GET", `/api/available-slots/${serviceId}?date=${dateParam}`)
        .then(res => res.json());
    },
    enabled: !!serviceId && !!selectedDate
  });

  // Mutação para criar agendamento
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/appointments", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agendamento criado",
        description: "Seu agendamento foi criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setLocation("/appointments");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar agendamento",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Função para enviar o formulário
  const onSubmit = (data: AppointmentFormValues) => {
    if (!data.serviceId || !data.appointmentDate || !data.timeSlot) {
      toast({
        title: "Formulário incompleto",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const [startHour, startMinute] = data.timeSlot.split(":");
    const appointmentDate = new Date(data.appointmentDate);
    appointmentDate.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

    // Calcular o final baseado em 1 hora após o início
    const endTime = new Date(appointmentDate);
    endTime.setHours(endTime.getHours() + 1);

    createAppointmentMutation.mutate({
      serviceId: data.serviceId,
      appointmentDate: appointmentDate.toISOString(),
      endTime: endTime.toISOString(),
      notes: data.notes,
      status: "pending"
    });
  };

  // Quando a data for alterada, resetar o slot de tempo selecionado
  useEffect(() => {
    form.setValue("timeSlot", "");
  }, [selectedDate, form]);

  return (
    <div className="container mx-auto py-8">
      <Button 
        variant="outline" 
        size="sm"
        className="mb-6"
        onClick={() => setLocation("/appointments")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Novo Agendamento</h1>

        {!serviceId ? (
          <Card>
            <CardHeader>
              <CardTitle>Selecione um serviço</CardTitle>
              <CardDescription>
                Por favor, selecione um serviço para agendar indo para a página de freelancers.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => setLocation("/freelancers")}>
                Procurar Freelancers
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Exibir informações do serviço */}
              {service && (
                <Card>
                  <CardHeader>
                    <CardTitle>{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">
                      Preço: R$ {service.price.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Seletor de data */}
              <FormField
                control={form.control}
                name="appointmentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setSelectedDate(date);
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Escolha uma data para o seu agendamento.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Seletor de horário */}
              {selectedDate && (
                <FormField
                  control={form.control}
                  name="timeSlot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-3 gap-4 mt-2"
                        >
                          {isLoadingSlots ? (
                            <div className="col-span-3 text-center py-4">
                              <Clock className="animate-spin h-6 w-6 mx-auto mb-2 text-primary" />
                              <p>Carregando horários disponíveis...</p>
                            </div>
                          ) : availableSlots && availableSlots.length > 0 ? (
                            availableSlots.map((slot: TimeSlot, index: number) => {
                              const startTime = parseISO(slot.startTime);
                              const formattedStartTime = format(startTime, "HH:mm");
                              
                              return (
                                <div key={index} className="flex items-center space-x-2">
                                  <RadioGroupItem 
                                    value={formattedStartTime} 
                                    id={`time-${index}`} 
                                    className="peer sr-only" 
                                  />
                                  <Label
                                    htmlFor={`time-${index}`}
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                  >
                                    <Clock className="mb-2 h-4 w-4" />
                                    <span>{formattedStartTime}</span>
                                  </Label>
                                </div>
                              );
                            })
                          ) : (
                            <div className="col-span-3 text-center py-4 border rounded-md">
                              <p className="text-muted-foreground">
                                Nenhum horário disponível para esta data.
                              </p>
                            </div>
                          )}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Notas */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas ou instruções</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Adicione informações adicionais ou instruções específicas para o freelancer"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Opcional: Forneça detalhes adicionais sobre o que você precisa.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={createAppointmentMutation.isPending}
              >
                {createAppointmentMutation.isPending ? "Agendando..." : "Agendar Serviço"}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}