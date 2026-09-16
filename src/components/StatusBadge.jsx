export default function StatusBadge({ status }) {
  const styles = status === 'IN'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'
    : status === 'OUT'
      ? 'bg-slate-100 text-slate-700 ring-slate-500/15'
      : 'bg-amber-50 text-amber-700 ring-amber-600/15'
  const label = status === 'IN' ? 'Timed In' : status === 'OUT' ? 'Timed Out' : 'Not yet in'
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles}`}>
    <span className={`size-1.5 rounded-full ${status === 'IN' ? 'bg-emerald-500' : status === 'OUT' ? 'bg-slate-400' : 'bg-amber-500'}`} />
    {label}
  </span>
}
