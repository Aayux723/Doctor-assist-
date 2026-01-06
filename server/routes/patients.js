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

router.get(
  "/appointment/:appointmentId",
  authMiddleware,
  async (req, res) => {
    try {
      const doctorId = req.doctor.doc_id;
      const { appointmentId } = req.params;

      // 1️Fetch prescription
      const prescriptionRes = await pool.query(
        `SELECT p.prescription_id,
                p.appointment_id,
                p.instructions,
                p.created_at,
                d.diagnosis_text
         FROM prescriptions p
         JOIN diagnoses d ON p.diagnosis_id = d.diagnosis_id
         WHERE p.appointment_id = $1
           AND p.doctor_id = $2`,
        [appointmentId, doctorId]
      );

      if (prescriptionRes.rows.length === 0) {
        return res.status(404).json({
          message: "Prescription not found for this appointment"
        });
      }

      const prescription = prescriptionRes.rows[0];

      // 2️Fetch medications for this prescription
      const medsRes = await pool.query(
        `SELECT m.medicine_name,
                pm.dosage,
                pm.frequency,
                pm.duration
         FROM prescription_medications pm
         JOIN medications m
           ON pm.medication_id = m.medication_id
         WHERE pm.prescription_id = $1`,
        [prescription.prescription_id]
      );

      // 3️⃣ Build response
      res.json({
        prescription_id: prescription.prescription_id,
        appointment_id: prescription.appointment_id,
        diagnosis: prescription.diagnosis_text,
        instructions: prescription.instructions,
        created_at: prescription.created_at,
        medications: medsRes.rows
      });

    } catch (error) {
      console.error("GET PRESCRIPTION ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);


//full profile view 

router.get(
  "/:patientId/profile",
  authMiddleware,
  async (req, res) => {
    try {
      const doctorId = req.doctor.doc_id;
      const { patientId } = req.params;

      
      const patientRes = await pool.query(
        `SELECT *
         FROM patients
         WHERE patient_id = $1 AND doctor_id = $2`,
        [patientId, doctorId]
      );

      if (patientRes.rows.length === 0) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const patient = patientRes.rows[0];

      
      const appointmentsRes = await pool.query(
        `SELECT *
         FROM appointments
         WHERE patient_id = $1 AND doctor_id = $2
         ORDER BY appointment_date DESC`,
        [patientId, doctorId]
      );

      
      const diagnosesRes = await pool.query(
        `SELECT *
         FROM diagnoses
         WHERE patient_id = $1
         ORDER BY created_at DESC`,
        [patientId]
      );

      const diagnoses = [];
      for (const diag of diagnosesRes.rows) {
        const medsRes = await pool.query(
          `SELECT *
           FROM medications
           WHERE diagnosis_id = $1`,
          [diag.diagnosis_id]
        );

        diagnoses.push({
          ...diag,
          medications: medsRes.rows
        });
      }

     
      const notesRes = await pool.query(
        `SELECT note_id, note_text, created_at
         FROM clinical_notes
         WHERE patient_id = $1
         ORDER BY created_at DESC`,
        [patientId]
      );

      
      const documentsRes = await pool.query(
        `SELECT document_id, document_category, document_label,
                file_format, uploaded_at
         FROM documents
         WHERE patient_id = $1
         ORDER BY uploaded_at DESC`,
        [patientId]
      );

      
      const prescriptionsRes = await pool.query(
        `SELECT p.prescription_id,
                p.appointment_id,
                p.instructions,
                p.created_at,
                d.diagnosis_text
         FROM prescriptions p
         JOIN diagnoses d ON p.diagnosis_id = d.diagnosis_id
         WHERE p.patient_id = $1
           AND p.doctor_id = $2
         ORDER BY p.created_at DESC`,
        [patientId, doctorId]
      );

      const prescriptions = [];
      for (const pres of prescriptionsRes.rows) {
        const medsRes = await pool.query(
          `SELECT m.medicine_name,
                  pm.dosage,
                  pm.frequency,
                  pm.duration
           FROM prescription_medications pm
           JOIN medications m
             ON pm.medication_id = m.medication_id
           WHERE pm.prescription_id = $1`,
          [pres.prescription_id]
        );

        prescriptions.push({
          ...pres,
          medications: medsRes.rows
        });
      }

      
      res.json({
        patient,
        appointments: appointmentsRes.rows,
        diagnoses,
        clinical_notes: notesRes.rows,
        documents: documentsRes.rows,
        prescriptions
      });

    } catch (error) {
      console.error("PATIENT PROFILE ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);
