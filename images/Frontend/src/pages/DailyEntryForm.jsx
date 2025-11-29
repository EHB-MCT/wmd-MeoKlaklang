import { useState } from "react";

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
      <div style={{ display: "flex", gap: "10px", margin: "10px 0" }}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setter(opt)}
            onMouseEnter={() => handleHover(opt)}
            style={{
              padding: "8px 16px",
              backgroundColor: selectedValue === opt ? "#6dd3ce" : "#eee",
              border: "1px solid #ccc",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>🐶 Dagelijkse log</h2>
      <form onSubmit={handleSubmit}>
        <label>
          📅 Datum:
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ marginLeft: "10px" }}
          />
        </label>

        <br /><br />

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
            style={{ marginLeft: "10px" }}
          />
        </label>

        <br /><br />

        {renderOptionButtons("💩 Ontlasting:", ["Geen", "Hard", "Normaal", "Los", "Diarree"], poop, setPoop)}

        <br />

        <label>
          🤮 Overgeven:
          <input
            type="checkbox"
            checked={vomit}
            onChange={(e) => setVomit(e.target.checked)}
            style={{ marginLeft: "10px" }}
          />
        </label>

        <br /><br />

        <label>
          💊 Medicatie:
          <input
            type="checkbox"
            checked={meds}
            onChange={(e) => setMeds(e.target.checked)}
            style={{ marginLeft: "10px" }}
          />
        </label>

        <br /><br />

        {renderOptionButtons("🐾 Gedrag:", ["Actief", "Normaal", "Sloom", "Angstig"], behavior, setBehavior)}

        <br />

        {renderOptionButtons("🧠 Hoe voelt je hond zich vandaag?", ["Blij", "Neutraal", "Verdrietig", "Gestrest"], emotion, setEmotion)}

        <br />
        <button type="submit" style={{ padding: "10px 20px" }}>
          ✅ Opslaan
        </button>
      </form>
    </div>
  );
}
