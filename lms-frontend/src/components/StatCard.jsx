function StatCard({ title, value, hint }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-sm text-slate-300">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

export default StatCard;

