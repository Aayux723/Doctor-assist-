import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function AddPatient() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    symptoms: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/patients", {
        name: form.name.trim(),
        age: Number(form.age),
        gender: form.gender,
        phone: form.phone.trim(),
        email: form.email.trim() || null, // email optional
        symptoms: form.symptoms.trim()
      });

      
      navigate(`/patients/${res.data.patient_id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to add patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "auto" }}>
      <h1>Add New Patient</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div>
          <label>Name</label><br />
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Age */}
        <div>
          <label>Age</label><br />
          <input
            name="age"
            type="number"
            min="0"
            value={form.age}
            onChange={handleChange}
            required
          />
        </div>

        {/* Gender */}
        <div>
          <label>Gender</label><br />
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            required
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Phone */}
        <div>
          <label>Phone Number</label><br />
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            placeholder="10-digit phone number"
          />
        </div>

        {/* Email */}
        <div>
          <label>Email (optional)</label><br />
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="example@email.com"
          />
        </div>

        {/* Symptoms */}
        <div>
          <label>Symptoms</label><br />
          <textarea
            name="symptoms"
            value={form.symptoms}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add Patient"}
        </button>
      </form>
    </div>
  );
}

