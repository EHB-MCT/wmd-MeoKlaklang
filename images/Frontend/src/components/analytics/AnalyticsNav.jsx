// src/components/analytics/AnalyticsNav.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function AnalyticsNav() {
  const navigate = useNavigate();

  return (
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
  );
}
