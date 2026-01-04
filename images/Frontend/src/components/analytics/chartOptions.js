// src/components/analytics/chartOptions.js
import { CHART_THEME } from "./analyticsConstants";

export const baseLineOptions = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "top", labels: { color: CHART_THEME.text } },
    title: {
      display: true,
      text: title,
      color: CHART_THEME.text,
      font: { size: 16, weight: "700" },
    },
    tooltip: { enabled: true },
  },
  scales: {
    x: {
      ticks: { color: CHART_THEME.text, font: { size: 12, weight: "600" } },
      grid: { color: CHART_THEME.grid },
    },
    y: {
      beginAtZero: true,
      ticks: { color: CHART_THEME.text },
      grid: { color: CHART_THEME.grid },
    },
  },
});

export const baseBarOptions = (title, stacked = false) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "top", labels: { color: CHART_THEME.text } },
    title: {
      display: true,
      text: title,
      color: CHART_THEME.text,
      font: { size: 16, weight: "700" },
    },
    tooltip: { enabled: true },
  },
  scales: {
    x: { stacked, ticks: { color: CHART_THEME.text }, grid: { color: CHART_THEME.grid } },
    y: {
      stacked,
      beginAtZero: true,
      ticks: { color: CHART_THEME.text },
      grid: { color: CHART_THEME.grid },
    },
  },
});
