import { EP_ADMIN, EP_AI, EP_AUTH, EP_EXPORT, EP_JOB_MATCH, EP_NOTIFICATION, EP_RESUME, EP_SECTION, EP_TEMPLATE } from '../endpoints'

describe('endpoints', () => {
  test('static endpoints match expected paths', () => {
    expect(EP_AUTH.LOGIN).toBe('/auth/login')
    expect(EP_ADMIN.USERS).toBe('/admin/users')
    expect(EP_TEMPLATE.GET_ALL).toBe('/templates')
  })

  test('dynamic endpoints resolve correctly', () => {
    expect(EP_ADMIN.DELETE_USER(5)).toBe('/admin/users/5')
    expect(EP_RESUME.GET_BY_ID(10)).toBe('/resumes/10')
    expect(EP_SECTION.GET_BY_TYPE(2, 'CUSTOM')).toBe('/sections/resume/2/type/CUSTOM')
    expect(EP_EXPORT.STATUS('job-1')).toBe('/export/status/job-1')
    expect(EP_AI.QUOTA(7)).toBe('/ai/quota/7')
    expect(EP_JOB_MATCH.BY_ID('9')).toBe('/jobmatch/matches/id/9')
    expect(EP_NOTIFICATION.MARK_READ(1)).toBe('/notifications/read/1')
  })
})
