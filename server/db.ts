import dotenv from "dotenv";
dotenv.config();

const { Pool } = await import("pg");

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});
