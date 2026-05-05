import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "../../api/adminApi"
import AdminLayout from "../../components/AdminLayout"
import toast from "react-hot-toast"
import { Search, Trash2, Star, UserX, UserCheck } from "lucide-react"

export default function AdminUsers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [planFilter, setPlanFilter] = useState("ALL")

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.getUsers,
  })

  const deleteUser = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("User deleted") },
  })

  const updatePlan = useMutation({
    mutationFn: ({ userId, plan }: { userId: number; plan: 'FREE' | 'PREMIUM' }) => adminApi.updateSubscription(userId, plan),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Plan updated") },
  })

  const upgradeRole = useMutation({
    mutationFn: (userId: number) => adminApi.upgradeUser(userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("User upgraded to ADMIN") },
  })

  const suspendUser = useMutation({
    mutationFn: (userId: number) => adminApi.suspendUser(userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("User suspended") },
  })

  const filtered = users.filter((u: any) => {
    const matchSearch = u.fullName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    const matchPlan = planFilter === "ALL" || u.subscriptionPlan === planFilter
    return matchSearch && matchPlan
  })

  return (
    <AdminLayout title={`Users (${users.length})`}>
      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-8 text-sm" placeholder="Search users..." />
        </div>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="input-field text-sm w-auto">
          <option value="ALL">All Plans</option>
          <option value="FREE">Free</option>
          <option value="PREMIUM">Premium</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["User", "Email", "Plan", "Role", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="border-b border-slate-100">
                  {[1, 2, 3, 4, 5, 6].map(j => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>)}
                </tr>
              ))
            ) : filtered.map((u: any) => (
              <tr key={u.userId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-700">
                      {u.fullName?.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-700">{u.fullName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.subscriptionPlan === "PREMIUM" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                    {u.subscriptionPlan}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.role === "ADMIN" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium flex items-center gap-1 w-fit ${u.isActive ? "text-green-600" : "text-red-500"}`}>
                    {u.isActive ? <UserCheck size={12} /> : <UserX size={12} />}
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {u.subscriptionPlan === "FREE" ? (
                      <button onClick={() => updatePlan.mutate({ userId: u.userId, plan: "PREMIUM" })}
                        className="text-xs px-2 py-1 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded border border-amber-200 transition-colors flex items-center gap-1">
                        <Star size={10} /> → Premium
                      </button>
                    ) : (
                      <button onClick={() => updatePlan.mutate({ userId: u.userId, plan: "FREE" })}
                        className="text-xs px-2 py-1 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded border border-slate-200 transition-colors">
                        → Free
                      </button>
                    )}
                    {u.role !== "ADMIN" && (
                      <button onClick={() => upgradeRole.mutate(u.userId)}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded border border-blue-200 transition-colors">
                        Make Admin
                      </button>
                    )}
                    {u.isActive && (
                      <button onClick={() => suspendUser.mutate(u.userId)}
                        className="text-xs px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200 transition-colors">
                        Suspend
                      </button>
                    )}
                    <button onClick={() => { if (confirm(`Delete ${u.fullName}?`)) deleteUser.mutate(u.userId) }}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm">No users found</div>
        )}
      </div>
    </AdminLayout>
  )
}
