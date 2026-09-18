import { AlertTriangle, Trash2 } from 'lucide-react'
import { useEffect } from 'react'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busy = false,
  variant = 'danger',
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    if (!open) return undefined

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
  }, [open, busy, onCancel])

  if (!open) return null

  const danger = variant === 'danger'
  const Icon = danger ? Trash2 : AlertTriangle
  const tone = danger
    ? {
        icon: 'bg-rose-50 text-rose-600',
        button: 'bg-rose-600 hover:bg-rose-700 focus-visible:outline-rose-600',
      }
    : {
        icon: 'bg-amber-50 text-amber-600',
        button: 'bg-slate-900 hover:bg-slate-800 focus-visible:outline-slate-900',
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
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? 'confirm-dialog-description' : undefined}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20"
      >
        <div className="flex items-start gap-4">
          <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone.icon}`}>
            <Icon size={20} strokeWidth={2.2} />
          </div>

          <div className="min-w-0 pt-0.5">
            <h2 id="confirm-dialog-title" className="text-lg font-semibold tracking-tight text-slate-950">
              {title}
            </h2>
            {description && (
              <p id="confirm-dialog-description" className="mt-1.5 text-sm leading-6 text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex min-w-24 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55 ${tone.button}`}
          >
            {busy && <span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />}
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
