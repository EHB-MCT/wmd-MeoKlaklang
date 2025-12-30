import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useUser } from "./contexts/UserContext.jsx";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DailyEntryForm from "./pages/DailyEntryForm";
import UserDashBoard from "./pages/UserDashBoard"; 
import MyDogs from "./pages/MyDogs";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  // Use user context for role management
  const { user } = useUser();

  // Initialize event tracking
  useEffect(() => {
    // Only initialize event tracker if user is logged in
    const userId = localStorage.getItem('userId');
    if (userId) {
      import('./utils/EventTracker.jsx').then(({ default: EventTracker }) => {
        const tracker = new EventTracker();
        tracker.expose();
      });
    }
  }, []);

  return (
    <Router>
      <h1>Honden Dagboek</h1>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/daily-entry" element={<DailyEntryForm />} />
        <Route path="/dashboard" element={<UserDashBoard />} /> 
        <Route path="/my-dogs" element={<MyDogs />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

      </Routes>
    </Router>
  );
}

export default App;
