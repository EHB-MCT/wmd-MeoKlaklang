// src/pages/Profile.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");

  const [dogs, setDogs] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH DATA
  ========================= */
  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      try {
        const [dogsRes, entriesRes] = await Promise.all([
          fetch(`/api/dogs/${userId}`),
          fetch(`/api/entries?userId=${userId}`)
        ]);

        setDogs(await dogsRes.json());
        setEntries(await entriesRes.json());
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  /* =========================
     HELPERS
  ========================= */
  const dogEntries = (dogId) =>
    entries.filter((e) => e.dogId === dogId);

  const avg = (arr, field) =>
    arr.length
      ? Math.round(arr.reduce((s, e) => s + Number(e[field] || 0), 0) / arr.length)
      : 0;

  /* =========================
     TIPS ENGINE
  ========================= */
  const generateTips = (dog) => {
    const dEntries = dogEntries(dog._id);
    if (dEntries.length === 0) return [];

    const tips = [];
    const waterAvg = avg(dEntries, "water");
    const stressCount = dEntries.filter((e) => e.stressSignals).length;
    const painCount = dEntries.filter((e) => e.painSignals).length;

    if (waterAvg < 500) {
      tips.push({
        level: "medium",
        title: "💧 Lage waterinname",
        advice: [
          "Probeer een andere drinkbak (keramiek of metaal)",
          "Plaats meerdere drinkplekken",
          "Voeg wat water toe aan het eten"
        ]
      });
    }

    if (stressCount >= 3) {
      tips.push({
        level: "high",
        title: "⚠️ Veel stresssignalen",
        advice: [
          "Zorg voor meer rustmomenten",
          "Gebruik vaste wandelmomenten",
          "Overweeg mentale verrijking (snuffelmat)"
        ]
      });
    }

    if (painCount >= 2) {
      tips.push({
        level: "high",
        title: "🩺 Mogelijke pijn",
        advice: [
          "Observeer houding en beweging",
          "Vermijd intensieve inspanning",
          "Contacteer dierenarts indien aanhoudend"
        ]
      });
    }

    if (tips.length === 0) {
      tips.push({
        level: "soft",
        title: "✅ Alles ziet er goed uit",
        advice: ["Blijf zo verder doen!"]
      });
    }

    return tips;
  };

  /* =========================
     EARLY STATES
  ========================= */
  if (!userId) {
    return (
      <div className="profile-container">
        <p>Geen gebruiker gevonden. Log opnieuw in.</p>
        <button onClick={() => navigate("/login")}>Login</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-container loading-spinner">
        <div className="spinner" />
        Profiel laden...
      </div>
    );
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="profile-container">
      {/* HEADER */}
      <header className="profile-header">
        <h1>👤 Mijn Profiel</h1>
        <p>Overzicht, gezondheid & tips voor je honden</p>
      </header>

      {/* NAVIGATION (TERUG!) */}
      <nav className="nav-bar">
        <button onClick={() => navigate("/my-dogs")}>🐕 Mijn dieren</button>
        <button onClick={() => navigate("/daily-entry")}>📓 Logboek</button>
        <button className="active">👤 Profiel</button>
        <button onClick={() => navigate("/analytics")}>📊 Analyse</button>
        <button
          onClick={() =>
            userRole === "admin"
              ? navigate("/admin/dashboard")
              : navigate("/admin/login")
          }
        >
          🔐 Admin
        </button>
        <button
          className="logout"
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
        >
          🚪 Uitloggen
        </button>
      </nav>

      {/* DOG SECTIONS */}
      {dogs.map((dog) => {
        const dEntries = dogEntries(dog._id);
        const tips = generateTips(dog);

        return (
          <section key={dog._id} className="dog-section">
            <div className="dog-overview-card">
              <div className="dog-header">
                <h3>{dog.name}</h3>
                <span>{dog.breed}</span>
              </div>

              <div className="dog-stats">
                <div>
                  <strong>{dEntries.length}</strong>
                  <span>Logs</span>
                </div>
                <div>
                  <strong>{avg(dEntries, "walks")}</strong>
                  <span>Wandelingen</span>
                </div>
                <div>
                  <strong>{avg(dEntries, "sleepHours")}u</strong>
                  <span>Slaap</span>
                </div>
                <div>
                  <strong>{avg(dEntries, "water")}ml</strong>
                  <span>Water</span>
                </div>
              </div>

              {/* TIPS */}
              <div className="dog-tips">
                <h4>💡 Tips & Advies</h4>
                {tips.map((tip, i) => (
                  <div key={i} className={`tip-card tip-${tip.level}`}>
                    <h5>{tip.title}</h5>
                    <ul>
                      {tip.advice.map((a, j) => (
                        <li key={j}>{a}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <button
                className="log-btn"
                onClick={() => navigate(`/daily-entry?dogId=${dog._id}`)}
              >
                Log vandaag
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
