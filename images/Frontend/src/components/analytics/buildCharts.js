const COLORS = {
  indigo: "#4f46e5",
  violet: "#7c3aed",
  emerald: "#22c55e",
  sky: "#0ea5e9",
  amber: "#f59e0b",
  rose: "#ef4444",
  slate: "#64748b",
};

const safeDate = (d) => {
  const x = new Date(d);
  return Number.isFinite(x.getTime()) ? x : null;
};

const getWeekKey = (date) => {
  const d = new Date(date);
  const dayNum = (d.getDay() + 6) % 7; // Mon=0..Sun=6
  d.setDate(d.getDate() - dayNum + 3); // Thu
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const firstDayNum = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNum + 3);
  const weekNo = 1 + Math.round((d - firstThursday) / (7 * 24 * 3600 * 1000));
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

export function computeDashboardStats({ sessions = [], entries = [] }) {
  const totalSessions = sessions.length;
  const totalEntries = entries.length;

  const totalDurationMs = sessions.reduce((sum, s) => sum + (s.calculatedDuration || 0), 0);
  const avgDurationMin = totalSessions ? Math.round(totalDurationMs / totalSessions / 1000 / 60) : 0;

  const activeSessions = sessions.filter((s) => s.isActive).length;

  const lastSession = sessions[0]?.createdAt ? new Date(sessions[0].createdAt) : null;
  const lastLogin = lastSession ? lastSession.toLocaleString("nl-NL") : "Nooit";

  const totalPageViews = sessions.reduce((sum, s) => sum + (s.pageViews || 0), 0);
  const totalEvents = sessions.reduce((sum, s) => sum + (s.eventCount || 0), 0);

  const hoveredTotal = entries.reduce((sum, e) => sum + ((e.hoveredOptions || []).length), 0);

  return {
    totalSessions,
    activeSessions,
    totalEntries,
    avgDurationMin,
    lastLogin,
    totalPageViews,
    totalEvents,
    hoveredTotal,
  };
}

/* ========== 1) Sessions per week (Line) ========== */
export function buildSessionsPerWeekChart(sessions) {
  const counts = {};
  sessions.forEach((s) => {
    const d = safeDate(s.createdAt);
    if (!d) return;
    const key = getWeekKey(d);
    counts[key] = (counts[key] || 0) + 1;
  });

  const labels = Object.keys(counts).sort();
  const data = labels.map((l) => counts[l]);

  return {
    data: {
      labels,
      datasets: [
        {
          label: "Sessions / week",
          data,
          borderColor: COLORS.indigo,
          backgroundColor: "rgba(79,70,229,0.18)",
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        tooltip: { enabled: true },
      },
      scales: {
        x: { ticks: { color: COLORS.slate } },
        y: { beginAtZero: true, ticks: { precision: 0, color: COLORS.slate } },
      },
    },
  };
}

/* ========== 2) Logins per dag (Line) ========== */
export function buildSessionsPerDayChart(sessions) {
  const counts = {};
  sessions.forEach((s) => {
    const d = safeDate(s.createdAt);
    if (!d) return;
    const key = d.toISOString().slice(0, 10);
    counts[key] = (counts[key] || 0) + 1;
  });

  const labels = Object.keys(counts).sort();
  const data = labels.map((l) => counts[l]);

  return {
    data: {
      labels: labels.map((iso) => new Date(iso).toLocaleDateString("nl-NL")),
      datasets: [
        {
          label: "Logins / dag",
          data,
          borderColor: COLORS.sky,
          backgroundColor: "rgba(14,165,233,0.16)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  };
}

/* ========== 3) Logins per dag van de week (Bar) ========== */
export function buildSessionsByWeekdayChart(sessions) {
  const labels = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
  const data = [0, 0, 0, 0, 0, 0, 0];

  sessions.forEach((s) => {
    const d = safeDate(s.createdAt);
    if (!d) return;
    const day = d.getDay(); // Sun=0
    const idx = day === 0 ? 6 : day - 1; // Mon=0 .. Sun=6
    data[idx] += 1;
  });

  return {
    data: {
      labels,
      datasets: [
        {
          label: "Logins / weekdag",
          data,
          backgroundColor: COLORS.violet,
          borderRadius: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  };
}

/* ========== 4) Meest gehoverde opties (Bar) ========== */
export function buildHoveredOptionsChart(entries, topN = 10) {
  const freq = {};
  entries.forEach((e) => {
    (e.hoveredOptions || []).forEach((opt) => {
      const key = String(opt || "").trim();
      if (!key) return;
      freq[key] = (freq[key] || 0) + 1;
    });
  });

  const sorted = Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN);

  const labels = sorted.map(([k]) => k);
  const data = sorted.map(([, v]) => v);

  return {
    data: {
      labels,
      datasets: [
        {
          label: "Hover count",
          data,
          backgroundColor: COLORS.amber,
          borderRadius: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  };
}

/* ========== 5) Emotie laatste 7 dagen (Bar) ========== */
export function buildEmotionLastWeekChart(entries, dogId) {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const freq = {};
  entries.forEach((e) => {
    if (dogId && e.dogId !== dogId) return;

    const d = safeDate(e.date || e.createdAt);
    if (!d || d < sevenDaysAgo) return;

    const emo = String(e.emotion || "Onbekend").trim();
    freq[emo] = (freq[emo] || 0) + 1;
  });

  const labels = Object.keys(freq);
  const data = labels.map((l) => freq[l]);

  return {
    data: {
      labels,
      datasets: [
        {
          label: "Emotie logs (7 dagen)",
          data,
          backgroundColor: COLORS.emerald,
          borderRadius: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  };
}
