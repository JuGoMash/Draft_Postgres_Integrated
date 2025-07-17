import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numAmount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function generateStars(rating: number): string[] {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  for (let i = 0; i < fullStars; i++) {
    stars.push('full');
  }
  
  if (hasHalfStar) {
    stars.push('half');
  }
  
  while (stars.length < 5) {
    stars.push('empty');
  }
  
  return stars;
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in kilometers
  return Math.round(d * 0.621371 * 10) / 10; // Convert to miles and round to 1 decimal
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function getTimeSlots(startTime: string, endTime: string, duration: number = 30): string[] {
  const slots = [];
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  while (start < end) {
    slots.push(start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    start.setMinutes(start.getMinutes() + duration);
  }
  
  return slots;
}

export function getAvailabilityStatus(isAccepting: boolean, slots: any[]): string {
  if (!isAccepting) return 'Not accepting patients';
  
  const availableSlots = slots.filter(slot => !slot.isBooked);
  if (availableSlots.length === 0) return 'Fully booked';
  
  if (availableSlots.length <= 3) return 'Limited availability';
  
  return 'Available';
}

export function specialtyDisplayName(specialty: string): string {
  const specialtyMap: { [key: string]: string } = {
    'cardiology': 'Cardiology',
    'dermatology': 'Dermatology',
    'neurology': 'Neurology',
    'pediatrics': 'Pediatrics',
    'orthopedics': 'Orthopedics',
    'gynecology': 'Gynecology',
    'psychiatry': 'Psychiatry',
    'oncology': 'Oncology',
    'general': 'General Practice',
  };
  
  return specialtyMap[specialty] || specialty;
}

export function getInsuranceDisplayName(insurance: string): string {
  const insuranceMap: { [key: string]: string } = {
    'aetna': 'Aetna',
    'bluecross': 'Blue Cross Blue Shield',
    'cigna': 'Cigna',
    'humana': 'Humana',
    'medicare': 'Medicare',
    'medicaid': 'Medicaid',
    'unitedhealthcare': 'UnitedHealthcare',
  };
  
  return insuranceMap[insurance] || insurance;
}
