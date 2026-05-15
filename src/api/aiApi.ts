import api from './axios'
import type { AiRequest, AtsResult, QuotaInfo } from '../types'
import { EP_AI } from '../config/endpoints'
import { queryClient } from '../lib/queryClient'

/**
 * AI service client for summary generation, bullet improvement, ATS checks,
 * quota reads, and chat interactions.
 */
function splitLines(text?: string) {
  if (!text) return []
  return text
    .split(/\r?\n|\./)
    .map(line => line.trim())
    .filter(Boolean)
}

function unwrap<T>(payload: any): T {
  return (payload && payload.data) ? payload.data : payload
}

async function withQuotaRefresh<T>(userId: number, request: Promise<T>): Promise<T> {
  const result = await request
  queryClient.invalidateQueries({ queryKey: ['quota', userId] })
  return result
}

export const aiApi = {
  generateSummary: (userId: number, _plan: string, jobTitle: string, yearsExp: number, skills: string, additionalContext?: string) =>
    withQuotaRefresh(
      userId,
      api.post(
        EP_AI.GENERATE_SUMMARY,
        {
          jobTitle,
          yearsOfExperience: String(yearsExp),
          keySkills: skills,
          additionalContext: additionalContext || '',
        },
        { params: { userId } }
      ).then(r => unwrap<any>(r.data)?.text ?? '')
    ),

  generateBullets: (userId: number, _plan: string, jobTitle: string, company: string, description: string) =>
    withQuotaRefresh(
      userId,
      api.post(
        EP_AI.GENERATE_BULLETS,
        {
          jobTitle,
          companyName: company,
          responsibilities: description,
        },
        { params: { userId } }
      ).then(r => splitLines(unwrap<any>(r.data)?.text))
    ),

  generateCoverLetter: (userId: number, _plan: string, resumeId: number, jobDescription: string) =>
    withQuotaRefresh(
      userId,
      api.post(
        EP_AI.GENERATE_COVER_LETTER,
        {
          jobTitle: '',
          companyName: '',
          jobDescription,
        },
        { params: { userId, resumeId } }
      ).then(r => unwrap<any>(r.data)?.text ?? '')
    ),

  improveSection: (userId: number, _plan: string, sectionType: string, content: string) =>
    withQuotaRefresh(
      userId,
      api.post(
        EP_AI.IMPROVE_SECTION,
        {
          sectionType,
          currentContent: content,
        },
        { params: { userId } }
      ).then(r => unwrap<any>(r.data)?.text ?? content)
    ),

  checkAts: (userId: number, _plan: string, resumeId: number, resumeText: string, jobDescription: string) =>
    withQuotaRefresh(
      userId,
      api.post(
        EP_AI.CHECK_ATS,
        {
          resumeContent: resumeText,
          jobDescription,
        },
        { params: { userId, resumeId } }
      ).then(r => {
        const data = unwrap<any>(r.data) ?? {}
        return {
          score: Number(data.score ?? 0),
          missingKeywords: data.missingKeywords ?? [],
          suggestions: splitLines(data.recommendations),
          rawResponse: data.recommendations ?? '',
        } as AtsResult
      })
    ),

  suggestSkills: (userId: number, jobTitle: string, currentSkills: string = '', industry: string = 'General') =>
    withQuotaRefresh(
      userId,
      api.post(
        EP_AI.SUGGEST_SKILLS,
        { jobTitle, currentSkills, industry },
        { params: { userId } }
      ).then(r => splitLines(unwrap<any>(r.data)?.text))
    ),

  tailorForJob: (userId: number, _plan: string, resumeJson: string, jobDescription: string) =>
    withQuotaRefresh(
      userId,
      api.post(
        EP_AI.TAILOR_FOR_JOB,
        {
          resumeContent: resumeJson,
          jobDescription,
        },
        { params: { userId } }
      ).then(r => unwrap<any>(r.data)?.text ?? '')
    ),

  translate: (userId: number, _plan: string, resumeJson: string, targetLanguage: string) =>
    withQuotaRefresh(
      userId,
      api.post(
        EP_AI.TRANSLATE,
        {
          resumeContent: resumeJson,
          targetLanguage,
        },
        { params: { userId } }
      ).then(r => unwrap<any>(r.data)?.text ?? '')
    ),

  getHistory: (userId: number) =>
    api.get(EP_AI.HISTORY(userId)).then(r => {
      const rows = unwrap<any[]>(r.data) ?? []
      return rows.map((row: any) => ({
        requestId: row.requestId,
        userId: Number(row.userId ?? userId),
        resumeId: row.resumeId ? Number(row.resumeId) : undefined,
        requestType: String(row.requestType ?? 'UNKNOWN'),
        inputPrompt: row.inputPrompt ?? '',
        aiResponse: row.aiResponse ?? '',
        model: String(row.model ?? ''),
        tokensUsed: Number(row.tokensUsed ?? 0),
        status: row.status ?? 'COMPLETED',
        createdAt: row.createdAt ?? new Date().toISOString(),
        completedAt: row.completedAt,
      })) as AiRequest[]
    }),

  getQuota: (userId: number) =>
    api.get(EP_AI.QUOTA(userId)).then(r => {
      const data = unwrap<any>(r.data) ?? {}
      const contentAllowed = Math.max(0, Number(data.callsAllowed ?? 0))
      const atsAllowed = Math.max(0, Number(data.atsChecksAllowed ?? 0))
      const contentUsed = Math.max(0, Number(data.callsUsedThisMonth ?? 0))
      const atsUsed = Math.max(0, Number(data.atsChecksUsedThisMonth ?? 0))
      const contentRemaining = Math.max(0, Number(data.remainingCalls ?? Math.max(contentAllowed - contentUsed, 0)))
      const atsRemaining = Math.max(0, Number(data.remainingAtsChecks ?? Math.max(atsAllowed - atsUsed, 0)))
      return {
        contentRemaining,
        atsRemaining,
        contentAllowed,
        atsAllowed,
        contentUsed,
        atsUsed,
      } as QuotaInfo
    }),

  chat: (userId: number, message: string, context?: string) =>
    withQuotaRefresh(
      userId,
      api.post(
        EP_AI.CHAT,
        { message, context: context || '' },
        { params: { userId } }
      ).then(r => unwrap<any>(r.data)?.text ?? '')
    ),
}
