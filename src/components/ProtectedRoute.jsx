import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return (
    <div className="grid min-h-screen place-items-center bg-slate-50">
      <div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
