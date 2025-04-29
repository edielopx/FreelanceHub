import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Briefcase,
  FilePlus,
  Star,
  Calendar,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Award,
  BarChart3,
  Wallet,
  FileText,
} from "lucide-react";
import { Job, Proposal, FreelancerProfile, Service } from "@shared/schema";

// Componente principal do dashboard de freelancer
export default function FreelancerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    proposals: 0,
    activeJobs: 0,
    completedJobs: 0,
    pendingPayments: 0,
    services: 0,
    averageRating: 0,
    totalEarnings: 0,
  });

  // Busca o perfil do freelancer
  const { data: profile } = useQuery<FreelancerProfile>({
    queryKey: ["/api/freelancer-profile"],
    queryFn: async () => {
      const res = await fetch("/api/freelancer-profile");
      if (!res.ok) {
        throw new Error("Falha ao carregar o perfil");
      }
      return res.json();
    },
    enabled: !!user,
  });

  // Busca os trabalhos disponíveis
  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs", { status: "open" }],
    queryFn: async () => {
      const res = await fetch("/api/jobs?status=open");
      if (!res.ok) {
        throw new Error("Falha ao carregar trabalhos");
      }
      return res.json();
    },
    enabled: !!user,
  });

  // Busca as propostas do freelancer
  const { data: proposals = [] } = useQuery<Proposal[]>({
    queryKey: ["/api/proposals/freelancer"],
    queryFn: async () => {
      const res = await fetch("/api/proposals/freelancer");
      if (!res.ok) {
        throw new Error("Falha ao carregar propostas");
      }
      return res.json();
    },
    enabled: !!user,
  });

  // Busca os serviços do freelancer
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services/freelancer", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const res = await fetch(`/api/services/freelancer/${profile.id}`);
      if (!res.ok) {
        throw new Error("Falha ao carregar serviços");
      }
      return res.json();
    },
    enabled: !!profile?.id,
  });

  // Atualizar estatísticas
  useEffect(() => {
    if (proposals && services) {
      setStats({
        proposals: proposals.length,
        activeJobs: proposals.filter(p => p.status === "accepted").length,
        completedJobs: proposals.filter(p => p.status === "accepted" && p.status === "completed").length,
        pendingPayments: 0, // Implementar depois
        services: services.length,
        averageRating: profile?.rating || 0,
        totalEarnings: calculateTotalEarnings(proposals),
      });
    }
  }, [proposals, services, profile]);

  // Função para calcular ganhos totais
  const calculateTotalEarnings = (proposals: Proposal[]) => {
    return proposals
      .filter(p => p.status === "accepted")
      .reduce((sum, p) => sum + p.price, 0);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Olá, {user?.name}</h1>
            <p className="text-muted-foreground">
              Bem-vindo ao seu painel de controle. Gerencie seus serviços, propostas e agendamentos.
            </p>
          </div>

          {/* Cartões de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total de Ganhos"
              value={`R$ ${stats.totalEarnings.toFixed(2)}`}
              icon={<Wallet className="h-5 w-5" />}
              description="Valor total recebido"
              className="bg-green-50 border-green-100"
            />
            <StatCard
              title="Avaliação Média"
              value={stats.averageRating.toFixed(1)}
              icon={<Star className="h-5 w-5 text-yellow-500" />}
              description="Baseado em avaliações de clientes"
              className="bg-yellow-50 border-yellow-100"
            />
            <StatCard
              title="Projetos Ativos"
              value={stats.activeJobs.toString()}
              icon={<Briefcase className="h-5 w-5" />}
              description="Trabalhos em andamento"
              className="bg-blue-50 border-blue-100"
            />
            <StatCard
              title="Propostas Enviadas"
              value={stats.proposals.toString()}
              icon={<FileText className="h-5 w-5" />}
              description="Total de propostas enviadas"
              className="bg-purple-50 border-purple-100"
            />
          </div>

          {/* Seções principais */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Oportunidades recentes */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Oportunidades Recentes</CardTitle>
                  <Link href="/jobs">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 text-sm">
                      Ver todas <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <CardDescription>Trabalhos disponíveis que correspondem ao seu perfil</CardDescription>
              </CardHeader>
              <CardContent className="px-6">
                {jobs.length > 0 ? (
                  <div className="space-y-4">
                    {jobs.slice(0, 3).map((job) => (
                      <div key={job.id} className="flex items-start p-3 border rounded-lg hover:bg-gray-50">
                        <Briefcase className="h-9 w-9 p-2 rounded-md bg-blue-100 text-blue-700 mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-base truncate">{job.title}</h4>
                            <Badge variant="outline" className="ml-2 flex-shrink-0">
                              R$ {job.budget}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {job.description}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-muted-foreground">
                            <span className="inline-block truncate max-w-[120px]">{job.location}</span>
                            <span className="mx-2">•</span>
                            <span>Publicado {formatDate(job.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">Nenhuma oportunidade disponível no momento.</p>
                    <Link href="/jobs">
                      <Button variant="outline" className="mt-3">
                        Explorar todos os trabalhos
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Atalhos para tarefas comuns</CardDescription>
              </CardHeader>
              <CardContent className="px-6">
                <div className="space-y-2">
                  <ActionButton
                    href="/services/new"
                    icon={<FilePlus className="h-5 w-5" />}
                    label="Adicionar Novo Serviço"
                  />
                  <ActionButton
                    href="/jobs"
                    icon={<Briefcase className="h-5 w-5" />}
                    label="Procurar Oportunidades"
                  />
                  <ActionButton
                    href="/appointments"
                    icon={<Calendar className="h-5 w-5" />}
                    label="Ver Agendamentos"
                  />
                  <ActionButton
                    href="/messages"
                    icon={<MessageSquare className="h-5 w-5" />}
                    label="Mensagens"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Suas Propostas */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Suas Propostas</CardTitle>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1 text-sm">
                    Ver todas <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>Acompanhe o status das suas propostas enviadas</CardDescription>
              </CardHeader>
              <CardContent className="px-6">
                {proposals.length > 0 ? (
                  <div className="space-y-4">
                    {proposals.slice(0, 3).map((proposal) => (
                      <div key={proposal.id} className="flex items-start p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-base truncate">Proposta para Job #{proposal.jobId}</h4>
                            <Badge 
                              variant={getProposalStatusVariant(proposal.status)} 
                              className="ml-2 flex-shrink-0"
                            >
                              {getProposalStatusLabel(proposal.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {proposal.proposal.substring(0, 100)}...
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-medium">R$ {proposal.price}</span>
                            <span className="text-xs text-muted-foreground">
                              Enviada {formatDate(proposal.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">Você ainda não enviou nenhuma proposta.</p>
                    <Link href="/jobs">
                      <Button variant="outline" className="mt-3">
                        Encontrar trabalhos para propor
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seus Serviços */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Seus Serviços</CardTitle>
                  <Link href="/services">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 text-sm">
                      Ver todos <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <CardDescription>Serviços que você oferece</CardDescription>
              </CardHeader>
              <CardContent className="px-6">
                {services.length > 0 ? (
                  <div className="space-y-3">
                    {services.slice(0, 3).map((service) => (
                      <div key={service.id} className="p-3 border rounded-lg hover:bg-gray-50">
                        <h4 className="font-medium">{service.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {service.description}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm font-medium">R$ {service.price}</span>
                          <Link href={`/services/${service.id}`}>
                            <Button variant="ghost" size="sm">Editar</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">Você ainda não cadastrou nenhum serviço.</p>
                    <Link href="/services/new">
                      <Button variant="outline" className="mt-3">
                        Adicionar novo serviço
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

// Componentes auxiliares

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  className?: string;
}

function StatCard({ title, value, icon, description, className = "" }: StatCardProps) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="p-2 rounded-full bg-white shadow-sm">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ActionButtonProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

function ActionButton({ href, icon, label }: ActionButtonProps) {
  return (
    <Link href={href}>
      <Button 
        variant="outline" 
        className="w-full justify-start mb-2 bg-white hover:bg-gray-50"
      >
        <span className="p-1 rounded-md bg-primary/10 mr-2">{icon}</span>
        {label}
      </Button>
    </Link>
  );
}

// Funções utilitárias
function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  
  const d = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) {
    return "hoje";
  } else if (diffDays === 1) {
    return "ontem";
  } else if (diffDays < 7) {
    return `há ${diffDays} dias`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
  }
}

function getProposalStatusLabel(status: string): string {
  switch (status) {
    case "pending": return "Pendente";
    case "accepted": return "Aceita";
    case "rejected": return "Recusada";
    default: return status;
  }
}

function getProposalStatusVariant(status: string): "outline" | "secondary" | "destructive" {
  switch (status) {
    case "pending": return "outline";
    case "accepted": return "secondary";
    case "rejected": return "destructive";
    default: return "outline";
  }
}