import { rest } from 'msw'
import { resumeApi } from '../resumeApi'
import { server } from '../../test/msw/server'

describe('resumeApi integration', () => {
  test('create maps backend payload to Resume model', async () => {
    server.use(
      rest.post('http://localhost:8080/api/v1/resumes', (_req, res, ctx) => {
        return res(ctx.json({
          resumeId: 99,
          userId: 101,
          title: 'My Resume',
          targetJobTitle: 'Software Engineer',
          templateId: 3,
          language: 'English',
          sectionsJson: '{}',
          status: 'DRAFT',
          atsScore: 0,
          isPublic: false,
          viewCount: 0,
          createdAt: '2026-05-13T00:00:00Z',
        }))
      })
    )

    const result = await resumeApi.create({
      title: 'My Resume',
      targetJobTitle: 'Software Engineer',
      templateId: 3,
      sectionsJson: '{}',
    } as any)

    expect(result.resumeId).toBe(99)
    expect(result.templateId).toBe(3)
    expect(result.title).toBe('My Resume')
  })

  test('update with isPublic-only uses publish/unpublish endpoints', async () => {
    server.use(
      rest.put('http://localhost:8080/api/v1/resumes/10/publish', (_req, res, ctx) => res(ctx.json({}))),
      rest.get('http://localhost:8080/api/v1/resumes/10', (_req, res, ctx) => {
        return res(ctx.json({
          resumeId: 10,
          userId: 101,
          title: 'Resume',
          status: 'DRAFT',
          atsScore: 0,
          language: 'English',
          sectionsJson: '{}',
          isPublic: true,
          viewCount: 0,
          createdAt: '2026-05-13T00:00:00Z',
        }))
      })
    )

    const result = await resumeApi.update(10, { isPublic: true })
    expect(result.resumeId).toBe(10)
    expect(result.isPublic).toBe(true)
  })

  test('update merges payload and preserves status', async () => {
    server.use(
      rest.get('http://localhost:8080/api/v1/resumes/12', (_req, res, ctx) =>
        res(ctx.json({
          resumeId: 12,
          userId: 5,
          title: 'Old',
          targetJobTitle: 'Old Role',
          templateId: 2,
          language: 'English',
          sectionsJson: '{}',
          status: 'DRAFT',
          isPublic: false,
          createdAt: '2026-05-13T00:00:00Z',
        }))
      ),
      rest.put('http://localhost:8080/api/v1/resumes/12', (_req, res, ctx) =>
        res(ctx.json({
          resumeId: 12,
          userId: 5,
          title: 'New',
          targetJobTitle: 'General Role',
          templateId: null,
          language: 'English',
          sectionsJson: '{}',
          status: 'DRAFT',
          isPublic: false,
          createdAt: '2026-05-13T00:00:00Z',
        }))
      ),
      rest.put('http://localhost:8080/api/v1/resumes/12/unpublish', (_req, res, ctx) => res(ctx.json({})))
    )

    const result = await resumeApi.update(12, { title: 'New', templateId: 0 as any, isPublic: false, status: 'COMPLETE' })
    expect(result.title).toBe('New')
    expect(result.templateId).toBeUndefined()
    expect(result.isPublic).toBe(false)
    expect(result.status).toBe('COMPLETE')
  })

  test('getByUser and getPublic map arrays', async () => {
    server.use(
      rest.get('http://localhost:8080/api/v1/resumes/user/99', (_req, res, ctx) =>
        res(ctx.json([{ resumeId: 1, userId: 99, title: 'Mine' }]))
      ),
      rest.get('http://localhost:8080/api/v1/resumes/public', (_req, res, ctx) =>
        res(ctx.json([{ resumeId: 2, userId: 5, title: 'Public' }]))
      )
    )

    const mine = await resumeApi.getByUser(99)
    const pub = await resumeApi.getPublic()
    expect(mine[0].userId).toBe(99)
    expect(pub[0].resumeId).toBe(2)
  })
})
