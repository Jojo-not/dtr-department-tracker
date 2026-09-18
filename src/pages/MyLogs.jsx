import { CalendarDays, Clock3, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { subscribeMyAttendance } from '../services/attendance'
import { attendanceMinutes, attendanceTimes, formatTime, humanDuration } from '../utils/date'
import StatusBadge from '../components/StatusBadge'

export default function MyLogs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => user?.uid ? subscribeMyAttendance(user.uid, setLogs) : undefined, [user?.uid])

  const filteredLogs = useMemo(
    () => selectedDate ? logs.filter(log => log.dateKey === selectedDate) : logs,
    [logs, selectedDate],
  )

  const total = useMemo(
    () => filteredLogs.reduce((sum, log) => sum + (['LEAVE', 'TRAVEL'].includes(log.status) ? 0 : attendanceMinutes(log)), 0),
    [filteredLogs],
  )

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Clock3 size={16} /> Personal attendance</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">My DTR logs</h1>
          <p className="mt-2 text-sm text-slate-500">Your attendance history, including Leave and Travel days.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative block">
            <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="date"
              value={selectedDate}
              onChange={event => setSelectedDate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 sm:w-48"
              aria-label="Filter DTR logs by date"
            />
          </label>
          {selectedDate && (
            <button type="button" onClick={() => setSelectedDate('')} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
              <X size={16} /> Clear
            </button>
          )}
        </div>
      </div>

      {selectedDate && (
        <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Showing DTR records for <span className="font-semibold">{selectedDate}</span>.
        </div>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">{selectedDate ? 'Filtered records' : 'Records'}</div>
          <div className="mt-2 text-3xl font-semibold">{filteredLogs.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Recorded work hours</div>
          <div className="mt-2 text-3xl font-semibold">{humanDuration(total)}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">AM In</th>
                <th className="px-6 py-4">Lunch Out</th>
                <th className="px-6 py-4">PM In</th>
                <th className="px-6 py-4">PM Out</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => {
                const times = attendanceTimes(log)
                const away = ['LEAVE', 'TRAVEL'].includes(log.status)
                return (
                  <tr key={log.id}>
                    <td className="px-6 py-4 font-semibold text-slate-900">{log.dateKey}</td>
                    <td className="px-6 py-4 text-sm">{away ? '—' : formatTime(times.timeIn1)}</td>
                    <td className="px-6 py-4 text-sm">{away ? '—' : formatTime(times.timeOut1)}</td>
                    <td className="px-6 py-4 text-sm">{away ? '—' : formatTime(times.timeIn2)}</td>
                    <td className="px-6 py-4 text-sm">{away ? '—' : formatTime(times.timeOut2)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{away ? '—' : humanDuration(attendanceMinutes(log))}</td>
                    <td className="px-6 py-4"><StatusBadge status={log.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="p-12 text-center text-sm text-slate-500">
              {selectedDate ? 'No DTR records found for the selected date.' : 'No DTR records yet.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
