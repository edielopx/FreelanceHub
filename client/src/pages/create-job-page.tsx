import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";

// Components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, MapPin } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Schema para validação do formulário
const jobFormSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  category: z.string().min(1, "Por favor, selecione uma categoria"),
  budget: z.coerce.number().min(1, "O orçamento deve ser maior que 0"),
  location: z.string().min(3, "Por favor, informe a localização"),
  deadline: z.date().nullable(),
  contactInfo: z.string().nullable(),
  status: z.enum(["open", "closed", "in_progress", "completed"]).default("open"),
  clientId: z.number().optional(), // Será definido no backend
});

type JobFormValues = z.infer<typeof jobFormSchema>;

export default function CreateJobPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLocating, setIsLocating] = useState(false);

  // Inicializar formulário
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      budget: 100,
      location: user?.location || "",
      deadline: null,
      contactInfo: null,
      status: "open",
      clientId: user?.id,
    },
  });

  // Mutation para criar anúncio
  const createJobMutation = useMutation({
    mutationFn: async (values: JobFormValues) => {
      if (!user) throw new Error("Usuário não autenticado");
      
      const data = {
        ...values,
        clientId: user.id,
        status: "open",
      };
      
      const res = await apiRequest("POST", "/api/jobs", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao criar anúncio");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Anúncio criado com sucesso!",
        description: "Seu anúncio foi publicado e já está disponível para freelancers.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      navigate("/jobs");
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar anúncio",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Função para usar a localização atual do usuário
  const getUserLocation = () => {
    setIsLocating(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Usar API de geocodificação reversa para obter o endereço
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            
            if (response.ok) {
              const data = await response.json();
              const address = data.display_name || "Localização atual";
              form.setValue("location", address);
            } else {
              form.setValue("location", `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            }
          } catch (error) {
            console.error("Erro ao obter endereço:", error);
            form.setValue("location", `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
          
          setIsLocating(false);
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
          toast({
            title: "Erro de localização",
            description: "Não foi possível obter sua localização. Verifique as permissões do navegador.",
            variant: "destructive",
          });
          setIsLocating(false);
        }
      );
    } else {
      toast({
        title: "Geolocalização não suportada",
        description: "Seu navegador não suporta geolocalização.",
        variant: "destructive",
      });
      setIsLocating(false);
    }
  };

  // Função para lidar com a submissão do formulário
  const onSubmit = (values: JobFormValues) => {
    createJobMutation.mutate(values);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Publicar Anúncio de Serviço</h1>
          <p className="text-muted-foreground mb-8">
            Descreva o trabalho que você precisa e encontre um profissional qualificado.
          </p>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Anúncio</CardTitle>
          <CardDescription>
            Forneça informações detalhadas sobre o serviço que você está buscando.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Título do Anúncio */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Anúncio</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Desenvolvimento de site para loja virtual" {...field} />
                    </FormControl>
                    <FormDescription>
                      Um título claro que descreva o serviço que você precisa.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Descrição do Serviço */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição Detalhada</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva em detalhes o que você precisa, incluindo requisitos específicos, prazos e expectativas..." 
                        className="min-h-[150px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Quanto mais detalhes você fornecer, melhores serão as propostas que receberá.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Categoria */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="development">Desenvolvimento</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="writing">Escrita</SelectItem>
                        <SelectItem value="photography">Fotografia</SelectItem>
                        <SelectItem value="video">Vídeo</SelectItem>
                        <SelectItem value="audio">Áudio</SelectItem>
                        <SelectItem value="translation">Tradução</SelectItem>
                        <SelectItem value="legal">Jurídico</SelectItem>
                        <SelectItem value="finance">Finanças</SelectItem>
                        <SelectItem value="admin">Administrativo</SelectItem>
                        <SelectItem value="other">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecione a categoria que melhor representa o serviço que você precisa.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Orçamento */}
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orçamento (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormDescription>
                        Informe quanto você está disposto a pagar por este serviço.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Prazo */}
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Prazo (opcional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ptBR })
                              ) : (
                                "Selecione uma data"
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Data limite para conclusão do serviço.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Localização */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localização</FormLabel>
                    <div className="flex gap-2">
                      <FormControl className="flex-1">
                        <Input placeholder="Ex: São Paulo, SP" {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-shrink-0"
                        onClick={getUserLocation}
                        disabled={isLocating}
                      >
                        {isLocating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <MapPin className="mr-2 h-4 w-4" />
                        )}
                        {isLocating ? "Obtendo..." : "Localização Atual"}
                      </Button>
                    </div>
                    <FormDescription>
                      Informe onde o serviço será realizado ou a localização de referência.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Informações de Contato */}
              <FormField
                control={form.control}
                name="contactInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Informações de Contato (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Telefone, email ou outra forma de contato preferida" {...field} />
                    </FormControl>
                    <FormDescription>
                      Informações adicionais de contato além do chat da plataforma.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="mr-2"
                  onClick={() => navigate("/jobs")}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createJobMutation.isPending}
                >
                  {createJobMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    "Publicar Anúncio"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  );
}