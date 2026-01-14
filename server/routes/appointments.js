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


router.patch(
  "/:appointmentId/cancel",
  authMiddleware,
  async (req, res) => {
    try {
      const doctorId = req.doctor.doc_id;
      const { appointmentId } = req.params;

      const result = await pool.query(
        `UPDATE appointments
         SET status = 'cancelled'
         WHERE appointment_id = $1
           AND doctor_id = $2
           AND status != 'cancelled'
         RETURNING appointment_id`,
        [appointmentId, doctorId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Appointment not found or already cancelled"
        });
      }

      res.json({ message: "Appointment cancelled successfully" });
    } catch (error) {
      console.error("CANCEL APPOINTMENT ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.patch(
  "/:appointmentId/complete",
  authMiddleware,
  async (req, res) => {
    try {
      const doctorId = req.doctor.doc_id;
      const { appointmentId } = req.params;

      const result = await pool.query(
        `UPDATE appointments
         SET status = 'completed'
         WHERE appointment_id = $1
           AND doctor_id = $2
           AND status = 'scheduled'
         RETURNING appointment_id`,
        [appointmentId, doctorId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Appointment not found or cannot be completed"
        });
      }

      res.json({ message: "Appointment completed successfully" });
    } catch (error) {
      console.error("COMPLETE APPOINTMENT ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.get("/:id/details", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status,

        p.patient_id,
        p.name AS patient_name,

        d.diagnosis_text,

        pr.prescription_id,
        pr.instructions,

        json_agg(
          json_build_object(
            'medicine_name', m.medicine_name,
            'dosage', pm.dosage,
            'frequency', pm.frequency,
            'duration', pm.duration
          )
        ) AS medications

      FROM appointments a
      JOIN patients p ON p.patient_id = a.patient_id
      LEFT JOIN prescriptions pr ON pr.appointment_id = a.appointment_id
      LEFT JOIN diagnoses d ON d.diagnosis_id = pr.diagnosis_id
      LEFT JOIN prescription_medications pm ON pm.prescription_id = pr.prescription_id
      LEFT JOIN medications m ON m.medication_id = pm.medication_id

      WHERE a.appointment_id = $1
      GROUP BY a.appointment_id, p.patient_id, d.diagnosis_text, pr.prescription_id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("FETCH APPOINTMENT DETAILS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
