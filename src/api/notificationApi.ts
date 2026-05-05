import api from './axios'
import type { Notification } from '../types'
import { EP_NOTIFICATION } from '../config/endpoints'

function toNotificationModel(raw: any): Notification {
  const type = String(raw.type ?? 'INFO')

  return {
    notificationId: raw.notificationId,
    recipientId: Number(raw.userId ?? raw.recipientId ?? 0),
    type,
    title: raw.title ?? type.replace('_', ' '),
    message: raw.message ?? '',
    channel: (raw.channel ?? 'APP') as Notification['channel'],
    relatedId: raw.relatedId,
    relatedType: raw.relatedType,
    isRead: Boolean(raw.read ?? raw.isRead ?? false),
    sentAt: raw.sentAt ?? raw.createdAt ?? new Date().toISOString(),
  }
}

export const notificationApi = {
  getByRecipient: (recipientId: number) =>
    api.get(EP_NOTIFICATION.BY_RECIPIENT(recipientId)).then(r => (r.data ?? []).map((item: any) => toNotificationModel(item))),

  getUnreadCount: (recipientId: number) =>
    api.get(EP_NOTIFICATION.UNREAD_COUNT(recipientId)).then(r => Number(r.data?.unreadCount ?? 0)),

  markRead: (id: number | string) =>
    api.put(EP_NOTIFICATION.MARK_READ(id)),

  markAllRead: (recipientId: number) =>
    api.put(EP_NOTIFICATION.MARK_ALL_READ(recipientId)),

  delete: (id: number | string) =>
    api.delete(EP_NOTIFICATION.DELETE(id)),

  send: (notification: Partial<Notification>) =>
    api.post(EP_NOTIFICATION.CREATE, {
      userId: notification.recipientId,
      type: notification.type,
      message: notification.message,
    }).then(r => toNotificationModel(r.data)),

  sendBulk: async (recipientIds: number[], _title: string, message: string, type: string) =>
    Promise.all(
      recipientIds.map(recipientId =>
        api.post(EP_NOTIFICATION.CREATE, {
          userId: recipientId,
          type,
          message,
        })
      )
    ),

  getAll: () =>
    api.get(EP_NOTIFICATION.GET_ALL).then(r => (r.data ?? []).map((item: any) => toNotificationModel(item))),
}
