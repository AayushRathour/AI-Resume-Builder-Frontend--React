import { useQuery } from "@tanstack/react-query"
import { adminApi } from "../../api/adminApi"
import AdminLayout from "../../components/AdminLayout"
import { BarChart3, TrendingUp, Users, Star } from "lucide-react"

export default function AdminAnalytics() {
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: adminApi.getUsers })
  const { data: templates = [] } = useQuery({ queryKey: ["templates-all"], queryFn: adminApi.getTemplates })
  const { data: aiUsage } = useQuery({ queryKey: ["admin-ai-usage"], queryFn: adminApi.getAiUsage })

  const freeCount = users.filter((u: any) => u.subscriptionPlan === "FREE").length
  const premiumCount = users.filter((u: any) => u.subscriptionPlan === "PREMIUM").length
  const activeCount = users.filter((u: any) => u.isActive).length
  const conversionRate = users.length > 0 ? ((premiumCount / users.length) * 100).toFixed(1) : "0"

  const topTemplates = [...templates].sort((a: any, b: any) => b.usageCount - a.usageCount).slice(0, 5)

  return (
    <AdminLayout title="Platform Analytics">
      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: users.length, icon: Users, sub: `${activeCount} active`, color: "text-blue-600 bg-blue-50" },
          { label: "Premium Users", value: premiumCount, icon: Star, sub: `${conversionRate}% conversion`, color: "text-amber-600 bg-amber-50" },
          { label: "AI Requests", value: aiUsage?.totalRequests ?? 0, icon: TrendingUp, sub: `${aiUsage?.usersWithUsage ?? 0} users used AI`, color: "text-slate-600 bg-slate-50" },
          { label: "Templates", value: templates.length, icon: BarChart3, sub: `${templates.filter((t: any) => t.isPremium).length} premium`, color: "text-purple-600 bg-purple-50" },
        ].map(({ label, value, icon: Icon, sub, color }) => (
          <div key={label} className="card p-5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon size={16} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-sm font-medium text-slate-600">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* User Growth Bar */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-4">User Plan Distribution</h2>
          {[
            { label: "Free", count: freeCount, total: users.length, color: "bg-slate-400" },
            { label: "Premium", count: premiumCount, total: users.length, color: "bg-amber-500" },
            { label: "Active", count: activeCount, total: users.length, color: "bg-green-500" },
            { label: "Inactive", count: users.length - activeCount, total: users.length, color: "bg-red-400" },
          ].map(({ label, count, total, color }) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={label} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 font-medium">{label}</span>
                  <span className="text-slate-400">{count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Top Templates */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Top Templates by Usage</h2>
          {topTemplates.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No template usage data yet</p>
          ) : (
            <div className="space-y-3">
              {topTemplates.map((t: any, i: number) => (
                <div key={t.templateId} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-0.5">
                      <span className="font-medium text-slate-700">{t.name}</span>
                      <span className="text-slate-400">{t.usageCount} uses</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${topTemplates[0].usageCount > 0 ? (t.usageCount / topTemplates[0].usageCount) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-700 mb-4">All Users Overview</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["#", "Name", "Email", "Plan", "Status", "Provider", "Joined"].map(h => (
                    <th key={h} className="pb-2 text-left text-xs font-semibold text-slate-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u: any, i: number) => (
                  <tr key={u.userId} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 text-slate-400 text-xs">{i + 1}</td>
                    <td className="py-2 font-medium text-slate-700">{u.fullName}</td>
                    <td className="py-2 text-slate-500 text-xs">{u.email}</td>
                    <td className="py-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${u.subscriptionPlan === "PREMIUM" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                        {u.subscriptionPlan}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={`text-xs font-medium ${u.isActive ? "text-green-600" : "text-red-500"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2 text-slate-400 text-xs capitalize">{u.provider?.toLowerCase()}</td>
                    <td className="py-2 text-slate-400 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
