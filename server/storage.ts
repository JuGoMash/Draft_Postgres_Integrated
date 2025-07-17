import {
  users,
  doctors,
  appointments,
  reviews,
  notifications,
  availabilitySlots,
  type User,
  type InsertUser,
  type Doctor,
  type InsertDoctor,
  type Appointment,
  type InsertAppointment,
  type Review,
  type InsertReview,
  type Notification,
  type InsertNotification,
  type AvailabilitySlot,
  type InsertAvailabilitySlot,
  type DoctorWithUser,
  type AppointmentWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, sql, ilike, or, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  updateUserStripeInfo(id: number, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;

  // Doctor operations
  getDoctor(id: number): Promise<DoctorWithUser | undefined>;
  getDoctorByUserId(userId: number): Promise<DoctorWithUser | undefined>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  updateDoctor(id: number, doctor: Partial<InsertDoctor>): Promise<Doctor>;
  searchDoctors(filters: {
    specialty?: string;
    location?: string;
    insurance?: string;
    availability?: string;
    gender?: string;
    language?: string;
    rating?: number;
    services?: string[];
    priceRange?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }): Promise<DoctorWithUser[]>;
  getNearbyDoctors(lat: number, lng: number, radius: number): Promise<DoctorWithUser[]>;
  getTopRatedDoctors(limit: number): Promise<DoctorWithUser[]>;

  // Appointment operations
  getAppointment(id: number): Promise<AppointmentWithDetails | undefined>;
  getAppointmentsByPatient(patientId: number): Promise<AppointmentWithDetails[]>;
  getAppointmentsByDoctor(doctorId: number): Promise<AppointmentWithDetails[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment>;
  cancelAppointment(id: number): Promise<Appointment>;

  // Availability operations
  getAvailabilitySlots(doctorId: number, startDate: Date, endDate: Date): Promise<AvailabilitySlot[]>;
  createAvailabilitySlot(slot: InsertAvailabilitySlot): Promise<AvailabilitySlot>;
  updateAvailabilitySlot(id: number, slot: Partial<InsertAvailabilitySlot>): Promise<AvailabilitySlot>;
  getAvailableSlots(doctorId: number, date: Date): Promise<AvailabilitySlot[]>;

  // Review operations
  getReviewsByDoctor(doctorId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateDoctorRating(doctorId: number): Promise<void>;

  // Notification operations
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserStripeInfo(id: number, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        stripeCustomerId, 
        stripeSubscriptionId, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Doctor operations
  async getDoctor(id: number): Promise<DoctorWithUser | undefined> {
    const result = await db
      .select()
      .from(doctors)
      .leftJoin(users, eq(doctors.userId, users.id))
      .leftJoin(reviews, eq(doctors.id, reviews.doctorId))
      .leftJoin(availabilitySlots, eq(doctors.id, availabilitySlots.doctorId))
      .where(eq(doctors.id, id));

    if (result.length === 0) return undefined;

    const doctorData = result[0].doctors;
    const userData = result[0].users;
    const reviewsData = result.map(r => r.reviews).filter(Boolean);
    const slotsData = result.map(r => r.availability_slots).filter(Boolean);

    return {
      ...doctorData,
      user: userData!,
      reviews: reviewsData,
      availabilitySlots: slotsData,
    } as DoctorWithUser;
  }

  async getDoctorByUserId(userId: number): Promise<DoctorWithUser | undefined> {
    const result = await db
      .select()
      .from(doctors)
      .leftJoin(users, eq(doctors.userId, users.id))
      .leftJoin(reviews, eq(doctors.id, reviews.doctorId))
      .leftJoin(availabilitySlots, eq(doctors.id, availabilitySlots.doctorId))
      .where(eq(doctors.userId, userId));

    if (result.length === 0) return undefined;

    const doctorData = result[0].doctors;
    const userData = result[0].users;
    const reviewsData = result.map(r => r.reviews).filter(Boolean);
    const slotsData = result.map(r => r.availability_slots).filter(Boolean);

    return {
      ...doctorData,
      user: userData!,
      reviews: reviewsData,
      availabilitySlots: slotsData,
    } as DoctorWithUser;
  }

  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const [newDoctor] = await db.insert(doctors).values(doctor).returning();
    return newDoctor;
  }

  async updateDoctor(id: number, doctor: Partial<InsertDoctor>): Promise<Doctor> {
    const [updatedDoctor] = await db
      .update(doctors)
      .set({ ...doctor, updatedAt: new Date() })
      .where(eq(doctors.id, id))
      .returning();
    return updatedDoctor;
  }

  async searchDoctors(filters: {
    specialty?: string;
    location?: string;
    insurance?: string;
    availability?: string;
    gender?: string;
    language?: string;
    rating?: number;
    services?: string[];
    priceRange?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }): Promise<DoctorWithUser[]> {
    let query = db
      .select()
      .from(doctors)
      .leftJoin(users, eq(doctors.userId, users.id))
      .leftJoin(reviews, eq(doctors.id, reviews.doctorId))
      .leftJoin(availabilitySlots, eq(doctors.id, availabilitySlots.doctorId));

    const conditions = [];

    if (filters.specialty) {
      conditions.push(eq(doctors.specialty, filters.specialty));
    }

    if (filters.location) {
      conditions.push(ilike(doctors.clinicAddress, `%${filters.location}%`));
    }

    if (filters.insurance) {
      conditions.push(sql`${doctors.insurancesAccepted} @> ARRAY[${filters.insurance}]`);
    }

    if (filters.rating) {
      conditions.push(gte(doctors.rating, filters.rating.toString()));
    }

    if (filters.services && filters.services.length > 0) {
      conditions.push(sql`${doctors.servicesOffered} && ARRAY[${filters.services.join(',')}]`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query;

    // Group results by doctor
    const doctorMap = new Map<number, DoctorWithUser>();
    
    result.forEach(row => {
      const doctorId = row.doctors.id;
      if (!doctorMap.has(doctorId)) {
        doctorMap.set(doctorId, {
          ...row.doctors,
          user: row.users!,
          reviews: [],
          availabilitySlots: [],
        } as DoctorWithUser);
      }
      
      const doctor = doctorMap.get(doctorId)!;
      if (row.reviews) {
        doctor.reviews.push(row.reviews);
      }
      if (row.availability_slots) {
        doctor.availabilitySlots.push(row.availability_slots);
      }
    });

    return Array.from(doctorMap.values());
  }

  async getNearbyDoctors(lat: number, lng: number, radius: number): Promise<DoctorWithUser[]> {
    // Using Haversine formula for distance calculation
    const result = await db
      .select()
      .from(doctors)
      .leftJoin(users, eq(doctors.userId, users.id))
      .leftJoin(reviews, eq(doctors.id, reviews.doctorId))
      .leftJoin(availabilitySlots, eq(doctors.id, availabilitySlots.doctorId))
      .where(
        sql`
          (6371 * acos(
            cos(radians(${lat})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(latitude))
          )) < ${radius}
        `
      );

    const doctorMap = new Map<number, DoctorWithUser>();
    
    result.forEach(row => {
      const doctorId = row.doctors.id;
      if (!doctorMap.has(doctorId)) {
        doctorMap.set(doctorId, {
          ...row.doctors,
          user: row.users!,
          reviews: [],
          availabilitySlots: [],
        } as DoctorWithUser);
      }
      
      const doctor = doctorMap.get(doctorId)!;
      if (row.reviews) {
        doctor.reviews.push(row.reviews);
      }
      if (row.availability_slots) {
        doctor.availabilitySlots.push(row.availability_slots);
      }
    });

    return Array.from(doctorMap.values());
  }

  async getTopRatedDoctors(limit: number): Promise<DoctorWithUser[]> {
    const result = await db
      .select()
      .from(doctors)
      .leftJoin(users, eq(doctors.userId, users.id))
      .leftJoin(reviews, eq(doctors.id, reviews.doctorId))
      .leftJoin(availabilitySlots, eq(doctors.id, availabilitySlots.doctorId))
      .orderBy(desc(doctors.rating))
      .limit(limit);

    const doctorMap = new Map<number, DoctorWithUser>();
    
    result.forEach(row => {
      const doctorId = row.doctors.id;
      if (!doctorMap.has(doctorId)) {
        doctorMap.set(doctorId, {
          ...row.doctors,
          user: row.users!,
          reviews: [],
          availabilitySlots: [],
        } as DoctorWithUser);
      }
      
      const doctor = doctorMap.get(doctorId)!;
      if (row.reviews) {
        doctor.reviews.push(row.reviews);
      }
      if (row.availability_slots) {
        doctor.availabilitySlots.push(row.availability_slots);
      }
    });

    return Array.from(doctorMap.values());
  }

  // Appointment operations
  async getAppointment(id: number): Promise<AppointmentWithDetails | undefined> {
    const result = await db
      .select()
      .from(appointments)
      .leftJoin(users, eq(appointments.patientId, users.id))
      .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(eq(appointments.id, id));

    if (result.length === 0) return undefined;

    const appointmentData = result[0].appointments;
    const patientData = result[0].users;
    const doctorData = result[0].doctors;

    return {
      ...appointmentData,
      patient: patientData!,
      doctor: doctorData as any, // Simplified for now
    } as AppointmentWithDetails;
  }

  async getAppointmentsByPatient(patientId: number): Promise<AppointmentWithDetails[]> {
    const result = await db
      .select()
      .from(appointments)
      .leftJoin(users, eq(appointments.patientId, users.id))
      .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.appointmentDate));

    return result.map(row => ({
      ...row.appointments,
      patient: row.users!,
      doctor: row.doctors as any, // Simplified for now
    })) as AppointmentWithDetails[];
  }

  async getAppointmentsByDoctor(doctorId: number): Promise<AppointmentWithDetails[]> {
    const result = await db
      .select()
      .from(appointments)
      .leftJoin(users, eq(appointments.patientId, users.id))
      .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(eq(appointments.doctorId, doctorId))
      .orderBy(desc(appointments.appointmentDate));

    return result.map(row => ({
      ...row.appointments,
      patient: row.users!,
      doctor: row.doctors as any, // Simplified for now
    })) as AppointmentWithDetails[];
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ ...appointment, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async cancelAppointment(id: number): Promise<Appointment> {
    const [cancelledAppointment] = await db
      .update(appointments)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return cancelledAppointment;
  }

  // Availability operations
  async getAvailabilitySlots(doctorId: number, startDate: Date, endDate: Date): Promise<AvailabilitySlot[]> {
    return await db
      .select()
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.doctorId, doctorId),
          gte(availabilitySlots.date, startDate),
          lte(availabilitySlots.date, endDate)
        )
      )
      .orderBy(asc(availabilitySlots.startTime));
  }

  async createAvailabilitySlot(slot: InsertAvailabilitySlot): Promise<AvailabilitySlot> {
    const [newSlot] = await db.insert(availabilitySlots).values(slot).returning();
    return newSlot;
  }

  async updateAvailabilitySlot(id: number, slot: Partial<InsertAvailabilitySlot>): Promise<AvailabilitySlot> {
    const [updatedSlot] = await db
      .update(availabilitySlots)
      .set(slot)
      .where(eq(availabilitySlots.id, id))
      .returning();
    return updatedSlot;
  }

  async getAvailableSlots(doctorId: number, date: Date): Promise<AvailabilitySlot[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.doctorId, doctorId),
          eq(availabilitySlots.isBooked, false),
          gte(availabilitySlots.startTime, startOfDay),
          lte(availabilitySlots.endTime, endOfDay)
        )
      )
      .orderBy(asc(availabilitySlots.startTime));
  }

  // Review operations
  async getReviewsByDoctor(doctorId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.doctorId, doctorId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    
    // Update doctor rating
    await this.updateDoctorRating(review.doctorId);
    
    return newReview;
  }

  async updateDoctorRating(doctorId: number): Promise<void> {
    const reviewsData = await db
      .select({
        avgRating: sql<number>`AVG(${reviews.rating})`,
        count: sql<number>`COUNT(${reviews.id})`,
      })
      .from(reviews)
      .where(eq(reviews.doctorId, doctorId));

    const avgRating = reviewsData[0]?.avgRating || 0;
    const count = reviewsData[0]?.count || 0;

    await db
      .update(doctors)
      .set({
        rating: avgRating.toFixed(2),
        reviewCount: count,
        updatedAt: new Date(),
      })
      .where(eq(doctors.id, doctorId));
  }

  // Notification operations
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }
}

export const storage = new DatabaseStorage();
