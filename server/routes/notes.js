import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authJWT.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const doctorId = req.doctor.doc_id;
    const { patient_id, note_text } = req.body;

    if (!patient_id || !note_text) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO clinical_notes (patient_id, doctor_id, note_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [patient_id, doctorId, note_text]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("ADD NOTE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/patient/:patientId", authMiddleware, async (req, res) => {//we need to add patientId to fetch the data
  try {
    const { patientId } = req.params;

    const result = await pool.query(
      `SELECT note_id, note_text, created_at
       FROM clinical_notes
       WHERE patient_id = $1
       ORDER BY created_at DESC`,
      [patientId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("FETCH NOTES ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
