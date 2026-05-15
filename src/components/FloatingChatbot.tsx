import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Sparkles, Bot, User, Loader2, Trash2, Briefcase, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { aiApi } from '../api/aiApi'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type PanelMode = 'chat' | 'tailor'

const SUGGESTIONS = [
  'How do I write a strong resume summary?',
  'Tips for ATS-optimized resumes',
  'What skills should a Software Engineer list?',
  'How to tailor my resume for a job?',
  'What is a good ATS score?',
  'Cover letter writing tips',
]

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `👋 Hi! I'm **ResumeAI Assistant**.

I can help with:
• ✍️ Writing resume sections
• 🎯 ATS optimization tips
• 💼 Career advice & job search
• 📝 Cover letter guidance

Ask me anything!`,
  timestamp: new Date(),
}

export default function FloatingChatbot() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<PanelMode>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)

  // Tailor mode state
  const [tailorJd, setTailorJd] = useState('')
  const [tailorResult, setTailorResult] = useState<string | null>(null)
  const [tailorLoading, setTailorLoading] = useState(false)

  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scroll = useCallback(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [])
  useEffect(() => { scroll() }, [messages, scroll])
  useEffect(() => { if (open) inputRef.current?.focus() }, [open])

  /* ── Chat AI ─────────────────────────────────────────── */
  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text.trim(), timestamp: new Date() }
    setMessages(p => [...p, userMsg])
    setInput('')
    setShowSuggestions(false)
    setLoading(true)

    try {
      // Use the new proper chat endpoint
      const context = `User is currently on the platform. Mode: ${mode}. App features: Resume Builder, ATS Checker, Job Match, AI Suggestions.`
      const aiText = await aiApi.chat(user?.userId || 0, text.trim(), context)
      
      setMessages(p => [...p, { id: `a-${Date.now()}`, role: 'assistant', content: aiText, timestamp: new Date() }])
    } catch (err: any) {
      console.error('Chat error:', err)
      setMessages(p => [...p, { id: `e-${Date.now()}`, role: 'assistant', content: '⚠️ AI service is temporarily unavailable. Please try again shortly.', timestamp: new Date() }])
    } finally {
      setLoading(false)
    }
  }

  /* ── Tailor ──────────────────────────────────────────── */
  const handleTailor = async () => {
    if (!tailorJd.trim() || tailorLoading) return
    setTailorLoading(true)
    setTailorResult(null)
    try {
      const res = await api.post('/ai/summary', {
        jobTitle: 'Resume Tailor',
        yearsOfExperience: '0',
        keySkills: '',
        additionalContext: `You are a resume optimization expert. Analyze this job description and provide 5 specific, actionable suggestions to tailor a resume for this role. Focus on keywords, skills, and phrasing changes.\n\nJob Description:\n${tailorJd.trim()}`,
      }, { params: { userId: user?.userId || 0 } })
      setTailorResult(res.data?.data?.text || res.data?.text || 'Could not generate suggestions.')
    } catch {
      setTailorResult('⚠️ AI service unavailable. Please try again.')
    } finally {
      setTailorLoading(false)
    }
  }

  const fmt = (s: string) =>
    s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
     .replace(/\n- /g, '\n• ')
     .replace(/\n/g, '<br/>')

  /* ── Render ──────────────────────────────────────────── */
  return (
    <>
      {/* Toggle button — bottom-right, above any scrollbar */}
      <button
        onClick={() => setOpen(o => !o)}
        id="chatbot-toggle"
        aria-label="Toggle AI Assistant"
        className="fixed z-[9999] flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: open ? '#334155' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          boxShadow: open ? '0 4px 12px rgba(0,0,0,.2)' : '0 8px 28px rgba(79,70,229,.45)',
        }}
      >
        {open ? <X size={22} color="#fff" /> : (
          <div className="relative">
            <MessageCircle size={24} color="#fff" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white animate-pulse" style={{ background: '#34d399' }} />
          </div>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed flex flex-col overflow-hidden"
          style={{
            bottom: 92,
            right: 24,
            width: 370,
            maxHeight: 520,
            borderRadius: 16,
            background: '#fff',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.06)',
            zIndex: 9998,
            animation: 'chatSlideUp .25s ease-out',
          }}
        >
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', padding: '14px 16px', flexShrink: 0 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {mode === 'tailor' && (
                  <button onClick={() => setMode('chat')} className="text-white/70 hover:text-white mr-1"><ArrowLeft size={16} /></button>
                )}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,.2)' }}>
                  {mode === 'chat' ? <Bot size={18} color="#fff" /> : <Briefcase size={18} color="#fff" />}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-tight">
                    {mode === 'chat' ? 'ResumeAI Assistant' : 'Tailor Resume'}
                  </p>
                  <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,.65)' }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#34d399' }} />
                    {mode === 'chat' ? 'Online • AI Powered' : 'Paste a job description'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {mode === 'chat' && (
                  <button onClick={() => setMode('tailor')} title="Tailor Resume" className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                    <Briefcase size={14} />
                  </button>
                )}
                <button onClick={() => { setMessages([WELCOME]); setShowSuggestions(true) }} title="Clear chat" className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>

          {mode === 'chat' ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 180, maxHeight: 340 }}>
                {messages.map(m => (
                  <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-indigo-100 text-indigo-600' : ''}`}
                      style={m.role === 'assistant' ? { background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff' } : {}}>
                      {m.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                    </div>
                    <div className={`max-w-[270px] px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md'
                        : 'bg-slate-100 text-slate-700 rounded-2xl rounded-bl-md'
                    }`}>
                      <div dangerouslySetInnerHTML={{ __html: fmt(m.content) }} />
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                      <Sparkles size={14} color="#fff" />
                    </div>
                    <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Suggestions */}
              {showSuggestions && messages.length <= 1 && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-slate-400 mb-1.5 font-medium">Quick questions:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s, i) => (
                      <button key={i} onClick={() => send(s)}
                        className="text-xs px-2.5 py-1.5 rounded-full bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form 
                aria-label="chat-form"
                onSubmit={e => { e.preventDefault(); send(input) }} 
                className="border-t border-slate-100 p-3 flex items-center gap-2 shrink-0"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={user ? 'Ask me anything...' : 'Log in to chat'}
                  disabled={!user || loading}
                  id="chatbot-input"
                  className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-slate-400 disabled:opacity-50"
                />
                <button type="submit" disabled={!input.trim() || loading || !user} id="chatbot-send"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-40 hover:shadow-lg transition-all shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </>
          ) : (
            /* Tailor Mode */
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-slate-600 mb-3">
                Paste a job description below to get AI-powered suggestions for tailoring your resume.
              </p>
              <textarea
                value={tailorJd}
                onChange={e => setTailorJd(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-slate-400 mb-3"
              />
              <button
                onClick={handleTailor}
                disabled={tailorLoading || !tailorJd.trim() || !user}
                className="w-full py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
              >
                {tailorLoading ? <Loader2 size={16} className="animate-spin" /> : <Briefcase size={16} />}
                {tailorLoading ? 'Analyzing...' : 'Get Tailoring Tips'}
              </button>
              {tailorResult && (
                <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-900 whitespace-pre-wrap leading-relaxed">
                  <div dangerouslySetInnerHTML={{ __html: fmt(tailorResult) }} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);   }
        }
      `}</style>
    </>
  )
}
