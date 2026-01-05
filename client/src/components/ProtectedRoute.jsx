import { Navigate } from "react-router-dom";
//Navigate is react Router component used for redirecting users 

export default function ProtectedRoute({ children }) {
    //children is whatever component is used inside the ProtectRoute
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
}
