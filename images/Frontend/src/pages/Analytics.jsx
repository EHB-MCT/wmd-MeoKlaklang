// src/pages/Analytics.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import "./Analytics.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// -----------------------------
// Helpers
// -----------------------------
const TIME_RANGES = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const ALL_EMOTIONS = [
  "Blij",
  "Kalm",
  "Energiek",
  "Neutraal",
  "Angstig",
  "Gestrest",
  "Verdrietig",
  "Boos",
  "Slaperig",
  "Speels",
];

const isoDay = (d) => {
  const date = new Date(d);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toNlShort = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}`;
};

const clampNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const getStartDate = (timeRange) => {
  const days = TIME_RANGES[timeRange] ?? 30;
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return start;
};

const makeDaySeries = (timeRange) => {
  const start = getStartDate(timeRange);
  const days = TIME_RANGES[timeRange] ?? 30;

  const labels = [];
  const keys = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = isoDay(d);
    keys.push(key);
    labels.push(toNlShort(key));
  }
  return { keys, labels };
};

// -----------------------------
// Component
// -----------------------------
export default function Analytics() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");
  const [timeRange, setTimeRange] = useState("30d");

  const [dogs, setDogs] = useState([]);
  const [selectedDogId, setSelectedDogId] = useState("all");

  const [sessions, setSessions] = useState([]);
  const [entries, setEntries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -----------------------------
  // Fetch
  // -----------------------------
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError("Geen userId gevonden. Log opnieuw in.");
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      setError("");

      try {
        const [sessionsRes, entriesRes, dogsRes] = await Promise.all([
          fetch(`/api/sessions/user/${userId}?timeRange=${timeRange}`, { credentials: "include" }),
          fetch(`/api/entries?userId=${userId}`, { credentials: "include" }),
          fetch(`/api/dogs/${userId}`, { credentials: "include" }),
        ]);

        if (!sessionsRes.ok) throw new Error(`Sessions error (${sessionsRes.status})`);
        if (!entriesRes.ok) throw new Error(`Entries error (${entriesRes.status})`);
        if (!dogsRes.ok) throw new Error(`Dogs error (${dogsRes.status})`);

        const sessionsData = await sessionsRes.json();
        const entriesData = await entriesRes.json();
        const dogsData = await dogsRes.json();

        setSessions(Array.isArray(sessionsData?.sessions) ? sessionsData.sessions : []);
        setEntries(Array.isArray(entriesData) ? entriesData : []);
        setDogs(Array.isArray(dogsData) ? dogsData : []);
      } catch (e) {
        console.error(e);
        setError("❌ Kon analytics data niet laden. Check backend routes/logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [userId, timeRange]);

  // -----------------------------
  // Filter entries by dog + timeRange
  // -----------------------------
  const filteredEntries = useMemo(() => {
    const start = getStartDate(timeRange);
    return entries.filter((e) => {
      const inRange = new Date(e.date || e.createdAt || Date.now()) >= start;
      const matchesDog = selectedDogId === "all" ? true : String(e.dogId) === String(selectedDogId);
      return inRange && matchesDog;
    });
  }, [entries, timeRange, selectedDogId]);

  const filteredSessions = useMemo(() => {
    const start = getStartDate(timeRange);
    return sessions.filter((s) => new Date(s.createdAt || s.startTime || Date.now()) >= start);
  }, [sessions, timeRange]);

  // -----------------------------
  // Stats
  // -----------------------------
  const stats = useMemo(() => {
    const totalSessions = filteredSessions.length;

    const totalDurationMs = filteredSessions.reduce(
      (sum, s) => sum + clampNumber(s.calculatedDuration, 0),
      0
    );

    const avgDurationMin =
      totalSessions > 0 ? Math.round(totalDurationMs / totalSessions / 1000 / 60) : 0;

    const totalPageViews = filteredSessions.reduce((sum, s) => sum + clampNumber(s.pageViews, 0), 0);

    const lastLogin =
      filteredSessions.length > 0
        ? new Date(filteredSessions[0]?.createdAt).toLocaleString("nl-NL")
        : "Nooit";

    const activeDays = new Set(
      filteredSessions.map((s) => isoDay(s.createdAt || s.startTime || Date.now()))
    ).size;

    return {
      totalSessions,
      avgDurationMin,
      totalDurationMin: Math.round(totalDurationMs / 1000 / 60),
      totalPageViews,
      lastLogin,
      activeDays,
      entriesCount: filteredEntries.length,
    };
  }, [filteredSessions, filteredEntries]);

  // -----------------------------
  // Charts data builders
  // -----------------------------
  const chartTheme = {
    grid: "rgba(17, 24, 39, 0.08)",
    text: "#111827",
    accent: "#4f46e5",
    accentSoft: "rgba(79, 70, 229, 0.18)",
    accent2: "#06b6d4",
    accent2Soft: "rgba(6, 182, 212, 0.18)",
    accent3: "#f59e0b",
    accent3Soft: "rgba(245, 158, 11, 0.20)",
    danger: "#ef4444",
    dangerSoft: "rgba(239, 68, 68, 0.18)",
  };

  const baseLineOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { color: chartTheme.text } },
      title: { display: true, text: title, color: chartTheme.text, font: { size: 16, weight: "700" } },
      tooltip: { enabled: true },
    },
    scales: {
      x: { ticks: {
  color: "#111827",   // bijna zwart (zeer leesbaar)
  font: {
    size: 12,
    weight: "600"
  }
}
, grid: { color: chartTheme.grid } },
      y: { beginAtZero: true, ticks: { color: chartTheme.text }, grid: { color: chartTheme.grid } },
    },
  });

  const baseBarOptions = (title, stacked = false) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { color: chartTheme.text } },
      title: { display: true, text: title, color: chartTheme.text, font: { size: 16, weight: "700" } },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        stacked,
        ticks: { color: chartTheme.text },
        grid: { color: chartTheme.grid },
      },
      y: {
        stacked,
        beginAtZero: true,
        ticks: { color: chartTheme.text },
        grid: { color: chartTheme.grid },
      },
    },
  });

  // 1) Sessions / logins per dag (line)
  const dailySessionsChart = useMemo(() => {
    const { keys, labels } = makeDaySeries(timeRange);
    const counts = Object.fromEntries(keys.map((k) => [k, 0]));

    filteredSessions.forEach((s) => {
      const key = isoDay(s.createdAt || s.startTime || Date.now());
      if (counts[key] !== undefined) counts[key] += 1;
    });

    return {
      labels,
      data: keys.map((k) => counts[k]),
    };
  }, [filteredSessions, timeRange]);

  // 2) Logout per uur (bar)
  const logoutHourChart = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const counts = Array.from({ length: 24 }, () => 0);

    filteredSessions.forEach((s) => {
      const start = new Date(s.createdAt || s.startTime || Date.now());
      const duration = clampNumber(s.calculatedDuration, 0);

      // logoutAt can be provided by backend, else estimate with createdAt + duration
      const logoutAt = s.endedAt
        ? new Date(s.endedAt)
        : duration > 0
          ? new Date(start.getTime() + duration)
          : null;

      if (!logoutAt) return;
      const h = logoutAt.getHours();
      counts[h] += 1;
    });

    return { labels: hours.map((h) => `${h}u`), data: counts };
  }, [filteredSessions]);

  // 3) Emoties verdeling (bar) - alle emoties zichtbaar
  const emotionCountsChart = useMemo(() => {
    const counts = {};
    ALL_EMOTIONS.forEach((e) => (counts[e] = 0));

    filteredEntries.forEach((en) => {
      const emo = (en.emotion || "").trim();
      if (!emo) return;
      if (counts[emo] === undefined) counts[emo] = 0; // onbekende emotie toch tonen
      counts[emo] += 1;
    });

    const labels = Object.keys(counts);
    const data = labels.map((l) => counts[l]);

    return { labels, data };
  }, [filteredEntries]);

  // 4) Emotie tijdlijn (stacked bar per dag)
  const emotionTimelineChart = useMemo(() => {
    const { keys, labels } = makeDaySeries(timeRange);

    // set of emotions to show = all known + any unknown in data
    const emotionsSet = new Set(ALL_EMOTIONS);
    filteredEntries.forEach((en) => {
      if (en.emotion) emotionsSet.add(en.emotion);
    });
    const emotions = Array.from(emotionsSet);

    // init day buckets
    const dayMap = {};
    keys.forEach((k) => {
      dayMap[k] = {};
      emotions.forEach((emo) => (dayMap[k][emo] = 0));
    });

    filteredEntries.forEach((en) => {
      const day = isoDay(en.date || en.createdAt || Date.now());
      const emo = en.emotion;
      if (!emo) return;
      if (!dayMap[day]) return;
      if (dayMap[day][emo] === undefined) dayMap[day][emo] = 0;
      dayMap[day][emo] += 1;
    });

    // datasets per emotion
    const datasets = emotions.map((emo, idx) => {
      // rotate through a small palette (Chart.js will render clearly)
      const palette = [
        { b: "#4f46e5", bg: "rgba(79, 70, 229, 0.25)" },
        { b: "#06b6d4", bg: "rgba(6, 182, 212, 0.25)" },
        { b: "#f59e0b", bg: "rgba(245, 158, 11, 0.25)" },
        { b: "#10b981", bg: "rgba(16, 185, 129, 0.25)" },
        { b: "#ef4444", bg: "rgba(239, 68, 68, 0.25)" },
        { b: "#8b5cf6", bg: "rgba(139, 92, 246, 0.25)" },
      ];
      const c = palette[idx % palette.length];

      return {
        label: emo,
        data: keys.map((k) => dayMap[k][emo] || 0),
        backgroundColor: c.bg,
        borderColor: c.b,
        borderWidth: 1,
      };
    });

    return { labels, datasets };
  }, [filteredEntries, timeRange]);

  // 5) Hovered options (bar)
  const hoveredOptionsChart = useMemo(() => {
    const counts = {};
    filteredEntries.forEach((en) => {
      const arr = Array.isArray(en.hoveredOptions) ? en.hoveredOptions : [];
      arr.forEach((opt) => {
        const key = String(opt);
        counts[key] = (counts[key] || 0) + 1;
      });
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      labels: sorted.map(([k]) => k),
      data: sorted.map(([, v]) => v),
    };
  }, [filteredEntries]);

  // 6) Dog metrics per dag (line): water/sleep/walks (avg per dag)
  const dogMetricsCharts = useMemo(() => {
    const { keys, labels } = makeDaySeries(timeRange);

    const buckets = Object.fromEntries(
      keys.map((k) => [
        k,
        { waterSum: 0, waterN: 0, sleepSum: 0, sleepN: 0, walksSum: 0, walksN: 0 },
      ])
    );

    filteredEntries.forEach((en) => {
      const day = isoDay(en.date || en.createdAt || Date.now());
      const b = buckets[day];
      if (!b) return;

      const water = clampNumber(en.water, NaN);
      if (Number.isFinite(water)) {
        b.waterSum += water;
        b.waterN += 1;
      }
      const sleep = clampNumber(en.sleepHours, NaN);
      if (Number.isFinite(sleep)) {
        b.sleepSum += sleep;
        b.sleepN += 1;
      }
      const walks = clampNumber(en.walks, NaN);
      if (Number.isFinite(walks)) {
        b.walksSum += walks;
        b.walksN += 1;
      }
    });

    const avg = (sum, n) => (n > 0 ? sum / n : 0);

    const waterData = keys.map((k) => Math.round(avg(buckets[k].waterSum, buckets[k].waterN)));
    const sleepData = keys.map((k) => Number(avg(buckets[k].sleepSum, buckets[k].sleepN).toFixed(1)));
    const walksData = keys.map((k) => Number(avg(buckets[k].walksSum, buckets[k].walksN).toFixed(1)));

    return { labels, waterData, sleepData, walksData };
  }, [filteredEntries, timeRange]);

  // -----------------------------
  // UI: early return
  // -----------------------------
  if (!userId) {
    return (
      <div className="analytics-container">
        <div className="loading">Geen gebruiker gevonden. Ga naar login.</div>
        <button onClick={() => navigate("/login")} className="export-button">
          ← Naar login
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading">Analytics laden...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="loading">{error}</div>
        <button onClick={() => window.location.reload()} className="export-button">
          🔄 Opnieuw proberen
        </button>
      </div>
    );
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h1>📊 Jouw Analytics</h1>
        <p>Meer grafieken = meer inzicht. Filter per periode en per hond.</p>

        {/* NAV (terug zoals in profile-style) */}
        <nav className="nav-bar">
          <button onClick={() => navigate("/my-dogs")}>🐕 Mijn dieren</button>
          <button onClick={() => navigate("/daily-entry")}>📓 Logboek</button>
          <button onClick={() => navigate("/profile")}>👤 Profiel</button>
          <button className="active">📊 Analyse</button>
          <button
            onClick={() => {
              const role = localStorage.getItem("userRole");
              if (role === "admin" || role === "manager") navigate("/admin/dashboard");
              else navigate("/admin/login");
            }}
          >
            🔐 Admin
          </button>
          <button
            className="logout-button"
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
          >
            🚪 Uitloggen
          </button>
        </nav>

        <div className="header-controls">
          <div className="time-range-selector">
            <label>Tijdperiode:</label>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="7d">Laatste 7 dagen</option>
              <option value="30d">Laatste 30 dagen</option>
              <option value="90d">Laatste 90 dagen</option>
            </select>
          </div>

          <div className="time-range-selector">
            <label>Hond:</label>
            <select value={selectedDogId} onChange={(e) => setSelectedDogId(e.target.value)}>
              <option value="all">Alle honden</option>
              {dogs.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* STATS */}
      <section className="stats-section">
        <h2>📈 Overzicht</h2>
        <div className="stats-grid">
          <div className="stat-card featured">
            <div className="stat-icon">🚀</div>
            <h3>Sessions</h3>
            <div className="stat-number">{stats.totalSessions}</div>
            <div className="stat-subtext">Actieve dagen: {stats.activeDays}</div>
          </div>

          <div className="stat-card featured">
            <div className="stat-icon">⏱️</div>
            <h3>Gem. duur</h3>
            <div className="stat-number">{stats.avgDurationMin} min</div>
            <div className="stat-subtext">Totaal: {stats.totalDurationMin} min</div>
          </div>

          <div className="stat-card">
            <h3>🕐 Laatste login</h3>
            <div className="stat-text">{stats.lastLogin}</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👁️</div>
            <h3>Page views</h3>
            <div className="stat-number">{stats.totalPageViews}</div>
            <div className="stat-subtext">Entries: {stats.entriesCount}</div>
          </div>
        </div>
      </section>

      {/* CHARTS GRID */}
      <section className="charts-section">
        <h2>📊 Grafieken</h2>

        <div className="charts-grid">
          {/* Logins per dag */}
          <div className="chart-container" style={{ height: 360 }}>
            <Line
              options={baseLineOptions("Logins (sessions) per dag")}
              data={{
                labels: dailySessionsChart.labels,
                datasets: [
                  {
                    label: "Sessions",
                    data: dailySessionsChart.data,
                    borderColor: chartTheme.accent,
                    backgroundColor: chartTheme.accentSoft,
                    fill: true,
                    tension: 0.25,
                    pointRadius: 2,
                  },
                ],
              }}
            />
          </div>

          {/* Logout per uur */}
          <div className="chart-container" style={{ height: 360 }}>
            <Bar
              options={baseBarOptions("Wanneer log je uit? (per uur)")}
              data={{
                labels: logoutHourChart.labels,
                datasets: [
                  {
                    label: "Aantal uitlogs",
                    data: logoutHourChart.data,
                    backgroundColor: chartTheme.accent2Soft,
                    borderColor: chartTheme.accent2,
                    borderWidth: 2,
                  },
                ],
              }}
            />
          </div>

          {/* Emoties verdeling */}
          <div className="chart-container" style={{ height: 380 }}>
            <Bar
              options={baseBarOptions("Emoties van je hond (verdeling)")}
              data={{
                labels: emotionCountsChart.labels,
                datasets: [
                  {
                    label: "Aantal logs",
                    data: emotionCountsChart.data,
                    backgroundColor: chartTheme.accent3Soft,
                    borderColor: chartTheme.accent3,
                    borderWidth: 2,
                  },
                ],
              }}
            />
          </div>

          {/* Emotie timeline */}
          <div className="chart-container" style={{ height: 420 }}>
            <Bar
              options={baseBarOptions("Emotie-tijdlijn (per dag)", true)}
              data={emotionTimelineChart}
            />
          </div>

          {/* Hovered options */}
          <div className="chart-container" style={{ height: 380 }}>
            <Bar
              options={baseBarOptions("Meest gehoverde opties (top 10)")}
              data={{
                labels: hoveredOptionsChart.labels.length ? hoveredOptionsChart.labels : ["(geen data)"],
                datasets: [
                  {
                    label: "Hovers",
                    data: hoveredOptionsChart.data.length ? hoveredOptionsChart.data : [0],
                    backgroundColor: "rgba(79, 70, 229, 0.20)",
                    borderColor: "#4f46e5",
                    borderWidth: 2,
                  },
                ],
              }}
            />
          </div>

          {/* Dog metrics: water */}
          <div className="chart-container" style={{ height: 360 }}>
            <Line
              options={baseLineOptions("Water per dag (gemiddeld, ml)")}
              data={{
                labels: dogMetricsCharts.labels,
                datasets: [
                  {
                    label: "Water (ml)",
                    data: dogMetricsCharts.waterData,
                    borderColor: "#06b6d4",
                    backgroundColor: "rgba(6, 182, 212, 0.18)",
                    fill: true,
                    tension: 0.25,
                    pointRadius: 2,
                  },
                ],
              }}
            />
          </div>

          {/* Dog metrics: sleep */}
          <div className="chart-container" style={{ height: 360 }}>
            <Line
              options={baseLineOptions("Slaap per dag (gemiddeld, uren)")}
              data={{
                labels: dogMetricsCharts.labels,
                datasets: [
                  {
                    label: "Slaap (uren)",
                    data: dogMetricsCharts.sleepData,
                    borderColor: "#10b981",
                    backgroundColor: "rgba(16, 185, 129, 0.18)",
                    fill: true,
                    tension: 0.25,
                    pointRadius: 2,
                  },
                ],
              }}
            />
          </div>

          {/* Dog metrics: walks */}
          <div className="chart-container" style={{ height: 360 }}>
            <Line
              options={baseLineOptions("Wandelingen per dag (gemiddeld)")}
              data={{
                labels: dogMetricsCharts.labels,
                datasets: [
                  {
                    label: "Wandelingen",
                    data: dogMetricsCharts.walksData,
                    borderColor: "#f59e0b",
                    backgroundColor: "rgba(245, 158, 11, 0.20)",
                    fill: true,
                    tension: 0.25,
                    pointRadius: 2,
                  },
                ],
              }}
            />
          </div>
        </div>
      </section>

      {/* Sessions table */}
      <section className="sessions-section">
        <h2>🕒 Recente sessions</h2>
        <div className="sessions-table">
          <div className="table-header">
            <div>Login Tijd</div>
            <div>Duur</div>
            <div>Page Views</div>
            <div>Status</div>
          </div>

          {filteredSessions.slice(0, 10).map((s, idx) => (
            <div key={idx} className="table-row">
              <div>{new Date(s.createdAt).toLocaleString("nl-NL")}</div>
              <div>
                {s.calculatedDuration
                  ? Math.round(clampNumber(s.calculatedDuration, 0) / 1000 / 60) + " min"
                  : "Onbekend"}
              </div>
              <div>{clampNumber(s.pageViews, 0)}</div>
              <div>
                <span className={`session-status ${s.isActive ? "active" : "inactive"}`}>
                  {s.isActive ? "Actief" : "Inactief"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
