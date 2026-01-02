// src/pages/Profile.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [dogs, setDogs] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDog, setExpandedDog] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("week"); // week | month | year

  const handleAdminClick = () => {
    const userRole = localStorage.getItem("userRole");
    if (userRole === "admin" || userRole === "manager") navigate("/admin/dashboard");
    else navigate("/admin/login");
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [dogsRes, entriesRes] = await Promise.all([
          fetch(`/api/dogs/${userId}`),
          fetch(`/api/entries?userId=${userId}`),
        ]);

        const dogsData = await dogsRes.json();
        const entriesData = await entriesRes.json();

        setDogs(Array.isArray(dogsData) ? dogsData : []);
        setEntries(Array.isArray(entriesData) ? entriesData : []);
        console.log("📊 Profile data loaded:", {
          dogsCount: (dogsData || []).length,
          entriesCount: (entriesData || []).length,
        });
      } catch (err) {
        console.error("Error fetching profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  /* =========================
     HELPERS
  ========================= */
  const daysAgoFromPeriod = (period) => {
    if (period === "week") return 7;
    if (period === "month") return 30;
    return 365;
  };

  const safeNum = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  /* =========================
     INSIGHTS
  ========================= */
  const generateInsights = (allEntries, dogId) => {
    const alerts = [];
    const today = new Date();

    const dogEntries = allEntries.filter((e) => e.dogId === dogId);
    if (dogEntries.length === 0) return alerts;

    // baseline = laatste 14 dagen (of alle entries als je minder hebt)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const baselineEntries = dogEntries.filter((e) => new Date(e.date) >= fourteenDaysAgo);
    const base = baselineEntries.length > 0 ? baselineEntries : dogEntries;

    const baselineSleep =
      base.reduce((sum, e) => sum + safeNum(e.sleepHours, 0), 0) / base.length;
    const baselineWater =
      base.reduce((sum, e) => sum + safeNum(e.water, 0), 0) / base.length;
    const baselineWalks =
      base.reduce((sum, e) => sum + safeNum(e.walks, 0), 0) / base.length;

    const lastEntry = [...dogEntries].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    if (!lastEntry) return alerts;

    // 3+ dagen niet gelogd
    const lastEntryDate = new Date(lastEntry.date);
    const daysSinceLastEntry = Math.floor((today - lastEntryDate) / (1000 * 60 * 60 * 24));
    if (daysSinceLastEntry >= 3) {
      alerts.push({
        severity: "warning",
        title: "Logging gemist",
        message: `${daysSinceLastEntry} dagen sinds laatste log.`,
        ctaLabel: "Log nu",
        ctaPath: `/daily-entry?dogId=${dogId}`,
      });
    }

    // weinig slaap
    if (safeNum(lastEntry.sleepHours, 0) < baselineSleep - 2) {
      alerts.push({
        severity: "warning",
        title: "Weinig slaap",
        message: `Laatste slaap: ${safeNum(lastEntry.sleepHours, 0)}u (gemiddeld: ${baselineSleep.toFixed(
          1
        )}u)`,
        ctaLabel: "Onderzoek",
        ctaPath: `/daily-entry?dogId=${dogId}`,
      });
    }

    // lage waterinname
    if (safeNum(lastEntry.water, 0) < baselineWater * 0.7) {
      alerts.push({
        severity: "info",
        title: "Lage waterinname",
        message: `Laatste: ${safeNum(lastEntry.water, 0)}ml (gemiddeld: ${Math.round(
          baselineWater
        )}ml)`,
        ctaLabel: "Log water",
        ctaPath: `/daily-entry?dogId=${dogId}`,
      });
    }

    // diarree/zacht + lage waterinname = urgent
    if (
      (lastEntry.poop === "Diarree" || lastEntry.poop === "Zacht") &&
      safeNum(lastEntry.water, 0) < baselineWater * 0.7
    ) {
      alerts.push({
        severity: "urgent",
        title: "Overweeg dierenarts",
        message: "Diarree/Zacht + lage waterinname. Blijft dit aanhouden? Raadpleeg een dierenarts.",
        ctaLabel: "Log symptomen",
        ctaPath: `/daily-entry?dogId=${dogId}`,
      });
    }

    // stress/pijn laatste 7 dagen
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentConcerns = dogEntries.filter((e) => {
      const d = new Date(e.date);
      return d >= sevenDaysAgo && (e.stressSignals || e.painSignals);
    });

    if (recentConcerns.length >= 2) {
      alerts.push({
        severity: recentConcerns.length >= 4 ? "urgent" : "warning",
        title: "Stress/pijn signalen",
        message: `${recentConcerns.length} keer gedetecteerd in laatste 7 dagen`,
        ctaLabel: "Observeer",
        ctaPath: `/daily-entry?dogId=${dogId}`,
      });
    }

    // (optioneel) heel simpele activiteit: extreem minder wandelingen
    if (safeNum(lastEntry.walks, 0) < baselineWalks - 2) {
      alerts.push({
        severity: "info",
        title: "Minder wandelingen",
        message: `Laatste: ${safeNum(lastEntry.walks, 0)} (gemiddeld: ${baselineWalks.toFixed(1)})`,
        ctaLabel: "Log vandaag",
        ctaPath: `/daily-entry?dogId=${dogId}`,
      });
    }

    return alerts;
  };

  const getDogStats = (dogId) => {
    const dogEntries = entries.filter((e) => e.dogId === dogId);
    const totalEntries = dogEntries.length;

    const daysAgo = daysAgoFromPeriod(selectedPeriod);
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - daysAgo);

    const recentEntries = dogEntries.filter((e) => new Date(e.date) >= periodStart).length;

    const lastEntry = [...dogEntries].sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    const avgWalks =
      totalEntries > 0
        ? (dogEntries.reduce((sum, e) => sum + safeNum(e.walks, 0), 0) / totalEntries).toFixed(1)
        : "0.0";
    const avgSleep =
      totalEntries > 0
        ? (dogEntries.reduce((sum, e) => sum + safeNum(e.sleepHours, 0), 0) / totalEntries).toFixed(1)
        : "0.0";
    const avgPlaytime =
      totalEntries > 0
        ? (dogEntries.reduce((sum, e) => sum + safeNum(e.playtimeMinutes, 0), 0) / totalEntries).toFixed(0)
        : "0";

    const goodDays = dogEntries.filter(
      (e) => !e.stressSignals && !e.painSignals && e.appetite !== "Slecht"
    ).length;
    const healthScore = totalEntries > 0 ? Math.round((goodDays / totalEntries) * 100) : 0;

    return {
      totalEntries,
      recentEntries,
      lastEntry,
      avgWalks,
      avgSleep,
      avgPlaytime,
      healthScore,
      goodDays,
      badDays: totalEntries - goodDays,
    };
  };

  const getHealthStatus = (dogId) => {
    const { healthScore } = getDogStats(dogId);
    if (healthScore >= 80) return { text: "Uitstekend", color: "#10b981", icon: "🟢" };
    if (healthScore >= 60) return { text: "Goed", color: "#3b82f6", icon: "🔵" };
    if (healthScore >= 40) return { text: "Let op", color: "#f59e0b", icon: "🟡" };
    return { text: "Kritiek", color: "#ef4444", icon: "🔴" };
  };

  /* =========================
     BUILD INSIGHTS LIST
  ========================= */
  const finalInsights = useMemo(() => {
    const all = [];
    dogs.forEach((dog) => {
      const insights = generateInsights(entries, dog._id);
      insights.forEach((ins) => {
        all.push({ ...ins, dogId: dog._id, dogName: dog.name });
      });
    });

    // max 2 per hond, sorted by severity
    const severityOrder = { urgent: 0, warning: 1, info: 2 };
    const grouped = new Map();

    all.forEach((ins) => {
      const key = ins.dogId;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(ins);
    });

    const out = [];
    grouped.forEach((arr) => {
      arr.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
      out.push(...arr.slice(0, 2));
    });

    // overall sort so urgent shows first
    out.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    return out;
  }, [dogs, entries]);

  /* =========================
     EARLY RETURNS
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

  const totalEntries = entries.length;
  const totalDogs = dogs.length;

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
        </div>
      </header>

      {/* NAVIGATION */}
      <nav className="nav-bar">
        <button onClick={() => navigate("/my-dogs")}>🐕 Mijn dieren</button>
        <button onClick={() => navigate("/daily-entry")}>📓 Logboek</button>
        <button className="active">👤 Profiel</button>
        <button onClick={() => navigate("/analytics")}>📊 Analyse</button>
        <button onClick={handleAdminClick}>🔐 Admin</button>
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
        >
          🚪 Uitloggen
        </button>
      </nav>

      {/* QUICK ACTIONS */}
      <section className="quick-actions-section">
        <h2>⚡ Snelle acties</h2>
        <div className="quick-actions-grid">
          <button className="action-card" onClick={() => navigate("/daily-entry")}>
            <span className="action-icon">📝</span>
            <span className="action-title">Nieuwe log</span>
            <span className="action-desc">Voeg dagelijkse data in</span>
          </button>

          <button className="action-card" onClick={() => navigate("/my-dogs")}>
            <span className="action-icon">🐕</span>
            <span className="action-title">Mijn dieren</span>
            <span className="action-desc">Beheer je honden</span>
          </button>

          <button className="action-card" onClick={() => navigate("/analytics")}>
            <span className="action-icon">📊</span>
            <span className="action-title">Analyse</span>
            <span className="action-desc">Bekijk trends & signalen</span>
          </button>
        </div>
      </section>

      {/* PERIOD SELECTOR */}
      <div className="period-selector">
        <label>Periode:</label>
        <div className="period-buttons">
          {["week", "month", "year"].map((period) => (
            <button
              key={period}
              className={`period-btn ${selectedPeriod === period ? "active" : ""}`}
              onClick={() => setSelectedPeriod(period)}
              type="button"
            >
              {period === "week" ? "Week" : period === "month" ? "Maand" : "Jaar"}
            </button>
          ))}
        </div>
      </div>

      {/* INSIGHTS */}
      {finalInsights.length > 0 && (
        <section className="insights-section">
          <h2>💡 Inzichten</h2>
          <div className="insights-grid">
            {finalInsights.map((insight, idx) => (
              <div key={`${insight.dogId}_${idx}`} className={`insight-card insight-${insight.severity}`}>
                <div className="insight-header">
                  <span className="insight-dog">{insight.dogName}</span>
                  <span className="insight-severity">{insight.severity}</span>
                </div>
                <div className="insight-content">
                  <h4>{insight.title}</h4>
                  <p>{insight.message}</p>
                </div>
                <button className="insight-cta" onClick={() => navigate(insight.ctaPath)}>
                  {insight.ctaLabel}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DOG OVERVIEW */}
      <section className="dogs-overview">
        <div className="section-header">
          <h2>🐕 Honden overzicht</h2>
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
                <div className="dog-card-header">
                  <div className="dog-info">
                    <h3>{dog.name}</h3>
                    <p className="dog-breed">{dog.breed}</p>
                    {dog.age && <span className="dog-age">{dog.age} jaar</span>}
                  </div>

                  <div className="health-indicator">
                    <span className="health-icon">{health.icon}</span>
                    <span className="health-badge" style={{ backgroundColor: health.color }}>
                      {health.text}
                    </span>
                  </div>
                </div>

                <div className="quick-stats">
                  <div className="stat-item">
                    <span className="stat-value">{stats.recentEntries}</span>
                    <span className="stat-desc">logs ({selectedPeriod})</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{stats.healthScore}%</span>
                    <span className="stat-desc">gezondheid</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{stats.avgWalks}</span>
                    <span className="stat-desc">wandelingen/dag</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="recent-entries">
                    <h4>Recente logs</h4>
                    {entries
                      .filter((e) => e.dogId === dog._id)
                      .slice(0, 3)
                      .map((entry, idx2) => (
                        <div key={idx2} className="entry-preview">
                          <div className="entry-date">{formatDate(entry.date)}</div>
                          <div className="entry-details">
                            <span>🍽️ {entry.food || "Onbekend"}</span>
                            <span>🐾 {entry.behavior || "Onbekend"}</span>
                            <span>💧 {safeNum(entry.water, 0)}ml</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                <div className="dog-actions">
                  <button className="expand-btn" onClick={() => setExpandedDog(isExpanded ? null : dog._id)}>
                    {isExpanded ? "Toon minder" : "Toon details"}
                  </button>
                  <button className="log-btn" onClick={() => navigate(`/daily-entry?dogId=${dog._id}`)}>
                    Log nu
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
