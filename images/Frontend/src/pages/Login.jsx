import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import analytics from "../utils/analytics";

export default function Login() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();

    const res = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // If you want the session cookie to be stored by the browser:
      credentials: "include",
      body: JSON.stringify({ name, password }),
    });

    const data = await res.json();

    if (res.ok) {
      const userId = data._id;
      const sessionId = data.sessionId;

      // Store identity (UID = userId)
      localStorage.setItem("userId", userId);
      localStorage.setItem("userName", data.name);
      localStorage.setItem("userRole", data.role || "user");

      // Store sessionId (use BACKEND sessionId only)
      if (sessionId) {
        localStorage.setItem("sessionId", sessionId);
      } else {
        console.warn("No sessionId returned from backend login response.");
      }

      // ✅ Start tracking AFTER login
      if (userId && sessionId) {
        analytics.start(userId, sessionId);
      }

      console.log("🔑 Login successful:", { userId, sessionId });

      setMessage(`✅ Welkom, ${data.name}`);
      setTimeout(() => {
        navigate("/my-dogs");
      }, 500);
    } else {
      setMessage(`❌ Fout: ${data.error}`);
    }
  }

  return (
    <div className="login-container">
      <div className="login-header">
        <h1>🔐 Login</h1>
        <p>Welkom terug! Log in op je account</p>
      </div>

      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label htmlFor="name">Gebruikersnaam</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Voer je gebruikersnaam in"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Wachtwoord</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Voer je wachtwoord in"
            required
          />
        </div>

        <button type="submit" className="submit-button">
          Inloggen
        </button>
      </form>

      {message && (
        <div className={`message ${message.includes("✅") ? "success" : "error"}`}>
          {message}
        </div>
      )}

      <div className="register-link">
        Nog geen account? <Link to="/register">Registreer hier</Link>
      </div>
    </div>
  );
}
