export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatTime(timestamp) {
  if (!timestamp) return '—'
  const date = typeof timestamp?.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)
  return new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
  }).format(date)
}

export function formatDate(timestamp) {
  if (!timestamp) return '—'
  const date = typeof timestamp?.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(date)
}

export function minutesBetween(start, end) {
  if (!start) return 0
  const s = typeof start?.toDate === 'function' ? start.toDate() : new Date(start)
  const e = end ? (typeof end?.toDate === 'function' ? end.toDate() : new Date(end)) : new Date()
  return Math.max(0, Math.floor((e - s) / 60000))
}


export function attendanceTimes(record) {
  if (!record) return { timeIn1: null, timeOut1: null, timeIn2: null, timeOut2: null }

  if (!record.timeIn1 && record.timeIn) {
    return {
      timeIn1: record.timeIn,
      timeOut1: record.timeOut || null,
      timeIn2: null,
      timeOut2: null,
    }
  }

  return {
    timeIn1: record.timeIn1 || null,
    timeOut1: record.timeOut1 || null,
    timeIn2: record.timeIn2 || null,
    timeOut2: record.timeOut2 || null,
  }
}

export function attendanceMinutes(record) {
  if (!record) return 0

  // Original one-session records.
  if (!record.timeIn1 && record.timeIn) {
    return minutesBetween(record.timeIn, record.timeOut)
  }

  let total = 0
  if (record.timeIn1) total += minutesBetween(record.timeIn1, record.timeOut1)
  if (record.timeIn2) total += minutesBetween(record.timeIn2, record.timeOut2)
  return total
}

export function humanDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}
