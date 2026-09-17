import { CalendarDays, Clock3, Coffee, LogIn, LogOut, TimerReset, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getAttendancePhase,
  subscribeDepartmentUsers,
  subscribeTodayAttendance,
  timeIn,
  timeOut,
} from '../services/attendance'
import { attendanceMinutes, attendanceTimes, formatTime, getLocalDateKey, humanDuration } from '../utils/date'
import StatusBadge from '../components/StatusBadge'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [people, setPeople] = useState([])
  const [attendance, setAttendance] = useState([])
  const [attendanceReady, setAttendanceReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(new Date())
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!profile?.department) return undefined
    setAttendanceReady(false)
    const handleSubscriptionError = (error) => {
      console.error('Firestore subscription error:', error)
      setMessageType('error')
      setMessage(
        error?.code === 'permission-denied'
          ? 'Firestore permission denied. Make sure the latest firestore.rules are published in Firebase.'
          : 'Unable to load live attendance. Please refresh the page.'
      )
    }

    const unsubscribeUsers = subscribeDepartmentUsers(profile.department, setPeople, handleSubscriptionError)
    const unsubscribeAttendance = subscribeTodayAttendance(
      profile.department,
      (records) => {
        setAttendance(records)
        setAttendanceReady(true)
      },
      handleSubscriptionError
    )
    return () => {
      unsubscribeUsers()
      unsubscribeAttendance()
    }
  }, [profile?.department])

  const mine = attendance.find(item => item.uid === user.uid)
  const mineTimes = attendanceTimes(mine)
  const minePhase = getAttendancePhase(mine)

  const merged = useMemo(
    () => people.map(person => ({ ...person, attendance: attendance.find(item => item.uid === person.id) })),
    [people, attendance],
  )

  const inCount = merged.filter(person => person.attendance?.status === 'IN').length
  const breakCount = merged.filter(person => person.attendance?.status === 'BREAK').length
  const completedCount = merged.filter(person => person.attendance?.status === 'OUT').length
  const notInCount = merged.filter(person => !person.attendance).length

  const canTimeIn = attendanceReady && (minePhase === 'NOT_STARTED' || minePhase === 'LUNCH_BREAK')
  const canTimeOut = attendanceReady && (minePhase === 'AM_IN' || minePhase === 'PM_IN')
  const timeInLabel = minePhase === 'LUNCH_BREAK' ? 'PM Time In' : 'AM Time In'
  const timeOutLabel = minePhase === 'PM_IN' ? 'Final Time Out' : 'Lunch Time Out'

  async function act(type) {
    setBusy(true)
    setMessage('')
    setMessageType('success')
    try {
      if (type === 'in') {
        await timeIn(user, profile, mine)
        setMessage(minePhase === 'LUNCH_BREAK' ? 'Afternoon Time In recorded successfully.' : 'Morning Time In recorded successfully.')
      } else {
        await timeOut(user, mine)
        setMessage(minePhase === 'PM_IN' ? 'Final Time Out recorded successfully.' : 'Lunch Time Out recorded successfully.')
      }
    } catch (error) {
      console.error('Attendance write failed:', error)
      setMessageType('error')
      if (error?.code === 'permission-denied') {
        setMessage('Firestore permission denied. Publish the latest firestore.rules in Firebase, then sign out and sign back in.')
      } else {
        setMessage(error?.message || 'Unable to record attendance. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {new Intl.DateTimeFormat('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(now)}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Good day, {profile?.name?.split(' ')[0]}.</h1>
          <p className="mt-2 text-sm text-slate-500">Here’s your department attendance for today.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-right shadow-sm">
          <div className="text-2xl font-semibold tabular-nums tracking-tight text-slate-950">
            {new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }).format(now)}
          </div>
          <div className="text-xs font-medium text-slate-500">Local time</div>
        </div>
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${messageType === 'error' ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
          {message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Department', merged.length, Users],
          ['Currently In', inCount, LogIn],
          ['Lunch Break', breakCount, Coffee],
          ['Completed', completedCount, LogOut],
          ['Not yet in', notInCount, TimerReset],
        ].map(([label, value, Icon]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-500">{label}</div>
              <div className="rounded-xl bg-slate-100 p-2 text-slate-600"><Icon size={18} /></div>
            </div>
            <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[.95fr_1.55fr]">
        <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-slate-400">My DTR Today</p>
              <h2 className="mt-2 text-xl font-semibold">Two-session attendance</h2>
            </div>
            <Clock3 className="text-slate-400" />
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            {[
              ['AM Time In', mineTimes.timeIn1],
              ['Lunch Time Out', mineTimes.timeOut1],
              ['PM Time In', mineTimes.timeIn2],
              ['Final Time Out', mineTimes.timeOut2],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-slate-400">{label}</div>
                <div className="mt-1 text-lg font-semibold">{formatTime(value)}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Total worked time</span>
              <span className="text-sm font-semibold">{mine ? humanDuration(attendanceMinutes(mine)) : '—'}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">Lunch break time is excluded from the total.</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              disabled={busy || !canTimeIn}
              onClick={() => act('in')}
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <LogIn size={17} /> {timeInLabel}
            </button>
            <button
              disabled={busy || !canTimeOut}
              onClick={() => act('out')}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <LogOut size={17} /> {timeOutLabel}
            </button>
          </div>

          {minePhase === 'COMPLETED' && (
            <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
              Your DTR for today is complete.
            </div>
          )}

          <div className="mt-5 flex items-center gap-2 text-xs text-slate-400"><CalendarDays size={14} /> Record date: {getLocalDateKey()}</div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-semibold text-slate-950">Department activity</h2>
              <p className="mt-0.5 text-xs text-slate-500">Live status for everyone in {profile?.department}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Live</span>
          </div>
          <div className="divide-y divide-slate-100">
            {merged.slice(0, 7).map(person => {
              const times = attendanceTimes(person.attendance)
              return (
                <div key={person.id} className="flex items-center gap-3 px-5 py-4 sm:px-6">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">{person.name?.[0]}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900">{person.name}</div>
                    <div className="truncate text-xs text-slate-500">{person.employeeId || person.email}</div>
                  </div>
                  <div className="hidden text-right lg:block">
                    {person.attendance ? (
                      <>
                        <div className="text-xs font-medium text-slate-500">AM {formatTime(times.timeIn1)} – {formatTime(times.timeOut1)}</div>
                        <div className="text-xs text-slate-400">PM {formatTime(times.timeIn2)} – {formatTime(times.timeOut2)}</div>
                      </>
                    ) : <div className="text-xs font-medium text-slate-500">No entry yet</div>}
                  </div>
                  <StatusBadge status={person.attendance?.status} />
                </div>
              )
            })}
            {merged.length === 0 && <div className="px-6 py-12 text-center text-sm text-slate-500">No department members found yet.</div>}
          </div>
        </div>
      </section>
    </div>
  )
}
