import { pgTable, text, serial, integer, boolean, timestamp, decimal, uuid, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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
  experience: integer("experience").notNull(),
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
  duration: integer("duration").notNull().default(30), // in minutes
  status: text("status").notNull().default("scheduled"), // scheduled, confirmed, completed, cancelled
  reason: text("reason"),
  type: text("type").notNull().default("in-person"), // in-person, video, phone
  notes: text("notes"),
  paymentStatus: text("payment_status").default("pending"), // pending, paid, refunded
  paymentIntentId: text("payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id).notNull(),
  patientId: integer("patient_id").references(() => users.id).notNull(),
  doctorId: integer("doctor_id").references(() => doctors.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // appointment_reminder, booking_confirmation, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Doctor availability slots
export const availabilitySlots = pgTable("availability_slots", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").references(() => doctors.id).notNull(),
  date: timestamp("date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isBooked: boolean("is_booked").default(false),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  doctorProfile: many(doctors),
  appointments: many(appointments),
  reviews: many(reviews),
  notifications: many(notifications),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  user: one(users, { fields: [doctors.userId], references: [users.id] }),
  appointments: many(appointments),
  reviews: many(reviews),
  availabilitySlots: many(availabilitySlots),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  patient: one(users, { fields: [appointments.patientId], references: [users.id] }),
  doctor: one(doctors, { fields: [appointments.doctorId], references: [doctors.id] }),
  review: many(reviews),
  availabilitySlot: many(availabilitySlots),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  appointment: one(appointments, { fields: [reviews.appointmentId], references: [appointments.id] }),
  patient: one(users, { fields: [reviews.patientId], references: [users.id] }),
  doctor: one(doctors, { fields: [reviews.doctorId], references: [doctors.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const availabilitySlotsRelations = relations(availabilitySlots, ({ one }) => ({
  doctor: one(doctors, { fields: [availabilitySlots.doctorId], references: [doctors.id] }),
  appointment: one(appointments, { fields: [availabilitySlots.appointmentId], references: [appointments.id] }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDoctorSchema = createInsertSchema(doctors).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertAvailabilitySlotSchema = createInsertSchema(availabilitySlots).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type InsertAvailabilitySlot = z.infer<typeof insertAvailabilitySlotSchema>;

// Extended types for API responses
export type DoctorWithUser = Doctor & {
  user: User;
  reviews: Review[];
  availabilitySlots: AvailabilitySlot[];
};

export type AppointmentWithDetails = Appointment & {
  patient: User;
  doctor: DoctorWithUser;
};
