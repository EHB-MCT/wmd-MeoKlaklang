import { useEffect, useState } from "react";

export default function UserDashboard() {
  const [entries, setEntries] = useState([]);
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName"); // 👈 naam uit localStorage

  useEffect(() => {
    async function fetchEntries() {
      try {
        const res = await fetch(`http://localhost:5000/api/entries?userId=${userId}`);
        const data = await res.json();
        setEntries(data);
      } catch (err) {
        console.error("Fout bij ophalen entries:", err);
      }
    }

    if (userId) {
      fetchEntries();
    }
  }, [userId]);

  if (!userId) {
    return <p>Log eerst in om je dashboard te bekijken.</p>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>📊 Hey {userName}, dit is een overzicht van je hond 🐶</h2>
      
      {entries.length === 0 ? (
        <p>Je hebt nog geen ingevulde logs.</p>
      ) : (
        entries.map((entry, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "15px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <h4>📅 {entry.date}</h4>
            <p>🍽️ Voedselinname: <strong>{entry.food}</strong></p>
            <p>💧 Water: <strong>{entry.water} ml</strong></p>
            <p>💩 Ontlasting: <strong>{entry.poop}</strong></p>
            <p>🤮 Overgegeven: <strong>{entry.vomit ? "Ja" : "Nee"}</strong></p>
            <p>💊 Medicatie: <strong>{entry.meds ? "Ja" : "Nee"}</strong></p>
            <p>🐾 Gedrag: <strong>{entry.behavior}</strong></p>
            <p>🧠 Gevoel: <strong>{entry.emotion}</strong></p>

            <p style={{ marginTop: "10px", fontStyle: "italic" }}>
              Samenvatting: Je hond voelde zich <strong>{entry.emotion}</strong>, 
              at <strong>{entry.food}</strong>, en was <strong>{entry.behavior}</strong>.
            </p>
          </div>
        ))
      )}
    </div>
  );
}
