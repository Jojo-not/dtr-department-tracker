import {
  CalendarDays,
  Clock3,
  ClipboardCheck,
  FileDown,
  FileText,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import RichTextEditor from '../components/RichTextEditor'
import {
  createAccomplishment,
  removeAccomplishment,
  subscribeMyAccomplishments,
  updateAccomplishment,
} from '../services/accomplishments'
import { subscribeMyAttendance } from '../services/attendance'
import { attendanceTimes, formatTime, getLocalDateKey, humanDuration, attendanceMinutes } from '../utils/date'
import { downloadAccomplishmentReportDocx } from '../utils/accomplishmentDocx'
import { plainTextToHtml, sanitizeRichHtml } from '../utils/richText'

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(monthKey) {
  if (!monthKey) return ''
  const [year, month] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

function readableDate(dateKey) {
  if (!dateKey) return '—'
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

const emptyForm = () => ({
  dateKey: getLocalDateKey(),
  accomplishment: '',
  accomplishmentHtml: '',
  remarks: '',
})

export default function Accomplishments() {
  const { user, profile } = useAuth()
  const [records, setRecords] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [month, setMonth] = useState(getMonthKey())
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  useEffect(() => {
    if (!user?.uid) return undefined
    return subscribeMyAccomplishments(
      user.uid,
      setRecords,
      error => {
        console.error('Accomplishment subscription failed:', error)
        setMessageType('error')
        setMessage(
          error?.code === 'permission-denied'
            ? 'Firestore permission denied. Publish the latest firestore.rules to enable Accomplishment Reports.'
            : 'Unable to load accomplishment reports. Please refresh the page.'
        )
      },
    )
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return undefined
    return subscribeMyAttendance(
      user.uid,
      setAttendanceRecords,
      error => {
        console.error('Attendance subscription for accomplishments failed:', error)
        setMessageType('error')
        setMessage(
          error?.code === 'permission-denied'
            ? 'Firestore permission denied while loading your DTR times. Publish the latest firestore.rules.'
            : 'Unable to load your DTR times for the accomplishment report.'
        )
      },
    )
  }, [user?.uid])

  const attendanceByDate = useMemo(
    () => Object.fromEntries(attendanceRecords.map(record => [record.dateKey, record])),
    [attendanceRecords],
  )

  const monthRecords = useMemo(
    () => records.filter(record => record.dateKey?.startsWith(month)),
    [records, month],
  )

  const reportRecords = useMemo(
    () => [...monthRecords].sort((a, b) => {
      if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey)
      const aTime = a.createdAt?.toMillis?.() || 0
      const bTime = b.createdAt?.toMillis?.() || 0
      return aTime - bTime
    }),
    [monthRecords],
  )

  function startCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(true)
    setMessage('')
  }

  function startEdit(record) {
    setEditingId(record.id)
    setForm({
      dateKey: record.dateKey || getLocalDateKey(),
      accomplishment: record.accomplishment || '',
      accomplishmentHtml: record.accomplishmentHtml || plainTextToHtml(record.accomplishment || ''),
      remarks: record.remarks || '',
    })
    setShowForm(true)
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelForm() {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(false)
  }

  async function submit(event) {
    event.preventDefault()
    setMessage('')
    if (!form.accomplishment.trim()) {
      setMessageType('error')
      setMessage('Please enter your accomplishment for the selected date.')
      return
    }
    if (form.accomplishment.length > 5000) {
      setMessageType('error')
      setMessage('The accomplishment is too long. Please keep it within 5,000 characters.')
      return
    }
    if ((form.accomplishmentHtml || '').length > 15000) {
      setMessageType('error')
      setMessage('The formatted accomplishment is too large. Please simplify the formatting and try again.')
      return
    }

    setBusy(true)
    try {
      if (editingId) {
        await updateAccomplishment(editingId, form)
        setMessage('Accomplishment updated successfully.')
      } else {
        await createAccomplishment(user, profile, form)
        setMessage('Accomplishment added successfully.')
      }
      setMessageType('success')
      setMonth(form.dateKey.slice(0, 7))
      cancelForm()
    } catch (error) {
      console.error('Accomplishment write failed:', error)
      setMessageType('error')
      setMessage(
        error?.code === 'permission-denied'
          ? 'Firestore permission denied. Publish the latest firestore.rules, then try again.'
          : error?.message || 'Unable to save this accomplishment.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function deleteRecord(record) {
    const accepted = window.confirm(`Delete the accomplishment dated ${readableDate(record.dateKey)}?`)
    if (!accepted) return
    setMessage('')
    try {
      await removeAccomplishment(record.id)
      setMessageType('success')
      setMessage('Accomplishment deleted successfully.')
      if (editingId === record.id) cancelForm()
    } catch (error) {
      console.error('Accomplishment delete failed:', error)
      setMessageType('error')
      setMessage(
        error?.code === 'permission-denied'
          ? 'Firestore permission denied. Publish the latest firestore.rules, then try again.'
          : 'Unable to delete this accomplishment.'
      )
    }
  }

  async function downloadMonthlyReport() {
    if (monthRecords.length === 0) {
      setMessageType('error')
      setMessage(`There are no accomplishments to download for ${monthLabel(month)}.`)
      return
    }

    setMessage('')
    setDownloading(true)
    try {
      await downloadAccomplishmentReportDocx({
        profile,
        records: reportRecords,
        attendanceByDate,
        monthLabel: monthLabel(month),
      })
      setMessageType('success')
      setMessage(`Microsoft Word report downloaded for ${monthLabel(month)}.`)
    } catch (error) {
      console.error('Word report generation failed:', error)
      setMessageType('error')
      setMessage('Unable to generate the Word report. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  function timeLogFor(dateKey) {
    const attendance = attendanceByDate[dateKey]
    const times = attendanceTimes(attendance)
    return {
      attendance,
      ...times,
      total: attendance ? humanDuration(attendanceMinutes(attendance)) : '—',
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><ClipboardCheck size={16} /> Daily work record</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Accomplishment Report</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={17} /> Add Accomplishment
          </button>
          <button
            type="button"
            onClick={downloadMonthlyReport}
            disabled={downloading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileDown size={17} /> {downloading ? 'Creating Word file...' : 'Download Word Report'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${messageType === 'error' ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">{editingId ? 'Edit entry' : 'New entry'}</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">{editingId ? 'Update accomplishment' : 'Add daily accomplishment'}</h2>
            </div>
            <button type="button" onClick={cancelForm} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close form"><X size={19} /></button>
          </div>

          <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[220px_1fr]">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Date</span>
              <div className="relative">
                <CalendarDays size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="date"
                  value={form.dateKey}
                  onChange={event => setForm(current => ({ ...current, dateKey: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>
            </label>

            <div className="block">
              <div className="mb-2 flex items-end justify-between gap-3">
                <span className="block text-sm font-medium text-slate-700">Accomplishment</span>
                <span className={`text-xs ${form.accomplishment.length > 5000 ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>{form.accomplishment.length}/5000 characters</span>
              </div>
              <RichTextEditor
                value={form.accomplishmentHtml}
                disabled={busy}
                onChange={({ html, text }) => setForm(current => ({
                  ...current,
                  accomplishmentHtml: html,
                  accomplishment: text,
                }))}
              />
              <p className="mt-2 text-xs leading-5 text-slate-400">Use the toolbar for bold, italic, underline, bullets, numbering, paragraph styles, and text alignment. This formatting is included in the downloaded Word report.</p>
            </div>

            <label className="block lg:col-start-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Remarks <span className="font-normal text-slate-400">(optional)</span></span>
              <input
                type="text"
                maxLength={500}
                value={form.remarks}
                onChange={event => setForm(current => ({ ...current, remarks: event.target.value }))}
                placeholder="Optional note, status, reference, or output"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </label>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end lg:col-start-2">
              <button type="button" onClick={cancelForm} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancel</button>
              <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                <Save size={17} /> {busy ? 'Saving...' : editingId ? 'Save Changes' : 'Save Accomplishment'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-950">Monthly entries</h2>
            <p className="mt-1 text-xs text-slate-500">{monthRecords.length} accomplishment{monthRecords.length === 1 ? '' : 's'} for {monthLabel(month)}</p>
          </div>
          <label className="relative block">
            <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="month"
              value={month}
              onChange={event => setMonth(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 sm:w-48"
              aria-label="Filter accomplishment reports by month"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-44 px-6 py-4">Date</th>
                <th className="w-64 px-6 py-4">DTR Time Log</th>
                <th className="px-6 py-4">Accomplishment</th>
                <th className="w-32 px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthRecords.map(record => {
                const log = timeLogFor(record.dateKey)
                return (
                  <tr key={record.id} className="align-top transition hover:bg-slate-50/70">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{readableDate(record.dateKey)}</td>
                    <td className="px-6 py-4">
                      {log.attendance ? (
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div><span className="font-semibold text-slate-800">Time In:</span> {formatTime(log.timeIn1)}</div>
                          <div><span className="font-semibold text-slate-800">Time Out:</span> {formatTime(log.timeOut2)}</div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400"><Clock3 size={14} /> No DTR record</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm leading-6 text-slate-700">
                      <div
                        className="rich-accomplishment-preview"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeRichHtml(record.accomplishmentHtml || plainTextToHtml(record.accomplishment || '')),
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => startEdit(record)} title="Edit" className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"><Pencil size={16} /></button>
                        <button type="button" onClick={() => deleteRecord(record)} title="Delete" className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {monthRecords.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500"><FileText size={22} /></div>
            <h3 className="mt-4 font-semibold text-slate-900">No accomplishments for this month</h3>
            <p className="mt-1 text-sm text-slate-500">Add your daily accomplishments to build the monthly report.</p>
            <button type="button" onClick={startCreate} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} /> Add Accomplishment</button>
          </div>
        )}
      </section>

    </div>
  )
}
