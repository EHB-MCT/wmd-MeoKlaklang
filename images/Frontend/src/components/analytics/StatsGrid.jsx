// src/components/analytics/StatsGrid.jsx
import React, { useMemo } from "react";
import { clampNumber, isoDay } from "./analyticsHelpers";


export default function StatsGrid({ filteredSessions, filteredEntries }) {
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

  return (
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
  );
}
