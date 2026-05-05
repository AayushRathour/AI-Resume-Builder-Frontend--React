import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User, AuthResponse } from '../types'
import { authApi } from '../api/authApi'

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
  return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser())
  const [token, setToken] = useState<string | null>(() => readStoredToken())
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    let alive = true

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
      } catch {
        // Keep the cached user if the profile request fails, but do not block the app.
      } finally {
        if (alive) setAuthReady(true)
      }
    }

    bootstrapAuth()
    return () => { alive = false }
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

    localStorage.removeItem(AUTH_USER_KEY)
    localStorage.removeItem(AUTH_TOKEN_KEY)
    sessionStorage.removeItem(AUTH_USER_KEY)
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
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
