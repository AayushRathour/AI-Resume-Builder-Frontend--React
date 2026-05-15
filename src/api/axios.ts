import axios from 'axios'
import { API_BASE } from '../config/api'

/**
 * Shared Axios client for all backend communication.
 * Applies auth token injection and centralized 401 session cleanup.
 */
const AUTH_TOKEN_KEY = 'resumeai_token'
const AUTH_USER_KEY = 'resumeai_user'

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
    || sessionStorage.getItem(AUTH_TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(AUTH_USER_KEY)
      localStorage.removeItem('token')
      sessionStorage.removeItem(AUTH_TOKEN_KEY)
      sessionStorage.removeItem(AUTH_USER_KEY)
      sessionStorage.removeItem('token')

      const publicPaths = [
        '/',
        '/login',
        '/admin-login',
        '/register',
        '/gallery',
        '/templates',
        '/oauth/callback',
        '/oauth2/callback',
        '/oauth/success',
        '/oauth2/success',
        '/oauth-success',
        '/verify-otp',
      ]

      if (!publicPaths.includes(window.location.pathname)) {
        const target = window.location.pathname.startsWith('/admin')
          ? '/admin-login'
          : '/login'
        window.location.href = target
      }
    }

    return Promise.reject(err)
  }
)

export default api
