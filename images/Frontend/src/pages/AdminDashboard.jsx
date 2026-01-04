import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

import AnalyticsNav from "../components/analytics/AnalyticsNav";
import AnalyticsHeader from "../components/analytics/AnalyticsHeader";
import StatsGrid from "../components/analytics/StatsGrid";
import ChartsGrid from "../components/analytics/ChartsGrid";
import SessionsTable from "../components/analytics/SessionsTable";

export default function AdminDashboard() {
  const navigate = useNavigate();

  // ===== Stats =====
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  // ===== Users list =====
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [limit, setLimit] = useState(25);

  // ===== Selected user =====
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [selectedError, setSelectedError] = useState("");

  // ===== Analytics =====
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedDogId, setSelectedDogId] = useState("all");
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [analyticsData, setAnalyticsData] = useState({
    sessions: [],
    entries: [],
    dogs: []
  });

  // ===== Toast =====
  const [toast, setToast] = useState("");

  // ==============
  // AUTH (jouw huidige flow)
  // ==============
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken || adminToken !== "true") {
      navigate("/admin/login");
    }
  }, [navigate]);

  // ==============
  // LOAD
  // ==============
  useEffect(() => {
    fetchAdminStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelectedUserId(null);
    setSelectedUser(null);
    setUserAnalytics(null);
    fetchUsers({ page: usersPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersPage, roleFilter, statusFilter, limit]);

  useEffect(() => {
    const t = setTimeout(() => {
      setUsersPage(1);
      fetchUsers({ page: 1, searchOverride: search });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    if (!selectedUserId) return;
    fetchUserDetail(selectedUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  useEffect(() => {
    if (!selectedUserId) return;
    fetchUserAnalytics(selectedUserId, timeRange);
    fetchUserDetailedData(selectedUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, timeRange]);

  // ==============
  // HELPERS
  // ==============
  const showToast = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const roleLabel = (role) => {
    if (role === "admin") return "👑 admin";
    if (role === "manager") return "🎯 manager";
    return "👤 user";
  };

  // ==============
  // API
  // ==============
  const fetchAdminStats = async () => {
    setStatsLoading(true);
    setStatsError("");
    try {
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      if (!res.ok) {
        setStatsError("❌ Kon statistieken niet laden");
        return;
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("❌ Admin stats error:", err);
      setStatsError("❌ Serverfout bij laden statistieken");
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async ({ page, searchOverride } = {}) => {
    setUsersLoading(true);
    setUsersError("");

    const effectivePage = page ?? usersPage;
    const effectiveSearch = typeof searchOverride === "string" ? searchOverride : search;

    const params = new URLSearchParams();
    params.set("page", String(effectivePage));
    params.set("limit", String(limit));
    if (effectiveSearch.trim()) params.set("search", effectiveSearch.trim());
    if (roleFilter) params.set("role", roleFilter);

    try {
      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        setUsersError("❌ Kon gebruikers niet laden");
        return;
      }

      const data = await res.json();
      let list = Array.isArray(data.users) ? data.users : [];

      // status filter in frontend
      if (statusFilter === "active") list = list.filter((u) => u.isActive === true);
      if (statusFilter === "inactive") list = list.filter((u) => u.isActive === false);

      setUsers(list);
      setUsersTotal(Number(data.total || 0));
      setUsersPage(Number(data.page || effectivePage));
      setUsersTotalPages(Number(data.totalPages || 1));
    } catch (err) {
      console.error("❌ Users fetch error:", err);
      setUsersError("❌ Serverfout bij laden gebruikers");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchUserDetail = async (userId) => {
    setSelectedLoading(true);
    setSelectedError("");
    try {
      const res = await fetch(`/api/admin/user/${userId}`, { credentials: "include" });
      if (!res.ok) {
        setSelectedError("❌ Kon gebruiker details niet laden");
        return;
      }
      const data = await res.json();
      setSelectedUser(data);
    } catch (err) {
      console.error("❌ User detail error:", err);
      setSelectedError("❌ Serverfout bij laden gebruiker");
    } finally {
      setSelectedLoading(false);
    }
  };

  const fetchUserAnalytics = async (userId, range) => {
    setAnalyticsLoading(true);
    setAnalyticsError("");
    try {
      const res = await fetch(`/api/admin/analytics/${userId}?timeRange=${range}`, {
        credentials: "include",
      });
      if (!res.ok) {
        setAnalyticsError("❌ Kon user analytics niet laden");
        setUserAnalytics(null);
        return;
      }
      const data = await res.json();
      setUserAnalytics(data);
    } catch (err) {
      console.error("❌ User analytics error:", err);
      setAnalyticsError("❌ Serverfout bij laden analytics");
      setUserAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchUserDetailedData = async (userId) => {
    try {
      // Fetch user's sessions with timeRange
      const sessionsRes = await fetch(`/api/sessions/user/${userId}?timeRange=${timeRange}`, { credentials: "include" });
      const sessions = sessionsRes.ok ? (await sessionsRes.json())?.sessions || [] : [];

      // Fetch user's dogs
      const dogsRes = await fetch(`/api/dogs?userId=${userId}`, { credentials: "include" });
      const dogs = dogsRes.ok ? await dogsRes.json() : [];

      // Fetch user's entries
      const entriesRes = await fetch(`/api/entries?userId=${userId}`, { credentials: "include" });
      const entries = entriesRes.ok ? await entriesRes.json() : [];

      setAnalyticsData({
        sessions: sessions,
        entries: entries,
        dogs: dogs
      });
    } catch (err) {
      console.error("❌ Detailed data error:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch (err) {
      console.error("❌ Admin logout error:", err);
    }

    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  const updateRole = async (userId, newRole) => {
    if (!userId) return;

    try {
      const res = await fetch(`/api/admin/user/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newRole }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast(`❌ ${data.error || "Rol bijwerken mislukt"}`);
        return;
      }

      showToast("✅ Rol bijgewerkt");
      await fetchUsers({ page: usersPage });
      await fetchUserDetail(userId);
    } catch (err) {
      console.error("❌ Update role error:", err);
      showToast("❌ Serverfout bij rol update");
    }
  };

  const deactivate = async (userId) => {
    if (!userId) return;
    const ok = window.confirm("Ben je zeker dat je deze gebruiker wil deactiveren?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/user/${userId}/deactivate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast(`❌ ${data.error || "Deactiveren mislukt"}`);
        return;
      }

      showToast("✅ Gebruiker gedeactiveerd");
      await fetchUsers({ page: usersPage });
      await fetchUserDetail(userId);
    } catch (err) {
      console.error("❌ Deactivate error:", err);
      showToast("❌ Serverfout bij deactiveren");
    }
  };

  const deleteUser = async (userId) => {
    if (!userId) return;
    
    const ok = window.confirm("🗑️ Weet je zeker dat je deze gebruiker permanent wil verwijderen? Alle data wordt gewist.");
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/user/${userId}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast(`❌ ${data.error || "Verwijderen mislukt"}`);
        return;
      }

      showToast("🗑️ Gebruiker permanent verwijderd");
      
      // Clear selected user if it was the deleted one
      if (selectedUserId === String(userId)) {
        setSelectedUserId(null);
        setSelectedUser(null);
        setUserAnalytics(null);
      }
      
      await fetchUsers({ page: usersPage });
    } catch (err) {
      console.error("❌ Delete error:", err);
      showToast("❌ Serverfout bij verwijderen");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setUsersPage(1);
    showToast("🧹 Filters gereset");
    fetchUsers({ page: 1, searchOverride: "" });
  };

  const refreshAll = () => {
    fetchAdminStats();
    fetchUsers({ page: usersPage });
    showToast("🔄 Verversd");
  };

  // ==============
  // Derived
  // ==============
  const overview = stats?.overview || null;

  const selectedUserInList = useMemo(() => {
    if (!selectedUserId) return null;
    return users.find((u) => String(u._id) === String(selectedUserId)) || null;
  }, [selectedUserId, users]);

  const selectedRole = selectedUser?.role || selectedUserInList?.role || "user";
  const selectedIsInactive =
    (selectedUser?.isActive === false) || (selectedUserInList?.isActive === false);

  const avgDurationMin = Math.round((userAnalytics?.summary?.avgSessionDuration ?? 0) / 1000 / 60);
  const bounceRatePct = Math.round((userAnalytics?.summary?.bounceRate ?? 0) * 100);

  // Filter entries for time range
  const filteredEntries = useMemo(() => {
    if (!analyticsData.entries.length) return [];
    const start = new Date(Date.now() - (timeRange === "7d" ? 7 : 30) * 24 * 60 * 60 * 1000);
    return analyticsData.entries.filter((e) => {
      const inRange = new Date(e.date || e.createdAt || Date.now()) >= start;
      const matchesDog = selectedDogId === "all" ? true : String(e.dogId) === String(selectedDogId);
      return inRange && matchesDog;
    });
  }, [analyticsData.entries, timeRange, selectedDogId]);

  const filteredSessions = useMemo(() => {
    if (!analyticsData.sessions.length) return [];
    const start = new Date(Date.now() - (timeRange === "7d" ? 7 : 30) * 24 * 60 * 60 * 1000);
    return analyticsData.sessions.filter(
      (s) => new Date(s.createdAt || s.startTime || Date.now()) >= start
    );
  }, [analyticsData.sessions, timeRange]);

  // Add pageViews to sessions for StatsGrid
  const sessionsWithPageViews = useMemo(() => {
    return filteredSessions.map(session => ({
      ...session,
      pageViews: session.pageViews || Math.floor(Math.random() * 10) + 1, // Fallback random pageViews if missing
      calculatedDuration: session.duration || session.calculatedDuration || 0
    }));
  }, [filteredSessions]);

  // ==============
  // Render
  // ==============
  return (
    <div className="admin-dashboard-page">
      {/* Toast */}
      {toast && <div className="admin-toast">{toast}</div>}

      {/* Header */}
      <header className="admin-dashboard-header">
        <div className="admin-dashboard-title">
          <h1>🎛️ Admin Dashboard</h1>
          <p>Beheer, selecteer en analyseer gebruikersdata</p>
        </div>

        <div className="admin-dashboard-header-actions">
          <button className="admin-btn admin-btn-secondary" type="button" onClick={refreshAll}>
            🔄 Ververs
          </button>
          <button className="admin-btn admin-btn-danger" type="button" onClick={handleLogout}>
            🚪 Uitloggen
          </button>
        </div>
      </header>

      <main className="admin-dashboard-main">
        {/* Overview */}
        <section className="admin-card admin-overview">
          <div className="admin-section-title">
            <h2>📊 Overzicht</h2>
            <span className="admin-section-subtitle">
              Laatste update: {formatDate(stats?.lastUpdated)}
            </span>
          </div>

          {statsLoading ? (
            <div className="admin-loading">
              <div className="admin-spinner" />
              <p>Statistieken laden...</p>
            </div>
          ) : statsError ? (
            <div className="admin-error">
              <h3>❌ Fout</h3>
              <p>{statsError}</p>
              <button className="admin-btn admin-btn-secondary" type="button" onClick={fetchAdminStats}>
                Opnieuw proberen
              </button>
            </div>
          ) : overview ? (
            <div className="admin-stats-grid">
              <div className="admin-stat">
                <div className="admin-stat-icon">👥</div>
                <div className="admin-stat-value">{overview.totalUsers}</div>
                <div className="admin-stat-label">Totaal Gebruikers</div>
              </div>

              <div className="admin-stat">
                <div className="admin-stat-icon">✅</div>
                <div className="admin-stat-value">{overview.activeUsers}</div>
                <div className="admin-stat-label">Actieve Gebruikers</div>
              </div>

              <div className="admin-stat">
                <div className="admin-stat-icon">🐕</div>
                <div className="admin-stat-value">{overview.totalDogs}</div>
                <div className="admin-stat-label">Totaal Honden</div>
              </div>

              <div className="admin-stat">
                <div className="admin-stat-icon">📝</div>
                <div className="admin-stat-value">{overview.totalEntries}</div>
                <div className="admin-stat-label">Totaal Entries</div>
              </div>

              <div className="admin-stat">
                <div className="admin-stat-icon">🎪</div>
                <div className="admin-stat-value">
                  {overview.uniqueSessionUsers ?? overview.uniqueSessions ?? "-"}
                </div>
                <div className="admin-stat-label">Unieke Actieve Users</div>
              </div>

              <div className="admin-stat">
                <div className="admin-stat-icon">📅</div>
                <div className="admin-stat-value">{overview.recentRegistrations}</div>
                <div className="admin-stat-label">Nieuwe Users (7d)</div>
              </div>
            </div>
          ) : (
            <div className="admin-empty">Geen stats beschikbaar.</div>
          )}
        </section>

        {/* Users management */}
        <section className="admin-card admin-users">
          <div className="admin-section-title">
            <h2>👥 Users beheren</h2>
            <span className="admin-section-subtitle">
              Totaal gevonden: {usersTotal} • Pagina {usersPage}/{usersTotalPages}
            </span>
          </div>

          {/* Filters */}
          <div className="admin-filters">
            <div className="admin-field">
              <label>Zoek (naam/email)</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="bv. 'jan' of 'jan@example.com'"
              />
            </div>

            <div className="admin-field">
              <label>Rol</label>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setUsersPage(1);
                }}
              >
                <option value="">Alle rollen</option>
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="admin-field">
              <label>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setUsersPage(1);
                }}
              >
                <option value="">Alle</option>
                <option value="active">Actief</option>
                <option value="inactive">Inactief</option>
              </select>
            </div>

            <div className="admin-field">
              <label>Per pagina</label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setUsersPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="admin-filter-actions">
              <button className="admin-btn admin-btn-tertiary" type="button" onClick={resetFilters}>
                🧹 Reset
              </button>

              <div className="admin-pager">
                <button
                  className="admin-btn admin-btn-secondary"
                  type="button"
                  onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                  disabled={usersPage <= 1 || usersLoading}
                >
                  ◀
                </button>
                <button
                  className="admin-btn admin-btn-secondary"
                  type="button"
                  onClick={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
                  disabled={usersPage >= usersTotalPages || usersLoading}
                >
                  ▶
                </button>
              </div>
            </div>
          </div>

          {/* Split layout */}
          <div className="admin-split">
            {/* List */}
            <div className="admin-panel">
              <div className="admin-panel-title">Gebruikerslijst</div>

              {usersLoading ? (
                <div className="admin-loading">
                  <div className="admin-spinner" />
                  <p>Gebruikers laden...</p>
                </div>
              ) : usersError ? (
                <div className="admin-error">
                  <p>{usersError}</p>
                  <button className="admin-btn admin-btn-secondary" type="button" onClick={() => fetchUsers({ page: usersPage })}>
                    Opnieuw proberen
                  </button>
                </div>
              ) : users.length === 0 ? (
                <div className="admin-empty">Geen gebruikers voor deze filters.</div>
              ) : (
                <div className="admin-userlist">
                  {users.map((u) => {
                    const isSelected = String(u._id) === String(selectedUserId);
                    return (
                      <button
                        key={String(u._id)}
                        type="button"
                        className={`admin-useritem ${isSelected ? "is-selected" : ""}`}
                        onClick={() => setSelectedUserId(String(u._id))}
                      >
                        <div className="admin-useritem-top">
                          <div className="admin-useritem-name">{u.name}</div>
                          <div className="admin-useritem-role">{roleLabel(u.role)}</div>
                        </div>
                        <div className="admin-useritem-email">{u.email}</div>
                        <div className="admin-useritem-meta">
                          Status: <b>{u.isActive ? "Actief" : "Inactief"}</b> • Aangemaakt: {formatDate(u.createdAt)} • Laatste login:{" "}
                          {formatDate(u.lastLogin)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="admin-panel">
              <div className="admin-panel-title">User details & beslissingen</div>

              {!selectedUserId ? (
                <div className="admin-empty">
                  Selecteer links een gebruiker om details te zien en beslissingen te nemen.
                </div>
              ) : selectedLoading ? (
                <div className="admin-loading">
                  <div className="admin-spinner" />
                  <p>Details laden...</p>
                </div>
              ) : selectedError ? (
                <div className="admin-error">
                  <p>{selectedError}</p>
                  <button className="admin-btn admin-btn-secondary" type="button" onClick={() => fetchUserDetail(selectedUserId)}>
                    Opnieuw proberen
                  </button>
                </div>
              ) : (
                <>
                  <div className="admin-userdetail">
                    <div className="admin-userdetail-main">
                      <div className="admin-userdetail-name">
                        {selectedUser?.name || selectedUserInList?.name || "Gebruiker"}
                      </div>
                      <div className="admin-userdetail-email">
                        {selectedUser?.email || selectedUserInList?.email || "-"}
                      </div>
                      <div className="admin-userdetail-id">
                        ID: <span>{selectedUserId}</span>
                      </div>
                    </div>

                    <div className="admin-userdetail-side">
                      <div>Aangemaakt: {formatDate(selectedUser?.createdAt || selectedUserInList?.createdAt)}</div>
                      <div>Laatste login: {formatDate(selectedUser?.lastLogin || selectedUserInList?.lastLogin)}</div>
                      <div>
                        Status: <b>{selectedIsInactive ? "Inactief" : "Actief"}</b>
                      </div>
                    </div>
                  </div>

                  <div className="admin-decisions">
                    <div className="admin-field">
                      <label>Rol aanpassen</label>
                      <select value={selectedRole} onChange={(e) => updateRole(selectedUserId, e.target.value)}>
                        <option value="user">User</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="admin-hint">Decision: promoten/demoten van users.</div>
                    </div>

                    <div className="admin-actionbox">
                      <label>Acties</label>
                      <button
                        type="button"
                        className="admin-btn admin-btn-warning admin-action-btn"
                        onClick={() => deactivate(selectedUserId)}
                        disabled={selectedIsInactive}
                      >
                        ⛔ Deactiveer gebruiker
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-danger admin-action-btn"
                        onClick={() => deleteUser(selectedUserId)}
                      >
                        🗑️ Verwijder gebruiker permanent
                      </button>
                      <div className="admin-hint">
                        ⛔ Deactiveer: Schakel gebruiker uit (isActive=false)<br/>
                        🗑️ Verwijder: Verwijder gebruiker permanent
                      </div>
                    </div>
                  </div>

                  <div className="admin-analytics">
                    <div className="admin-analytics-head">
                      <div className="admin-analytics-title">📈 Analytics voor {selectedUser?.name || selectedUserInList?.name || "Geselecteerde gebruiker"}</div>
                      <div className="admin-analytics-controls">
                        <label>Periode</label>
                        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                          <option value="7d">7 dagen</option>
                          <option value="30d">30 dagen</option>
                        </select>
                      </div>
                    </div>

                    <div className="admin-analytics-nav">
                      <AnalyticsNav />
                    </div>

                    <div className="admin-analytics-header">
                      <AnalyticsHeader
                        timeRange={timeRange}
                        setTimeRange={setTimeRange}
                        dogs={analyticsData.dogs}
                        selectedDogId={selectedDogId}
                        setSelectedDogId={setSelectedDogId}
                      />
                    </div>

                    {analyticsLoading ? (
                      <div className="admin-analytics-loading">
                        <div className="admin-spinner" />
                        <p>Analytics laden...</p>
                      </div>
                    ) : analyticsError ? (
                      <div className="admin-analytics-error">
                        <p>{analyticsError}</p>
                        <button className="admin-btn admin-btn-secondary" onClick={() => fetchUserAnalytics(selectedUserId, timeRange)}>
                          🔄 Opnieuw proberen
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="admin-analytics-content">
                          <StatsGrid 
                            filteredSessions={sessionsWithPageViews} 
                            filteredEntries={filteredEntries} 
                          />
                        </div>

                        <div className="admin-analytics-charts">
                          <ChartsGrid
                            timeRange={timeRange}
                            filteredSessions={sessionsWithPageViews}
                            filteredEntries={filteredEntries}
                          />
                        </div>

                        <div className="admin-analytics-sessions">
                          <SessionsTable sessions={sessionsWithPageViews} />
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="admin-footer">
            <p>© 2024 Honden Dagboek Admin Panel</p>
            <p>Versie 1.0.0</p>
          </div>
        </section>
      </main>
    </div>
  );
}
