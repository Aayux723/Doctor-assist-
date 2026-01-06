import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patients.js";
import appointmentRoutes from "./routes/appointments.js";
import diagnosisRoutes from "./routes/diagnosis.js";
import documentRoutes from "./routes/documents.js";
import noteRoutes from "./routes/notes.js";
import prescriptionRoutes from "./routes/prescriptions.js";
import appointmentsFull from "./routes/appointmentsFull.js";


const app = express();
//cors protocol defies SOP (Same origin protocol) and allows access btw different ports (frontend->localHost3000 and backend->localhost5000)
//SOP->A website can only access data from server of the same origin 

// Middleware
app.use(cors());//tells the sys to use CORS protocol 
app.use(express.json());//converts to JavaScriptObject 
app.use("/auth", authRoutes);
app.use("/patients", patientRoutes);
app.use("/appointments",appointmentRoutes);
app.use("/diagnoses", diagnosisRoutes);
app.use("/documents",documentRoutes)
app.use("/notes", noteRoutes);
app.use("/prescriptions", prescriptionRoutes);
app.use("/appointments/full", appointmentsFull);

// Test route
app.get("/", (req, res) => {
  res.send("Doctor Assist Backend Running");
}); // "/"" is the root URL path that represents the base endpoint of a server.

import pool from "./db.js";

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Database connection failed");
  }
});






export default app;
