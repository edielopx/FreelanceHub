import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ChatModal } from "@/components/chat/chat-modal";
import { Button } from "@/components/ui/button";
import { User, Search, MessageCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { User as UserType, Message } from "@shared/schema";

interface Contact {
  user: UserType;
  lastMessage?: Message;
  unreadCount: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeContact, setActiveContact] = useState<UserType | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  // Buscar todos os contatos (usuários com quem trocou mensagens)
  const { data: contacts = [], refetch: refetchContacts } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/contacts");
      if (!response.ok) {
        throw new Error("Failed to fetch contacts");
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Filtrar contatos com base no termo de busca
  const filteredContacts = contacts.filter(
    (contact) => 
      contact.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ordenar contatos: primeiro os não lidos, depois por data da última mensagem
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    // Primeiro os não lidos
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    
    // Depois por data da última mensagem
    if (a.lastMessage && b.lastMessage) {
      const dateA = a.lastMessage.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
      const dateB = b.lastMessage.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
      return dateB - dateA;
    }
    if (a.lastMessage) return -1;
    if (b.lastMessage) return 1;
    
    return 0;
  });

  // Atualizar a lista de contatos quando o modal de chat é fechado
  const handleCloseChatModal = () => {
    setIsChatOpen(false);
    refetchContacts();
  };

  // Formatar horário da última mensagem
  const formatMessageTime = (timestamp: Date | null) => {
    if (!timestamp) return "";
    
    try {
      const messageDate = new Date(timestamp);
      const now = new Date();
      
      // Se for hoje, mostrar apenas a hora
      if (messageDate.toDateString() === now.toDateString()) {
        return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // Se for esta semana, mostrar o dia da semana
      const diffDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        return messageDate.toLocaleDateString([], { weekday: 'short' });
      }
      
      // Caso contrário, mostrar a data
      return messageDate.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "";
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle>Mensagens</CardTitle>
            <CardDescription>
              Gerencie suas conversas com freelancers e clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Lista de contatos */}
              <div className="w-full md:w-64 border-r pr-4">
                <div className="relative mb-4">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar contatos..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-2 mt-2">
                  {sortedContacts.length > 0 ? (
                    sortedContacts.map((contact) => (
                      <div
                        key={contact.user.id}
                        className={`flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer ${
                          activeContact?.id === contact.user.id ? "bg-gray-100" : ""
                        }`}
                        onClick={() => {
                          setActiveContact(contact.user);
                          setIsChatOpen(true);
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center mr-3">
                          {contact.user.profileImage ? (
                            <img 
                              src={contact.user.profileImage} 
                              alt={`Foto de ${contact.user.name}`} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium truncate">{contact.user.name}</h3>
                            <span className="text-xs text-gray-500">
                              {contact.lastMessage && formatMessageTime(contact.lastMessage.timestamp)}
                            </span>
                          </div>
                          {contact.lastMessage && (
                            <p className="text-xs text-gray-500 truncate">
                              {contact.lastMessage.senderId === user.id ? "Você: " : ""}
                              {contact.lastMessage.content}
                            </p>
                          )}
                        </div>
                        {contact.unreadCount > 0 && (
                          <Badge className="ml-2 bg-primary text-white">
                            {contact.unreadCount}
                          </Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Nenhuma conversa encontrada</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Você ainda não trocou mensagens com ninguém
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Área principal - instruções */}
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md px-4">
                  <MessageCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Suas mensagens</h2>
                  <p className="text-gray-500 mb-4">
                    Selecione um contato à esquerda para iniciar uma conversa ou 
                    continue uma conversa existente.
                  </p>
                  <div className="bg-gray-100 p-4 rounded-lg text-left">
                    <h3 className="font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-primary" />
                      Dica
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      As mensagens são atualizadas automaticamente. Um badge indica 
                      o número de mensagens não lidas de cada contato.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat modal */}
      {activeContact && (
        <ChatModal
          recipient={activeContact}
          open={isChatOpen}
          onOpenChange={handleCloseChatModal}
        />
      )}
    </div>
  );
}