import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authJWT.js";

const router = express.Router();


//POST
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { patient_id, appointment_date, appointment_time, notes } = req.body;
    const doctorId = req.doctor.doc_id; //docid from authJWT extraction

    if (!patient_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const appointment = await pool.query(
      `INSERT INTO appointments
       (doctor_id, patient_id, appointment_date, appointment_time, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [doctorId, patient_id, appointment_date, appointment_time, notes]
    );

    res.status(201).json(appointment.rows[0]);

  } catch (error) {
    console.error("CREATE APPOINTMENT ERROR:", error);

    // Handle double-booking error
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Doctor already has an appointment at this time"
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

//Fetch appointment details 
router.get("/", authMiddleware, async (req, res) => {
  try {
    const doctorId = req.doctor.doc_id;

    const result = await pool.query(
      `SELECT a.appointment_id,
              a.appointment_date,
              a.appointment_time,
              a.status,
              p.name AS patient_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       WHERE a.doctor_id = $1
       ORDER BY appointment_date, appointment_time`,
      [doctorId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("GET APPOINTMENTS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
