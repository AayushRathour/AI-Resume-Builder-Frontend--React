import api from './axios'
import type { ResumeSection, ReorderRequest, SectionType } from '../types'
import { EP_SECTION } from '../config/endpoints'

function toSectionModel(raw: any): ResumeSection {
  return {
    sectionId: Number(raw.sectionId),
    resumeId: Number(raw.resumeId),
    sectionType: (raw.sectionType ?? 'CUSTOM') as SectionType,
    title: raw.title ?? 'Untitled Section',
    content: raw.content ?? '',
    displayOrder: Number(raw.orderIndex ?? raw.displayOrder ?? 1),
    isVisible: Boolean(raw.isVisible ?? true),
    aiGenerated: Boolean(raw.aiGenerated ?? false),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt,
  }
}

function toSectionPayload(section: Partial<ResumeSection>) {
  return {
    resumeId: Number(section.resumeId ?? 0),
    sectionType: section.sectionType,
    title: section.title ?? 'Untitled Section',
    content: section.content ?? '',
    displayOrder: Number(section.displayOrder ?? 1),
    isVisible: section.isVisible ?? true,
    aiGenerated: section.aiGenerated ?? false,
  }
}

export const sectionApi = {
  add: async (data: Partial<ResumeSection>) => {
    const resumeId = Number(data.resumeId ?? 0)
    if (!resumeId) throw new Error('resumeId is required to add a section')

    const response = await api.post(EP_SECTION.CREATE, toSectionPayload(data))
    return toSectionModel(response.data)
  },

  getByResume: (resumeId: number) =>
    api.get(EP_SECTION.GET_BY_RESUME(resumeId)).then(r => (r.data ?? []).map((item: any) => toSectionModel(item))),

  getById: (id: number) =>
    api.get(EP_SECTION.GET_BY_ID(id)).then(r => toSectionModel(r.data)),

  getByType: async (resumeId: number, type: SectionType) => {
    const response = await api.get(EP_SECTION.GET_BY_TYPE(resumeId, type))
    if (!response.data) return []
    return (response.data ?? []).map((item: any) => toSectionModel(item))
  },

  update: (id: number, data: Partial<ResumeSection>) =>
    api.put(EP_SECTION.UPDATE(id), toSectionPayload(data)).then(r => toSectionModel(r.data)),

  delete: (id: number) =>
    api.delete(EP_SECTION.DELETE(id)),

  deleteAll: (resumeId: number) =>
    api.delete(EP_SECTION.DELETE_ALL(resumeId)),

  reorder: (resumeId: number, orders: ReorderRequest[]) => {
    const payload = [...orders]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(order => ({ sectionId: order.sectionId, displayOrder: order.displayOrder }))

    return api.put(EP_SECTION.REORDER(resumeId), payload)
  },

  toggleVisibility: async (id: number) => {
    const current = await api.get(EP_SECTION.GET_BY_ID(id)).then(r => toSectionModel(r.data))
    const nextVisibility = !current.isVisible
    return api.put(EP_SECTION.TOGGLE_VISIBILITY(id), { isVisible: nextVisibility }).then(r => toSectionModel(r.data))
  },

  bulkUpdate: async (sections: Partial<ResumeSection>[]) => {
    const firstResumeId = Number(sections[0]?.resumeId ?? 0)
    if (!firstResumeId) {
      throw new Error('resumeId is required for bulk section update')
    }

    const payload = {
      sections: sections
        .filter(section => !!section.sectionId)
        .map(section => ({
          sectionId: Number(section.sectionId),
          sectionType: section.sectionType,
          title: section.title ?? 'Untitled Section',
          content: section.content ?? '',
          displayOrder: Number(section.displayOrder ?? 1),
          isVisible: section.isVisible ?? true,
          aiGenerated: section.aiGenerated ?? false,
        })),
    }

    return api
      .put(EP_SECTION.BULK_UPDATE(firstResumeId), payload)
      .then(r => (r.data ?? []).map((item: any) => toSectionModel(item)))
  },
}
