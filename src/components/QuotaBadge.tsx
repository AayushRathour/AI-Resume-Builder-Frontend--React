import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { aiApi } from '../api/aiApi'
import { Zap } from 'lucide-react'

export default function QuotaBadge() {
  const { user, isPremium } = useAuth()

  const { data } = useQuery({
    queryKey: ['quota', user?.userId],
    queryFn: () => aiApi.getQuota(user!.userId),
    enabled: !!user && !isPremium,
  })

  if (isPremium) return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
      <Zap size={12} /> Unlimited AI Calls
    </div>
  )

  if (!data) return null

  const contentPct = (data.contentRemaining / 5) * 100
  const atsPct = (data.atsRemaining / 3) * 100

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
      <p className="font-semibold text-slate-600">Monthly AI Quota</p>
      <div>
        <div className="flex justify-between text-slate-500 mb-1">
          <span>AI Calls</span>
          <span>{data.contentRemaining}/5 left</span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full">
          <div className="h-full bg-primary-500 rounded-full" style={{ width: `${contentPct}%` }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-slate-500 mb-1">
          <span>ATS Checks</span>
          <span>{data.atsRemaining}/3 left</span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${atsPct}%` }} />
        </div>
      </div>
    </div>
  )
}
