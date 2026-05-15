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
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })

  if (isPremium) return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
      <Zap size={12} /> Unlimited AI Calls
    </div>
  )

  if (!data) return null

  const safePercent = (value: number, total: number) => {
    if (!total || total <= 0) return 0
    return Math.max(0, Math.min(100, (value / total) * 100))
  }

  const contentPct = safePercent(data.contentRemaining, data.contentAllowed)
  const atsPct = safePercent(data.atsRemaining, data.atsAllowed)

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3 overflow-hidden">
      <p className="font-semibold text-slate-700 text-sm">Monthly AI Quota</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3 text-slate-600">
          <span>AI Calls</span>
          <span className="font-medium">{data.contentRemaining}/{data.contentAllowed} left</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${contentPct}%` }}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3 text-slate-600">
          <span>ATS Checks</span>
          <span className="font-medium">{data.atsRemaining}/{data.atsAllowed} left</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${atsPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
