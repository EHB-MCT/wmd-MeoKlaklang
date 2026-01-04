export default function ChartCard({ title, subtitle, children }) {
  return (
    <div className="analytics-chart-card">
      <div className="analytics-chart-header">
        <h3>{title}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="analytics-chart-body">{children}</div>
    </div>
  );
}
