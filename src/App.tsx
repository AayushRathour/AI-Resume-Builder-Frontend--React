import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { ReactNode } from 'react'

/**
 * Root router composition for the frontend application.
 * Applies authentication and admin guards before protected page rendering.
 */
// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyOtpPage from './pages/VerifyOtpPage'
import DashboardPage from './pages/DashboardPage'
import TemplateGalleryPage from './pages/TemplateGalleryPage'
import BuilderPage from './pages/BuilderPage'
import PublicGalleryPage from './pages/PublicGalleryPage'
import ProfilePage from './pages/ProfilePage'
import JobMatchPage from './pages/JobMatchPage'
import AiHistoryPage from './pages/AiHistoryPage'
import ExportHistoryPage from './pages/ExportHistoryPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminTemplates from './pages/admin/AdminTemplates'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminNotifications from './pages/admin/AdminNotifications'
import OAuthSuccessPage from './pages/OAuthSuccessPage'
import PricingPage from './pages/PricingPage'
import AtsCheckerPage from './pages/AtsCheckerPage'
import NotificationCenterPage from './pages/NotificationCenterPage'
import FloatingChatbot from './components/FloatingChatbot'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, authReady } = useAuth()
  // Avoid redirect flicker while auth bootstrap is still in progress.
  if (!authReady) return null
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, authReady } = useAuth()
  // Block route resolution until role information is available.
  if (!authReady) return null
  if (!isAuthenticated) return <Navigate to="/admin-login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/gallery" element={<PublicGalleryPage />} />
      <Route path="/templates" element={<TemplateGalleryPage />} />
      <Route path="/oauth/callback" element={<OAuthSuccessPage />} />
      <Route path="/oauth2/callback" element={<OAuthSuccessPage />} />
      <Route path="/oauth/success" element={<OAuthSuccessPage />} />
      <Route path="/oauth2/success" element={<OAuthSuccessPage />} />
      <Route path="/oauth-success" element={<OAuthSuccessPage />} />
      <Route path="/pricing" element={<PricingPage />} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/builder/:resumeId" element={<ProtectedRoute><BuilderPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/job-match" element={<ProtectedRoute><JobMatchPage /></ProtectedRoute>} />
      <Route path="/ats-check" element={<ProtectedRoute><AtsCheckerPage /></ProtectedRoute>} />
      <Route path="/ai-history" element={<ProtectedRoute><AiHistoryPage /></ProtectedRoute>} />
      <Route path="/exports" element={<ProtectedRoute><ExportHistoryPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationCenterPage /></ProtectedRoute>} />

      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/templates" element={<AdminRoute><AdminTemplates /></AdminRoute>} />
      <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
      <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
          <FloatingChatbot />
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  )
}
