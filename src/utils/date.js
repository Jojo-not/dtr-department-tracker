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

export function humanDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}
