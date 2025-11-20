import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DailyEntryForm from "./pages/DailyEntryForm";
import Login from "./pages/Login";

function App() {
  return (
    <Router>
      <h1>Honden Dagboek</h1>

      <Routes>
        {/* Default route → redirect naar login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/daily-entry" element={<DailyEntryForm />} />
      </Routes>
    </Router>
  );
}

export default App;
