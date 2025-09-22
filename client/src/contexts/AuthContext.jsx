import { createContext, useContext, useEffect, useState } from 'react'
import { endpoints } from '../lib/api.js'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    endpoints.me()
      .then(({ user }) => { if (active) setUser(user) })
      .catch(() => { if (active) setUser(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const login = () => endpoints.login()
  const logout = async () => {
    await endpoints.logout()
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  return useContext(AuthCtx)
}
