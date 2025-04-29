import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { TutorialStep, UserTutorialType } from "./tutorial";

export type UserType = "freelancer" | "client";
export type Category = "development" | "design" | "marketing" | "writing" | "photography" | "video" | "audio" | "translation" | "legal" | "finance" | "admin" | "other";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  profileImage: text("profile_image"),
  userType: text("user_type").notNull().$type<UserType>(),
  bio: text("bio"),
  location: text("location"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    emailIdx: index("email_idx").on(table.email),
    userTypeIdx: index("user_type_idx").on(table.userType),
    locationIdx: index("location_idx").on(table.location),
    geoIdx: index("geo_idx").on(table.latitude, table.longitude),
    resetTokenIdx: index("reset_token_idx").on(table.resetPasswordToken),
  };
});

export const freelancerProfiles = pgTable("freelancer_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  category: text("category").notNull().$type<Category>(),
  hourlyRate: integer("hourly_rate").notNull(),
  skills: text("skills").array().notNull(),
  experience: text("experience"),
  education: text("education"),
}, (table) => {
  return {
    userIdIdx: index("freelancer_user_id_idx").on(table.userId),
    categoryIdx: index("freelancer_category_idx").on(table.category),
    hourlyRateIdx: index("freelancer_hourly_rate_idx").on(table.hourlyRate),
  };
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  freelancerId: integer("freelancer_id").notNull().references(() => freelancerProfiles.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
}, (table) => {
  return {
    freelancerIdIdx: index("service_freelancer_id_idx").on(table.freelancerId),
    priceIdx: index("service_price_idx").on(table.price),
  };
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  freelancerId: integer("freelancer_id").notNull().references(() => freelancerProfiles.id),
  clientId: integer("client_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    freelancerIdIdx: index("review_freelancer_id_idx").on(table.freelancerId),
    clientIdIdx: index("review_client_id_idx").on(table.clientId),
    ratingIdx: index("review_rating_idx").on(table.rating),
    createdAtIdx: index("review_created_at_idx").on(table.createdAt),
  };
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  read: boolean("read").default(false),
}, (table) => {
  return {
    senderIdIdx: index("message_sender_id_idx").on(table.senderId),
    receiverIdIdx: index("message_receiver_id_idx").on(table.receiverId),
    conversationIdx: index("message_conversation_idx").on(table.senderId, table.receiverId),
    timestampIdx: index("message_timestamp_idx").on(table.timestamp),
    readIdx: index("message_read_idx").on(table.read),
  };
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertFreelancerProfileSchema = createInsertSchema(freelancerProfiles).omit({ id: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, timestamp: true, read: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type FreelancerProfile = typeof freelancerProfiles.$inferSelect;
export type InsertFreelancerProfile = z.infer<typeof insertFreelancerProfileSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Combined types for frontend
// Status possíveis para um agendamento
export type AppointmentStatus = "pending" | "confirmed" | "canceled" | "completed";

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => services.id),
  clientId: integer("client_id").notNull().references(() => users.id),
  appointmentDate: timestamp("appointment_date").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status", { enum: ["pending", "confirmed", "canceled", "completed"] }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    serviceIdIdx: index("appointment_service_id_idx").on(table.serviceId),
    clientIdIdx: index("appointment_client_id_idx").on(table.clientId),
    appointmentDateIdx: index("appointment_date_idx").on(table.appointmentDate),
    statusIdx: index("appointment_status_idx").on(table.status),
    datePeriodIdx: index("appointment_date_period_idx").on(table.appointmentDate, table.endTime),
  };
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({ 
  id: true, 
  createdAt: true 
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type FreelancerWithDetails = {
  user: User;
  profile: FreelancerProfile;
  avgRating: number;
  reviewCount: number;
  distance?: number;
};

// Tabela para anúncios de trabalho (jobs)
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  budget: integer("budget").notNull(),
  location: text("location").notNull(),
  deadline: timestamp("deadline"),
  status: text("status", { enum: ["open", "closed", "in_progress", "completed"] }).default("open").notNull(),
  clientId: integer("client_id").notNull().references(() => users.id),
  contactInfo: text("contact_info"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema para inserção de trabalhos
export const insertJobSchema = createInsertSchema(jobs).omit({ 
  id: true, 
  createdAt: true 
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

// Tabela para propostas de trabalho
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  freelancerId: integer("freelancer_id").notNull().references(() => users.id),
  proposal: text("proposal").notNull(),
  price: integer("price").notNull(),
  timeframe: text("timeframe").notNull(),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema para inserção de propostas
export const insertProposalSchema = createInsertSchema(proposals).omit({ 
  id: true, 
  createdAt: true 
});

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;

// Tabela para armazenar senhas em texto puro para desenvolvimento
export const devPasswords = pgTable("dev_passwords", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  username: text("username").notNull(),
  plaintext_password: text("plaintext_password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DevPassword = typeof devPasswords.$inferSelect;

// Tabela para progresso do tutorial onboarding
export const tutorialProgress = pgTable("tutorial_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  userType: text("user_type").notNull().$type<UserTutorialType>(),
  completedSteps: jsonb("completed_steps").notNull().$type<TutorialStep[]>().default([]),
  pointsEarned: integer("points_earned").notNull().default(0),
  badgesEarned: jsonb("badges_earned").notNull().$type<string[]>().default([]),
  tutorialCompleted: boolean("tutorial_completed").notNull().default(false),
  currentStep: text("current_step").$type<TutorialStep | null>(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("tutorial_progress_user_id_idx").on(table.userId),
    userTypeIdx: index("tutorial_progress_user_type_idx").on(table.userType),
    completedIdx: index("tutorial_progress_completed_idx").on(table.tutorialCompleted),
  };
});

// Schema para inserção de progresso do tutorial
export const insertTutorialProgressSchema = createInsertSchema(tutorialProgress).omit({ 
  id: true, 
  lastUpdated: true 
});

export type TutorialProgressRecord = typeof tutorialProgress.$inferSelect;
export type InsertTutorialProgress = z.infer<typeof insertTutorialProgressSchema>;
