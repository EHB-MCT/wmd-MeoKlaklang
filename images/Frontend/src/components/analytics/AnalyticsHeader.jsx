// src/components/analytics/AnalyticsHeader.jsx
import React from "react";

export default function AnalyticsHeader({
  timeRange,
  setTimeRange,
  dogs,
  selectedDogId,
  setSelectedDogId,
}) {
  return (
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
  );
}
