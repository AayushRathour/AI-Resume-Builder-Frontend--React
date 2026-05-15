import { rest } from 'msw'
import { aiApi } from '../aiApi'
import { server } from '../../test/msw/server'
import { queryClient } from '../../lib/queryClient'

const API_BASE = 'http://localhost:8080/api/v1'

describe('aiApi', () => {
  const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

  afterEach(() => {
    invalidateSpy.mockClear()
  })

  test('generateSummary returns text and refreshes quota', async () => {
    server.use(
      rest.post(`${API_BASE}/ai/summary`, (_req, res, ctx) =>
        res(ctx.json({ data: { text: 'Summary text' } }))
      )
    )

    const result = await aiApi.generateSummary(7, 'FREE', 'Dev', 3, 'TS')
    expect(result).toBe('Summary text')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['quota', 7] })
  })

  test('generateBullets splits lines', async () => {
    server.use(
      rest.post(`${API_BASE}/ai/bullets`, (_req, res, ctx) =>
        res(ctx.json({ data: { text: 'First line.\nSecond line' } }))
      )
    )

    const result = await aiApi.generateBullets(5, 'FREE', 'Dev', 'Acme', 'Did things')
    expect(result).toEqual(['First line', 'Second line'])
  })

  test('checkAts normalizes recommendations', async () => {
    server.use(
      rest.post(`${API_BASE}/ai/ats`, (_req, res, ctx) =>
        res(ctx.json({
          data: {
            score: 82,
            missingKeywords: ['React'],
            recommendations: 'Add React.\nImprove metrics.',
          },
        }))
      )
    )

    const result = await aiApi.checkAts(1, 'FREE', 10, 'resume', 'job')
    expect(result.score).toBe(82)
    expect(result.missingKeywords).toEqual(['React'])
    expect(result.suggestions).toEqual(['Add React', 'Improve metrics'])
    expect(result.rawResponse).toContain('Add React')
  })

  test('generateCoverLetter and improveSection return text', async () => {
    server.use(
      rest.post(`${API_BASE}/ai/cover-letter`, (_req, res, ctx) =>
        res(ctx.json({ data: { text: 'Cover letter' } }))
      ),
      rest.post(`${API_BASE}/ai/improve`, (_req, res, ctx) =>
        res(ctx.json({ data: { text: 'Improved' } }))
      )
    )

    const cover = await aiApi.generateCoverLetter(2, 'FREE', 10, 'Job desc')
    const improved = await aiApi.improveSection(2, 'FREE', 'SUMMARY', 'Old')
    expect(cover).toBe('Cover letter')
    expect(improved).toBe('Improved')
  })

  test('suggestSkills splits lines', async () => {
    server.use(
      rest.post(`${API_BASE}/ai/skills`, (_req, res, ctx) =>
        res(ctx.json({ data: { text: 'React\nTypeScript' } }))
      )
    )

    const result = await aiApi.suggestSkills(3, 'Dev', 'JS', 'Tech')
    expect(result).toEqual(['React', 'TypeScript'])
  })

  test('tailorForJob and translate return text', async () => {
    server.use(
      rest.post(`${API_BASE}/ai/tailor`, (_req, res, ctx) =>
        res(ctx.json({ data: { text: 'Tailored' } }))
      ),
      rest.post(`${API_BASE}/ai/translate`, (_req, res, ctx) =>
        res(ctx.json({ data: { text: 'Translated' } }))
      )
    )

    const tailored = await aiApi.tailorForJob(4, 'FREE', '{}', 'Job')
    const translated = await aiApi.translate(4, 'FREE', '{}', 'Hindi')
    expect(tailored).toBe('Tailored')
    expect(translated).toBe('Translated')
  })

  test('getHistory normalizes rows and getQuota computes remaining', async () => {
    server.use(
      rest.get(`${API_BASE}/ai/history/7`, (_req, res, ctx) =>
        res(ctx.json({ data: [{ requestId: 'r1', userId: '7', requestType: 'SUMMARY', tokensUsed: '5' }] }))
      ),
      rest.get(`${API_BASE}/ai/quota/7`, (_req, res, ctx) =>
        res(ctx.json({ data: { callsAllowed: 10, callsUsedThisMonth: 4, atsChecksAllowed: 5, atsChecksUsedThisMonth: 2 } }))
      )
    )

    const history = await aiApi.getHistory(7)
    expect(history[0].requestId).toBe('r1')
    expect(history[0].tokensUsed).toBe(5)

    const quota = await aiApi.getQuota(7)
    expect(quota.contentRemaining).toBe(6)
    expect(quota.atsRemaining).toBe(3)
  })

  test('chat returns response text', async () => {
    server.use(
      rest.post(`${API_BASE}/ai/chat`, (_req, res, ctx) =>
        res(ctx.json({ data: { text: 'Hello' } }))
      )
    )

    const result = await aiApi.chat(9, 'Hi')
    expect(result).toBe('Hello')
  })
})
