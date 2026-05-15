import { rest } from 'msw'
import { server } from '../../test/msw/server'
import { adminApi } from '../adminApi'

const API_BASE = 'http://localhost:8080/api/v1'

describe('adminApi', () => {
  test('getUsers normalizes flags and timestamps', async () => {
    server.use(
      rest.get(`${API_BASE}/admin/users`, (_req, res, ctx) =>
        res(ctx.json([
          { userId: 1, email: 'a@b.com', active: false, deleted: true, deleted_at: '2024-01-01' },
          { userId: 2, email: 'c@d.com', isActive: true, isDeleted: false, createdAt: '2024-02-02' },
        ]))
      )
    )

    const result = await adminApi.getUsers()
    expect(result[0].isActive).toBe(false)
    expect(result[0].isDeleted).toBe(true)
    expect(result[0].deletedAt).toBe('2024-01-01')
    expect(result[1].isActive).toBe(true)
    expect(result[1].createdAt).toBe('2024-02-02')
  })

  test('getTemplates maps template payload', async () => {
    server.use(
      rest.get(`${API_BASE}/admin/templates`, (_req, res, ctx) =>
        res(ctx.json([
          {
            templateId: 3,
            name: 'Pro',
            description: 'Pro template',
            htmlContent: '<div></div>',
            cssContent: '.root{}',
            previewImageUrl: 'img.png',
            category: 'PROFESSIONAL',
            premium: true,
            active: false,
            usageCount: 2,
            createdAt: '2024-02-02',
          },
        ]))
      )
    )

    const result = await adminApi.getTemplates()
    expect(result[0].templateId).toBe(3)
    expect(result[0].htmlLayout).toBe('<div></div>')
    expect(result[0].cssStyles).toBe('.root{}')
    expect(result[0].thumbnailUrl).toBe('img.png')
    expect(result[0].isPremium).toBe(true)
    expect(result[0].isActive).toBe(false)
  })

  test('createTemplate maps payload fields', async () => {
    let capturedBody: any = null
    server.use(
      rest.post(`${API_BASE}/admin/templates`, async (req, res, ctx) => {
        capturedBody = await req.json()
        return res(ctx.json({ templateId: 9, ...capturedBody }))
      })
    )

    const result = await adminApi.createTemplate({
      name: 'Starter',
      category: 'MINIMALIST',
      description: 'Simple template',
      htmlLayout: '<div>Hi</div>',
      cssStyles: '.root{}',
      thumbnailUrl: 'thumb.png',
      isPremium: true,
      isActive: false,
    })

    expect(capturedBody.htmlContent).toBe('<div>Hi</div>')
    expect(capturedBody.cssContent).toBe('.root{}')
    expect(capturedBody.previewImageUrl).toBe('thumb.png')
    expect(result.templateId).toBe(9)
  })

  test('updateTemplate maps payload fields', async () => {
    let capturedBody: any = null
    server.use(
      rest.put(`${API_BASE}/admin/templates/12`, async (req, res, ctx) => {
        capturedBody = await req.json()
        return res(ctx.json({ templateId: 12, ...capturedBody }))
      })
    )

    const result = await adminApi.updateTemplate(12, {
      name: 'Updated',
      category: 'PROFESSIONAL',
      htmlLayout: '<section></section>',
      cssStyles: '.card{}',
      isPremium: false,
      isActive: true,
    })

    expect(capturedBody.htmlContent).toBe('<section></section>')
    expect(capturedBody.cssContent).toBe('.card{}')
    expect(result.templateId).toBe(12)
  })

  test('deleteTemplate calls delete endpoint', async () => {
    server.use(
      rest.delete(`${API_BASE}/admin/templates/15`, (_req, res, ctx) =>
        res(ctx.status(204))
      )
    )

    await expect(adminApi.deleteTemplate(15)).resolves.toBeDefined()
  })

  test('user management endpoints return mapped users', async () => {
    server.use(
      rest.put(`${API_BASE}/admin/users/11/upgrade`, (_req, res, ctx) =>
        res(ctx.json({ userId: 11, email: 'admin@ex.com', role: 'ADMIN' }))
      ),
      rest.put(`${API_BASE}/admin/users/11/suspend`, (_req, res, ctx) =>
        res(ctx.json({ userId: 11, email: 'admin@ex.com', isActive: false }))
      ),
      rest.put(`${API_BASE}/admin/users/11/restore`, (_req, res, ctx) =>
        res(ctx.json({ userId: 11, email: 'admin@ex.com', isActive: true }))
      ),
      rest.put(`${API_BASE}/admin/users/11/subscription`, async (req, res, ctx) => {
        const body = await req.json()
        return res(ctx.json({ userId: 11, email: 'admin@ex.com', subscriptionPlan: body.plan }))
      }),
      rest.delete(`${API_BASE}/admin/users/11`, (_req, res, ctx) =>
        res(ctx.status(204))
      )
    )

    const upgraded = await adminApi.upgradeUser(11)
    const suspended = await adminApi.suspendUser(11)
    const restored = await adminApi.restoreUser(11)
    const updated = await adminApi.updateSubscription(11, 'PREMIUM')
    await expect(adminApi.deleteUser(11)).resolves.toBeDefined()

    expect(upgraded.userId).toBe(11)
    expect(suspended.isActive).toBe(false)
    expect(restored.isActive).toBe(true)
    expect(updated.subscriptionPlan).toBe('PREMIUM')
  })
})
