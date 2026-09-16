import { ArrowLeft, ArrowRight, Badge, Building2, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function Register() {
  const { user, register } = useAuth(); const navigate = useNavigate()
  const [form, setForm] = useState({ name:'', email:'', employeeId:'', department:'', password:'', confirm:'' })
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  if (user) return <Navigate to="/" replace />
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  async function submit(e) {
    e.preventDefault(); setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    try { await register(form); navigate('/') }
    catch (err) { setError(err.code === 'auth/email-already-in-use' ? 'This email is already registered.' : 'Unable to create account. Please review your information.') }
    finally { setLoading(false) }
  }
  const field = (label,key,Icon,type='text',placeholder='') => <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">{label}</span><div className="relative"><Icon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input required type={type} value={form[key]} onChange={set(key)} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"/></div></label>
  return <div className="soft-grid min-h-screen bg-slate-50 px-4 py-8"><div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/8 sm:p-10">
    <div className="flex items-center justify-between"><Logo/><Link to="/login" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft size={16}/> Sign in</Link></div>
    <div className="mt-10"><p className="text-sm font-semibold text-slate-500">CREATE ACCOUNT</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Join your department workspace</h1><p className="mt-2 text-sm text-slate-500">Use the exact same department name as your teammates so you can share the live DTR board.</p></div>
    <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
      {field('Full name','name',UserRound,'text','Juan Dela Cruz')}
      {field('Employee ID','employeeId',Badge,'text','EMP-00123')}
      <div className="sm:col-span-2">{field('Email address','email',Mail,'email','name@company.com')}</div>
      <div className="sm:col-span-2">{field('Department','department',Building2,'text','Human Resources')}</div>
      {field('Password','password',LockKeyhole,'password','Minimum 6 characters')}
      {field('Confirm password','confirm',LockKeyhole,'password','Re-enter password')}
      {error && <div className="sm:col-span-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <button disabled={loading} className="sm:col-span-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800 disabled:opacity-60">{loading?'Creating account...':'Create account'} <ArrowRight size={18}/></button>
    </form>
  </div></div>
}
