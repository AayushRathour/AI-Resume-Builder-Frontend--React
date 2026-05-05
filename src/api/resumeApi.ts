import api from './axios'
import type { Resume } from '../types'
import { EP_RESUME } from '../config/endpoints'

type ResumePayload = {
  name?: string
  title: string
  email?: string
  phone?: string
  location?: string
  targetJobTitle: string
  templateId: number | null
  language: string
  summary?: string
  skills?: string
  experience?: string
  education?: string
  projects?: string
  sectionsJson: string
}

function cleanOrDefault(value: string | undefined, fallback: string): string {
  const cleaned = value?.trim()
  return cleaned ? cleaned : fallback
}

function toResumePayload(data: Partial<Resume>, current?: Partial<Resume>): ResumePayload {
  const resolvedTemplateId = data.templateId ?? current?.templateId ?? null
  const normalizedTemplateId = Number.isFinite(Number(resolvedTemplateId)) && Number(resolvedTemplateId) > 0
    ? Number(resolvedTemplateId)
    : null

  return {
    name: data.name ?? current?.name,
    title: cleanOrDefault(data.title ?? current?.title, 'Untitled Resume'),
    email: data.email ?? current?.email,
    phone: data.phone ?? current?.phone,
    location: data.location ?? current?.location,
    targetJobTitle: cleanOrDefault(data.targetJobTitle ?? current?.targetJobTitle, 'No Title'),
    templateId: normalizedTemplateId,
    language: cleanOrDefault(data.language ?? current?.language, 'English'),
    summary: data.summary ?? current?.summary,
    skills: data.skills ?? current?.skills,
    experience: data.experience ?? current?.experience,
    education: data.education ?? current?.education,
    projects: data.projects ?? current?.projects,
    sectionsJson: (data as any).sectionsJson ?? (current as any)?.sectionsJson ?? '',
  }
}

function toResumeModel(raw: any, fallbackUserId?: number): Resume {
  return {
    resumeId: Number(raw.resumeId),
    userId: Number(raw.userId ?? fallbackUserId ?? 0),
    name: raw.name ?? undefined,
    title: raw.title ?? 'Untitled Resume',
    email: raw.email ?? undefined,
    phone: raw.phone ?? undefined,
    location: raw.location ?? undefined,
    targetJobTitle: raw.targetJobTitle ?? '',
    templateId: raw.templateId != null ? Number(raw.templateId) : undefined,
    summary: raw.summary ?? undefined,
    skills: raw.skills ?? undefined,
    experience: raw.experience ?? undefined,
    education: raw.education ?? undefined,
    projects: raw.projects ?? undefined,
    atsScore: Number(raw.atsScore ?? 0),
    status: (raw.status ?? 'DRAFT') as 'DRAFT' | 'COMPLETE',
    language: raw.language ?? 'English',
    sectionsJson: raw.sectionsJson ?? '',
    isPublic: Boolean(raw.isPublic),
    viewCount: Number(raw.viewCount ?? 0),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt,
  }
}

export const resumeApi = {
  create: async (data: Partial<Resume>) => {
    const payload = toResumePayload(data)
    const response = await api.post(EP_RESUME.SAVE, payload)
    return toResumeModel(response.data)
  },

  getById: (id: number) =>
    api.get(EP_RESUME.GET_BY_ID(id)).then(r => toResumeModel(r.data)),

  getByUser: (userId: number) =>
    api.get(EP_RESUME.GET_BY_USER(userId)).then(r => (r.data ?? []).map((item: any) => toResumeModel(item, userId))),

  getPublic: () =>
    api.get(EP_RESUME.GET_PUBLIC).then(r => (r.data ?? []).map((item: any) => toResumeModel(item))),

  getByTemplate: (templateId: number) =>
    api.get(EP_RESUME.GET_BY_TEMPLATE(templateId)).then(r => (r.data ?? []).map((item: any) => toResumeModel(item))),

  update: async (id: number, data: Partial<Resume>) => {
    if (Object.keys(data).length === 1 && typeof data.isPublic === 'boolean') {
      await (data.isPublic ? api.put(EP_RESUME.PUBLISH(id)) : api.put(EP_RESUME.UNPUBLISH(id)))
      const refreshed = await api.get(EP_RESUME.GET_BY_ID(id))
      return toResumeModel({ ...refreshed.data, isPublic: data.isPublic })
    }

    const current = await api.get(EP_RESUME.GET_BY_ID(id)).then(r => toResumeModel(r.data))
    const payload = toResumePayload(data, current)
    const updated = await api.put(EP_RESUME.UPDATE(id), payload).then(r => toResumeModel(r.data, current.userId))

    if (typeof data.isPublic === 'boolean') {
      await (data.isPublic ? api.put(EP_RESUME.PUBLISH(id)) : api.put(EP_RESUME.UNPUBLISH(id)))
      updated.isPublic = data.isPublic
    }

    if (data.status) {
      updated.status = data.status
    }

    return updated
  },

  delete: (id: number) =>
    api.delete(EP_RESUME.DELETE(id)),

  duplicate: (id: number) =>
    api.post(EP_RESUME.DUPLICATE(id)).then(r => toResumeModel(r.data)),

  publish: (id: number) =>
    api.put(EP_RESUME.PUBLISH(id)),

  unpublish: (id: number) =>
    api.put(EP_RESUME.UNPUBLISH(id)),

  updateAtsScore: (id: number, score: number) =>
    api.put(EP_RESUME.UPDATE_ATS_SCORE(id), undefined, { params: { score } }),

  incrementView: (id: number) =>
    api.put(EP_RESUME.INCREMENT_VIEW(id)),
}
