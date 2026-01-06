import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Frontend-normalized shape
  const [profile, setProfile] = useState({
    patient: {},
    appointments: [],
    diagnoses: [],
    notes: [],
    documents: [],
    prescriptions: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/patients/${id}/profile`);

        console.log("Patient profile API response:", res.data);

        // Normalize backend → frontend
        setProfile({
          patient: res.data.patient || {},
          appointments: res.data.appointments || [],
          diagnoses: res.data.diagnoses || [],
          notes: res.data.clinical_notes || [],
          documents: res.data.documents || [],
          prescriptions: res.data.prescriptions || []
        });
      } catch (error) {
        console.error("Error fetching patient profile", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return <p style={{ padding: "20px" }}>Loading patient profile...</p>;
  }

  if (!profile.patient?.name) {
    return <p style={{ padding: "20px" }}>Patient not found.</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* ================= PATIENT INFO ================= */}
      <h1>{profile.patient.name}</h1>
      <p>Age: {profile.patient.age ?? "N/A"}</p>
      <p>Gender: {profile.patient.gender ?? "N/A"}</p>
      <p>Symptoms: {profile.patient.symptoms ?? "N/A"}</p>

      {/* ADD APPOINTMENT BUTTON */}
      <button
        onClick={() => navigate(`/appointments/new?patient=${id}`)}
        style={{ marginTop: "10px" }}
      >
        + Add Appointment
      </button>

      <hr />

      {/* ================= APPOINTMENTS ================= */}
      <h2>Appointments</h2>
      {profile.appointments.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        <ul>
          {profile.appointments.map((appt) => (
            <li key={appt.appointment_id}>
              {new Date(appt.appointment_date).toDateString()} at{" "}
              {appt.appointment_time} — {appt.status}
            </li>
          ))}
        </ul>
      )}

      <hr />

      {/* ================= DIAGNOSES ================= */}
      <h2>Diagnoses</h2>
      {profile.diagnoses.length === 0 ? (
        <p>No diagnoses found.</p>
      ) : (
        profile.diagnoses.map((diag) => (
          <div
            key={diag.diagnosis_id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px"
            }}
          >
            <strong>{diag.diagnosis_text}</strong>

            {diag.medications?.length === 0 ? (
              <p>No medications.</p>
            ) : (
              <ul>
                {diag.medications.map((med) => (
                  <li key={med.medication_id}>
                    {med.medicine_name}
                    {med.dosage && ` — ${med.dosage}`}
                    {med.frequency && `, ${med.frequency}`}
                    {med.duration && `, ${med.duration}`}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}

      <hr />

      {/* ================= CLINICAL NOTES ================= */}
      <h2>Clinical Notes</h2>
      {profile.notes.length === 0 ? (
        <p>No clinical notes.</p>
      ) : (
        <ul>
          {profile.notes.map((note) => (
            <li key={note.note_id}>
              {note.note_text} (
              {new Date(note.created_at).toLocaleDateString()})
            </li>
          ))}
        </ul>
      )}

      <hr />

      {/* ================= DOCUMENTS ================= */}
      <h2>Documents</h2>
      {profile.documents.length === 0 ? (
        <p>No documents uploaded.</p>
      ) : (
        <ul>
          {profile.documents.map((doc) => (
            <li key={doc.document_id}>
              {doc.document_label} ({doc.file_format})
            </li>
          ))}
        </ul>
      )}

      <hr />

      {/* ================= PRESCRIPTIONS ================= */}
      <h2>Prescriptions</h2>
      {profile.prescriptions.length === 0 ? (
        <p>No prescriptions found.</p>
      ) : (
        profile.prescriptions.map((pres) => (
          <div
            key={pres.prescription_id}
            style={{
              border: "1px dashed #999",
              padding: "10px",
              marginBottom: "10px"
            }}
          >
            <strong>Diagnosis:</strong> {pres.diagnosis_text}
            <br />
            <strong>Instructions:</strong> {pres.instructions}

            <ul>
              {pres.medications.map((med, idx) => (
                <li key={idx}>
                  {med.medicine_name} — {med.dosage}, {med.frequency},{" "}
                  {med.duration}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

