import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { plainTextToHtml, sanitizeRichHtml } from '../utils/richText'

export function subscribeMyAccomplishments(uid, onData, onError) {
  const q = query(collection(db, 'accomplishments'), where('uid', '==', uid))
  return onSnapshot(
    q,
    snapshot => {
      const records = snapshot.docs
        .map(item => ({ id: item.id, ...item.data() }))
        .sort((a, b) => {
          if (a.dateKey !== b.dateKey) return b.dateKey.localeCompare(a.dateKey)
          const aTime = a.createdAt?.toMillis?.() || 0
          const bTime = b.createdAt?.toMillis?.() || 0
          return bTime - aTime
        })
      onData(records)
    },
    onError,
  )
}

export async function createAccomplishment(user, profile, values) {
  return addDoc(collection(db, 'accomplishments'), {
    uid: user.uid,
    name: String(profile?.name ?? ''),
    email: String(profile?.email ?? user?.email ?? ''),
    employeeId: String(profile?.employeeId ?? ''),
    department: String(profile?.department ?? ''),
    dateKey: String(values?.dateKey ?? ''),
    accomplishment: String(values?.accomplishment ?? '').trim(),
    accomplishmentHtml: sanitizeRichHtml(values?.accomplishmentHtml || plainTextToHtml(String(values?.accomplishment ?? ''))),
    remarks: String(values?.remarks ?? '').trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateAccomplishment(recordId, values) {
  return updateDoc(doc(db, 'accomplishments', recordId), {
    dateKey: String(values?.dateKey ?? ''),
    accomplishment: String(values?.accomplishment ?? '').trim(),
    accomplishmentHtml: sanitizeRichHtml(values?.accomplishmentHtml || plainTextToHtml(String(values?.accomplishment ?? ''))),
    remarks: String(values?.remarks ?? '').trim(),
    updatedAt: serverTimestamp(),
  })
}

export async function removeAccomplishment(recordId) {
  return deleteDoc(doc(db, 'accomplishments', recordId))
}
