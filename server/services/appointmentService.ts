import { storage } from "../storage";
import { InsertAppointment, Appointment } from "@shared/schema";

export class AppointmentService {
  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    // Check if the slot is still available
    const availableSlots = await storage.getAvailableSlots(
      appointmentData.doctorId,
      appointmentData.appointmentDate
    );

    const requestedTime = new Date(appointmentData.appointmentDate).getTime();
    const isSlotAvailable = availableSlots.some(slot => {
      const slotStart = new Date(slot.startTime).getTime();
      const slotEnd = new Date(slot.endTime).getTime();
      return requestedTime >= slotStart && requestedTime <= slotEnd;
    });

    if (!isSlotAvailable) {
      throw new Error('Selected time slot is no longer available');
    }

    // Create the appointment
    const appointment = await storage.createAppointment(appointmentData);

    // Update the availability slot to mark it as booked
    const slot = availableSlots.find(slot => {
      const slotStart = new Date(slot.startTime).getTime();
      const slotEnd = new Date(slot.endTime).getTime();
      return requestedTime >= slotStart && requestedTime <= slotEnd;
    });

    if (slot) {
      await storage.updateAvailabilitySlot(slot.id, {
        isBooked: true,
        appointmentId: appointment.id,
      });
    }

    return appointment;
  }

  async cancelAppointment(appointmentId: number): Promise<Appointment> {
    const appointment = await storage.getAppointment(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Cancel the appointment
    const cancelledAppointment = await storage.cancelAppointment(appointmentId);

    // Free up the availability slot
    const slots = await storage.getAvailabilitySlots(
      appointment.doctor.id,
      appointment.appointmentDate,
      appointment.appointmentDate
    );

    const bookedSlot = slots.find(slot => slot.appointmentId === appointmentId);
    if (bookedSlot) {
      await storage.updateAvailabilitySlot(bookedSlot.id, {
        isBooked: false,
        appointmentId: null,
      });
    }

    return cancelledAppointment;
  }

  async getUpcomingAppointments(patientId: number) {
    const appointments = await storage.getAppointmentsByPatient(patientId);
    const now = new Date();
    return appointments.filter(apt => new Date(apt.appointmentDate) > now);
  }

  async getPastAppointments(patientId: number) {
    const appointments = await storage.getAppointmentsByPatient(patientId);
    const now = new Date();
    return appointments.filter(apt => new Date(apt.appointmentDate) <= now);
  }
}

export const appointmentService = new AppointmentService();
