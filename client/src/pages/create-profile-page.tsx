import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Category } from "@shared/schema";

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
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

// Schema para validação do formulário
const profileFormSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  category: z.string().min(1, "Por favor, selecione uma categoria"),
  hourlyRate: z.coerce.number().min(1, "A taxa horária deve ser maior que 0"),
  skills: z.array(z.string()).min(1, "Adicione pelo menos uma habilidade"),
  experience: z.string().optional(),
  education: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Opções de habilidades pré-definidas por categoria
const skillsByCategory: Record<string, Option[]> = {
  development: [
    { label: "JavaScript", value: "javascript" },
    { label: "React", value: "react" },
    { label: "Node.js", value: "nodejs" },
    { label: "TypeScript", value: "typescript" },
    { label: "Python", value: "python" },
    { label: "Java", value: "java" },
    { label: "PHP", value: "php" },
    { label: "C#", value: "csharp" },
    { label: "Flutter", value: "flutter" },
    { label: "Mobile", value: "mobile" },
  ],
  design: [
    { label: "UI/UX", value: "uiux" },
    { label: "Figma", value: "figma" },
    { label: "Adobe XD", value: "adobexd" },
    { label: "Photoshop", value: "photoshop" },
    { label: "Illustrator", value: "illustrator" },
    { label: "Branding", value: "branding" },
    { label: "Logo Design", value: "logodesign" },
  ],
  marketing: [
    { label: "Social Media", value: "socialmedia" },
    { label: "SEO", value: "seo" },
    { label: "Content Writing", value: "contentwriting" },
    { label: "Email Marketing", value: "emailmarketing" },
    { label: "PPC", value: "ppc" },
    { label: "Analytics", value: "analytics" },
  ],
  writing: [
    { label: "Copywriting", value: "copywriting" },
    { label: "Blog Writing", value: "blogwriting" },
    { label: "Technical Writing", value: "technicalwriting" },
    { label: "Editing", value: "editing" },
    { label: "Proofreading", value: "proofreading" },
  ],
  photography: [
    { label: "Portrait", value: "portrait" },
    { label: "Product", value: "product" },
    { label: "Event", value: "event" },
    { label: "Real Estate", value: "realestate" },
    { label: "Food Photography", value: "foodphotography" },
  ],
  video: [
    { label: "Editing", value: "videoediting" },
    { label: "Animation", value: "animation" },
    { label: "Motion Graphics", value: "motiongraphics" },
    { label: "VFX", value: "vfx" },
    { label: "Videography", value: "videography" },
  ],
  audio: [
    { label: "Voice Over", value: "voiceover" },
    { label: "Sound Design", value: "sounddesign" },
    { label: "Music Production", value: "musicproduction" },
    { label: "Mixing", value: "mixing" },
    { label: "Mastering", value: "mastering" },
  ],
  translation: [
    { label: "Portuguese-English", value: "pten" },
    { label: "English-Portuguese", value: "enpt" },
    { label: "Spanish", value: "spanish" },
    { label: "French", value: "french" },
    { label: "German", value: "german" },
    { label: "Italian", value: "italian" },
  ],
  legal: [
    { label: "Contracts", value: "contracts" },
    { label: "Legal Advice", value: "legaladvice" },
    { label: "Documentation", value: "legaldocs" },
    { label: "Legal Research", value: "legalresearch" },
  ],
  finance: [
    { label: "Accounting", value: "accounting" },
    { label: "Tax", value: "tax" },
    { label: "Financial Analysis", value: "financialanalysis" },
    { label: "Budgeting", value: "budgeting" },
    { label: "Investment", value: "investment" },
  ],
  admin: [
    { label: "Data Entry", value: "dataentry" },
    { label: "Virtual Assistant", value: "virtualassistant" },
    { label: "Customer Service", value: "customerservice" },
    { label: "Project Management", value: "projectmanagement" },
    { label: "Scheduling", value: "scheduling" },
  ],
  other: [
    { label: "Consultoria", value: "consulting" },
    { label: "Formação", value: "training" },
    { label: "Mentoria", value: "mentoring" },
    { label: "Pesquisa", value: "research" },
  ],
};

export default function CreateProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [availableSkills, setAvailableSkills] = useState<Option[]>([]);

  // Inicializar formulário
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      title: "",
      category: "",
      hourlyRate: 50,
      skills: [],
      experience: "",
      education: "",
    },
  });

  // Mutation para criar perfil
  const createProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user) throw new Error("Usuário não autenticado");
      
      const data = {
        ...values,
        userId: user.id,
      };
      
      const res = await apiRequest("POST", "/api/profiles", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao criar perfil");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil criado com sucesso!",
        description: "Seu perfil profissional foi criado e já está disponível para potenciais clientes.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      navigate("/profile");
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Função para atualizar habilidades disponíveis com base na categoria selecionada
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    form.setValue("category", category);
    form.setValue("skills", []);
    
    // Atualizar lista de habilidades disponíveis
    setAvailableSkills(skillsByCategory[category] || []);
  };

  // Função para lidar com a submissão do formulário
  const onSubmit = (values: ProfileFormValues) => {
    createProfileMutation.mutate(values);
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Criar Perfil Profissional</h1>
      <p className="text-muted-foreground mb-8">
        Complete as informações abaixo para criar seu perfil como freelancer e começar a receber propostas.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Informações Profissionais</CardTitle>
          <CardDescription>
            Estas informações serão exibidas para potenciais clientes que buscam seus serviços.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Título Profissional */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título Profissional</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Desenvolvedor Full Stack" {...field} />
                    </FormControl>
                    <FormDescription>
                      Um título conciso que descreva sua especialidade principal.
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
                      onValueChange={handleCategoryChange}
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
                      Selecione a categoria que melhor representa seus serviços.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Taxa Horária */}
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa Horária (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormDescription>
                      Quanto você cobra por hora de trabalho.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Habilidades */}
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Habilidades</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={availableSkills}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder={selectedCategory ? "Selecione suas habilidades" : "Primeiro selecione uma categoria"}
                        disabled={!selectedCategory}
                        createOption={true}
                      />
                    </FormControl>
                    <FormDescription>
                      Selecione suas principais habilidades ou adicione novas digitando e pressionando Enter.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Experiência */}
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experiência Profissional</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva sua experiência profissional, empresas onde trabalhou, projetos relevantes..."
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Formação */}
              <FormField
                control={form.control}
                name="education"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formação Acadêmica</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva sua formação acadêmica, cursos, certificações..."
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="mr-2"
                  onClick={() => navigate("/profile")}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createProfileMutation.isPending}
                >
                  {createProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Perfil"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}