import { exportApi } from '../exportApi'
import { waitFor } from '@testing-library/react'
import { rest } from 'msw'
import { server } from '../../test/msw/server'

const API_BASE = 'http://localhost:8080/api/v1'

describe('exportApi integration', () => {
  let openSpy: jest.SpyInstance
  let clickSpy: jest.SpyInstance

  beforeEach(() => {
    Object.defineProperty(window.URL, 'createObjectURL', {
      writable: true,
      value: jest.fn(() => 'blob:test-url'),
    })
    Object.defineProperty(window.URL, 'revokeObjectURL', {
      writable: true,
      value: jest.fn(),
    })
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    openSpy.mockRestore()
    clickSpy.mockRestore()
  })

  test('exportPdf returns a completed job and triggers download path', async () => {
    const appendSpy = jest.spyOn(document.body, 'appendChild')
    const removeSpy = jest.spyOn(document.body, 'removeChild')

    const result = await exportApi.exportPdf(10, 101, 1)

    expect(result.jobId).toBe('job-123')
    expect(result.status).toBe('COMPLETED')
    await waitFor(() => {
      expect(appendSpy).toHaveBeenCalled()
      expect(removeSpy).toHaveBeenCalled()
    })
  })

  test('getStatus normalizes export status values', async () => {
    server.use(
      rest.get(`${API_BASE}/export/status/job-200`, (_req, res, ctx) =>
        res(ctx.json({
          jobId: 'job-200',
          resumeId: 10,
          userId: 101,
          format: 'PDF',
          status: 'SUCCESS',
          fileUrl: '/api/v1/export/file/job-200',
        }))
      ),
      rest.get(`${API_BASE}/export/status/job-201`, (_req, res, ctx) =>
        res(ctx.json({
          jobId: 'job-201',
          resumeId: 10,
          userId: 101,
          format: 'PDF',
          status: 'unknown',
        }))
      )
    )

    const completed = await exportApi.getStatus('job-200')
    const queued = await exportApi.getStatus('job-201')

    expect(completed.status).toBe('COMPLETED')
    expect(queued.status).toBe('QUEUED')
  })

  test('downloadFile falls back to window.open on failure', async () => {
    server.use(
      rest.get(`${API_BASE}/export/file/job-404`, (_req, res, ctx) =>
        res(ctx.status(500))
      )
    )

    await exportApi.downloadFile('/api/v1/export/file/job-404', 'resume.pdf')
    expect(openSpy).toHaveBeenCalledWith('http://localhost:8080/api/v1/export/file/job-404', '_blank')
  })
})
