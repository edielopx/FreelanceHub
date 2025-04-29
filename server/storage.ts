import { users, freelancerProfiles, services, reviews, messages, appointments, jobs, proposals, tutorialProgress } from "@shared/schema";
import type { User, InsertUser, FreelancerProfile, InsertFreelancerProfile, Service, InsertService, Review, InsertReview, Message, InsertMessage, Appointment, InsertAppointment, AppointmentStatus, FreelancerWithDetails, Job, InsertJob, Proposal, InsertProposal, TutorialProgressRecord, InsertTutorialProgress } from "@shared/schema";
import { TutorialStep } from "@shared/tutorial";
import session from "express-session";
import createMemoryStore from "memorystore";


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

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined>;

  // Password reset operations
  setPasswordResetToken(userId: number, token: string, expires: Date): Promise<boolean>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  updatePassword(userId: number, newPassword: string): Promise<boolean>;

  // Freelancer profile operations
  getFreelancerProfile(userId: number): Promise<FreelancerProfile | undefined>;
  createFreelancerProfile(profile: InsertFreelancerProfile): Promise<FreelancerProfile>;
  updateFreelancerProfile(id: number, profileUpdate: Partial<FreelancerProfile>): Promise<FreelancerProfile | undefined>;

  // Service operations
  getServices(freelancerId: number): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  getServiceById(serviceId: number): Promise<Service | undefined>;

  // Review operations
  getReviews(freelancerId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  getAverageRating(freelancerId: number): Promise<number>;

  // Message operations
  getMessages(senderId: number, receiverId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(receiverId: number, senderId: number): Promise<void>;
  getUnreadMessageCount(userId: number): Promise<number>;

  // Appointment operations
  getAppointments(userId: number, role: "client" | "freelancer"): Promise<Appointment[]>;
  getAppointmentById(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(id: number, status: AppointmentStatus): Promise<Appointment | undefined>;
  getFreelancerAppointments(serviceId: number, status?: AppointmentStatus): Promise<Appointment[]>;
  getClientAppointments(clientId: number, status?: AppointmentStatus): Promise<Appointment[]>;
  getAvailableTimeSlots(serviceId: number, date: Date): Promise<{startTime: Date, endTime: Date}[]>;

  // Job operations
  getJobs(): Promise<Job[]>;
  getJobById(id: number): Promise<Job | undefined>;
  getJobsByClient(clientId: number): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJobStatus(id: number, status: string): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;

  // Proposal operations
  getProposals(jobId: number): Promise<Proposal[]>;
  getProposalsByFreelancer(freelancerId: number): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposalStatus(id: number, status: string): Promise<Proposal | undefined>;

  // Search operations
  searchFreelancers(options: {
    query?: string;
    category?: string;
    location?: string;
    estado?: string;
    cidade?: string;
    maxDistance?: number;
    minRating?: number;
    minPrice?: number;
    maxPrice?: number;
    latitude?: number;
    longitude?: number;
    sortBy?: string;
  }): Promise<FreelancerWithDetails[]>;

  // Tutorial operations
  getTutorialProgress(userId: number): Promise<TutorialProgressRecord | undefined>;
  createTutorialProgress(progress: InsertTutorialProgress): Promise<TutorialProgressRecord>;
  updateTutorialProgress(userId: number, updates: Partial<TutorialProgressRecord>): Promise<TutorialProgressRecord | undefined>;
  completeStep(userId: number, step: TutorialStep): Promise<TutorialProgressRecord | undefined>;
  awardBadge(userId: number, badgeId: string): Promise<TutorialProgressRecord | undefined>;
  addPoints(userId: number, points: number): Promise<TutorialProgressRecord | undefined>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private freelancerProfiles: Map<number, FreelancerProfile>;
  private services: Map<number, Service>;
  private reviews: Map<number, Review>;
  private messages: Map<number, Message>;
  private appointments: Map<number, Appointment>;
  private jobs: Map<number, Job>;
  private proposals: Map<number, Proposal>;
  private tutorialProgress: Map<number, TutorialProgressRecord>;
  sessionStore: session.SessionStore;

  private currentUserId: number;
  private currentFreelancerProfileId: number;
  private currentServiceId: number;
  private currentReviewId: number;
  private currentMessageId: number;
  private currentAppointmentId: number;
  private currentJobId: number;
  private currentProposalId: number;
  private currentTutorialProgressId: number;

  constructor() {
    this.users = new Map();
    this.freelancerProfiles = new Map();
    this.services = new Map();
    this.reviews = new Map();
    this.messages = new Map();
    this.appointments = new Map();
    this.jobs = new Map();
    this.proposals = new Map();
    this.tutorialProgress = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    this.currentUserId = 1;
    this.currentFreelancerProfileId = 1;
    this.currentServiceId = 1;
    this.currentReviewId = 1;
    this.currentMessageId = 1;
    this.currentAppointmentId = 1;
    this.currentJobId = 1;
    this.currentProposalId = 1;
    this.currentTutorialProgressId = 1;

    // Add some initial data for testing
    this.addInitialData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  // Password reset operations
  async setPasswordResetToken(userId: number, token: string, expires: Date): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const updatedUser = { 
      ...user, 
      resetPasswordToken: token,
      resetPasswordExpires: expires 
    };
    
    this.users.set(userId, updatedUser);
    return true;
  }
  
  async getUserByResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.resetPasswordToken === token && 
                user.resetPasswordExpires && 
                user.resetPasswordExpires > new Date()
    );
  }
  
  async updatePassword(userId: number, newPassword: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const updatedUser = { 
      ...user, 
      password: newPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    };
    
    this.users.set(userId, updatedUser);
    return true;
  }

  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Freelancer profile operations
  async getFreelancerProfile(userId: number): Promise<FreelancerProfile | undefined> {
    return Array.from(this.freelancerProfiles.values()).find(
      (profile) => profile.userId === userId,
    );
  }

  async createFreelancerProfile(insertProfile: InsertFreelancerProfile): Promise<FreelancerProfile> {
    const id = this.currentFreelancerProfileId++;
    const profile: FreelancerProfile = { ...insertProfile, id };
    this.freelancerProfiles.set(id, profile);
    return profile;
  }

  async updateFreelancerProfile(id: number, profileUpdate: Partial<FreelancerProfile>): Promise<FreelancerProfile | undefined> {
    const profile = this.freelancerProfiles.get(id);
    if (!profile) return undefined;
    
    const updatedProfile = { ...profile, ...profileUpdate };
    this.freelancerProfiles.set(id, updatedProfile);
    return updatedProfile;
  }

  // Service operations
  async getServices(freelancerId: number): Promise<Service[]> {
    return Array.from(this.services.values()).filter(
      (service) => service.freelancerId === freelancerId,
    );
  }

  async getServiceById(serviceId: number): Promise<Service | undefined> {
    return this.services.get(serviceId);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = this.currentServiceId++;
    const service: Service = { ...insertService, id };
    this.services.set(id, service);
    return service;
  }

  // Review operations
  async getReviews(freelancerId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.freelancerId === freelancerId,
    );
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const now = new Date();
    const review: Review = { ...insertReview, id, createdAt: now };
    this.reviews.set(id, review);
    return review;
  }

  async getAverageRating(freelancerId: number): Promise<number> {
    const reviews = await this.getReviews(freelancerId);
    if (reviews.length === 0) return 0;
    
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }

  // Message operations
  async getMessages(senderId: number, receiverId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => 
        (message.senderId === senderId && message.receiverId === receiverId) ||
        (message.senderId === receiverId && message.receiverId === senderId),
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const now = new Date();
    const message: Message = { ...insertMessage, id, timestamp: now, read: false };
    this.messages.set(id, message);
    return message;
  }

  async markMessagesAsRead(receiverId: number, senderId: number): Promise<void> {
    for (const [id, message] of this.messages.entries()) {
      if (message.receiverId === receiverId && message.senderId === senderId && !message.read) {
        this.messages.set(id, { ...message, read: true });
      }
    }
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    return Array.from(this.messages.values()).filter(
      (message) => message.receiverId === userId && !message.read
    ).length;
  }
  
  async getContacts(userId: number): Promise<{ user: User; lastMessage?: Message; unreadCount: number }[]> {
    // Buscar todos os usuários com quem o usuário atual trocou mensagens
    const userMessages = Array.from(this.messages.values()).filter(
      (message) => message.senderId === userId || message.receiverId === userId
    );
    
    // Extrair os IDs únicos dos contatos
    const contactIds = new Set<number>();
    userMessages.forEach(message => {
      if (message.senderId === userId) {
        contactIds.add(message.receiverId);
      } else if (message.receiverId === userId) {
        contactIds.add(message.senderId);
      }
    });
    
    // Buscar informações de cada contato e suas mensagens
    const contacts = Array.from(contactIds).map(contactId => {
      // Buscar usuário
      const user = this.users.get(contactId);
      
      if (!user) {
        return null;
      }
      
      // Filtrar mensagens entre o usuário atual e este contato
      const threadMessages = userMessages.filter(
        message => 
          (message.senderId === userId && message.receiverId === contactId) ||
          (message.senderId === contactId && message.receiverId === userId)
      );
      
      // Ordenar mensagens por data
      threadMessages.sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime;
      });
      
      // Última mensagem
      const lastMessage = threadMessages.length > 0 ? threadMessages[0] : undefined;
      
      // Contar mensagens não lidas
      const unreadCount = threadMessages.filter(
        message => message.receiverId === userId && !message.read
      ).length;
      
      return {
        user,
        lastMessage,
        unreadCount
      };
    }).filter(Boolean) as { user: User; lastMessage?: Message; unreadCount: number }[];
    
    return contacts;
  }

  // Appointment operations
  async getAppointments(userId: number, role: "client" | "freelancer"): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(appointment => {
      if (role === "client") {
        return appointment.clientId === userId;
      } else {
        // Para freelancers, precisamos verificar se o serviço pertence a eles
        const service = this.services.get(appointment.serviceId);
        return service?.freelancerId === userId;
      }
    });
  }

  async getAppointmentById(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const newAppointment: Appointment = { 
      ...appointment, 
      id,
      createdAt: new Date()
    };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }

  async updateAppointmentStatus(id: number, status: AppointmentStatus): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { ...appointment, status };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async getFreelancerAppointments(serviceId: number, status?: AppointmentStatus): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(appointment => {
      if (appointment.serviceId !== serviceId) return false;
      if (status && appointment.status !== status) return false;
      return true;
    });
  }

  async getClientAppointments(clientId: number, status?: AppointmentStatus): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(appointment => {
      if (appointment.clientId !== clientId) return false;
      if (status && appointment.status !== status) return false;
      return true;
    });
  }

  async getAvailableTimeSlots(serviceId: number, date: Date): Promise<{startTime: Date, endTime: Date}[]> {
    // Encontrar todos os agendamentos para este serviço nesta data
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingAppointments = Array.from(this.appointments.values()).filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointment.serviceId === serviceId && 
             appointmentDate >= startOfDay && 
             appointmentDate <= endOfDay &&
             appointment.status !== "canceled";
    });
    
    // Horários de trabalho: 8h às 18h
    const workHours = [];
    const service = this.services.get(serviceId);
    if (!service) return [];
    
    // Criar slots de 1 hora, das 8h às 18h
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
    return Array.from(this.jobs.values());
  }

  async getJobById(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getJobsByClient(clientId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.clientId === clientId);
  }

  async createJob(job: InsertJob): Promise<Job> {
    const id = this.currentJobId++;
    const now = new Date();
    const newJob: Job = { ...job, id, createdAt: now };
    this.jobs.set(id, newJob);
    return newJob;
  }

  async updateJobStatus(id: number, status: string): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    
    const updatedJob = { ...job, status };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }
  
  async deleteJob(id: number): Promise<boolean> {
    // Verificar se o trabalho existe
    if (!this.jobs.has(id)) {
      return false;
    }
    
    // Excluir todas as propostas relacionadas a este trabalho
    const proposalsToDelete = Array.from(this.proposals.entries())
      .filter(([_, proposal]) => proposal.jobId === id);
      
    for (const [proposalId, _] of proposalsToDelete) {
      this.proposals.delete(proposalId);
    }
    
    // Excluir o trabalho
    return this.jobs.delete(id);
  }

  // Proposal operations
  async getProposals(jobId: number): Promise<Proposal[]> {
    return Array.from(this.proposals.values()).filter(proposal => proposal.jobId === jobId);
  }

  async getProposalsByFreelancer(freelancerId: number): Promise<Proposal[]> {
    return Array.from(this.proposals.values()).filter(proposal => proposal.freelancerId === freelancerId);
  }

  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const id = this.currentProposalId++;
    const now = new Date();
    const newProposal: Proposal = { ...proposal, id, createdAt: now };
    this.proposals.set(id, newProposal);
    return newProposal;
  }

  async updateProposalStatus(id: number, status: string): Promise<Proposal | undefined> {
    const proposal = this.proposals.get(id);
    if (!proposal) return undefined;
    
    const updatedProposal = { ...proposal, status };
    this.proposals.set(id, updatedProposal);
    return updatedProposal;
  }

  // Search operations
  async searchFreelancers(options: {
    query?: string;
    category?: string;
    location?: string;
    estado?: string;
    cidade?: string;
    maxDistance?: number;
    minRating?: number;
    minPrice?: number;
    maxPrice?: number;
    latitude?: number;
    longitude?: number;
    sortBy?: string;
  }): Promise<FreelancerWithDetails[]> {
    // Get all freelancer profiles
    const profiles = Array.from(this.freelancerProfiles.values());
    
    // Create result with user details and ratings
    const result: FreelancerWithDetails[] = await Promise.all(
      profiles.map(async (profile) => {
        const user = this.users.get(profile.userId);
        if (!user) throw new Error(`User not found for profile: ${profile.id}`);
        
        const avgRating = await this.getAverageRating(profile.id);
        const reviewCount = (await this.getReviews(profile.id)).length;
        
        // Calculate distance if coordinates are provided
        let distance: number | undefined = undefined;
        if (options.latitude && options.longitude && user.latitude && user.longitude) {
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
          reviewCount,
          distance
        };
      })
    );
    
    // Apply filters
    let filteredResults = result.filter(freelancer => {
      // Filter by query (name, title, skills)
      if (options.query) {
        const query = options.query.toLowerCase();
        const nameMatch = freelancer.user.name.toLowerCase().includes(query);
        const titleMatch = freelancer.profile.title.toLowerCase().includes(query);
        const skillsMatch = freelancer.profile.skills.some(skill => 
          skill.toLowerCase().includes(query)
        );
        
        if (!nameMatch && !titleMatch && !skillsMatch) return false;
      }
      
      // Filter by category
      if (options.category && freelancer.profile.category !== options.category) {
        return false;
      }
      
      // Filter by location
      if (options.location && !freelancer.user.location?.toLowerCase().includes(options.location.toLowerCase())) {
        return false;
      }
      
      // Filter by estado (state)
      if (options.estado && options.estado !== "" && freelancer.user.location) {
        const locationLower = freelancer.user.location.toLowerCase();
        const estadoLower = options.estado.toLowerCase();
        
        // Verifica se o estado está na localização (formato "Cidade, UF" ou no final)
        if (!locationLower.includes(`, ${estadoLower}`) && 
            !locationLower.endsWith(` ${estadoLower}`) && 
            !locationLower.includes(`-${estadoLower}`) &&
            !locationLower.includes(`(${estadoLower})`) && 
            !locationLower.includes(` - ${estadoLower}`)) {
          return false;
        }
      }
      
      // Filter by cidade (city)
      if (options.cidade && options.cidade !== "" && freelancer.user.location) {
        const locationLower = freelancer.user.location.toLowerCase();
        const cidadeLower = options.cidade.toLowerCase();
        
        // Primeiro, tratar caso especial de "cidade, UF"
        if (cidadeLower.includes(",")) {
          const [cidade, uf] = cidadeLower.split(",").map(s => s.trim());
          
          // Verificar se tanto a cidade quanto o UF estão presentes
          if (!locationLower.includes(cidade) || 
              (!locationLower.includes(uf) && !locationLower.includes(uf.toUpperCase()))) {
            return false;
          }
        } 
        // Caso normal - apenas a cidade
        else if (!locationLower.startsWith(cidadeLower) && 
            !locationLower.includes(` ${cidadeLower}`) && 
            !locationLower.includes(`${cidadeLower},`) &&
            !locationLower.includes(`${cidadeLower} -`)) {
          return false;
        }
      }
      
      // Filter by distance
      if (options.maxDistance !== undefined && freelancer.distance !== undefined) {
        if (freelancer.distance > options.maxDistance) return false;
      }
      
      // Filter by minimum rating
      if (options.minRating !== undefined && freelancer.avgRating < options.minRating) {
        return false;
      }
      
      // Filter by price range
      if (options.minPrice !== undefined && freelancer.profile.hourlyRate < options.minPrice) {
        return false;
      }
      
      if (options.maxPrice !== undefined && freelancer.profile.hourlyRate > options.maxPrice) {
        return false;
      }
      
      return true;
    });
    
    // Apply sorting based on the sortBy parameter
    if (options.sortBy) {
      switch (options.sortBy) {
        case "rating":
          // Sort by highest rating first
          filteredResults.sort((a, b) => b.avgRating - a.avgRating);
          break;
        case "price_asc":
          // Sort by price ascending (lowest first)
          filteredResults.sort((a, b) => a.profile.hourlyRate - b.profile.hourlyRate);
          break;
        case "price_desc":
          // Sort by price descending (highest first)
          filteredResults.sort((a, b) => b.profile.hourlyRate - a.profile.hourlyRate);
          break;
        case "distance":
          // Sort by closest first, handle cases where distance is undefined
          filteredResults.sort((a, b) => {
            // If both have distances, compare them
            if (a.distance !== undefined && b.distance !== undefined) {
              return a.distance - b.distance;
            }
            // If only a has distance, it comes first
            if (a.distance !== undefined) return -1;
            // If only b has distance, it comes first
            if (b.distance !== undefined) return 1;
            // If neither has distance, keep order
            return 0;
          });
          break;
      }
    }
    
    return filteredResults;
  }

  // Helper methods
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Simplified version of the Haversine formula to calculate distance in kilometers
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

  private addInitialData() {
    // Just add a few sample users for testing
    const users: InsertUser[] = [
      {
        username: "ana_souza",
        password: "password123",
        email: "ana@example.com",
        name: "Ana Souza",
        profileImage: "https://images.unsplash.com/photo-1573497019236-61f323342eb4?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
        userType: "freelancer",
        bio: "Designer UX/UI com 5 anos de experiência em interfaces de alta qualidade. Especializada em aplicativos móveis e web design responsivo.",
        location: "São Paulo, SP",
        latitude: -23.5505,
        longitude: -46.6333,
      },
      {
        username: "carlos_mendes",
        password: "password123",
        email: "carlos@example.com",
        name: "Carlos Mendes",
        profileImage: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
        userType: "freelancer",
        bio: "Desenvolvedor full stack com foco em aplicações web modernas e escaláveis. Experiência com grandes empresas e startups.",
        location: "São Paulo, SP",
        latitude: -23.5587,
        longitude: -46.6419,
      },
      {
        username: "mariana_costa",
        password: "password123",
        email: "mariana@example.com",
        name: "Mariana Costa",
        profileImage: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
        userType: "freelancer",
        bio: "Especialista em gestão de redes sociais, focada em aumentar engajamento e conversão. Experiência com pequenas e médias empresas.",
        location: "São Paulo, SP",
        latitude: -23.5703,
        longitude: -46.6475,
      },
      {
        username: "rafael_oliveira",
        password: "password123",
        email: "rafael@example.com",
        name: "Rafael Oliveira",
        profileImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
        userType: "freelancer",
        bio: "Consultor de marketing digital com foco em resultados. Experiência em aumentar tráfego e conversões para empresas de diversos segmentos.",
        location: "São Paulo, SP",
        latitude: -23.5849,
        longitude: -46.6917,
      },
      {
        username: "joao_silva",
        password: "password123",
        email: "joao@example.com",
        name: "João Silva",
        profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
        userType: "client",
        bio: "Empresário à procura de freelancers qualificados para projetos diversos.",
        location: "São Paulo, SP",
        latitude: -23.5505,
        longitude: -46.6339,
      }
    ];

    // Create the users
    for (const userData of users) {
      const user = {
        ...userData,
        id: this.currentUserId++,
        createdAt: new Date()
      };
      this.users.set(user.id, user);
    }

    // Add freelancer profiles for the freelancer users
    const freelancerProfiles: (InsertFreelancerProfile & { userId: number })[] = [
      {
        userId: 1,
        title: "Designer UX/UI",
        category: "design",
        hourlyRate: 75,
        skills: ["Figma", "Sketch", "Adobe XD", "Protótipos"],
        experience: "Designer UX/UI Senior na Empresa XYZ",
        education: "Bacharel em Design pela Universidade de São Paulo",
      },
      {
        userId: 2,
        title: "Desenvolvedor Full Stack",
        category: "development",
        hourlyRate: 90,
        skills: ["React", "Node.js", "MongoDB", "AWS"],
        experience: "Senior Developer na Tech Solutions",
        education: "Ciência da Computação pela USP",
      },
      {
        userId: 3,
        title: "Social Media Manager",
        category: "marketing",
        hourlyRate: 65,
        skills: ["Instagram", "Facebook", "LinkedIn", "TikTok"],
        experience: "Social Media na Agência Digital X",
        education: "Marketing Digital pela ESPM",
      },
      {
        userId: 4,
        title: "Consultor de Marketing",
        category: "marketing",
        hourlyRate: 85,
        skills: ["SEO", "Google Ads", "Analytics", "Estratégia"],
        experience: "Marketing Manager na Empresa ABC",
        education: "MBA em Marketing pela FGV",
      }
    ];

    for (const profileData of freelancerProfiles) {
      const profile = {
        ...profileData,
        id: this.currentFreelancerProfileId++
      };
      this.freelancerProfiles.set(profile.id, profile);
    }

    // Add some services
    const services: (InsertService & { freelancerId: number })[] = [
      {
        freelancerId: 1,
        title: "Design de Interface",
        description: "Inclui wireframes, protótipos e design final",
        price: 2500
      },
      {
        freelancerId: 1,
        title: "Redesign de Websites",
        description: "Análise e melhoria de interfaces existentes",
        price: 3000
      },
      {
        freelancerId: 2,
        title: "Desenvolvimento Web Completo",
        description: "Frontend e backend com as melhores tecnologias",
        price: 5000
      },
      {
        freelancerId: 3,
        title: "Gestão de Redes Sociais",
        description: "Criação de conteúdo e gerenciamento mensal",
        price: 1800
      }
    ];

    for (const serviceData of services) {
      const service = {
        ...serviceData,
        id: this.currentServiceId++
      };
      this.services.set(service.id, service);
    }

    // Add some reviews
    const reviews: (InsertReview & { id: number, createdAt: Date })[] = [
      {
        id: this.currentReviewId++,
        freelancerId: 1,
        clientId: 5,
        rating: 5,
        comment: "Excelente profissional, entregou tudo no prazo!",
        createdAt: new Date()
      },
      {
        id: this.currentReviewId++,
        freelancerId: 2,
        clientId: 5,
        rating: 5,
        comment: "Desenvolvedor muito talentoso e comprometido.",
        createdAt: new Date()
      },
      {
        id: this.currentReviewId++,
        freelancerId: 3,
        clientId: 5,
        rating: 4,
        comment: "Bom trabalho nas redes sociais.",
        createdAt: new Date()
      }
    ];

    for (const review of reviews) {
      this.reviews.set(review.id, review);
    }
  }
}

// Importar configuração para escolher entre MemStorage e DatabaseStorage
import { USE_DATABASE } from "./config";
import { DatabaseStorage } from "./storage-database";

// Exportar a instância de armazenamento configurada
export const storage: IStorage = USE_DATABASE
  ? new DatabaseStorage()
  : new MemStorage();
