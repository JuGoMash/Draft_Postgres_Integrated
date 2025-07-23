
export type User = { id: string, name: string };
export type InsertUser = Omit<User, 'id'>;
export type Doctor = { id: string, specialty: string };
export type InsertDoctor = Omit<Doctor, 'id'>;
export type Appointment = { id: string, date: string };
export type InsertAppointment = Omit<Appointment, 'id'>;
export type Review = { id: string, rating: number };
export type InsertReview = Omit<Review, 'id'>;
export type Notification = { id: string, message: string };
export type InsertNotification = Omit<Notification, 'id'>;
export type AvailabilitySlot = { id: string, time: string };
export type InsertAvailabilitySlot = Omit<AvailabilitySlot, 'id'>;
export type DoctorWithUser = { doctor: Doctor, user: User };
export type AppointmentWithDetails = { appointment: Appointment, doctor: Doctor, user: User };
