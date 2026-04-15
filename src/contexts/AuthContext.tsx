import { createContext, useContext, useState, useCallback, useLayoutEffect, type ReactNode } from 'react'
import {
  AUTH_TOKEN_KEY,
  AUTH_SESSION_KEY,
  AUTH_EXPIRES_KEY,
  AUTH_REMEMBER_KEY,
  validateStoredSession,
} from '../services/authService'

export interface AuthUser {
  id: number
  email: string
  role: string
  token: string
}

interface AuthContextValue {
  user: AuthUser | undefined
  login: (id: number, email: string, role: string, token: string, remember: boolean, expiresAtMs?: number) => void
  logout: () => void
  loginModalOpen: boolean
  openLogin: () => void
  closeLogin: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function clearSession(keepToken = false) {
  localStorage.removeItem(AUTH_SESSION_KEY)
  if (!keepToken) {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_EXPIRES_KEY)
    localStorage.removeItem(AUTH_REMEMBER_KEY)
  }
}

function loadSession(): AuthUser | undefined {
  try {
    const expires = localStorage.getItem(AUTH_EXPIRES_KEY)
    if (expires && Date.now() > Number(expires)) {
      const remember = localStorage.getItem(AUTH_REMEMBER_KEY) === '1'
      clearSession(remember) // keep token if remembered, so useLayoutEffect can re-validate
      return undefined
    }
    const raw = localStorage.getItem(AUTH_SESSION_KEY)
    if (!raw) return undefined
    const u = JSON.parse(raw) as Record<string, unknown>
    const id = Math.trunc(Number(u.id))
    if (!Number.isFinite(id) || id < 1) return undefined
    const token = typeof u.token === 'string' ? u.token : ''
    if (!token) return undefined
    return { id, email: String(u.email ?? ''), role: String(u.role ?? 'admin'), token }
  } catch {
    return undefined
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]                     = useState<AuthUser | undefined>(loadSession)
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  const login = useCallback((
    id: number,
    email: string,
    role: string,
    token: string,
    remember: boolean,
    expiresAtMs?: number,
  ) => {
    const uid = Math.trunc(Number(id))
    if (!Number.isFinite(uid) || uid < 1) return
    const authUser: AuthUser = { id: uid, email, role, token }
    const days = remember ? 365 : 1
    const expiresAt = (expiresAtMs != null && Number.isFinite(expiresAtMs))
      ? expiresAtMs
      : Date.now() + days * 24 * 60 * 60 * 1000
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(authUser))
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    localStorage.setItem(AUTH_EXPIRES_KEY, String(expiresAt))
    localStorage.setItem(AUTH_REMEMBER_KEY, remember ? '1' : '0')
    setUser(authUser)
    setLoginModalOpen(false)
  }, [])

  const logout = useCallback(() => {
    const remember = localStorage.getItem(AUTH_REMEMBER_KEY) === '1'
    clearSession(!remember)
    setUser(undefined)
  }, [])

  // On mount: if session data is missing but a remembered token exists, re-validate with the server
  useLayoutEffect(() => {
    let cancelled = false

    void (async () => {
      const raw = localStorage.getItem(AUTH_SESSION_KEY)
      if (raw) {
        try {
          const u = JSON.parse(raw) as Record<string, unknown>
          const id = Math.trunc(Number(u.id))
          if (Number.isFinite(id) && id >= 1 && typeof u.token === 'string' && u.token) return
        } catch { /* fall through to token restore */ }
      }

      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      if (token && localStorage.getItem(AUTH_REMEMBER_KEY) === '1') {
        const result = await validateStoredSession(token)
        if (cancelled) return
        if (result?.success && result.id != null && result.token) {
          login(result.id, result.email ?? '', result.role ?? 'admin', result.token, true, result.expiresAt)
          return
        }
        clearSession(false)
      }
    })()

    return () => { cancelled = true }
  }, [login])

  const openLogin = useCallback(() => {
    void (async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      if (token && localStorage.getItem(AUTH_REMEMBER_KEY) === '1') {
        const result = await validateStoredSession(token)
        if (result?.success && result.id != null && result.token) {
          login(result.id, result.email ?? '', result.role ?? 'admin', result.token, true, result.expiresAt)
          return
        }
        clearSession(false)
      }
      setLoginModalOpen(true)
    })()
  }, [login])

  const closeLogin = useCallback(() => setLoginModalOpen(false), [])

  return (
    <AuthContext.Provider value={{ user, login, logout, loginModalOpen, openLogin, closeLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
