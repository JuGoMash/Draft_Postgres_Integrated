import { storage } from "../storage";
import { DoctorWithUser } from "@shared/schema";

export class DoctorService {
  async searchDoctors(filters: any): Promise<DoctorWithUser[]> {
    return await storage.searchDoctors(filters);
  }

  async getDoctorsBySpecialty(specialty: string): Promise<DoctorWithUser[]> {
    return await storage.searchDoctors({ specialty });
  }

  async getNearbyDoctors(lat: number, lng: number, radius: number = 10): Promise<DoctorWithUser[]> {
    return await storage.getNearbyDoctors(lat, lng, radius);
  }

  async getTopRatedDoctors(limit: number = 10): Promise<DoctorWithUser[]> {
    return await storage.getTopRatedDoctors(limit);
  }

  async getDoctorAvailability(doctorId: number, date: Date) {
    return await storage.getAvailableSlots(doctorId, date);
  }

  async updateDoctorRating(doctorId: number) {
    return await storage.updateDoctorRating(doctorId);
  }
}

export const doctorService = new DoctorService();
