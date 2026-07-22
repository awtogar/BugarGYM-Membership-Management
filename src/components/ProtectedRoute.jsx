import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { RiPulseLine } from '@remixicon/react'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-indigo-400 mb-3 animate-bounce">
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
