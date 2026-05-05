import { useQuery } from '@tanstack/react-query'
import { templateApi } from '../../api/templateApi'
import useResumeStore from '../../store/useResumeStore'
import type { ResumeTemplate } from '../../types'
import { Palette, Check } from 'lucide-react'

export default function TemplateSwitcher() {
  const templateId = useResumeStore((s) => s.templateId)
  const setTemplateId = useResumeStore((s) => s.setTemplateId)

  const { data: templates = [] } = useQuery({
    queryKey: ['templates-all'],
    queryFn: templateApi.getAll,
  })

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Palette size={14} className="text-primary-500" /> Switch Template
      </h3>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {/* No Template (Default) */}
        <button
          onClick={() => setTemplateId(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${
            templateId === null
              ? 'bg-primary-50 text-primary-700 font-medium border border-primary-200'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Default (No Template)</span>
          {templateId === null && <Check size={14} className="text-primary-500" />}
        </button>

        {templates
          .filter((t: ResumeTemplate) => t.isActive)
          .map((t: ResumeTemplate) => (
            <button
              key={t.templateId}
              onClick={() => setTemplateId(t.templateId)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${
                templateId === t.templateId
                  ? 'bg-primary-50 text-primary-700 font-medium border border-primary-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div>
                <span>{t.name}</span>
                {t.isPremium && (
                  <span className="ml-2 text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-medium">Premium</span>
                )}
              </div>
              {templateId === t.templateId && <Check size={14} className="text-primary-500" />}
            </button>
          ))}
      </div>
    </div>
  )
}
