import { useState } from 'react'
import { Sparkles, X, Briefcase, FileText, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import useResumeStore from '../../store/useResumeStore'
import { useAuth } from '../../context/AuthContext'
import { aiApi } from '../../api/aiApi'
import toast from 'react-hot-toast'

export default function AiAssistantPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState('')

  const store = useResumeStore()
  const { user } = useAuth()

  const handleTailor = async () => {
    if (!user) {
      toast.error('Please log in to use AI features')
      return
    }
    if (!jobDescription.trim()) {
      toast.error('Please paste a job description first')
      return
    }

    setLoading(true)
    setResult(null)
    try {
      const resumeJson = store.toSectionsJson()
      const res = await aiApi.tailorForJob(user.userId, 'free', resumeJson, jobDescription)
      setResult(res)
      toast.success('Resume tailored!')
    } catch (err: any) {
      toast.error('AI is temporarily unavailable.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[350px] mb-4 overflow-hidden animate-fade-in flex flex-col max-h-[500px]">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 flex items-center justify-between text-white">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles size={18} /> AI Assistant
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            <p className="text-sm text-slate-600 mb-4">
              Paste a job description to get tailored suggestions for your resume.
            </p>
            
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste Job Description here..."
              className="w-full input-field min-h-[120px] text-sm resize-y mb-4"
            />

            <button
              onClick={handleTailor}
              disabled={loading || !jobDescription.trim()}
              className="w-full btn-primary flex items-center justify-center gap-2 py-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Briefcase size={16} />}
              {loading ? 'Analyzing...' : 'Tailor Resume'}
            </button>

            {result && (
              <div className="mt-4 p-3 bg-violet-50 border border-violet-100 rounded-xl text-sm text-violet-900 whitespace-pre-wrap">
                <h4 className="font-medium flex items-center gap-1 mb-2">
                  <FileText size={14} /> AI Recommendations
                </h4>
                {result}
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 px-5 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2.5 font-medium group"
      >
        <Sparkles size={20} className="text-violet-400 group-hover:animate-pulse" />
        Ask AI
        {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
    </div>
  )
}
