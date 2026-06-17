import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'

export type User = {
  id: string
  email: string
  displayName: string
  workspaceId: string | null
}

type AuthContextType = {
  user: User | null
  loading: boolean
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (input: {
    email: string
    password: string
    displayName: string
    signupCode: string
  }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    try {
      setUser(await api.get('/auth/me'))
    } catch {
      setUser(null)
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    setUser(await api.post('/auth/login', { email, password }))
  }

  async function register(input: {
    email: string
    password: string
    displayName: string
    signupCode: string
  }) {
    setUser(await api.post('/auth/register', input))
  }

  async function logout() {
    await api.post('/auth/logout')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, refresh, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
