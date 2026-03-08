import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const RequireAuth = () => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export const RequireAdmin = () => {
  const { isAuthenticated, isAdmin } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}

export const RequireGuest = () => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />
}
