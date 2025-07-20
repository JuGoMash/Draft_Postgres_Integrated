
import express from "express";
import db from "../db";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const result = await db.query("SELECT * FROM patients");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/", async (req, res) => {
  const { name, email } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO patients (name, email) VALUES ($1, $2) RETURNING *",
      [name, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add patient" });
  }
});

export default router;
