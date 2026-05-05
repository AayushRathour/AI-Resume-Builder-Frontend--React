import useResumeStore, { STEPS } from '../../store/useResumeStore'
import { isPersonalInfoValid } from '../../utils/validation'
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'

export default function StepNavigation() {
  const currentStep = useResumeStore((s) => s.currentStep)
  const nextStep = useResumeStore((s) => s.nextStep)
  const prevStep = useResumeStore((s) => s.prevStep)
  const personal = useResumeStore((s) => s.data.personal)

  const isFirst = currentStep === 0
  const isLast = currentStep === STEPS.length - 1

  // Validate current step before allowing Next
  const canProceed = (() => {
    const stepKey = STEPS[currentStep]?.key
    if (stepKey === 'personal') {
      return isPersonalInfoValid(personal)
    }
    return true // other steps have no hard blockers
  })()

  const handleNext = () => {
    if (!canProceed) return
    nextStep()
  }

  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
      <button
        onClick={prevStep}
        disabled={isFirst}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isFirst
            ? 'text-slate-300 cursor-not-allowed'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
        }`}
      >
        <ChevronLeft size={16} /> Previous
      </button>

      <span className="text-xs text-slate-400">
        Step {currentStep + 1} of {STEPS.length}
      </span>

      {!isLast ? (
        <button
          onClick={handleNext}
          disabled={!canProceed}
          title={!canProceed ? 'Please fix validation errors before proceeding' : ''}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !canProceed
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'btn-primary'
          }`}
        >
          {!canProceed && <AlertTriangle size={14} />}
          Next <ChevronRight size={16} />
        </button>
      ) : (
        <span className="text-xs text-slate-300 px-4 py-2">Last step</span>
      )}
    </div>
  )
}
