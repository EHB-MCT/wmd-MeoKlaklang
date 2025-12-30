import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Analytics.css";

export default function Analytics() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  
  const [analytics, setAnalytics] = useState({
    formBehavior: {},
    scrollBehavior: {},
    timeOnPage: [],
    timeRange: '7d'
  });
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  // API_BASE from environment
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5003";

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/events/patterns/${userId}?timeRange=${timeRange}`);
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId, timeRange]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m`;
  };

  const getHesitationColor = (score) => {
    if (score < 20) return "#48bb78"; // Green - low hesitation
    if (score < 50) return "#ed8936"; // Orange - medium hesitation
    return "#f56565"; // Red - high hesitation
  };

  const getEngagementColor = (rate) => {
    if (rate > 0.7) return "#48bb78"; // Green - high engagement
    if (rate > 0.4) return "#ed8936"; // Orange - medium engagement
    return "#f56565"; // Red - low engagement
  };

  if (!userId) {
    return (
      <div className="analytics-container">
        <div className="loading-state">
          <h2>📊 Gebruikersanalyse</h2>
          <p>Log eerst in om analyses te bekijken.</p>
          <button onClick={() => navigate("/login")}>Inloggen</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-state">
          <h2>📊 Gebruikersanalyse</h2>
          <p>⏳ Analytics laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h1>📊 Gebruikersanalyse</h1>
        <p>Inzicht in gebruikersgedrag en patronen</p>
        
        <div className="time-range-selector">
          <label>Periode:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="1d">Laatste 24 uur</option>
            <option value="7d">Laatste 7 dagen</option>
            <option value="30d">Laatste 30 dagen</option>
          </select>
        </div>
      </header>

      <nav className="nav-bar">
        <button onClick={() => navigate("/my-dogs")}>🐕 Mijn dieren</button>
        <button onClick={() => navigate("/daily-entry")}>📓 Logboek</button>
        <button onClick={() => navigate("/dashboard")}>📈 Dashboard</button>
        <button className="active">📊 Analyse</button>
        <button onClick={() => navigate("/profile")}>👤 Profiel</button>
      </nav>

      {/* FORM BEHAVIOR ANALYSIS */}
      <section className="analysis-section">
        <h2>🔍 Formuliergedrag Analyse</h2>
        
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Talrijheid Score</h3>
            <div className="metric-value" style={{ color: getHesitationColor(analytics.formBehavior.avgHesitationScore || 0) }}>
              {analytics.formBehavior.avgHesitationScore || 0}%
            </div>
            <div className="metric-description">
              Gemiddelde percentage gebruikers die aarzelen in formulieren
            </div>
          </div>

          <div className="metric-card">
            <h3>Formulier Inzendingen</h3>
            <div className="metric-value">
              {analytics.formBehavior.avgSubmitAttempts || 0}
            </div>
            <div className="metric-description">
              Gemiddeld aantal pogingen per formulier
            </div>
          </div>

          <div className="metric-card">
            <h3>Sessie-tijd</h3>
            <div className="metric-value">
              {formatTime(analytics.formBehavior.totalFormTime || 0)}
            </div>
            <div className="metric-description">
              Gemiddelde tijd om een formulier in te vullen
            </div>
          </div>
        </div>
      </section>

      {/* SCROLL BEHAVIOR ANALYSIS */}
      <section className="analysis-section">
        <h2>📜 Scroll-gedrag Analyse</h2>
        
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Gemiddelde Scroll-diepte</h3>
            <div className="metric-value">
              {Math.round(analytics.scrollBehavior.avgMaxScrollDepth || 0)}%
            </div>
            <div className="metric-description">
              Gemiddelde hoeveelheid van pagina's die gebruikers bekijken
            </div>
          </div>

          <div className="metric-card">
            <h3>Engagement Score</h3>
            <div className="metric-value" style={{ color: getEngagementColor(analytics.scrollBehavior.engagementRate || 0) }}>
              {Math.round((analytics.scrollBehavior.engagementRate || 0) * 100)}%
            </div>
            <div className="metric-description">
              Percentage van sessies met hoge scroll-diepte (>80%)
            </div>
          </div>
        </div>
      </section>

      {/* TIME ON PAGE ANALYSIS */}
      <section className="analysis-section">
        <h2>⏱️ Tijd per Pagina Analyse</h2>
        
        <div className="table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Pagina</th>
                <th>Bezoeken</th>
                <th>Gem. Tijd</th>
                <th>Bounce Rate</th>
              </tr>
            </thead>
            <tbody>
              {analytics.timeOnPage.map((page, index) => (
                <tr key={index}>
                  <td>
                    {page._id === window.location.pathname ? (
                      <strong>{page._id}</strong>
                    ) : (
                      <a href={page._id}>{page._id}</a>
                    )}
                  </td>
                  <td>{page.visitCount}</td>
                  <td>{formatTime(page.avgTimeOnPage)}</td>
                  <td>
                    <span className={`bounce-rate ${page.bounceRate > 0.5 ? 'high' : 'low'}`}>
                      {Math.round(page.bounceRate * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* INSIGHTS & RECOMMENDATIONS */}
      <section className="analysis-section">
        <h2>💡 Inzichten & Aanbevelingen</h2>
        
        <div className="insights-grid">
          {analytics.formBehavior.avgHesitationScore > 50 && (
            <div className="insight-card warning">
              <h3>⚠️ Hoge Talrijheid Gevonden</h3>
              <p>
                Gebruikers aarzelen significant bij het invullen van formulieren.
                Overweeg formuliervelden te vereenvoudigen of betere validatie-feedback te geven.
              </p>
            </div>
          )}

          {analytics.scrollBehavior.engagementRate < 0.4 && (
            <div className="insight-card warning">
              <h3>📉 Lage Pagina-engagement</h3>
              <p>
                Gebruikers scrollen niet diep door pagina's.
                Overweeg belangrijke content hoger op de pagina te plaatsen.
              </p>
            </div>
          )}

          {analytics.formBehavior.avgSubmitAttempts > 3 && (
            <div className="insight-card warning">
              <h3>🔄 Veel Formulierpogingen</h3>
              <p>
                Gebruikers hebben meerdere pogingen nodig om formulieren in te sturen.
                Controleer validatieregels en foutmeldingen.
              </p>
            </div>
          )}

          {(analytics.formBehavior.avgHesitationScore < 20 && analytics.scrollBehavior.engagementRate > 0.7) && (
            <div className="insight-card success">
              <h3>✅ Uitstekende UX</h3>
              <p>
                Gebruikers tonen lage talrijheid en hoge engagement.
                De huidige interface werkt goed voor de gebruikers.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}