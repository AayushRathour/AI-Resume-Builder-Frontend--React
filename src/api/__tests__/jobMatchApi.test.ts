import { rest } from 'msw'
import { server } from '../../test/msw/server'
import { jobMatchApi } from '../jobMatchApi'

const API_BASE = 'http://localhost:8080/api/v1'

describe('jobMatchApi', () => {
  test('getByUser maps match results', async () => {
    server.use(
      rest.get(`${API_BASE}/jobmatch/jobs`, (_req, res, ctx) =>
        res(ctx.json([
          {
            matchId: 1,
            resumeId: 2,
            userId: 10,
            jobTitle: 'Frontend Developer',
            company: 'Acme',
            matchScore: 82.4,
            recommendation: ['Add tests'],
            source: 'THEIRSTACK',
            createdAt: '2024-01-01',
          },
        ]))
      )
    )

    const result = await jobMatchApi.getByUser(10)
    expect(result[0].matchScore).toBe(82)
    expect(result[0].jobTitle).toBe('Frontend Developer')
    expect(result[0].recommendations).toEqual(['Add tests'])
  })

  test('analyze throws when API returns failed status', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    server.use(
      rest.post(`${API_BASE}/jobmatch/analyze`, (_req, res, ctx) =>
        res(ctx.json({ status: 'failed', message: 'AI service unavailable' }))
      )
    )

    await expect(jobMatchApi.analyze(1, 2, 'Dev', 'NYC')).rejects.toThrow('AI service unavailable')
    errorSpy.mockRestore()
  })

  test('analyzeWithFile returns payload data when successful', async () => {
    server.use(
      rest.post(`${API_BASE}/jobmatch/analyze`, (_req, res, ctx) =>
        res(ctx.json({ status: 'success', data: { ok: true } }))
      )
    )

    const formData = new FormData()
    formData.append('userId', '1')
    formData.append('resumeId', '2')

    const result = await jobMatchApi.analyzeWithFile(formData)
    expect(result).toEqual({ ok: true })
  })

  test('getByResume returns empty list on invalid response', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    server.use(
      rest.get(`${API_BASE}/jobmatch/matches/resume/10`, (_req, res, ctx) =>
        res(ctx.json({ message: 'invalid' }))
      )
    )

    const result = await jobMatchApi.getByResume(10)
    expect(result).toEqual([])
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  test('getTopMatches returns empty list on server error', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    server.use(
      rest.get(`${API_BASE}/jobmatch/top`, (_req, res, ctx) =>
        res(ctx.status(500))
      )
    )

    const result = await jobMatchApi.getTopMatches(2, 5)
    expect(result).toEqual([])
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  test('getById and bookmark map job match fields', async () => {
    server.use(
      rest.get(`${API_BASE}/jobmatch/matches/id/abc`, (_req, res, ctx) =>
        res(ctx.json({
          matchId: 'abc',
          resumeId: '10',
          userId: '2',
          jobTitle: 'QA Engineer',
          jobDescription: 'Test things',
          company: 'Acme',
          applyUrl: 'https://apply.example.com',
          matchScore: 88.8,
          isBookmarked: 1,
          createdAt: '2024-01-02',
        }))
      ),
      rest.post(`${API_BASE}/jobmatch/bookmark`, (_req, res, ctx) =>
        res(ctx.json({
          matchId: 9,
          resumeId: 10,
          userId: 2,
          jobTitle: 'Backend Developer',
          jobUrl: 'https://jobs.example.com',
          matchScore: 70.2,
          isBookmarked: true,
          createdAt: '2024-01-03',
        }))
      )
    )

    const match = await jobMatchApi.getById('abc')
    expect(match.jobUrl).toBe('https://apply.example.com')
    expect(match.matchScore).toBe(89)
    expect(match.isBookmarked).toBe(true)

    const bookmarked = await jobMatchApi.bookmark(9, true)
    expect(bookmarked.jobTitle).toBe('Backend Developer')
    expect(bookmarked.matchScore).toBe(70)
  })
})
