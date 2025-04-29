import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Clipboard, ArrowUpDown, RefreshCw } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface DevPassword {
  user_id: number;
  username: string;
  plaintext_password: string;
}

export default function DevPasswordsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data: passwords, isLoading } = useQuery<DevPassword[]>({
    queryKey: ["/api/dev/passwords"],
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const handleCopyToClipboard = (password: string) => {
    navigator.clipboard.writeText(password).then(
      () => {
        toast({
          title: "Senha copiada",
          description: "A senha foi copiada para a área de transferência",
          variant: "default",
        });
      },
      (err) => {
        console.error("Erro ao copiar: ", err);
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar a senha",
          variant: "destructive",
        });
      }
    );
  };

  const refreshPasswords = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/dev/passwords"] });
    toast({
      title: "Atualizando senhas",
      description: "Lista de senhas está sendo atualizada",
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Filtra e ordena as senhas
  const filteredAndSortedPasswords = passwords
    ? passwords
        .filter((entry) =>
          entry.username.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
          const compareResult = a.username.localeCompare(b.username);
          return sortOrder === "asc" ? compareResult : -compareResult;
        })
    : [];

  // Verificar se o usuário é admin (edielopx)
  const { user } = useAuth();
  const isAdmin = user?.username === 'edielopx';

  // Redirecionar para página inicial se não for admin
  if (!isAdmin) {
    return (
      <div className="flex flex-col md:flex-row h-screen">
        <Sidebar />
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto text-center mt-20">
            <h1 className="text-2xl font-bold text-red-600">Acesso Restrito</h1>
            <p className="mt-4 text-lg text-gray-700">
              Esta página é restrita apenas para administradores do sistema.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold">
                  Senhas em Texto Puro (DEV)
                </CardTitle>
                <CardDescription>
                  Visualização das senhas em texto puro para fins de desenvolvimento.
                  <Badge variant="destructive" className="ml-2">
                    Apenas Desenvolvimento
                  </Badge>
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={refreshPasswords}
                title="Atualizar lista de senhas"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome de usuário..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">ID</TableHead>
                    <TableHead className="w-[200px]">
                      <div className="flex items-center cursor-pointer" onClick={toggleSortOrder}>
                        Usuário
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Senha em Texto Puro</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Mostrar esqueletos de carregamento
                    Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-6 w-10" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-48" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8 float-right" />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : filteredAndSortedPasswords.length > 0 ? (
                    filteredAndSortedPasswords.map((entry) => (
                      <TableRow key={`${entry.user_id}-${entry.username}`}>
                        <TableCell className="font-medium">{entry.user_id}</TableCell>
                        <TableCell>{entry.username}</TableCell>
                        <TableCell>
                          <div className="font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded-sm">
                            {entry.plaintext_password}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyToClipboard(entry.plaintext_password)}
                            title="Copiar senha"
                          >
                            <Clipboard className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        {searchTerm
                          ? "Nenhum resultado encontrado para a busca"
                          : "Nenhuma senha registrada no sistema"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              <p className="mb-1">
                <strong>Total de senhas:</strong>{" "}
                {passwords ? passwords.length : "Carregando..."}
              </p>
              <p className="italic text-xs">
                Nota: Esta página só deve ser utilizada em ambientes de desenvolvimento.
                Em produção, as senhas devem ser protegidas por funções de hash seguras.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}