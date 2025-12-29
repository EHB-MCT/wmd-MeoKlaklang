import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./DailyEntryForm.css";

export default function DailyEntryForm() {
  const navigate = useNavigate();

  /* =========================
     BASIS
  ========================= */
  const userId = localStorage.getItem("userId");
  const [dogs, setDogs] = useState([]);
  const [dogId, setDogId] = useState("");

  const [startTime] = useState(Date.now());
  const [hoveredOptions, setHoveredOptions] = useState([]);

  /* =========================
     DAGELIJKSE DATA
  ========================= */
  const [food, setFood] = useState("");
  const [water, setWater] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [walks, setWalks] = useState("");
  const [playtimeMinutes, setPlaytimeMinutes] = useState("");
  const [aloneHours, setAloneHours] = useState("");

  /* =========================
     GEZONDHEID & GEDRAG
  ========================= */
  const [poop, setPoop] = useState("");
  const [vomit, setVomit] = useState(false);
  const [meds, setMeds] = useState(false);
  const [behavior, setBehavior] = useState("");
  const [emotion, setEmotion] = useState("");
  const [appetite, setAppetite] = useState("");
  const [energyLevel, setEnergyLevel] = useState("");

  const [stressSignals, setStressSignals] = useState(false);
  const [painSignals, setPainSignals] = useState(false);
  const [trainingDone, setTrainingDone] = useState(false);
  const [leftAloneTooLong, setLeftAloneTooLong] = useState(false);

  /* =========================
     SUBJECTIEVE ZORG (WEAPON)
  ========================= */
  const [ownerConcern, setOwnerConcern] = useState("");

  /* =========================
     DOGS OPHALEN
  ========================= */
  useEffect(() => {
    if (!userId) return;

    fetch(`http://localhost:5000/api/dogs/${userId}`)
      .then((res) => res.json())
      .then((data) => setDogs(data))
      .catch((err) => console.error(err));
  }, [userId]);

  /* =========================
     HOVER TRACKING
  ========================= */
  const handleHover = (value) => {
    if (!hoveredOptions.includes(value)) {
      setHoveredOptions((prev) => [...prev, value]);
    }
  };

  /* =========================
     OPTION BUTTONS
  ========================= */
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

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!dogId) {
      alert("Selecteer eerst een hond");
      return;
    }

    const timeOnPage = Date.now() - startTime;

    const fields = [
      food,
      water,
      sleepHours,
      walks,
      playtimeMinutes,
      aloneHours,
      poop,
      behavior,
      emotion,
      appetite,
      energyLevel,
      ownerConcern,
    ];

    const emptyFields = fields.filter((v) => !v || v === 0).length;

    const entry = {
      userId,
      dogId,
      date: new Date().toISOString().split("T")[0],

      food,
      water,
      sleepHours,
      walks,
      playtimeMinutes,
      aloneHours,

      poop,
      vomit,
      meds,
      behavior,
      emotion,
      appetite,
      energyLevel,

      stressSignals,
      painSignals,
      trainingDone,
      leftAloneTooLong,

      ownerConcern,

      hoveredOptions,
      timeOnPage,
      emptyFields,
    };

    try {
      await fetch("http://localhost:5000/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      alert("Dagelijkse log opgeslagen 🐾");
    } catch (err) {
      console.error(err);
      alert("Fout bij opslaan");
    }
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="daily-entry-container">
      <h2>🐶 Honden Dagboek</h2>
      <p className="soft-warning">
        Regelmatig loggen helpt je hond gezond en gelukkig te blijven.
      </p>

      {/* NAVIGATIE */}
      <div className="nav-buttons">
        <button onClick={() => navigate("/daily-entry")}>📓 Logboek</button>
        <button onClick={() => navigate("/my-dogs")}>🐕 Mijn dieren</button>
        <button onClick={() => navigate("/profile")}>👤 Profiel</button>
        <button onClick={() => navigate("/notifications")}>🔔 Meldingen</button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* HOND SELECTIE */}
        <label>
          🐕 Kies hond
          <select value={dogId} onChange={(e) => setDogId(e.target.value)} required>
            <option value="">-- selecteer --</option>
            {dogs.map((dog) => (
              <option key={dog._id} value={dog._id}>
                {dog.name}
              </option>
            ))}
          </select>
        </label>

        {renderOptionButtons("🍽️ Voeding", ["Weinig", "Normaal", "Veel"], food, setFood)}
        {renderOptionButtons("💩 Ontlasting", ["Geen", "Hard", "Normaal", "Zacht", "Diarree"], poop, setPoop)}
        {renderOptionButtons("🐾 Gedrag", ["Actief", "Rustig", "Sloom", "Onrustig", "Agressief"], behavior, setBehavior)}
        {renderOptionButtons("🧠 Emotie", ["Blij", "Neutraal", "Angstig", "Gestrest", "Verdrietig"], emotion, setEmotion)}
        {renderOptionButtons("🍽️ Eetlust", ["Slecht", "Normaal", "Goed", "Overmatig"], appetite, setAppetite)}
        {renderOptionButtons("⚡ Energie", ["Laag", "Normaal", "Hoog"], energyLevel, setEnergyLevel)}
        {renderOptionButtons(
          "🤔 Maak je je zorgen?",
          ["Nee", "Een beetje", "Ja", "Veel"],
          ownerConcern,
          setOwnerConcern
        )}

        <label>💧 Water (ml)
          <input type="number" onChange={(e) => setWater(e.target.value)} />
        </label>

        <label>💤 Slaap (uren)
          <input type="number" onChange={(e) => setSleepHours(e.target.value)} />
        </label>

        <label>🚶 Wandelingen
          <input type="number" onChange={(e) => setWalks(e.target.value)} />
        </label>

        <label>🎾 Speeltijd (min)
          <input type="number" onChange={(e) => setPlaytimeMinutes(e.target.value)} />
        </label>

        <label>🏠 Alleen thuis (uren)
          <input type="number" onChange={(e) => setAloneHours(e.target.value)} />
        </label>

        {/* CHECKBOXEN */}
        <div className="checkbox-row">
          <label><input type="checkbox" onChange={e => setVomit(e.target.checked)} /> 🤮 Overgegeven</label>
        </div>

        <div className="checkbox-row">
          <label><input type="checkbox" onChange={e => setMeds(e.target.checked)} /> 💊 Medicatie</label>
        </div>

        <div className="checkbox-row">
          <label><input type="checkbox" onChange={e => setStressSignals(e.target.checked)} /> 😰 Stress-signalen</label>
        </div>

        <div className="checkbox-row">
          <label><input type="checkbox" onChange={e => setPainSignals(e.target.checked)} /> 🩹 Pijn-signalen</label>
        </div>

        <div className="checkbox-row">
          <label><input type="checkbox" onChange={e => setTrainingDone(e.target.checked)} /> 🎓 Training gedaan</label>
        </div>

        <div className="checkbox-row">
          <label><input type="checkbox" onChange={e => setLeftAloneTooLong(e.target.checked)} /> ⏰ Te lang alleen</label>
        </div>

        <button type="submit">✅ Opslaan</button>
      </form>
    </div>
  );
}
