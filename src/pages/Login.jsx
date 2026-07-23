import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { RiPulseLine, RiLockLine, RiMailLine, RiErrorWarningLine, RiEyeLine, RiEyeOffLine } from '@remixicon/react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (user) {
      navigate('/admin', { replace: true })
    }
  }, [user, navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      navigate('/admin', { replace: true })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-canvas p-4 font-inter gap-4">
      <div className="max-w-md w-full bg-surface-card/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-white mb-3">
            <RiPulseLine className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight uppercase font-geist">BugarGym Admin</h1>
          <p className="text-muted text-xs mt-1">Sistem Digital Fitness Management Portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/5 border border-red-500/15 rounded-lg flex items-center gap-3 text-red-400 text-xs font-mono">
            <RiErrorWarningLine className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2 font-geist">
              Email Address
            </label>
            <div className="relative">
              <RiMailLine className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bugargym.com"
                className="w-full bg-surface-lowest border border-white/8 text-white rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white/30 transition-all font-inter placeholder:text-neutral-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2 font-geist">
              Password
            </label>
            <div className="relative">
              <RiLockLine className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-lowest border border-white/8 text-white rounded-lg py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:border-white/30 transition-all font-inter placeholder:text-neutral-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <RiEyeOffLine className="w-4 h-4" />
                ) : (
                  <RiEyeLine className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-[#e5e5e5] text-canvas font-bold py-2.5 rounded-lg transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer font-geist uppercase tracking-wider text-xs"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>

      {/* dummy banner, remove after development */}
      <div className="max-w-md w-full p-4 bg-surface-card/70 justify-center items-center text-center backdrop-blur-md5 rounded-lg text-xs font-mono text-white">
        <p className="font-semibold uppercase tracking-wider text-[10px] mb-1 text-white">Dummy Account (Testing)</p>
        <p>Email: bugargym@gmail.com</p>
        <p>Password: bugar123</p>
      </div>
    </div>
  )
}
