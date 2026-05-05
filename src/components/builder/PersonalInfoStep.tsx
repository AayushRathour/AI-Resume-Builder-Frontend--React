import { useState, useCallback } from 'react'
import useResumeStore from '../../store/useResumeStore'
import type { PersonalInfo } from '../../store/useResumeStore'
import { validateField, type FieldError } from '../../utils/validation'
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe, Briefcase, AlertCircle, CheckCircle2 } from 'lucide-react'

// ── Field config ─────────────────────────────────────────────────────────

interface FieldConfig {
  key: keyof PersonalInfo
  label: string
  icon: any
  placeholder: string
  type?: string
  required?: boolean
  hint?: string
}

const FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Full Name', icon: User, placeholder: 'e.g. Aayush Rathour', required: true, hint: 'Letters and spaces only' },
  { key: 'title', label: 'Job Title / Headline', icon: Briefcase, placeholder: 'e.g. Software Engineer' },
  { key: 'email', label: 'Email Address', icon: Mail, placeholder: 'e.g. john@example.com', type: 'email', required: true },
  { key: 'phone', label: 'Phone Number', icon: Phone, placeholder: 'e.g. +91-9876543210', type: 'tel', hint: '10–15 digits' },
  { key: 'location', label: 'Location', icon: MapPin, placeholder: 'e.g. Mumbai, India', required: true },
  { key: 'linkedin', label: 'LinkedIn URL', icon: Linkedin, placeholder: 'e.g. https://linkedin.com/in/yourname', hint: 'Full URL with https://' },
  { key: 'github', label: 'GitHub URL', icon: Github, placeholder: 'e.g. https://github.com/yourname', hint: 'Full URL with https://' },
  { key: 'website', label: 'Website / Portfolio', icon: Globe, placeholder: 'e.g. https://yoursite.com', hint: 'Full URL with https://' },
]

// ── Component ────────────────────────────────────────────────────────────

export default function PersonalInfoStep() {
  const personal = useResumeStore((s) => s.data.personal)
  const setField = useResumeStore((s) => s.setPersonalField)

  // Track which fields have been touched (blurred)
  const [touched, setTouched] = useState<Partial<Record<keyof PersonalInfo, boolean>>>({})
  // Track live errors
  const [errors, setErrors] = useState<Partial<Record<keyof PersonalInfo, FieldError>>>({})

  const handleBlur = useCallback((key: keyof PersonalInfo) => {
    setTouched((t) => ({ ...t, [key]: true }))
    const error = validateField(key, personal[key])
    setErrors((e) => ({ ...e, [key]: error }))
  }, [personal])

  const handleChange = useCallback((key: keyof PersonalInfo, value: string) => {
    setField(key, value)
    // If already touched, re-validate on change for instant feedback
    if (touched[key]) {
      const error = validateField(key, value)
      setErrors((e) => ({ ...e, [key]: error }))
    }
  }, [setField, touched])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Personal Information</h2>
        <p className="text-sm text-slate-500">Let's start with your basic details. These appear at the top of your resume.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {FIELDS.map(({ key, label, icon: Icon, placeholder, type, required, hint }) => {
          const error = touched[key] ? errors[key] : ''
          const value = personal[key]
          const isValid = touched[key] && !error && value.trim().length > 0

          return (
            <div key={key} className={key === 'name' || key === 'title' ? 'sm:col-span-2' : ''}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {label}
                {required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              <div className="relative">
                <Icon size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${error ? 'text-red-400' : isValid ? 'text-green-500' : 'text-slate-400'}`} />
                <input
                  type={type || 'text'}
                  value={value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  onBlur={() => handleBlur(key)}
                  className={`input-field pl-10 pr-9 transition-colors ${
                    error
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                      : isValid
                        ? 'border-green-300 focus:border-green-400 focus:ring-green-200'
                        : ''
                  }`}
                  placeholder={placeholder}
                />
                {/* Status icon */}
                {touched[key] && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {error ? (
                      <AlertCircle size={16} className="text-red-400" />
                    ) : value.trim() ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : null}
                  </div>
                )}
              </div>
              {/* Error message */}
              {error && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {error}
                </p>
              )}
              {/* Hint (only when no error) */}
              {!error && hint && !isValid && (
                <p className="mt-1 text-xs text-slate-400">{hint}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
