import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  Shield,
  UserCog,
  Database,
  Key
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface DevPassword {
  user_id: number;
  username: string;
  plaintext_password: string;
}

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  userType: string;
  password: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  
  // Se o usuário não for o admin (edielopx), redirecionar
  useEffect(() => {
    if (user && user.username !== "edielopx") {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Não mostrar nada enquanto verifica se é admin
  if (!user || user.username !== "edielopx") {
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <Card className="max-w-6xl mx-auto">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold">
                  Painel de Administração
                </CardTitle>
                <CardDescription>
                  Ferramentas de administração para gerenciamento do sistema
                  <Badge variant="destructive" className="ml-2">
                    Acesso Restrito
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="passwords">
              <TabsList className="mb-4">
                <TabsTrigger value="passwords" className="flex items-center">
                  <Key className="h-4 w-4 mr-2" />
                  Senhas de Usuários
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center">
                  <UserCog className="h-4 w-4 mr-2" />
                  Gerenciar Usuários
                </TabsTrigger>
                <TabsTrigger value="database" className="flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  Banco de Dados
                </TabsTrigger>
              </TabsList>

              <TabsContent value="passwords">
                <PasswordsTab 
                  searchTerm={searchTerm} 
                  setSearchTerm={setSearchTerm}
                />
              </TabsContent>
              
              <TabsContent value="users">
                <UsersTab 
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  setSelectedUser={setSelectedUser}
                  setIsChangePasswordOpen={setIsChangePasswordOpen}
                  newPassword={newPassword}
                  setNewPassword={setNewPassword}
                  selectedUser={selectedUser}
                  isChangePasswordOpen={isChangePasswordOpen}
                />
              </TabsContent>
              
              <TabsContent value="database">
                <DatabaseTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PasswordsTab({ searchTerm, setSearchTerm }) {
  const { toast } = useToast();
  
  // Query para buscar as senhas
  const { data: passwords, isLoading, error, refetch } = useQuery<DevPassword[]>({
    queryKey: ["/api/dev/passwords"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/dev/passwords");
      if (!response.ok) {
        throw new Error("Falha ao carregar senhas");
      }
      return response.json();
    }
  });

  // Filtrar senhas com base no termo de busca
  const filteredPasswords = passwords?.filter(
    (password) => password.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Atualizar a lista de senhas
  const handleRefresh = () => {
    refetch();
    toast({
      title: "Lista atualizada",
      description: "A lista de senhas foi atualizada com sucesso",
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome de usuário..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleRefresh}
          title="Atualizar lista de senhas"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">Erro ao carregar senhas: {error.toString()}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Senha</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPasswords && filteredPasswords.length > 0 ? (
                filteredPasswords.map((item) => (
                  <TableRow key={item.user_id}>
                    <TableCell className="font-medium">{item.user_id}</TableCell>
                    <TableCell>{item.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="font-mono">
                          {item.plaintext_password}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            navigator.clipboard.writeText(item.plaintext_password);
                            toast({
                              title: "Senha copiada",
                              description: "A senha foi copiada para a área de transferência",
                            });
                          }}
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    {searchTerm ? "Nenhum resultado encontrado." : "Nenhum dado disponível."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-4 text-sm text-muted-foreground">
        <p className="mb-1">
          <strong>Total de senhas:</strong>{" "}
          {passwords ? passwords.length : "Carregando..."}
        </p>
        <p className="italic text-xs">
          Nota: Esta página só está disponível para administradores.
        </p>
      </div>
    </div>
  );
}

function UsersTab({ 
  searchTerm, 
  setSearchTerm, 
  setSelectedUser, 
  setIsChangePasswordOpen,
  newPassword,
  setNewPassword,
  selectedUser,
  isChangePasswordOpen 
}) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Query para buscar os usuários
  const { data: users, isLoading, error, refetch } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      if (!response.ok) {
        throw new Error("Falha ao carregar usuários");
      }
      return response.json();
    }
  });

  // Mutation para alterar senha
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { userId: number; newPassword: string }) => {
      const response = await apiRequest("POST", "/api/admin/change-password", data);
      if (!response.ok) {
        throw new Error("Falha ao alterar senha");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha alterada",
        description: `A senha do usuário ${selectedUser?.username} foi alterada com sucesso`,
      });
      setIsChangePasswordOpen(false);
      setNewPassword("");
      queryClient.invalidateQueries({ queryKey: ["/api/dev/passwords"] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao alterar senha: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para excluir usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      if (!response.ok) {
        throw new Error("Falha ao excluir usuário");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário excluído",
        description: `O usuário ${userToDelete?.username} foi excluído com sucesso`,
      });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/dev/passwords"] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao excluir usuário: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Filtrar usuários com base no termo de busca
  const filteredUsers = users?.filter(
    (user) => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Lidar com a alteração de senha
  const handleChangePassword = () => {
    if (selectedUser && newPassword) {
      changePasswordMutation.mutate({ 
        userId: selectedUser.id, 
        newPassword 
      });
    }
  };

  // Lidar com a exclusão de usuário
  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, usuário ou email..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => refetch()}
          title="Atualizar lista de usuários"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">Erro ao carregar usuários: {error.toString()}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={
                        user.userType === "freelancer" 
                          ? "bg-green-100 text-green-800 hover:bg-green-200" 
                          : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                      }>
                        {user.userType === "freelancer" ? "Freelancer" : "Contratante"}
                      </Badge>
                      {user.username === "edielopx" && (
                        <Badge className="ml-1 bg-purple-100 text-purple-800 hover:bg-purple-200">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsChangePasswordOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        {user.username !== "edielopx" && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setUserToDelete(user);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    {searchTerm ? "Nenhum resultado encontrado." : "Nenhum dado disponível."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Diálogo para alteração de senha */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha do Usuário</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para o usuário {selectedUser?.username}.
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <label htmlFor="new-password" className="text-sm font-medium">
                Nova Senha
              </label>
              <Input
                id="new-password"
                placeholder="Digite a nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsChangePasswordOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleChangePassword}
              disabled={!newPassword || changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Alterando...
                </>
              ) : (
                "Alterar Senha"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para exclusão de usuário */}
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a conta
              do usuário <strong>{userToDelete?.username}</strong> e removerá todos os seus dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir Usuário"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mt-4 text-sm text-muted-foreground">
        <p className="mb-1">
          <strong>Total de usuários:</strong>{" "}
          {users ? users.length : "Carregando..."}
        </p>
        <p className="italic text-xs">
          Nota: O usuário "edielopx" não pode ser excluído por ter permissões de administrador.
        </p>
      </div>
    </div>
  );
}

function DatabaseTab() {
  const { toast } = useToast();
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryResult, setQueryResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Executar consulta SQL
  const executeSqlQuery = async () => {
    if (!sqlQuery.trim()) {
      toast({
        title: "Erro",
        description: "A consulta SQL não pode estar vazia",
        variant: "destructive",
      });
      return;
    }
    
    setIsExecuting(true);
    
    try {
      const response = await apiRequest("POST", "/api/admin/execute-sql", { sql: sqlQuery });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao executar consulta SQL");
      }
      
      const result = await response.json();
      setQueryResult(result);
      
      toast({
        title: "Consulta executada",
        description: "A consulta SQL foi executada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao executar consulta: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };
  
  return (
    <div>
      <div className="mb-4">
        <label htmlFor="sql-query" className="block text-sm font-medium mb-1">
          Consulta SQL
        </label>
        <div className="relative">
          <textarea
            id="sql-query"
            className="w-full min-h-[120px] p-3 font-mono text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Digite sua consulta SQL aqui..."
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex justify-end mb-6">
        <Button 
          onClick={executeSqlQuery}
          disabled={isExecuting || !sqlQuery.trim()}
        >
          {isExecuting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Executando...
            </>
          ) : (
            "Executar Consulta"
          )}
        </Button>
      </div>
      
      {queryResult && (
        <div className="rounded-md border overflow-hidden mt-4">
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="font-medium">Resultado da Consulta</h3>
          </div>
          <div className="p-4 overflow-auto max-h-[400px]">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words">
              {JSON.stringify(queryResult, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p className="italic text-xs text-red-500">
          Atenção: Execute consultas SQL com cautela. Operações incorretas podem danificar o banco de dados.
        </p>
      </div>
    </div>
  );
}