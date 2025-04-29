import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar, Clock, DollarSign, Map, Search, Tag, Plus, Filter } from "lucide-react";
import { Loader2 } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { JobCardSkeleton } from "@/components/job/job-card-skeleton";

interface Job {
  id: number;
  title: string;
  description: string;
  category: string;
  budget: number;
  location: string;
  deadline?: Date;
  status: "open" | "closed" | "in_progress" | "completed";
  clientId: number;
  clientName: string;
  createdAt: Date;
  contactInfo?: string;
  proposalCount?: number;
}

export default function JobsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Get all jobs
  const { data: jobs, isLoading, error } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    queryFn: async () => {
      // Fetch the jobs data
      const response = await fetch("/api/jobs");
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      return response.json();
    }
  });

  // Get jobs posted by the current user (if they are a client)
  const { data: myJobs, isLoading: isLoadingMyJobs } = useQuery<Job[]>({
    queryKey: ["/api/client/jobs"],
    queryFn: async () => {
      // Only fetch if the user is a client
      if (user?.userType !== "client") {
        return [];
      }
      
      const response = await fetch("/api/client/jobs");
      if (!response.ok) {
        throw new Error("Failed to fetch your jobs");
      }
      return response.json();
    },
    enabled: user?.userType === "client"
  });

  // Caso haja erro ao carregar os dados
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar os trabalhos",
        description: "Não foi possível obter a lista de trabalhos disponíveis.",
      });
    }
  }, [error, toast]);

  // Filtrar os trabalhos com base nos critérios de busca
  const filteredJobs = jobs
    ? jobs.filter((job: Job) => {
        const matchesSearch = searchTerm === "" || 
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.location.toLowerCase().includes(searchTerm.toLowerCase());
          
        const matchesCategory = categoryFilter === "" || categoryFilter === "all" || job.category === categoryFilter;
        const matchesStatus = statusFilter === "" || statusFilter === "all" || job.status === statusFilter;
        
        return matchesSearch && matchesCategory && matchesStatus;
      })
    : [];

  // Função para formatar o valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para formatar a data
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  // Mapear status para um badge visual
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aberto</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Em Andamento</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Concluído</Badge>;
      case "closed":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Fechado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Componente para renderizar cada item de trabalho
  const renderJobCard = (job: Job) => (
    <Card className="mb-4 hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold">{job.title}</CardTitle>
            <CardDescription className="flex items-center mt-1 text-muted-foreground">
              <Map className="h-4 w-4 inline mr-1" />
              {job.location}
            </CardDescription>
          </div>
          {getStatusBadge(job.status)}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{job.description}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center">
            <Tag className="h-4 w-4 mr-2 text-primary" />
            <span>{job.category}</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-emerald-600" />
            <span className="font-medium text-emerald-700">{formatCurrency(job.budget)}</span>
          </div>
          {job.deadline && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-orange-600" />
              <span>Prazo: {formatDate(job.deadline)}</span>
            </div>
          )}
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">Postado em {formatDate(job.createdAt)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Por: {job.clientName}
          {job.proposalCount !== undefined && (
            <span className="ml-2">• {job.proposalCount} {job.proposalCount === 1 ? 'proposta' : 'propostas'}</span>
          )}
        </div>
        <Button variant="default" size="sm" asChild>
          <Link href={`/jobs/${job.id}`}>Ver Detalhes</Link>
        </Button>
      </CardFooter>
    </Card>
  );

  // Renderizar os componentes do próprio usuário como cliente
  const renderMyJobsSection = () => {
    if (user?.userType !== "client") return null;
    
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Meus Trabalhos Publicados</h2>
          <Button asChild>
            <Link href="/create-job">
              <Plus className="mr-2 h-4 w-4" />
              Publicar Trabalho
            </Link>
          </Button>
        </div>
        
        {isLoadingMyJobs ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            {Array.from({ length: 2 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : myJobs && myJobs.length > 0 ? (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            {myJobs.map((job, index) => (
              <div key={job.id} 
                   className="animate-in fade-in-50 duration-300"
                   style={{ animationDelay: `${index * 75}ms` }}>
                {renderJobCard(job)}
              </div>
            ))}
          </div>
        ) : (
          <Card className="bg-muted/30">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-8">
              <p className="text-muted-foreground mb-4">
                Você não publicou nenhum trabalho ainda.
              </p>
              <Button asChild>
                <Link href="/create-job">
                  <Plus className="mr-2 h-4 w-4" />
                  Publicar seu primeiro trabalho
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
        
        <Separator className="my-8" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-6 pt-4 md:p-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-4 md:mb-0">Trabalhos Disponíveis</h1>
            
            {user?.userType === "client" && (
              <Button asChild className="w-full md:w-auto">
                <Link href="/create-job">
                  <Plus className="mr-2 h-4 w-4" />
                  Publicar Trabalho
                </Link>
              </Button>
            )}
          </div>

          {/* Seção de meus trabalhos (apenas para clientes) */}
          {renderMyJobsSection()}

          {/* Filtros e busca */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar trabalhos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas categorias</SelectItem>
                    <SelectItem value="development">Desenvolvimento</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="writing">Escrita</SelectItem>
                    <SelectItem value="translation">Tradução</SelectItem>
                    <SelectItem value="legal">Jurídico</SelectItem>
                    <SelectItem value="admin">Administrativo</SelectItem>
                    <SelectItem value="finance">Finanças</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos status</SelectItem>
                    <SelectItem value="open">Abertos</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluídos</SelectItem>
                    <SelectItem value="closed">Fechados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Lista de trabalhos */}
          {isLoading ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              {Array.from({ length: 4 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              {filteredJobs.map((job: Job, index) => (
                <div key={job.id} 
                     className="animate-in fade-in-50 duration-300"
                     style={{ animationDelay: `${index * 75}ms` }}>
                  {renderJobCard(job)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-10 bg-muted/30 rounded-lg">
              <Filter className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum trabalho encontrado</h3>
              <p className="text-muted-foreground mb-6">
                Não foram encontrados trabalhos com os filtros aplicados.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setStatusFilter("all");
                }}
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}