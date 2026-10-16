import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  Pencil,
  Search,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { subscribeDepartmentAccomplishments } from '../services/accomplishments'
import { subscribeDepartmentAttendance, subscribeDepartmentUsers, updateAttendanceAsAdmin } from '../services/attendance'
import { attendanceTimes, formatTime, getLocalDateKey, humanDuration, attendanceMinutes } from '../utils/date'
import StatusBadge from '../components/StatusBadge'

const timeFields = [
  ['timeIn1', 'AM Time In'],
  ['timeOut1', 'Lunch Time Out'],
  ['timeIn2', 'PM Time In'],
  ['timeOut2', 'Final Time Out'],
]

const attendancePageSize = 5
const employeePageSize = 9
const accomplishmentPageSize = 4

function toLocalDateTimeInput(value) {
  if (!value) return ''
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function attendanceForm(record) {
  const times = attendanceTimes(record)
  return Object.fromEntries(timeFields.map(([field]) => [field, toLocalDateTimeInput(times[field])]))
}

function csvCell(value) {
  const text = String(value ?? '')
  const safeText = /^[\s]*[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return `"${safeText.replaceAll('"', '""')}"`
}

function showSubscriptionError(error, source) {
  console.error(`${source} subscription failed:`, error)
  return error?.code === 'permission-denied'
    ? 'Firestore permission denied. Publish the latest firestore.rules and verify this account’s admin role.'
    : `Unable to load ${source.toLowerCase()}. Please refresh the page.`
}

export default function Admin() {
  const { user, profile } = useAuth()
  const [people, setPeople] = useState([])
  const [attendance, setAttendance] = useState([])
  const [accomplishments, setAccomplishments] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [attendancePage, setAttendancePage] = useState(1)
  const [employeePage, setEmployeePage] = useState(1)
  const [accomplishmentPage, setAccomplishmentPage] = useState(1)
  const [month, setMonth] = useState('')
  const [search, setSearch] = useState('')
  const [editingRecord, setEditingRecord] = useState(null)
  const [form, setForm] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!profile?.department) return undefined
    return subscribeDepartmentUsers(
      profile.department,
      setPeople,
      subscriptionError => setError(showSubscriptionError(subscriptionError, 'Department users')),
    )
  }, [profile?.department])

  useEffect(() => {
    if (!profile?.department) return undefined
    return subscribeDepartmentAttendance(
      profile.department,
      setAttendance,
      subscriptionError => setError(showSubscriptionError(subscriptionError, 'Attendance')),
    )
  }, [profile?.department])

  useEffect(() => {
    if (!profile?.department) return undefined
    return subscribeDepartmentAccomplishments(
      profile.department,
      setAccomplishments,
      subscriptionError => setError(showSubscriptionError(subscriptionError, 'Accomplishments')),
    )
  }, [profile?.department])

  useEffect(() => {
    if (!editingRecord) return undefined
    const handleKeyDown = event => {
      if (event.key === 'Escape' && !busy) setEditingRecord(null)
    }
    const previousOverflow = document.body.style.overflow
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [editingRecord, busy])

  const filteredAttendance = useMemo(() => attendance.filter(record => {
    const matchesDate = !selectedDate || record.dateKey === selectedDate
    const matchesSearch = `${record.name || ''} ${record.employeeId || ''} ${record.email || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
    return matchesDate && matchesSearch
  }), [attendance, search, selectedDate])

  const attendancePageCount = Math.ceil(filteredAttendance.length / attendancePageSize)
  const currentAttendancePage = Math.min(attendancePage, Math.max(1, attendancePageCount))
  const paginatedAttendance = filteredAttendance.slice(
    (currentAttendancePage - 1) * attendancePageSize,
    currentAttendancePage * attendancePageSize,
  )

  useEffect(() => {
    setAttendancePage(1)
  }, [search, selectedDate])

  useEffect(() => {
    if (attendancePage > attendancePageCount) {
      setAttendancePage(Math.max(1, attendancePageCount))
    }
  }, [attendancePage, attendancePageCount])

  const filteredAccomplishments = useMemo(() => accomplishments.filter(record => {
    const matchesEmployee = selectedEmployee === 'all' || record.uid === selectedEmployee
    const matchesMonth = !month || record.dateKey?.startsWith(month)
    return matchesEmployee && matchesMonth
  }), [accomplishments, month, selectedEmployee])

  const accomplishmentPageCount = Math.ceil(filteredAccomplishments.length / accomplishmentPageSize)
  const currentAccomplishmentPage = Math.min(accomplishmentPage, Math.max(1, accomplishmentPageCount))
  const paginatedAccomplishments = filteredAccomplishments.slice(
    (currentAccomplishmentPage - 1) * accomplishmentPageSize,
    currentAccomplishmentPage * accomplishmentPageSize,
  )

  useEffect(() => {
    setAccomplishmentPage(1)
  }, [month, selectedEmployee])

  useEffect(() => {
    if (accomplishmentPage > accomplishmentPageCount) {
      setAccomplishmentPage(Math.max(1, accomplishmentPageCount))
    }
  }, [accomplishmentPage, accomplishmentPageCount])

  const orderedPeople = useMemo(
    () => [...people].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [people],
  )
  const employeePageCount = Math.ceil(orderedPeople.length / employeePageSize)
  const currentEmployeePage = Math.min(employeePage, Math.max(1, employeePageCount))
  const paginatedPeople = orderedPeople.slice(
    (currentEmployeePage - 1) * employeePageSize,
    currentEmployeePage * employeePageSize,
  )
  const selectedPerson = people.find(person => person.id === selectedEmployee)
  const reportCountForPerson = uid => accomplishments.filter(record =>
    record.uid === uid && (!month || record.dateKey?.startsWith(month))).length

  useEffect(() => {
    if (employeePage > employeePageCount) {
      setEmployeePage(Math.max(1, employeePageCount))
    }
  }, [employeePage, employeePageCount])

  const activeCount = filteredAttendance.filter(record => ['IN', 'BREAK'].includes(record.status)).length
  const completedCount = filteredAttendance.filter(record => record.status === 'OUT').length

  function startEditing(record) {
    if (!record || ['LEAVE', 'TRAVEL'].includes(record.status)) return
    setEditingRecord(record)
    setForm(attendanceForm(record))
    setError('')
    setMessage('')
  }

  async function saveAttendance(event) {
    event.preventDefault()
    if (!editingRecord || busy) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await updateAttendanceAsAdmin(user, editingRecord, form)
      setMessage(`Time log updated for ${editingRecord.name || 'employee'} on ${editingRecord.dateKey}.`)
      setEditingRecord(null)
    } catch (saveError) {
      console.error('Admin attendance update failed:', saveError)
      setError(saveError?.code === 'permission-denied'
        ? 'Firestore denied this update. Publish the latest firestore.rules and verify this account’s admin role.'
        : saveError?.message || 'Unable to update this time log. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function exportAllAttendance() {
    if (attendance.length === 0) {
      setError('There are no department time logs to export yet.')
      setMessage('')
      return
    }

    const headers = [
      'Date',
      'Employee',
      'Employee ID',
      'Email',
      'Status',
      ...timeFields.map(([, label]) => label),
      'Total Worked',
    ]
    const rows = [...attendance]
      .sort((a, b) => {
        if (a.dateKey !== b.dateKey) return (a.dateKey || '').localeCompare(b.dateKey || '')
        return (a.name || '').localeCompare(b.name || '')
      })
      .map(record => {
        const times = attendanceTimes(record)
        const away = ['LEAVE', 'TRAVEL'].includes(record.status)
        return [
          record.dateKey,
          record.name,
          record.employeeId,
          record.email,
          record.status,
          ...timeFields.map(([field]) => away || !times[field] ? '' : formatTime(times[field])),
          away ? '' : humanDuration(attendanceMinutes(record)),
        ].map(csvCell)
      })
    const csv = [headers.map(csvCell), ...rows].map(row => row.join(',')).join('\r\n')
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const departmentName = String(profile?.department || 'department')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    link.href = url
    link.download = `${departmentName || 'department'}-time-logs.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setError('')
    setMessage(`Exported ${attendance.length} department time ${attendance.length === 1 ? 'log' : 'logs'}.`)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="relative isolate overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl shadow-slate-950/10 sm:px-8 sm:py-9">
        <div aria-hidden="true" className="absolute -right-14 -top-28 -z-10 size-80 rounded-full border-[36px] border-white/[0.04]" />
        <div aria-hidden="true" className="absolute -bottom-32 right-40 -z-10 size-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-200">
              <ShieldCheck size={15} className="text-blue-300" />
              {profile?.department || 'Department'} · ADMIN WORKSPACE
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Department overview</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Manage attendance records and review your team’s daily accomplishments.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
            <div className="grid size-10 place-items-center rounded-xl bg-white/10 text-blue-200">
              <CalendarDays size={19} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400">Attendance history</div>
              <div className="mt-0.5 text-sm font-semibold text-white">{selectedDate || 'All dates'}</div>
            </div>
          </div>
        </div>
      </header>

      <section aria-label="Department summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Department team', value: people.length, detail: 'Registered employees', Icon: UsersRound, tone: 'bg-blue-50 text-blue-700' },
          { label: 'Active logs', value: activeCount, detail: 'In the selected date range', Icon: Clock3, tone: 'bg-emerald-50 text-emerald-700' },
          { label: 'Completed logs', value: completedCount, detail: 'In the selected date range', Icon: CheckCircle2, tone: 'bg-violet-50 text-violet-700' },
          { label: 'Accomplishments', value: filteredAccomplishments.length, detail: 'Matching current filters', Icon: FileText, tone: 'bg-amber-50 text-amber-700' },
        ].map(({ label, value, detail, Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.025]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
                <p className="mt-1 text-xs text-slate-400">{detail}</p>
              </div>
              <div className={`grid size-10 place-items-center rounded-xl ${tone}`}>
                <Icon size={19} />
              </div>
            </div>
          </div>
        ))}
      </section>

      {(error || message) && (
        <div role={error ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm shadow-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {error ? <ShieldCheck size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
          {error || message}
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.025]">
        <div className="flex flex-col gap-5 border-b border-slate-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
              <Clock3 size={19} />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">Department time logs</h2>
              <p className="mt-1 text-sm text-slate-500">Review and edit attendance history for every department employee.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block">
                <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type="date"
                  value={selectedDate}
                  max={getLocalDateKey()}
                  onChange={event => setSelectedDate(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 sm:w-48"
                  aria-label="Filter attendance by date"
                />
              </label>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <X size={15} /> All dates
                </button>
              )}
              <label className="relative block sm:w-64">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search employee..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  aria-label="Search attendance logs by employee"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={exportAllAttendance}
              disabled={attendance.length === 0}
              title="Download every department time log, including records outside the current filters"
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:self-end"
            >
              <Download size={16} /> Export all logs
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-5 py-4">Status</th>
                  {timeFields.map(([, label]) => <th key={label} className="px-5 py-4">{label}</th>)}
                  <th className="px-5 py-4">Worked</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAttendance.map(record => {
                  const person = people.find(item => item.id === record.uid)
                  const times = attendanceTimes(record)
                  const away = ['LEAVE', 'TRAVEL'].includes(record.status)
                  return (
                    <tr key={record.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium tabular-nums text-slate-700">{record.dateKey}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{record.name || person?.name || 'Employee'}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{record.employeeId || person?.employeeId || record.email || person?.email}</div>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={record.status} /></td>
                      {timeFields.map(([field]) => (
                        <td key={field} className="px-5 py-4 text-sm font-medium text-slate-700">
                          {away ? '—' : formatTime(times[field])}
                        </td>
                      ))}
                      <td className="px-5 py-4 text-sm">
                        {!away ? <span className="font-semibold tabular-nums text-slate-700">{humanDuration(attendanceMinutes(record))}</span> : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!away ? (
                          <button
                            type="button"
                            onClick={() => startEditing(record)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                        ) : <span className="text-xs text-slate-400">{away ? 'Away' : 'No log'}</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredAttendance.length === 0 && (
              <div className="p-12 text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                  <Clock3 size={21} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-700">No time logs found</p>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedDate ? `No attendance records for ${selectedDate}.` : 'No attendance records match your search.'}
                </p>
              </div>
            )}
        </div>
        {attendancePageCount > 1 && (
          <nav
            aria-label="Department time log pages"
            className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          >
            <p className="text-sm text-slate-500">
              Showing {(currentAttendancePage - 1) * attendancePageSize + 1}–
              {Math.min(currentAttendancePage * attendancePageSize, filteredAttendance.length)} of {filteredAttendance.length} logs
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAttendancePage(currentAttendancePage - 1)}
                disabled={currentAttendancePage === 1}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span aria-live="polite" className="px-1 text-sm font-medium tabular-nums text-slate-600">
                Page {currentAttendancePage} of {attendancePageCount}
              </span>
              <button
                type="button"
                onClick={() => setAttendancePage(currentAttendancePage + 1)}
                disabled={currentAttendancePage === attendancePageCount}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </nav>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.025]">
        <div className="flex flex-col gap-5 border-b border-slate-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
              <ClipboardCheck size={19} />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">Department accomplishments</h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedPerson
                  ? `Monthly reports for ${selectedPerson.name}.`
                  : 'Choose an employee to view their reports for the selected month.'}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label>
              <span className="sr-only">Filter accomplishments by month</span>
              <input
                type="month"
                value={month}
                onChange={event => setMonth(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 sm:w-48"
              />
            </label>
            {month && (
              <button
                type="button"
                onClick={() => setMonth('')}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <X size={15} /> All dates
              </button>
            )}
          </div>
        </div>

        {selectedEmployee === 'all' ? (
          <div className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">Department employees</p>
              <span className="text-xs text-slate-500">
                {month ? `Reports for ${month}` : 'Reports for all dates'}
              </span>
            </div>
            {orderedPeople.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedPeople.map(person => {
                  const reportCount = reportCountForPerson(person.id)
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => setSelectedEmployee(person.id)}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700 transition group-hover:bg-blue-100 group-hover:text-blue-700">
                        {(person.name || 'E').slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">{person.name || 'Employee'}</span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">{person.employeeId || person.email}</span>
                        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${reportCount ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                          {reportCount} {reportCount === 1 ? 'report' : 'reports'}
                        </span>
                      </span>
                      <ChevronRight size={18} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
                No department employees found.
              </div>
            )}
            {employeePageCount > 1 && (
              <nav
                aria-label="Department employee pages"
                className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm text-slate-500">
                  Showing {(currentEmployeePage - 1) * employeePageSize + 1}–
                  {Math.min(currentEmployeePage * employeePageSize, orderedPeople.length)} of {orderedPeople.length} employees
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEmployeePage(currentEmployeePage - 1)}
                    disabled={currentEmployeePage === 1}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span aria-live="polite" className="px-1 text-sm font-medium tabular-nums text-slate-600">
                    Page {currentEmployeePage} of {employeePageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEmployeePage(currentEmployeePage + 1)}
                    disabled={currentEmployeePage === employeePageCount}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </nav>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEmployee('all')
                    setEmployeePage(1)
                  }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <ArrowLeft size={16} /> All employees
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{selectedPerson?.name || 'Employee accomplishments'}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {month ? `Reports for ${month}` : 'Reports for all dates'} · {filteredAccomplishments.length} {filteredAccomplishments.length === 1 ? 'report' : 'reports'}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 p-5 sm:p-6 xl:grid-cols-2">
              {paginatedAccomplishments.map(record => (
                <article key={record.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                      {(record.name || 'E').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-slate-900">{record.name || 'Employee'}</h3>
                          <p className="mt-0.5 truncate text-xs text-slate-500">{record.employeeId || record.email || record.uid}</p>
                        </div>
                        <time className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          <CalendarDays size={13} /> {record.dateKey || 'Date not set'}
                        </time>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap break-words border-t border-slate-100 pt-4 text-sm leading-6 text-slate-700">
                    {record.accomplishment || 'No accomplishment text.'}
                  </p>
                  {record.remarks && (
                    <p className="mt-3 rounded-xl bg-amber-50/70 px-3.5 py-3 text-sm leading-6 text-slate-600">
                      <span className="font-semibold text-slate-700">Remarks: </span>{record.remarks}
                    </p>
                  )}
                </article>
              ))}
              {filteredAccomplishments.length === 0 && (
                <div className="col-span-full px-4 py-12 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                    <FileText size={21} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">No accomplishments found</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {month ? `No reports were submitted for ${month}.` : 'This employee has not submitted any reports yet.'}
                  </p>
                </div>
              )}
            </div>
            {accomplishmentPageCount > 1 && (
              <nav
                aria-label="Department accomplishment pages"
                className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <p className="text-sm text-slate-500">
                  Showing {(currentAccomplishmentPage - 1) * accomplishmentPageSize + 1}–
                  {Math.min(currentAccomplishmentPage * accomplishmentPageSize, filteredAccomplishments.length)} of {filteredAccomplishments.length} reports
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAccomplishmentPage(currentAccomplishmentPage - 1)}
                    disabled={currentAccomplishmentPage === 1}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span aria-live="polite" className="px-1 text-sm font-medium tabular-nums text-slate-600">
                    Page {currentAccomplishmentPage} of {accomplishmentPageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAccomplishmentPage(currentAccomplishmentPage + 1)}
                    disabled={currentAccomplishmentPage === accomplishmentPageCount}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
      </section>

      {editingRecord && (
        <div
          className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !busy) setEditingRecord(null)
          }}
        >
          <form
            onSubmit={saveAttendance}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-attendance-title"
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20 sm:p-7"
          >
            <div className="mb-6 flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
                <Clock3 size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Edit time log</p>
                <h2 id="edit-attendance-title" className="mt-1 text-xl font-semibold text-slate-950">{editingRecord.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{editingRecord.dateKey}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                disabled={busy}
                aria-label="Close edit time log dialog"
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
            {error && (
              <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">
                {error}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {timeFields.map(([field, label]) => (
                <label key={field} className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
                  <input
                    type="datetime-local"
                    value={form[field] || ''}
                    onChange={event => setForm(current => ({ ...current, [field]: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm tabular-nums outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </label>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
              <Clock3 size={15} className="mt-0.5 shrink-0" />
              Use the attendance date for each time and keep the checkpoints in chronological order.
            </p>
            <div className="mt-7 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                disabled={busy}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
