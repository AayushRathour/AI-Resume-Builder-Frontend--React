import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '../api/notificationApi'
import type { Notification } from '../types'
import { Bell, Check, CheckCheck, X } from 'lucide-react'

const typeColors: Record<string, string> = {
  ATS_COMPLETE: 'bg-blue-100 text-blue-700',
  EXPORT_READY: 'bg-green-100 text-green-700',
  AI_DONE: 'bg-purple-100 text-purple-700',
  JOB_MATCH: 'bg-amber-100 text-amber-700',
  PLAN_CHANGE: 'bg-indigo-100 text-indigo-700',
  QUOTA_WARNING: 'bg-red-100 text-red-700',
}

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const qc = useQueryClient()

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.userId],
    queryFn: () => notificationApi.getByRecipient(user!.userId),
    enabled: !!user,
  })

  const markRead = useMutation({
    mutationFn: (id: number | string) => notificationApi.markRead(id),
    onSuccess: () => {
      // Refresh both the notification list AND the navbar unread-count badge
      qc.invalidateQueries({ queryKey: ['notifications', user?.userId] })
      qc.invalidateQueries({ queryKey: ['unread-count', user?.userId] })
    },
  })

  const markAllRead = useMutation({
    mutationFn: () => notificationApi.markAllRead(user!.userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', user?.userId] })
      qc.invalidateQueries({ queryKey: ['unread-count', user?.userId] })
    },
  })

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000)
    if (diff < 1) return 'just now'
    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl animate-fade-in overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-slate-500" />
          <span className="font-semibold text-sm text-slate-700">Notifications</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => markAllRead.mutate()}
            className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
            <CheckCheck size={12} /> All read
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">
            <Bell size={28} className="mx-auto mb-2 opacity-30" />
            No notifications yet
          </div>
        ) : (
          notifications.slice(0, 20).map((n: Notification) => (
            <div key={n.notificationId}
              onClick={() => !n.isRead && markRead.mutate(n.notificationId)}
              className={`px-4 py-3 border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-primary-50/40' : ''}`}>
              <div className="flex items-start gap-3">
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded mt-0.5 ${typeColors[n.type] || 'bg-slate-100 text-slate-600'}`}>
                  {n.type.replace('_', ' ')}
                </span>
                {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full mt-1 ml-auto flex-shrink-0" />}
              </div>
              <p className="text-sm font-medium text-slate-800 mt-1">{n.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
              <p className="text-xs text-slate-400 mt-1">{formatTime(n.sentAt)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
