import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { User, Category, UserType, InsertFreelancerProfile } from "@shared/schema";
import { useLocation, Link } from "wouter";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { MultiSelect } from "@/components/ui/multi-select";
import { Loader2, Upload, MapPin, User as UserIcon, Home, Briefcase } from "lucide-react";

// Schemas para validação
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "E-mail inválido" }),
  bio: z.string().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  profileImage: z.string().optional(),
});

const freelancerFormSchema = z.object({
  title: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }),
  category: z.string(),
  hourlyRate: z.number().min(1, { message: "Valor por hora deve ser maior que zero" }),
  skills: z.array(z.string()).min(1, { message: "Adicione pelo menos uma habilidade" }),
  experience: z.string().optional(),
  education: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type FreelancerFormValues = z.infer<typeof freelancerFormSchema>;

export default function ProfilePage() {
  const { user, isLoading: isLoadingUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [geolocateStatus, setGeolocateStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [location, setLocation] = useLocation();
  
  // Form para o perfil básico do usuário
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      bio: user?.bio || "",
      location: user?.location || "",
      latitude: user?.latitude || undefined,
      longitude: user?.longitude || undefined,
      profileImage: user?.profileImage || "",
    }
  });

  // Buscar o perfil de freelancer se o usuário for freelancer
  const { data: freelancerProfile, isLoading: isLoadingFreelancerProfile } = useQuery({
    queryKey: ["/api/freelancer-profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/freelancer-profile");
      if (res.status === 404) return null;
      return await res.json();
    },
    enabled: user?.userType === "freelancer",
  });

  // Form para o perfil de freelancer
  const freelancerForm = useForm<FreelancerFormValues>({
    resolver: zodResolver(freelancerFormSchema),
    defaultValues: {
      title: freelancerProfile?.title || "",
      category: freelancerProfile?.category || "",
      hourlyRate: freelancerProfile?.hourlyRate || 0,
      skills: freelancerProfile?.skills || [],
      experience: freelancerProfile?.experience || "",
      education: freelancerProfile?.education || "",
    }
  });

  // Atualizar o formulário quando os dados do perfil forem carregados
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name,
        email: user.email,
        bio: user.bio || "",
        location: user.location || "",
        latitude: user.latitude || undefined,
        longitude: user.longitude || undefined,
        profileImage: user.profileImage || "",
      });
    }
  }, [user, profileForm]);

  // Atualizar o formulário quando os dados do perfil de freelancer forem carregados
  useEffect(() => {
    if (freelancerProfile) {
      freelancerForm.reset({
        title: freelancerProfile.title,
        category: freelancerProfile.category,
        hourlyRate: freelancerProfile.hourlyRate,
        skills: freelancerProfile.skills,
        experience: freelancerProfile.experience || "",
        education: freelancerProfile.education || "",
      });
    }
  }, [freelancerProfile, freelancerForm]);

  // Mutation para atualizar o perfil básico
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await apiRequest("PATCH", "/api/user", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para atualizar o perfil de freelancer
  const updateFreelancerProfileMutation = useMutation({
    mutationFn: async (data: Partial<InsertFreelancerProfile>) => {
      const res = await apiRequest("POST", "/api/freelancer-profile", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Perfil profissional atualizado",
        description: "Suas informações profissionais foram atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar perfil profissional",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Obter localização do usuário
  const handleGetLocation = () => {
    setGeolocateStatus("loading");
    
    if (!navigator.geolocation) {
      setGeolocateStatus("error");
      toast({
        title: "Geolocalização não suportada",
        description: "Seu navegador não suporta geolocalização.",
        variant: "destructive",
      });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Atualizar o formulário com as coordenadas
        profileForm.setValue("latitude", latitude);
        profileForm.setValue("longitude", longitude);
        
        // Solicitando ao usuário que insira a localização manualmente
        toast({
          title: "Localização obtida",
          description: "Por favor, insira o endereço manualmente no campo Localização.",
        });
        
        setGeolocateStatus("success");
      },
      (error) => {
        console.error("Erro na geolocalização:", error);
        setGeolocateStatus("error");
        toast({
          title: "Erro na geolocalização",
          description: "Não foi possível obter sua localização. Verifique as permissões do navegador.",
          variant: "destructive",
        });
      }
    );
  };

  // Submit do formulário de perfil básico
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  // Submit do formulário de perfil de freelancer
  const onFreelancerSubmit = (data: FreelancerFormValues) => {
    updateFreelancerProfileMutation.mutate(data);
  };

  // Opções de categoria para o select
  const categoryOptions: Category[] = [
    "development",
    "design",
    "marketing",
    "writing",
    "photography",
    "video",
    "audio",
    "translation",
    "legal",
    "finance",
    "admin",
    "other"
  ];

  // Mapear categorias para texto amigável
  const categoryLabels: Record<Category, string> = {
    development: "Desenvolvimento",
    design: "Design",
    marketing: "Marketing",
    writing: "Escrita",
    photography: "Fotografia",
    video: "Vídeo",
    audio: "Áudio",
    translation: "Tradução",
    legal: "Jurídico",
    finance: "Finanças",
    admin: "Administrativo",
    other: "Outro"
  };

  // Opções de habilidades sugeridas por categoria
  const skillSuggestions: Record<Category, string[]> = {
    development: ["JavaScript", "React", "Node.js", "Python", "Java", "C#", "PHP", "Ruby", "SQL", "TypeScript", "Angular", "Vue.js", "Docker", "AWS", "GCP", "Azure", "Git", "Firebase", "MongoDB", "REST API"],
    design: ["UI/UX", "Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator", "InDesign", "Protótipos", "Design Thinking", "Design de Logo", "Identidade Visual", "Web Design", "Mobile Design", "Design Editorial", "Animação", "3D"],
    marketing: ["SEO", "SEM", "Google Ads", "Facebook Ads", "Instagram", "TikTok", "E-mail Marketing", "Inbound Marketing", "Content Marketing", "Growth Hacking", "Análise de Dados", "CRO", "Google Analytics", "Marketing de Influência", "Branding"],
    writing: ["Copywriting", "Redação", "Blog", "Artigos", "SEO Writing", "Ghostwriting", "Revisão de Texto", "Roteiro", "Storytelling", "UX Writing", "Tradução", "E-books", "Descrição de Produto", "Jornalismo", "Relatórios"],
    photography: ["Retratos", "Eventos", "Produtos", "Arquitetura", "Natureza", "Fotojornalismo", "Moda", "Edição de Fotos", "Lightroom", "Photoshop", "Fotografia de Alimentos", "Lifestyle", "Fotografia Publicitária", "Fotografia Aérea", "Fotografia Noturna"],
    video: ["Edição de Vídeo", "Animação", "After Effects", "Premiere Pro", "Final Cut Pro", "Motion Graphics", "Filmagem", "Storyboard", "Produção", "YouTube", "Vídeos Explicativos", "Vídeos Promocionais", "Documentários", "Vídeos para Redes Sociais"],
    audio: ["Produção Musical", "Gravação", "Mixagem", "Masterização", "Composição", "Podcast", "Sound Design", "Narração", "Dublagem", "Edição de Áudio", "Logic Pro", "Ableton Live", "Pro Tools", "Música para Vídeos", "Jingles"],
    translation: ["Inglês", "Espanhol", "Francês", "Alemão", "Italiano", "Chinês", "Japonês", "Russo", "Árabe", "Português", "Tradução Jurídica", "Tradução Técnica", "Tradução Médica", "Localização", "Legendagem"],
    legal: ["Contratos", "Propriedade Intelectual", "Direito Comercial", "Direito Trabalhista", "Direito Digital", "LGPD", "Compliance", "Consultoria Jurídica", "Direito Autoral", "Registro de Marcas", "Direito Societário", "Direito Imobiliário", "Direito do Consumidor"],
    finance: ["Contabilidade", "Impostos", "Planejamento Financeiro", "Análise Financeira", "Excel", "PowerBI", "Gestão de Custos", "Fluxo de Caixa", "Investimentos", "Controle Orçamentário", "Modelagem Financeira", "Valuation", "Auditoria", "Controle Interno"],
    admin: ["Assistente Virtual", "Gestão de Projetos", "Atendimento ao Cliente", "CRM", "Gestão de Dados", "Agendamento", "Transcrição", "Digitação", "Excel", "Word", "PowerPoint", "Organização", "Gestão de Tempo", "Pesquisa"],
    other: ["Consultoria", "Coaching", "Instrução", "Análise de Dados", "BI", "Machine Learning", "Pesquisa de Mercado", "Testes de Usabilidade", "Quality Assurance", "Artes", "Ilustração", "Arquitetura", "Modelagem 3D", "Jardinagem", "Culinária", "Carpintaria"]
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-10 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Faça login para acessar seu perfil.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation("/auth")}>Ir para Login</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Determinar qual é a página inicial com base no tipo de usuário
  const getHomePath = () => {
    return user.userType === "freelancer" ? "/" : "/";
  };
  
  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <Link 
            href={getHomePath()} 
            className="flex items-center justify-center mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 bg-primary/10"
            title="Voltar ao Menu Principal"
          >
            <Briefcase 
              className="h-8 w-8 text-primary" 
            />
          </Link>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Perfil Pessoal</TabsTrigger>
          {user.userType === "freelancer" && (
            <TabsTrigger value="professional">Perfil Profissional</TabsTrigger>
          )}
        </TabsList>
        
        {/* Perfil Pessoal */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e de contato.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite seu nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite seu e-mail" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biografia</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Conte um pouco sobre você" 
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Uma breve descrição sobre você para seu perfil público.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="profileImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Foto de Perfil</FormLabel>
                        <FormControl>
                          <div className="flex flex-col space-y-3">
                            <Input 
                              placeholder="URL da sua foto de perfil" 
                              {...field} 
                            />
                            {field.value && (
                              <div className="w-24 h-24 rounded-full overflow-hidden border">
                                <img 
                                  src={field.value} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = "https://via.placeholder.com/100?text=Erro";
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Cole a URL de uma imagem para seu perfil. Use serviços como Imgur ou similar.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Localização</FormLabel>
                          <div className="flex space-x-2">
                            <FormControl>
                              <Input 
                                placeholder="Digite seu endereço ou cidade" 
                                {...field} 
                              />
                            </FormControl>
                            <Button 
                              variant="outline" 
                              type="button"
                              onClick={handleGetLocation}
                              disabled={geolocateStatus === "loading"}
                            >
                              {geolocateStatus === "loading" ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <MapPin className="h-4 w-4 mr-2" />
                              )}
                              Localizar
                            </Button>
                          </div>
                          <FormDescription>
                            Sua localização ajuda freelancers e clientes próximos a encontrarem você.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.000001"
                                placeholder="Latitude" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitude</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.000001"
                                placeholder="Longitude" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : "Salvar Alterações"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Perfil Profissional (apenas para freelancers) */}
        {user.userType === "freelancer" && (
          <TabsContent value="professional">
            <Card>
              <CardHeader>
                <CardTitle>Perfil Profissional</CardTitle>
                <CardDescription>
                  Atualize suas informações profissionais para destacar suas habilidades e experiência.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingFreelancerProfile ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Form {...freelancerForm}>
                    <form onSubmit={freelancerForm.handleSubmit(onFreelancerSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={freelancerForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Título Profissional</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Ex: Desenvolvedor Full Stack" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Um título que descreva sua atuação profissional.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={freelancerForm.control}
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
                                  {categoryOptions.map((category) => (
                                    <SelectItem 
                                      key={category} 
                                      value={category}
                                    >
                                      {categoryLabels[category]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                A principal categoria de serviços que você oferece.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={freelancerForm.control}
                        name="hourlyRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor por Hora (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="Valor por hora"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Seu valor de referência por hora de trabalho.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={freelancerForm.control}
                        name="skills"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Habilidades</FormLabel>
                            <FormControl>
                              <MultiSelect
                                selected={field.value}
                                setSelected={field.onChange}
                                placeholder="Selecione ou digite suas habilidades"
                                suggestions={skillSuggestions[freelancerForm.watch("category") as Category] || []}
                                allowCreate
                              />
                            </FormControl>
                            <FormDescription>
                              Suas principais habilidades e conhecimentos.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={freelancerForm.control}
                        name="experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Experiência Profissional</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descreva sua experiência profissional, cargos anteriores, etc." 
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Detalhes sobre sua experiência profissional relevante.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={freelancerForm.control}
                        name="education"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Formação Acadêmica</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descreva sua formação acadêmica, cursos, certificações, etc." 
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Informações sobre sua formação acadêmica, cursos e certificações.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={updateFreelancerProfileMutation.isPending}
                      >
                        {updateFreelancerProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : "Salvar Perfil Profissional"}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}