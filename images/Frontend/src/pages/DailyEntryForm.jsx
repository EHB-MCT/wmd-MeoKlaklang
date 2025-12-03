import { useState } from "react";
import { Link } from "react-router-dom";
import "./DailyEntryForm.css";

export default function DailyEntryForm() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [food, setFood] = useState("");
  const [water, setWater] = useState(0);
  const [poop, setPoop] = useState("");
  const [vomit, setVomit] = useState(false);
  const [meds, setMeds] = useState(false);
  const [behavior, setBehavior] = useState("");
  const [emotion, setEmotion] = useState("");
  const [hoveredOptions, setHoveredOptions] = useState([]);

  const handleHover = (value) => {
    if (!hoveredOptions.includes(value)) {
      setHoveredOptions([...hoveredOptions, value]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Geen gebruiker gevonden. Log opnieuw in.");
      return;
    }

    const entry = {
      userId,
      date,
      food,
      water,
      poop,
      vomit,
      meds,
      behavior,
      emotion,
      hoveredOptions,
    };

    try {
      const response = await fetch("http://localhost:5000/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      const data = await response.json();
      alert(data.message);
    } catch (err) {
      console.error(err);
      alert("Er is een fout opgetreden bij het opslaan.");
    }
  };

  const renderOptionButtons = (label, options, selectedValue, setter) => (
    <div>
      <strong>{label}</strong>
      <div className="option-buttons">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setter(opt)}
            onMouseEnter={() => handleHover(opt)}
            className={`option-button ${selectedValue === opt ? "active" : ""}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="daily-entry-container">
      <h2>🐶 Dagelijkse log</h2>

      {/* Navigatiebalk */}
      <div className="nav-buttons">
        <Link to="/dashboard"><button>📊 Dashboard</button></Link>
        <Link to="/analysis"><button>🧠 Analyse</button></Link>
        <Link to="/daily-entry"><button>📓 Logboek</button></Link>
      </div>

      <form onSubmit={handleSubmit}>
        <label>
          📅 Datum:
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        {renderOptionButtons("🍽️ Voedselinname:", ["Weinig", "Normaal", "Veel"], food, setFood)}

        <label>
          💧 Waterinname (ml):
          <input
            type="number"
            min="0"
            max="1000"
            step="50"
            value={water}
            onChange={(e) => setWater(e.target.value)}
          />
        </label>

        {renderOptionButtons("💩 Ontlasting:", ["Geen", "Hard", "Normaal", "Los", "Diarree"], poop, setPoop)}

        <label>
          🤮 Overgegeven:
          <input
            type="checkbox"
            checked={vomit}
            onChange={(e) => setVomit(e.target.checked)}
          />
        </label>

        <label>
          💊 Medicatie:
          <input
            type="checkbox"
            checked={meds}
            onChange={(e) => setMeds(e.target.checked)}
          />
        </label>

        {renderOptionButtons("🐾 Gedrag:", ["Actief", "Normaal", "Sloom", "Angstig"], behavior, setBehavior)}

        {renderOptionButtons("🧠 Hoe voelt je hond zich vandaag?", ["Blij", "Neutraal", "Verdrietig", "Gestrest"], emotion, setEmotion)}

        <button type="submit">✅ Opslaan</button>
      </form>
    </div>
  );
}
