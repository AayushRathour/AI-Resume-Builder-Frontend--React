import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { notificationApi } from "../../api/notificationApi"
import { adminApi } from "../../api/adminApi"
import AdminLayout from "../../components/AdminLayout"
import type { Notification } from "../../types"
import toast from "react-hot-toast"
import { Bell, Send, Trash2, CheckCheck, Clock } from "lucide-react"

const NOTIF_TYPES = ["EXPORT_READY", "AI_DONE", "JOB_MATCH", "PLAN_CHANGE", "QUOTA_WARNING", "ATS_COMPLETE", "GENERAL"]

const typeColors: Record<string, string> = {
  EXPORT_READY:   "bg-green-100 text-green-700",
  AI_DONE:        "bg-purple-100 text-purple-700",
  JOB_MATCH:      "bg-amber-100 text-amber-700",
  PLAN_CHANGE:    "bg-indigo-100 text-indigo-700",
  QUOTA_WARNING:  "bg-red-100 text-red-700",
  ATS_COMPLETE:   "bg-blue-100 text-blue-700",
  GENERAL:        "bg-slate-100 text-slate-600",
}

export default function AdminNotifications() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: "", message: "", type: "GENERAL", target: "ALL" })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: notificationApi.getAll,
  })

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.getUsers,
  })

  const deleteNotif = useMutation({
    mutationFn: (id: number | string) => notificationApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-notifications"] }); toast.success("Deleted") },
  })

  const sendBroadcast = useMutation({
    mutationFn: () => {
      const ids = form.target === "ALL"
        ? users.map((u: any) => u.userId)
        : form.target === "PREMIUM"
          ? users.filter((u: any) => u.subscriptionPlan === "PREMIUM").map((u: any) => u.userId)
          : users.filter((u: any) => u.subscriptionPlan === "FREE").map((u: any) => u.userId)
      if (!ids.length) { toast.error("No recipients selected"); return Promise.reject() }
      return notificationApi.sendBulk(ids, form.title, form.message, form.type)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notifications"] })
      toast.success("Broadcast sent!")
      setForm({ title: "", message: "", type: "GENERAL", target: "ALL" })
    },
    onError: () => toast.error("Broadcast failed"),
  })

  const formatTime = (s: string) => new Date(s).toLocaleString()

  return (
    <AdminLayout title="Notifications">
      {/* Send Broadcast */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Send size={16} className="text-primary-500" /> Send Broadcast Notification
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
            <input value={form.title} onChange={set("title")} className="input-field text-sm" placeholder="Notification title" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
            <select value={form.type} onChange={set("type")} className="input-field text-sm">
              {NOTIF_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">Message</label>
          <textarea value={form.message} onChange={set("message")} rows={3}
            className="input-field text-sm" placeholder="Write your broadcast message..." />
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-600 mb-1">Recipients</label>
          <select value={form.target} onChange={set("target")} className="input-field text-sm w-auto">
            <option value="ALL">All Users ({users.length})</option>
            <option value="PREMIUM">Premium Users ({users.filter((u: any) => u.subscriptionPlan === "PREMIUM").length})</option>
            <option value="FREE">Free Users ({users.filter((u: any) => u.subscriptionPlan === "FREE").length})</option>
          </select>
        </div>
        <button onClick={() => sendBroadcast.mutate()}
          disabled={!form.title || !form.message || sendBroadcast.isPending}
          className="btn-primary flex items-center gap-2 text-sm">
          <Send size={14} />
          {sendBroadcast.isPending ? "Sending…" : "Send Broadcast"}
        </button>
      </div>

      {/* Notification Log */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="font-semibold text-slate-700 text-sm flex items-center gap-2">
            <Bell size={14} className="text-primary-500" /> All Notifications ({notifications.length})
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-14 text-center text-slate-400 text-sm">
            <Bell size={36} className="mx-auto mb-2 opacity-30" />
            No notifications yet
          </div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
            {notifications.map((n: Notification) => (
              <div key={n.notificationId} className="px-5 py-3 flex items-start justify-between gap-4 hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[n.type] || typeColors.GENERAL}`}>
                      {n.type.replace(/_/g, " ")}
                    </span>
                    {n.isRead
                      ? <span className="text-xs text-slate-400 flex items-center gap-1"><CheckCheck size={10} /> Read</span>
                      : <span className="w-2 h-2 bg-primary-500 rounded-full inline-block" title="Unread" />
                    }
                  </div>
                  <p className="text-sm font-medium text-slate-700 truncate">{n.title}</p>
                  <p className="text-xs text-slate-400 line-clamp-1">{n.message}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={10} /> {formatTime(n.sentAt)}
                  </span>
                  <button onClick={() => { if(confirm("Delete notification?")) deleteNotif.mutate(n.notificationId) }}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
