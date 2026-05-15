import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { paymentApi } from '../api/paymentApi'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { CheckCircle2, Zap, Shield, Sparkles } from 'lucide-react'
import { RAZORPAY_KEY_ID } from '../config/api'

export default function PricingPage() {
  const { user, isPremium, login } = useAuth()
  const navigate = useNavigate()
  const [isPaying, setIsPaying] = useState(false)

  const razorpayKeyId = RAZORPAY_KEY_ID

  const loadRazorpayScript = () => new Promise<void>((resolve, reject) => {
    if ((window as any).Razorpay) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay script'))
    document.body.appendChild(script)
  })

  const handleUpgrade = async () => {
    if (!user) {
      toast.error('Please sign in to upgrade')
      navigate('/login')
      return
    }

    if (!razorpayKeyId) {
      toast.error('Payment configuration is missing')
      return
    }

    try {
      setIsPaying(true)
      const order = await paymentApi.createOrder(59900, 'INR', 'PREMIUM')
      await loadRazorpayScript()

      const options = {
        key: order.keyId || razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'ResumeAI',
        description: 'Premium Subscription (Unlimited Features)',
        order_id: order.orderId,
        prefill: {
          name: user.fullName,
          email: user.email,
        },
        theme: {
          color: '#4f46e5',
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            toast.loading('Verifying payment...', { id: 'payment-verify' })
            const updated = await paymentApi.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            })
            login(updated)
            toast.success('Payment successful! Welcome to Premium.', { id: 'payment-verify' })
            navigate('/dashboard')
          } catch (err: any) {
            const message = err?.response?.data?.message || 'Payment verification failed'
            toast.error(message, { id: 'payment-verify' })
          }
        },
        modal: {
          ondismiss: () => setIsPaying(false),
        },
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const RazorpayCtor = (window as any).Razorpay
      const rz = new RazorpayCtor(options)
      rz.on('payment.failed', function (response: any) {
        toast.error('Payment failed. Please try again.')
      })
      rz.open()
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to initiate payment'
      toast.error(message)
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center py-16 px-4">

        <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm mb-6">
            <Sparkles size={16} /> Upgrade Your Career
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-slate-600">
            Choose the plan that best fits your needs. Build your resume, land your dream job.
          </p>
        </div>

        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">

          {/* Free Tier */}
          <div className="card p-8 md:p-10 border-2 border-transparent bg-white shadow-xl flex flex-col h-full transform transition duration-300 hover:scale-105">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Free Plan</h3>
            <p className="text-slate-500 mb-6">Perfect for getting started</p>
            <div className="mb-8">
              <span className="text-5xl font-extrabold text-slate-900">₹0</span>
              <span className="text-slate-500">/ forever</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {[
                'Create up to 3 Resumes',
                'Access to Free Templates',
                'Basic PDF Export',
                '10 AI Generations',
                'Standard Support'
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-700">
                  <CheckCircle2 size={20} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate(user ? '/dashboard' : '/register')}
              className="w-full py-3.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              {user ? 'Current Plan' : 'Get Started Free'}
            </button>
          </div>

          {/* Premium Tier */}
          <div className="card p-8 md:p-10 border-2 border-primary-500 bg-white shadow-2xl relative flex flex-col h-full transform md:-translate-y-4 transition duration-300 hover:scale-105">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1.5">
              <Zap size={14} className="fill-current" /> MOST POPULAR
            </div>

            <h3 className="text-2xl font-bold text-primary-600 mb-2">Premium Plan</h3>
            <p className="text-slate-500 mb-6">Supercharge your job search</p>
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-slate-900">₹599</span>
              <span className="text-slate-500">/ month</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {[
                'Unlimited Resumes',
                'Unlimited AI Generations',
                'Access to ALL Premium Templates',
                'Cover Letter Builder',
                'DOCX & JSON Exports',
                'Job Match Analytics',
                'Priority Support'
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-800 font-medium">
                  <CheckCircle2 size={20} className="text-primary-500 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={isPaying || isPremium}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${isPremium ? 'bg-green-500 cursor-default' : 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:shadow-primary-500/30 hover:-translate-y-1'}`}
            >
              {isPremium ? (
                <span className="flex items-center justify-center gap-2"><Shield size={20} /> Active Plan</span>
              ) : isPaying ? (
                'Processing...'
              ) : (
                'Upgrade to Premium'
              )}
            </button>
            <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
              <Shield size={12} /> Secure payments powered by Razorpay
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
