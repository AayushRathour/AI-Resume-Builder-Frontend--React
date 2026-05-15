import { formatSkills, renderTemplate } from '../templateEngine'
import type { ResumeData } from '../../store/useResumeStore'

const resumeData: ResumeData = {
  personal: {
    name: 'Ava <Admin>',
    email: 'ava@example.com',
    phone: '9999999999',
    location: 'Indore',
    linkedin: 'https://linkedin.com/in/ava',
    github: 'https://github.com/ava',
    website: 'https://ava.dev',
    title: 'Frontend Engineer',
  },
  summary: 'Builds robust UIs',
  skills: ['React', 'TypeScript'],
  experience: [],
  education: [],
  projects: [],
}

describe('templateEngine', () => {
  test('formatSkills renders list items', () => {
    const html = formatSkills(['React', 'Jest'])
    expect(html).toContain('React')
    expect(html).toContain('<ul')
  })

  test('renderTemplate replaces placeholders and escapes html', () => {
    const template = `
      <div>
        <h1>{{name}}</h1>
        <a href="{{linkedin}}">LinkedIn</a>
        <p>{{summary}}</p>
        {{skills}}
        <script>alert('x')</script>
      </div>
    `

    const output = renderTemplate(template, resumeData)
    expect(output).toContain('Ava &lt;Admin&gt;')
    expect(output).toContain('https://linkedin.com/in/ava')
    expect(output).toContain('Builds robust UIs')
    expect(output).toContain('TypeScript')
    expect(output).not.toContain('<script>')
  })
})
