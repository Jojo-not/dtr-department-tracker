import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => onAuthStateChanged(auth, async (firebaseUser) => {
    setUser(firebaseUser)
    if (!firebaseUser) {
      setProfile(null)
      setLoading(false)
      return
    }
    try {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
      setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    } finally {
      setLoading(false)
    }
  }), [])

  const register = async ({ name, email, password, employeeId, position, department }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName: name })
    const userData = {
      name: String(name ?? '').trim(),
      email: String(email ?? '').trim().toLowerCase(),
      employeeId: String(employeeId ?? '').trim(),
      position: String(position ?? '').trim(),
      department: String(department ?? '').trim(),
      role: 'employee',
      createdAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'users', credential.user.uid), userData)
    setProfile({ id: credential.user.uid, ...userData })
    return credential.user
  }

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const resetPassword = (email) => sendPasswordResetEmail(auth, String(email ?? '').trim().toLowerCase())
  const logout = () => signOut(auth)

  const value = useMemo(
    () => ({ user, profile, loading, login, register, resetPassword, logout }),
    [user, profile, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
