import api from './axios'
import type { Notification } from '../types'
import { EP_NOTIFICATION } from '../config/endpoints'

/**
 * Maps raw backend response to the frontend Notification model.
 * Handles both new (title, eventId, metadataJson) and legacy formats.
 */
function toNotificationModel(raw: any): Notification {
  const type = String(raw.type ?? 'GENERAL')

  return {
    notificationId: raw.notificationId,
    recipientId: Number(raw.userId ?? raw.recipientId ?? 0),
    type,
    title: raw.title ?? type.replace(/_/g, ' '),
    message: raw.message ?? '',
    channel: (raw.channel ?? 'APP') as Notification['channel'],
    relatedId: raw.relatedId,
    relatedType: raw.relatedType,
    isRead: Boolean(raw.read ?? raw.isRead ?? false),
    sentAt: raw.sentAt ?? raw.createdAt ?? new Date().toISOString(),
  }
}

export const notificationApi = {
  /** GET /notifications/{userId} — All notifications for a user */
  getByRecipient: (recipientId: number) =>
    api.get(EP_NOTIFICATION.BY_RECIPIENT(recipientId)).then(r => (r.data ?? []).map((item: any) => toNotificationModel(item))),

  /** GET /notifications/unread/{userId} — Unread count */
  getUnreadCount: (recipientId: number) =>
    api.get(EP_NOTIFICATION.UNREAD_COUNT(recipientId)).then(r => Number(r.data?.unreadCount ?? 0)),

  /** PUT /notifications/read/{id} — Mark single as read */
  markRead: (id: number | string) =>
    api.put(EP_NOTIFICATION.MARK_READ(id)),

  /** PUT /notifications/read-all/{userId} — Mark all as read */
  markAllRead: (recipientId: number) =>
    api.put(EP_NOTIFICATION.MARK_ALL_READ(recipientId)),

  /** DELETE /notifications/{id} — Delete notification */
  delete: (id: number | string) =>
    api.delete(EP_NOTIFICATION.DELETE(id)),

  /** POST /notifications — Create notification (internal/admin) */
  send: (notification: Partial<Notification>) =>
    api.post(EP_NOTIFICATION.CREATE, {
      userId: notification.recipientId,
      type: notification.type,
      message: notification.message,
    }).then(r => toNotificationModel(r.data)),

  /** Bulk send notifications */
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

  /** GET /notifications — All notifications (admin) */
  getAll: () =>
    api.get(EP_NOTIFICATION.GET_ALL).then(r => (r.data ?? []).map((item: any) => toNotificationModel(item))),
}
