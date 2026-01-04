// src/components/DogOverviewCard.jsx
export default function DogOverviewCard({ dog, entries, onLog }) {
  const safeNum = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
  const total = entries.length;

  const avgSleep = total
    ? (entries.reduce((s, e) => s + safeNum(e.sleepHours), 0) / total).toFixed(1)
    : "0";

  const avgWalks = total
    ? (entries.reduce((s, e) => s + safeNum(e.walks), 0) / total).toFixed(1)
    : "0";

  const stressDays = entries.filter(e => e.stressSignals).length;
  const healthScore = total
    ? Math.max(0, 100 - stressDays * 10)
    : 100;

  return (
    <div className="dog-overview-card">
      <div className="dog-header">
        <h3>🐕 {dog.name}</h3>
        <span>{dog.breed}</span>
      </div>

      <div className="dog-stats">
        <div><strong>{total}</strong><span>Logs</span></div>
        <div><strong>{avgSleep}u</strong><span>Slaap</span></div>
        <div><strong>{avgWalks}</strong><span>Wandelingen</span></div>
        <div>
          <strong>{healthScore}%</strong>
          <span>Gezondheid</span>
        </div>
      </div>

      <button className="log-btn" onClick={onLog}>
        📓 Log vandaag
      </button>
    </div>
  );
}
