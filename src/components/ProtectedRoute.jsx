import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { RiPulseLine } from '@remixicon/react'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center text-muted">
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-white mb-3 animate-bounce">
          <RiPulseLine className="w-8 h-8" />
        </div>
        <p className="text-sm font-medium">Loading session...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
