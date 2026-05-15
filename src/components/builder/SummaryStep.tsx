import useResumeStore from '../../store/useResumeStore'
import { FileText } from 'lucide-react'
import AiButton from './AiButton'
import { aiApi } from '../../api/aiApi'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

/**
 * Summary editor step for crafting professional profile sections.
 * Integrates AI generation and AI-based improvement actions.
 */
export default function SummaryStep() {
  const summary = useResumeStore((s) => s.data.summary)
  const setSummary = useResumeStore((s) => s.setSummary)
  const { user } = useAuth()

  const handleGenerateSummary = async () => {
    if (!user) {
      toast.error('Please log in to use AI features')
      return
    }
    const state = useResumeStore.getState()
    const jobTitle = state.data.personal.title || state.targetJobTitle || ''
    const skills = state.data.skills.join(', ')
    const yearsExp = state.data.experience.length

    if (!jobTitle && !skills) {
      toast.error('Add a job title or skills first for better AI results')
      return
    }

    const result = await aiApi.generateSummary(user.userId, 'free', jobTitle, yearsExp, skills, summary)
    if (result && result !== 'AI TEMPORARILY UNAVAILABLE') {
      setSummary(result)
      toast.success('Summary generated!')
    } else {
      throw new Error('AI is temporarily unavailable. Please try again later.')
    }
  }

  const handleImproveSummary = async () => {
    if (!user) return
    if (!summary.trim()) {
      toast.error('Write a summary first, then improve it')
      return
    }
    const result = await aiApi.improveSection(user.userId, 'free', 'summary', summary)
    if (result && result !== summary && result !== 'AI TEMPORARILY UNAVAILABLE') {
      setSummary(result)
      toast.success('Summary improved!')
    } else {
      throw new Error('AI could not improve the summary. Please try again.')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Professional Summary</h2>
        <p className="text-sm text-slate-500">Write a 2–4 sentence overview highlighting your experience, skills, and career goals.</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
            <FileText size={14} className="text-primary-500" /> Summary
          </label>
          <div className="flex items-center gap-2">
            <AiButton label="Generate with AI" onClick={handleGenerateSummary} variant="primary" />
            <AiButton label="Improve" onClick={handleImproveSummary} disabled={!summary.trim()} />
          </div>
        </div>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="input-field min-h-[180px] resize-y font-normal text-sm leading-relaxed"
          placeholder="e.g. Results-driven Software Engineer with 3+ years of experience in full-stack web development. Proficient in React, Node.js, and cloud technologies. Passionate about building scalable applications and solving complex problems..."
        />
        <div className="flex justify-between mt-1.5">
          <p className="text-xs text-slate-400">Tip: Keep it concise and tailored to the job you're applying for.</p>
          <span className="text-xs text-slate-400">{summary.length} chars</span>
        </div>
      </div>
    </div>
  )
}
