import { useState ,useEffect} from "react";
import api from "../api/axios";
import { useNavigate ,useLocation} from "react-router-dom";

export default function AddAppointment() {
  const navigate = useNavigate();
  const location=useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    patient_id: "",
    diagnosis_text: "",
    instructions: "",
    medications: [
      {
        medicine_name: "",
        dosage: "",
        frequency: "",
        duration: ""
      }
    ]
  });

  useEffect(() => {
  const params = new URLSearchParams(location.search);
  const patientFromUrl = params.get("patient");

  if (patientFromUrl) {
    setForm((prev) => ({ //change the previous state form to the pid from url 
  ...prev,
  patient_id: patientFromUrl
}));

  }
}, [location.search]);


 


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };




  const handleMedicineChange = (index, e) => {
    const updatedMeds = [...form.medications];
    updatedMeds[index][e.target.name] = e.target.value;

    setForm({
      ...form,
      medications: updatedMeds
    });
  };

 
  
  const addMedicine = () => {
    setForm({
      ...form,
      medications: [
        ...form.medications,
        {
          medicine_name: "",
          dosage: "",
          frequency: "",
          duration: ""
        }
      ]
    });
  };

  
  
  const removeMedicine = (index) => {
    const updatedMeds = form.medications.filter((_, i) => i !== index);

    setForm({
      ...form,
      medications: updatedMeds
    });
  };

 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/appointments/full", {
        patient_id: Number(form.patient_id),
        diagnosis_text: form.diagnosis_text.trim(),
        instructions: form.instructions.trim(),
        medications: form.medications
      });

      navigate(`/patients/${form.patient_id}`);

    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create appointment"
      );
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div style={{ padding: "20px" }}>
      <h2>Add Appointment</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Patient ID</label>
          <input
            type="number"
            name="patient_id"
            value={form.patient_id}
            onChange={handleChange}
            required
            disabled
          />
        </div>

        <div>
          <label>Diagnosis</label>
          <input
            type="text"
            name="diagnosis_text"
            value={form.diagnosis_text}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Instructions</label>
          <textarea
            name="instructions"
            value={form.instructions}
            onChange={handleChange}
          />
        </div>

        <hr />

        <h4>Medications</h4>

        {form.medications.map((med, index) => (
          <div key={index} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
            <input
              name="medicine_name"
              placeholder="Medicine Name"
              value={med.medicine_name}
              onChange={(e) => handleMedicineChange(index, e)}
              required
            />

            <input
              name="dosage"
              placeholder="Dosage"
              value={med.dosage}
              onChange={(e) => handleMedicineChange(index, e)}
            />

            <input
              name="frequency"
              placeholder="Frequency"
              value={med.frequency}
              onChange={(e) => handleMedicineChange(index, e)}
            />

            <input
              name="duration"
              placeholder="Duration"
              value={med.duration}
              onChange={(e) => handleMedicineChange(index, e)}
            />

            {form.medications.length > 1 && (
              <button type="button" onClick={() => removeMedicine(index)}>
                Remove
              </button>
            )}
          </div>
        ))}

        <button type="button" onClick={addMedicine}>
          + Add Medicine
        </button>

        <br /><br />

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Create Appointment"}
        </button>
      </form>
    </div>
  );
}

