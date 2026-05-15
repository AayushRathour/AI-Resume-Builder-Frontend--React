import { useState } from 'react'
import useResumeStore from '../../store/useResumeStore'
import { Plus, X, Zap } from 'lucide-react'
import AiButton from './AiButton'
import { aiApi } from '../../api/aiApi'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

/**
 * Skills step for manual skill curation and AI-assisted skill suggestions.
 */
export default function SkillsStep() {
  const skills = useResumeStore((s) => s.data.skills)
  const addSkill = useResumeStore((s) => s.addSkill)
  const removeSkill = useResumeStore((s) => s.removeSkill)
  const updateSkill = useResumeStore((s) => s.updateSkill)
  const [newSkill, setNewSkill] = useState('')
  
  const { user } = useAuth()
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([])

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

  const handleSuggestSkills = async () => {
    if (!user) {
      toast.error('Please log in to use AI features')
      return
    }
    const state = useResumeStore.getState()
    const jobTitle = state.data.personal.title || state.targetJobTitle || ''

    if (!jobTitle) {
      toast.error('Please add a target job title in Personal Info first.')
      return
    }

    const currentSkills = skills.join(', ')
    const suggestions = await aiApi.suggestSkills(user.userId, jobTitle, currentSkills)
    if (suggestions && suggestions.length > 0 && suggestions[0] !== 'AI TEMPORARILY UNAVAILABLE') {
      // Filter out skills we already have
      const existing = new Set(skills.map(s => s.toLowerCase()))
      const newSuggestions = suggestions.filter(s => !existing.has(s.toLowerCase()))
      
      if (newSuggestions.length === 0) {
        toast.success('You already have all the recommended skills!')
      } else {
        setSuggestedSkills(newSuggestions.slice(0, 10)) // Show up to 10
        toast.success('Skills suggested!')
      }
    } else {
      throw new Error('AI could not suggest skills. Please try again.')
    }
  }

  const handleAddSuggested = (skill: string) => {
    addSkill(skill)
    setSuggestedSkills(prev => prev.filter(s => s !== skill))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Skills</h2>
          <p className="text-sm text-slate-500">Add your technical and professional skills. You can type multiple skills separated by commas.</p>
        </div>
        <AiButton label="Suggest Skills" onClick={handleSuggestSkills} variant="primary" />
      </div>

      {/* Suggested Skills */}
      {suggestedSkills.length > 0 && (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 animate-fade-in">
          <h3 className="text-sm font-medium text-primary-800 mb-2 flex items-center gap-1.5">
            <Zap size={14} className="text-primary-500" /> AI Suggestions
          </h3>
          <div className="flex flex-wrap gap-2">
            {suggestedSkills.map((skill, i) => (
              <button
                key={i}
                onClick={() => handleAddSuggested(skill)}
                className="group flex items-center gap-1 bg-white border border-primary-200 text-primary-700 hover:bg-primary-500 hover:text-white px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              >
                <Plus size={12} className="text-primary-400 group-hover:text-white" />
                {skill}
              </button>
            ))}
          </div>
        </div>
      )}

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
              className="group flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:border-slate-300"
            >
              <input
                value={skill}
                onChange={(e) => updateSkill(i, e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 w-auto min-w-[40px]"
                style={{ width: `${Math.max(40, skill.length * 8)}px` }}
              />
              <button
                onClick={() => removeSkill(i)}
                className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
