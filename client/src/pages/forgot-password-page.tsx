import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Copy, ExternalLink } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Digite um email válido"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [emailSent, setEmailSent] = useState(false);
  const [resetInfo, setResetInfo] = useState<{ resetToken?: string; resetUrl?: string }>({});

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (values: ForgotPasswordFormValues) => {
      const response = await apiRequest("POST", "/api/forgot-password", values);
      return response.json();
    },
    onSuccess: (data) => {
      setEmailSent(true);
      
      // Em ambiente de desenvolvimento, capturamos o token e URL de recuperação
      if (data.debug) {
        setResetInfo({
          resetToken: data.debug.resetToken,
          resetUrl: data.debug.resetUrl
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: ForgotPasswordFormValues) {
    forgotPasswordMutation.mutate(values);
  }

  return (
    <div className="flex h-screen">
      {/* Lado esquerdo - Formulário */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Recuperação de Senha</h1>
            <p className="text-gray-500 mt-2">
              Digite seu email para receber instruções de recuperação de senha
            </p>
          </div>

          {emailSent ? (
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h2 className="text-xl font-semibold text-green-700 mb-2">Email enviado!</h2>
              <p className="text-green-600 mb-4">
                Se esse email estiver cadastrado em nosso sistema, você receberá instruções para redefinir sua senha.
                Por favor, verifique sua caixa de entrada e pasta de spam.
              </p>
              
              {resetInfo.resetToken && (
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <div className="mb-2">
                    <h3 className="font-medium text-blue-800">Modo de Desenvolvimento</h3>
                    <AlertDescription className="text-blue-700 text-sm mt-1">
                      Uma vez que o envio de email não está funcionando, use as informações abaixo para redefinir sua senha:
                    </AlertDescription>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between bg-white p-2 rounded border border-blue-200">
                      <div className="text-sm font-mono text-gray-700 truncate flex-1 mr-2">
                        {resetInfo.resetToken}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 px-2"
                        onClick={() => {
                          navigator.clipboard.writeText(resetInfo.resetToken || '');
                          toast({
                            title: "Copiado!",
                            description: "Token copiado para o clipboard",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <a
                        href={resetInfo.resetUrl}
                        className="text-blue-600 hover:underline text-sm flex items-center"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span>Abrir link de redefinição</span>
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 px-2"
                        onClick={() => {
                          navigator.clipboard.writeText(resetInfo.resetUrl || '');
                          toast({
                            title: "Copiado!",
                            description: "URL copiada para o clipboard",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Alert>
              )}
              
              <Button 
                className="w-full mt-4" 
                variant="outline"
                onClick={() => window.location.href = "/auth"}
              >
                Voltar para o login
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="seu-email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Enviando...
                    </div>
                  ) : (
                    "Enviar instruções por email"
                  )}
                </Button>

                <div className="text-center mt-4">
                  <a
                    href="/auth"
                    className="text-blue-600 hover:underline text-sm font-medium"
                  >
                    Voltar para o login
                  </a>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>

      {/* Lado direito - Hero */}
      <div
        className="hidden md:flex md:w-1/2 bg-blue-600 text-white p-12 flex-col justify-center"
        style={{
          background:
            "linear-gradient(to right, #3b82f6, #2563eb)",
        }}
      >
        <div>
          <h2 className="text-4xl font-bold mb-4">FreelanceHub</h2>
          <p className="text-xl mb-8">
            Conectando freelancers e clientes através de uma plataforma geolocalizada e intuitiva.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Encontre freelancers próximos a você
            </li>
            <li className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Agende serviços com facilidade
            </li>
            <li className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Comunique-se diretamente com profissionais
            </li>
            <li className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Pagamentos seguros e práticos
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}