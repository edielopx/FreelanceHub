import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  User, Calendar, MapPin, Tag, DollarSign, 
  Clock, Send, ArrowLeft, Briefcase, Check, X,
  Trash2
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PaymentButton } from "@/components/ui/payment-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Sidebar } from "@/components/layout/sidebar";

// Interfaces
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

interface Proposal {
  id: number;
  jobId: number;
  freelancerId: number;
  price: number;
  proposal: string;
  timeframe: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  freelancerName?: string;
  freelancerProfile?: {
    title: string;
    hourlyRate: number;
    skills: string[];
  };
}

// Componente principal
export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [proposalText, setProposalText] = useState("");
  const [price, setPrice] = useState("");
  const [timeframe, setTimeframe] = useState("");

  // Mutação para excluir trabalho - Movido para aqui para garantir ordem consistente dos hooks
  const deleteJobMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/jobs/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Trabalho excluído",
        description: "O trabalho foi excluído com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/jobs"] });
      navigate("/jobs");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir trabalho",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Buscar detalhes do trabalho
  const { data: job, isLoading, error } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch job details");
      }
      return response.json();
    }
  });

  // Buscar propostas para o trabalho (apenas para o cliente dono do job)
  const { data: proposals = [] } = useQuery<Proposal[]>({
    queryKey: ["/api/jobs", jobId, "proposals"],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${jobId}/proposals`);
      if (!response.ok) {
        throw new Error("Failed to fetch proposals");
      }
      return response.json();
    },
    enabled: !!job && user?.userType === "client" && job.clientId === user.id
  });

  // Verificar se o usuário freelancer já enviou uma proposta
  const { data: myProposals = [] } = useQuery<Proposal[]>({
    queryKey: ["/api/freelancer/proposals"],
    queryFn: async () => {
      const response = await fetch("/api/freelancer/proposals");
      if (!response.ok) {
        throw new Error("Failed to fetch your proposals");
      }
      return response.json();
    },
    enabled: !!user && user.userType === "freelancer"
  });

  const hasSubmittedProposal = myProposals.some(p => p.jobId === jobId);

  // Mutação para enviar uma proposta
  const proposalMutation = useMutation({
    mutationFn: async (data: { jobId: number; price: number; proposal: string; timeframe: string }) => {
      const res = await apiRequest("POST", "/api/proposals", data);
      return res.json();
    },
    onSuccess: () => {
      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ["/api/freelancer/proposals"] });
      
      // Invalidar consulta do trabalho específico para atualizar a contagem de propostas
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId] });
      
      toast({
        title: "Proposta enviada com sucesso",
        description: "Sua proposta foi enviada ao cliente para análise.",
        variant: "default",
      });
      setProposalText("");
      setPrice("");
      setTimeframe("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar proposta",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para aceitar uma proposta
  const acceptProposalMutation = useMutation({
    mutationFn: async (proposalId: number) => {
      const res = await apiRequest("PATCH", `/api/proposals/${proposalId}/status`, { status: "accepted" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId, "proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId] });
      toast({
        title: "Proposta aceita",
        description: "Você aceitou esta proposta. O trabalho agora está em andamento.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao aceitar proposta",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para rejeitar uma proposta
  const rejectProposalMutation = useMutation({
    mutationFn: async (proposalId: number) => {
      const res = await apiRequest("PATCH", `/api/proposals/${proposalId}/status`, { status: "rejected" });
      return res.json();
    },
    onSuccess: () => {
      // Invalidar as consultas relacionadas para garantir que os dados estejam atualizados
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId, "proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId] }); // Para atualizar a contagem de propostas
      toast({
        title: "Proposta rejeitada",
        description: "Você rejeitou esta proposta.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao rejeitar proposta",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Controle do envio do formulário de proposta
  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!proposalText || !price || !timeframe) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos da proposta.",
        variant: "destructive",
      });
      return;
    }
    
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor válido para sua proposta.",
        variant: "destructive",
      });
      return;
    }
    
    proposalMutation.mutate({
      jobId,
      price: priceValue,
      proposal: proposalText,
      timeframe
    });
  };

  // Função para excluir trabalho
  const handleDeleteJob = () => {
    if (confirm("Tem certeza que deseja excluir este trabalho? Esta ação não pode ser desfeita.")) {
      deleteJobMutation.mutate();
    }
  };

  // Funções para formatar valores
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Status badge
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

  // Estados de carregamento e erro
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </main>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Trabalho não encontrado</h1>
            <p className="text-muted-foreground mb-6">O trabalho que você está procurando não foi encontrado ou foi removido.</p>
            <Button asChild>
              <Link href="/jobs">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Trabalhos
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Verificar se o usuário é o proprietário deste trabalho
  const isOwner = user?.id === job.clientId;
  const isClosed = job.status !== "open";
  const showProposalForm = user?.userType === "freelancer" && job.status === "open" && !hasSubmittedProposal;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          {/* Botão voltar e título da página */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/jobs">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Trabalhos
                </Link>
              </Button>
              
              {isOwner && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDeleteJob}
                  disabled={deleteJobMutation.isPending}
                >
                  {deleteJobMutation.isPending ? "Excluindo..." : "Excluir Trabalho"}
                </Button>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
                <div className="flex items-center mt-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{job.location}</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {getStatusBadge(job.status)}
                {job.proposalCount !== undefined && (
                  <Badge variant="secondary">
                    {job.proposalCount} {job.proposalCount === 1 ? 'proposta' : 'propostas'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Coluna da esquerda: detalhes do trabalho */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes do Trabalho</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-line">{job.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="flex items-center">
                      <Tag className="h-5 w-5 mr-3 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Categoria</p>
                        <p className="font-medium">{job.category}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-3 text-emerald-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Orçamento</p>
                        <p className="font-medium text-emerald-700">
                          {formatCurrency(job.budget)}
                        </p>
                      </div>
                    </div>
                    
                    {job.deadline && (
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 mr-3 text-orange-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Data Limite</p>
                          <p className="font-medium">{formatDate(job.deadline)}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Publicado em</p>
                        <p>{formatDate(job.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Formulário de proposta para freelancers */}
              {showProposalForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>Enviar Proposta</CardTitle>
                    <CardDescription>
                      Apresente sua proposta para este trabalho
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitProposal} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Seu Valor</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              id="price"
                              type="number"
                              placeholder="0,00"
                              min="0"
                              step="0.01"
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                              className="pl-9"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="timeframe">Prazo de Entrega</Label>
                          <Input
                            id="timeframe"
                            placeholder="Ex: 2 semanas"
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="proposal">Descrição da Proposta</Label>
                        <Textarea
                          id="proposal"
                          placeholder="Descreva sua proposta em detalhes..."
                          value={proposalText}
                          onChange={(e) => setProposalText(e.target.value)}
                          rows={5}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={proposalMutation.isPending}
                      >
                        {proposalMutation.isPending ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></div>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Enviar Proposta
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
              
              {/* Mensagem para propostas já enviadas */}
              {user?.userType === "freelancer" && hasSubmittedProposal && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center p-4 bg-muted/50 rounded-lg">
                      <Check className="h-6 w-6 text-green-600 mr-3" />
                      <div>
                        <h3 className="font-medium">Proposta Enviada</h3>
                        <p className="text-sm text-muted-foreground">
                          Você já enviou uma proposta para este trabalho. Aguarde o retorno do cliente.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Mensagem para trabalhos fechados */}
              {user?.userType === "freelancer" && isClosed && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center p-4 bg-muted/50 rounded-lg">
                      <X className="h-6 w-6 text-orange-600 mr-3" />
                      <div>
                        <h3 className="font-medium">Trabalho {job.status === "closed" ? "Fechado" : "Em Andamento"}</h3>
                        <p className="text-sm text-muted-foreground">
                          Este trabalho não está mais aceitando propostas.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Lista de propostas (apenas para o dono do trabalho) */}
              {isOwner && (
                <Card>
                  <CardHeader>
                    <CardTitle>Propostas Recebidas</CardTitle>
                    <CardDescription>
                      {proposals.length} {proposals.length === 1 ? "proposta recebida" : "propostas recebidas"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {proposals.length === 0 ? (
                      <div className="text-center p-6 bg-muted/30 rounded-lg">
                        <Briefcase className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-medium mb-1">Sem propostas ainda</h3>
                        <p className="text-sm text-muted-foreground">
                          Ainda não há propostas para este trabalho.
                        </p>
                      </div>
                    ) : (
                      <Tabs defaultValue="pending">
                        <TabsList className="mb-4">
                          <TabsTrigger value="pending">Pendentes</TabsTrigger>
                          <TabsTrigger value="accepted">Aceitas</TabsTrigger>
                          <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="pending" className="space-y-4">
                          {proposals.filter(p => p.status === "pending").length === 0 ? (
                            <div className="text-center p-6 bg-muted/30 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                Nenhuma proposta pendente.
                              </p>
                            </div>
                          ) : (
                            proposals
                              .filter(p => p.status === "pending")
                              .map(proposal => (
                                <ProposalCard 
                                  key={proposal.id} 
                                  proposal={proposal} 
                                  onAccept={() => acceptProposalMutation.mutate(proposal.id)}
                                  onReject={() => rejectProposalMutation.mutate(proposal.id)}
                                  isPending={acceptProposalMutation.isPending || rejectProposalMutation.isPending}
                                />
                              ))
                          )}
                        </TabsContent>
                        
                        <TabsContent value="accepted" className="space-y-4">
                          {proposals.filter(p => p.status === "accepted").length === 0 ? (
                            <div className="text-center p-6 bg-muted/30 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                Nenhuma proposta aceita.
                              </p>
                            </div>
                          ) : (
                            proposals
                              .filter(p => p.status === "accepted")
                              .map(proposal => (
                                <ProposalCard 
                                  key={proposal.id} 
                                  proposal={proposal} 
                                  showPayment={job.status !== "completed"}
                                  jobDetail={job}
                                />
                              ))
                          )}
                        </TabsContent>
                        
                        <TabsContent value="rejected" className="space-y-4">
                          {proposals.filter(p => p.status === "rejected").length === 0 ? (
                            <div className="text-center p-6 bg-muted/30 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                Nenhuma proposta rejeitada.
                              </p>
                            </div>
                          ) : (
                            proposals
                              .filter(p => p.status === "rejected")
                              .map(proposal => (
                                <ProposalCard 
                                  key={proposal.id} 
                                  proposal={proposal} 
                                />
                              ))
                          )}
                        </TabsContent>
                      </Tabs>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Coluna da direita: info do cliente e detalhes adicionais */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{job.clientName}</h3>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                    </div>
                  </div>
                  {job.contactInfo && isOwner && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-1">Informações de Contato:</h4>
                      <p className="text-sm text-muted-foreground">{job.contactInfo}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProposalCard({ 
  proposal, 
  onAccept, 
  onReject, 
  isPending,
  showPayment,
  jobDetail
}: { 
  proposal: Proposal; 
  onAccept?: () => void; 
  onReject?: () => void;
  isPending?: boolean;
  showPayment?: boolean;
  jobDetail?: Job;
}) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aceita</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejeitada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{proposal.freelancerName}</h3>
              {getStatusBadge(proposal.status)}
            </div>
            {proposal.freelancerProfile && (
              <p className="text-sm text-muted-foreground mt-1">
                {proposal.freelancerProfile.title}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-emerald-600">
              {formatCurrency(proposal.price)}
            </div>
            <div className="text-sm text-muted-foreground">
              {proposal.timeframe}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm whitespace-pre-line mb-4">
          {proposal.proposal}
        </p>
        
        {proposal.freelancerProfile?.skills && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1 mt-2">
              {proposal.freelancerProfile.skills.map((skill, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground mt-2">
          Proposta enviada em {formatDate(proposal.createdAt)}
        </div>
      </CardContent>
      
      {(onAccept || onReject) && (
        <CardFooter className="flex justify-end gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onReject}
            disabled={isPending}
          >
            <X className="mr-1 h-4 w-4" />
            Rejeitar
          </Button>
          <Button 
            size="sm" 
            onClick={onAccept}
            disabled={isPending}
          >
            <Check className="mr-1 h-4 w-4" />
            Aceitar
          </Button>
        </CardFooter>
      )}
      
      {/* Botão de pagamento para propostas aceitas */}
      {showPayment && proposal.status === "accepted" && jobDetail && (
        <CardFooter className="pt-2">
          <PaymentButton 
            amount={proposal.price} 
            freelancerId={proposal.freelancerId} 
            jobId={proposal.jobId}
            jobTitle={jobDetail.title}
            proposalId={proposal.id}
          />
        </CardFooter>
      )}
    </Card>
  );
}