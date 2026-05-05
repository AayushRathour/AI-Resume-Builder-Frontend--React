/**
 * Template Engine — replaces {{placeholder}} tokens in HTML templates
 * with structured resume data from the Zustand store.
 *
 * Rules:
 * - If a field has user data → show user data
 * - If a field is empty → show blank (no dummy fallback data)
 * - Complex sections render as formatted HTML blocks
 * - Links are auto-formatted as clickable
 */
import type { ResumeData } from '../store/useResumeStore'

// ── HTML escape ──────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ── Auto-link helper ─────────────────────────────────────────────────────

function autoLink(url: string, label?: string): string {
  if (!url) return ''
  const escaped = escapeHtml(url)
  const display = label || escaped
  if (/^https?:\/\//i.test(url)) {
    return `<a href="${escaped}" target="_blank" style="color:#4f46e5;text-decoration:none;">${display}</a>`
  }
  return display
}

function buildInitials(name: string): string {
  const cleaned = (name || '').trim()
  if (!cleaned) return ''
  return cleaned
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// ── Skills renderer ──────────────────────────────────────────────────────

export function formatSkills(skills: string[]): string {
  if (!skills.length) return ''
  return `<ul style="list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:6px;margin:0;">
    ${skills.map(s => `<li style="background:#e8edf3;color:#334155;padding:4px 12px;border-radius:4px;font-size:13px;">${escapeHtml(s)}</li>`).join('')}
  </ul>`
}

// ── Experience renderer ──────────────────────────────────────────────────

export function formatExperience(items: ResumeData['experience']): string {
  if (!items.length) return ''
  return items.map(exp => `
    <div style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <strong style="font-size:14px;color:#1e293b;">${escapeHtml(exp.position)}</strong>
        <span style="font-size:12px;color:#64748b;">${escapeHtml(exp.startDate)}${exp.endDate || exp.current ? ` — ${exp.current ? 'Present' : escapeHtml(exp.endDate)}` : ''}</span>
      </div>
      <div style="font-size:13px;color:#475569;font-style:italic;">${escapeHtml(exp.company)}</div>
      ${exp.description ? `<p style="font-size:13px;color:#334155;margin:6px 0 0;white-space:pre-line;">${escapeHtml(exp.description)}</p>` : ''}
    </div>
  `).join('')
}

// ── Education renderer ───────────────────────────────────────────────────

export function formatEducation(items: ResumeData['education']): string {
  if (!items.length) return ''
  return items.map(edu => `
    <div style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <strong style="font-size:14px;color:#1e293b;">${escapeHtml(edu.degree)}${edu.field ? ` in ${escapeHtml(edu.field)}` : ''}</strong>
        <span style="font-size:12px;color:#64748b;">${escapeHtml(edu.startDate)}${edu.endDate ? ` — ${escapeHtml(edu.endDate)}` : ''}</span>
      </div>
      <div style="font-size:13px;color:#475569;font-style:italic;">${escapeHtml(edu.institution)}</div>
      ${edu.description ? `<p style="font-size:13px;color:#334155;margin:6px 0 0;white-space:pre-line;">${escapeHtml(edu.description)}</p>` : ''}
    </div>
  `).join('')
}

// ── Projects renderer ────────────────────────────────────────────────────

export function formatProjects(items: ResumeData['projects']): string {
  if (!items.length) return ''
  return items.map(proj => `
    <div style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <strong style="font-size:14px;color:#1e293b;">${escapeHtml(proj.name)}</strong>
        ${proj.link ? `<a href="${escapeHtml(proj.link)}" style="font-size:12px;color:#4f46e5;text-decoration:none;" target="_blank">Link ↗</a>` : ''}
      </div>
      ${proj.technologies ? `<div style="font-size:12px;color:#64748b;margin:2px 0;">Tech: ${escapeHtml(proj.technologies)}</div>` : ''}
      ${proj.description ? `<p style="font-size:13px;color:#334155;margin:4px 0 0;white-space:pre-line;">${escapeHtml(proj.description)}</p>` : ''}
    </div>
  `).join('')
}

// ── Main render function ─────────────────────────────────────────────────

function replaceToken(html: string, key: string, value: string): string {
  const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}|\\{\\s*${key}\\s*\\}|\\[\\[\\s*${key}\\s*\\]\\]`, 'gi')
  return html.replace(pattern, value)
}

/**
 * Renders a template by replacing all {{placeholder}} tokens with resume data.
 * Empty fields render as blank (no fallback dummy data).
 */
export function renderTemplate(htmlTemplate: string, data: ResumeData): string {
  let html = htmlTemplate

  // Remove inline scripts so sample data blocks do not override placeholders
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '')

  // Personal info — show actual data or blank
  html = replaceToken(html, 'name', escapeHtml(data.personal.name))
  html = replaceToken(html, 'initials', escapeHtml(buildInitials(data.personal.name)))
  html = replaceToken(html, 'email', escapeHtml(data.personal.email))
  html = replaceToken(html, 'phone', escapeHtml(data.personal.phone))
  html = replaceToken(html, 'location', escapeHtml(data.personal.location))
  html = replaceToken(html, 'title', escapeHtml(data.personal.title))

  // Links — auto-formatted as clickable
  html = replaceToken(html, 'linkedin', autoLink(data.personal.linkedin, 'LinkedIn'))
  html = replaceToken(html, 'github', autoLink(data.personal.github, 'GitHub'))
  html = replaceToken(html, 'website', autoLink(data.personal.website, 'Portfolio'))

  // Summary
  html = replaceToken(html, 'summary', escapeHtml(data.summary))

  // Complex sections — rendered as HTML blocks
  html = replaceToken(html, 'skills', formatSkills(data.skills))
  html = replaceToken(html, 'experience', formatExperience(data.experience))
  html = replaceToken(html, 'education', formatEducation(data.education))
  html = replaceToken(html, 'projects', formatProjects(data.projects))

  // Catch any remaining unmatched placeholders — replace with empty
  html = html.replace(/\{\{\s*[a-zA-Z_]+\s*\}\}/g, '')
  html = html.replace(/\{\s*[a-zA-Z_]+\s*\}/g, '')
  html = html.replace(/\[\[\s*[a-zA-Z_]+\s*\]\]/g, '')

  return html
}
