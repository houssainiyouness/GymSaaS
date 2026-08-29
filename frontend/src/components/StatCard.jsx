function StatCard({ label, value, hint }) {
  return (
    <div className="card">
      <div className="muted">{label}</div>
      <div style={{ fontSize: 32, fontWeight: 900, marginTop: 8 }}>{value}</div>
      {hint && <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>{hint}</div>}
    </div>
  );
}

export default StatCard;
