import { db } from "./server/db";
import { users, doctors, appointments } from "./shared/schema";
import { eq, desc, gte, sql } from "drizzle-orm";

/**
 * Admin Panel Helper Functions
 * 
 * These functions help manage the database for the medical platform.
 * Run these with: npx tsx admin-panel.ts
 */

// Get all users with their registration stats
async function getUserStats() {
  console.log("=== USER STATISTICS ===");
  
  const userStats = await db
    .select({
      role: users.role,
      count: sql<number>`COUNT(*)`,
      verified: sql<number>`COUNT(CASE WHEN ${users.isVerified} = true THEN 1 END)`,
    })
    .from(users)
    .groupBy(users.role);

  console.table(userStats);
  
  // Recent signups (last 7 days)
  const recentSignups = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(gte(users.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
    .orderBy(desc(users.createdAt));

  console.log("\n=== RECENT SIGNUPS (LAST 7 DAYS) ===");
  console.table(recentSignups);
}

// Get appointment statistics
async function getAppointmentStats() {
  console.log("\n=== APPOINTMENT STATISTICS ===");
  
  const appointmentStats = await db
    .select({
      status: appointments.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(appointments)
    .groupBy(appointments.status);

  console.table(appointmentStats);
  
  // Recent appointments
  const recentAppointments = await db
    .select({
      id: appointments.id,
      appointmentDate: appointments.appointmentDate,
      status: appointments.status,
      type: appointments.type,
      paymentStatus: appointments.paymentStatus,
      createdAt: appointments.createdAt,
    })
    .from(appointments)
    .orderBy(desc(appointments.createdAt))
    .limit(10);

  console.log("\n=== RECENT APPOINTMENTS (LAST 10) ===");
  console.table(recentAppointments);
}

// Get doctor information
async function getDoctorInfo() {
  console.log("\n=== DOCTOR INFORMATION ===");
  
  const doctorInfo = await db
    .select({
      id: doctors.id,
      clinicName: doctors.clinicName,
      specialty: doctors.specialty,
      experience: doctors.experience,
      rating: doctors.rating,
      reviewCount: doctors.reviewCount,
      isAcceptingPatients: doctors.isAcceptingPatients,
      createdAt: doctors.createdAt,
    })
    .from(doctors)
    .orderBy(desc(doctors.createdAt));

  console.table(doctorInfo);
}

// Add a new doctor (helper function)
async function addDoctor(doctorData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  specialty: string;
  licenseNumber: string;
  experience: number;
  education: string;
  clinicName: string;
  clinicAddress: string;
  consultationFee: string;
}) {
  console.log("\n=== ADDING NEW DOCTOR ===");
  
  try {
    // First create the user account
    const [newUser] = await db.insert(users).values({
      email: doctorData.email,
      password: doctorData.password, // Should be hashed with bcrypt
      firstName: doctorData.firstName,
      lastName: doctorData.lastName,
      phone: doctorData.phone,
      role: "doctor",
      isVerified: true,
    }).returning();
    
    // Then create the doctor profile
    const [newDoctor] = await db.insert(doctors).values({
      userId: newUser.id,
      specialty: doctorData.specialty,
      licenseNumber: doctorData.licenseNumber,
      experience: doctorData.experience,
      education: doctorData.education,
      languages: ["English"],
      bio: `Experienced ${doctorData.specialty} with ${doctorData.experience} years of practice`,
      clinicName: doctorData.clinicName,
      clinicAddress: doctorData.clinicAddress,
      consultationFee: doctorData.consultationFee,
      rating: "0.00",
      reviewCount: 0,
      isAcceptingPatients: true,
      servicesOffered: [],
      insurancesAccepted: ["Blue Cross", "Aetna", "Cigna"],
      availabilitySchedule: {
        monday: { start: "09:00", end: "17:00" },
        tuesday: { start: "09:00", end: "17:00" },
        wednesday: { start: "09:00", end: "17:00" },
        thursday: { start: "09:00", end: "17:00" },
        friday: { start: "09:00", end: "15:00" },
      },
    }).returning();
    
    console.log("Successfully added doctor:", newDoctor);
    return { user: newUser, doctor: newDoctor };
  } catch (error) {
    console.error("Error adding doctor:", error);
    throw error;
  }
}

// Main function to run all stats
async function runAdminPanel() {
  try {
    await getUserStats();
    await getAppointmentStats();
    await getDoctorInfo();
    
    console.log("\n=== ADMIN PANEL COMPLETE ===");
    console.log("Use the functions above to manage your database.");
    console.log("Example: await addDoctor({ email: 'dr.new@example.com', ... })");
    
  } catch (error) {
    console.error("Error running admin panel:", error);
  } finally {
    process.exit(0);
  }
}

// Export functions for use in other scripts
export { getUserStats, getAppointmentStats, getDoctorInfo, addDoctor };

// Run the admin panel if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAdminPanel();
}