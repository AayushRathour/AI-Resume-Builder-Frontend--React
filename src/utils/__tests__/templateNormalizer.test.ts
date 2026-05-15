import { isNormalized, normalizeTemplate } from '../templateNormalizer'

describe('templateNormalizer', () => {
  test('normalizeTemplate replaces known hardcoded content', () => {
    const input = `
      <div>
        <h1>John Doe</h1>
        <p>Software Engineer</p>
        <a href="https://linkedin.com/in/johndoe">Profile</a>
      </div>
    `

    const normalized = normalizeTemplate(input)
    expect(normalized).toContain('{{name}}')
    expect(normalized).toContain('{{title}}')
    expect(normalized).toContain('{{linkedin}}')
  })

  test('isNormalized detects required placeholders', () => {
    expect(isNormalized('<div>{{name}} {{email}}</div>')).toBe(true)
    expect(isNormalized('<div>John Doe</div>')).toBe(false)
  })
})
