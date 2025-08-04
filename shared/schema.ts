import { pgTable, serial, text, timestamp, integer, decimal, boolean, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("patient"), // patient, doctor, admin
  isVerified: boolean("is_verified").default(false),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Doctors table
export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  specialty: text("specialty").notNull(),
  licenseNumber: text("license_number").notNull(),
  experience: integer("experience").notNull(), // years of experience
  education: text("education").notNull(),
  languages: text("languages").array().default([]),
  bio: text("bio"),
  clinicName: text("clinic_name").notNull(),
  clinicAddress: text("clinic_address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  consultationFee: decimal("consultation_fee", { precision: 10, scale: 2 }).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").default(0),
  isAcceptingPatients: boolean("is_accepting_patients").default(true),
  servicesOffered: text("services_offered").array().default([]),
  insurancesAccepted: text("insurances_accepted").array().default([]),
  availabilitySchedule: jsonb("availability_schedule"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => users.id).notNull(),
  doctorId: integer("doctor_id").references(() => doctors.id).notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, confirmed, completed, cancelled
  type: text("type").notNull().default("consultation"), // consultation, follow-up, emergency
  notes: text("notes"),
  paymentStatus: text("payment_status"), // pending, paid, refunded
  paymentIntentId: text("payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => users.id).notNull(),
  doctorId: integer("doctor_id").references(() => doctors.id).notNull(),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // appointment_booking, appointment_reminder, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // additional data for the notification
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Availability slots table
export const availabilitySlots = pgTable("availability_slots", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").references(() => doctors.id).notNull(),
  date: date("date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isBooked: boolean("is_booked").default(false),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(["patient", "doctor", "admin"]).default("patient"),
});

export const insertDoctorSchema = createInsertSchema(doctors, {
  specialty: z.string().min(1),
  licenseNumber: z.string().min(1),
  experience: z.number().min(0),
  education: z.string().min(1),
  languages: z.array(z.string()).default([]),
  bio: z.string().optional(),
  clinicName: z.string().min(1),
  clinicAddress: z.string().min(1),
  consultationFee: z.string().transform(val => parseFloat(val)),
});

export const insertAppointmentSchema = createInsertSchema(appointments, {
  appointmentDate: z.string().transform(val => new Date(val)),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]).default("scheduled"),
  type: z.enum(["consultation", "follow-up", "emergency"]).default("consultation"),
  notes: z.string().optional(),
});

export const insertReviewSchema = createInsertSchema(reviews, {
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const insertNotificationSchema = createInsertSchema(notifications, {
  type: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  data: z.any().optional(),
});

export const insertAvailabilitySlotSchema = createInsertSchema(availabilitySlots, {
  date: z.string().transform(val => new Date(val)),
  startTime: z.string().transform(val => new Date(val)),
  endTime: z.string().transform(val => new Date(val)),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = typeof doctors.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type InsertAvailabilitySlot = typeof availabilitySlots.$inferInsert;

// Extended types for joined queries
export type DoctorWithUser = Doctor & {
  user: User;
  reviews?: Review[];
  availabilitySlots?: AvailabilitySlot[];
};

export type AppointmentWithDetails = Appointment & {
  patient: User;
  doctor: DoctorWithUser;
};