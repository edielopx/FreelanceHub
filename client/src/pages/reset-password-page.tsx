import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Extrair o token da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  // Verificar se o token é válido
  const tokenQuery = useQuery({
    queryKey: ["/api/reset-password", token],
    queryFn: async () => {
      if (!token) return null;
      const response = await apiRequest("GET", `/api/reset-password/${token}`);
      return response.json();
    },
    enabled: !!token,
  });

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (values: { password: string }) => {
      const response = await apiRequest("POST", "/api/reset-password", {
        token,
        password: values.password,
      });
      return response.json();
    },
    onSuccess: () => {
      setResetSuccess(true);
      setTimeout(() => {
        setLocation("/auth");
      }, 3000);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao redefinir sua senha",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: ResetPasswordFormValues) {
    resetPasswordMutation.mutate({ password: values.password });
  }

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Token inválido</AlertTitle>
          <AlertDescription>
            O token de redefinição de senha é inválido ou está ausente.
            Por favor, solicite um novo link de redefinição de senha.
          </AlertDescription>
          <Button 
            className="w-full mt-4" 
            variant="outline"
            onClick={() => setLocation("/forgot-password")}
          >
            Voltar para recuperação de senha
          </Button>
        </Alert>
      </div>
    );
  }

  // Verificando se o token é válido
  if (tokenQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Verificando token...</span>
      </div>
    );
  }

  // Token inválido ou expirado
  if (tokenQuery.isError || !tokenQuery.data || tokenQuery.data.error) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Token inválido ou expirado</AlertTitle>
          <AlertDescription>
            {tokenQuery.isError
              ? "Ocorreu um erro ao verificar o token."
              : tokenQuery.data?.error || "O token de redefinição de senha é inválido ou expirou."}
            Por favor, solicite um novo link de redefinição de senha.
          </AlertDescription>
          <Button 
            className="w-full mt-4" 
            variant="outline"
            onClick={() => setLocation("/forgot-password")}
          >
            Voltar para recuperação de senha
          </Button>
        </Alert>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Alert className="max-w-md bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700">Senha redefinida com sucesso!</AlertTitle>
          <AlertDescription className="text-green-600">
            Sua senha foi atualizada. Você será redirecionado para a página de login em instantes.
          </AlertDescription>
          <Button 
            className="w-full mt-4" 
            onClick={() => setLocation("/auth")}
          >
            Ir para o login
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Lado esquerdo - Formulário */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Redefinir Senha</h1>
            <p className="text-gray-500 mt-2">
              Digite sua nova senha para continuar
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Digite sua nova senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirme a nova senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Digite novamente sua senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redefinindo...
                  </div>
                ) : (
                  "Redefinir Senha"
                )}
              </Button>
            </form>
          </Form>
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