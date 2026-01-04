// src/components/analytics/SessionsTable.jsx
import React from "react";
import { clampNumber } from "./analyticsHelpers";

export default function SessionsTable({ sessions }) {
  return (
    <section className="sessions-section">
      <h2>🕒 Recente sessions</h2>

      <div className="sessions-table">
        <div className="table-header">
          <div>Login Tijd</div>
          <div>Duur</div>
          <div>Page Views</div>
          <div>Status</div>
        </div>

        {sessions.slice(0, 10).map((s, idx) => (
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
  );
}
