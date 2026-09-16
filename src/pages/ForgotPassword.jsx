import { ArrowLeft, KeyRound, Mail, Send } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const { user, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await resetPassword(email)
      setSuccess('Password reset email sent. Please check your inbox and spam folder for the reset link.')
    } catch (err) {
      if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many reset attempts. Please try again later.')
      } else {
        // Keep the response generic so the screen does not reveal whether an account exists.
        setSuccess('If an account exists for this email, a password reset message will be sent. Please check your inbox and spam folder.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="soft-grid min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/8 sm:p-10">
          <div className="flex items-center justify-between gap-4">
            <Logo />
            <Link to="/login" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-950">
              <ArrowLeft size={16} /> Back to sign in
            </Link>
          </div>

          <div className="mt-10 flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <KeyRound size={22} />
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-500">PASSWORD RECOVERY</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Reset your password</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter the email address used for your DTR account. Firebase will send you a secure password-reset link.
            </p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>
            </label>

            {error && <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            {success && <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">{success}</div>}

            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? 'Sending reset link...' : 'Send reset link'} <Send size={17} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
