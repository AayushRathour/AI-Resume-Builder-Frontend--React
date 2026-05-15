import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/authApi'
import { sendOtpEmail } from '../api/emailService'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { FileText, Shield, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, Clock, Lock } from 'lucide-react'

interface OtpLocationState {
  email: string
  name: string
  purpose: string // REGISTER | LOGIN
}

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 30 // seconds
const EXPIRY_DURATION = 300 // 5 minutes in seconds

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const state = location.state as OtpLocationState | null
  const email = state?.email || ''
  const name = state?.name || 'User'
  const purpose = state?.purpose || 'LOGIN'

  // OTP input state
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // UI state
  const [isVerified, setIsVerified] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN)
  const [expiryTimer, setExpiryTimer] = useState(EXPIRY_DURATION)
  const [isResending, setIsResending] = useState(false)

  // Mask email for display
  const maskedEmail = email ? email.replace(
    /^(.{2})(.*)(@.*)$/,
    (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c
  ) : ''

  // Redirect if no state
  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true })
    }
  }, [email, navigate])

  // Initial OTP was already sent during register/login - no need to resend here.
  // This page only handles verification and resend.

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // OTP expiry timer
  useEffect(() => {
    if (expiryTimer <= 0 || isVerified) return
    const timer = setInterval(() => {
      setExpiryTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [expiryTimer, isVerified])

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Verify OTP mutation
  const verifyMutation = useMutation({
    mutationFn: authApi.verifyOtp,
    onSuccess: (data) => {
      if (data.success && data.authResponse) {
        setIsVerified(true)
        toast.success('Email verified successfully!')

        // Complete login after a brief success animation
        setTimeout(() => {
          login(data.authResponse!)
          const target = data.authResponse!.role === 'ADMIN' ? '/admin' : '/dashboard'
          navigate(target, { replace: true })
        }, 1500)
      } else {
        toast.error(data.message || 'Verification failed')
        // Clear OTP inputs on failure
        setOtp(Array(OTP_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Verification failed')
      setOtp(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    },
  })

  // Handle OTP input change
  const handleChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Only digits

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits entered
    const fullOtp = newOtp.join('')
    if (fullOtp.length === OTP_LENGTH && newOtp.every(d => d !== '')) {
      verifyMutation.mutate({ email, otp: fullOtp, purpose })
    }
  }, [otp, email, purpose, verifyMutation])

  // Handle backspace
  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }, [otp])

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return

    const newOtp = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((char, i) => { newOtp[i] = char })
    setOtp(newOtp)

    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIndex]?.focus()

    // Auto-submit if full
    if (pasted.length === OTP_LENGTH) {
      verifyMutation.mutate({ email, otp: pasted, purpose })
    }
  }, [email, purpose, verifyMutation])

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return

    setIsResending(true)
    try {
      const response = await authApi.resendOtp({ email, purpose })
      if (response.success) {
        const targetEmail = response.email || email
        const targetName = response.name || name || 'User'

        if (!targetEmail || !response.rawOtp) {
          toast.error('Failed to send OTP: invalid response from server')
          return
        }

        const sent = await sendOtpEmail({
          email: targetEmail,
          name: targetName,
          otp: response.rawOtp,
        })

        if (!sent) {
          toast.error('OTP generated but email sending failed. Please try resend again.')
        } else {
          toast.success('New verification code sent!')
        }
        setResendCooldown(response.resendCooldownSeconds || RESEND_COOLDOWN)
        setExpiryTimer(EXPIRY_DURATION)
        setOtp(Array(OTP_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
      } else {
        toast.error(response.message || 'Failed to resend code')
        if (response.resendCooldownSeconds) {
          setResendCooldown(response.resendCooldownSeconds)
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend code')
    } finally {
      setIsResending(false)
    }
  }

  // Format timer display
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // If verified, show success state
  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Email Verified!</h1>
          <p className="text-slate-500 text-sm">Redirecting to your dashboard...</p>
          <div className="mt-6 flex justify-center">
            <div className="w-8 h-8 border-3 border-t-transparent border-primary-600 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <span className="font-bold text-2xl text-primary-700">ResumeAI</span>
          </Link>

          <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
            <Shield size={28} className="text-indigo-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-800">Verify your email</h1>
          <p className="text-slate-500 text-sm mt-2">
            We've sent a {OTP_LENGTH}-digit verification code to
          </p>
          <p className="text-primary-600 font-medium text-sm mt-1">{maskedEmail}</p>
        </div>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={verifyMutation.isPending || expiryTimer <= 0}
              className={`
                w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none
                transition-all duration-200
                ${digit
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-slate-200 bg-white text-slate-800'
                }
                ${verifyMutation.isPending ? 'opacity-50' : ''}
                focus:border-primary-500 focus:ring-2 focus:ring-primary-200
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
              style={{ caretColor: 'transparent' }}
              id={`otp-input-${index}`}
            />
          ))}
        </div>

        {/* Expiry Timer */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Clock size={14} className={expiryTimer <= 60 ? 'text-red-500' : 'text-slate-400'} />
          <span className={`text-sm font-medium ${expiryTimer <= 60 ? 'text-red-500' : 'text-slate-500'}`}>
            {expiryTimer > 0
              ? `Code expires in ${formatTime(expiryTimer)}`
              : 'Code expired - request a new one'
            }
          </span>
        </div>

        {/* Loading State */}
        {verifyMutation.isPending && (
          <div className="flex items-center justify-center gap-2 mb-4 py-3 bg-primary-50 rounded-xl">
            <div className="w-5 h-5 border-2 border-t-transparent border-primary-600 rounded-full animate-spin" />
            <span className="text-sm font-medium text-primary-700">Verifying...</span>
          </div>
        )}

        {/* Error State */}
        {verifyMutation.isError && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span className="text-sm text-red-700">
              {(verifyMutation.error as any)?.response?.data?.message || 'Verification failed. Please try again.'}
            </span>
          </div>
        )}

        {/* Resend Section */}
        <div className="text-center mb-6">
          <p className="text-sm text-slate-500 mb-2">Didn't receive the code?</p>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className={`
              inline-flex items-center gap-2 text-sm font-medium
              transition-colors duration-200
              ${resendCooldown > 0 || isResending
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-primary-600 hover:text-primary-700 cursor-pointer'
              }
            `}
          >
            <RefreshCw size={14} className={isResending ? 'animate-spin' : ''} />
            {isResending
              ? 'Sending...'
              : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend code'
            }
          </button>
        </div>

        {/* Security Notice */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-2">
            <Lock size={14} className="text-slate-400 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-500 space-y-1">
              <p>For your security:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                <li>Never share this code with anyone</li>
                <li>ResumeAI will never ask for your code</li>
                <li>This code can only be used once</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <Link
            to={purpose === 'REGISTER' ? '/register' : '/login'}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to {purpose === 'REGISTER' ? 'sign up' : 'sign in'}
          </Link>
        </div>
      </div>
    </div>
  )
}

