export default function StatusBadge({ status }) {
  const config = {
    IN: ['Timed In', 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', 'bg-emerald-500'],
    BREAK: ['Lunch Break', 'bg-blue-50 text-blue-700 ring-blue-600/15', 'bg-blue-500'],
    OUT: ['Completed', 'bg-slate-100 text-slate-700 ring-slate-500/15', 'bg-slate-400'],
    LEAVE: ['On Leave', 'bg-violet-50 text-violet-700 ring-violet-600/15', 'bg-violet-500'],
    TRAVEL: ['On Travel', 'bg-sky-50 text-sky-700 ring-sky-600/15', 'bg-sky-500'],
  }

  const [label, styles, dot] = config[status] || ['Not yet in', 'bg-amber-50 text-amber-700 ring-amber-600/15', 'bg-amber-500']

  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles}`}>
    <span className={`size-1.5 rounded-full ${dot}`} />
    {label}
  </span>
}
