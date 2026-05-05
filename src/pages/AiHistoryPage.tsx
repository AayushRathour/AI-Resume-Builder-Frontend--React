import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { aiApi } from '../api/aiApi'
import type { AiRequest } from '../types'
import Navbar from '../components/Navbar'
import { Zap, Clock } from 'lucide-react'

const typeColors: Record<string, string> = {
  SUMMARY: 'bg-blue-100 text-blue-700',
  BULLETS: 'bg-purple-100 text-purple-700',
  ATS: 'bg-green-100 text-green-700',
  COVER_LETTER: 'bg-indigo-100 text-indigo-700',
  IMPROVE: 'bg-amber-100 text-amber-700',
  TAILOR: 'bg-rose-100 text-rose-700',
  TRANSLATE: 'bg-teal-100 text-teal-700',
  SKILLS: 'bg-orange-100 text-orange-700',
}

export default function AiHistoryPage() {
  const { user, isPremium } = useAuth()

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['ai-history', user?.userId],
    queryFn: () => aiApi.getHistory(user!.userId),
    enabled: !!user && isPremium,
  })

  if (!isPremium) return (
    <div className="min-h-screen bg-slate-50"><Navbar />
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-slate-400">
        <Zap size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium text-slate-600">AI History requires Premium</p>
        <a href="/profile" className="btn-primary mt-4 inline-block">Upgrade to Premium</a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Zap size={22} className="text-purple-500" /> AI Request History
          </h1>
          <p className="text-slate-500 text-sm mt-1">{history.length} total AI calls made</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />)}</div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Zap size={40} className="mx-auto mb-3 opacity-30" />
            <p>No AI requests yet. Use AI tools in the builder to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((req: AiRequest) => (
              <div key={req.requestId} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[req.requestType] || 'bg-slate-100 text-slate-600'}`}>
                        {req.requestType}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${req.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : req.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {req.status}
                      </span>
                      <span className="text-xs text-slate-400">{req.model}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-1">{req.inputPrompt}</p>
                    {req.aiResponse && (
                      <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded line-clamp-2">{req.aiResponse}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                      <Clock size={10} /> {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                    {req.tokensUsed && (
                      <p className="text-xs text-primary-500 font-medium mt-1">{req.tokensUsed} tokens</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
