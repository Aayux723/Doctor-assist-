import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authJWT.js";
import PDFDocument from "pdfkit";

const router = express.Router();


router.post("/", authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    const doctorId = req.doctor.doc_id;
    const { appointment_id, diagnosis_text, instructions, medications } = req.body;

    if (!appointment_id || !diagnosis_text || !medications?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await client.query("BEGIN");

    // Verify appointment ownership
    const apptRes = await client.query(
      `SELECT patient_id, doctor_id
       FROM appointments
       WHERE appointment_id = $1`,
      [appointment_id]
    );

    if (apptRes.rows.length === 0) {
      throw new Error("Invalid appointment");
    }

    if (apptRes.rows[0].doctor_id !== doctorId) {
      throw new Error("Unauthorized appointment access");
    }

    const patientId = apptRes.rows[0].patient_id;

    // Diagnosis (reuse or create)
    const diagRes = await client.query(
      `SELECT diagnosis_id
       FROM diagnoses
       WHERE patient_id = $1
         AND LOWER(diagnosis_text) = LOWER($2)
         AND is_active = true`,
      [patientId, diagnosis_text]
    );

    let diagnosisId;
    if (diagRes.rows.length > 0) {
      diagnosisId = diagRes.rows[0].diagnosis_id;
    } else {
      const newDiag = await client.query(
        `INSERT INTO diagnoses (patient_id, doctor_id, diagnosis_text)
         VALUES ($1,$2,$3)
         RETURNING diagnosis_id`,
        [patientId, doctorId, diagnosis_text]
      );
      diagnosisId = newDiag.rows[0].diagnosis_id;
    }

    // Prescription
    const prescriptionRes = await client.query(
      `INSERT INTO prescriptions
       (appointment_id, doctor_id, patient_id, diagnosis_id, instructions)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING prescription_id`,
      [appointment_id, doctorId, patientId, diagnosisId, instructions || null]
    );

    const prescriptionId = prescriptionRes.rows[0].prescription_id;

    // Medications
    for (const med of medications) {
      const medRes = await client.query(
        `SELECT medication_id
         FROM medications
         WHERE diagnosis_id = $1
           AND LOWER(medicine_name) = LOWER($2)`,
        [diagnosisId, med.medicine_name]
      );

      let medicationId;
      if (medRes.rows.length > 0) {
        medicationId = medRes.rows[0].medication_id;
      } else {
        const newMed = await client.query(
          `INSERT INTO medications (diagnosis_id, medicine_name)
           VALUES ($1,$2)
           RETURNING medication_id`,
          [diagnosisId, med.medicine_name]
        );
        medicationId = newMed.rows[0].medication_id;
      }

      await client.query(
        `INSERT INTO prescription_medications
         (prescription_id, medication_id, dosage, frequency, duration)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          prescriptionId,
          medicationId,
          med.dosage || null,
          med.frequency || null,
          med.duration || null
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Prescription created successfully",
      prescription_id: prescriptionId
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("PRESCRIPTION ERROR:", error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});



router.get(
  "/appointment/:appointmentId",
  authMiddleware,
  async (req, res) => {
    try {
      const doctorId = req.doctor.doc_id;
      const { appointmentId } = req.params;

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



router.get(
  "/appointment/:appointmentId/pdf",
  authMiddleware,
  async (req, res) => {
    try {
      const doctorId = req.doctor.doc_id;
      const { appointmentId } = req.params;

      const presRes = await pool.query(
        `SELECT p.prescription_id,
                p.instructions,
                p.created_at,
                d.diagnosis_text,
                pt.name AS patient_name,
                doc.name AS doctor_name
         FROM prescriptions p
         JOIN diagnoses d ON p.diagnosis_id = d.diagnosis_id
         JOIN patients pt ON p.patient_id = pt.patient_id
         JOIN doctors doc ON p.doctor_id = doc.doc_id
         WHERE p.appointment_id = $1
           AND p.doctor_id = $2`,
        [appointmentId, doctorId]
      );

      if (presRes.rows.length === 0) {
        return res.status(404).json({ message: "Prescription not found" });
      }

      const prescription = presRes.rows[0];

      const medsRes = await pool.query(
        `SELECT m.medicine_name,
                pm.dosage,
                pm.frequency,
                pm.duration
         FROM prescription_medications pm
         JOIN medications m ON pm.medication_id = m.medication_id
         WHERE pm.prescription_id = $1`,
        [prescription.prescription_id]
      );

      const doc = new PDFDocument({ margin: 50 });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=prescription_${appointmentId}.pdf`
      );

      doc.pipe(res);

      doc
        .fontSize(18)
        .text("Medical Prescription", { align: "center" })
        .moveDown();

      doc
        .fontSize(12)
        .text(`Doctor: Dr. ${prescription.doctor_name}`)
        .text(`Patient: ${prescription.patient_name}`)
        .text(`Date: ${new Date(prescription.created_at).toDateString()}`)
        .moveDown();

      doc
        .fontSize(14)
        .text("Diagnosis:")
        .fontSize(12)
        .text(prescription.diagnosis_text)
        .moveDown();

      doc.fontSize(14).text("Medications:").moveDown(0.5);

      medsRes.rows.forEach((med, index) => {
        doc
          .fontSize(12)
          .text(
            `${index + 1}. ${med.medicine_name} - ${med.dosage}, ${med.frequency}, ${med.duration}`
          );
      });

      doc.moveDown();

      if (prescription.instructions) {
        doc
          .fontSize(14)
          .text("Instructions:")
          .fontSize(12)
          .text(prescription.instructions)
          .moveDown();
      }

      doc
        .moveDown(2)
        .fontSize(12)
        .text("Prescribed by")
        .moveDown(0.3)
        .fontSize(13)
        .text(`Dr. ${prescription.doctor_name}`)
        .fontSize(11)
        .text(`Generated on ${new Date().toDateString()}`)
        .text("This is a digitally generated prescription");

      doc.end(); // 🔥 REQUIRED — FINALIZES PDF STREAM

    } catch (error) {
      console.error("PRESCRIPTION PDF ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;


