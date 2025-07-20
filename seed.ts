
import { db } from "./server/db";

async function seed() {
  try {
    await db.query(`
      INSERT INTO bookings (name, email, date)
      VALUES ($1, $2, $3)
    `, ['John Doe', 'john@example.com', '2025-08-01']);

    console.log("✅ Seed data inserted successfully.");
  } catch (error) {
    console.error("❌ Failed to insert seed data:", error);
  }
}

seed();
