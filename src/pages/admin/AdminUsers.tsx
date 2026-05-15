import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "../../api/adminApi"
import AdminLayout from "../../components/AdminLayout"
import AdminPagination from "../../components/admin/AdminPagination"
import toast from "react-hot-toast"
import { Calendar, Mail, RotateCcw, Search, Star, Trash2, UserCheck, UserX } from "lucide-react"

const ITEMS_PER_PAGE = 10

export default function AdminUsers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [planFilter, setPlanFilter] = useState("ALL")
  const [currentPage, setCurrentPage] = useState(1)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.getUsers,
  })

  const deleteUser = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] })
      toast.success("User deleted")
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || e?.message || "Failed to delete user")
    },
  })

  const updatePlan = useMutation({
    mutationFn: ({ userId, plan }: { userId: number; plan: "FREE" | "PREMIUM" }) => adminApi.updateSubscription(userId, plan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] })
      toast.success("Plan updated")
    },
  })

  const upgradeRole = useMutation({
    mutationFn: (userId: number) => adminApi.upgradeUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] })
      toast.success("User upgraded to ADMIN")
    },
  })

  const suspendUser = useMutation({
    mutationFn: (userId: number) => adminApi.suspendUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] })
      toast.success("User suspended")
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || e?.message || "Failed to suspend user")
    },
  })

  const restoreUser = useMutation({
    mutationFn: (userId: number) => adminApi.restoreUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] })
      toast.success("User restored")
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || e?.message || "Failed to restore user")
    },
  })

  const filtered = users.filter((u: any) => {
    const matchSearch = u.fullName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    const matchPlan = planFilter === "ALL" || u.subscriptionPlan === planFilter
    return matchSearch && matchPlan
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  const handleFilterChange = (value: string, type: "search" | "plan") => {
    setCurrentPage(1)
    if (type === "search") {
      setSearch(value)
    } else {
      setPlanFilter(value)
    }
  }

  return (
    <AdminLayout title={`Users (${users.length})`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => handleFilterChange(e.target.value, "search")}
            className="input-field w-full pl-8 text-sm"
            placeholder="Search users by name or email..."
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => handleFilterChange(e.target.value, "plan")}
          className="input-field w-full text-sm sm:w-auto"
        >
          <option value="ALL">All Plans ({users.length})</option>
          <option value="FREE">Free ({users.filter((u: any) => u.subscriptionPlan === "FREE").length})</option>
          <option value="PREMIUM">Premium ({users.filter((u: any) => u.subscriptionPlan === "PREMIUM").length})</option>
        </select>
      </div>

      <div className="mb-2 text-xs text-slate-500">
        Showing {paginatedUsers.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} results
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-max w-full text-sm">
            <thead className="sticky top-0 border-b border-slate-200 bg-slate-50">
              <tr>
                {["User", "Email", "Plan", "Role", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u: any) => {
                  const isDeleted = Boolean(u.isDeleted)
                  const isSuspended = !isDeleted && !Boolean(u.isActive)
                  const statusLabel = isDeleted ? "Deleted" : isSuspended ? "Suspended" : "Active"
                  const statusClass = isDeleted ? "text-slate-500" : isSuspended ? "text-red-500" : "text-green-600"

                  return (
                    <tr key={u.userId} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-xs font-bold text-primary-700">
                            {u.fullName?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-700">{u.fullName || "Unknown"}</p>
                            <p className="text-xs text-slate-400">ID: {u.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 truncate text-slate-600">
                          <Mail size={12} className="shrink-0 text-slate-400" />
                          <span className="truncate text-xs">{u.email}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            u.subscriptionPlan === "PREMIUM" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {u.subscriptionPlan || "FREE"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            u.role === "ADMIN" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {u.role || "USER"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`flex w-fit items-center gap-1 text-xs font-medium ${statusClass}`}>
                          {statusLabel === "Active" ? <UserCheck size={12} /> : <UserX size={12} />}
                          {statusLabel}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {u.subscriptionPlan === "FREE" ? (
                            <button
                              onClick={() => updatePlan.mutate({ userId: u.userId, plan: "PREMIUM" })}
                              disabled={isDeleted}
                              className="flex shrink-0 items-center gap-0.5 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-600 transition-colors hover:bg-amber-100"
                              title="Upgrade to Premium"
                            >
                              <Star size={10} /> Premium
                            </button>
                          ) : (
                            <button
                              onClick={() => updatePlan.mutate({ userId: u.userId, plan: "FREE" })}
                              disabled={isDeleted}
                              className="shrink-0 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100"
                              title="Downgrade to Free"
                            >
                              To Free
                            </button>
                          )}
                          {u.role !== "ADMIN" && (
                            <button
                              onClick={() => upgradeRole.mutate(u.userId)}
                              disabled={isDeleted}
                              className="shrink-0 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-100"
                              title="Make Admin"
                            >
                              Admin
                            </button>
                          )}
                          {u.isActive && !isDeleted && (
                            <button
                              onClick={() => suspendUser.mutate(u.userId)}
                              className="shrink-0 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-100"
                              title="Suspend User"
                            >
                              Suspend
                            </button>
                          )}
                          {(isDeleted || isSuspended) && (
                            <button
                              onClick={() => restoreUser.mutate(u.userId)}
                              className="flex shrink-0 items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-600 transition-colors hover:bg-emerald-100"
                              title="Restore User"
                            >
                              <RotateCcw size={10} /> Restore
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${u.fullName}?`)) {
                                deleteUser.mutate(u.userId)
                              }
                            }}
                            disabled={isDeleted}
                            className="shrink-0 rounded p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filtered.length > 0 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </div>
    </AdminLayout>
  )
}
