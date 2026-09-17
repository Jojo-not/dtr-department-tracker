import { BarChart3, Clock3, LogOut, Menu, Users, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

const links = [
  { to: '/', label: 'Dashboard', icon: BarChart3 },
  { to: '/department', label: 'Department', icon: Users },
  { to: '/my-logs', label: 'My Logs', icon: Clock3 },
]

export default function AppShell({ children }) {
  const [open, setOpen] = useState(false)
  const { profile, logout } = useAuth()

  const Sidebar = () => <div className="flex h-full flex-col">
    <div className="px-5 py-6"><Logo /></div>
    <nav className="space-y-1 px-3">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)} className={({ isActive }) =>
          `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`
        }>
          <Icon size={18} /> {label}
        </NavLink>
      ))}
    </nav>
    <div className="mt-auto border-t border-slate-200 p-4">
      <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
        <div className="grid size-9 place-items-center rounded-xl bg-white text-sm font-bold text-slate-700 ring-1 ring-slate-200">
          {profile?.name?.slice(0,1)?.toUpperCase() || 'U'}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">{profile?.name || 'User'}</div>
          <div className="truncate text-xs text-slate-500">{profile?.department || 'Department'}</div>
        </div>
      </div>
      <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700">
        <LogOut size={17} /> Sign out
      </button>
    </div>
  </div>

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block"><Sidebar /></aside>
      {open && <div className="fixed inset-0 z-40 lg:hidden">
        <button aria-label="Close menu" className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <aside className="relative h-full w-72 bg-white shadow-2xl"><Sidebar /><button onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></aside>
      </div>}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button onClick={() => setOpen(true)} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"><Menu size={20}/></button>
          <div className="ml-auto text-right">
            <div className="text-sm font-semibold text-slate-900">{profile?.department}</div>
            <div className="text-xs text-slate-500">Department Time In/Out and Attendance Monitoring System</div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
