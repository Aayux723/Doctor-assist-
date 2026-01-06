import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authJWT.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    const doctorId = req.doctor.doc_id;
    const { patient_id, diagnosis_text, instructions, medications } = req.body;

    if (!patient_id || !diagnosis_text || !medications?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await client.query("BEGIN");

    
    const apptRes = await client.query(
      `
      INSERT INTO appointments
      (doctor_id, patient_id, appointment_date, appointment_time, status)
      VALUES ($1, $2, CURRENT_DATE, CURRENT_TIME, 'scheduled')
      RETURNING appointment_id
      `,
      [doctorId, patient_id]
    );

    const appointmentId = apptRes.rows[0].appointment_id;

    
    let diagRes = await client.query(
      `
      SELECT diagnosis_id
      FROM diagnoses
      WHERE patient_id = $1
        AND LOWER(diagnosis_text) = LOWER($2)
        AND is_active = true
      `,
      [patient_id, diagnosis_text]
    );

    let diagnosisId;
    if (diagRes.rows.length > 0) {
      diagnosisId = diagRes.rows[0].diagnosis_id;
    } else {
      const newDiag = await client.query(
        `
        INSERT INTO diagnoses (patient_id, doctor_id, diagnosis_text)
        VALUES ($1,$2,$3)
        RETURNING diagnosis_id
        `,
        [patient_id, doctorId, diagnosis_text]
      );
      diagnosisId = newDiag.rows[0].diagnosis_id;
    }


    const presRes = await client.query(
      `
      INSERT INTO prescriptions
      (appointment_id, doctor_id, patient_id, diagnosis_id, instructions)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING prescription_id
      `,
      [appointmentId, doctorId, patient_id, diagnosisId, instructions || null]
    );

    const prescriptionId = presRes.rows[0].prescription_id;

    
    for (const med of medications) {
      let medRes = await client.query(
        `
        SELECT medication_id
        FROM medications
        WHERE diagnosis_id = $1
          AND LOWER(medicine_name) = LOWER($2)
        `,
        [diagnosisId, med.medicine_name]
      );

      let medicationId;
      if (medRes.rows.length > 0) {
        medicationId = medRes.rows[0].medication_id;
      } else {
        const newMed = await client.query(
          `
          INSERT INTO medications (diagnosis_id, medicine_name)
          VALUES ($1,$2)
          RETURNING medication_id
          `,
          [diagnosisId, med.medicine_name]
        );
        medicationId = newMed.rows[0].medication_id;
      }

      await client.query(
        `
        INSERT INTO prescription_medications
        (prescription_id, medication_id, dosage, frequency, duration)
        VALUES ($1,$2,$3,$4,$5)
        `,
        [
          prescriptionId,
          medicationId,
          med.dosage,
          med.frequency,
          med.duration
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      appointment_id: appointmentId,
      prescription_id: prescriptionId,
      message: "Appointment & prescription created successfully"
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("MERGED APPOINTMENT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

export default router;
