import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

export default function AdminLogin() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("adminToken", data.success ? "true" : "false");
        localStorage.setItem("adminUser", JSON.stringify(data.user));
        
        setMessage(`✅ Welkom Administrator: ${data.user.name}`);
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 1000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error("❌ Admin login error:", err);
      setMessage("❌ Serverfout. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-header">
        <h1>🔐 Admin Login</h1>
        <p>Beheer het Honden Dagboek systeem</p>
      </div>

      <form onSubmit={handleLogin} className="admin-login-form">
        <div className="form-group">
          <label htmlFor="name">Gebruikersnaam</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Voer je admin naam in"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Wachtwoord</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Voer je admin wachtwoord in"
            required
            disabled={loading}
          />
        </div>

        <button type="submit" className="admin-submit-button" disabled={loading}>
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Inloggen...
            </>
          ) : (
            <>🔐 Admin Login</>
          )}
        </button>
      </form>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="back-link">
        <span onClick={() => navigate("/login")} className="back-to-user">
          ← Terug naar gebruikers login
        </span>
      </div>
    </div>
  );
}