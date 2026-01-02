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

// Register Chart.js components
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
  const [healthAlerts, setHealthAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const userId = localStorage.getItem("userId");
  const userUID = localStorage.getItem("userUID");

  useEffect(() => {
    fetchAnalyticsData();
    fetchSessions();
    fetchHealthAlerts();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch(`/api/analytics/user/${userUID}?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/sessions/user/${userId}?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched sessions:', data); // Debug log
        setSessions(data.sessions || []);
      } else {
        console.error('Sessions fetch failed:', response.status);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchHealthAlerts = async () => {
    try {
      const response = await fetch(`/api/sessions/user/${userId}/health-alerts?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setHealthAlerts(data);
      }
    } catch (error) {
      console.error('Error fetching health alerts:', error);
    }
  };

  const processLoginData = () => {
    if (!sessions.length) return { labels: [], data: [] };

    // Group sessions by date
    const loginCounts = {};
    sessions.forEach(session => {
      const date = new Date(session.createdAt).toLocaleDateString('nl-NL');
      loginCounts[date] = (loginCounts[date] || 0) + 1;
    });

    // Sort by date
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
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday start
      weeklyLogins[adjustedDay]++;
    });

    return {
      labels: weekDays,
      data: weeklyLogins
    };
  };

  const generateActivityHeatmap = () => {
    if (!sessions.length) return [];

    const activityMap = {};
    const today = new Date();
    const daysBack = 90; // Show last 90 days

    // Initialize all days with 0 activity
    for (let i = 0; i < daysBack; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      activityMap[dateStr] = 0;
    }

    // Count activity per day
    sessions.forEach(session => {
      const dateStr = new Date(session.createdAt).toISOString().split('T')[0];
      if (activityMap.hasOwnProperty(dateStr)) {
        activityMap[dateStr] += (session.pageViews || 0) + (session.eventCount || 0);
      }
    });

    // Convert to array format for heatmap
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

  const calculateEngagementScore = () => {
    let score = 0;
    
    // Active days ratio (40% of score)
    const periodDays = parseInt(timeRange.replace('d', ''));
    const activeDayRatio = sessionStats.totalDays / periodDays;
    score += Math.round(activeDayRatio * 40);
    
    // Session duration (30% of score)
    const durationScore = Math.min(sessionStats.avgDuration / 30, 1) * 30; // 30 minutes = full score
    score += Math.round(durationScore);
    
    // Streak bonus (20% of score)
    const streakScore = Math.min(sessionStats.currentStreak / 7, 1) * 20; // 7 day streak = full score
    score += Math.round(streakScore);
    
    // Event activity (10% of score)
    const eventsPerSession = sessionStats.totalSessions > 0 ? (sessionStats.totalEvents + sessionStats.totalPageViews) / sessionStats.totalSessions : 0;
    const eventScore = Math.min(eventsPerSession / 10, 1) * 10; // 10 events per session = full score
    score += Math.round(eventScore);
    
    return Math.min(score, 100);
  };

  const getMostActiveDay = () => {
    if (!sessions.length) return 'Geen data';
    
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
    
    sessions.forEach(session => {
      const day = new Date(session.createdAt).getDay();
      dayCounts[day]++;
    });
    
    const maxIndex = dayCounts.indexOf(Math.max(...dayCounts));
    return dayNames[maxIndex];
  };

  const getPeakTime = () => {
    if (!sessions.length) return 'Geen data';
    
    const hourCounts = new Array(24).fill(0);
    
    sessions.forEach(session => {
      const hour = new Date(session.createdAt).getHours();
      hourCounts[hour]++;
    });
    
    const maxHour = hourCounts.indexOf(Math.max(...hourCounts));
    return `${maxHour}:00 - ${maxHour + 1}:00`;
  };

  const getUsageFrequency = () => {
    if (!sessions.length) return 'Geen data';
    
    const periodDays = parseInt(timeRange.replace('d', ''));
    const frequency = sessionStats.totalDays / periodDays;
    
    if (frequency >= 0.8) return 'Dagelijks';
    if (frequency >= 0.5) return 'Meerdere keren per week';
    if (frequency >= 0.2) return 'Wekelijks';
    return 'Maandelijks';
  };

  const exportAnalyticsData = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      timeRange,
      summary: {
        totalSessions: sessionStats.totalSessions,
        avgDuration: sessionStats.avgDuration,
        totalDuration: sessionStats.totalDuration,
        currentStreak: sessionStats.currentStreak,
        longestStreak: sessionStats.longestStreak,
        totalDays: sessionStats.totalDays,
        totalEvents: sessionStats.totalEvents,
        totalPageViews: sessionStats.totalPageViews,
        engagementScore: calculateEngagementScore(),
        mostActiveDay: getMostActiveDay(),
        peakTime: getPeakTime(),
        usageFrequency: getUsageFrequency()
      },
      sessions: sessions.map(session => ({
        date: session.createdAt,
        duration: session.calculatedDuration,
        pageViews: session.pageViews,
        eventCount: session.eventCount,
        isActive: session.isActive
      })),
      topEvents: analyticsStats.topEvents,
      healthAlerts: healthAlerts ? healthAlerts.alerts : [],
      activityHeatmap: heatmapData
    };

    // Create and download CSV file
    const csvContent = generateCSV(exportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSV = (data) => {
    let csv = 'Analytics Export - ' + new Date().toLocaleDateString('nl-NL') + '\n\n';
    
    // Summary section
    csv += 'SAMENVATTING\n';
    csv += 'Metric,Waarde\n';
    csv += `Exportdatum,${new Date().toLocaleString('nl-NL')}\n`;
    csv += `Tijdperiode,${data.timeRange}\n`;
    csv += `Totaal Sessions,${data.summary.totalSessions}\n`;
    csv += `Gemiddelde Duur (min),${data.summary.avgDuration}\n`;
    csv += `Totale Duur (min),${data.summary.totalDuration}\n`;
    csv += `Huidige Streak,${data.summary.currentStreak}\n`;
    csv += `Langste Streak,${data.summary.longestStreak}\n`;
    csv += `Actieve Dagen,${data.summary.totalDays}\n`;
    csv += `Totale Events,${data.summary.totalEvents}\n`;
    csv += `Totale Page Views,${data.summary.totalPageViews}\n`;
    csv += `Engagement Score,${data.summary.engagementScore}\n`;
    csv += `Meest Actieve Dag,${data.summary.mostActiveDay}\n`;
    csv += `Piek Tijd,${data.summary.peakTime}\n`;
    csv += `Gebruiksfrequentie,${data.summary.usageFrequency}\n\n`;

    // Sessions section
    csv += 'SESSIONS\n';
    csv += 'Datum,Duur (ms),Page Views,Events,Actief\n';
    data.sessions.forEach(session => {
      csv += `${session.date},${session.duration},${session.pageViews},${session.eventCount},${session.isActive}\n`;
    });
    csv += '\n';

    // Top Events section
    csv += 'TOP EVENEMENTEN\n';
    csv += 'Rank,Event,Aantal\n';
    data.topEvents.forEach((event, index) => {
      csv += `${index + 1},"${event.name}",${event.count}\n`;
    });

    return csv;
  };

  const calculateSessionStats = () => {
    if (!sessions.length) return { totalSessions: 0, avgDuration: 0, totalDuration: 0, activeSessions: 0 };

    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(session => session.isActive).length;
    const totalDuration = sessions.reduce((sum, session) => {
      const duration = session.calculatedDuration || 0;
      return sum + duration;
    }, 0);

    const avgDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

    // Calculate login streak
    const streakData = calculateLoginStreak();
    
    return {
      totalSessions,
      avgDuration: Math.round(avgDuration / 1000 / 60), // minutes
      totalDuration: Math.round(totalDuration / 1000 / 60), // minutes
      activeSessions,
      lastLogin: sessions.length > 0 ? new Date(sessions[0].createdAt).toLocaleString('nl-NL') : 'Nooit',
      totalEvents: sessions.reduce((sum, session) => sum + (session.eventCount || 0), 0),
      totalPageViews: sessions.reduce((sum, session) => sum + (session.pageViews || 0), 0),
      ...streakData
    };
  };

  const calculateLoginStreak = () => {
    if (!sessions.length) return { currentStreak: 0, longestStreak: 0, totalDays: 0 };

    // Get unique login dates
    const loginDates = [...new Set(sessions.map(session => 
      new Date(session.createdAt).toISOString().split('T')[0]
    ))].sort((a, b) => new Date(a) - new Date(b));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let previousDate = null;
    const today = new Date().toISOString().split('T')[0];

    // Find today's login or most recent login
    const mostRecentLogin = loginDates[loginDates.length - 1];
    const daysSinceLastLogin = Math.floor((new Date(today) - new Date(mostRecentLogin)) / (1000 * 60 * 60 * 24));

    // Calculate streaks
    loginDates.forEach((date, index) => {
      if (index === 0) {
        tempStreak = 1;
      } else {
        const daysDiff = Math.floor((new Date(date) - new Date(previousDate)) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          tempStreak++;
        } else if (daysDiff > 1) {
          // Streak broken
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      
      previousDate = date;
    });

    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate current streak (only if user logged in today or yesterday)
    if (daysSinceLastLogin <= 1) {
      currentStreak = tempStreak;
    } else {
      currentStreak = 0;
    }

    return {
      currentStreak,
      longestStreak,
      totalDays: loginDates.length
    };
  };

  const calculateAnalyticsStats = () => {
    if (!analyticsData?.events) return { totalEvents: 0, uniqueEvents: 0, topEvents: [] };

    const events = analyticsData.events;
    const eventTypeCount = {};

    events.forEach(event => {
      eventTypeCount[event.eventName] = (eventTypeCount[event.eventName] || 0) + 1;
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
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Aantal logins per dag',
        font: { size: 16 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Logins per dag van de week',
        font: { size: 16 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
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
      {/* Header */}
      <header className="analytics-header">
        <h1>📊 Jouw Analytics</h1>
        <p>Inzicht in jouw gebruiksdata en patronen</p>
        
        {/* Controls */}
        <div className="header-controls">
          {/* Time Range Selector */}
          <div className="time-range-selector">
            <label>Tijdperiode:</label>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="7d">Laatste 7 dagen</option>
              <option value="30d">Laatste 30 dagen</option>
              <option value="90d">Laatste 90 dagen</option>
            </select>
          </div>
          
          {/* Export Button */}
          <button className="export-button" onClick={exportAnalyticsData}>
            📥 Exporteer Data
          </button>
        </div>
      </header>

      {/* Statistics Cards */}
       <section className="stats-section">
        <h2>📈 Statistieken</h2>
        <div className="stats-grid">
          <div className="stat-card featured">
            <div className="stat-icon">🚀</div>
            <h3>Totale Sessions</h3>
            <div className="stat-number">{sessionStats.totalSessions}</div>
            <div className="stat-subtext">Actief: {sessionStats.activeSessions}</div>
            <div className="stat-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{width: `${Math.min((sessionStats.totalSessions / 10) * 100, 100)}%`}}></div>
              </div>
            </div>
          </div>
          <div className="stat-card featured">
            <div className="stat-icon">⏱️</div>
            <h3>Gem. Duur</h3>
            <div className="stat-number">{sessionStats.avgDuration} min</div>
            <div className="stat-subtext">Totaal: {sessionStats.totalDuration} min</div>
            <div className="stat-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{width: `${Math.min((sessionStats.avgDuration / 30) * 100, 100)}%`}}></div>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <h3>🕐 Laatste Login</h3>
            <div className="stat-text">{sessionStats.lastLogin}</div>
            <div className="stat-badge recent">Recent</div>
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
            {sessionStats.currentStreak > 0 && <div className="streak-flame"></div>}
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <h3>Actieve Dagen</h3>
            <div className="stat-number">{sessionStats.totalDays}</div>
            <div className="stat-subtext">van de laatste {timeRange}</div>
          </div>
        </div>
      </section>

      {/* Health Alerts Section */}
      {healthAlerts && healthAlerts.alerts.length > 0 && (
        <section className="health-alerts-section">
          <h2>🐾 Gezondheidswaarschuwingen</h2>
          <div className="alerts-summary">
            <div className="alert-badge critical">{healthAlerts.summary.critical} Kritiek</div>
            <div className="alert-badge high">{healthAlerts.summary.high} Hoog</div>
            <div className="alert-badge medium">{healthAlerts.summary.medium} Medium</div>
            <div className="alert-badge low">{healthAlerts.summary.low} Laag</div>
          </div>
          <div className="alerts-list">
            {healthAlerts.alerts.slice(0, 5).map((alert, index) => (
              <div key={index} className={`alert-item ${alert.type}`}>
                <div className="alert-header">
                  <h4>{alert.title}</h4>
                  <span className="alert-date">{alert.date}</span>
                </div>
                <p className="alert-message">{alert.message}</p>
                <div className="alert-recommendation">
                  <strong>Advies:</strong> {alert.recommendation}
                </div>
              </div>
            ))}
          </div>
          {healthAlerts.alerts.length > 5 && (
            <div className="show-more-alerts">
              +{healthAlerts.alerts.length - 5} meer waarschuwingen
            </div>
          )}
        </section>
      )}

      {/* Activity Heatmap */}
      <section className="heatmap-section">
        <h2>🗓️ Activiteit Heatmap (Laatste 90 dagen)</h2>
        <div className="heatmap-container">
          <div className="heatmap-legend">
            <span>Minder</span>
            <div className="legend-colors">
              <div className="legend-color" data-intensity="0"></div>
              <div className="legend-color" data-intensity="1"></div>
              <div className="legend-color" data-intensity="2"></div>
              <div className="legend-color" data-intensity="3"></div>
              <div className="legend-color" data-intensity="4"></div>
            </div>
            <span>Meer</span>
          </div>
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

      {/* Charts */}
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

      {/* User Engagement Metrics */}
      <section className="engagement-section">
        <h2>📊 User Engagement Metrics</h2>
        <div className="engagement-grid">
          <div className="engagement-card">
            <h3>Engagement Score</h3>
            <div className="engagement-score">
              {calculateEngagementScore()}
            </div>
            <div className="engagement-details">
              <div>Daily Active Days: {((sessionStats.totalDays / Math.max(1, parseInt(timeRange.replace('d', '')))) * 100).toFixed(1)}%</div>
              <div>Avg Session Time: {sessionStats.avgDuration} min</div>
              <div>Actions per Session: {sessionStats.totalSessions > 0 ? Math.round((sessionStats.totalEvents + sessionStats.totalPageViews) / sessionStats.totalSessions) : 0}</div>
            </div>
          </div>
          <div className="engagement-card">
            <h3>Usage Patterns</h3>
            <div className="patterns-list">
              <div className="pattern-item">
                <span className="pattern-label">Most Active Day:</span>
                <span className="pattern-value">{getMostActiveDay()}</span>
              </div>
              <div className="pattern-item">
                <span className="pattern-label">Peak Time:</span>
                <span className="pattern-value">{getPeakTime()}</span>
              </div>
              <div className="pattern-item">
                <span className="pattern-label">Usage Frequency:</span>
                <span className="pattern-value">{getUsageFrequency()}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Events */}
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

      {/* Recent Sessions */}
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
                {session.calculatedDuration ? 
                  Math.round(session.calculatedDuration / 1000 / 60) + ' min' : 
                  'Onbekend'
                }
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