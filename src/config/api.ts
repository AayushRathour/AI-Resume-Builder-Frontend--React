const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:8080'

export const API_BASE = import.meta.env.VITE_API_BASE
  || import.meta.env.VITE_API_BASE_URL
  || `${API_ORIGIN}/api/v1`

export const OAUTH_BASE = import.meta.env.VITE_OAUTH_BASE || API_ORIGIN

export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID
export const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
export const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
export const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || API_ORIGIN.replace('http', 'ws') + '/ws'
export const WS_NOTIFICATIONS_URL = (import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_ORIGIN || 'http://localhost:8080') + '/ws-notifications'
export const IS_DEV = import.meta.env.DEV
