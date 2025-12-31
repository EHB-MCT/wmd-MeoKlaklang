import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [dogs, setDogs] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDog, setExpandedDog] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("period");

  const handleAdminClick = () => {
    const userRole = localStorage.getItem("userRole");
    
    if (userRole === "admin" || userRole === "manager") {
      navigate("/admin/dashboard");
    } else {
      navigate("/admin/login");
    }
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [dogsRes, entriesRes] = await Promise.all([
          fetch(`/api/dogs/${userId}`),
          fetch(`/api/entries?userId=${userId}`),
        ]);

        const dogsData = await dogsRes.json();
        const entriesData = await entriesRes.json();

        setDogs(dogsData);
        setEntries(entriesData);
      } catch (err) {
        console.error("Error fetching profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  /* =========================
     ANALYSE FUNCTIES
  ========================= */
  const getDogStats = (dogId) => {
    const dogEntries = entries.filter((e) => e.dogId === dogId);
    const totalEntries = dogEntries.length;

    const daysAgo = selectedPeriod === "week" ? 7 : selectedPeriod === "month" ? 30 : 365;
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - daysAgo);

    const recentEntries = dogEntries.filter(
      (e) => new Date(e.date) >= periodStart
    ).length;

    const lastEntry = [...dogEntries].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )[0];

    // Calculate averages
    const avgWalks = dogEntries.length > 0 
      ? (dogEntries.reduce((sum, e) => sum + (e.walks || 0), 0) / dogEntries.length).toFixed(1)
      : 0;
    const avgSleep = dogEntries.length > 0 
      ? (dogEntries.reduce((sum, e) => sum + (e.sleepHours || 0), 0) / dogEntries.length).toFixed(1)
      : 0;
    const avgPlaytime = dogEntries.length > 0 
      ? (dogEntries.reduce((sum, e) => sum + (e.playtimeMinutes || 0), 0) / dogEntries.length).toFixed(0)
      : 0;

    // Health indicators
    const goodDays = dogEntries.filter(e => 
      !e.stressSignals && !e.painSignals && e.appetite !== 'slecht'
    ).length;
    const healthScore = dogEntries.length > 0 ? Math.round((goodDays / dogEntries.length) * 100) : 0;

    return { 
      totalEntries, 
      recentEntries, 
      lastEntry,
      avgWalks,
      avgSleep,
      avgPlaytime,
      healthScore,
      goodDays,
      badDays: dogEntries.length - goodDays
    };
  };

  const getHealthStatus = (dogId) => {
    const { recentEntries, healthScore } = getDogStats(dogId);
    
    if (healthScore >= 80) return { text: "Uitstekend", color: "#10b981", icon: "🟢" };
    if (healthScore >= 60) return { text: "Goed", color: "#3b82f6", icon: "🔵" };
    if (healthScore >= 40) return { text: "Let op", color: "#f59e0b", icon: "🟡" };
    return { text: "Kritiek", color: "#ef4444", icon: "🔴" };
  };

  const getHealthAlerts = () => {
    const alerts = [];
    const today = new Date();

    dogs.forEach((dog) => {
      const stats = getDogStats(dog._id);
      const dogEntries = entries.filter((e) => e.dogId === dog._id);
      
      // Missing logs alert
      if (dogEntries.length > 0) {
        const lastEntry = [...dogEntries].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        )[0];

        const daysAgo = Math.floor(
          (today - new Date(lastEntry.date)) / (1000 * 60 * 60 * 24)
        );

        if (daysAgo >= 3) {
          alerts.push({
            type: "warning",
            dogId: dog._id,
            title: `⚠️ ${dog.name} mist logs`,
            message: `Je hebt ${dog.name} al ${daysAgo} dagen niet gelogd.`,
            priority: daysAgo >= 7 ? "high" : "medium"
          });
        }
      } else {
        alerts.push({
          type: "info",
          dogId: dog._id,
          title: `📝 ${dog.name} heeft nog geen logs`,
          message: `Begin met het bijhouden van ${dog.name}'s dagelijkse activiteiten.`,
          priority: "low"
        });
      }

      // Health concerns
      const recentConcerns = dogEntries.filter(e => {
        const entryDate = new Date(e.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return entryDate >= weekAgo && (e.stressSignals || e.painSignals || e.appetite === 'slecht');
      });

      if (recentConcerns.length >= 3) {
        alerts.push({
          type: "error",
          dogId: dog._id,
          title: `🏥 ${dog.name} heeft gezondheidsproblemen`,
          message: `Meerdere signalen van stress, pijn of slechte eetlust deze week.`,
          priority: "high"
        });
      }
    });

    return alerts.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  /* =========================
     EARLY RETURNS (clean JSX)
  ========================= */
  if (!userId) {
    return (
      <div className="profile-container">
        <div style={{ padding: 20, textAlign: "center" }}>
          <h2>👤 Profiel</h2>
          <p>Geen gebruiker gevonden. Log opnieuw in.</p>
          <button onClick={() => navigate("/login")}>Ga naar login</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-container">
        <div style={{ padding: 20, textAlign: "center" }}>
          <p>⏳ Profiel laden...</p>
        </div>
      </div>
    );
  }

   if (dogs.length === 0) {
     return (
       <div className="profile-container">
         <header className="profile-header">
           <div className="header-content">
             <h1>👤 Mijn Profiel</h1>
             <p>Dashboard voor je honden en gezondheidstracking</p>
           </div>
           <div className="header-stats">
             <div className="stat-card">
               <span className="stat-number">0</span>
               <span className="stat-label">Honden</span>
             </div>
             <div className="stat-card">
               <span className="stat-number">0</span>
               <span className="stat-label">Logs</span>
             </div>
           </div>
         </header>

           <nav className="nav-bar">
        <button onClick={() => navigate("/my-dogs")}>🐕 Mijn dieren</button>
        <button onClick={() => navigate("/daily-entry")}>📓 Logboek</button>
        <button onClick={() => navigate("/analytics")}>📊 Analyse</button>
          <button onClick={handleAdminClick}>🔐 Admin</button>
        <button onClick={() => {
          localStorage.clear();
          navigate("/login");
        }} className="logout-button">🚪 Uitloggen</button>
         </nav>

         <div className="empty-state">
           <div className="empty-icon">🐕</div>
           <h2>Geen honden gevonden</h2>
           <p>Voeg je eerste hond toe om te beginnen met tracking!</p>
           <button className="primary-button" onClick={() => navigate("/my-dogs")}>
             + Hond toevoegen
           </button>
         </div>
       </div>
     );
   }

   const alerts = getHealthAlerts();

  /* =========================
     RENDER
  ========================= */
  const totalEntries = entries.length;
  const totalDogs = dogs.length;
  const activeDogsThisWeek = dogs.filter(dog => {
    const stats = getDogStats(dog._id);
    return stats.recentEntries > 0;
  }).length;

  return (
    <div className="profile-container">
      {/* HEADER */}
      <header className="profile-header">
        <div className="header-content">
          <h1>👤 Mijn Profiel</h1>
          <p>Dashboard voor je honden en gezondheidstracking</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{totalDogs}</span>
            <span className="stat-label">Honden</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{totalEntries}</span>
            <span className="stat-label">Logs</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{activeDogsThisWeek}</span>
            <span className="stat-label">Actief deze week</span>
          </div>
        </div>
      </header>

      {/* NAV */}
      <nav className="nav-bar">
        <button onClick={() => navigate("/my-dogs")}>🐕 Mijn dieren</button>
        <button onClick={() => navigate("/daily-entry")}>📓 Logboek</button>
        <button className="active">👤 Profiel</button>
      </nav>

      {/* PERIOD SELECTOR */}
      <div className="period-selector">
        <label>Periode:</label>
        <div className="period-buttons">
          {["week", "month", "year"].map(period => (
            <button
              key={period}
              className={`period-btn ${selectedPeriod === period ? "active" : ""}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period === "week" ? "Week" : period === "month" ? "Maand" : "Jaar"}
            </button>
          ))}
        </div>
      </div>

      {/* ALERTS */}
      {alerts.length > 0 && (
        <section className="alerts-section">
          <h2>🔔 Meldingen</h2>
          <div className="alerts-grid">
            {alerts.map((alert, i) => (
              <div key={i} className={`alert-card alert-${alert.type}`}>
                <div className="alert-header">
                  <span className="alert-icon">{alert.title}</span>
                  <span className="alert-priority">{alert.priority}</span>
                </div>
                <p>{alert.message}</p>
                <button 
                  className="alert-action"
                  onClick={() => navigate(`/daily-entry?dogId=${alert.dogId}`)}
                >
                  {alert.type === "info" ? "Start logging" : "Log nu"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DOG OVERVIEW */}
      <section className="dogs-overview">
        <div className="section-header">
          <h2>🐕 Honden Overzicht</h2>
          <button className="quick-action" onClick={() => navigate("/daily-entry")}>
            + Quick Log
          </button>
        </div>
        
        <div className="dogs-grid">
          {dogs.map((dog) => {
            const stats = getDogStats(dog._id);
            const health = getHealthStatus(dog._id);
            const isExpanded = expandedDog === dog._id;

            return (
              <div key={dog._id} className={`dog-card ${isExpanded ? "expanded" : ""}`}>
                {/* Dog Header */}
                <div className="dog-card-header">
                  <div className="dog-info">
                    <h3>{dog.name}</h3>
                    <p className="dog-breed">{dog.breed}</p>
                    {dog.age && <span className="dog-age">{dog.age} jaar</span>}
                  </div>
                  <div className="health-indicator">
                    <span className="health-icon">{health.icon}</span>
                    <span
                      className="health-badge"
                      style={{ backgroundColor: health.color }}
                    >
                      {health.text}
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="quick-stats">
                  <div className="stat-item">
                    <span className="stat-value">{stats.recentEntries}</span>
                    <span className="stat-desc">logs {selectedPeriod}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{stats.healthScore}%</span>
                    <span className="stat-desc">gezondheid</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{stats.avgWalks}</span>
                    <span className="stat-desc">gem. wandelingen</span>
                  </div>
                </div>

                {/* Detailed Stats (when expanded) */}
                {isExpanded && (
                  <div className="detailed-stats">
                    <div className="stats-row">
                      <div className="stat-group">
                        <h4>Activiteit</h4>
                        <div className="mini-stat">
                          <span>🚶 {stats.avgWalks} wandelingen/dag</span>
                        </div>
                        <div className="mini-stat">
                          <span>🎾 {stats.avgPlaytime} min. speeltijd</span>
                        </div>
                        <div className="mini-stat">
                          <span>😴 {stats.avgSleep} uur slaap</span>
                        </div>
                      </div>
                      <div className="stat-group">
                        <h4>Gezondheid</h4>
                        <div className="mini-stat">
                          <span>✅ {stats.goodDays} goede dagen</span>
                        </div>
                        <div className="mini-stat">
                          <span>⚠️ {stats.badDays} care dagen</span>
                        </div>
                        <div className="health-bar">
                          <div 
                            className="health-fill" 
                            style={{ width: `${stats.healthScore}%`, backgroundColor: health.color }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Entries Preview */}
                    <div className="recent-entries">
                      <h4>Recente Logs</h4>
                      {entries
                        .filter((e) => e.dogId === dog._id)
                        .slice(0, 3)
                        .map((entry, idx) => (
                          <div key={idx} className="entry-preview">
                            <div className="entry-date">{formatDate(entry.date)}</div>
                            <div className="entry-details">
                              <span>🍽️ {entry.food || "Onbekend"}</span>
                              <span>🐾 {entry.behavior || "Normaal"}</span>
                              <span>💧 {entry.water || 0}L water</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="dog-actions">
                  <button
                    className="expand-btn"
                    onClick={() => setExpandedDog(isExpanded ? null : dog._id)}
                  >
                    {isExpanded ? "Toon minder" : "Toon details"}
                  </button>
                  <button 
                    className="log-btn"
                    onClick={() => navigate(`/daily-entry?dogId=${dog._id}`)}
                  >
                    Log nu
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="quick-actions-section">
        <h2>⚡ Snelle Acties</h2>
        <div className="quick-actions-grid">
          <button className="action-card" onClick={() => navigate("/daily-entry")}>
            <span className="action-icon">📝</span>
            <span className="action-title">Nieuwe Log</span>
            <span className="action-desc">Voeg dagelijkse data toe</span>
          </button>
          <button className="action-card" onClick={() => navigate("/my-dogs")}>
            <span className="action-icon">🐕</span>
            <span className="action-title">Beheer Honden</span>
            <span className="action-desc">Voeg honden toe of bewerk</span>
          </button>
          <button className="action-card" onClick={() => navigate("/dashboard")}>
            <span className="action-icon">📊</span>
            <span className="action-title">Analytics</span>
            <span className="action-desc">Bekijk gedetailleerde stats</span>
          </button>
        </div>
      </section>
    </div>
  );
}
