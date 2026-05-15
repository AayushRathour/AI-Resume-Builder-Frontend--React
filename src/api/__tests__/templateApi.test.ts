import { rest } from 'msw'
import { server } from '../../test/msw/server'
import { templateApi } from '../templateApi'

const API_BASE = 'http://localhost:8080/api/v1'

describe('templateApi', () => {
  test('getAll maps template fields', async () => {
    server.use(
      rest.get(`${API_BASE}/templates`, (_req, res, ctx) =>
        res(ctx.json([
          {
            templateId: 9,
            name: 'Clean',
            htmlLayout: '<div></div>',
            cssStyles: '.root{}',
            previewImageUrl: 'thumb.png',
            category: 'PROFESSIONAL',
            premium: true,
            active: false,
            usageCount: 4,
            createdAt: '2024-01-01',
          },
        ]))
      )
    )

    const result = await templateApi.getAll()
    expect(result[0].templateId).toBe(9)
    expect(result[0].thumbnailUrl).toBe('thumb.png')
    expect(result[0].isPremium).toBe(true)
    expect(result[0].isActive).toBe(false)
  })

  test('getFields parses JSON payload', async () => {
    server.use(
      rest.get(`${API_BASE}/templates/3/fields`, (_req, res, ctx) =>
        res(ctx.json([{ key: 'name' }]))
      )
    )

    const result = await templateApi.getFields(3)
    expect(result).toEqual([{ key: 'name' }])
  })

  test('getByCategory filters from all templates', async () => {
    server.use(
      rest.get(`${API_BASE}/templates`, (_req, res, ctx) =>
        res(ctx.json([
          { templateId: 1, name: 'Pro', category: 'PROFESSIONAL' },
          { templateId: 2, name: 'Creative', category: 'CREATIVE' },
        ]))
      )
    )

    const result = await templateApi.getByCategory('CREATIVE')
    expect(result).toHaveLength(1)
    expect(result[0].templateId).toBe(2)
  })

  test('getFree and getPremium map templates', async () => {
    server.use(
      rest.get(`${API_BASE}/templates/free`, (_req, res, ctx) =>
        res(ctx.json([{ templateId: 3, name: 'Free', category: 'PROFESSIONAL' }]))
      ),
      rest.get(`${API_BASE}/templates/premium`, (_req, res, ctx) =>
        res(ctx.json([{ templateId: 4, name: 'Premium', category: 'PROFESSIONAL' }]))
      )
    )

    const free = await templateApi.getFree()
    const premium = await templateApi.getPremium()
    expect(free[0].templateId).toBe(3)
    expect(premium[0].templateId).toBe(4)
  })

  test('getPopular reuses getAll', async () => {
    server.use(
      rest.get(`${API_BASE}/templates`, (_req, res, ctx) =>
        res(ctx.json([{ templateId: 5, name: 'Popular', category: 'PROFESSIONAL' }]))
      )
    )

    const popular = await templateApi.getPopular()
    expect(popular[0].templateId).toBe(5)
  })

  test('create, update, deactivate call endpoints', async () => {
    server.use(
      rest.post(`${API_BASE}/templates`, (_req, res, ctx) =>
        res(ctx.json({ templateId: 6, name: 'New', category: 'PROFESSIONAL' }))
      ),
      rest.put(`${API_BASE}/templates/6`, (_req, res, ctx) =>
        res(ctx.json({ templateId: 6, name: 'Updated', category: 'PROFESSIONAL' }))
      ),
      rest.delete(`${API_BASE}/templates/6`, (_req, res, ctx) =>
        res(ctx.json({}))
      )
    )

    const created = await templateApi.create({ name: 'New', category: 'PROFESSIONAL' } as any)
    const updated = await templateApi.update(6, { name: 'Updated' } as any)
    await templateApi.deactivate(6)
    expect(created.templateId).toBe(6)
    expect(updated.name).toBe('Updated')
  })
})
