import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  logout: () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function initAuth() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error fetching session:', error.message)
        }
        if (mounted) {
          setSession(data?.session ?? null)
          setUser(data?.session?.user ?? null)
          setLoading(false)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Signout error:', err)
    } finally {
      setUser(null)
      setSession(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
