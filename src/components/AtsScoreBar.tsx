interface Props { score: number | null | undefined; className?: string }

export default function AtsScoreBar({ score, className = '' }: Props) {
  if (score === null || score === undefined) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">ATS Score</span>
          <span className="font-bold text-slate-500">Not analyzed yet</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-slate-300 rounded-full transition-all duration-700" style={{ width: '0%' }} />
        </div>
      </div>
    )
  }

  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
  const textColor = score >= 75 ? 'text-green-700' : score >= 50 ? 'text-amber-700' : 'text-red-700'
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Work'

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500 font-medium">ATS Score</span>
        <span className={`font-bold ${textColor}`}>{score}/100 · {label}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}
