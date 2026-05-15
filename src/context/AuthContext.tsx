import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User, AuthResponse } from '../types'
import { authApi } from '../api/authApi'
import axios from 'axios'

/**
 * Auth context managing session bootstrap, token persistence,
 * route-safe logout handling, and profile refresh.
 */
interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  authReady: boolean
  isAdmin: boolean
  isPremium: boolean
  login: (response: AuthResponse) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const AUTH_USER_KEY = 'resumeai_user'
const AUTH_TOKEN_KEY = 'resumeai_token'

function clearStoredAuth() {
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem('token')
  sessionStorage.removeItem(AUTH_USER_KEY)
  sessionStorage.removeItem(AUTH_TOKEN_KEY)
  sessionStorage.removeItem('token')
}

/**
 * Determines whether an API failure means the current session
 * should be treated as invalid and cleared.
 */
function isInvalidSessionError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false

  const status = error.response?.status
  const message = String((error.response?.data as any)?.message ?? '')
  const accountStateIssue = /deactivated|suspended|disabled|deleted|not found/i.test(message)

  return status === 401
    || status === 404
    || (status === 403 && accountStateIssue)
    || (status === 400 && accountStateIssue)
}

/** Chooses the login route based on current application area. */
function getAuthRedirectPath(pathname: string) {
  if (pathname.startsWith('/admin') || pathname === '/admin-login') {
    return '/admin-login'
  }

  return '/login'
}

function readStoredUser(): User | null {
  const raw = localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as User
  } catch {
    localStorage.removeItem(AUTH_USER_KEY)
    sessionStorage.removeItem(AUTH_USER_KEY)
    return null
  }
}

function readStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
    || sessionStorage.getItem(AUTH_TOKEN_KEY)
    || localStorage.getItem('token')
    || sessionStorage.getItem('token')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser())
  const [token, setToken] = useState<string | null>(() => readStoredToken())
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    let alive = true

    // Bootstraps persisted login state and validates token using profile API.
    const bootstrapAuth = async () => {
      if (!token) {
        if (alive) setAuthReady(true)
        return
      }

      try {
        const profile = await authApi.getProfile()
        if (!alive) return
        setUser(profile)
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile))
      } catch (error) {
        if (!alive) return

        if (isInvalidSessionError(error)) {
          setUser(null)
          setToken(null)
          clearStoredAuth()
        }
      } finally {
        if (alive) setAuthReady(true)
      }
    }

    bootstrapAuth()
    return () => { alive = false }
  }, [token])

  useEffect(() => {
    if (!token) return

    let cancelled = false
    // Polls profile to capture account state changes (suspended/deleted) quickly.
    const interval = window.setInterval(async () => {
      try {
        const profile = await authApi.getProfile()
        if (cancelled) return
        setUser(profile)
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile))
      } catch (error) {
        if (cancelled) return
        if (isInvalidSessionError(error)) {
          setUser(null)
          setToken(null)
          clearStoredAuth()
          const target = getAuthRedirectPath(window.location.pathname)
          if (window.location.pathname !== target) {
            window.location.href = target
          }
        }
      }
    }, 30_000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [token])

  const login = (response: AuthResponse) => {
    const userData: User = {
      userId: response.userId,
      fullName: response.fullName,
      email: response.email,
      role: (response.role as 'USER' | 'ADMIN') || 'USER',
      subscriptionPlan: (response.subscriptionPlan as 'FREE' | 'PREMIUM') || 'FREE',
      isActive: true,
      provider: (response.provider as 'LOCAL' | 'GOOGLE' | 'LINKEDIN') || 'LOCAL',
      createdAt: new Date().toISOString(),
    }

    setUser(userData)
    setToken(response.token)

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData))
    localStorage.setItem(AUTH_TOKEN_KEY, response.token)
    sessionStorage.removeItem(AUTH_USER_KEY)
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
  }

  const logout = () => {
    setUser(null)
    setToken(null)

    clearStoredAuth()
    const target = getAuthRedirectPath(window.location.pathname)
    if (window.location.pathname !== target) {
      window.location.replace(target)
    }
  }

  const updateUser = (updates: Partial<User>) => {
    if (!user) return

    const updated = { ...user, ...updates }
    setUser(updated)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user && !!token,
      authReady,
      isAdmin: user?.role === 'ADMIN',
      isPremium: user?.subscriptionPlan === 'PREMIUM',
      login,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
