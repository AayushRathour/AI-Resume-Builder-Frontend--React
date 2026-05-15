import { rest } from 'msw'
import { authApi } from '../authApi'
import { server } from '../../test/msw/server'

describe('authApi integration', () => {
  test('login returns normalized auth response and profile-backed fields', async () => {
    server.use(
      rest.post('http://localhost:8080/api/v1/auth/login', (_req, res, ctx) => {
        return res(ctx.json({
          token: 'tkn',
          email: 'qa@example.com',
          userId: 45,
        }))
      }),
      rest.get('http://localhost:8080/api/v1/auth/profile', (_req, res, ctx) => {
        return res(ctx.json({
          userId: 45,
          fullName: 'QA User',
          email: 'qa@example.com',
          role: 'USER',
          subscriptionPlan: 'FREE',
        }))
      })
    )

    const result = await authApi.login({ email: 'qa@example.com', password: 'secret' })
    expect(result.userId).toBe(45)
    expect(result.fullName).toBe('QA User')
    expect(result.role).toBe('USER')
  })

  test('verifyOtp unwraps status payload shape', async () => {
    server.use(
      rest.post('http://localhost:8080/api/v1/auth/verify-otp', (_req, res, ctx) => {
        return res(ctx.json({
          status: 'success',
          data: {
            success: true,
            message: 'verified',
            authResponse: {
              token: 'verified-token',
              email: 'otp@example.com',
              fullName: 'Otp User',
              role: 'USER',
              subscriptionPlan: 'FREE',
              userId: 11,
            },
          },
        }))
      })
    )

    const result = await authApi.verifyOtp({ email: 'otp@example.com', otp: '123456', purpose: 'LOGIN' })
    expect(result.success).toBe(true)
    expect(result.authResponse?.userId).toBe(11)
  })

  test('sendOtp and resendOtp return unwrapped payload', async () => {
    server.use(
      rest.post('http://localhost:8080/api/v1/auth/send-otp', (_req, res, ctx) =>
        res(ctx.json({ data: { success: true, email: 'a@b.com' } }))
      ),
      rest.post('http://localhost:8080/api/v1/auth/resend-otp', (_req, res, ctx) =>
        res(ctx.json({ success: true, email: 'a@b.com', resendCooldownSeconds: 20 }))
      )
    )

    const send = await authApi.sendOtp({ email: 'a@b.com', purpose: 'LOGIN' })
    const resend = await authApi.resendOtp({ email: 'a@b.com', purpose: 'LOGIN' })
    expect(send.success).toBe(true)
    expect(resend.resendCooldownSeconds).toBe(20)
  })

  test('login returns requiresOtp payload without profile fetch', async () => {
    server.use(
      rest.post('http://localhost:8080/api/v1/auth/login', (_req, res, ctx) =>
        res(ctx.json({ requiresOtp: true, otpEmail: 'otp@ex.com', otpPurpose: 'LOGIN', userId: 5 }))
      )
    )

    const result = await authApi.login({ email: 'otp@ex.com', password: 'secret' })
    expect(result.requiresOtp).toBe(true)
    expect(result.otpEmail).toBe('otp@ex.com')
  })

  test('login falls back when token payload is invalid and profile fails', async () => {
    server.use(
      rest.post('http://localhost:8080/api/v1/auth/login', (_req, res, ctx) =>
        res(ctx.json({ token: 'bad.token', userId: 9 }))
      ),
      rest.get('http://localhost:8080/api/v1/auth/profile', (_req, res, ctx) =>
        res(ctx.status(500))
      )
    )

    const result = await authApi.login({ email: '', password: 'secret' })
    expect(result.email).toBe('')
    expect(result.fullName).toBe('User')
    expect(result.userId).toBe(9)
  })

  test('updateProfile maps normalized fields', async () => {
    server.use(
      rest.put('http://localhost:8080/api/v1/auth/profile', (_req, res, ctx) =>
        res(ctx.json({
          userId: 42,
          fullName: 'Updated User',
          email: 'updated@ex.com',
          role: 'USER',
          subscriptionPlan: 'PREMIUM',
          isActive: true,
          isDeleted: false,
          provider: 'LOCAL',
          createdAt: '2024-01-01',
        }))
      )
    )

    const result = await authApi.updateProfile(42, { fullName: 'Updated User' })
    expect(result.userId).toBe(42)
    expect(result.subscriptionPlan).toBe('PREMIUM')
    expect(result.createdAt).toBe('2024-01-01')
  })

  test('updateSubscription maps response', async () => {
    server.use(
      rest.put('http://localhost:8080/api/v1/auth/subscription', (_req, res, ctx) =>
        res(ctx.json({ userId: 7, fullName: 'Test', email: 't@e.com', subscriptionPlan: 'PREMIUM' }))
      ),
      rest.put('http://localhost:8080/api/v1/admin/users/7/subscription', (_req, res, ctx) =>
        res(ctx.json({ userId: 7, fullName: 'Test', email: 't@e.com', subscriptionPlan: 'PREMIUM' }))
      )
    )

    const result = await authApi.updateSubscription(7, 'PREMIUM')
    const adminResult = await authApi.updateUserSubscription(7, 'PREMIUM')
    expect(result.subscriptionPlan).toBe('PREMIUM')
    expect(adminResult.userId).toBe(7)
  })
})
