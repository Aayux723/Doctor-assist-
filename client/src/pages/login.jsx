import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Login() {
  //State Variables
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();


  //the func that runs when the form is submitted 
  const handleLogin = async (e) => { //e is event obj  async because http req 
    e.preventDefault(); //HTML forms reload the page by default when submitted this stops it 
    setError("");

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      
      localStorage.setItem("token", res.data.token);

      
      navigate("/");
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto" }}>
      <h2>Doctor Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required //input must not be empty
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <button type="submit" style={{ width: "100%" }}>
          Login
        </button>

        {error && (
          <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
        )}
      </form>
    </div>
  );
}
