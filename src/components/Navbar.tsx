import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { notificationApi } from '../api/notificationApi'
import { useState } from 'react'
import { Bell, User, LogOut, Settings, ChevronDown, FileText, Star, Zap, Menu, X } from 'lucide-react'
import NotificationPanel from './NotificationPanel'

export default function Navbar() {
  const { user, logout, isAdmin, isPremium } = useAuth()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count', user?.userId],
    queryFn: () => notificationApi.getUnreadCount(user!.userId),
    enabled: !!user,
    refetchInterval: 30_000,
  })

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <FileText size={16} className="text-white" />
          </div>
          <span className="font-bold text-xl text-primary-700">ResumeAI</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/templates" className="text-slate-600 hover:text-primary-600 transition-colors">Templates</Link>
          <Link to="/gallery" className="text-slate-600 hover:text-primary-600 transition-colors">Gallery</Link>
          {user && <>
            <Link to="/dashboard" className="text-slate-600 hover:text-primary-600 transition-colors">Dashboard</Link>
            <Link to="/job-match" className="text-slate-600 hover:text-primary-600 transition-colors">Job Match</Link>
            <Link to="/ats-check" className="text-slate-600 hover:text-primary-600 transition-colors">ATS Check</Link>
          </>}
          {isAdmin && <Link to="/admin" className="text-red-600 hover:text-red-700 transition-colors">Admin</Link>}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowMobileNav(!showMobileNav)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle navigation"
          >
            {showMobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
          {!isPremium && user && (
            <Link to="/pricing" className="hidden sm:flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors">
              <Star size={12} /> Upgrade to Premium
            </Link>
          )}
          {isPremium && (
            <span className="hidden sm:flex items-center gap-1 badge-premium"><Zap size={10} />Premium</span>
          )}

          {user ? (
            <>
              {/* Notifications */}
              <div className="relative">
                <button onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifs && (
                  <NotificationPanel onClose={() => setShowNotifs(false)} />
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 hover:bg-slate-100 px-2 py-1.5 rounded-lg transition-colors">
                  <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-xs">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-700 hidden sm:block">{user.fullName.split(' ')[0]}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 animate-fade-in">
                    <Link to="/profile" onClick={() => setShowMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <User size={14} /> Profile
                    </Link>
                    <Link to="/exports" onClick={() => setShowMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <Settings size={14} /> Export History
                    </Link>
                    {isPremium && (
                      <Link to="/ai-history" onClick={() => setShowMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                        <Zap size={14} /> AI History
                      </Link>
                    )}
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary text-sm py-1.5 px-3">Log in</Link>
              <Link to="/register" className="btn-primary text-sm py-1.5 px-3">Sign up free</Link>
            </div>
          )}
        </div>
      </div>
      {showMobileNav && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 space-y-2 text-sm font-medium">
            <Link to="/templates" onClick={() => setShowMobileNav(false)} className="block text-slate-600 hover:text-primary-600">Templates</Link>
            <Link to="/gallery" onClick={() => setShowMobileNav(false)} className="block text-slate-600 hover:text-primary-600">Gallery</Link>
            {user && (
              <>
                <Link to="/dashboard" onClick={() => setShowMobileNav(false)} className="block text-slate-600 hover:text-primary-600">Dashboard</Link>
                <Link to="/job-match" onClick={() => setShowMobileNav(false)} className="block text-slate-600 hover:text-primary-600">Job Match</Link>
                <Link to="/ats-check" onClick={() => setShowMobileNav(false)} className="block text-slate-600 hover:text-primary-600">ATS Check</Link>
              </>
            )}
            {isAdmin && (
              <Link to="/admin" onClick={() => setShowMobileNav(false)} className="block text-red-600 hover:text-red-700">Admin</Link>
            )}
            {!user && (
              <div className="pt-2 flex items-center gap-2">
                <Link to="/login" onClick={() => setShowMobileNav(false)} className="btn-secondary text-sm py-1.5 px-3">Log in</Link>
                <Link to="/register" onClick={() => setShowMobileNav(false)} className="btn-primary text-sm py-1.5 px-3">Sign up free</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
