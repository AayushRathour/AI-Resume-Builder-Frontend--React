import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { FileText, Eye, EyeOff } from 'lucide-react'
import { OAUTH_BASE } from '../config/api'
import { sendOtpEmail } from '../api/emailService'

const OAUTH_RETRY_FLAG = 'resumeai_oauth_retry_once'

function decodeErrorParam(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function looksLikeBlockedByClient(message: string) {
  return /(err_blocked_by_client|blocked by client|generate_204)/i.test(message)
}

function looksLikeStaleSession(message: string) {
  return /(session invalid|invalid session|account removed)/i.test(message)
}

function getFriendlyOAuthError(rawMessage: string) {
  if (looksLikeBlockedByClient(rawMessage)) {
    return 'Google sign-in was blocked by a browser extension. Disable ad/privacy blocking for this site and try again.'
  }

  if (looksLikeStaleSession(rawMessage)) {
    return 'Your sign-in session expired. Please try Google sign-in again.'
  }

  return rawMessage || 'OAuth login failed'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const handledOauthError = useRef(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      // Check if OTP verification is required
      if (data.requiresOtp) {
        const targetEmail = data.otpEmail || data.email
        const targetName = data.userName || data.fullName || 'User'

        if (!targetEmail) {
          toast.error('Could not start OTP verification. Please try again.')
          return
        }

        if (data.rawOtp) {
          const sent = await sendOtpEmail({
            email: targetEmail,
            name: targetName,
            otp: data.rawOtp,
          })

          if (!sent) {
            toast.error('Failed to send verification email automatically. Use resend on the OTP page.')
          } else {
            toast.success('Verification code sent to your email!')
          }
        } else {
          toast.error('Verification code could not be sent automatically. Use resend on the OTP page.')
        }

        navigate('/verify-otp', {
          state: {
            email: targetEmail,
            name: targetName,
            purpose: data.otpPurpose || 'LOGIN',
          },
          replace: true,
        })
        return
      }

      // Normal login (e.g., if OTP was already verified or admin)
      login(data)
      toast.success(`Welcome back, ${data.fullName}!`)
      navigate(data.role === 'ADMIN' ? '/admin' : '/dashboard')
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Invalid credentials'),
  })

  const handleGoogleLogin = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('resumeai_token')
    localStorage.removeItem('resumeai_user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('resumeai_token')
    sessionStorage.removeItem('resumeai_user')
    window.location.href = `${OAUTH_BASE}/oauth2/authorization/google`
  }

  useEffect(() => {
    if (handledOauthError.current) return
    const oauthError = searchParams.get('error')
    if (oauthError) {
      handledOauthError.current = true
      const decoded = decodeErrorParam(oauthError)
      const shouldRetry = looksLikeStaleSession(decoded) && sessionStorage.getItem(OAUTH_RETRY_FLAG) !== '1'

      if (shouldRetry) {
        sessionStorage.setItem(OAUTH_RETRY_FLAG, '1')
        toast('Session looked stale. Retrying Google sign-in once...')
        setTimeout(() => handleGoogleLogin(), 300)
        return
      }

      sessionStorage.removeItem(OAUTH_RETRY_FLAG)
      toast.error(getFriendlyOAuthError(decoded))
      navigate('/login', { replace: true })
    }
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <span className="font-bold text-2xl text-primary-700">ResumeAI</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form) }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="input-field"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input-field pr-10"
                placeholder="********"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-2.5 text-sm mt-2">
            {mutation.isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">Or continue with</span></div>
          </div>
          <div className="mt-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">Sign up free</Link>
        </p>
      </div>
    </div>
  )
}
