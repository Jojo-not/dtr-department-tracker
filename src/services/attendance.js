import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { getLocalDateKey } from '../utils/date'

export function attendanceId(uid, dateKey = getLocalDateKey()) {
  return `${uid}_${dateKey}`
}

export function getAttendancePhase(record) {
  if (!record) return 'NOT_STARTED'

  // Backward compatibility for records created before the two-session update.
  if (!record.timeIn1 && record.timeIn) {
    return record.timeOut ? 'COMPLETED' : 'AM_IN'
  }

  if (!record.timeIn1) return 'NOT_STARTED'
  if (!record.timeOut1) return 'AM_IN'
  if (!record.timeIn2) return 'LUNCH_BREAK'
  if (!record.timeOut2) return 'PM_IN'
  return 'COMPLETED'
}

/**
 * Record either the first AM Time In or the second PM Time In.
 *
 * Important: the first Time In intentionally uses setDoc() without first
 * reading the attendance document. The previous transaction implementation
 * performed a BatchGetDocuments read on a document that does not exist yet,
 * and the Firestore rules correctly rejected that read. That caused the
 * "Missing or insufficient permissions" error before the create could run.
 *
 * Firestore security rules still validate the complete write and prevent
 * users from skipping or overwriting attendance checkpoints.
 */
export async function timeIn(user, profile, currentRecord = null) {
  const dateKey = getLocalDateKey()
  const ref = doc(db, 'attendance', attendanceId(user.uid, dateKey))
  const phase = getAttendancePhase(currentRecord)

  if (phase === 'NOT_STARTED') {
    await setDoc(ref, {
      uid: user.uid,
      name: profile.name,
      email: profile.email,
      employeeId: profile.employeeId,
      department: profile.department,
      dateKey,
      timeIn1: serverTimestamp(),
      timeOut1: null,
      timeIn2: null,
      timeOut2: null,
      status: 'IN',
      updatedAt: serverTimestamp(),
    })
    return
  }

  if (phase === 'LUNCH_BREAK') {
    await updateDoc(ref, {
      timeIn2: serverTimestamp(),
      status: 'IN',
      updatedAt: serverTimestamp(),
    })
    return
  }

  throw new Error(
    phase === 'COMPLETED'
      ? 'Your DTR for today is already complete.'
      : 'Time In is not available at this stage.'
  )
}

/** Record either Lunch Time Out or Final Time Out. */
export async function timeOut(user, currentRecord) {
  const dateKey = getLocalDateKey()
  const ref = doc(db, 'attendance', attendanceId(user.uid, dateKey))
  const phase = getAttendancePhase(currentRecord)

  // Backward compatibility for an active record using the original schema.
  if (currentRecord && !currentRecord.timeIn1 && currentRecord.timeIn && !currentRecord.timeOut) {
    await updateDoc(ref, {
      timeOut: serverTimestamp(),
      status: 'OUT',
      updatedAt: serverTimestamp(),
    })
    return
  }

  if (phase === 'AM_IN') {
    await updateDoc(ref, {
      timeOut1: serverTimestamp(),
      status: 'BREAK',
      updatedAt: serverTimestamp(),
    })
    return
  }

  if (phase === 'PM_IN') {
    await updateDoc(ref, {
      timeOut2: serverTimestamp(),
      status: 'OUT',
      updatedAt: serverTimestamp(),
    })
    return
  }

  throw new Error(
    phase === 'NOT_STARTED'
      ? 'Please Time In first.'
      : phase === 'COMPLETED'
        ? 'Your DTR for today is already complete.'
        : 'Time Out is not available at this stage.'
  )
}

export function subscribeAttendanceByDate(department, dateKey, callback, onError) {
  const q = query(
    collection(db, 'attendance'),
    where('department', '==', department),
    where('dateKey', '==', dateKey),
  )
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    onError,
  )
}

export function subscribeTodayAttendance(department, callback, onError) {
  return subscribeAttendanceByDate(department, getLocalDateKey(), callback, onError)
}

export function subscribeDepartmentUsers(department, callback, onError) {
  const q = query(collection(db, 'users'), where('department', '==', department))
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    onError,
  )
}

export function subscribeMyAttendance(uid, callback, onError) {
  const q = query(collection(db, 'attendance'), where('uid', '==', uid))
  return onSnapshot(
    q,
    (snap) => callback(
      snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    ),
    onError,
  )
}
