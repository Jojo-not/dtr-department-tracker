import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Department from './pages/Department'
import Login from './pages/Login'
import MyLogs from './pages/MyLogs'
import Register from './pages/Register'

function PrivatePage({ children }) { return <ProtectedRoute><AppShell>{children}</AppShell></ProtectedRoute> }

export default function App() {
  return <Routes>
    <Route path="/login" element={<Login/>}/>
    <Route path="/register" element={<Register/>}/>
    <Route path="/" element={<PrivatePage><Dashboard/></PrivatePage>}/>
    <Route path="/department" element={<PrivatePage><Department/></PrivatePage>}/>
    <Route path="/my-logs" element={<PrivatePage><MyLogs/></PrivatePage>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>
}
