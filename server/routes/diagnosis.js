import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authJWT.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
    //authmiddleware checks if the token is there
  try {
    const doctorId = req.doctor.doc_id;
    const { patient_id, diagnosis_text } = req.body;//extraction

    if (!patient_id || !diagnosis_text) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO diagnoses (patient_id, doctor_id, diagnosis_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [patient_id, doctorId, diagnosis_text]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("ADD DIAGNOSIS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});


//adding medicine to a particular diagnosis 
router.post("/:diagnosisId/medications", authMiddleware, async (req, res)=>{
  try {
    const { diagnosisId } = req.params;
    const {
      medicine_name,
      dosage,
      frequency,
      duration,
      notes
    } = req.body;

    if (!medicine_name) {
      return res.status(400).json({ message: "Medicine name is required" });
    }

//multiple patients will have the same disease name but they will never share the same diagnosis_ID 
    const result = await pool.query(
      `INSERT INTO medications
       (diagnosis_id, medicine_name, dosage, frequency, duration, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [diagnosisId, medicine_name, dosage, frequency, duration, notes]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("ADD MEDICATION ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});


//fetching data of diagnosis for a patient 
router.get("/patient/:patientId", authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params; 

    const diagnoses = await pool.query(
      `SELECT *
       FROM diagnoses
       WHERE patient_id = $1
       ORDER BY created_at DESC`,
      [patientId]
    );

    const diagnosisData = [];

    for (const diagnosis of diagnoses.rows) {
      const meds = await pool.query(
        `SELECT *
         FROM medications
         WHERE diagnosis_id = $1`,
        [diagnosis.diagnosis_id]
      );

      diagnosisData.push({
        ...diagnosis,//adds all key-value pairs of diagnosis
        medications: meds.rows
      });
    }

    res.json(diagnosisData);

  } catch (error) {
    console.error("FETCH DIAGNOSIS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});


//remove diagnosis 
router.patch("/:id/deactivate", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE diagnoses
       SET is_active = false
       WHERE diagnosis_id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Diagnosis not found" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("DEACTIVATE DIAGNOSIS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;