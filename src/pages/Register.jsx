import { ArrowLeft, ArrowRight, Badge, Building2, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

const DEPARTMENTS = ['BHROD-HRDD', 'OUHRODI']

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    employeeId: '',
    department: '',
    password: '',
    confirm: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')

    if (!DEPARTMENTS.includes(form.department)) {
      return setError('Please select a valid department.')
    }
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')

    setLoading(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(
        err.code === 'auth/email-already-in-use'
          ? 'This email is already registered.'
          : 'Unable to create account. Please review your information.'
      )
    } finally {
      setLoading(false)
    }
  }

  const field = (label, key, Icon, type = 'text', placeholder = '') => (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <Icon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          required
          type={type}
          value={form[key]}
          onChange={set(key)}
          placeholder={placeholder}
          autoComplete={type === 'email' ? 'email' : 'off'}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
        />
      </div>
    </label>
  )

  const passwordField = (label, key, show, setShow, placeholder, autoComplete) => (
    <div>
      <label htmlFor={`register-${key}`} className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <LockKeyhole size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={`register-${key}`}
          required
          type={show ? 'text' : 'password'}
          value={form[key]}
          onChange={set(key)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          title={show ? 'Hide password' : 'Show password'}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <button type="button" onClick={() => setShow(!show)} className="mt-2 text-xs font-medium text-slate-500 hover:text-slate-900">
        {show ? 'Hide password' : 'Show password'}
      </button>
    </div>
  )

  return (
    <div className="soft-grid min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/8 sm:p-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft size={16} /> Sign in
          </Link>
        </div>

        <div className="mt-10">
          <p className="text-sm font-semibold text-slate-500">CREATE ACCOUNT</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Join your department workspace
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Select your assigned department to join its live DTR board.
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
          {field('Full name', 'name', UserRound, 'text', 'Juan Dela Cruz')}
          {field('Employee ID', 'employeeId', Badge, 'text', 'EMP-00123')}
          <div className="sm:col-span-2">
            {field('Email address', 'email', Mail, 'email', 'name@company.com')}
          </div>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Department</span>
            <div className="relative">
              <Building2
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                required
                value={form.department}
                onChange={set('department')}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              >
                <option value="" disabled>
                  Select your department
                </option>
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">▼</span>
            </div>
          </label>

          {passwordField('Password', 'password', showPassword, setShowPassword, 'Minimum 6 characters', 'new-password')}
          {passwordField('Confirm password', 'confirm', showConfirm, setShowConfirm, 'Re-enter password', 'new-password')}

          {error && (
            <div className="sm:col-span-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="sm:col-span-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create account'} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
