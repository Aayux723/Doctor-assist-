import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authJWT.js";

const router = express.Router();

//add new patient
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, age, gender, symptoms } = req.body; 
    const doctorId = req.doctor.doc_id;
    //in authJWT we extracted the doc_id from the doc who is trying to access the data or add patient

    if (!name) { 
      return res.status(400).json({ message: "Patient name is required" });
    }

    const newPatient = await pool.query(
      `INSERT INTO patients (doctor_id, name, age, gender, symptoms)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, //parameterized query
      [doctorId, name, age, gender, symptoms]
    );

    res.status(201).json(newPatient.rows[0]);

  } catch (error) {
    console.error("ADD PATIENT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});


//get all patient details of the doctor (the one who logged in )
router.get("/", authMiddleware, async (req, res) => {
  try {
    const doctorId = req.doctor.doc_id;

    const patients = await pool.query(
      `SELECT patient_id, name, age, gender, symptoms, created_at
       FROM patients
       WHERE doctor_id = $1
       ORDER BY created_at DESC`,
      [doctorId]
    );

    res.json(patients.rows);

  } catch (error) {
    console.error("GET PATIENTS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
