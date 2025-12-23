import { useEffect, useState } from "react";

export default function Analyse() {
  const [duration, setDuration] = useState(0);
  const [visits, setVisits] = useState(0);

  useEffect(() => {
    const start = Date.now();

    // Simuleer bezoek-teller (client-side)
    const visitCount = parseInt(localStorage.getItem("visitCount") || "0", 10) + 1;
    localStorage.setItem("visitCount", visitCount);
    setVisits(visitCount);

    // Bereken tijd op pagina
    const interval = setInterval(() => {
      const now = Date.now();
      setDuration(Math.floor((now - start) / 1000)); // seconden
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>🧠 Analyse van je gebruik</h2>

      <p>📈 Aantal bezoeken: <strong>{visits}</strong></p>
      <p>⏱️ Tijd op deze pagina: <strong>{duration}</strong> seconden</p>

      <p style={{ marginTop: "20px", fontStyle: "italic" }}>
        Hier kan je straks nog login history, AI-feedback en grafieken tonen!
      </p>
    </div>
  );
}
