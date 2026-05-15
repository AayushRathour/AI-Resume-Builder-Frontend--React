import useResumeStore from '../useResumeStore'

const getState = () => useResumeStore.getState()

describe('useResumeStore', () => {
  beforeEach(() => {
    getState().reset()
  })

  test('updates personal info and skills', () => {
    getState().setPersonalField('name', 'Alex')
    getState().addSkill('React')
    getState().addSkill('TypeScript')

    const state = getState()
    expect(state.data.personal.name).toBe('Alex')
    expect(state.data.skills).toEqual(['React', 'TypeScript'])
  })

  test('loadFromSectionsJson handles structured format', () => {
    const payload = JSON.stringify({
      personal: { name: 'Sam', email: 'sam@example.com' },
      summary: 'Summary',
      skills: ['JS'],
      experience: [{ id: 'exp1', company: 'Acme', position: 'Dev', startDate: '', endDate: '', current: false, description: '' }],
      education: [],
      projects: [],
    })

    getState().loadFromSectionsJson(payload)
    const state = getState()
    expect(state.data.personal.name).toBe('Sam')
    expect(state.data.skills).toEqual(['JS'])
    expect(state.data.experience[0].id).toBe('exp1')
  })

  test('loadFromSectionsJson handles legacy format', () => {
    const payload = JSON.stringify({
      name: 'Legacy User',
      email: 'legacy@example.com',
      skills: 'React, TS',
      experience: 'Built features',
    })

    getState().loadFromSectionsJson(payload)
    const state = getState()
    expect(state.data.personal.name).toBe('Legacy User')
    expect(state.data.skills).toEqual(['React', 'TS'])
    expect(state.data.experience).toHaveLength(1)
    expect(state.data.experience[0].description).toBe('Built features')
  })

  test('step navigation clamps to bounds', () => {
    getState().setStep(99)
    expect(getState().currentStep).toBe(getState().totalSteps - 1)
    getState().setStep(-10)
    expect(getState().currentStep).toBe(0)
    getState().nextStep()
    expect(getState().currentStep).toBe(1)
    getState().prevStep()
    expect(getState().currentStep).toBe(0)
  })

  test('reorderExperience moves items', () => {
    getState().addExperience()
    getState().addExperience()

    const before = getState().data.experience.map((item) => item.id)
    getState().reorderExperience(0, 1)
    const after = getState().data.experience.map((item) => item.id)

    expect(after[0]).toBe(before[1])
    expect(after[1]).toBe(before[0])
  })

  test('reorderEducation and reorderProject work', () => {
    getState().addEducation()
    getState().addEducation()
    const eduBefore = getState().data.education.map(i => i.id)
    getState().reorderEducation(0, 1)
    expect(getState().data.education[0].id).toBe(eduBefore[1])

    getState().addProject()
    getState().addProject()
    const projBefore = getState().data.projects.map(i => i.id)
    getState().reorderProject(0, 1)
    expect(getState().data.projects[0].id).toBe(projBefore[1])
  })

  test('removes items', () => {
    getState().addExperience()
    const expId = getState().data.experience[0].id
    getState().removeExperience(expId)
    expect(getState().data.experience).toHaveLength(0)

    getState().addEducation()
    const eduId = getState().data.education[0].id
    getState().removeEducation(eduId)
    expect(getState().data.education).toHaveLength(0)

    getState().addProject()
    const projId = getState().data.projects[0].id
    getState().removeProject(projId)
    expect(getState().data.projects).toHaveLength(0)
  })

  test('updates fields and metadata', () => {
    getState().addExperience()
    const expId = getState().data.experience[0].id
    getState().updateExperience(expId, 'company', 'New Co')
    expect(getState().data.experience[0].company).toBe('New Co')

    getState().addEducation()
    const eduId = getState().data.education[0].id
    getState().updateEducation(eduId, 'institution', 'New Uni')
    expect(getState().data.education[0].institution).toBe('New Uni')

    getState().addProject()
    const projId = getState().data.projects[0].id
    getState().updateProject(projId, 'name', 'New Proj')
    expect(getState().data.projects[0].name).toBe('New Proj')

    getState().setResumeTitle('My Best Resume')
    getState().setTargetJobTitle('CTO')
    getState().setTemplateId(10)
    getState().setResumeId(500)

    const state = getState()
    expect(state.resumeTitle).toBe('My Best Resume')
    expect(state.targetJobTitle).toBe('CTO')
    expect(state.templateId).toBe(10)
    expect(state.resumeId).toBe(500)
  })

  test('loadFromResume works', () => {
    getState().loadFromResume({
      resumeId: 123,
      title: 'Loaded Resume',
      sectionsJson: JSON.stringify({ personal: { name: 'Loaded' } })
    })
    expect(getState().resumeId).toBe(123)
    expect(getState().data.personal.name).toBe('Loaded')
  })

  test('skills management works', () => {
    getState().setSkills(['A', 'B'])
    expect(getState().data.skills).toHaveLength(2)
    getState().updateSkill(0, 'C')
    expect(getState().data.skills[0]).toBe('C')
    getState().removeSkill(1)
    expect(getState().data.skills).toHaveLength(1)
  })
})
