export interface Doctor {
  id: number;
  userId: number;
  specialty: string;
  licenseNumber: string;
  experience: number;
  education: string;
  languages: string[];
  bio: string;
  clinicName: string;
  clinicAddress: string;
  latitude: string;
  longitude: string;
  consultationFee: string;
  rating: string;
  reviewCount: number;
  isAcceptingPatients: boolean;
  servicesOffered: string[];
  insurancesAccepted: string[];
  availabilitySchedule: any;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    isVerified: boolean;
  };
  reviews: Review[];
  availabilitySlots: AvailabilitySlot[];
}

export interface Review {
  id: number;
  appointmentId: number;
  patientId: number;
  doctorId: number;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: string;
}

export interface AvailabilitySlot {
  id: number;
  doctorId: number;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  appointmentId: number | null;
  createdAt: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  duration: number;
  status: string;
  reason: string;
  type: string;
  notes: string;
  paymentStatus: string;
  paymentIntentId: string;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  doctor: Doctor;
}

export interface SearchFilters {
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
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  isVerified: boolean;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebSocketMessage {
  type: string;
  data: any;
}
