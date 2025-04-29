import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { log } from './vite';

interface NotificationMessage {
  type: 'message' | 'proposal' | 'job' | 'appointment' | 'review' | 'payment' | 'system';
  title: string;
  message: string;
  senderId?: number;
  receiverId?: number;
  data?: any;
  timestamp: Date;
}

// Armazenar conexões dos usuários
const userConnections = new Map<number, WebSocket[]>();

export function setupNotifications(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    log('Nova conexão WebSocket estabelecida');
    
    // Identificação inicial não autenticada
    let userId: number | null = null;

    // Lidar com mensagens do cliente
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Autenticação inicial
        if (data.type === 'auth') {
          userId = data.userId;
          log(`Usuário ${userId} autenticado no WebSocket`);
          
          // Registrar a conexão para o usuário
          if (!userConnections.has(userId)) {
            userConnections.set(userId, []);
          }
          
          // Adicionar esta conexão para o usuário
          userConnections.get(userId)?.push(ws);
          
          // Enviar mensagem de confirmação
          ws.send(JSON.stringify({
            type: 'system',
            title: 'Conexão estabelecida',
            message: 'Você está conectado às notificações em tempo real',
            timestamp: new Date()
          }));
        }
      } catch (error) {
        log(`Erro ao processar mensagem WebSocket: ${error}`);
      }
    });

    // Lidar com fechamento da conexão
    ws.on('close', () => {
      log('Conexão WebSocket fechada');
      
      // Remover esta conexão da lista do usuário
      if (userId) {
        const connections = userConnections.get(userId);
        if (connections) {
          const index = connections.indexOf(ws);
          if (index !== -1) {
            connections.splice(index, 1);
          }
          
          // Se não há mais conexões, remover o usuário
          if (connections.length === 0) {
            userConnections.delete(userId);
          }
        }
      }
    });
  });

  log('Servidor WebSocket configurado');
  return wss;
}

// Função para enviar notificação para um usuário específico
export function sendNotification(userId: number, notification: Omit<NotificationMessage, 'timestamp'>) {
  const connections = userConnections.get(userId);
  
  if (!connections || connections.length === 0) {
    return false; // Usuário não está conectado
  }
  
  const fullNotification: NotificationMessage = {
    ...notification,
    timestamp: new Date()
  };
  
  // Enviar para todas as conexões do usuário (pode ter múltiplos dispositivos/abas)
  connections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(fullNotification));
    }
  });
  
  return true;
}

// Função para enviar notificação para múltiplos usuários
export function broadcastNotification(userIds: number[], notification: Omit<NotificationMessage, 'timestamp'>) {
  userIds.forEach(userId => {
    sendNotification(userId, notification);
  });
}

// Função para notificar sobre nova mensagem
export function notifyNewMessage(receiverId: number, senderId: number, senderName: string, content: string) {
  return sendNotification(receiverId, {
    type: 'message',
    title: 'Nova mensagem',
    message: `${senderName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
    senderId,
    receiverId,
    data: { senderId }
  });
}

// Função para notificar sobre nova proposta em um trabalho
export function notifyNewProposal(clientId: number, freelancerId: number, freelancerName: string, jobTitle: string) {
  return sendNotification(clientId, {
    type: 'proposal',
    title: 'Nova proposta',
    message: `${freelancerName} enviou uma proposta para "${jobTitle}"`,
    senderId: freelancerId,
    receiverId: clientId,
    data: { jobTitle, freelancerId }
  });
}

// Função para notificar sobre status de proposta alterado
export function notifyProposalStatusChange(freelancerId: number, clientName: string, jobTitle: string, status: string) {
  const statusText = status === 'accepted' ? 'aceitou' : 'recusou';
  
  return sendNotification(freelancerId, {
    type: 'proposal',
    title: 'Status da proposta alterado',
    message: `${clientName} ${statusText} sua proposta para "${jobTitle}"`,
    receiverId: freelancerId,
    data: { jobTitle, status }
  });
}

// Função para notificar sobre novo agendamento
export function notifyNewAppointment(freelancerId: number, clientId: number, clientName: string, serviceName: string, appointmentDate: Date) {
  const date = appointmentDate.toLocaleDateString('pt-BR');
  const time = appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  return sendNotification(freelancerId, {
    type: 'appointment',
    title: 'Novo agendamento',
    message: `${clientName} agendou "${serviceName}" para ${date} às ${time}`,
    senderId: clientId,
    receiverId: freelancerId,
    data: { serviceName, appointmentDate }
  });
}

// Função para notificar sobre status de agendamento alterado
export function notifyAppointmentStatusChange(userId: number, otherUserName: string, serviceName: string, status: string) {
  let statusText = '';
  
  switch (status) {
    case 'confirmed':
      statusText = 'confirmou';
      break;
    case 'canceled':
      statusText = 'cancelou';
      break;
    case 'completed':
      statusText = 'marcou como concluído';
      break;
    default:
      statusText = 'alterou o status de';
  }
  
  return sendNotification(userId, {
    type: 'appointment',
    title: 'Status do agendamento alterado',
    message: `${otherUserName} ${statusText} o agendamento de "${serviceName}"`,
    receiverId: userId,
    data: { serviceName, status }
  });
}

// Função para notificar sobre nova avaliação
export function notifyNewReview(freelancerId: number, clientName: string, rating: number) {
  return sendNotification(freelancerId, {
    type: 'review',
    title: 'Nova avaliação',
    message: `${clientName} deixou uma avaliação de ${rating} estrelas para você`,
    receiverId: freelancerId,
    data: { rating }
  });
}

// Função para notificar sobre pagamento recebido
export function notifyPaymentReceived(freelancerId: number, clientName: string, amount: number, serviceName: string) {
  return sendNotification(freelancerId, {
    type: 'payment',
    title: 'Pagamento recebido',
    message: `${clientName} realizou um pagamento de R$ ${amount.toFixed(2)} pelo serviço "${serviceName}"`,
    receiverId: freelancerId,
    data: { amount, serviceName }
  });
}