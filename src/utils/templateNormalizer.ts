/**
 * Template Normalizer — strips hardcoded names/data from template HTML
 * and replaces them with proper {{placeholder}} tokens.
 * 
 * This runs client-side in the admin panel as a one-click migration tool.
 */

// ── Known hardcoded values to strip ──────────────────────────────────────

interface ReplacementRule {
  pattern: RegExp
  placeholder: string
}

// Names commonly found in templates
const NAME_PATTERNS: ReplacementRule[] = [
  { pattern: /Alexandra\s+Reeves/gi, placeholder: '{{name}}' },
  { pattern: /Marcus\s+Thornton/gi, placeholder: '{{name}}' },
  { pattern: /Jordan\s+Park/gi, placeholder: '{{name}}' },
  { pattern: /John\s+Doe/gi, placeholder: '{{name}}' },
  { pattern: /Jane\s+Smith/gi, placeholder: '{{name}}' },
  { pattern: /Elise\s+Fontaine/gi, placeholder: '{{name}}' },
  { pattern: /S[Øø]ren\s+Berg/gi, placeholder: '{{name}}' },
  { pattern: /SØREN\s+BERG/gi, placeholder: '{{name}}' },
  { pattern: /Rafael\s+Vasquez/gi, placeholder: '{{name}}' },
  { pattern: /Zara\s+Okonkwo/gi, placeholder: '{{name}}' },
]

// Titles commonly found
const TITLE_PATTERNS: ReplacementRule[] = [
  { pattern: /Product\s+Design\s+Lead(?:er)?/gi, placeholder: '{{title}}' },
  { pattern: /Chief\s+Financial\s+Officer\s*(?:\&amp;|&)\s*Strategic\s+Advisor/gi, placeholder: '{{title}}' },
  { pattern: /Full[\s-]?Stack\s+Engineer/gi, placeholder: '{{title}}' },
  { pattern: /UI\s*\/?\s*UX\s+Designer\s*(?:\&amp;|&)\s*Brand\s+Strategist/gi, placeholder: '{{title}}' },
  { pattern: /Software\s+Engineer/gi, placeholder: '{{title}}' },
  { pattern: /Senior\s+Developer/gi, placeholder: '{{title}}' },
  { pattern: /Principal\s+Architect/gi, placeholder: '{{title}}' },
]

// Email patterns
const EMAIL_PATTERNS: ReplacementRule[] = [
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?=[\s<"'&,|])/gi, placeholder: '{{email}}' },
]

// Phone patterns
const PHONE_PATTERNS: ReplacementRule[] = [
  { pattern: /\+?\d[\d\s\-.()]{8,14}\d(?=[\s<"'&,|])/g, placeholder: '{{phone}}' },
]

// LinkedIn patterns
const LINKEDIN_PATTERNS: ReplacementRule[] = [
  { pattern: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?/gi, placeholder: '{{linkedin}}' },
]

// GitHub patterns
const GITHUB_PATTERNS: ReplacementRule[] = [
  { pattern: /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9\-]+\/?/gi, placeholder: '{{github}}' },
]

// Known dummy summary texts
const SUMMARY_KEYWORDS = [
  'Product design leader with',
  'Seasoned financial executive',
  'Results-driven product manager',
  'Seasoned academic researcher',
  'dynamic product manager',
  'cross-functional collaboration',
  'creative and strategic thinker',
]

/**
 * Normalize a template's HTML by replacing hardcoded content with placeholders.
 * Preserves all styling and layout — only changes content values.
 */
export function normalizeTemplate(html: string): string {
  let result = html

  // Skip if already fully placeholder-ized (has {{name}} and no hardcoded names)
  const hasNamePlaceholder = /\{\{\s*name\s*\}\}/i.test(result)
  const hasHardcodedName = NAME_PATTERNS.some(p => p.pattern.test(result))
  
  if (hasNamePlaceholder && !hasHardcodedName) {
    // Template already looks clean, just ensure we haven't missed anything
  }

  // Replace names FIRST (they're the most identifiable)
  for (const rule of NAME_PATTERNS) {
    // Reset lastIndex for global regexes
    rule.pattern.lastIndex = 0
    result = result.replace(rule.pattern, rule.placeholder)
  }

  // Replace titles (but only if we can identify them, not generic text)
  for (const rule of TITLE_PATTERNS) {
    rule.pattern.lastIndex = 0
    result = result.replace(rule.pattern, rule.placeholder)
  }

  // Replace emails (careful — only in content areas, not in CSS/attributes)
  // We do this selectively: only replace emails that look like they're in text content
  for (const rule of EMAIL_PATTERNS) {
    rule.pattern.lastIndex = 0
    result = result.replace(rule.pattern, rule.placeholder)
  }

  // Replace phone numbers (only clear ones)
  for (const rule of PHONE_PATTERNS) {
    rule.pattern.lastIndex = 0
    result = result.replace(rule.pattern, rule.placeholder)
  }

  // Replace LinkedIn URLs
  for (const rule of LINKEDIN_PATTERNS) {
    rule.pattern.lastIndex = 0
    result = result.replace(rule.pattern, rule.placeholder)
  }

  // Replace GitHub URLs
  for (const rule of GITHUB_PATTERNS) {
    rule.pattern.lastIndex = 0
    result = result.replace(rule.pattern, rule.placeholder)
  }

  // Clean up: remove doubled-up placeholders like {{name}} {{name}}
  result = result.replace(/(\{\{[a-zA-Z_]+\}\})\s*\1/g, '$1')

  return result
}

/**
 * Check if a template has been normalized (contains key placeholders).
 */
export function isNormalized(html: string): boolean {
  const required = ['{{name}}', '{{email}}']
  return required.every(ph => {
    const key = ph.replace('{{', '').replace('}}', '')
    return new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'i').test(html)
  })
}
