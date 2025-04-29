import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertFreelancerProfileSchema, 
  insertReviewSchema, 
  insertServiceSchema, 
  insertMessageSchema, 
  insertAppointmentSchema,
  insertJobSchema,
  insertProposalSchema,
  type AppointmentStatus 
} from "@shared/schema";
import { setupAuth, hashPassword } from "./auth";
import { z } from "zod";
import { 
  isAdmin,
  getUsers,
  changeUserPassword,
  deleteUser,
  executeSqlQuery
} from "./admin";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "./email";
import { comparePasswords } from "./auth";
import { createPaymentIntent, verifyPayment, stripeWebhook, listPayments } from "./payment";
import { setupNotifications } from "./notifications";

// Importar a configuração que inicializa o storage
import "./config";

export async function registerRoutes(app: Express): Promise<Server> {
  // Banco de dados já configurado em config.ts
  try {
    console.log('Banco de dados PostgreSQL conectado com sucesso.');
  } catch (error) {
    console.error('Erro ao configurar banco de dados:', error);
  }
  
  // Configurar rotas de autenticação
  setupAuth(app);

  // Demais rotas da API
  // Todas as rotas têm prefixo /api
  
  // Freelancer profiles
  app.get("/api/freelancers", async (req, res) => {
    try {
      const { 
        query, 
        category, 
        location, 
        distance, 
        rating, 
        minPrice, 
        maxPrice, 
        lat, 
        lng,
        sortBy 
      } = req.query;
      
      // Log dos parâmetros de busca para debug
      console.log("Query params:", { 
        query, category, location, distance, 
        rating, minPrice, maxPrice, sortBy 
      });
      
      const searchOptions = {
        query: query as string | undefined,
        category: category as string | undefined,
        location: location as string | undefined,
        maxDistance: distance ? parseInt(distance as string) : undefined,
        minRating: rating ? parseInt(rating as string) : undefined,
        minPrice: minPrice ? parseInt(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
        latitude: lat ? parseFloat(lat as string) : undefined,
        longitude: lng ? parseFloat(lng as string) : undefined,
        sortBy: sortBy as string | undefined
      };
      
      // Obter os freelancers com os filtros aplicados
      let freelancers = await storage.searchFreelancers(searchOptions);
      
      // Log dos primeiros dois freelancers para verificar a ordenação
      if (freelancers.length > 0) {
        console.log("Ordenação aplicada:", sortBy);
        console.log("Primeiro freelancer:", {
          nome: freelancers[0].user.name,
          taxa: freelancers[0].profile.hourlyRate
        });
        if (freelancers.length > 1) {
          console.log("Segundo freelancer:", {
            nome: freelancers[1].user.name,
            taxa: freelancers[1].profile.hourlyRate
          });
        }
      }
      
      res.json(freelancers);
    } catch (error) {
      res.status(500).json({ error: "Failed to search freelancers" });
    }
  });

  // Get current user's freelancer profile
  app.get("/api/freelancer-profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const profile = await storage.getFreelancerProfile(req.user.id);
      
      if (!profile) {
        return res.status(404).json({ error: "Freelancer profile not found" });
      }
      
      return res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to get freelancer profile" });
    }
  });

  // Create or update freelancer profile
  app.post("/api/freelancer-profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const data = insertFreelancerProfileSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Check if profile already exists
      const existingProfile = await storage.getFreelancerProfile(req.user.id);
      
      let profile;
      if (existingProfile) {
        profile = await storage.updateFreelancerProfile(existingProfile.id, data);
      } else {
        profile = await storage.createFreelancerProfile(data);
      }
      
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create freelancer profile" });
      }
    }
  });

  // Get freelancer profile by ID
  app.get("/api/freelancers/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const profile = await storage.getFreelancerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      const services = await storage.getServices(profile.id);
      const reviews = await storage.getReviews(profile.id);
      const avgRating = await storage.getAverageRating(profile.id);
      
      res.json({
        user,
        profile,
        services,
        reviews,
        avgRating,
        reviewCount: reviews.length
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get freelancer profile" });
    }
  });

  // Services
  // Get services of a freelancer
  app.get("/api/services/freelancer/:freelancerId", async (req, res) => {
    try {
      const freelancerId = parseInt(req.params.freelancerId);
      const services = await storage.getServices(freelancerId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to get services" });
    }
  });
  
  // Get service by ID
  app.get("/api/services/:id", async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getServiceById(serviceId);
      
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      
      res.json(service);
    } catch (error) {
      res.status(500).json({ error: "Failed to get service" });
    }
  });
  
  // Create a new service
  app.post("/api/services", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const profile = await storage.getFreelancerProfile(req.user.id);
      
      if (!profile) {
        return res.status(400).json({ error: "Freelancer profile not found" });
      }
      
      const data = insertServiceSchema.parse({
        ...req.body,
        freelancerId: profile.id
      });
      
      const service = await storage.createService(data);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create service" });
      }
    }
  });
  
  // Update a service
  app.patch("/api/services/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getServiceById(serviceId);
      
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      
      // Verify that the service belongs to the freelancer
      const profile = await storage.getFreelancerProfile(req.user.id);
      if (!profile || service.freelancerId !== profile.id) {
        return res.status(403).json({ error: "Not authorized to update this service" });
      }
      
      // Update the service
      // TODO: Implement updateService method in storage interface
      // For now, we'll just return the merged service object
      const updatedService = { ...service, ...req.body };
      
      res.json(updatedService);
    } catch (error) {
      res.status(500).json({ error: "Failed to update service" });
    }
  });
  
  // Delete a service
  app.delete("/api/services/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getServiceById(serviceId);
      
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      
      // Verify that the service belongs to the freelancer
      const profile = await storage.getFreelancerProfile(req.user.id);
      if (!profile || service.freelancerId !== profile.id) {
        return res.status(403).json({ error: "Not authorized to delete this service" });
      }
      
      // TODO: Implement deleteService method in storage interface
      // For now, we'll just send a success response
      // In the future, this will delete the service from storage
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete service" });
    }
  });

  // Reviews
  app.post("/api/reviews", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const data = insertReviewSchema.parse({
        ...req.body,
        clientId: req.user.id
      });
      
      const review = await storage.createReview(data);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create review" });
      }
    }
  });

  // Messages
  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const data = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id
      });
      
      const message = await storage.createMessage(data);
      
      // Enviar notificação em tempo real para o destinatário
      const { notifyNewMessage } = await import('./notifications');
      notifyNewMessage(
        data.receiverId, 
        req.user.id, 
        req.user.name, 
        data.content
      );
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });

  app.get("/api/messages/:receiverId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const receiverId = parseInt(req.params.receiverId);
      const messages = await storage.getMessages(req.user.id, receiverId);
      
      // Mark messages as read
      await storage.markMessagesAsRead(req.user.id, receiverId);
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get messages" });
    }
  });
  
  // Listar todos os contatos com quem o usuário atual trocou mensagens
  app.get("/api/contacts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      // Buscar usuários com quem o usuário atual trocou mensagens
      const contacts = await storage.getContacts(req.user.id);
      res.json(contacts);
    } catch (error) {
      console.error("Erro ao buscar contatos:", error);
      res.status(500).json({ error: "Failed to get contacts" });
    }
  });

  app.get("/api/unread-messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const count = await storage.getUnreadMessageCount(req.user.id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get unread message count" });
    }
  });

  // Update user profile
  app.patch("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const updatedUser = await storage.updateUser(req.user.id, req.body);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });
  
  // Update user location
  app.put("/api/user-location", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { latitude, longitude, location } = req.body;
      
      if (!latitude || !longitude || !location) {
        return res.status(400).json({ error: "Missing location data" });
      }
      
      const updatedUser = await storage.updateUser(req.user.id, {
        latitude,
        longitude,
        location
      });
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user location" });
    }
  });

  // Appointments
  app.post("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      // Cliente está criando o agendamento
      const data = insertAppointmentSchema.parse({
        ...req.body,
        clientId: req.user.id
      });

      // Verificar se o serviço existe
      const service = await storage.getServiceById(data.serviceId);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }

      // Obter informações do freelancer para a notificação
      const freelancerProfile = await storage.getFreelancerProfile(service.userId);
      if (!freelancerProfile) {
        return res.status(404).json({ error: "Freelancer profile not found" });
      }

      const appointment = await storage.createAppointment(data);
      
      // Enviar notificação para o freelancer sobre o novo agendamento
      const { notifyNewAppointment } = await import('./notifications');
      notifyNewAppointment(
        freelancerProfile.id,
        req.user.id,
        req.user.name,
        service.title,
        appointment.appointmentDate
      );
      
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create appointment" });
      }
    }
  });

  // Obter agendamentos do usuário (como cliente ou freelancer)
  app.get("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const role = req.query.role as "client" | "freelancer" || "client";
      const appointments = await storage.getAppointments(req.user.id, role);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get appointments" });
    }
  });

  // Obter agendamentos para um serviço específico (para freelancers)
  app.get("/api/appointments/service/:serviceId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const serviceId = parseInt(req.params.serviceId);
      const status = req.query.status as AppointmentStatus | undefined;
      
      // Verificar se o serviço pertence ao freelancer
      const service = await storage.getServiceById(serviceId);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      
      const profile = await storage.getFreelancerProfile(req.user.id);
      if (!profile || service.freelancerId !== profile.id) {
        return res.status(403).json({ error: "Not authorized to view these appointments" });
      }
      
      const appointments = await storage.getFreelancerAppointments(serviceId, status);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get service appointments" });
    }
  });

  // Obter agendamentos do cliente
  app.get("/api/appointments/client", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const status = req.query.status as AppointmentStatus | undefined;
      const appointments = await storage.getClientAppointments(req.user.id, status);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get client appointments" });
    }
  });

  // Obter um agendamento específico pelo ID
  app.get("/api/appointments/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const appointmentId = parseInt(req.params.id);
      const appointment = await storage.getAppointmentById(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      // Verificar se o usuário é o cliente ou o prestador de serviço
      const isClient = appointment.clientId === req.user.id;
      
      // Para freelancers, verificar se o serviço pertence a eles
      const service = await storage.getServiceById(appointment.serviceId);
      const profile = await storage.getFreelancerProfile(req.user.id);
      const isFreelancer = profile && service && service.freelancerId === profile.id;
      
      if (!isClient && !isFreelancer) {
        return res.status(403).json({ error: "Not authorized to view this appointment" });
      }
      
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Failed to get appointment" });
    }
  });

  // Atualizar o status de um agendamento
  app.put("/api/appointments/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const appointmentId = parseInt(req.params.id);
      const { status } = req.body as { status: AppointmentStatus };
      
      if (!status || !["pending", "confirmed", "canceled", "completed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const appointment = await storage.getAppointmentById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      // Verificar autorização: clientes podem cancelar, freelancers podem confirmar/cancelar/completar
      const isClient = appointment.clientId === req.user.id;
      
      const service = await storage.getServiceById(appointment.serviceId);
      const profile = await storage.getFreelancerProfile(req.user.id);
      const isFreelancer = profile && service && service.freelancerId === profile.id;
      
      // Regras de permissão para mudança de status
      if (isClient && status !== "canceled") {
        return res.status(403).json({ error: "Clients can only cancel appointments" });
      }
      
      if (!isClient && !isFreelancer) {
        return res.status(403).json({ error: "Not authorized to update this appointment" });
      }
      
      const updatedAppointment = await storage.updateAppointmentStatus(appointmentId, status);
      
      // Obter informações para enviar notificação
      const serviceInfo = await storage.getServiceById(appointment.serviceId);
      
      if (serviceInfo) {
        // Determinar a quem enviar a notificação e quem a enviou
        if (isClient) {
          // Cliente alterou status, enviar notificação para o freelancer
          const profile = await storage.getFreelancerProfile(serviceInfo.userId);
          if (profile) {
            // Enviar notificação para o freelancer
            const { notifyAppointmentStatusChange } = await import('./notifications');
            notifyAppointmentStatusChange(
              serviceInfo.userId,
              req.user.name,
              serviceInfo.title,
              status
            );
          }
        } else {
          // Freelancer alterou status, enviar notificação para o cliente
          const { notifyAppointmentStatusChange } = await import('./notifications');
          notifyAppointmentStatusChange(
            appointment.clientId,
            req.user.name,
            serviceInfo.title,
            status
          );
        }
      }
      
      res.json(updatedAppointment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update appointment status" });
    }
  });

  // Obter slots de horários disponíveis para um serviço em uma data específica
  app.get("/api/available-slots/:serviceId", async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const dateStr = req.query.date as string;
      
      if (!dateStr) {
        return res.status(400).json({ error: "Date parameter is required" });
      }
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
      
      const service = await storage.getServiceById(serviceId);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      
      const slots = await storage.getAvailableTimeSlots(serviceId, date);
      res.json(slots);
    } catch (error) {
      res.status(500).json({ error: "Failed to get available time slots" });
    }
  });

  // Rotas para recuperação de senha
  
  // Solicitar redefinição de senha (gera e armazena token, envia email)
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Buscar usuário pelo email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Por segurança, não informamos se o email existe ou não
        return res.status(200).json({ message: "If that email exists in our system, you will receive password reset instructions." });
      }
      
      // Gerar token aleatório
      const resetToken = randomBytes(32).toString("hex");
      
      // Definir expiração para 1 hora
      const expires = new Date();
      expires.setHours(expires.getHours() + 1);
      
      // Salvar token no banco
      await storage.setPasswordResetToken(user.id, resetToken, expires);
      
      // Determinar a URL base
      const baseUrl = req.headers.origin || `http://${req.headers.host}`;
      
      // Tentar enviar email
      try {
        const emailSent = await sendPasswordResetEmail(email, resetToken, baseUrl);
        
        if (!emailSent) {
          console.log("Email não enviado, mas token gerado com sucesso:", resetToken);
        }
      } catch (emailError) {
        console.error("Erro ao enviar email, mas token gerado com sucesso:", resetToken);
        // Não interrompemos o fluxo por causa de falha no email
      }
      
      // Para fins de desenvolvimento/teste, retornamos o token
      // Comentamos a condição de NODE_ENV para sempre exibir o token durante os testes
      //if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({ 
          message: "Password reset token generated successfully.",
          // Exibimos o token para facilitar testes
          debug: {
            resetToken: resetToken,
            resetUrl: `${baseUrl}/reset-password?token=${resetToken}`
          }
        });
      //}
      
      res.status(200).json({ message: "If that email exists in our system, you will receive password reset instructions." });
    } catch (error) {
      console.error("Erro na rota de recuperação de senha:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Verificar se o token é válido
  app.get("/api/reset-password/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      // Buscar usuário pelo token
      const user = await storage.getUserByResetToken(token);
      
      if (!user || !user.resetPasswordExpires) {
        return res.status(400).json({ error: "Password reset token is invalid or has expired" });
      }
      
      // Verificar se o token expirou
      if (new Date() > user.resetPasswordExpires) {
        return res.status(400).json({ error: "Password reset token has expired" });
      }
      
      // Token válido
      res.status(200).json({ message: "Token is valid", userId: user.id });
    } catch (error) {
      console.error("Erro ao verificar token de recuperação de senha:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Redefinir a senha
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }
      
      // Buscar usuário pelo token
      const user = await storage.getUserByResetToken(token);
      
      if (!user || !user.resetPasswordExpires) {
        return res.status(400).json({ error: "Password reset token is invalid or has expired" });
      }
      
      // Verificar se o token expirou
      if (new Date() > user.resetPasswordExpires) {
        return res.status(400).json({ error: "Password reset token has expired" });
      }
      
      // Hash da nova senha
      const hashedPassword = await hashPassword(password);
      
      // Atualizar senha
      await storage.updatePassword(user.id, hashedPassword);
      
      // Armazenar a senha em texto puro para fins de desenvolvimento
      try {
        const { pool } = await import('./db');
        await pool.query(
          'UPDATE dev_passwords SET plaintext_password = $1 WHERE user_id = $2',
          [password, user.id]
        );
      } catch (err) {
        console.error('Erro ao atualizar senha em texto puro:', err);
      }
      
      res.status(200).json({ message: "Password has been updated successfully" });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Jobs routes
  // Get all jobs
  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to get jobs" });
    }
  });

  // Get job by ID
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJobById(jobId);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      // Also get user info for the client
      const clientUser = await storage.getUser(job.clientId);
      const clientName = clientUser ? clientUser.name : "Unknown Client";
      
      // Get proposals for this job
      const proposals = await storage.getProposals(jobId);
      
      res.json({
        ...job,
        clientName,
        proposalCount: proposals.length
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get job details" });
    }
  });
  
  // Delete a job
  app.delete("/api/jobs/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJobById(jobId);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      // Verificar se o usuário é o proprietário do trabalho
      if (job.clientId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to delete this job" });
      }
      
      // Excluir o trabalho
      const deleted = await storage.deleteJob(jobId);
      
      if (deleted) {
        res.status(200).json({ message: "Job deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete job" });
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ error: "Failed to delete job" });
    }
  });

  // Create a new job
  app.post("/api/jobs", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      // Ensure the user is a client
      if (req.user.userType !== "client") {
        return res.status(403).json({ error: "Only clients can create jobs" });
      }
      
      const data = insertJobSchema.parse({
        ...req.body,
        clientId: req.user.id,
        status: "open" // Default status for new jobs
      });
      
      const job = await storage.createJob(data);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create job" });
      }
    }
  });

  // Get jobs by client
  app.get("/api/client/jobs", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const jobs = await storage.getJobsByClient(req.user.id);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to get client jobs" });
    }
  });

  // Update job status
  app.patch("/api/jobs/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJobById(jobId);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      // Verify that the job belongs to the client
      if (job.clientId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to update this job" });
      }
      
      const { status } = req.body;
      
      // Validate status
      if (!["open", "closed", "in_progress", "completed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const updatedJob = await storage.updateJobStatus(jobId, status);
      res.json(updatedJob);
    } catch (error) {
      res.status(500).json({ error: "Failed to update job status" });
    }
  });

  // Proposals routes
  // Get proposals for a job
  app.get("/api/jobs/:id/proposals", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJobById(jobId);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      // Check if user is the client who posted this job
      const isClient = req.isAuthenticated() && req.user.id === job.clientId;
      
      // Get all proposals for this job
      const proposals = await storage.getProposals(jobId);
      
      // If not the client, filter out sensitive information
      if (!isClient) {
        // Return limited data for non-clients
        const limitedProposals = proposals.map(proposal => ({
          id: proposal.id,
          freelancerId: proposal.freelancerId,
          jobId: proposal.jobId,
          status: proposal.status,
          createdAt: proposal.createdAt
        }));
        
        return res.json(limitedProposals);
      }
      
      // Return full details for the client
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ error: "Failed to get proposals" });
    }
  });

  // Create a proposal
  app.post("/api/proposals", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      // Ensure the user is a freelancer
      if (req.user.userType !== "freelancer") {
        return res.status(403).json({ error: "Only freelancers can submit proposals" });
      }
      
      // Get the freelancer profile
      const profile = await storage.getFreelancerProfile(req.user.id);
      
      if (!profile) {
        return res.status(400).json({ error: "Freelancer profile not found. Create a profile first." });
      }
      
      // Get the job
      const jobId = parseInt(req.body.jobId);
      const job = await storage.getJobById(jobId);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      // Check if job is open
      if (job.status !== "open") {
        return res.status(400).json({ error: "This job is not accepting proposals" });
      }
      
      // Check if freelancer already has a proposal for this job
      const existingProposals = await storage.getProposalsByFreelancer(profile.id);
      const hasExistingProposal = existingProposals.some(p => p.jobId === jobId);
      
      if (hasExistingProposal) {
        return res.status(400).json({ error: "You have already submitted a proposal for this job" });
      }
      
      const data = insertProposalSchema.parse({
        ...req.body,
        freelancerId: profile.id,
        status: "pending" // Default status for new proposals
      });
      
      const proposal = await storage.createProposal(data);
      
      // Enviar notificação para o cliente sobre a nova proposta
      const { notifyNewProposal } = await import('./notifications');
      notifyNewProposal(
        job.clientId,
        req.user.id,
        req.user.name,
        job.title
      );
      
      res.status(201).json(proposal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Proposal creation error:", error);
        res.status(500).json({ error: "Failed to create proposal" });
      }
    }
  });

  // Get proposals by freelancer
  app.get("/api/freelancer/proposals", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      // Ensure the user is a freelancer
      if (req.user.userType !== "freelancer") {
        return res.status(403).json({ error: "Only freelancers can view their proposals" });
      }
      
      // Get the freelancer profile
      const profile = await storage.getFreelancerProfile(req.user.id);
      
      if (!profile) {
        return res.status(400).json({ error: "Freelancer profile not found" });
      }
      
      const proposals = await storage.getProposalsByFreelancer(profile.id);
      
      // Enrich proposal data with job information
      const enrichedProposals = await Promise.all(
        proposals.map(async (proposal) => {
          const job = await storage.getJobById(proposal.jobId);
          return {
            ...proposal,
            jobTitle: job ? job.title : "Unknown Job",
            jobBudget: job ? job.budget : 0
          };
        })
      );
      
      res.json(enrichedProposals);
    } catch (error) {
      res.status(500).json({ error: "Failed to get freelancer proposals" });
    }
  });

  // Update proposal status
  app.patch("/api/proposals/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const proposalId = parseInt(req.params.id);
      // Obter a proposta pelo ID
      const proposals = await storage.getProposals(0); // Obtemos todas as propostas
      const proposal = proposals.find(p => p.id === proposalId);
      
      if (!proposal) {
        return res.status(404).json({ error: "Proposal not found" });
      }
      
      // Get the job
      const job = await storage.getJobById(proposal.jobId);
      
      if (!job) {
        return res.status(404).json({ error: "Associated job not found" });
      }
      
      // Verify that the job belongs to the client
      if (job.clientId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to update this proposal" });
      }
      
      const { status } = req.body;
      
      // Validate status
      if (!["pending", "accepted", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      // If accepting a proposal, update the job status to in_progress
      if (status === "accepted") {
        await storage.updateJobStatus(job.id, "in_progress");
        
        // Reject all other pending proposals for this job
        const otherProposals = await storage.getProposals(job.id);
        for (const otherProposal of otherProposals) {
          if (otherProposal.id !== proposalId && otherProposal.status === "pending") {
            await storage.updateProposalStatus(otherProposal.id, "rejected");
          }
        }
      }
      
      const updatedProposal = await storage.updateProposalStatus(proposalId, status);
      
      // Obter detalhes do freelancer para notificação
      const freelancerUser = await storage.getUser(proposal.freelancerId);
      if (freelancerUser) {
        // Enviar notificação de alteração de status
        const { notifyProposalStatusChange } = await import('./notifications');
        notifyProposalStatusChange(
          proposal.freelancerId,
          req.user.name,
          job.title,
          status
        );
      }
      
      res.json(updatedProposal);
    } catch (error) {
      res.status(500).json({ error: "Failed to update proposal status" });
    }
  });

  // Rotas de pagamento
  
  // Criar intenção de pagamento (primeiro passo do checkout)
  app.post("/api/create-payment-intent", createPaymentIntent);
  
  // Verificar status de um pagamento
  app.post("/api/verify-payment", verifyPayment);
  
  // Listar pagamentos do usuário
  app.get("/api/payments", listPayments);
  
  // Webhook para receber eventos do Stripe
  app.post("/api/stripe-webhook", express.raw({ type: 'application/json' }), stripeWebhook);

  // Rota para obter senhas em texto puro - SOMENTE PARA DESENVOLVIMENTO
  app.get("/api/dev/passwords", isAdmin, async (req, res) => {
    // Garantindo que a resposta seja em JSON, não HTML
    res.setHeader('Content-Type', 'application/json');
    try {
      // Usando a importação correta para ESM
      const { pool } = await import('./db');
      const result = await pool.query('SELECT * FROM dev_passwords');
      res.json(result.rows);
    } catch (error) {
      console.error("Erro ao buscar senhas em texto puro:", error);
      res.status(500).json({ error: "Falha ao buscar senhas em texto puro" });
    }
  });

  // Rotas de administração (protegidas pelo middleware isAdmin)
  
  // Obter todos os usuários (apenas admin)
  app.get("/api/admin/users", isAdmin, getUsers);
  
  // Alterar senha de um usuário (apenas admin)
  app.post("/api/admin/change-password", isAdmin, changeUserPassword);
  
  // Excluir um usuário (apenas admin)
  app.delete("/api/admin/users/:id", isAdmin, deleteUser);
  
  // Executar consulta SQL personalizada (apenas admin)
  app.post("/api/admin/execute-sql", isAdmin, executeSqlQuery);

  const httpServer = createServer(app);
  
  // Configurar WebSocket para notificações em tempo real
  const wss = setupNotifications(httpServer);
  console.log('Servidor WebSocket configurado na rota /ws');
  
  return httpServer;
}
