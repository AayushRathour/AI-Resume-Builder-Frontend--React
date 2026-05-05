/**
 * Resume field validation utilities.
 * Each validator returns an error message string or empty string if valid.
 */
import type { PersonalInfo } from '../store/useResumeStore'

// ── Regex patterns ───────────────────────────────────────────────────────

const PATTERNS = {
  name: /^[A-Za-z\s]{2,50}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-+()]{10,15}$/,
  linkedin: /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$/,
  github: /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9\-]+\/?$/,
  website: /^https?:\/\/.+$/,
} as const

// ── Field validators ─────────────────────────────────────────────────────

export type FieldError = string // empty = valid

export function validateName(value: string): FieldError {
  if (!value.trim()) return 'Name is required'
  if (!PATTERNS.name.test(value.trim())) return 'Only letters and spaces allowed (2–50 chars)'
  return ''
}

export function validateEmail(value: string): FieldError {
  if (!value.trim()) return 'Email is required'
  if (!PATTERNS.email.test(value.trim())) return 'Enter a valid email address'
  return ''
}

export function validatePhone(value: string): FieldError {
  if (!value.trim()) return '' // optional
  if (!PATTERNS.phone.test(value.replace(/[\s\-+()]/g, '').length >= 10 ? value : ''))
    return 'Enter 10–15 digits (e.g. +91-9876543210)'
  // simpler check: strip non-digits and check length
  const digits = value.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) return 'Phone must be 10–15 digits'
  return ''
}

export function validateLocation(value: string): FieldError {
  if (!value.trim()) return 'Location is required'
  if (value.trim().length < 2) return 'Location must be at least 2 characters'
  return ''
}

export function validateLinkedin(value: string): FieldError {
  if (!value.trim()) return '' // optional
  if (!PATTERNS.linkedin.test(value.trim())) return 'Enter a valid LinkedIn URL (https://linkedin.com/in/...)'
  return ''
}

export function validateGithub(value: string): FieldError {
  if (!value.trim()) return '' // optional
  if (!PATTERNS.github.test(value.trim())) return 'Enter a valid GitHub URL (https://github.com/...)'
  return ''
}

export function validateWebsite(value: string): FieldError {
  if (!value.trim()) return '' // optional
  if (!PATTERNS.website.test(value.trim())) return 'Enter a valid URL starting with http:// or https://'
  return ''
}

// ── Validator map (keyed by PersonalInfo field) ──────────────────────────

const validators: Record<keyof PersonalInfo, (v: string) => FieldError> = {
  name: validateName,
  title: () => '', // no strict validation, free text
  email: validateEmail,
  phone: validatePhone,
  location: validateLocation,
  linkedin: validateLinkedin,
  github: validateGithub,
  website: validateWebsite,
}

/**
 * Validate a single personal info field.
 */
export function validateField(field: keyof PersonalInfo, value: string): FieldError {
  return validators[field](value)
}

/**
 * Validate ALL personal info fields.
 * Returns a map of field → error message (only fields with errors).
 */
export function validatePersonalInfo(personal: PersonalInfo): Partial<Record<keyof PersonalInfo, FieldError>> {
  const errors: Partial<Record<keyof PersonalInfo, FieldError>> = {}
  for (const [key, val] of Object.entries(personal)) {
    const error = validateField(key as keyof PersonalInfo, val)
    if (error) errors[key as keyof PersonalInfo] = error
  }
  return errors
}

/**
 * Check if personal info step has any validation errors.
 */
export function isPersonalInfoValid(personal: PersonalInfo): boolean {
  const errors = validatePersonalInfo(personal)
  return Object.keys(errors).length === 0
}

// ── Template validation ──────────────────────────────────────────────────

const REQUIRED_PLACEHOLDERS = ['{{name}}', '{{email}}']
const ALL_PLACEHOLDERS = [
  '{{name}}', '{{title}}', '{{email}}', '{{phone}}',
  '{{location}}', '{{linkedin}}', '{{github}}', '{{website}}',
  '{{summary}}', '{{skills}}', '{{experience}}', '{{education}}', '{{projects}}'
]

// Common hardcoded names that indicate template isn't properly placeholder-ized
const HARDCODED_PATTERNS = [
  /Alexandra\s+Reeves/i,
  /Marcus\s+Thornton/i,
  /Jordan\s+Park/i,
  /John\s+Doe/i,
  /Elise\s+Fontaine/i,
  /Soren\s+Berg/i,
  /Rafael\s+V/i,
  /Zara\s+Okonkwo/i,
  /Jane\s+Smith/i,
]

export interface TemplateValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  missingPlaceholders: string[]
  foundPlaceholders: string[]
  hasHardcodedNames: boolean
}

/**
 * Validate a template HTML string.
 */
export function validateTemplate(html: string): TemplateValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const lowerHtml = html.toLowerCase()

  // Check required placeholders
  const missingPlaceholders: string[] = []
  const foundPlaceholders: string[] = []

  for (const ph of ALL_PLACEHOLDERS) {
    // Match with optional spaces: {{ name }} or {{name}}
    const key = ph.replace('{{', '').replace('}}', '')
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'i')
    if (regex.test(html)) {
      foundPlaceholders.push(ph)
    } else {
      missingPlaceholders.push(ph)
    }
  }

  // Required ones are hard errors
  for (const req of REQUIRED_PLACEHOLDERS) {
    const key = req.replace('{{', '').replace('}}', '')
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'i')
    if (!regex.test(html)) {
      errors.push(`Missing required placeholder: ${req}`)
    }
  }

  // Check for hardcoded names
  let hasHardcodedNames = false
  for (const pattern of HARDCODED_PATTERNS) {
    if (pattern.test(html)) {
      hasHardcodedNames = true
      warnings.push(`Contains hardcoded name: "${html.match(pattern)?.[0]}". Replace with {{name}}.`)
    }
  }

  // Check for valid HTML (basic)
  if (!html.includes('<') || !html.includes('>')) {
    errors.push('Template must contain valid HTML')
  }

  // Warn about missing recommended placeholders
  const recommended = ['{{skills}}', '{{experience}}', '{{education}}']
  for (const rec of recommended) {
    if (!foundPlaceholders.includes(rec)) {
      warnings.push(`Recommended placeholder missing: ${rec}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingPlaceholders,
    foundPlaceholders,
    hasHardcodedNames,
  }
}
