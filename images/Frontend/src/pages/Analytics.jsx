// src/pages/Analytics.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Analytics.css";

import { useAnalyticsData } from "../components/analytics/useAnalyticsData";
import { getStartDate } from "../components/analytics/analyticsHelpers";

import AnalyticsNav from "../components/analytics/AnalyticsNav";
import AnalyticsHeader from "../components/analytics/AnalyticsHeader";
import StatsGrid from "../components/analytics/StatsGrid";
import ChartsGrid from "../components/analytics/ChartsGrid";
import SessionsTable from "../components/analytics/SessionsTable";

export default function Analytics() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedDogId, setSelectedDogId] = useState("all");

  const { loading, error, sessions, entries, dogs } = useAnalyticsData({
    userId,
    timeRange,
  });

  const filteredEntries = useMemo(() => {
    const start = getStartDate(timeRange);
    return entries.filter((e) => {
      const inRange = new Date(e.date || e.createdAt || Date.now()) >= start;
      const matchesDog =
        selectedDogId === "all" ? true : String(e.dogId) === String(selectedDogId);
      return inRange && matchesDog;
    });
  }, [entries, timeRange, selectedDogId]);

  const filteredSessions = useMemo(() => {
    const start = getStartDate(timeRange);
    return sessions.filter(
      (s) => new Date(s.createdAt || s.startTime || Date.now()) >= start
    );
  }, [sessions, timeRange]);

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

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h1>📊 Jouw Analytics</h1>
        <p>Meer grafieken = meer inzicht. Filter per periode en per hond.</p>

        <AnalyticsNav />

        <AnalyticsHeader
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          dogs={dogs}
          selectedDogId={selectedDogId}
          setSelectedDogId={setSelectedDogId}
        />
      </header>

      <StatsGrid filteredSessions={filteredSessions} filteredEntries={filteredEntries} />

      <ChartsGrid
        timeRange={timeRange}
        filteredSessions={filteredSessions}
        filteredEntries={filteredEntries}
      />

      <SessionsTable sessions={filteredSessions} />
    </div>
  );
}
