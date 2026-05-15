import { rest } from 'msw'
import { server } from '../../test/msw/server'
import { sectionApi } from '../sectionApi'

const API_BASE = 'http://localhost:8080/api/v1'

describe('sectionApi', () => {
  test('add throws when resumeId is missing', async () => {
    await expect(sectionApi.add({ sectionType: 'CUSTOM' } as any)).rejects.toThrow('resumeId is required')
  })

  test('toggleVisibility flips current value', async () => {
    server.use(
      rest.get(`${API_BASE}/sections/5`, (_req, res, ctx) =>
        res(ctx.json({ sectionId: 5, resumeId: 1, sectionType: 'CUSTOM', title: 'Notes', content: '', displayOrder: 1, isVisible: true }))
      ),
      rest.put(`${API_BASE}/sections/5/visibility`, (_req, res, ctx) =>
        res(ctx.json({ sectionId: 5, resumeId: 1, sectionType: 'CUSTOM', title: 'Notes', content: '', displayOrder: 1, isVisible: false }))
      )
    )

    const result = await sectionApi.toggleVisibility(5)
    expect(result.isVisible).toBe(false)
  })

  test('bulkUpdate throws when resumeId is missing', async () => {
    await expect(sectionApi.bulkUpdate([] as any)).rejects.toThrow('resumeId is required')
  })

  test('getByType maps items', async () => {
    server.use(
      rest.get(`${API_BASE}/sections/resume/10/type/CUSTOM`, (_req, res, ctx) =>
        res(ctx.json([{ sectionId: 1, resumeId: 10, sectionType: 'CUSTOM', title: 'Notes', content: 'Hi', displayOrder: 1 }]))
      )
    )

    const result = await sectionApi.getByType(10, 'CUSTOM' as any)
    expect(result[0].title).toBe('Notes')
  })

  test('reorder sorts and sends payload', async () => {
    const handler = jest.fn((_req, res, ctx) => res(ctx.json({})))
    server.use(
      rest.put(`${API_BASE}/sections/reorder/10`, handler)
    )

    await sectionApi.reorder(10, [
      { sectionId: 2, displayOrder: 2 },
      { sectionId: 1, displayOrder: 1 },
    ] as any)

    expect(handler).toHaveBeenCalled()
  })

  test('bulkUpdate maps response list', async () => {
    server.use(
      rest.put(`${API_BASE}/sections/bulk/10`, (_req, res, ctx) =>
        res(ctx.json([{ sectionId: 1, resumeId: 10, sectionType: 'CUSTOM', title: 'One', content: '', displayOrder: 1 }]))
      )
    )

    const result = await sectionApi.bulkUpdate([{ resumeId: 10, sectionId: 1, sectionType: 'CUSTOM', title: 'One' }] as any)
    expect(result[0].sectionId).toBe(1)
  })
})
