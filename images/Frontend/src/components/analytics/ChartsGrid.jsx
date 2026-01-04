// src/components/analytics/ChartsGrid.jsx
import React, { useMemo } from "react";
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

import { ALL_EMOTIONS, CHART_THEME } from "./analyticsConstants";
import { clampNumber, isoDay, makeDaySeries } from "./analyticsHelpers";
import { baseBarOptions, baseLineOptions } from "./chartOptions";

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

export default function ChartsGrid({ timeRange, filteredSessions, filteredEntries }) {
  // 1) Sessions per dag
  const dailySessionsChart = useMemo(() => {
    const { keys, labels } = makeDaySeries(timeRange);
    const counts = Object.fromEntries(keys.map((k) => [k, 0]));

    filteredSessions.forEach((s) => {
      const key = isoDay(s.createdAt || s.startTime || Date.now());
      if (counts[key] !== undefined) counts[key] += 1;
    });

    return { labels, data: keys.map((k) => counts[k]) };
  }, [filteredSessions, timeRange]);

  // 2) Logout per uur
  const logoutHourChart = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const counts = Array.from({ length: 24 }, () => 0);

    filteredSessions.forEach((s) => {
      const start = new Date(s.createdAt || s.startTime || Date.now());
      const duration = clampNumber(s.calculatedDuration, 0);

      const logoutAt = s.endedAt
        ? new Date(s.endedAt)
        : duration > 0
          ? new Date(start.getTime() + duration)
          : null;

      if (!logoutAt) return;
      counts[logoutAt.getHours()] += 1;
    });

    return { labels: hours.map((h) => `${h}u`), data: counts };
  }, [filteredSessions]);

  // 3) Emoties verdeling
  const emotionCountsChart = useMemo(() => {
    const counts = {};
    ALL_EMOTIONS.forEach((e) => (counts[e] = 0));

    filteredEntries.forEach((en) => {
      const emo = (en.emotion || "").trim();
      if (!emo) return;
      if (counts[emo] === undefined) counts[emo] = 0;
      counts[emo] += 1;
    });

    const labels = Object.keys(counts);
    const data = labels.map((l) => counts[l]);
    return { labels, data };
  }, [filteredEntries]);

  // 4) Emotie timeline stacked
  const emotionTimelineChart = useMemo(() => {
    const { keys, labels } = makeDaySeries(timeRange);

    const emotionsSet = new Set(ALL_EMOTIONS);
    filteredEntries.forEach((en) => en.emotion && emotionsSet.add(en.emotion));
    const emotions = Array.from(emotionsSet);

    const dayMap = {};
    keys.forEach((k) => {
      dayMap[k] = {};
      emotions.forEach((emo) => (dayMap[k][emo] = 0));
    });

    filteredEntries.forEach((en) => {
      const day = isoDay(en.date || en.createdAt || Date.now());
      const emo = en.emotion;
      if (!emo || !dayMap[day]) return;
      if (dayMap[day][emo] === undefined) dayMap[day][emo] = 0;
      dayMap[day][emo] += 1;
    });

    const palette = [
      { b: "#4f46e5", bg: "rgba(79, 70, 229, 0.25)" },
      { b: "#06b6d4", bg: "rgba(6, 182, 212, 0.25)" },
      { b: "#f59e0b", bg: "rgba(245, 158, 11, 0.25)" },
      { b: "#10b981", bg: "rgba(16, 185, 129, 0.25)" },
      { b: "#ef4444", bg: "rgba(239, 68, 68, 0.25)" },
      { b: "#8b5cf6", bg: "rgba(139, 92, 246, 0.25)" },
    ];

    const datasets = emotions.map((emo, idx) => {
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

  // 5) Hovered options
  const hoveredOptionsChart = useMemo(() => {
    const counts = {};
    filteredEntries.forEach((en) => {
      const arr = Array.isArray(en.hoveredOptions) ? en.hoveredOptions : [];
      arr.forEach((opt) => {
        const key = String(opt);
        counts[key] = (counts[key] || 0) + 1;
      });
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return { labels: sorted.map(([k]) => k), data: sorted.map(([, v]) => v) };
  }, [filteredEntries]);

  // 6) Dog metrics
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
      if (Number.isFinite(water)) { b.waterSum += water; b.waterN += 1; }

      const sleep = clampNumber(en.sleepHours, NaN);
      if (Number.isFinite(sleep)) { b.sleepSum += sleep; b.sleepN += 1; }

      const walks = clampNumber(en.walks, NaN);
      if (Number.isFinite(walks)) { b.walksSum += walks; b.walksN += 1; }
    });

    const avg = (sum, n) => (n > 0 ? sum / n : 0);

    return {
      labels,
      waterData: keys.map((k) => Math.round(avg(buckets[k].waterSum, buckets[k].waterN))),
      sleepData: keys.map((k) => Number(avg(buckets[k].sleepSum, buckets[k].sleepN).toFixed(1))),
      walksData: keys.map((k) => Number(avg(buckets[k].walksSum, buckets[k].walksN).toFixed(1))),
    };
  }, [filteredEntries, timeRange]);

  return (
    <section className="charts-section">
      <h2>📊 Grafieken</h2>

      <div className="charts-grid">
        <div className="chart-container" style={{ height: 360 }}>
          <Line
            options={baseLineOptions("Logins (sessions) per dag")}
            data={{
              labels: dailySessionsChart.labels,
              datasets: [
                {
                  label: "Sessions",
                  data: dailySessionsChart.data,
                  borderColor: CHART_THEME.accent,
                  backgroundColor: CHART_THEME.accentSoft,
                  fill: true,
                  tension: 0.25,
                  pointRadius: 2,
                },
              ],
            }}
          />
        </div>

        <div className="chart-container" style={{ height: 360 }}>
          <Bar
            options={baseBarOptions("Wanneer log je uit? (per uur)")}
            data={{
              labels: logoutHourChart.labels,
              datasets: [
                {
                  label: "Aantal uitlogs",
                  data: logoutHourChart.data,
                  backgroundColor: CHART_THEME.accent2Soft,
                  borderColor: CHART_THEME.accent2,
                  borderWidth: 2,
                },
              ],
            }}
          />
        </div>

        <div className="chart-container" style={{ height: 380 }}>
          <Bar
            options={baseBarOptions("Emoties van je hond (verdeling)")}
            data={{
              labels: emotionCountsChart.labels,
              datasets: [
                {
                  label: "Aantal logs",
                  data: emotionCountsChart.data,
                  backgroundColor: CHART_THEME.accent3Soft,
                  borderColor: CHART_THEME.accent3,
                  borderWidth: 2,
                },
              ],
            }}
          />
        </div>

        <div className="chart-container" style={{ height: 420 }}>
          <Bar options={baseBarOptions("Emotie-tijdlijn (per dag)", true)} data={emotionTimelineChart} />
        </div>

        <div className="chart-container" style={{ height: 380 }}>
          <Bar
            options={baseBarOptions("Meest gehoverde opties (top 10)")}
            data={{
              labels: hoveredOptionsChart.labels.length ? hoveredOptionsChart.labels : ["(geen data)"],
              datasets: [
                {
                  label: "Hovers",
                  data: hoveredOptionsChart.data.length ? hoveredOptionsChart.data : [0],
                  backgroundColor: CHART_THEME.accentSoft,
                  borderColor: CHART_THEME.accent,
                  borderWidth: 2,
                },
              ],
            }}
          />
        </div>

        <div className="chart-container" style={{ height: 360 }}>
          <Line
            options={baseLineOptions("Water per dag (gemiddeld, ml)")}
            data={{
              labels: dogMetricsCharts.labels,
              datasets: [
                {
                  label: "Water (ml)",
                  data: dogMetricsCharts.waterData,
                  borderColor: CHART_THEME.accent2,
                  backgroundColor: CHART_THEME.accent2Soft,
                  fill: true,
                  tension: 0.25,
                  pointRadius: 2,
                },
              ],
            }}
          />
        </div>

        <div className="chart-container" style={{ height: 360 }}>
          <Line
            options={baseLineOptions("Slaap per dag (gemiddeld, uren)")}
            data={{
              labels: dogMetricsCharts.labels,
              datasets: [
                {
                  label: "Slaap (uren)",
                  data: dogMetricsCharts.sleepData,
                  borderColor: CHART_THEME.ok,
                  backgroundColor: CHART_THEME.okSoft,
                  fill: true,
                  tension: 0.25,
                  pointRadius: 2,
                },
              ],
            }}
          />
        </div>

        <div className="chart-container" style={{ height: 360 }}>
          <Line
            options={baseLineOptions("Wandelingen per dag (gemiddeld)")}
            data={{
              labels: dogMetricsCharts.labels,
              datasets: [
                {
                  label: "Wandelingen",
                  data: dogMetricsCharts.walksData,
                  borderColor: CHART_THEME.accent3,
                  backgroundColor: CHART_THEME.accent3Soft,
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
  );
}
