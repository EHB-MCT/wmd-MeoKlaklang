import { useState } from "react";

export default function DailyEntryForm() {
  const [food, setFood] = useState("");
  const [water, setWater] = useState(0);
  const [poop, setPoop] = useState("");
  const [vomit, setVomit] = useState(false);
  const [meds, setMeds] = useState(false);
  const [behavior, setBehavior] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const entry = { food, water, poop, vomit, meds, behavior };
    console.log("Daily Entry:", entry);
    alert("Entry saved! Check console for details.");
    // Reset form
    setFood("");
    setWater(0);
    setPoop("");
    setVomit(false);
    setMeds(false);
    setBehavior("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Dagelijkse log</h2>
      <form onSubmit={handleSubmit}>

        <label>
          Voedselinname:
          <select value={food} onChange={(e) => setFood(e.target.value)}>
            <option value="">Selecteer</option>
            <option value="weinig">Weinig</option>
            <option value="normaal">Normaal</option>
            <option value="veel">Veel</option>
          </select>
        </label>
        <br /><br />

        <label>
          Water (ml):
          <input
            type="number"
            min="0"
            max="1000"
            step="50"
            value={water}
            onChange={(e) => setWater(e.target.value)}
          />
        </label>
        <br /><br />

        <label>
          Ontlasting:
          <select value={poop} onChange={(e) => setPoop(e.target.value)}>
            <option value="">Selecteer</option>
            <option value="geen">Geen</option>
            <option value="hard">Hard</option>
            <option value="normaal">Normaal</option>
            <option value="los">Los</option>
            <option value="diarree">Diarree</option>
          </select>
        </label>
        <br /><br />

        <label>
          Overgeven:
          <input
            type="checkbox"
            checked={vomit}
            onChange={(e) => setVomit(e.target.checked)}
          />
        </label>
        <br /><br />

        <label>
          Medicatie:
          <input
            type="checkbox"
            checked={meds}
            onChange={(e) => setMeds(e.target.checked)}
          />
        </label>
        <br /><br />

        <label>
          Gedrag:
          <select value={behavior} onChange={(e) => setBehavior(e.target.value)}>
            <option value="">Selecteer</option>
            <option value="actief">Actief</option>
            <option value="normaal">Normaal</option>
            <option value="sloom">Sloom</option>
            <option value="angstig">Angstig</option>
          </select>
        </label>
        <br /><br />

        <button type="submit">Opslaan</button>
      </form>
    </div>
  );
}
