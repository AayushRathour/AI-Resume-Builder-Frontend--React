import useResumeStore, { STEPS } from '../../store/useResumeStore'
import { User, FileText, Zap, Briefcase, GraduationCap, FolderOpen, Check } from 'lucide-react'

const ICONS: Record<string, any> = {
  User, FileText, Zap, Briefcase, GraduationCap, FolderOpen,
}

export default function StepIndicator() {
  const currentStep = useResumeStore((s) => s.currentStep)
  const setStep = useResumeStore((s) => s.setStep)

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative mb-2">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {STEPS.map((step, index) => {
          const Icon = ICONS[step.icon] || FileText
          const isActive = index === currentStep
          const isComplete = index < currentStep

          return (
            <button
              key={step.key}
              onClick={() => setStep(index)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0
                ${isActive
                  ? 'bg-primary-500 text-white shadow-sm shadow-primary-200'
                  : isComplete
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }
              `}
            >
              {isComplete ? (
                <Check size={12} className="text-green-500" />
              ) : (
                <Icon size={12} />
              )}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{index + 1}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
