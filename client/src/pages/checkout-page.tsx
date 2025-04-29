import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";

// Carregar Stripe fora do componente para evitar múltiplas instâncias
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Chave pública do Stripe não configurada: VITE_STRIPE_PUBLIC_KEY");
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Formulário de checkout do Stripe
function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Erro no pagamento",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      toast({
        title: "Pagamento processado com sucesso",
        description: "Seu pagamento foi processado e o serviço foi contratado.",
      });
      // Redirecionar para a página inicial após pagamento bem-sucedido
      setTimeout(() => navigate("/"), 2000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          "Efetuar Pagamento"
        )}
      </Button>
    </form>
  );
}

// Componente principal da página de checkout
export default function CheckoutPage() {
  const { type, id } = useParams<{ type: string; id: string }>;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [serviceDetails, setServiceDetails] = useState<{
    title: string;
    price: number;
    description?: string;
  } | null>(null);

  // Buscar detalhes do serviço
  const { isLoading: isLoadingService } = useQuery({
    queryKey: [type, id],
    queryFn: async () => {
      try {
        // Buscar detalhes do serviço com base no tipo
        let endpoint = "";
        if (type === "service") {
          endpoint = `/api/services/${id}`;
        } else if (type === "job") {
          endpoint = `/api/jobs/${id}`;
        } else if (type === "appointment") {
          endpoint = `/api/appointments/${id}`;
        } else {
          throw new Error("Tipo de serviço inválido");
        }

        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error("Falha ao buscar detalhes do serviço");
        }
        
        const data = await response.json();
        
        // Verificar tipo de serviço e obter dados relevantes
        if (type === "service") {
          setServiceDetails({
            title: data.title,
            price: data.price || data.hourlyRate,
            description: data.description,
          });
        } else if (type === "job") {
          // Para jobs, precisamos encontrar a proposta aceita
          const proposalsResponse = await fetch(`/api/jobs/${id}/proposals`);
          const proposals = await proposalsResponse.json();
          const acceptedProposal = proposals.find((p: any) => p.status === "accepted");
          
          if (acceptedProposal) {
            setServiceDetails({
              title: data.title,
              price: acceptedProposal.price,
              description: data.description,
            });
          } else {
            setServiceDetails({
              title: data.title,
              price: data.budget,
              description: data.description,
            });
          }
        } else if (type === "appointment") {
          const serviceResponse = await fetch(`/api/services/${data.serviceId}`);
          const serviceData = await serviceResponse.json();
          
          setServiceDetails({
            title: serviceData.title,
            price: serviceData.price || serviceData.hourlyRate,
            description: `Agendamento para ${new Date(data.appointmentDate).toLocaleDateString('pt-BR')}`,
          });
        }
        
        return data;
      } catch (error: any) {
        toast({
          title: "Erro ao carregar serviço",
          description: error.message,
          variant: "destructive",
        });
        navigate("/");
        return null;
      }
    },
  });

  // Criar intenção de pagamento no servidor
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!serviceDetails) return;
      
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", {
          amount: serviceDetails.price,
          serviceType: type,
          serviceId: parseInt(id),
        });
        
        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
      } catch (error: any) {
        toast({
          title: "Erro ao iniciar pagamento",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    if (serviceDetails) {
      createPaymentIntent();
    }
  }, [serviceDetails, id, type, toast]);

  // Formatar valor como moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Estado de carregamento
  if (isLoadingService || !serviceDetails) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-2xl mx-auto">
          {/* Botão voltar */}
          <Button variant="ghost" size="sm" className="mb-6" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>

          <h1 className="text-3xl font-bold tracking-tight mb-6">Checkout</h1>

          {/* Resumo do serviço */}
          <div className="bg-muted/30 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">Resumo do Serviço</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Serviço</p>
                <p className="font-medium">{serviceDetails.title}</p>
              </div>
              
              {serviceDetails.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="text-sm">{serviceDetails.description}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="font-medium text-emerald-700">{formatCurrency(serviceDetails.price)}</p>
              </div>
            </div>
          </div>

          {/* Formulário de pagamento do Stripe */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-6">Dados de Pagamento</h2>
            
            {clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm />
              </Elements>
            ) : (
              <div className="flex justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}