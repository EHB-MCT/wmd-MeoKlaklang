import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
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
  TimeScale
} from 'chart.js';
import '../App.css';
import './Analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [healthAlerts, setHealthAlerts] = useState(null); // optional (can remain null)
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchAnalyticsData();
    fetchSessions();
    // fetchHealthAlerts(); // ❌ route currently 404 in your backend
  }, [timeRange, userId]);

  const fetchAnalyticsData = async () => {
    try {
      // ✅ Use userId, not userUID
      const response = await fetch(`/api/analytics/user/${userId}?timeRange=${timeRange}`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        console.error("Analytics fetch failed:", response.status);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/sessions/user/${userId}?timeRange=${timeRange}`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      } else {
        console.error('Sessions fetch failed:', response.status);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  // Optional: only enable this if you truly have that backend endpoint.
  // const fetchHealthAlerts = async () => {
  //   try {
  //     const response = await fetch(`/api/sessions/user/${userId}/health-alerts?timeRange=${timeRange}`, {
  //       credentials: "include"
  //     });
  //     if (response.ok) {
  //       const data = await response.json();
  //       setHealthAlerts(data);
  //     } else {
  //       console.error("Health alerts fetch failed:", response.status);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching health alerts:', error);
  //   }
  // };

  const processLoginData = () => {
    if (!sessions.length) return { labels: [], data: [] };

    const loginCounts = {};
    sessions.forEach(session => {
      const date = new Date(session.createdAt).toLocaleDateString('nl-NL');
      loginCounts[date] = (loginCounts[date] || 0) + 1;
    });

    const sortedDates = Object.keys(loginCounts).sort((a, b) => new Date(a) - new Date(b));

    return {
      labels: sortedDates,
      data: sortedDates.map(date => loginCounts[date])
    };
  };

  const processWeeklyData = () => {
    if (!sessions.length) return { labels: [], data: [] };

    const weekDays = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
    const weeklyLogins = [0, 0, 0, 0, 0, 0, 0];

    sessions.forEach(session => {
      const dayOfWeek = new Date(session.createdAt).getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weeklyLogins[adjustedDay]++;
    });

    return { labels: weekDays, data: weeklyLogins };
  };

  const generateActivityHeatmap = () => {
    if (!sessions.length) return [];

    const activityMap = {};
    const today = new Date();
    const daysBack = 90;

    for (let i = 0; i < daysBack; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      activityMap[dateStr] = 0;
    }

    sessions.forEach(session => {
      const dateStr = new Date(session.createdAt).toISOString().split('T')[0];
      if (activityMap.hasOwnProperty(dateStr)) {
        activityMap[dateStr] += (session.pageViews || 0) + (session.eventCount || 0);
      }
    });

    return Object.entries(activityMap).map(([date, activity]) => ({
      date,
      activity,
      intensity: getActivityIntensity(activity)
    })).reverse();
  };

  const getActivityIntensity = (activity) => {
    if (activity === 0) return 0;
    if (activity <= 5) return 1;
    if (activity <= 10) return 2;
    if (activity <= 20) return 3;
    return 4;
  };

  const calculateSessionStats = () => {
    if (!sessions.length) {
      return {
        totalSessions: 0,
        avgDuration: 0,
        totalDuration: 0,
        activeSessions: 0,
        lastLogin: 'Nooit',
        totalEvents: 0,
        totalPageViews: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalDays: 0
      };
    }

    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.isActive).length;

    const totalDurationMs = sessions.reduce((sum, s) => sum + (s.calculatedDuration || 0), 0);
    const avgDurationMs = totalSessions > 0 ? totalDurationMs / totalSessions : 0;

    const streakData = calculateLoginStreak();

    return {
      totalSessions,
      activeSessions,
      avgDuration: Math.round(avgDurationMs / 1000 / 60),
      totalDuration: Math.round(totalDurationMs / 1000 / 60),
      lastLogin: sessions[0]?.createdAt ? new Date(sessions[0].createdAt).toLocaleString('nl-NL') : 'Nooit',
      totalEvents: sessions.reduce((sum, s) => sum + (s.eventCount || 0), 0),
      totalPageViews: sessions.reduce((sum, s) => sum + (s.pageViews || 0), 0),
      ...streakData
    };
  };

  const calculateLoginStreak = () => {
    if (!sessions.length) return { currentStreak: 0, longestStreak: 0, totalDays: 0 };

    const loginDates = [...new Set(
      sessions.map(s => new Date(s.createdAt).toISOString().split('T')[0])
    )].sort((a, b) => new Date(a) - new Date(b));

    let longestStreak = 0;
    let tempStreak = 0;
    let previousDate = null;

    loginDates.forEach((date, idx) => {
      if (idx === 0) {
        tempStreak = 1;
      } else {
        const daysDiff = Math.floor((new Date(date) - new Date(previousDate)) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) tempStreak++;
        else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      previousDate = date;
    });

    longestStreak = Math.max(longestStreak, tempStreak);

    const today = new Date().toISOString().split('T')[0];
    const mostRecentLogin = loginDates[loginDates.length - 1];
    const daysSinceLastLogin = Math.floor((new Date(today) - new Date(mostRecentLogin)) / (1000 * 60 * 60 * 24));
    const currentStreak = daysSinceLastLogin <= 1 ? tempStreak : 0;

    return { currentStreak, longestStreak, totalDays: loginDates.length };
  };

  const calculateAnalyticsStats = () => {
    const events = analyticsData?.events || [];
    if (!events.length) return { totalEvents: 0, uniqueEvents: 0, topEvents: [] };

    const eventTypeCount = {};
    events.forEach(e => {
      eventTypeCount[e.eventName] = (eventTypeCount[e.eventName] || 0) + 1;
    });

    const topEvents = Object.entries(eventTypeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalEvents: events.length,
      uniqueEvents: Object.keys(eventTypeCount).length,
      topEvents
    };
  };

  const lineChartData = processLoginData();
  const weeklyData = processWeeklyData();
  const sessionStats = calculateSessionStats();
  const analyticsStats = calculateAnalyticsStats();
  const heatmapData = generateActivityHeatmap();

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Aantal logins per dag', font: { size: 16 } }
    },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Logins per dag van de week', font: { size: 16 } }
    },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading">Analytics laden...</div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h1>📊 Jouw Analytics</h1>
        <p>Inzicht in jouw gebruiksdata en patronen</p>

        <div className="header-controls">
          <div className="time-range-selector">
            <label>Tijdperiode:</label>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="7d">Laatste 7 dagen</option>
              <option value="30d">Laatste 30 dagen</option>
              <option value="90d">Laatste 90 dagen</option>
            </select>
          </div>
        </div>
      </header>

      <section className="stats-section">
        <h2>📈 Statistieken</h2>
        <div className="stats-grid">
          <div className="stat-card featured">
            <div className="stat-icon">🚀</div>
            <h3>Totale Sessions</h3>
            <div className="stat-number">{sessionStats.totalSessions}</div>
            <div className="stat-subtext">Actief: {sessionStats.activeSessions}</div>
          </div>

          <div className="stat-card featured">
            <div className="stat-icon">⏱️</div>
            <h3>Gem. Duur</h3>
            <div className="stat-number">{sessionStats.avgDuration} min</div>
            <div className="stat-subtext">Totaal: {sessionStats.totalDuration} min</div>
          </div>

          <div className="stat-card">
            <h3>🕐 Laatste Login</h3>
            <div className="stat-text">{sessionStats.lastLogin}</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👁️</div>
            <h3>Page Views</h3>
            <div className="stat-number">{sessionStats.totalPageViews}</div>
            <div className="stat-subtext">Events: {sessionStats.totalEvents}</div>
          </div>

          <div className="stat-card streak-card">
            <div className="streak-icon">🔥</div>
            <h3>Huidige Streak</h3>
            <div className="stat-number">{sessionStats.currentStreak}</div>
            <div className="stat-subtext">Langste: {sessionStats.longestStreak} dagen</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <h3>Actieve Dagen</h3>
            <div className="stat-number">{sessionStats.totalDays}</div>
            <div className="stat-subtext">van de laatste {timeRange}</div>
          </div>
        </div>
      </section>

      <section className="heatmap-section">
        <h2>🗓️ Activiteit Heatmap (Laatste 90 dagen)</h2>
        <div className="heatmap-container">
          <div className="heatmap-grid">
            {heatmapData.map((day, index) => (
              <div
                key={index}
                className="heatmap-cell"
                data-intensity={day.intensity}
                title={`${day.date}: ${day.activity} activiteiten`}
              >
                <span className="heatmap-date">{new Date(day.date).getDate()}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="charts-section">
        <div className="charts-grid">
          <div className="chart-container">
            <Line
              data={{
                labels: lineChartData.labels,
                datasets: [{
                  label: 'Aantal Logins',
                  data: lineChartData.data,
                  borderColor: 'rgb(75, 192, 192)',
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  tension: 0.1
                }]
              }}
              options={lineChartOptions}
            />
          </div>

          <div className="chart-container">
            <Bar
              data={{
                labels: weeklyData.labels,
                datasets: [{
                  label: 'Logins',
                  data: weeklyData.data,
                  backgroundColor: 'rgba(54, 162, 235, 0.8)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1
                }]
              }}
              options={barChartOptions}
            />
          </div>
        </div>
      </section>

      <section className="top-events-section">
        <h2>🔝 Meest Gebruikte Functies</h2>
        <div className="events-list">
          {analyticsStats.topEvents.map((event, index) => (
            <div key={index} className="event-item">
              <span className="event-rank">#{index + 1}</span>
              <span className="event-name">{event.name}</span>
              <span className="event-count">{event.count} keer</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sessions-section">
        <h2>🕒 Recente Sessions</h2>
        <div className="sessions-table">
          <div className="table-header">
            <div>Login Tijd</div>
            <div>Duur</div>
            <div>Page Views</div>
            <div>Status</div>
          </div>
          {sessions.slice(0, 10).map((session, index) => (
            <div key={index} className="table-row">
              <div>{new Date(session.createdAt).toLocaleString('nl-NL')}</div>
              <div>
                {session.calculatedDuration
                  ? Math.round(session.calculatedDuration / 1000 / 60) + ' min'
                  : 'Onbekend'}
              </div>
              <div>{session.pageViews || 0}</div>
              <div>
                <span className={`session-status ${session.isActive ? 'active' : 'inactive'}`}>
                  {session.isActive ? 'Actief' : 'Inactief'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Analytics;
