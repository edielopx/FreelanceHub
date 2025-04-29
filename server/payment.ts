import { Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "./storage";
import { sendPaymentConfirmationEmail } from "./email";

// Verificar se a chave do Stripe está configurada
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY não está configurada no ambiente.");
}

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

/**
 * Cria uma intenção de pagamento (Payment Intent) no Stripe
 * Este é o primeiro passo no fluxo de pagamento
 */
export async function createPaymentIntent(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const { amount, serviceType, serviceId } = req.body;

    if (!amount || !serviceType || !serviceId) {
      return res.status(400).json({ error: "Parâmetros inválidos" });
    }

    // Validar tipo de serviço
    if (!["service", "job", "appointment"].includes(serviceType)) {
      return res.status(400).json({ error: "Tipo de serviço inválido" });
    }

    // Verificar se o valor é válido
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Valor inválido" });
    }

    // Converter valor para centavos (o Stripe trabalha com a menor unidade monetária)
    const amountInCents = Math.round(amount * 100);

    // Criar um objeto de metadados para associar ao pagamento
    const metadata = {
      userId: req.user.id.toString(),
      serviceType,
      serviceId: serviceId.toString(),
    };

    // Criar a intenção de pagamento no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "brl",
      metadata,
      // Usar o email do usuário para ajudar com o reconhecimento de fraude
      receipt_email: req.user.email,
      // Opcionalmente: adicionar cliente ao Stripe Customer para futuras cobranças
      // customer: customer.id, 
    });

    // Enviar o client_secret de volta para o cliente
    // O client_secret é usado pelo frontend para processar o pagamento
    res.json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error: any) {
    console.error("Erro ao criar intenção de pagamento:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Verifica um pagamento e atualiza o status do serviço/pedido correspondente
 */
export async function verifyPayment(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "ID da intenção de pagamento é obrigatório" });
    }

    // Buscar detalhes do pagamento no Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Verificar se o pagamento foi bem-sucedido
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        error: "O pagamento não foi concluído com sucesso",
        status: paymentIntent.status,
      });
    }

    // Recuperar metadados do pagamento
    const { serviceType, serviceId, userId } = paymentIntent.metadata;

    // Verificar se os metadados são válidos
    if (!serviceType || !serviceId || !userId) {
      return res.status(400).json({ error: "Metadados de pagamento inválidos" });
    }

    // Atualizar o status do serviço com base no tipo
    let result;
    if (serviceType === "appointment") {
      // Atualizar status do agendamento
      const appointment = await storage.getAppointmentById(parseInt(serviceId));
      if (!appointment) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }

      // Atualizar status do agendamento como confirmado e pago
      result = await storage.updateAppointmentStatus(parseInt(serviceId), "confirmed");

      // Enviar email de confirmação
      // Aqui você pode enviar um email de confirmação para o cliente
      // e para o freelancer notificando sobre o agendamento
      const service = await storage.getServiceById(appointment.serviceId);
      if (service) {
        const freelancerProfile = await storage.getFreelancerProfile(service.userId);
        if (freelancerProfile) {
          const freelancer = await storage.getUser(service.userId);
          const client = req.user;

          if (freelancer && client) {
            sendPaymentConfirmationEmail({
              to: client.email,
              name: client.name,
              serviceName: service.title,
              date: appointment.appointmentDate,
              amount: paymentIntent.amount / 100, // Converter de centavos para a moeda
              freelancerName: freelancer.name
            });

            // Também podemos enviar um email para o freelancer notificando sobre a reserva
            
            // Enviar notificação em tempo real para o freelancer
            const { notifyPaymentReceived } = await import('./notifications');
            notifyPaymentReceived(
              freelancer.id,
              client.name,
              paymentIntent.amount / 100,
              service.title
            );
          }
        }
      }
    } else if (serviceType === "job") {
      // Atualizar status do trabalho
      const job = await storage.getJobById(parseInt(serviceId));
      if (!job) {
        return res.status(404).json({ error: "Trabalho não encontrado" });
      }

      // Buscar a proposta aceita
      const proposals = await storage.getProposals(parseInt(serviceId));
      const acceptedProposal = proposals.find(p => p.status === "accepted");
      
      if (!acceptedProposal) {
        return res.status(400).json({ error: "Nenhuma proposta aceita para este trabalho" });
      }

      // Atualizar status do trabalho para "em progresso"
      result = await storage.updateJobStatus(parseInt(serviceId), "in_progress");

      // Enviar email de confirmação
      const freelancer = await storage.getUser(acceptedProposal.freelancerId);
      const client = req.user;

      if (freelancer && client) {
        sendPaymentConfirmationEmail({
          to: client.email,
          name: client.name,
          serviceName: job.title,
          amount: paymentIntent.amount / 100,
          freelancerName: freelancer.name
        });
        
        // Enviar notificação em tempo real para o freelancer
        const { notifyPaymentReceived } = await import('./notifications');
        notifyPaymentReceived(
          freelancer.id,
          client.name,
          paymentIntent.amount / 100,
          job.title
        );
      }
    } else if (serviceType === "service") {
      // Processar pagamento para um serviço específico
      const service = await storage.getServiceById(parseInt(serviceId));
      if (!service) {
        return res.status(404).json({ error: "Serviço não encontrado" });
      }

      // Neste caso, talvez seja necessário criar um agendamento ou outro registro
      // para acompanhar este pagamento, dependendo do modelo de negócios
      
      // Por exemplo, criar um agendamento automático
      const now = new Date();
      const endTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 hora
      
      result = await storage.createAppointment({
        serviceId: parseInt(serviceId),
        clientId: req.user.id,
        appointmentDate: now,
        endTime: endTime,
        status: "confirmed",
        notes: "Serviço pago através do sistema"
      });

      // Enviar email de confirmação
      const freelancer = await storage.getUser(service.userId);
      const client = req.user;

      if (freelancer && client) {
        sendPaymentConfirmationEmail({
          to: client.email,
          name: client.name,
          serviceName: service.title,
          amount: paymentIntent.amount / 100,
          freelancerName: freelancer.name
        });
        
        // Enviar notificação em tempo real para o freelancer
        const { notifyPaymentReceived } = await import('./notifications');
        notifyPaymentReceived(
          freelancer.id,
          client.name,
          paymentIntent.amount / 100,
          service.title
        );
      }
    }

    // Registrar esse pagamento no nosso sistema (opcional)
    // Aqui você pode implementar o armazenamento do histórico de pagamentos
    // em uma tabela específica

    res.json({
      success: true,
      message: "Pagamento processado com sucesso",
      result
    });

  } catch (error: any) {
    console.error("Erro ao verificar pagamento:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Webhook para receber eventos do Stripe
 * Isso permite processar pagamentos e eventos mesmo quando o cliente
 * fecha o navegador ou perde a conexão
 */
export async function stripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    return res.status(500).json({ error: "Chave secreta do webhook não configurada" });
  }

  let event;

  try {
    // Verificar a assinatura do webhook para garantir que o evento veio do Stripe
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      endpointSecret
    );
  } catch (err: any) {
    console.log(`Erro na assinatura do webhook: ${err.message}`);
    return res.status(400).send(`Erro na assinatura do webhook: ${err.message}`);
  }

  // Lidar com o evento
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // Processar o pagamento bem-sucedido
      console.log('Pagamento bem-sucedido:', paymentIntent.id);
      
      // Aqui você pode implementar a mesma lógica de verifyPayment
      // para atualizar o status do serviço/pedido
      
      // Como isso é assíncrono e não precisamos responder diretamente ao cliente,
      // podemos processar em segundo plano
      try {
        const { serviceType, serviceId, userId } = paymentIntent.metadata;
        
        if (serviceType === "appointment") {
          await storage.updateAppointmentStatus(parseInt(serviceId), "confirmed");
        } else if (serviceType === "job") {
          await storage.updateJobStatus(parseInt(serviceId), "in_progress");
        }
        // Outros casos conforme necessário
      } catch (error) {
        console.error("Erro ao processar webhook de pagamento:", error);
      }
      
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.log('Pagamento falhou:', failedPayment.id);
      break;
    default:
      console.log(`Tipo de evento não tratado: ${event.type}`);
  }

  // Retornar uma resposta para confirmar recebimento do evento
  res.json({ received: true });
}

