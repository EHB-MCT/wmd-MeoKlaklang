import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    name: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5003";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Login succesvol! Doorgestuurd naar dashboard...');
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1500);
      } else {
        setMessage(`❌ ${data.error}`);
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessage('❌ Serverfout. Probeer het opnieuw.');
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="login-container">
        <div className="login-header">
          <h1>🔐 Admin Panel</h1>
          <p>Honden Dagboek Beheer</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <h2>Admin Login</h2>
          
          <div className="form-group">
            <label htmlFor="name">Gebruikersnaam</label>
            <input
              type="text"
              id="name"
              name="name"
              value={credentials.name}
              onChange={handleChange}
              required
              placeholder="Voer admin naam in"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Wachtwoord</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              placeholder="Voer wachtwoord in"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className={`login-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Inloggen...
              </>
            ) : (
              <>
                🔐 Inloggen
              </>
            )}
          </button>

          {message && (
            <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="login-links">
            <button 
              type="button" 
              className="back-link"
              onClick={() => navigate('/login')}
            >
              ← Terug naar gebruikers login
            </button>
          </div>
        </form>

        <div className="security-info">
          <h3>🔒 Beveiliging</h3>
          <p>Admin toegang vereist speciale rechten. Deze login is beveiligd met sessie management.</p>
          <ul>
            <li>✓ Admin-only authenticatie</li>
            <li>✓ Sessie timeout na 24 uur</li>
            <li>✓ HTTPS encryptie (production)</li>
            <li>✓ SQL injectie bescherming</li>
          </ul>
        </div>
      </div>
    </div>
  );
}