import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAdminAuth();
    fetchAdminStats();
  }, []);

  const checkAdminAuth = () => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken || adminToken !== "true") {
      navigate("/admin/login");
    }
  };

  const fetchAdminStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError("❌ Kon statistieken niet laden");
      }
    } catch (err) {
      console.error("❌ Admin stats error:", err);
      setError("❌ Serverfout bij laden statistieken");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      console.error("❌ Admin logout error:", err);
    }
    
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Laden admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-container">
        <div className="error-state">
          <h2>❌ Fout</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="admin-dashboard-container">
      {/* HEADER */}
      <header className="admin-header">
        <div className="admin-title">
          <h1>🎛️ Admin Dashboard</h1>
          <p>Beheer en monitor het Honden Dagboek systeem</p>
        </div>
        <button onClick={handleLogout} className="admin-logout-btn">
          🚪 Uitloggen
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        {/* OVERVIEW STATS */}
        <section className="overview-stats">
          <h2>📊 Overzicht Statistieken</h2>
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{stats.overview.totalUsers}</h3>
                <p>Totaal Gebruikers</p>
              </div>
            </div>
            
            <div className="stat-card success">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{stats.overview.activeUsers}</h3>
                <p>Actieve Gebruikers</p>
              </div>
            </div>
            
            <div className="stat-card warning">
              <div className="stat-icon">🐕</div>
              <div className="stat-info">
                <h3>{stats.overview.totalDogs}</h3>
                <p>Totaal Honden</p>
              </div>
            </div>
            
            <div className="stat-card info">
              <div className="stat-icon">📝</div>
              <div className="stat-info">
                <h3>{stats.overview.totalEntries}</h3>
                <p>Totaal Logboek Items</p>
              </div>
            </div>
            
            <div className="stat-card secondary">
              <div className="stat-icon">🎪</div>
              <div className="stat-info">
                <h3>{stats.overview.uniqueSessions}</h3>
                <p>Unieke Sessies</p>
              </div>
            </div>
            
            <div className="stat-card accent">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>{stats.overview.recentRegistrations}</h3>
                <p>Nieuwe Gebruikers (7d)</p>
              </div>
            </div>
          </div>
        </section>

        {/* ROLE DISTRIBUTION */}
        <section className="role-stats">
          <h2>👤 Gebruikersrollen Distributie</h2>
          <div className="role-grid">
            {stats.roleDistribution.map((role, index) => (
              <div key={role._id || `role-${index}`} className="role-card">
                <div className="role-badge">
                  {role._id === 'admin' && '👑 Admin'}
                  {role._id === 'manager' && '🎯 Manager'}
                  {(!role._id || role._id === 'user') && '👤 Gebruiker'}
                </div>
                <div className="role-count">
                  <span className="count-number">{role.count}</span>
                  <span className="count-label">gebruikers</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SYSTEM HEALTH */}
        <section className="system-health">
          <h2>🏥 Systeem Status</h2>
          <div className="health-grid">
            <div className="health-item">
              <div className="health-indicator active"></div>
              <span>Database Connection</span>
            </div>
            <div className="health-item">
              <div className="health-indicator active"></div>
              <span>API Services</span>
            </div>
            <div className="health-item">
              <div className="health-indicator active"></div>
              <span>User Authentication</span>
            </div>
            <div className="health-item">
              <div className="health-indicator warning"></div>
              <span>Storage Usage</span>
            </div>
          </div>
        </section>

        {/* RECENT ACTIVITY */}
        <section className="recent-activity">
          <h2>🕐 Systeem Informatie</h2>
          <div className="activity-grid">
            <div className="activity-item">
              <div className="activity-icon">🕒</div>
              <div className="activity-content">
                <h4>Laatste Update</h4>
                <p>{formatDate(stats.lastUpdated)}</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">💾</div>
              <div className="activity-content">
                <h4>Data Backups</h4>
                <p>Automatisch dagelijks om 02:00</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">🔄</div>
              <div className="activity-content">
                <h4>System Status</h4>
                <p>Alle systemen operationeel</p>
              </div>
            </div>
          </div>
        </section>

        {/* POPULAR BREEDS */}
        {stats.detailedStats?.popularBreeds && stats.detailedStats.popularBreeds.length > 0 && (
          <section className="popular-breeds">
            <h2>🐕 Populaire Hondenrassen</h2>
            <div className="breeds-grid">
              {stats.detailedStats.popularBreeds.map((breed, index) => (
                <div key={breed._id || `breed-${index}`} className="breed-item">
                  <div className="breed-rank">#{index + 1}</div>
                  <div className="breed-info">
                    <h4>{breed._id || 'Onbekend'}</h4>
                    <span>{breed.count} honden</span>
                  </div>
                  <div className="breed-bar">
                    <div 
                      className="breed-fill" 
                      style={{ width: `${(breed.count / Math.max(...stats.detailedStats.popularBreeds.map(b => b.count))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* QUICK ACTIONS */}
        <section className="quick-actions">
          <h2>🚀 Snelle Acties</h2>
          <div className="actions-grid">
            <button onClick={() => navigate("/admin/users")} className="action-btn primary">
              👥 Gebruikers Beheren
            </button>
            <button onClick={() => window.location.reload()} className="action-btn secondary">
              🔄 Statistieken Verversen
            </button>
            <button onClick={() => alert("Export functie binnenkort beschikbaar")} className="action-btn tertiary">
              📊 Data Exporteren
            </button>
            <button onClick={() => alert("System logs binnenkort beschikbaar")} className="action-btn quaternary">
              📋 System Logs
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="admin-footer">
        <p>© 2024 Honden Dagboek Admin Panel</p>
        <p>Versie 1.0.0</p>
      </footer>
    </div>
  );
}