/**
 * Lista os pagamentos de um usuário
 */
export async function listPayments(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    // Buscar as intenções de pagamento no Stripe usando o metadata.userId
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
    });

    // Filtrar para incluir apenas os pagamentos do usuário atual
    const userPayments = paymentIntents.data.filter(
      payment => payment.metadata.userId === req.user.id.toString()
    );

    // Mapear para retornar apenas os dados necessários
    const payments = await Promise.all(userPayments.map(async (payment) => {
      const { serviceType, serviceId } = payment.metadata;
      let serviceDetails = null;
      
      // Obter detalhes do serviço com base no tipo
      if (serviceType === "appointment") {
        const appointment = await storage.getAppointmentById(parseInt(serviceId));
        if (appointment) {
          const service = await storage.getServiceById(appointment.serviceId);
          serviceDetails = {
            title: service?.title || "Agendamento",
            date: appointment.appointmentDate,
          };
        }
      } else if (serviceType === "job") {
        const job = await storage.getJobById(parseInt(serviceId));
        serviceDetails = job ? {
          title: job.title,
          date: job.createdAt,
        } : null;
      } else if (serviceType === "service") {
        const service = await storage.getServiceById(parseInt(serviceId));
        serviceDetails = service ? {
          title: service.title,
          date: new Date(),
        } : null;
      }
      
      return {
        id: payment.id,
        amount: payment.amount / 100, // Converter centavos para reais
        status: payment.status,
        date: new Date(payment.created * 1000), // Converter timestamp Unix para Date
        serviceType,
        serviceId,
        serviceDetails,
      };
    }));

    res.json(payments);
  } catch (error: any) {
    console.error("Erro ao listar pagamentos:", error);
    res.status(500).json({ error: error.message });
  }
}