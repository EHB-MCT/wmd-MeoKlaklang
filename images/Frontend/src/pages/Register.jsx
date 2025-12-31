import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

export default function Register() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdminRequest, setIsAdminRequest] = useState(false);
  const navigate = useNavigate();


  // One handler for both inputs (uses input "name" attribute)
  const handleChange = (e) => {
    const { name: fieldName, value } = e.target;

    if (fieldName === "name") setName(value);
    if (fieldName === "password") setPassword(value);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const data = {
      name,
      password,
      isAdmin: isAdminRequest, // Checkbox for admin role request
    };

    try {
      const res = await fetch(`/api/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (res.ok) {
        setMessage("✅ Account aangemaakt!");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setMessage(`❌ ${responseData.error || "Registratie mislukt."}`);
        setLoading(false);
      }
    } catch (err) {
      console.error("❌ Fout bij registreren:", err);
      setMessage("❌ Serverfout. Probeer het opnieuw.");
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-header">
        <h1>📝 Registreren</h1>
        <p>Maak een account aan voor het bijhouden van je honden</p>
      </div>

      <form onSubmit={handleRegister} className="register-form">
        <h2>Nieuwe Account</h2>

        <div className="form-group">
          <label htmlFor="name">Gebruikersnaam</label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={handleChange}
            required
            placeholder="Voer je gebruikersnaam in"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Wachtwoord</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={handleChange}
            required
            placeholder="Voer een wachtwoord in"
            disabled={loading}
          />
        </div>

        <div className="form-group checkbox-group">
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              id="isAdmin"
              checked={isAdminRequest}
              onChange={(e) => setIsAdminRequest(e.target.checked)}
              disabled={loading}
            />
            <label htmlFor="isAdmin">Wil je een administrator worden?</label>
          </div>
        </div>

        <button
          type="submit"
          className={`submit-button ${loading ? "loading" : ""}`}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Registreren...
            </>
          ) : (
            <>📝 Account aanmaken</>
          )}
        </button>

        {message && (
          <div className={`message ${message.includes("✅") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        <div className="login-link">
          Al een account?{" "}
          <span onClick={() => navigate("/login")} style={{ cursor: 'pointer', color: '#667eea', fontWeight: '600' }}>
            Log hier in
          </span>
        </div>
      </form>
    </div>
  );
}
