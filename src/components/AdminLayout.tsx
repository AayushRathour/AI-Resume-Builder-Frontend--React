import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import MainLayout from './layout/MainLayout'
import { Users, LayoutTemplate, BarChart3, Bell, Shield } from 'lucide-react'

const adminNav = [
  { to: '/admin',                label: 'Dashboard',     icon: Shield },
  { to: '/admin/users',          label: 'Users',          icon: Users },
  { to: '/admin/templates',      label: 'Templates',      icon: LayoutTemplate },
  { to: '/admin/analytics',      label: 'Analytics',      icon: BarChart3 },
  { to: '/admin/notifications',  label: 'Notifications',  icon: Bell },
]

export default function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const loc = useLocation()
  return (
    <MainLayout>
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-56 flex-shrink-0">
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-red-600 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Admin Panel</p>
              </div>
              <nav className="p-2 space-y-0.5">
                {adminNav.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${loc.pathname === to ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <Icon size={16} /> {label}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>
          {/* Main */}
          <main className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-800 mb-5">{title}</h1>
            {children}
          </main>
        </div>
    </MainLayout>
  )
}
