import { TEMPLATE_SAFETY_CSS, normalizeTemplateHTML, validateTemplateHTML, wrapTemplateCSSWithSafety } from '../templateSafety'
import { RESUME_DIMENSIONS } from '../previewDimensions'

describe('templateSafety', () => {
  test('validateTemplateHTML flags warnings and errors', () => {
    const html = '<div style="width: 100%; position: fixed"></div><div style="padding: 2000px"></div><div style="transform: scale(2)"></div><div style="font-size: 300px"></div><table></table>'
    const result = validateTemplateHTML(html)
    expect(result.isValid).toBe(false)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  test('wrapTemplateCSSWithSafety prepends safety CSS', () => {
    const css = '.x { color: red; }'
    const wrapped = wrapTemplateCSSWithSafety(css)
    expect(wrapped).toContain(TEMPLATE_SAFETY_CSS.trim())
    expect(wrapped).toContain(css)
  })

  test('normalizeTemplateHTML replaces mm and removes scale', () => {
    const html = '<div style="width:210mm;height:297mm;transform: scale(1.2)"></div>'
    const normalized = normalizeTemplateHTML(html)
    expect(normalized).toContain(`${RESUME_DIMENSIONS.WIDTH_PX}px`)
    expect(normalized).toContain(`${RESUME_DIMENSIONS.HEIGHT_PX}px`)
    expect(normalized).not.toContain('scale')
  })
})
