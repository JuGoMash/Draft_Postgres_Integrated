
import { db } from "./server/db";
import { bookings } from "./server/schema";

async function seed() {
  await db.insert(bookings).values([
    {
      fullName: "John Doe",
      phoneNumber: "123456789",
      age: 30,
      gender: "Male",
      service: "Dental",
      doctor: "Dr. Smith",
      appointmentDate: "2024-08-01",
      appointmentTime: "10:00",
    },
  ]);
  console.log("✅ Seed data inserted successfully.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Failed to insert seed data:", err);
  process.exit(1);
});
