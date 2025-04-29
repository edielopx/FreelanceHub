import React, { useState } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Bell,
  MessageSquare,
  FileText,
  Calendar,
  Star,
  CreditCard,
  Trash2,
  CheckSquare,
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
    connected,
  } = useNotifications();
  
  const [open, setOpen] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      // Quando abrimos, não fazemos nada, deixando notificações não lidas
    } else {
      // Quando fechamos, marcamos todas que foram vistas como lidas
      markAllAsRead();
    }
    setOpen(isOpen);
  };

  // Função para obter o ícone baseado no tipo de notificação
  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />;
      case 'proposal':
        return <FileText className="h-4 w-4 mr-2 text-indigo-500" />;
      case 'job':
        return <FileText className="h-4 w-4 mr-2 text-purple-500" />;
      case 'appointment':
        return <Calendar className="h-4 w-4 mr-2 text-green-500" />;
      case 'review':
        return <Star className="h-4 w-4 mr-2 text-yellow-500" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 mr-2 text-emerald-500" />;
      default:
        return <Bell className="h-4 w-4 mr-2 text-gray-500" />;
    }
  };

  // Formatar a data relativa (hoje, ontem, etc)
  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return `Hoje, ${format(date, 'HH:mm')}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem, ${format(date, 'HH:mm')}`;
    } else {
      return format(date, "d 'de' MMMM, HH:mm", { locale: ptBR });
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className={connected ? "h-5 w-5" : "h-5 w-5 text-muted-foreground"} />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[18px] h-[18px] text-[10px] flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex justify-between items-center px-4 py-2 border-b">
          <h3 className="font-medium">Notificações</h3>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              title="Marcar todas como lidas"
              className="h-8 w-8"
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={clearNotifications}
              disabled={notifications.length === 0}
              title="Limpar todas"
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Não há notificações</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`px-4 py-3 cursor-default ${!notification.read ? 'bg-muted/40' : ''}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex gap-2 w-full">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="h-6 w-6 -mr-2 opacity-50 hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {formatRelativeDate(notification.timestamp)}
                    </span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}