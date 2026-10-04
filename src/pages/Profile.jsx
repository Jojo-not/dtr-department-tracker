import { useState } from 'react'
import { BadgeCheck, BriefcaseBusiness, Building2, Mail, Save, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Profile() {
  const { user, profile, updateMyProfile } = useAuth()
  const [form, setForm] = useState({
    name: profile?.name || '',
    employeeId: profile?.employeeId || '',
    position: profile?.position || '',
  })
  const [pendingChanges, setPendingChanges] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const fields = [
    { key: 'name', label: 'Full name', Icon: UserRound, autoComplete: 'name', maxLength: 100 },
    { key: 'employeeId', label: 'Employee ID', Icon: BadgeCheck, autoComplete: 'off', maxLength: 50 },
    { key: 'position', label: 'Position', Icon: BriefcaseBusiness, autoComplete: 'organization-title', maxLength: 100 },
  ]

  function setField(key, value) {
    setForm(current => ({ ...current, [key]: value }))
    setError('')
    setMessage('')
  }

  function requestSave(event) {
    event.preventDefault()
    const changes = {
      name: form.name.trim(),
      employeeId: form.employeeId.trim(),
      position: form.position.trim(),
    }
    if (!changes.name || !changes.employeeId || !changes.position) {
      setError('Please complete your name, employee ID, and position.')
      return
    }
    const changed = Object.keys(changes).some(key => changes[key] !== (profile?.[key] || ''))
    if (!changed) {
      setMessage('Your profile is already up to date.')
      setError('')
      return
    }
    setError('')
    setMessage('')
    setPendingChanges(changes)
  }

  async function confirmSave() {
    if (!pendingChanges || busy) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await updateMyProfile(pendingChanges)
      setForm(pendingChanges)
      setPendingChanges(null)
      setMessage('Your profile information was updated successfully.')
    } catch (saveError) {
      console.error('Profile update failed:', saveError)
      setError(saveError?.code === 'permission-denied'
        ? 'Firestore denied this update. Publish the latest firestore.rules and try again.'
        : saveError?.message || 'Unable to update your profile. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ConfirmDialog
        open={pendingChanges !== null}
        title="Save profile changes?"
        description="Your updated name, employee ID, and position will be saved to your account."
        confirmLabel="Save changes"
        cancelLabel="Review changes"
        variant="warning"
        busy={busy}
        onCancel={() => !busy && setPendingChanges(null)}
        onConfirm={confirmSave}
      />

      <div className="mx-auto max-w-5xl space-y-7">
        <header className="relative isolate overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl shadow-slate-950/10 sm:px-8 sm:py-9">
          <div aria-hidden="true" className="absolute -right-12 -top-28 -z-10 size-80 rounded-full border-[36px] border-white/[0.04]" />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.08] text-2xl font-semibold text-blue-200">
              {(profile?.name || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-semibold tracking-wide text-slate-200">
                <UserRound size={14} /> YOUR ACCOUNT
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Profile settings</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Keep your employee information accurate and up to date.
              </p>
            </div>
          </div>
        </header>

        {(error || message) && (
          <div
            role={error ? 'alert' : 'status'}
            className={`rounded-2xl border px-4 py-3.5 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}
          >
            {error || message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,.8fr)]">
          <form onSubmit={requestSave} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">Personal information</h2>
              <p className="mt-1 text-sm text-slate-500">Edit the information shown in your department workspace.</p>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {fields.map(({ key, label, Icon, autoComplete, maxLength }) => (
                <label key={key} className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
                  <span className="relative block">
                    <Icon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="text"
                      value={form[key]}
                      maxLength={maxLength}
                      autoComplete={autoComplete}
                      onChange={event => setField(key, event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />
                  </span>
                </label>
              ))}

              <div className="border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  <Save size={17} /> Review and save
                </button>
              </div>
            </div>
          </form>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <ShieldCheck size={19} />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-950">Account details</h2>
                  <p className="text-xs text-slate-500">Managed by your organization</p>
                </div>
              </div>
              <dl className="space-y-4">
                <div>
                  <dt className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Mail size={14} /> Email address
                  </dt>
                  <dd className="break-all text-sm font-medium text-slate-800">{profile?.email || user?.email || '—'}</dd>
                </div>
                <div>
                  <dt className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Building2 size={14} /> Department
                  </dt>
                  <dd className="text-sm font-medium text-slate-800">{profile?.department || '—'}</dd>
                </div>
              </dl>
            </section>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <p className="text-sm font-semibold text-blue-950">Need to change your email or department?</p>
              <p className="mt-1.5 text-sm leading-6 text-blue-800">
                These account details are protected. Contact your department administrator for assistance.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
