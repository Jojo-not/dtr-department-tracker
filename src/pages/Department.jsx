import { CalendarDays, Search, UsersRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { subscribeAttendanceByDate, subscribeDepartmentUsers } from '../services/attendance'
import { attendanceMinutes, attendanceTimes, formatTime, getLocalDateKey, humanDuration } from '../utils/date'
import StatusBadge from '../components/StatusBadge'

export default function Department() {
  const { profile } = useAuth()
  const [people, setPeople] = useState([])
  const [attendance, setAttendance] = useState([])
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState(getLocalDateKey())
  const today = getLocalDateKey()

  useEffect(() => {
    if (!profile?.department) return undefined
    const unsubscribeUsers = subscribeDepartmentUsers(profile.department, setPeople)
    const unsubscribeAttendance = subscribeAttendanceByDate(profile.department, selectedDate, setAttendance)
    return () => {
      unsubscribeUsers()
      unsubscribeAttendance()
    }
  }, [profile?.department, selectedDate])

  const rows = useMemo(
    () => people
      .map(person => ({ ...person, attendance: attendance.find(item => item.uid === person.id) }))
      .filter(person => `${person.name} ${person.employeeId} ${person.email}`.toLowerCase().includes(search.toLowerCase())),
    [people, attendance, search],
  )

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><UsersRound size={16} /> {profile?.department}</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Department board</h1>
          <p className="mt-2 text-sm text-slate-500">View both AM and PM DTR sessions for everyone in your department.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={event => setSelectedDate(event.target.value || today)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 sm:w-48"
              aria-label="Select department attendance date"
            />
          </div>
          {selectedDate !== today && (
            <button type="button" onClick={() => setSelectedDate(today)} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Today</button>
          )}
          <div className="relative sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search employee..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        Attendance date: <span className="font-semibold text-slate-900">{selectedDate}</span>
        {selectedDate === today && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Today</span>}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">AM In</th>
                <th className="px-6 py-4">AM Out</th>
                <th className="px-6 py-4">PM In</th>
                <th className="px-6 py-4">PM Out</th>
                <th className="px-6 py-4">Worked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(person => {
                const times = attendanceTimes(person.attendance)
                return (
                  <tr key={person.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{person.name}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{person.employeeId} · {person.email}</div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={person.attendance?.status} /></td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{formatTime(times.timeIn1)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{formatTime(times.timeOut1)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{formatTime(times.timeIn2)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{formatTime(times.timeOut2)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{person.attendance ? humanDuration(attendanceMinutes(person.attendance)) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {rows.length === 0 && <div className="p-12 text-center text-sm text-slate-500">No matching employees found.</div>}
        </div>
      </div>
    </div>
  )
}
