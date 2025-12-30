import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DailyEntryForm from "./pages/DailyEntryForm";
import UserDashBoard from "./pages/UserDashBoard"; 
import MyDogs from "./pages/MyDogs";
import Profile from "./pages/Profile";

function App() {
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

      </Routes>
    </Router>
  );
}

export default App;
