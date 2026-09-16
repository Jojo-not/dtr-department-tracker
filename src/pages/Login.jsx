import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function submit(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(email, password); navigate('/') }
    catch { setError('Unable to sign in. Check your email and password.') }
    finally { setLoading(false) }
  }

  return <div className="soft-grid min-h-screen bg-slate-50 px-4 py-8">
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/8 lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 size-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative z-10"><Logo inverse /></div>
        <div className="relative z-10 mt-auto max-w-md">
          <span className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">Realtime department attendance</span>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">A cleaner way to see who’s in, who’s out, and when.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">Built for teams that need simple, transparent daily time records without complicated workflows.</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <div className="mb-8"><p className="text-sm font-semibold text-slate-500">WELCOME BACK</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Sign in to your workspace</h2><p className="mt-2 text-sm text-slate-500">Use your registered account to record and review attendance.</p></div>
          <form onSubmit={submit} className="space-y-5">
            <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Email address</span><div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@company.com" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"/></div></label>
            <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Password</span><div className="relative"><LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input required type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-11 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"/><button type="button" onClick={()=>setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
            {error && <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:opacity-60">{loading?'Signing in...':'Sign in'} <ArrowRight size={18}/></button>
          </form>
          <p className="mt-7 text-center text-sm text-slate-500">New to DTR Workspace? <Link to="/register" className="font-semibold text-slate-950 hover:underline">Create an account</Link></p>
        </div>
      </section>
    </div>
  </div>
}
