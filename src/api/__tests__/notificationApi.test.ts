import { rest } from 'msw'
import { server } from '../../test/msw/server'
import { notificationApi } from '../notificationApi'

const API_BASE = 'http://localhost:8080/api/v1'

describe('notificationApi', () => {
  test('getByRecipient maps notification model', async () => {
    server.use(
      rest.get(`${API_BASE}/notifications/7`, (_req, res, ctx) =>
        res(ctx.json([
          {
            notificationId: 1,
            userId: 7,
            type: 'SYSTEM_ALERT',
            message: 'Hello',
            read: false,
            createdAt: '2024-01-01',
          },
        ]))
      )
    )

    const result = await notificationApi.getByRecipient(7)
    expect(result[0].recipientId).toBe(7)
    expect(result[0].title).toBe('SYSTEM ALERT')
    expect(result[0].isRead).toBe(false)
  })

  test('getUnreadCount unwraps count', async () => {
    server.use(
      rest.get(`${API_BASE}/notifications/unread/7`, (_req, res, ctx) =>
        res(ctx.json({ unreadCount: 4 }))
      )
    )

    const count = await notificationApi.getUnreadCount(7)
    expect(count).toBe(4)
  })

  test('send maps response to notification model', async () => {
    server.use(
      rest.post(`${API_BASE}/notifications`, (_req, res, ctx) =>
        res(ctx.json({
          notificationId: 22,
          recipientId: 7,
          type: 'GENERAL',
          title: 'Custom title',
          message: 'Hi',
          read: true,
          createdAt: '2024-02-01',
        }))
      )
    )

    const result = await notificationApi.send({ recipientId: 7, type: 'GENERAL', message: 'Hi' })
    expect(result.notificationId).toBe(22)
    expect(result.title).toBe('Custom title')
    expect(result.isRead).toBe(true)
  })

  test('sendBulk and getAll map responses', async () => {
    server.use(
      rest.post(`${API_BASE}/notifications`, (_req, res, ctx) => res(ctx.json({}))),
      rest.get(`${API_BASE}/notifications`, (_req, res, ctx) =>
        res(ctx.json([{ notificationId: 3, userId: 1, type: 'GENERAL', message: 'Hi' }]))
      )
    )

    await notificationApi.sendBulk([1, 2], 'Title', 'Body', 'GENERAL')
    const all = await notificationApi.getAll()
    expect(all[0].notificationId).toBe(3)
  })
})
