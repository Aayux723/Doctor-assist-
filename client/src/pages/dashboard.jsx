import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get("/patients");
        setPatients(res.data);
      } catch (error) {
        console.error("Error fetching patients", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  if (loading) {
    return <p style={{ padding: "20px" }}>Loading patients...</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Doctor Dashboard</h1>

      {/* ✅ ADD PATIENT BUTTON */}
      <button
        onClick={() => navigate("/patients/new")}
        style={{ marginBottom: "20px" }}
      >
        + Add Patient
      </button>

      {patients.length === 0 ? (
        <p>No patients found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {patients.map((patient) => (
            <li
              key={patient.patient_id}
              style={{
                border: "1px solid #ccc",
                padding: "12px",
                marginBottom: "10px",
                cursor: "pointer",
              }}
              onClick={() => navigate(`/patients/${patient.patient_id}`)}
            >
              <strong>{patient.name}</strong>
              <br />
              Age: {patient.age ?? "N/A"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

