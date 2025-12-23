import express from "express";
import bcrypt from "bcrypt";
import pool from "../db.js";

const router = express.Router();

/**
 * POST /auth/register
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    //deconstructing user data to name,email and  password

    // 1. Basic validation
    if (!name || !email || !password) {
      //all 3 fields should be present 
      return res.status(400).json({ message: "All fields are required" });
    }
    //http://localhost:5000/register used to register the user 

    // 2. Check if doctor already exists
    const existingDoctor = await pool.query(//await because it takes time for data retrieval 
      "SELECT doc_id FROM doctors WHERE email = $1",
      [email]
    ); //parameterized query to prevent sql injection 

    //

    if (existingDoctor.rows.length > 0) {
      return res.status(409).json({ message: "Doctor already exists" });
    }

    // 3. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Insert doctor
    await pool.query(
      "INSERT INTO doctors (name, email, password_hash) VALUES ($1, $2, $3)",
      [name, email, passwordHash]
    );

    // 5. Success response
    res.status(201).json({ message: "Doctor registered successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;


import jwt from "jsonwebtoken";

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Find doctor by email
    const result = await pool.query(
      "SELECT doc_id, name, email, password_hash FROM doctors WHERE email = $1",
      [email]
    ); //parametrized query for protection against sql injection 

    if (result.rows.length === 0) { 
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const doctor = result.rows[0];

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, doctor.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { doc_id: doctor.doc_id, email: doctor.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 5. Send response
    res.json({
      message: "Login successful",
      token: token,
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//postmann url 
//http://127.0.0.1:5000/auth/login
