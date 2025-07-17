import { db } from "./server/db";
import { users, doctors, availabilitySlots } from "./shared/schema";
import bcrypt from "bcrypt";

async function seedDatabase() {
  console.log("Starting database seeding...");

  // Clear existing data
  await db.delete(availabilitySlots);
  await db.delete(doctors);
  await db.delete(users);

  // Create sample users
  const sampleUsers = [
    {
      email: "dr.johnson@example.com",
      password: await bcrypt.hash("password123", 10),
      firstName: "Michael",
      lastName: "Johnson",
      phone: "+1234567890",
      role: "doctor",
      isVerified: true,
    },
    {
      email: "dr.smith@example.com",
      password: await bcrypt.hash("password123", 10),
      firstName: "Sarah",
      lastName: "Smith",
      phone: "+1234567891",
      role: "doctor",
      isVerified: true,
    },
    {
      email: "dr.williams@example.com",
      password: await bcrypt.hash("password123", 10),
      firstName: "David",
      lastName: "Williams",
      phone: "+1234567892",
      role: "doctor",
      isVerified: true,
    },
    {
      email: "patient@example.com",
      password: await bcrypt.hash("password123", 10),
      firstName: "John",
      lastName: "Doe",
      phone: "+1234567893",
      role: "patient",
      isVerified: true,
    },
  ];

  const createdUsers = await db.insert(users).values(sampleUsers).returning();
  console.log(`Created ${createdUsers.length} users`);

  // Create sample doctors
  const sampleDoctors = [
    {
      userId: createdUsers[0].id,
      specialty: "Cardiology",
      licenseNumber: "MD123456",
      experience: 10,
      education: "Harvard Medical School",
      languages: ["English", "Spanish"],
      bio: "Experienced cardiologist with 10+ years of practice",
      clinicName: "Heart Health Clinic",
      clinicAddress: "123 Main St, New York, NY 10001",
      latitude: "40.7128",
      longitude: "-74.0060",
      consultationFee: "200.00",
      rating: "4.5",
      reviewCount: 25,
      isAcceptingPatients: true,
      servicesOffered: ["Heart Checkup", "EKG", "Stress Test"],
      insurancesAccepted: ["Blue Cross", "Aetna", "Cigna"],
      availabilitySchedule: {
        monday: { start: "09:00", end: "17:00" },
        tuesday: { start: "09:00", end: "17:00" },
        wednesday: { start: "09:00", end: "17:00" },
        thursday: { start: "09:00", end: "17:00" },
        friday: { start: "09:00", end: "15:00" },
      },
    },
    {
      userId: createdUsers[1].id,
      specialty: "Dermatology",
      licenseNumber: "MD789012",
      experience: 8,
      education: "Johns Hopkins Medical School",
      languages: ["English", "French"],
      bio: "Skilled dermatologist specializing in skin conditions",
      clinicName: "Skin Care Center",
      clinicAddress: "456 Oak Ave, Los Angeles, CA 90210",
      latitude: "34.0522",
      longitude: "-118.2437",
      consultationFee: "150.00",
      rating: "4.8",
      reviewCount: 40,
      isAcceptingPatients: true,
      servicesOffered: ["Skin Examination", "Acne Treatment", "Mole Removal"],
      insurancesAccepted: ["United Healthcare", "Blue Cross", "Kaiser"],
      availabilitySchedule: {
        monday: { start: "08:00", end: "16:00" },
        tuesday: { start: "08:00", end: "16:00" },
        wednesday: { start: "08:00", end: "16:00" },
        thursday: { start: "08:00", end: "16:00" },
        friday: { start: "08:00", end: "14:00" },
      },
    },
    {
      userId: createdUsers[2].id,
      specialty: "Pediatrics",
      licenseNumber: "MD345678",
      experience: 12,
      education: "Stanford Medical School",
      languages: ["English", "Mandarin"],
      bio: "Caring pediatrician with extensive experience with children",
      clinicName: "Children's Health Center",
      clinicAddress: "789 Pine St, Chicago, IL 60601",
      latitude: "41.8781",
      longitude: "-87.6298",
      consultationFee: "120.00",
      rating: "4.7",
      reviewCount: 60,
      isAcceptingPatients: true,
      servicesOffered: ["Well-child Visits", "Vaccinations", "Sick Visits"],
      insurancesAccepted: ["Medicaid", "Blue Cross", "Humana"],
      availabilitySchedule: {
        monday: { start: "09:00", end: "18:00" },
        tuesday: { start: "09:00", end: "18:00" },
        wednesday: { start: "09:00", end: "18:00" },
        thursday: { start: "09:00", end: "18:00" },
        friday: { start: "09:00", end: "16:00" },
      },
    },
  ];

  const createdDoctors = await db.insert(doctors).values(sampleDoctors).returning();
  console.log(`Created ${createdDoctors.length} doctors`);

  // Create sample availability slots for next 7 days
  const availabilitySlotData = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);
    
    // Skip weekends for simplicity
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;
    
    for (const doctor of createdDoctors) {
      // Create slots every 30 minutes from 9 AM to 5 PM
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotTime = new Date(currentDate);
          slotTime.setHours(hour, minute, 0, 0);
          
          availabilitySlotData.push({
            doctorId: doctor.id,
            date: currentDate,
            startTime: slotTime,
            endTime: new Date(slotTime.getTime() + 30 * 60000), // 30 minutes later
            isBooked: false,
          });
        }
      }
    }
  }

  if (availabilitySlotData.length > 0) {
    await db.insert(availabilitySlots).values(availabilitySlotData);
    console.log(`Created ${availabilitySlotData.length} availability slots`);
  }

  console.log("Database seeding completed!");
}

// Run the seed function
seedDatabase()
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });