import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DailyEntryForm from "./pages/DailyEntryForm";
import UserDashBoard from "./pages/UserDashBoard"; 
import Analyse from "./pages/Analyse";
import PetRegistration from "./pages/PetRegistration";

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="text-3xl mr-2">🐾</span>
                PetCare Tracker
              </h1>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pet-registration" element={<PetRegistration />} />
            <Route path="/daily-entry" element={<DailyEntryForm />} />
            <Route path="/dashboard" element={<UserDashBoard />} /> 
            <Route path="/analyse" element={<Analyse />} /> 
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
