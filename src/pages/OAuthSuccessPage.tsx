import { useEffect } from 'react'
import { authApi } from '../api/authApi'

export default function OAuthSuccessPage() {
  useEffect(() => {
    const completeOAuth = async () => {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')

      const decodeJwtPayload = (jwt: string) => {
        try {
          const payload = jwt.split('.')[1]
          return JSON.parse(atob(payload)) as {
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

      if (token) {
        localStorage.setItem('token', token)
        localStorage.setItem('resumeai_token', token)
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
        // Fallback to token claims when profile endpoint is unavailable.
        if ((!err?.response || err?.response?.status >= 500) && token) {
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

        const backendMessage = err?.response?.data?.message || err?.response?.data?.error || err?.message
        const message = backendMessage ? encodeURIComponent(String(backendMessage)) : 'OAuth%20login%20failed'
        localStorage.removeItem('token')
        localStorage.removeItem('resumeai_token')
        localStorage.removeItem('resumeai_user')
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
