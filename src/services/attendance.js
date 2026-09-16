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

export async function timeIn(user, profile) {
  const dateKey = getLocalDateKey()
  const ref = doc(db, 'attendance', attendanceId(user.uid, dateKey))
  await setDoc(ref, {
    uid: user.uid,
    name: profile.name,
    email: profile.email,
    employeeId: profile.employeeId,
    department: profile.department,
    dateKey,
    timeIn: serverTimestamp(),
    timeOut: null,
    status: 'IN',
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export async function timeOut(user) {
  const dateKey = getLocalDateKey()
  const ref = doc(db, 'attendance', attendanceId(user.uid, dateKey))
  await updateDoc(ref, {
    timeOut: serverTimestamp(),
    status: 'OUT',
    updatedAt: serverTimestamp(),
  })
}

export function subscribeAttendanceByDate(department, dateKey, callback) {
  const q = query(
    collection(db, 'attendance'),
    where('department', '==', department),
    where('dateKey', '==', dateKey),
  )
  return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

export function subscribeTodayAttendance(department, callback) {
  return subscribeAttendanceByDate(department, getLocalDateKey(), callback)
}

export function subscribeDepartmentUsers(department, callback) {
  const q = query(collection(db, 'users'), where('department', '==', department))
  return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

export function subscribeMyAttendance(uid, callback) {
  const q = query(collection(db, 'attendance'), where('uid', '==', uid))
  return onSnapshot(q, (snap) => callback(
    snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
  ))
}
