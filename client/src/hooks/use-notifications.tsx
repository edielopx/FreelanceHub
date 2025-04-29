import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  type: 'message' | 'proposal' | 'job' | 'appointment' | 'review' | 'payment' | 'system';
  title: string;
  message: string;
  senderId?: number;
  receiverId?: number;
  timestamp: Date;
  data?: any;
  read: boolean;
}

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearNotifications: () => void;
  connected: boolean;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Calcular contagem de não lidas
  const unreadCount = notifications.filter(n => !n.read).length;

  // Adicionar notificação
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Mostrar toast para novas notificações
    toast({
      title: notification.title,
      description: notification.message,
      action: <Bell className="h-4 w-4" />,
    });
  }, [toast]);

  // Marcar como lida
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Excluir notificação
  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Limpar todas as notificações
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Configurar conexão WebSocket quando o usuário estiver autenticado
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Criar conexão WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    // Configurar handlers
    ws.onopen = () => {
      console.log('WebSocket conectado');
      setConnected(true);
      
      // Enviar autenticação inicial
      ws.send(JSON.stringify({ 
        type: 'auth', 
        userId: user.id 
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Notificação recebida:', data);
        
        // Converter timestamp para Date
        if (data.timestamp) {
          data.timestamp = new Date(data.timestamp);
        }
        
        // Adicionar notificação
        addNotification(data);
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket desconectado');
      setConnected(false);
    };

    ws.onerror = (error) => {
      console.error('Erro de WebSocket:', error);
      setConnected(false);
    };

    setSocket(ws);

    // Limpar ao desmontar
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user, addNotification]);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
    connected,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};