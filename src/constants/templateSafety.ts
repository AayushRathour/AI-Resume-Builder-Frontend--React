/**
 * RESUME TEMPLATE SAFETY UTILITIES
 * 
 * Ensures all templates render consistently within the A4 frame
 * without overflow, distortion, or layout breaks
 */

import { RESUME_DIMENSIONS } from './previewDimensions'

/**
 * Template Safety CSS Wrapper
 * Ensures no template exceeds the A4 bounds
 */
export const TEMPLATE_SAFETY_CSS = `
  /* Prevent any overflow */
  * {
    box-sizing: border-box;
  }

  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  /* Main resume container */
  body > div,
  body > main,
  body > section,
  body > article {
    max-width: ${RESUME_DIMENSIONS.WIDTH_PX}px !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Prevent images from breaking layout */
  img {
    max-width: 100%;
    height: auto;
    display: block;
  }

  /* Prevent horizontal scrolling */
  ::-webkit-scrollbar {
    display: none;
  }

  /* Prevent vertical overflow */
  body {
    max-height: ${RESUME_DIMENSIONS.HEIGHT_PX}px;
    overflow: hidden !important;
  }

  /* Fix common issues with poorly built templates */
  .page, .resume, .document, .sheet, .cv {
    width: 100% !important;
    max-width: ${RESUME_DIMENSIONS.WIDTH_PX}px !important;
    min-height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Ensure text doesn't overflow */
  p, div, span, li {
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  /* Prevent printing/page break issues */
  @media print {
    * {
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
    }
  }

  /* Fix font rendering for crisp text */
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`

/**
 * Validate resume HTML for common layout issues
 * Returns warnings/errors if found
 */
export function validateTemplateHTML(html: string): {
  isValid: boolean
  warnings: string[]
  errors: string[]
} {
  const warnings: string[] = []
  const errors: string[] = []

  // Check for fixed widths that might exceed A4
  if (html.includes('width: 100%') && html.includes('position: fixed')) {
    warnings.push('Template uses fixed positioning which might cause layout issues')
  }

  // Check for inline styles with excessive padding
  if (html.includes('padding:') && html.includes('2000px')) {
    errors.push('Template has excessive padding that will overflow')
  }

  // Check for transform scale that might distort
  if (html.includes('transform: scale') || html.includes('zoom:')) {
    warnings.push('Template uses scaling transforms which might cause distortion')
  }

  // Check for very large font sizes
  if (html.includes('font-size: 200px') || html.includes('font-size: 300px')) {
    warnings.push('Template has very large font sizes that might overflow')
  }

  // Check for table layouts that might break
  if (html.includes('<table') && !html.includes('table-layout: fixed')) {
    warnings.push('Template uses tables without fixed layout, might distort')
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  }
}

/**
 * Wrap unsafe template CSS with safety rules
 * This ensures templates don't break the preview layout
 */
export function wrapTemplateCSSWithSafety(templateCss: string): string {
  // Prepend safety CSS
  return `
    ${TEMPLATE_SAFETY_CSS}
    ${templateCss}
  `
}

/**
 * Normalize template HTML to work consistently in preview frame
 */
export function normalizeTemplateHTML(html: string): string {
  // Replace mm units with px for consistent display
  let normalized = html.replace(/210mm/g, `${RESUME_DIMENSIONS.WIDTH_PX}px`)
  normalized = normalized.replace(/297mm/g, `${RESUME_DIMENSIONS.HEIGHT_PX}px`)

  // Remove any root-level transform scale directives
  normalized = normalized.replace(/transform:\s*scale\([^)]+\)/g, '')

  // Remove conflicting width/height if on body/html
  normalized = normalized.replace(/<body[^>]*style="[^"]*width:\s*200%[^"]*"/g, '<body')

  return normalized
}
