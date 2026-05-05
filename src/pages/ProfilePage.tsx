import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/authApi'
import { paymentApi } from '../api/paymentApi'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { User, Lock, CreditCard, Save, Star, Zap, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function ProfilePage() {
  const { user, updateUser, isPremium, logout } = useAuth()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'subscription'>('profile')
  const [profile, setProfile] = useState({ fullName: user?.fullName || '', phone: user?.phone || '' })
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' })
  const [isPaying, setIsPaying] = useState(false)

  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined

  const { data: serverProfile } = useQuery({
    queryKey: ['profile', user?.userId],
    queryFn: authApi.getProfile,
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  useEffect(() => {
    setProfile({
      fullName: user?.fullName || '',
      phone: user?.phone || '',
    })
  }, [user?.fullName, user?.phone])

  useEffect(() => {
    if (!serverProfile) return
    updateUser(serverProfile)
    setProfile({
      fullName: serverProfile.fullName || '',
      phone: serverProfile.phone || '',
    })
  }, [serverProfile, updateUser])

  const updateProfile = useMutation({
    mutationFn: () => authApi.updateProfile(user!.userId, profile),
    onSuccess: (updated) => {
      updateUser(updated)
      setProfile({ fullName: updated.fullName, phone: updated.phone || '' })
      toast.success('Profile updated!')
    },
  })

  const changePassword = useMutation({
    mutationFn: () => authApi.changePassword(user!.userId, pwForm.oldPassword, pwForm.newPassword),
    onSuccess: () => { toast.success('Password changed!'); setPwForm({ oldPassword: '', newPassword: '', confirm: '' }) },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to change password'),
  })

  const downgradePlan = useMutation({
    mutationFn: () => authApi.updateSubscription(user!.userId, 'FREE'),
    onSuccess: (updated) => {
      updateUser(updated)
      toast.success('Plan downgraded to FREE')
    },
  })

  const loadRazorpayScript = () => new Promise<void>((resolve, reject) => {
    if ((window as any).Razorpay) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay'))
    document.body.appendChild(script)
  })

  const handleUpgrade = async () => {
    if (!razorpayKeyId) {
      toast.error('Razorpay key is missing. Please set VITE_RAZORPAY_KEY_ID.')
      return
    }
    if (!user) {
      toast.error('Please sign in to continue')
      return
    }

    try {
      setIsPaying(true)
      const order = await paymentApi.createOrder(99900, 'INR', 'PREMIUM')
      await loadRazorpayScript()

      const options = {
        key: order.keyId || razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'ResumeAI',
        description: 'Premium Plan',
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
            const updated = await paymentApi.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            })
            updateUser(updated)
            qc.invalidateQueries({ queryKey: ['profile', user.userId] })
            toast.success('Payment successful! Premium activated.')
          } catch (err: any) {
            const message = err?.response?.data?.message || 'Payment verification failed'
            toast.error(message)
          }
        },
        modal: {
          ondismiss: () => setIsPaying(false),
        },
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const RazorpayCtor = (window as any).Razorpay
      const rz = new RazorpayCtor(options)
      rz.open()
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Payment initiation failed'
      toast.error(message)
    } finally {
      setIsPaying(false)
    }
  }

  const deactivateAccount = useMutation({
    mutationFn: () => authApi.deactivateUser(user!.userId),
    onSuccess: () => {
      toast.success('Account deactivated.')
      logout()
    },
    onError: () => toast.error('Deactivation failed. Try again.'),
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-2xl">
            {user?.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{user?.fullName}</h1>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${isPremium ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
              {isPremium ? '⭐ Premium' : 'Free Plan'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6 gap-1">
          {[
            { key: 'profile', label: 'Profile', icon: User },
            { key: 'password', label: 'Password', icon: Lock },
            { key: 'subscription', label: 'Subscription', icon: CreditCard },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-slate-700">Edit Profile</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input value={profile.fullName} onChange={e => setProfile(p => ({...p, fullName: e.target.value}))}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <input value={profile.phone} onChange={e => setProfile(p => ({...p, phone: e.target.value}))}
                  className="input-field" placeholder="+91 99999 99999" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input value={user?.email} className="input-field bg-slate-50 text-slate-400" disabled />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Type</label>
              <input value={user?.provider} className="input-field bg-slate-50 text-slate-400 capitalize" disabled />
            </div>
            <button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending} className="btn-primary flex items-center gap-2">
              <Save size={14} /> {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-slate-700">Change Password</h2>
            {['Current Password', 'New Password', 'Confirm New Password'].map((label, i) => {
              const keys = ['oldPassword', 'newPassword', 'confirm'] as const
              return (
                <div key={label}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                  <input type="password" value={pwForm[keys[i]]}
                    onChange={e => setPwForm(p => ({...p, [keys[i]]: e.target.value}))}
                    className="input-field" />
                </div>
              )
            })}
            {pwForm.newPassword && pwForm.confirm && pwForm.newPassword !== pwForm.confirm && (
              <p className="text-xs text-red-500">Passwords don't match</p>
            )}
            <button onClick={() => changePassword.mutate()}
              disabled={changePassword.isPending || !pwForm.oldPassword || !pwForm.newPassword || pwForm.newPassword !== pwForm.confirm}
              className="btn-primary flex items-center gap-2">
              <Lock size={14} /> {changePassword.isPending ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <div className="card p-6 relative overflow-hidden">
              {isPremium && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full -mr-4 -mt-4" />}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{isPremium ? 'Premium Plan' : 'Free Plan'}</h3>
                  <p className="text-slate-500 text-sm">
                    {isPremium ? 'You have access to all premium features.' : 'Upgrade to Premium for unlimited resumes and advanced AI tools.'}
                  </p>
                </div>
                <div className={`p-3 rounded-2xl ${isPremium ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                  {isPremium ? <Star size={24} className="fill-amber-500" /> : <Lock size={24} />}
                </div>
              </div>
            </div>

            {!isPremium ? (
              <div className="card border-2 border-primary-500 p-6 shadow-lg shadow-primary-100">
                <div className="flex items-center gap-2 text-primary-600 font-bold mb-4">
                  <Zap size={20} /> Upgrade to Premium
                </div>
                <ul className="space-y-3 mb-6">
                  {['Unlimited Resumes', 'Unlimited AI Generations', 'Cover Letter Builder', 'DOCX & JSON Exports', 'Job Match Analytics'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 size={16} className="text-green-500" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={handleUpgrade} disabled={isPaying}
                  className="btn-primary w-full py-3 shadow-md shadow-primary-200">
                  {isPaying ? 'Opening Razorpay...' : 'Upgrade Now — ₹999/mo'}
                </button>
              </div>
            ) : (
              <div className="card p-6 border border-slate-200">
                <h4 className="font-semibold text-slate-700 mb-2">Manage Subscription</h4>
                <p className="text-sm text-slate-500 mb-4">Your premium subscription is active. You can cancel at any time.</p>
                <button onClick={() => downgradePlan.mutate()} disabled={downgradePlan.isPending}
                  className="btn-secondary text-sm">
                  Downgrade to Free
                </button>
              </div>
            )}
            
            {/* Danger Zone */}
            <div className="card p-6 border border-red-100 mt-8">
              <h4 className="font-semibold text-red-600 flex items-center gap-2 mb-2">
                <AlertTriangle size={18} /> Danger Zone
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                Deactivating your account will disable your access and hide your public resumes. This action can only be undone by an administrator.
              </p>
              <button 
                onClick={() => { if(confirm('Are you absolutely sure you want to deactivate your account?')) deactivateAccount.mutate() }}
                disabled={deactivateAccount.isPending}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                {deactivateAccount.isPending ? 'Deactivating...' : 'Deactivate Account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
