import api from './axios'
import type { ExportJob } from '../types'
import { EP_EXPORT } from '../config/endpoints'
import { API_BASE } from '../config/api'

function normalizeStatus(rawStatus: string | undefined): ExportJob['status'] {
  const status = String(rawStatus ?? '').toUpperCase()
  if (status === 'COMPLETED' || status === 'FAILED' || status === 'PROCESSING' || status === 'QUEUED') return status
  if (status === 'SUCCESS') return 'COMPLETED'
  return 'QUEUED'
}

function toExportJob(raw: any, format: ExportJob['format'], resumeId: number, userId: number): ExportJob {
  return {
    jobId: String(raw.jobId ?? `${resumeId}-${Date.now()}`),
    resumeId: Number(raw.resumeId ?? resumeId),
    userId: Number(raw.userId ?? userId),
    format: (raw.format ?? format ?? 'PDF') as ExportJob['format'],
    status: normalizeStatus(raw.status),
    fileUrl: raw.fileUrl ?? raw.filePath,
    fileSizeKb: raw.fileSizeKb ? Number(raw.fileSizeKb) : undefined,
    requestedAt: raw.requestedAt ?? new Date().toISOString(),
    completedAt: raw.completedAt,
    expiresAt: raw.expiresAt,
  }
}

function resolveBaseOrigin() {
  try {
    return new URL(API_BASE).origin
  } catch {
    return 'http://localhost:8080'
  }
}

async function triggerExport(resumeId: number, userId: number, format: ExportJob['format'], templateId?: number | null) {
  const response = await api.post(
    EP_EXPORT.EXPORT(resumeId),
    undefined,
    {
      headers: { 'X-User-Id': String(userId) },
      params: templateId ? { format, templateId } : { format },
    }
  )

  const job = toExportJob(response.data, format, resumeId, userId)

  // If export completed immediately, trigger download
  if (job.status === 'COMPLETED' && job.fileUrl) {
    triggerDownload(job.fileUrl, `resume_${resumeId}.${format.toLowerCase()}`)
  }

  return job
}

async function triggerDownload(fileUrl: string, filename: string) {
  // Use axios to download so the auth interceptor attaches the Bearer token.
  // A plain <a href> is a direct browser navigation — no Authorization header is sent,
  // which causes the gateway JwtAuthFilter to reject with 401 "Unauthorized".
  const baseOrigin = resolveBaseOrigin()

  // fileUrl may be absolute or relative (e.g. /api/v1/export/file/{jobId})
  const rawPath = fileUrl.startsWith('http')
    ? fileUrl.replace(baseOrigin, '') // make relative so it goes through our api baseURL
    : fileUrl
  const strippedApiPrefix = rawPath.replace(/^\/api\/v1\/?/, '')
  const downloadUrl = strippedApiPrefix.replace(/^\/+/, '') // keep it relative so axios baseURL is used

  try {
    const response = await api.get(downloadUrl, { responseType: 'blob' })
    const blob = new Blob([response.data])
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  } catch {
    // Fallback: open in new tab (will work if the path is public in the gateway)
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${baseOrigin}${fileUrl}`
    window.open(fullUrl, '_blank')
  }
}

export const exportApi = {
  exportPdf: (resumeId: number, userId: number, templateId?: number | null) =>
    triggerExport(resumeId, userId, 'PDF', templateId),

  exportDocx: (resumeId: number, userId: number) =>
    triggerExport(resumeId, userId, 'DOCX'),

  exportJson: (resumeId: number, userId: number) =>
    triggerExport(resumeId, userId, 'JSON'),

  getStatus: (jobId: string) =>
    api.get(EP_EXPORT.STATUS(jobId)).then(r => toExportJob(r.data, 'PDF', Number(r.data?.resumeId ?? 0), Number(r.data?.userId ?? 0))),

  getByUser: (userId: number) =>
    api.get(EP_EXPORT.BY_USER(userId)).then(r => (r.data ?? []).map((item: any) =>
      toExportJob(item, (item?.format ?? 'PDF') as ExportJob['format'], Number(item?.resumeId ?? 0), userId))),

  getStats: (userId: number) =>
    api.get(EP_EXPORT.STATS(userId)).then(r => r.data),

  downloadFile: (fileUrl: string, filename: string) =>
    triggerDownload(fileUrl, filename),

  delete: (jobId: string) =>
    api.delete(EP_EXPORT.DELETE(jobId)),
}
