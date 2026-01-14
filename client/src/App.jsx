import { Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientProfile from "./pages/PatientProfile";
import AddPatient from "./pages/AddPatient";
import Appointments from "./pages/appointments";
import AddAppointment from "./pages/AddAppointment";

import ProtectedRoute from "./components/ProtectedRoute";
import DashLayout from "./layouts/DashLayout";

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected + Layout */}
      <Route
        element={
          <ProtectedRoute>
            <DashLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/new" element={<AddPatient />} />
        <Route path="/patients/:id" element={<PatientProfile />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/appointments/new" element={<AddAppointment />} />
      </Route>
    </Routes>
  );
}

export default App;

