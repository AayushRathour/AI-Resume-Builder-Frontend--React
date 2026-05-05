import useResumeStore from '../../store/useResumeStore'
import { FileText } from 'lucide-react'

export default function SummaryStep() {
  const summary = useResumeStore((s) => s.data.summary)
  const setSummary = useResumeStore((s) => s.setSummary)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Professional Summary</h2>
        <p className="text-sm text-slate-500">Write a 2–4 sentence overview highlighting your experience, skills, and career goals.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
          <FileText size={14} className="text-primary-500" /> Summary
        </label>
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
