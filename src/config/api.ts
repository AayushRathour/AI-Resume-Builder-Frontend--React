const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:8080'

export const API_BASE = import.meta.env.VITE_API_BASE || `${API_ORIGIN}/api/v1`
export const OAUTH_BASE = import.meta.env.VITE_OAUTH_BASE || API_ORIGIN
