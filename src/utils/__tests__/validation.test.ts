import {
  isPersonalInfoValid,
  validateEmail,
  validateName,
  validatePersonalInfo,
  validatePhone,
  validateTemplate,
} from '../validation'

describe('validation utils', () => {
  test('validateName handles empty and valid values', () => {
    expect(validateName('')).toBe('Name is required')
    expect(validateName('John1')).toContain('Only letters')
    expect(validateName('John Doe')).toBe('')
  })

  test('validateEmail validates format', () => {
    expect(validateEmail('bad-email')).toContain('valid email')
    expect(validateEmail('qa@example.com')).toBe('')
  })

  test('validatePhone accepts optional empty and rejects short numbers', () => {
    expect(validatePhone('')).toBe('')
    expect(validatePhone('12345')).toContain('10')
    expect(validatePhone('+91 9876543210')).toBe('')
  })

  test('validatePersonalInfo and isPersonalInfoValid work together', () => {
    const errors = validatePersonalInfo({
      name: '',
      email: 'bad',
      phone: '12',
      location: '',
      linkedin: 'nope',
      github: 'nope',
      website: 'nope',
      title: 'Developer',
    })

    expect(errors.name).toBeTruthy()
    expect(errors.email).toBeTruthy()
    expect(isPersonalInfoValid({
      name: 'Alex Doe',
      email: 'alex@example.com',
      phone: '+91 9988776655',
      location: 'Bhopal',
      linkedin: 'https://linkedin.com/in/alex-doe',
      github: 'https://github.com/alex-doe',
      website: 'https://alex.dev',
      title: 'Engineer',
    })).toBe(true)
  })

  test('validateTemplate catches required placeholders', () => {
    const result = validateTemplate('<div>John Doe</div>')
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('{{name}}'))).toBe(true)
    expect(result.hasHardcodedNames).toBe(true)
  })
})
