import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

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

  // ✅ PDF DOWNLOAD FUNCTION
  const downloadPrescription = async (appointmentId) => {
    try {
      const res = await api.get(
        `/prescriptions/appointment/${appointmentId}/pdf`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `prescription_${appointmentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download prescription");
    }
  };

  const cancelAppointment = async (appointmentId) => {
  if (!window.confirm("Cancel this appointment?")) return;

  try {
    await api.patch(`/appointments/${appointmentId}/cancel`);
    
    window.location.reload();
  } catch (err) {
    alert("Failed to cancel appointment");
  }
};

  const completeAppointment = async (appointmentId) => {
  if (!window.confirm("Mark this appointment as completed?")) return;

  try {
    await api.patch(`/appointments/${appointmentId}/complete`);
    window.location.reload();
  } catch (err) {
    alert("Failed to complete appointment");
  }
};


  if (loading) {
    return <p style={{ padding: "20px" }}>Loading patient profile...</p>;
  }

  if (!profile.patient?.name) {
    return <p style={{ padding: "20px" }}>Patient not found.</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>{profile.patient.name}</h1>
      <p>Age: {profile.patient.age ?? "N/A"}</p>
      <p>Gender: {profile.patient.gender ?? "N/A"}</p>
      <p>Symptoms: {profile.patient.symptoms ?? "N/A"}</p>

      <button
        onClick={() => navigate(`/appointments/new?patient=${id}`)}
        style={{ marginTop: "10px" }}
      >
        + Add Appointment
      </button>

      <hr />

     <h2>Appointments</h2>

{profile.appointments.length === 0 ? (
  <p>No appointments found.</p>
) : (
  <ul style={{ listStyle: "none", padding: 0 }}>
    {profile.appointments.map((appt) => (
      <li
        key={appt.appointment_id}
        style={{
          border: "1px solid #ddd",
          padding: "10px",
          marginBottom: "10px"
        }}
      >
        <strong>
          {new Date(appt.appointment_date).toDateString()}
        </strong>{" "}
        at {appt.appointment_time}
        <br />
        Status: <strong>{appt.status}</strong>

        {/* ACTION BUTTONS */}
        {appt.status === "scheduled" && (
          <div style={{ marginTop: "8px" }}>
            <button
              onClick={() => completeAppointment(appt.appointment_id)}
              style={{ marginRight: "8px" }}
            >
              Complete
            </button>

            <button
              onClick={() => cancelAppointment(appt.appointment_id)}
            >
              Cancel
            </button>
          </div>
        )}
      </li>
    ))}
  </ul>
)}

<hr />


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
          </div>
        ))
      )}

      <hr />

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

      {/* ✅ PRESCRIPTIONS WITH PDF DOWNLOAD */}
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
            <strong>Instructions:</strong> {pres.instructions || "—"}

            <ul>
              {pres.medications.map((med, idx) => (
                <li key={idx}>
                  {med.medicine_name}
                  {med.dosage && ` — ${med.dosage}`}
                  {med.frequency && `, ${med.frequency}`}
                  {med.duration && `, ${med.duration}`}
                </li>
              ))}
            </ul>

            <button
              onClick={() => downloadPrescription(pres.appointment_id)}
              style={{ marginTop: "8px" }}
            >
              Download Prescription (PDF)
            </button>
          </div>
        ))
      )}
    </div>
  );
}
