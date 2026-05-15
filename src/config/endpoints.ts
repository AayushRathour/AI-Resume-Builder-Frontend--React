// Centralized registry of backend API route paths.
// These paths are appended to API_BASE (`http://localhost:8080/api/v1`).

export const EP_AUTH = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  PROFILE: '/auth/profile',
  UPDATE_PASSWORD: '/auth/password',
  UPDATE_SUBSCRIPTION: '/auth/subscription',
  DEACTIVATE: '/auth/deactivate',
  SEND_OTP: '/auth/send-otp',
  VERIFY_OTP: '/auth/verify-otp',
  RESEND_OTP: '/auth/resend-otp',
} as const

export const EP_ADMIN = {
  USERS: '/admin/users',
  UPGRADE_USER: (userId: number) => `/admin/users/${userId}/upgrade`,
  SUSPEND_USER: (userId: number) => `/admin/users/${userId}/suspend`,
  RESTORE_USER: (userId: number) => `/admin/users/${userId}/restore`,
  UPDATE_SUBSCRIPTION: (userId: number) => `/admin/users/${userId}/subscription`,
  DELETE_USER: (userId: number) => `/admin/users/${userId}`,
  TEMPLATES: '/admin/templates',
  UPDATE_TEMPLATE: (templateId: number) => `/admin/templates/${templateId}`,
  ANALYTICS: '/admin/analytics',
  AI_USAGE: '/admin/ai-usage',
} as const

export const EP_PAYMENT = {
  ORDER: '/payment/order',
  VERIFY: '/payment/verify',
} as const

export const EP_RESUME = {
  CREATE: '/resumes',
  SAVE: '/resume/save',
  GET_BY_ID: (id: number) => `/resumes/${id}`,
  GET_BY_USER: (userId: number) => `/resumes/user/${userId}`,
  GET_PUBLIC: '/resumes/public',
  GET_BY_TEMPLATE: (templateId: number) => `/resumes/template/${templateId}`,
  UPDATE: (id: number) => `/resumes/${id}`,
  DELETE: (id: number) => `/resumes/${id}`,
  DUPLICATE: (id: number) => `/resumes/${id}/duplicate`,
  PUBLISH: (id: number) => `/resumes/${id}/publish`,
  UNPUBLISH: (id: number) => `/resumes/${id}/unpublish`,
  UPDATE_ATS_SCORE: (id: number) => `/resumes/${id}/ats-score`,
  BACKFILL_ATS: (userId: number) => `/resumes/user/${userId}/ats-score/backfill`,
  INCREMENT_VIEW: (id: number) => `/resumes/${id}/increment-view`,
} as const

export const EP_SECTION = {
  CREATE: '/sections',
  GET_BY_ID: (sectionId: number) => `/sections/${sectionId}`,
  GET_BY_RESUME: (resumeId: number) => `/sections/resume/${resumeId}`,
  GET_BY_TYPE: (resumeId: number, type: string) => `/sections/resume/${resumeId}/type/${type}`,
  UPDATE: (id: number) => `/sections/${id}`,
  REORDER: (resumeId: number) => `/sections/reorder/${resumeId}`,
  TOGGLE_VISIBILITY: (id: number) => `/sections/${id}/visibility`,
  BULK_UPDATE: (resumeId: number) => `/sections/bulk/${resumeId}`,
  DELETE: (id: number) => `/sections/${id}`,
  DELETE_ALL: (resumeId: number) => `/sections/resume/${resumeId}`,
} as const

export const EP_TEMPLATE = {
  CREATE: '/templates',
  GET_ALL: '/templates',
  GET_BY_ID: (id: number) => `/templates/${id}`,
  GET_FREE: '/templates/free',
  GET_PREMIUM: '/templates/premium',
  UPDATE: (id: number) => `/templates/${id}`,
  DELETE: (id: number) => `/templates/${id}`,
} as const

export const EP_AI = {
  GENERATE_SUMMARY: '/ai/summary',
  GENERATE_BULLETS: '/ai/bullets',
  GENERATE_COVER_LETTER: '/ai/cover-letter',
  IMPROVE_SECTION: '/ai/improve',
  CHECK_ATS: '/ai/ats',
  SUGGEST_SKILLS: '/ai/skills',
  TAILOR_FOR_JOB: '/ai/tailor',
  TRANSLATE: '/ai/translate',
  CHAT: '/ai/chat',
  HISTORY: (userId: number) => `/ai/history/${userId}`,
  QUOTA: (userId: number) => `/ai/quota/${userId}`,
} as const

export const EP_EXPORT = {
  EXPORT: (resumeId: number) => `/export/${resumeId}`,
  HEALTH: '/export/health',
  BY_USER: (userId: number) => `/export/user/${userId}`,
  STATS: (userId: number) => `/export/stats/${userId}`,
  STATUS: (jobId: string) => `/export/status/${jobId}`,
  DELETE: (jobId: string) => `/export/${jobId}`,
} as const

export const EP_JOB_MATCH = {
  LIVE: '/jobmatch',
  JOBS: '/jobmatch/jobs',
  SAVED_JOBS: '/jobmatch/saved-jobs',
  ANALYZE: '/jobmatch/analyze',
  SEARCH: '/jobmatch/search',
  TOP: '/jobmatch/top',
  BOOKMARK_V2: '/jobmatch/bookmark',
  OLD_MATCH: '/jobmatch/match',
  BY_USER: (userId: number) => `/jobmatch/matches/${userId}`,
  BY_RESUME: (resumeId: number) => `/jobmatch/matches/resume/${resumeId}`,
  BY_ID: (matchId: string | number) => `/jobmatch/matches/id/${matchId}`,
  BOOKMARK: (matchId: string | number) => `/jobmatch/matches/${matchId}/bookmark`,
  DELETE: (matchId: string | number) => `/jobmatch/matches/${matchId}`,
} as const

export const EP_NOTIFICATION = {
  CREATE: '/notifications',
  BY_RECIPIENT: (recipientId: number) => `/notifications/${recipientId}`,
  UNREAD_COUNT: (recipientId: number) => `/notifications/unread/${recipientId}`,
  MARK_READ: (id: string | number) => `/notifications/read/${id}`,
  MARK_ALL_READ: (recipientId: number) => `/notifications/read-all/${recipientId}`,
  DELETE: (id: string | number) => `/notifications/${id}`,
  GET_ALL: '/notifications',
} as const
