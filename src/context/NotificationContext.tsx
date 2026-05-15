import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuth } from './AuthContext'
import { notificationApi } from '../api/notificationApi'
import type { Notification } from '../types'
import { WS_NOTIFICATIONS_URL, IS_DEV } from '../config/api'

/**
 * Notification context for realtime and REST-based notification delivery.
 * Keeps notification UX available even when WebSocket connection is unstable.
 */
interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  connected: boolean
  markAsRead: (id: string | number) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string | number) => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

// Default WebSocket host should follow API gateway origin so frontend/backends stay aligned.
// Gateway route is /ws-notifications/** (without /api prefix).
const WS_URL = WS_NOTIFICATIONS_URL

/** Maximum number of WebSocket reconnect attempts before giving up */
const MAX_RETRIES = 3

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [connected, setConnected] = useState(false)

  // Refs for connection lifecycle management
  const clientRef = useRef<Client | null>(null)
  const connectingRef = useRef(false)       // Prevents StrictMode double-connect
  const retryCountRef = useRef(0)           // Tracks reconnection attempts
  const mountedRef = useRef(true)           // Tracks if component is still mounted

  // Fetch initial notifications from REST API
  const refreshNotifications = useCallback(async () => {
    if (!user) return
    try {
      const [notifs, countData] = await Promise.all([
        notificationApi.getByRecipient(user.userId),
        notificationApi.getUnreadCount(user.userId),
      ])
      if (mountedRef.current) {
        setNotifications(notifs)
        setUnreadCount(countData)
      }
    } catch (err) {
      console.warn('[Notifications] Failed to fetch (non-blocking):', err)
    }
  }, [user])

  // Mark single as read
  const markAsRead = useCallback(async (id: string | number) => {
    try {
      await notificationApi.markRead(id)
      setNotifications(prev =>
        prev.map(n => (n.notificationId === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('[Notifications] Failed to mark as read:', err)
    }
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return
    try {
      await notificationApi.markAllRead(user.userId)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('[Notifications] Failed to mark all as read:', err)
    }
  }, [user])

  // Delete notification
  const deleteNotification = useCallback(async (id: string | number) => {
    try {
      await notificationApi.delete(id)
      setNotifications(prev => {
        const removed = prev.find(n => n.notificationId === id)
        if (removed && !removed.isRead) {
          setUnreadCount(c => Math.max(0, c - 1))
        }
        return prev.filter(n => n.notificationId !== id)
      })
    } catch (err) {
      console.error('[Notifications] Failed to delete:', err)
    }
  }, [])

  // WebSocket connection — isolated and safe
  useEffect(() => {
    mountedRef.current = true

    // ── Guard: skip if no auth ──────────────────────────────────────────
    if (!user || !token) {
      // Cleanup if user logs out
      if (clientRef.current) {
        clientRef.current.deactivate().catch(() => {})
        clientRef.current = null
      }
      connectingRef.current = false
      retryCountRef.current = 0
      setConnected(false)
      setNotifications([])
      setUnreadCount(0)
      return
    }

    // ── Guard: StrictMode double-mount protection ───────────────────────
    if (connectingRef.current || clientRef.current) {
      return
    }
    connectingRef.current = true
    retryCountRef.current = 0

    // Fetch initial data via REST (works even if WebSocket fails)
    refreshNotifications()

    // ── Connect STOMP over SockJS ───────────────────────────────────────
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL) as any,
      reconnectDelay: 0,  // Disable auto-reconnect — we handle it manually
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => {
        if (IS_DEV) {
          if (str.includes('CONNECTED') || str.includes('SUBSCRIBE') || str.includes('ERROR')) {
            console.log('[STOMP]', str)
          }
        }
      },
      onConnect: () => {
        if (!mountedRef.current) return
        retryCountRef.current = 0  // Reset retry count on success
        setConnected(true)

        // Subscribe to user-specific topic
        client.subscribe(`/topic/notifications/${user.userId}`, (message) => {
          try {
            const raw = JSON.parse(message.body)
            const notification: Notification = {
              notificationId: raw.notificationId,
              recipientId: Number(raw.userId ?? user.userId),
              type: String(raw.type ?? 'GENERAL'),
              title: raw.title ?? String(raw.type ?? 'Notification').replace(/_/g, ' '),
              message: raw.message ?? '',
              channel: 'APP',
              relatedId: raw.relatedId,
              relatedType: raw.relatedType,
              isRead: false,
              sentAt: raw.createdAt ?? new Date().toISOString(),
            }

            setNotifications(prev => [notification, ...prev])
            setUnreadCount(prev => prev + 1)
          } catch (err) {
            console.warn('[WebSocket] Failed to parse notification:', err)
          }
        })
      },
      onDisconnect: () => {
        if (!mountedRef.current) return
        setConnected(false)
      },
      onStompError: (frame) => {
        console.warn('[WebSocket] STOMP error (non-blocking):', frame.headers['message'])
        if (mountedRef.current) setConnected(false)
      },
      onWebSocketClose: () => {
        if (!mountedRef.current) return
        setConnected(false)

        // Manual retry with limit
        retryCountRef.current += 1
        if (retryCountRef.current <= MAX_RETRIES) {
          const delay = Math.min(retryCountRef.current * 3000, 10000) // 3s, 6s, 9s
          console.warn(`[WebSocket] Connection closed. Retry ${retryCountRef.current}/${MAX_RETRIES} in ${delay}ms`)
          setTimeout(() => {
            if (mountedRef.current && clientRef.current) {
              try {
                clientRef.current.activate()
              } catch {
                // Silently ignore — WS failure should never crash UI
              }
            }
          }, delay)
        } else {
          console.warn('[WebSocket] Max retries reached. Notifications will use REST polling only.')
        }
      },
      onWebSocketError: () => {
        if (!mountedRef.current) return
        setConnected(false)
      },
    })

    try {
      client.activate()
      clientRef.current = client
    } catch (err) {
      // WebSocket failure is non-fatal — app continues with REST-based notifications
      console.warn('[WebSocket] Failed to activate (non-blocking):', err)
      connectingRef.current = false
    }

    return () => {
      mountedRef.current = false
      connectingRef.current = false
      retryCountRef.current = 0
      if (clientRef.current) {
        clientRef.current.deactivate().catch(() => {})
        clientRef.current = null
      }
      setConnected(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, token])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        connected,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
