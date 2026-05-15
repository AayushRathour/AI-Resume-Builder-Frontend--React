import api from './axios'
import type { JobMatch } from '../types'
import { EP_JOB_MATCH } from '../config/endpoints'

function toMatchModel(raw: any): JobMatch {
  return {
    matchId: raw.matchId,
    resumeId: Number(raw.resumeId ?? 0),
    userId: Number(raw.userId ?? 0),
    jobTitle: raw.jobTitle ?? 'Untitled Job',
    jobDescription: raw.jobDescription ?? '',
    company: raw.company,
    location: raw.location,
    jobUrl: raw.applyUrl ?? raw.jobUrl,
    matchScore: Math.round(Number(raw.matchScore ?? 0)),
    missingSkills: raw.missingSkills,
    recommendations: raw.recommendation,
    source: (raw.source ?? 'THEIRSTACK') as JobMatch['source'],
    isBookmarked: Boolean(raw.isBookmarked ?? false),
    matchedAt: raw.createdAt ?? new Date().toISOString(),
  }
}

export const jobMatchApi = {
  // STEP 7 & 8: Enhanced API with request/response logging
  analyze: (userId: number, resumeId: number, jobTitle?: string, location?: string) => {
    const formData = new FormData()
    formData.append('userId', userId.toString())
    formData.append('resumeId', resumeId.toString())
    if (jobTitle?.trim()) formData.append('jobTitle', jobTitle.trim())
    if (location?.trim()) formData.append('location', location.trim())
    return api.post(EP_JOB_MATCH.ANALYZE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 240000, // AI analysis can take longer when provider fallback is used
    }).then(r => {
      const payload = r.data ?? {}
      if (payload.status === 'failed') {
        throw new Error(payload.message || 'AI service unavailable')
      }
      return payload.data ?? payload
    }).catch(err => { 
      console.error('[ANALYZE] Failed:', err.response?.data || err.message); 
      throw err 
    })
  },

  analyzeWithFile: (formData: FormData) => {
    return api.post(EP_JOB_MATCH.ANALYZE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 240000, // AI analysis can take longer when provider fallback is used
    }).then(r => {
      const payload = r.data ?? {}
      if (payload.status === 'failed') {
        throw new Error(payload.message || 'AI service unavailable')
      }
      return payload.data ?? payload
    }).catch(err => { 
      console.error('[ANALYZE-FILE] Failed:', err.response?.data || err.message); 
      throw err 
    })
  },

  getByResume: (resumeId: number) => {
    return api.get(EP_JOB_MATCH.BY_RESUME(resumeId)).then(r => {
      if (!r.data || !Array.isArray(r.data)) { console.warn('[GET-RESUME] Invalid response'); return [] }
      return r.data.map((item: any) => toMatchModel(item))
    }).catch(err => { console.error('[GET-RESUME] Failed'); return [] })
  },

  getByUser: (userId: number) => {
    return api.get(EP_JOB_MATCH.JOBS, { params: { userId } }).then(r => {
      if (!r.data || !Array.isArray(r.data)) { console.warn('[GET-USER] Invalid response'); return [] }
      return r.data.map((item: any) => toMatchModel(item))
    }).catch(err => { console.error('[GET-USER] Failed'); return [] })
  },

  getTopMatches: (userId: number, limit = 20) => {
    return api.get(EP_JOB_MATCH.TOP, { params: { userId, limit } }).then(r => {
      if (!r.data || !Array.isArray(r.data)) { console.warn('[GET-TOP] Invalid response'); return [] }
      return r.data.map((item: any) => toMatchModel(item))
    }).catch(err => { console.error('[GET-TOP] Failed:', err.message); return [] })
  },

  search: (query: string, location?: string) =>
    api.get(EP_JOB_MATCH.SEARCH, { params: { query, location } }).then(r => r.data ?? []),

  getSavedJobs: () =>
    api.get(EP_JOB_MATCH.SAVED_JOBS).then(r => r.data ?? []),

  getById: (matchId: number | string) =>
    api.get(EP_JOB_MATCH.BY_ID(matchId)).then(r => toMatchModel(r.data)),

  bookmark: (matchId: number | string, bookmarked: boolean) =>
    api.post(EP_JOB_MATCH.BOOKMARK_V2, { matchId, bookmarked }).then(r => toMatchModel(r.data)),

  fetchLinkedIn: (jobTitle: string, _location: string) =>
    jobMatchApi.search(jobTitle),

  fetchNaukri: (jobTitle: string, _location: string) => jobMatchApi.search(jobTitle),

  getRecommendations: async (matchId: number | string) =>
    jobMatchApi.getById(matchId).then(match => match.recommendations ?? ''),

  delete: (matchId: number | string) =>
    api.delete(EP_JOB_MATCH.DELETE(matchId)),
}
