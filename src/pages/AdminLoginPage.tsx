import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Shield, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../api/authApi'
import { sendOtpEmail } from '../api/emailService'
import { useAuth } from '../context/AuthContext'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { login, logout } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
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

      if (data.role !== 'ADMIN') {
        logout()
        toast.error('Admin access required for this login.')
        return
      }

      login(data)
      toast.success('Admin login successful')
      navigate('/admin')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Invalid credentials')
    },
  })

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/20 text-red-400">
            <Shield size={22} />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Sign In</h1>
          <p className="mt-1 text-sm text-slate-400">Only admin users can continue</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate(form)
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 pr-10 text-sm text-white outline-none focus:border-red-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {mutation.isPending ? 'Signing in...' : 'Sign In as Admin'}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-400">
          Regular user login? <Link to="/login" className="text-slate-200 hover:text-white">Go to user login</Link>
        </div>
      </div>
    </div>
  )
}
