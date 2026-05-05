import { useState } from 'react'
import useResumeStore from '../../store/useResumeStore'
import { Plus, X, Zap } from 'lucide-react'

export default function SkillsStep() {
  const skills = useResumeStore((s) => s.data.skills)
  const addSkill = useResumeStore((s) => s.addSkill)
  const removeSkill = useResumeStore((s) => s.removeSkill)
  const updateSkill = useResumeStore((s) => s.updateSkill)
  const [newSkill, setNewSkill] = useState('')

  const handleAdd = () => {
    const trimmed = newSkill.trim()
    if (!trimmed) return
    // Support comma-separated input
    const items = trimmed.split(',').map(s => s.trim()).filter(Boolean)
    items.forEach(item => addSkill(item))
    setNewSkill('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Skills</h2>
        <p className="text-sm text-slate-500">Add your technical and professional skills. You can type multiple skills separated by commas.</p>
      </div>

      {/* Add skill input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Zap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input-field pl-10"
            placeholder="e.g. React, Node.js, Python (press Enter or click Add)"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!newSkill.trim()}
          className="btn-primary px-4 py-2 flex items-center gap-1.5 text-sm shrink-0"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Skills list */}
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, i) => (
            <div
              key={i}
              className="group flex items-center gap-1.5 bg-primary-50 border border-primary-200 text-primary-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:shadow-sm"
            >
              <input
                value={skill}
                onChange={(e) => updateSkill(i, e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-medium text-primary-700 w-auto min-w-[40px]"
                style={{ width: `${Math.max(40, skill.length * 8)}px` }}
              />
              <button
                onClick={() => removeSkill(i)}
                className="text-primary-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
          <Zap size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No skills added yet. Start typing above!</p>
        </div>
      )}

      <p className="text-xs text-slate-400">{skills.length} skill{skills.length !== 1 ? 's' : ''} added</p>
    </div>
  )
}
