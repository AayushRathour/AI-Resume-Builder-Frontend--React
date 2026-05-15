import { useState } from 'react'
import { Sparkles, Loader2, RotateCcw, X } from 'lucide-react'

interface AiButtonProps {
  label: string
  onClick: () => Promise<void>
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  className?: string
  disabled?: boolean
}

/**
 * Reusable AI action button with loading state, error handling, and retry.
 * Used across all builder steps for AI-powered content generation.
 */
export default function AiButton({
  label,
  onClick,
  variant = 'secondary',
  size = 'sm',
  className = '',
  disabled = false,
}: AiButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setError(null)
    setLoading(true)
    try {
      await onClick()
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'AI generation failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const baseClasses = size === 'sm'
    ? 'text-xs px-3 py-1.5 rounded-lg'
    : 'text-sm px-4 py-2 rounded-lg'

  const variantClasses = {
    primary: 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600 shadow-sm',
    secondary: 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 hover:border-violet-300',
    ghost: 'text-violet-600 hover:bg-violet-50 hover:text-violet-700',
  }

  return (
    <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={`
          flex items-center gap-1.5 font-medium transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${baseClasses} ${variantClasses[variant]}
        `}
      >
        {loading ? (
          <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" />
        ) : (
          <Sparkles size={size === 'sm' ? 12 : 14} />
        )}
        {loading ? 'Generating...' : label}
      </button>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 px-2.5 py-1.5 rounded-md border border-red-100">
          <span className="truncate max-w-[200px]">{error}</span>
          <button
            onClick={handleClick}
            className="p-0.5 hover:bg-red-100 rounded transition-colors"
            title="Retry"
          >
            <RotateCcw size={10} />
          </button>
          <button
            onClick={() => setError(null)}
            className="p-0.5 hover:bg-red-100 rounded transition-colors"
            title="Dismiss"
          >
            <X size={10} />
          </button>
        </div>
      )}
    </div>
  )
}
