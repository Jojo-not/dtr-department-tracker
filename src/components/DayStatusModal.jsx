import { CalendarOff, Plane } from 'lucide-react'
import { useEffect } from 'react'

export default function DayStatusModal({ status, busy = false, onCancel, onConfirm }) {
  const isLeave = status === 'LEAVE'
  const label = isLeave ? 'On Leave' : 'On Travel'
  const Icon = isLeave ? CalendarOff : Plane

  useEffect(() => {
    if (!status) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onCancel?.()
    }

    const previousOverflow = document.body.style.overflow
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [status, busy, onCancel])

  if (!status) return null

  const tone = isLeave
    ? {
        icon: 'bg-violet-50 text-violet-600',
        button: 'bg-violet-600 hover:bg-violet-700 focus-visible:outline-violet-600',
      }
    : {
        icon: 'bg-sky-50 text-sky-600',
        button: 'bg-sky-600 hover:bg-sky-700 focus-visible:outline-sky-600',
      }

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel?.()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-status-modal-title"
        aria-describedby="day-status-modal-description"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20"
      >
        <div className="flex items-start gap-4">
          <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone.icon}`}>
            <Icon size={20} strokeWidth={2.2} />
          </div>

          <div className="min-w-0 pt-0.5">
            <h2 id="day-status-modal-title" className="text-lg font-semibold tracking-tight text-slate-950">
              Set status to {label}?
            </h2>
            <p id="day-status-modal-description" className="mt-1.5 text-sm leading-6 text-slate-500">
              Attendance will be disabled for today.
            </p>
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex min-w-24 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55 ${tone.button}`}
          >
            {busy && <span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />}
            {busy ? 'Please wait…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
