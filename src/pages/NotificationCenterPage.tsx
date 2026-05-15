import { useNotifications } from '../context/NotificationContext'
import Navbar from '../components/Navbar'
import type { Notification } from '../types'
import { Bell, Check, CheckCheck, Trash2, FileText, Download, Zap, Briefcase, Star, AlertCircle, Info, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useState } from 'react'

const typeConfig: Record<string, { color: string; bgColor: string; icon: typeof Bell; label: string }> = {
  RESUME_CREATED: { color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: FileText, label: 'Resume Created' },
  RESUME_UPDATED: { color: 'text-blue-700', bgColor: 'bg-blue-100', icon: FileText, label: 'Resume Updated' },
  RESUME_DELETED: { color: 'text-red-700', bgColor: 'bg-red-100', icon: Trash2, label: 'Resume Deleted' },
  RESUME_EXPORTED: { color: 'text-green-700', bgColor: 'bg-green-100', icon: Download, label: 'Export Complete' },
  EXPORT_READY: { color: 'text-green-700', bgColor: 'bg-green-100', icon: Download, label: 'Export Ready' },
  EXPORT_FAILED: { color: 'text-red-700', bgColor: 'bg-red-100', icon: AlertCircle, label: 'Export Failed' },
  ATS_COMPLETED: { color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: Star, label: 'ATS Score' },
  ATS_COMPLETE: { color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: Star, label: 'ATS Score' },
  AI_COMPLETED: { color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Zap, label: 'AI Analysis' },
  AI_DONE: { color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Zap, label: 'AI Done' },
  JOB_MATCH: { color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Briefcase, label: 'Job Match' },
  JOB_APPLIED: { color: 'text-teal-700', bgColor: 'bg-teal-100', icon: Briefcase, label: 'Job Applied' },
  TEMPLATE_CREATED: { color: 'text-cyan-700', bgColor: 'bg-cyan-100', icon: FileText, label: 'New Template' },
  TEMPLATE_UPDATED: { color: 'text-cyan-700', bgColor: 'bg-cyan-100', icon: FileText, label: 'Template Updated' },
  WELCOME: { color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: Star, label: 'Welcome' },
  GENERAL: { color: 'text-slate-600', bgColor: 'bg-slate-100', icon: Info, label: 'General' },
}

type FilterType = 'all' | 'unread' | 'read'

export default function NotificationCenterPage() {
  const { notifications, unreadCount, connected, markAsRead, markAllAsRead, deleteNotification, refreshNotifications } = useNotifications()
  const [filter, setFilter] = useState<FilterType>('all')
  const [visibleCount, setVisibleCount] = useState(20)

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'read') return n.isRead
    return true
  })

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000)
    if (diff < 1) return 'just now'
    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    if (diff < 10080) return `${Math.floor(diff / 1440)}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const getConfig = (type: string) => typeConfig[type] || typeConfig.GENERAL

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-xl">
                <Bell size={24} className="text-primary-600" />
              </div>
              Notification Center
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              <span className={`inline-flex items-center gap-1 ml-3 text-xs ${connected ? 'text-green-600' : 'text-slate-400'}`}>
                {connected ? <><Wifi size={10} /> Live</> : <><WifiOff size={10} /> Connecting...</>}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refreshNotifications()}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              title="Refresh">
              <RefreshCw size={16} />
            </button>
            {unreadCount > 0 && (
              <button onClick={() => markAllAsRead()}
                className="flex items-center gap-1.5 bg-primary-50 text-primary-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors">
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          {(['all', 'unread', 'read'] as FilterType[]).map(f => (
            <button key={f} onClick={() => { setFilter(f); setVisibleCount(20) }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Bell size={48} className="mx-auto mb-4 text-slate-200" />
              <p className="text-slate-500 font-medium">
                {filter === 'unread' ? 'No unread notifications' :
                  filter === 'read' ? 'No read notifications' : 'No notifications yet'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {filter === 'all' ? "We'll notify you when something happens" : 'Try a different filter'}
              </p>
            </div>
          ) : (
            visible.map((n: Notification) => {
              const config = getConfig(n.type)
              const Icon = config.icon
              return (
                <div key={n.notificationId}
                  className={`px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-all group ${
                    !n.isRead ? 'bg-primary-50/20 border-l-3 border-l-primary-400' : ''
                  }`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${config.bgColor}`}>
                      <Icon size={18} className={config.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${config.color}`}>
                          {config.label}
                        </span>
                        {!n.isRead && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-2">{formatTime(n.sentAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {!n.isRead && (
                        <button onClick={() => markAsRead(n.notificationId)}
                          className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Mark as read">
                          <Check size={16} />
                        </button>
                      )}
                      <button onClick={() => deleteNotification(n.notificationId)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Load More (infinite scroll trigger) */}
        {hasMore && (
          <div className="mt-4 text-center">
            <button onClick={() => setVisibleCount(prev => prev + 20)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium bg-white border border-slate-200 px-6 py-2 rounded-lg hover:bg-slate-50 transition-colors">
              Load more ({filtered.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
