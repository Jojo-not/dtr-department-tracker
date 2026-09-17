export default function StatusBadge({ status }) {
  const isIn = status === 'IN'
  const isBreak = status === 'BREAK'
  const isOut = status === 'OUT'

  const styles = isIn
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'
    : isBreak
      ? 'bg-blue-50 text-blue-700 ring-blue-600/15'
      : isOut
        ? 'bg-slate-100 text-slate-700 ring-slate-500/15'
        : 'bg-amber-50 text-amber-700 ring-amber-600/15'

  const label = isIn ? 'Timed In' : isBreak ? 'Lunch Break' : isOut ? 'Completed' : 'Not yet in'
  const dot = isIn ? 'bg-emerald-500' : isBreak ? 'bg-blue-500' : isOut ? 'bg-slate-400' : 'bg-amber-500'

  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles}`}>
    <span className={`size-1.5 rounded-full ${dot}`} />
    {label}
  </span>
}
