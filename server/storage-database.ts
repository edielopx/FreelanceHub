import { users, freelancerProfiles, services, reviews, messages, appointments, jobs, proposals } from "@shared/schema";
import type { User, InsertUser, FreelancerProfile, InsertFreelancerProfile, Service, InsertService, Review, InsertReview, Message, InsertMessage, FreelancerWithDetails, Appointment, InsertAppointment, AppointmentStatus, Job, InsertJob, Proposal, InsertProposal } from "@shared/schema";
import session from "express-session";
import { db, pool } from "./db";
import { eq, and, or, desc, sql, gt, gte, lte, like } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import type { IStorage } from "./storage";
// Resolver problema de referência circular
import "./config";

// Workaround for SessionStore type
declare module "express-session" {
  interface SessionStore {
    all: Function;
    destroy: Function;
    clear: Function;
    length: Function;
    get: Function;
    set: Function;
    touch: Function;
  }
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      tableName: 'session',
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Password reset operations
  async setPasswordResetToken(userId: number, token: string, expires: Date): Promise<boolean> {
    const result = await db
      .update(users)
      .set({
        resetPasswordToken: token,
        resetPasswordExpires: expires
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result.length > 0;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.resetPasswordToken, token),
          gt(users.resetPasswordExpires, new Date())
        )
      );
    
