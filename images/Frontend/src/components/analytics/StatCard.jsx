export default function StatCard({ icon, title, value, sub }) {
  return (
    <div className="analytics-stat-card">
      <div className="analytics-stat-icon">{icon}</div>
      <div className="analytics-stat-right">
        <div className="analytics-stat-title">{title}</div>
        <div className="analytics-stat-value">{value}</div>
        {sub ? <div className="analytics-stat-sub">{sub}</div> : null}
      </div>
    </div>
  );
}
