import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authJWT.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/upload",authMiddleware,upload.single("file"),async (req, res) => {
    try {
      const doctorId = req.doctor.doc_id; //from authJWT
      const {
        patient_id,
        document_category,
        document_label
      } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "File required" });
      } //if file doesnt exist

      if (!patient_id || !document_category || !document_label) {
        return res.status(400).json({ message: "Missing fields" });
      }

      // determine file format
      const extension = req.file.originalname.split(".").pop().toLowerCase();
      let fileFormat; 

      if (extension === "pdf") fileFormat = "pdf";
      else if (extension === "jpg" || extension === "jpeg") fileFormat = "jpeg";
      else if (extension === "dcm") fileFormat = "dicom";
      else {
        return res.status(400).json({ message: "Invalid file format" });
      }

      const result = await pool.query(
        `INSERT INTO documents
         (patient_id, doctor_id, document_category, document_label,
          file_name, file_path, file_format, file_mime_type)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [
          patient_id,
          doctorId,
          document_category,
          document_label,
          req.file.originalname,
          req.file.path,
          fileFormat,
          req.file.mimetype
        ]
      );

      res.status(201).json(result.rows[0]);

    } catch (error) {
      console.error("UPLOAD DOCUMENT ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);



//fetching data 
router.get("/patient/:patientId",authMiddleware,async (req, res) => {
    try {
      const { patientId } = req.params;

      const result = await pool.query(
        `SELECT document_id, document_category, document_label,
                file_format, uploaded_at
         FROM documents
         WHERE patient_id = $1
         ORDER BY uploaded_at DESC`,
        [patientId]
      );

      res.json(result.rows);

    } catch (error) {
      console.error("FETCH DOCUMENTS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);


//view file 
router.get("/:id/view",authMiddleware,async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT file_path, file_mime_type
         FROM documents
         WHERE document_id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Document not found" });
      }

      const file = result.rows[0];
      res.type(file.file_mime_type);
      res.sendFile(process.cwd() + "/" + file.file_path);

    } catch (error) {
      console.error("VIEW DOCUMENT ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;