    return user;
  }

  async updatePassword(userId: number, newPassword: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({
        password: newPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result.length > 0;
  }

  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Freelancer profile operations
  async getFreelancerProfile(userId: number): Promise<FreelancerProfile | undefined> {
    const [profile] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, userId));
    return profile;
  }

  async createFreelancerProfile(insertProfile: InsertFreelancerProfile): Promise<FreelancerProfile> {
    const [profile] = await db
      .insert(freelancerProfiles)
      .values(insertProfile)
      .returning();
    return profile;
  }

  async updateFreelancerProfile(id: number, profileUpdate: Partial<FreelancerProfile>): Promise<FreelancerProfile | undefined> {
    const [updatedProfile] = await db
      .update(freelancerProfiles)
      .set(profileUpdate)
      .where(eq(freelancerProfiles.id, id))
      .returning();
    return updatedProfile;
  }

  // Service operations
  async getServices(freelancerId: number): Promise<Service[]> {
    return db
      .select()
      .from(services)
      .where(eq(services.freelancerId, freelancerId));
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(insertService)
      .returning();
    return service;
  }
  
  async getServiceById(serviceId: number): Promise<Service | undefined> {
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, serviceId));
    return service;
  }

  // Review operations
  async getReviews(freelancerId: number): Promise<Review[]> {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.freelancerId, freelancerId));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(insertReview)
      .returning();
    return review;
  }

  async getAverageRating(freelancerId: number): Promise<number> {
    const result = await db
      .select({ 
        avgRating: sql<number>`AVG(${reviews.rating})` 
      })
      .from(reviews)
      .where(eq(reviews.freelancerId, freelancerId));
    
    return result[0]?.avgRating || 0;
  }

  // Message operations
  async getMessages(senderId: number, receiverId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, senderId),
            eq(messages.receiverId, receiverId)
          ),
          and(
            eq(messages.senderId, receiverId),
            eq(messages.receiverId, senderId)
          )
        )
      )
      .orderBy(messages.timestamp);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async markMessagesAsRead(receiverId: number, senderId: number): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(
        and(
          eq(messages.receiverId, receiverId),
          eq(messages.senderId, senderId),
          eq(messages.read, false)
        )
      );
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    const result = await db
      .select({ 
        count: sql<number>`COUNT(*)` 
      })
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.read, false)
        )
      );
    
    return result[0]?.count || 0;
  }
  
  async getContacts(userId: number): Promise<{ user: User; lastMessage?: Message; unreadCount: number }[]> {
    // Encontrar todos os usuários com quem o usuário atual trocou mensagens
    const uniqueContacts = await db.execute(sql`
      SELECT DISTINCT 
        CASE 
          WHEN sender_id = ${userId} THEN receiver_id 
          ELSE sender_id 
        END as contact_id
      FROM messages
      WHERE sender_id = ${userId} OR receiver_id = ${userId}
    `);
    
    const contacts = [];
    
    for (const row of uniqueContacts.rows) {
      const contactId = row.contact_id;
      
      // Buscar o usuário
      const [contactUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, contactId));
      
      if (!contactUser) continue;
      
      // Buscar a última mensagem
      const [lastMessage] = await db
        .select()
        .from(messages)
        .where(
          or(
            and(
              eq(messages.senderId, userId),
              eq(messages.receiverId, contactId)
            ),
            and(
              eq(messages.senderId, contactId),
              eq(messages.receiverId, userId)
            )
          )
        )
        .orderBy(desc(messages.timestamp))
        .limit(1);
      
      // Contar mensagens não lidas
      const [unreadResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(
          and(
            eq(messages.receiverId, userId),
            eq(messages.senderId, contactId),
            eq(messages.read, false)
          )
        );
      
      contacts.push({
        user: contactUser,
        lastMessage,
        unreadCount: unreadResult?.count || 0
      });
    }
    
    return contacts;
  }

  // Appointment operations
  async getAppointments(userId: number, role: "client" | "freelancer"): Promise<Appointment[]> {
    if (role === "client") {
      return this.getClientAppointments(userId);
    } else {
      // Para freelancers, precisamos encontrar todos os serviços do freelancer
      const freeLancerProfile = await this.getFreelancerProfile(userId);
      
      if (!freeLancerProfile) {
        return [];
      }
      
      const freeLancerServices = await this.getServices(freeLancerProfile.id);
      
      if (freeLancerServices.length === 0) {
        return [];
      }
      
      // Recupera todos os agendamentos para todos os serviços do freelancer
      const serviceIds = freeLancerServices.map(service => service.id);
      
      return db
        .select()
        .from(appointments)
        .where(sql`${appointments.serviceId} IN (${serviceIds.join(', ')})`);
    }
  }

  async getAppointmentById(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));
    
    return appointment;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db
      .insert(appointments)
      .values(appointment)
      .returning();
      
    return newAppointment;
  }

  async updateAppointmentStatus(id: number, status: AppointmentStatus): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, id))
      .returning();
      
    return updatedAppointment;
  }

  async getFreelancerAppointments(serviceId: number, status?: AppointmentStatus): Promise<Appointment[]> {
    let query = db
      .select()
      .from(appointments)
      .where(eq(appointments.serviceId, serviceId));
      
    if (status) {
      query = query.where(eq(appointments.status, status));
    }
    
    return query;
  }

  async getClientAppointments(clientId: number, status?: AppointmentStatus): Promise<Appointment[]> {
    let query = db
      .select()
      .from(appointments)
      .where(eq(appointments.clientId, clientId));
      
    if (status) {
      query = query.where(eq(appointments.status, status));
    }
    
    return query;
  }

  async getAvailableTimeSlots(serviceId: number, date: Date): Promise<{startTime: Date, endTime: Date}[]> {
    // Configurar o início e fim do dia
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Buscar agendamentos existentes para este serviço e data
    const existingAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.serviceId, serviceId),
          gte(appointments.appointmentDate, startOfDay),
          lte(appointments.appointmentDate, endOfDay),
          sql`${appointments.status} != 'canceled'`
        )
      );
    
    // Horários de trabalho: 8h às 18h em slots de 1 hora
    const workHours = [];
    
    // Verificar disponibilidade para cada horário
    for (let hour = 8; hour < 18; hour++) {
      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(date);
      endTime.setHours(hour + 1, 0, 0, 0);
      
      // Verificar se este horário está disponível
      const isAvailable = !existingAppointments.some(appointment => {
        const appointmentStart = new Date(appointment.appointmentDate);
        const appointmentEnd = new Date(appointment.endTime);
        
        return (
          (startTime >= appointmentStart && startTime < appointmentEnd) ||
          (endTime > appointmentStart && endTime <= appointmentEnd) ||
          (startTime <= appointmentStart && endTime >= appointmentEnd)
        );
      });
      
      if (isAvailable) {
        workHours.push({ startTime, endTime });
      }
    }
    
    return workHours;
  }

  // Job operations
  async getJobs(): Promise<Job[]> {
    return db
      .select()
      .from(jobs);
  }

  async getJobById(id: number): Promise<Job | undefined> {
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id));
      
    return job;
  }

  async getJobsByClient(clientId: number): Promise<Job[]> {
    return db
      .select()
      .from(jobs)
      .where(eq(jobs.clientId, clientId));
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db
      .insert(jobs)
      .values(job)
      .returning();
      
    return newJob;
  }

  async updateJobStatus(id: number, status: string): Promise<Job | undefined> {
    const [updatedJob] = await db
      .update(jobs)
      .set({ status })
      .where(eq(jobs.id, id))
      .returning();
      
    return updatedJob;
  }
  
  async deleteJob(id: number): Promise<boolean> {
    try {
      // Primeiro, excluir todas as propostas relacionadas a este trabalho
      await db
        .delete(proposals)
        .where(eq(proposals.jobId, id));
      
      // Excluir o trabalho
      const result = await db
        .delete(jobs)
        .where(eq(jobs.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting job:", error);
      return false;
    }
  }

  // Proposal operations
  async getProposals(jobId: number): Promise<Proposal[]> {
    return db
      .select()
      .from(proposals)
      .where(eq(proposals.jobId, jobId));
  }

  async getProposalsByFreelancer(freelancerId: number): Promise<Proposal[]> {
    return db
      .select()
      .from(proposals)
      .where(eq(proposals.freelancerId, freelancerId));
  }

  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const [newProposal] = await db
      .insert(proposals)
      .values(proposal)
      .returning();
      
    return newProposal;
  }

  async updateProposalStatus(id: number, status: string): Promise<Proposal | undefined> {
    const [updatedProposal] = await db
      .update(proposals)
      .set({ status })
      .where(eq(proposals.id, id))
      .returning();
      
    return updatedProposal;
  }

  // Search operations
  async searchFreelancers(options: {
    query?: string;
    category?: string;
    location?: string;
    maxDistance?: number;
    minRating?: number;
    minPrice?: number;
    maxPrice?: number;
    latitude?: number;
    longitude?: number;
  }): Promise<FreelancerWithDetails[]> {
    // First, we get all freelancer profiles with their users
    let freelancerQuery = db
      .select({
        user: users,
        profile: freelancerProfiles,
      })
      .from(freelancerProfiles)
      .innerJoin(users, eq(freelancerProfiles.userId, users.id));

    // Apply filters
    const filters = [];
    
    if (options.category) {
      filters.push(eq(freelancerProfiles.category, options.category));
    }
    
    if (options.minPrice !== undefined) {
      filters.push(gte(freelancerProfiles.hourlyRate, options.minPrice));
    }
    
    if (options.maxPrice !== undefined) {
      filters.push(lte(freelancerProfiles.hourlyRate, options.maxPrice));
    }
    
    if (options.location) {
      filters.push(like(users.location, `%${options.location}%`));
    }
    
    if (options.query) {
      const likePattern = `%${options.query}%`;
      filters.push(
        or(
          like(users.name, likePattern),
          like(freelancerProfiles.title, likePattern),
          sql`${freelancerProfiles.skills}::text[] && ARRAY[${options.query}]`
        )
      );
    }
    
    if (filters.length > 0) {
      freelancerQuery = freelancerQuery.where(and(...filters));
    }
    
    const freelancersWithUsers = await freelancerQuery;
    
    // Get ratings and review counts
    const result: FreelancerWithDetails[] = await Promise.all(
      freelancersWithUsers.map(async ({ user, profile }) => {
        const avgRating = await this.getAverageRating(profile.id);
        const reviews = await this.getReviews(profile.id);
        
        // Calculate distance if coordinates are provided
        let distance: number | undefined = undefined;
        if (
          options.latitude && 
          options.longitude && 
          user.latitude && 
          user.longitude
        ) {
          distance = this.calculateDistance(
            options.latitude,
            options.longitude,
            user.latitude,
            user.longitude
          );
        }
        
        return {
          user,
          profile,
          avgRating,
          reviewCount: reviews.length,
          distance
        };
      })
    );
    
    // Filter by distance and rating (post-database filters)
    let filteredResult = result.filter(freelancer => {
      // Filter by distance
      if (
        options.maxDistance !== undefined && 
        freelancer.distance !== undefined && 
        freelancer.distance > options.maxDistance
      ) {
        return false;
      }
      
      // Filter by rating
      if (
        options.minRating !== undefined && 
        freelancer.avgRating < options.minRating
      ) {
        return false;
      }
      
      return true;
    });
    
    // Aplicar ordenação com base no parâmetro sortBy
    if (options.sortBy) {
      switch (options.sortBy) {
        case "rating":
          // Ordenar por avaliação mais alta primeiro
          filteredResult.sort((a, b) => b.avgRating - a.avgRating);
          break;
        case "price_asc":
          // Ordenar por preço ascendente (menor primeiro)
          filteredResult.sort((a, b) => a.profile.hourlyRate - b.profile.hourlyRate);
          break;
        case "price_desc":
          // Ordenar por preço descendente (maior primeiro)
          filteredResult.sort((a, b) => b.profile.hourlyRate - a.profile.hourlyRate);
          break;
        case "distance":
          // Ordenar por proximidade, tratando casos onde a distância é indefinida
          filteredResult.sort((a, b) => {
            // Se ambos têm distâncias, compará-las
            if (a.distance !== undefined && b.distance !== undefined) {
              return a.distance - b.distance;
            }
            // Se apenas a tem distância, ele vem primeiro
            if (a.distance !== undefined) return -1;
            // Se apenas b tem distância, ele vem primeiro
            if (b.distance !== undefined) return 1;
            // Se nenhum tem distância, manter ordem
            return 0;
          });
          break;
      }
    }
    
    return filteredResult;
  }

  // Helper method for distance calculation
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Simplified Haversine formula to calculate distance in kilometers
    const R = 6371; // Radius of earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}