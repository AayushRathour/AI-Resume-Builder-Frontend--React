import api from './axios'
import type { ResumeTemplate } from '../types'
import { EP_TEMPLATE } from '../config/endpoints'

function toTemplateModel(raw: any): ResumeTemplate {
  return {
    templateId: Number(raw.templateId),
    name: raw.name ?? 'Untitled Template',
    description: raw.description ?? '',
    thumbnailUrl: raw.thumbnailUrl ?? raw.previewImageUrl ?? undefined,
    htmlLayout: raw.htmlLayout ?? raw.htmlContent ?? '<div></div>',
    cssStyles: raw.cssStyles ?? raw.cssContent ?? '',
    fieldsJson: raw.fieldsJson ?? undefined,
    category: (raw.category ?? 'PROFESSIONAL') as ResumeTemplate['category'],
    // Jackson strips 'is' prefix from boolean primitives: isPremium → premium, isActive → active
    isPremium: Boolean(raw.isPremium ?? raw.premium ?? false),
    isActive: Boolean(raw.isActive ?? raw.active ?? true),
    usageCount: Number(raw.usageCount ?? 0),
    createdAt: raw.createdAt ?? new Date().toISOString(),
  }
}

function toTemplatePayload(data: Partial<ResumeTemplate>) {
  return {
    name: data.name,
    category: data.category,
    description: data.description,
    htmlContent: data.htmlLayout,
    cssContent: data.cssStyles,
    fieldsJson: data.fieldsJson,
    previewImageUrl: data.thumbnailUrl,
    isPremium: data.isPremium ?? false,
    isActive: data.isActive ?? true,
  }
}

export const templateApi = {
  getAll: () =>
    api.get(EP_TEMPLATE.GET_ALL).then(r => (r.data ?? []).map((item: any) => toTemplateModel(item))),

  getById: (id: number) =>
    api.get(EP_TEMPLATE.GET_BY_ID(id)).then(r => toTemplateModel(r.data)),

  getFields: (id: number) =>
    api.get(`/templates/${id}/fields`).then(r => {
      const raw = r.data
      if (Array.isArray(raw)) return raw
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      }
      return []
    }),

  getFree: () =>
    api.get(EP_TEMPLATE.GET_FREE).then(r => (r.data ?? []).map((item: any) => toTemplateModel(item))),

  getPremium: () =>
    api.get(EP_TEMPLATE.GET_PREMIUM).then(r => (r.data ?? []).map((item: any) => toTemplateModel(item))),

  getByCategory: async (category: string) => {
    const all = await api.get(EP_TEMPLATE.GET_ALL).then(r => (r.data ?? []).map((item: any) => toTemplateModel(item)))
    return all.filter((template: ResumeTemplate) => template.category === category)
  },

  getPopular: () =>
    api.get(EP_TEMPLATE.GET_ALL).then(r => (r.data ?? []).map((item: any) => toTemplateModel(item))),

  create: (data: Partial<ResumeTemplate>) =>
    api.post(EP_TEMPLATE.CREATE, toTemplatePayload(data)).then(r => toTemplateModel(r.data)),

  update: (id: number, data: Partial<ResumeTemplate>) =>
    api.put(EP_TEMPLATE.UPDATE(id), toTemplatePayload(data)).then(r => toTemplateModel(r.data)),

  deactivate: (id: number) =>
    api.delete(EP_TEMPLATE.DELETE(id)),

  incrementUsage: async (_id: number) => Promise.resolve(),
}
