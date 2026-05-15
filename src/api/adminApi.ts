import api from './axios'
import type { ResumeTemplate, User } from '../types'
import { EP_ADMIN } from '../config/endpoints'

export interface AdminAnalytics {
  users: number
  premiumUsers: number
  templates: number
  resumes: number
}

export interface AiUsageRow {
  userId: number
  email: string
  requests: number
}

export interface AiUsageSummary {
  usersWithUsage: number
  totalRequests: number
  perUser: AiUsageRow[]
}

export const adminApi = {
  getUsers: () => api.get<User[]>(EP_ADMIN.USERS).then(r => {
    const raw = r.data ?? []
    return raw.map((u: any) => ({
      ...u,
      // normalize boolean flag - backend may return `isActive` or `active`
      isActive: Boolean(u.isActive ?? u.active ?? true),
      isDeleted: Boolean(u.isDeleted ?? u.deleted ?? false),
      deletedAt: u.deletedAt ?? u.deleted_at ?? undefined,
      // ensure createdAt exists
      createdAt: u.createdAt ?? u.created_at ?? new Date().toISOString(),
    })) as User[]
  }),

  upgradeUser: (userId: number) => api.put<User>(EP_ADMIN.UPGRADE_USER(userId)).then(r => r.data),

  suspendUser: (userId: number) => api.put<User>(EP_ADMIN.SUSPEND_USER(userId)).then(r => r.data),

  restoreUser: (userId: number) => api.put<User>(EP_ADMIN.RESTORE_USER(userId)).then(r => r.data),

  deleteUser: (userId: number) => api.delete(EP_ADMIN.DELETE_USER(userId)),

  updateSubscription: (userId: number, plan: 'FREE' | 'PREMIUM') =>
    api.put<User>(EP_ADMIN.UPDATE_SUBSCRIPTION(userId), { plan }).then(r => r.data),

  getTemplates: () => api.get(EP_ADMIN.TEMPLATES).then(r => (r.data ?? []).map((raw: any) => ({
    templateId: Number(raw.templateId),
    name: raw.name ?? 'Untitled Template',
    description: raw.description ?? '',
    thumbnailUrl: raw.thumbnailUrl ?? raw.previewImageUrl ?? undefined,
    htmlLayout: raw.htmlLayout ?? raw.htmlContent ?? '',
    cssStyles: raw.cssStyles ?? raw.cssContent ?? '',
    fieldsJson: raw.fieldsJson ?? undefined,
    category: (raw.category ?? 'PROFESSIONAL') as ResumeTemplate['category'],
    isPremium: Boolean(raw.isPremium ?? raw.premium ?? false),
    isActive: Boolean(raw.isActive ?? raw.active ?? true),
    usageCount: Number(raw.usageCount ?? 0),
    createdAt: raw.createdAt ?? new Date().toISOString(),
  } as ResumeTemplate))),

  createTemplate: (payload: Partial<ResumeTemplate>) =>
    api.post<ResumeTemplate>(EP_ADMIN.TEMPLATES, {
      name: payload.name,
      category: payload.category,
      description: payload.description,
      htmlContent: payload.htmlLayout,
      cssContent: payload.cssStyles,
      previewImageUrl: payload.thumbnailUrl,
      isPremium: payload.isPremium ?? false,
      isActive: payload.isActive ?? true,
    }).then(r => r.data),

  updateTemplate: (templateId: number, payload: Partial<ResumeTemplate>) =>
    api.put<ResumeTemplate>(EP_ADMIN.UPDATE_TEMPLATE(templateId), {
      name: payload.name,
      category: payload.category,
      description: payload.description,
      htmlContent: payload.htmlLayout,
      cssContent: payload.cssStyles,
      previewImageUrl: payload.thumbnailUrl,
      isPremium: payload.isPremium ?? false,
      isActive: payload.isActive ?? true,
    }).then(r => r.data),

  deleteTemplate: (templateId: number) =>
    api.delete(EP_ADMIN.UPDATE_TEMPLATE(templateId)),

  getDashboard: () => api.get<AdminAnalytics>('/admin/dashboard').then(r => r.data),

  getAiUsage: () => api.get<AiUsageSummary>(EP_ADMIN.AI_USAGE).then(r => r.data),
}
