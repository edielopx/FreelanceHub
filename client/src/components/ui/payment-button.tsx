import { useState } from "react";
import { useLocation } from "wouter";
import { Button, ButtonProps } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";

interface PaymentButtonProps extends ButtonProps {
  serviceId: number;
  serviceType: "service" | "job" | "appointment";
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * Botão para iniciar o processo de pagamento
 * Este componente redireciona para a página de checkout com os parâmetros necessários
 */
export function PaymentButton({
  serviceId,
  serviceType,
  disabled = false,
  children,
  ...props
}: PaymentButtonProps) {
  const [, navigate] = useLocation();
  const [isPending, setIsPending] = useState(false);

  const handlePaymentClick = () => {
    setIsPending(true);
    // Redirecionar para a página de checkout com o ID e tipo do serviço
    navigate(`/checkout/${serviceType}/${serviceId}`);
  };

  return (
    <Button
      onClick={handlePaymentClick}
      disabled={disabled || isPending}
      {...props}
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="mr-2 h-4 w-4" />
      )}
      {isPending ? "Processando..." : children || "Pagar"}
    </Button>
  );
}