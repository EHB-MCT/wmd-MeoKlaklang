import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DailyEntryForm from "./pages/DailyEntryForm";
import UserDashBoard from "./pages/UserDashBoard"; 
import Analyse from "./pages/Analyse";
import MyDogs from "./pages/MyDogs";

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
        <Route path="/analyse" element={<Analyse />} /> 
        <Route path="/my-dogs" element={<MyDogs />} />

      </Routes>
    </Router>
  );
}

export default App;
