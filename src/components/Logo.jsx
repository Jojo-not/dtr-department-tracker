import { Clock3 } from 'lucide-react'

export default function Logo({ compact = false, inverse = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`grid size-10 place-items-center rounded-2xl shadow-lg ${inverse ? 'bg-white text-slate-950 shadow-black/20' : 'bg-slate-950 text-white shadow-slate-900/15'}` }>
        <Clock3 size={21} strokeWidth={2.3} />
      </div>
      {!compact && <div>
        <div className={`font-semibold tracking-tight ${inverse ? 'text-white' : 'text-slate-950'}`}>DTR Workspace</div>
        <div className={`text-xs ${inverse ? 'text-slate-400' : 'text-slate-500'}`}>Department Time Tracker</div>
      </div>}
    </div>
  )
}
