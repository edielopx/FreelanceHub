import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, X, Send } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { User as UserType, Message } from "@shared/schema";
import { formatDate } from "@/lib/utils";

interface ChatModalProps {
  recipient: UserType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatModal({ recipient, open, onOpenChange }: ChatModalProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: messages = [], refetch } = useQuery<Message[]>({
    queryKey: [`/api/messages/${recipient.id}`],
    queryFn: async () => {
      if (!recipient.id) return [];
      const res = await apiRequest("GET", `/api/messages/${recipient.id}`);
      return res.json();
    },
    enabled: open,
  });
  
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/messages", {
        receiverId: recipient.id,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${recipient.id}`] });
      setMessage("");
    },
  });
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!open) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [open, refetch]);
  
  // Group messages by date
  const groupedMessages: { [key: string]: Message[] } = {};
  messages.forEach(msg => {
    const date = new Date(msg.timestamp).toLocaleDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(msg);
  });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden" hideCloseButton>
        <DialogHeader className="p-3 border-b border-gray-200 bg-primary text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex items-center justify-center mr-2">
                {recipient.profileImage ? (
                  <img 
                    src={recipient.profileImage} 
                    alt={`Foto de ${recipient.name}`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <DialogTitle className="text-base">{recipient.name}</DialogTitle>
                <p className="text-xs text-gray-200">Online</p>
              </div>
            </div>
            <div className="flex">
              <Button variant="ghost" size="icon" className="text-white hover:text-gray-200 h-auto p-1" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="h-80 overflow-y-auto p-3">
          {Object.entries(groupedMessages).map(([date, dayMessages]) => (
            <div key={date}>
              <div className="text-center my-2">
                <span className="text-xs text-dark-light bg-gray-100 px-2 py-1 rounded-full">
                  {date === new Date().toLocaleDateString() ? 'Hoje' : date}
                </span>
              </div>
              
              {dayMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex mb-3 ${msg.senderId === user?.id ? 'justify-end' : ''}`}
                >
                  {msg.senderId !== user?.id && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center mr-2">
                      {recipient.profileImage ? (
                        <img 
                          src={recipient.profileImage} 
                          alt={`Foto de ${recipient.name}`} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  )}
                  
                  <div 
                    className={`rounded-lg p-2 max-w-[70%] ${
                      msg.senderId === user?.id 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-dark-medium'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.senderId === user?.id ? 'text-gray-200' : 'text-dark-light'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-3 border-t border-gray-200">
          <form className="flex items-center" onSubmit={handleSendMessage}>
            <Input
              type="text"
              placeholder="Digite sua mensagem..."
              className="flex-1 border border-gray-300 rounded-l-lg py-2 px-3"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button 
              type="submit" 
              className="rounded-l-none"
              disabled={sendMessageMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
