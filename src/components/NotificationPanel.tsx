import { useNotifications } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import type { Notification } from '../types'
import { Bell, Check, CheckCheck, X, Trash2, FileText, Download, Zap, Briefcase, Star, AlertCircle, Info } from 'lucide-react'
import { Link } from 'react-router-dom'

const typeConfig: Record<string, { color: string; icon: typeof Bell }> = {
  RESUME_CREATED: { color: 'bg-emerald-100 text-emerald-700', icon: FileText },
  RESUME_UPDATED: { color: 'bg-blue-100 text-blue-700', icon: FileText },
  RESUME_DELETED: { color: 'bg-red-100 text-red-700', icon: Trash2 },
  RESUME_EXPORTED: { color: 'bg-green-100 text-green-700', icon: Download },
  EXPORT_READY: { color: 'bg-green-100 text-green-700', icon: Download },
  EXPORT_FAILED: { color: 'bg-red-100 text-red-700', icon: AlertCircle },
  ATS_COMPLETED: { color: 'bg-indigo-100 text-indigo-700', icon: Star },
  ATS_COMPLETE: { color: 'bg-indigo-100 text-indigo-700', icon: Star },
  AI_COMPLETED: { color: 'bg-purple-100 text-purple-700', icon: Zap },
  AI_DONE: { color: 'bg-purple-100 text-purple-700', icon: Zap },
  JOB_MATCH: { color: 'bg-amber-100 text-amber-700', icon: Briefcase },
  JOB_APPLIED: { color: 'bg-teal-100 text-teal-700', icon: Briefcase },
  TEMPLATE_CREATED: { color: 'bg-cyan-100 text-cyan-700', icon: FileText },
  TEMPLATE_UPDATED: { color: 'bg-cyan-100 text-cyan-700', icon: FileText },
  PLAN_CHANGE: { color: 'bg-indigo-100 text-indigo-700', icon: Star },
  QUOTA_WARNING: { color: 'bg-red-100 text-red-700', icon: AlertCircle },
  WELCOME: { color: 'bg-emerald-100 text-emerald-700', icon: Star },
  GENERAL: { color: 'bg-slate-100 text-slate-600', icon: Info },
}

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications()

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000)
    if (diff < 1) return 'just now'
    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    if (diff < 10080) return `${Math.floor(diff / 1440)}d ago`
    return d.toLocaleDateString()
  }

  const getConfig = (type: string) =>
    typeConfig[type] || typeConfig.GENERAL

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-xl animate-fade-in overflow-hidden z-[100]"
      id="notification-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-primary-600" />
          <span className="font-semibold text-sm text-slate-700">Notifications</span>
          {notifications.filter(n => !n.isRead).length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
              {notifications.filter(n => !n.isRead).length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => markAllAsRead()}
            className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:bg-primary-50 px-2 py-1 rounded-md transition-colors">
            <CheckCheck size={12} /> All read
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-[420px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <Bell size={32} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-xs mt-1">We'll notify you when something happens</p>
          </div>
        ) : (
          notifications.slice(0, 30).map((n: Notification) => {
            const config = getConfig(n.type)
            const Icon = config.icon
            return (
              <div key={n.notificationId}
                className={`px-4 py-3 border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 transition-all group ${!n.isRead ? 'bg-primary-50/30 border-l-2 border-l-primary-400' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg mt-0.5 ${config.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {n.type.replace(/_/g, ' ')}
                      </span>
                      {!n.isRead && <div className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-sm font-medium text-slate-800 truncate">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatTime(n.sentAt)}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.isRead && (
                      <button onClick={(e) => { e.stopPropagation(); markAsRead(n.notificationId) }}
                        className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Mark as read">
                        <Check size={14} />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.notificationId) }}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
          <Link to="/notifications" onClick={onClose}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1">
            View all notifications →
          </Link>
        </div>
      )}
    </div>
  )
}
