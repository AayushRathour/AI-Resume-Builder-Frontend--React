import { useEffect } from 'react'
import { authApi } from '../api/authApi'

function decodeBase64Url(input: string) {
  const normalized = input
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(input.length + ((4 - (input.length % 4)) % 4), '=')

  return atob(normalized)
}

function decodeErrorParam(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function isAccountStateIssue(message: string) {
  return /(deactivated|suspended|disabled|deleted|account removed|not found)/i.test(message)
}

export default function OAuthSuccessPage() {
  useEffect(() => {
    const completeOAuth = async () => {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')
      const oauthError = params.get('error') || params.get('message') || params.get('error_description')

      const decodeJwtPayload = (jwt: string) => {
        try {
          const payload = jwt.split('.')[1]
          return JSON.parse(decodeBase64Url(payload)) as {
            email?: string
            fullName?: string
            name?: string
            role?: string
            subscriptionPlan?: string
            userId?: number | string
          }
        } catch {
          return {}
        }
      }

      if (oauthError) {
        const message = encodeURIComponent(decodeErrorParam(oauthError))
        window.location.href = `/login?error=${message}`
        return
      }

      if (token) {
        localStorage.setItem('resumeai_token', token)
        sessionStorage.removeItem('token')
      } else {
        window.location.href = '/login?error=Missing%20OAuth%20token'
        return
      }

      try {
        const profile = await authApi.getProfile()
        localStorage.setItem('resumeai_user', JSON.stringify(profile))
        const target = profile.role === 'ADMIN' ? '/admin' : '/dashboard'
        window.location.href = target
      } catch (err: any) {
        const backendMessage = String(err?.response?.data?.message || err?.response?.data?.error || err?.message || '')
        const status = Number(err?.response?.status || 0)
        const canFallbackFromToken = !status || status >= 500 || ((status === 401 || status === 403) && !isAccountStateIssue(backendMessage))

        // Fallback to token claims when profile endpoint is unavailable or transiently unauthorized.
        if (canFallbackFromToken && token) {
          const claims = decodeJwtPayload(token)
          const fallbackUser = {
            userId: Number(claims.userId ?? 0),
            fullName: claims.fullName || claims.name || (claims.email ? claims.email.split('@')[0] : 'User'),
            email: claims.email || '',
            role: claims.role || 'USER',
            subscriptionPlan: claims.subscriptionPlan || 'FREE',
            provider: 'GOOGLE',
            isActive: true,
            phone: '',
            createdAt: new Date().toISOString(),
          }
          localStorage.setItem('resumeai_user', JSON.stringify(fallbackUser))
          const target = fallbackUser.role === 'ADMIN' ? '/admin' : '/dashboard'
          window.location.href = target
          return
        }

        const message = backendMessage ? encodeURIComponent(String(backendMessage)) : 'OAuth%20login%20failed'
        localStorage.removeItem('token')
        localStorage.removeItem('resumeai_token')
        localStorage.removeItem('resumeai_user')
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('resumeai_token')
        sessionStorage.removeItem('resumeai_user')
        window.location.href = `/login?error=${message}`
      }
    }

    completeOAuth()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-indigo-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-medium">Completing sign-in...</p>
      </div>
    </div>
  )
}
