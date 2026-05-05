import axios from 'axios'
import { API_BASE } from '../config/api'

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
    || localStorage.getItem('token')
    || sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(AUTH_USER_KEY)
      sessionStorage.removeItem(AUTH_TOKEN_KEY)
      sessionStorage.removeItem(AUTH_USER_KEY)

      const publicPaths = ['/', '/login', '/register', '/gallery', '/templates', '/oauth/callback']
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login'
      }
    }

    return Promise.reject(err)
  }
)

export default api
