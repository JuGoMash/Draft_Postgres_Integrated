
import { db } from "./server/db";
import { bookings } from "./server/schema"; // Optional if you use types

async function seed() {
  try {
    await db.query(\`
      INSERT INTO bookings (name, email, date)
      VALUES ($1, $2, $3)
    \`, ['John Doe', 'john@example.com', '2025-08-01']);

    console.log("✅ Seed data inserted successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to insert seed data:", error);
    process.exit(1);
  }
}

seed();
