import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../context/AuthContext'
import { AuthResponse } from '../../types'
import { server } from '../../test/msw/server'
import { rest } from 'msw'

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  test('loads stored user and token on init', async () => {
    const mockUser = { userId: 1, fullName: 'John', email: 'john@ex.com', role: 'USER', subscriptionPlan: 'FREE', isActive: true, provider: 'LOCAL', createdAt: new Date().toISOString() }
    server.use(
      rest.get('http://localhost:8080/api/v1/auth/profile', (_req, res, ctx) => {
        return res(ctx.json(mockUser))
      })
    )
    localStorage.setItem('resumeai_user', JSON.stringify(mockUser))
    localStorage.setItem('resumeai_token', 'stored-token')
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => {
      expect(result.current.authReady).toBe(true)
    })
    expect(result.current.user).toMatchObject(mockUser)
    expect(result.current.token).toBe('stored-token')
    expect(result.current.isAuthenticated).toBe(true)
  })

  test('login updates storage and state', async () => {
    server.use(
      rest.get('http://localhost:8080/api/v1/auth/profile', (_req, res, ctx) => {
        return res(ctx.json({
          userId: 2,
          fullName: 'New User',
          email: 'new@ex.com',
          role: 'USER',
          subscriptionPlan: 'FREE',
        }))
      })
    )
    const { result } = renderHook(() => useAuth(), { wrapper })
    const response: AuthResponse = {
      token: 'new-token',
      userId: 2,
      email: 'new@ex.com',
      fullName: 'New User',
      role: 'USER',
      subscriptionPlan: 'FREE',
      provider: 'LOCAL',
    }
    await act(async () => {
      result.current.login(response)
    })
    await waitFor(() => {
      expect(result.current.authReady).toBe(true)
    })
    expect(result.current.user?.userId).toBe(2)
    expect(result.current.token).toBe('new-token')
    expect(JSON.parse(localStorage.getItem('resumeai_user') as string).userId).toBe(2)
    expect(localStorage.getItem('resumeai_token')).toBe('new-token')
  })

  test('periodic profile refresh updates user', async () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useAuth(), { wrapper })
    // initial login to set token
    await act(async () => {
      result.current.login({
        token: 'test-token',
        userId: 1,
        email: 'test@ex.com',
        fullName: 'Test',
        role: 'USER',
        subscriptionPlan: 'FREE',
        provider: 'LOCAL',
      })
    })
    await waitFor(() => {
      expect(result.current.authReady).toBe(true)
    })
    // fast-forward timers to trigger interval (30s)
    await act(async () => {
      jest.advanceTimersByTime(30_000)
    })
    await waitFor(() => {
      expect(result.current.user?.email).toBe('test@example.com')
    })
    // after interval, mock handler returns same user, ensure still set
    expect(result.current.user?.email).toBe('test@example.com')
    jest.useRealTimers()
  })

  test('handles invalid session error and clears state', async () => {
    // Mock profile endpoint to return 401
    server.use(
      rest.get('http://localhost:8080/api/v1/auth/profile', (req, res, ctx) => {
        return res(ctx.status(401))
      })
    )
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {
      result.current.login({
        token: 'bad-token',
        userId: 3,
        email: 'bad@ex.com',
        fullName: 'Bad',
        role: 'USER',
        subscriptionPlan: 'FREE',
        provider: 'LOCAL',
      })
    })
    await waitFor(() => {
      expect(result.current.authReady).toBe(true)
    })
    // Wait for the effect to process the 401 error
    await waitFor(() => {
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
    })
  })
})
