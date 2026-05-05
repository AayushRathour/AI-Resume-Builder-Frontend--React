import { useQuery } from "@tanstack/react-query"
import { adminApi } from "../../api/adminApi"
import AdminLayout from "../../components/AdminLayout"
import { Users, LayoutTemplate, Zap, FileText } from "lucide-react"

export default function AdminDashboard() {
  const { data: dashboard, isError: dashboardError, error: dashboardErr } = useQuery({ queryKey: ["admin-dashboard"], queryFn: adminApi.getDashboard, retry: 1 })
  const { data: users = [], isError: usersError, error: usersErr } = useQuery({ queryKey: ["admin-users"], queryFn: adminApi.getUsers, retry: 1 })

  const hasErrors = dashboardError || usersError
  const errorMessages = [
    dashboardError ? `Dashboard: ${(dashboardErr as any)?.message || 'Request failed with status code 404'}` : '',
    usersError ? `Users: ${(usersErr as any)?.message || 'Request failed with status code 404'}` : '',
  ].filter(Boolean).join(' ')

  const stats = [
    { label: "Total Users", value: dashboard?.users ?? users.length, icon: Users, color: "bg-blue-100 text-blue-600" },
    { label: "Premium Users", value: dashboard?.premiumUsers ?? users.filter((u: any) => u.subscriptionPlan === "PREMIUM").length, icon: Zap, color: "bg-amber-100 text-amber-600" },
    { label: "Templates", value: dashboard?.templates ?? 0, icon: LayoutTemplate, color: "bg-purple-100 text-purple-600" },
    { label: "Total Resumes", value: dashboard?.resumes ?? 0, icon: FileText, color: "bg-green-100 text-green-600" },
  ]

  return (
    <AdminLayout title="Admin Dashboard">
      {hasErrors && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-red-600 font-semibold text-sm">⚠ Failed to load admin data</span>
          </div>
          <p className="text-xs text-red-500">{errorMessages}</p>
          <p className="text-xs text-red-400 mt-1">Make sure all backend services (auth-service:8081, template-service:8084) are running.</p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Recent Users</h2>
          <div className="space-y-2">
            {users.slice(0, 8).map((u: any) => (
              <div key={u.userId} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-700">
                    {u.fullName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{u.fullName}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.subscriptionPlan === "PREMIUM" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                  {u.subscriptionPlan}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Plan Distribution</h2>
          {["FREE", "PREMIUM"].map(plan => {
            const count = users.filter((u: any) => u.subscriptionPlan === plan).length
            const pct = users.length > 0 ? Math.round((count / users.length) * 100) : 0
            return (
              <div key={plan} className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-600">{plan}</span>
                  <span className="text-slate-400">{count} users ({pct}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full">
                  <div className={`h-full rounded-full ${plan === "PREMIUM" ? "bg-amber-500" : "bg-slate-400"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">Active accounts: {users.filter((u: any) => u.isActive).length} / {users.length}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
