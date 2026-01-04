// src/components/analytics/analyticsHelpers.js
import { TIME_RANGES } from "./analyticsConstants";

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

const getStartDate = (timeRange = "30d") => {
  const days = TIME_RANGES[timeRange] ?? 30;
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return start;
};

const makeDaySeries = (timeRange = "30d") => {
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

// ✅ Named exports (zeker)
export { isoDay, toNlShort, clampNumber, getStartDate, makeDaySeries };
