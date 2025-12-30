import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dashboard states
  const [activeView, setActiveView] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [adminStats, setAdminStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5003";

  // Check admin session
  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/check`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      setIsAdmin(data.isAdmin);
      setAdminUser(data.user);
      setLoading(false);
      
      if (!data.isAdmin) {
        navigate('/admin/login');
      }
    } catch (err) {
      console.error("Admin session check failed:", err);
      setLoading(false);
      navigate('/admin/login');
    }
  };

  // Load admin stats
  useEffect(() => {
    if (isAdmin) {
      loadAdminStats();
    }
  }, [isAdmin]);

  // Load users with filters
  useEffect(() => {
    if (isAdmin && activeView === 'users') {
      loadUsers();
    }
  }, [isAdmin, activeView, currentPage, searchTerm, filterRole]);

  // Load selected user analytics
  useEffect(() => {
    if (isAdmin && selectedUser && activeView === 'analytics') {
      loadUserAnalytics(selectedUser._id);
    }
  }, [isAdmin, selectedUser, activeView]);

  const loadAdminStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/stats`, {
        credentials: 'include'
      });
      const data = await response.json();
      setAdminStats(data);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        role: filterRole
      });
      
      const response = await fetch(`${API_BASE}/api/admin/users?${queryParams}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const loadUserAnalytics = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/analytics/${userId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setUserAnalytics(data);
    } catch (err) {
      console.error("Failed to load user analytics:", err);
    }
  };

  const handleUserAction = async (userId, action, actionData = {}) => {
    try {
      let endpoint = '';
      let method = 'POST';
      let body = {};

      switch (action) {
        case 'deactivate':
          endpoint = `/admin/user/${userId}/deactivate`;
          break;
        case 'role':
          endpoint = `/admin/user/${userId}/role`;
          method = 'PUT';
          body = { newRole: actionData.role };
          break;
        case 'analytics':
          setSelectedUser({ _id: userId });
          setActiveView('analytics');
          return;
      }

      const response = await fetch(`${API_BASE}/api/admin${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      });

      if (action !== 'analytics') {
        const data = await response.json();
        if (data.success) {
          loadUsers(); // Refresh user list
          setSelectedUser(null);
        }
      }
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      alert(`Actie mislukt: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/admin/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      setIsAdmin(false);
      setAdminUser(null);
      navigate('/admin/login');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: '#ef4444',
      manager: '#f59e0b',
      user: '#10b981'
    };
    return colors[role] || '#6b7280';
  };

  const getRoleBadge = (role) => {
    const labels = {
      admin: 'Beheerder',
      manager: 'Manager',
      user: 'Gebruiker'
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <h2>🔐 Admin Dashboard</h2>
          <p>Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-info">
          <h1>🔐 Admin Dashboard</h1>
          {adminUser && (
            <div className="admin-user">
              <span>{adminUser.name}</span>
              <span className={`role-badge ${adminUser.role}`}>
                {getRoleBadge(adminUser.role)}
              </span>
            </div>
          )}
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Uitloggen
        </button>
      </header>

      <nav className="admin-nav">
        <button 
          className={activeView === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveView('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={activeView === 'users' ? 'active' : ''}
          onClick={() => setActiveView('users')}
        >
          👥 Gebruikers
        </button>
        <button 
          className={activeView === 'analytics' ? 'active' : ''}
          onClick={() => setActiveView('analytics')}
        >
          📈 Gebruikersanalyse
        </button>
      </nav>

      {activeView === 'dashboard' && (
        <section className="admin-section">
          <h2>📊 Systeem Overzicht</h2>
          
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Totale Gebruikers</h3>
              <div className="stat-number">{adminStats.overview?.totalUsers || 0}</div>
              <div className="stat-desc">Geregistreerde gebruikers</div>
            </div>
            
            <div className="stat-card">
              <h3>Actieve Gebruikers</h3>
              <div className="stat-number">{adminStats.overview?.activeUsers || 0}</div>
              <div className="stat-desc">Momenteel actief</div>
            </div>
            
            <div className="stat-card">
              <h3>Totale Evenementen</h3>
              <div className="stat-number">{adminStats.overview?.totalEvents || 0}</div>
              <div className="stat-desc">Gebruikersinteracties</div>
            </div>
            
            <div className="stat-card">
              <h3>Sessies</h3>
              <div className="stat-number">{adminStats.overview?.totalSessions || 0}</div>
              <div className="stat-desc">Unieke gebruikerssessies</div>
            </div>
            
            <div className="stat-card">
              <h3>Recente Activiteit</h3>
              <div className="stat-number">{adminStats.overview?.recentEvents || 0}</div>
              <div className="stat-desc">Laatste 30 dagen</div>
            </div>
          </div>

          <div className="role-distribution">
            <h3>👥 Rol Distributie</h3>
            <div className="role-stats">
              {adminStats.roleDistribution?.map(role => (
                <div key={role._id} className="role-stat">
                  <span 
                    className="role-color" 
                    style={{ backgroundColor: getRoleColor(role._id) }}
                  ></span>
                  <div className="role-info">
                    <div className="role-name">{getRoleBadge(role._id)}</div>
                    <div className="role-count">{role.count}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeView === 'users' && (
        <section className="admin-section">
          <h2>👥 Gebruikers Beheer</h2>
          
          <div className="user-controls">
            <div className="search-filter">
              <input
                type="text"
                placeholder="Zoek gebruikers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              
              <select 
                value={filterRole} 
                onChange={(e) => setFilterRole(e.target.value)}
                className="role-filter"
              >
                <option value="">Alle Rollen</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="user">Gebruiker</option>
              </select>
            </div>
            
            <button 
              className="create-admin-btn"
              onClick={() => navigate('/admin/create-user')}
            >
              + Nieuwe Admin
            </button>
          </div>

          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Gebruiker</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Status</th>
                  <th>Laatste Login</th>
                  <th>Acties</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td className="user-info">
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </td>
                    <td>
                      <span 
                        className={`role-indicator ${user.role}`}
                        style={{ backgroundColor: getRoleColor(user.role) }}
                      >
                        {getRoleBadge(user.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? 'Actief' : 'Inactief'}
                      </span>
                    </td>
                    <td>{user.lastLogin ? formatDate(user.lastLogin) : 'Nooit'}</td>
                    <td className="actions-cell">
                      <button 
                        className="analytics-btn"
                        onClick={() => handleUserAction(user._id, 'analytics')}
                      >
                        📈
                      </button>
                      
                      <select 
                        className="role-select"
                        value={user.role}
                        onChange={(e) => handleUserAction(user._id, 'role', { role: e.target.value })}
                      >
                        <option value="user">Gebruiker</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      
                      <button 
                        className="deactivate-btn"
                        onClick={() => {
                          if (window.confirm(`Weet je zeker dat je ${user.name} wilt deactiveren?`)) {
                            handleUserAction(user._id, 'deactivate');
                          }
                        }}
                        disabled={user.role === 'admin' && !user.isActive}
                      >
                        Deactiveren
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeView === 'analytics' && selectedUser && (
        <section className="admin-section">
          <div className="analytics-header">
            <h2>📈 Analyse voor {selectedUser.name}</h2>
            <button 
              className="back-btn"
              onClick={() => setActiveView('users')}
            >
              ← Terug naar gebruikers
            </button>
          </div>

          {userAnalytics && (
            <div className="user-analytics">
              <div className="analytics-summary">
                <h3>📊 Gebruikerstatistieken</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="label">Totale Evenementen:</span>
                    <span className="value">{userAnalytics.summary?.totalEvents || 0}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Sessies:</span>
                    <span className="value">{userAnalytics.summary?.totalSessions || 0}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Gem. Sessieduur:</span>
                    <span className="value">{Math.round((userAnalytics.summary?.avgSessionDuration || 0) / 1000 / 60)} min</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Bounce Rate:</span>
                    <span className="value">{Math.round((userAnalytics.summary?.bounceRate || 0) * 100)}%</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Honden:</span>
                    <span className="value">{userAnalytics.summary?.totalDogs || 0}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Logs:</span>
                    <span className="value">{userAnalytics.summary?.totalEntries || 0}</span>
                  </div>
                </div>
              </div>

              <div className="event-breakdown">
                <h3>📈 Evenement Analyse</h3>
                <div className="events-grid">
                  {userAnalytics.events?.map(event => (
                    <div key={event._id} className="event-card">
                      <h4>{event._id}</h4>
                      <div className="event-count">{event.count}</div>
                      <div className="event-detail">
                        Laatst: {event.lastOccurrence ? formatDate(event.lastOccurrence) : 'Nooit'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}