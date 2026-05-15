import { rest } from 'msw'

const API_BASE = 'http://localhost:8080/api/v1'

export const handlers = [
  rest.post(`${API_BASE}/auth/login`, (_req, res, ctx) => {
    return res(ctx.json({
      token: 'test-token',
      userId: 101,
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'USER',
      subscriptionPlan: 'FREE',
    }))
  }),
  rest.post(`${API_BASE}/auth/register`, (_req, res, ctx) => {
    return res(ctx.json({
      token: 'reg-token',
      userId: 202,
      email: 'new@example.com',
      fullName: 'New User',
      role: 'USER',
      subscriptionPlan: 'FREE',
    }))
  }),
  rest.post(`${API_BASE}/auth/verify-otp`, (_req, res, ctx) => {
    return res(ctx.json({
      success: true,
      message: 'verified',
      authResponse: {
        token: 'verified-token',
        email: 'otp@example.com',
        fullName: 'Otp User',
        role: 'USER',
        subscriptionPlan: 'FREE',
        userId: 11,
      },
    }))
  }),
  rest.get(`${API_BASE}/auth/profile`, (_req, res, ctx) => {
    return res(ctx.json({
      userId: 101,
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'USER',
      subscriptionPlan: 'FREE',
      isActive: true,
      provider: 'LOCAL',
      createdAt: new Date().toISOString(),
    }))
  }),
  rest.post(`${API_BASE}/resumes`, (_req, res, ctx) => {
    return res(ctx.json({
      resumeId: 10,
      userId: 101,
      title: 'My Resume',
      targetJobTitle: 'Software Engineer',
      templateId: 1,
      language: 'English',
      sectionsJson: '{}',
      status: 'DRAFT',
      atsScore: 0,
      isPublic: false,
      viewCount: 0,
      createdAt: new Date().toISOString(),
    }))
  }),
  rest.get(`${API_BASE}/resumes/10`, (_req, res, ctx) => {
    return res(ctx.json({
      resumeId: 10,
      userId: 101,
      title: 'My Resume',
      targetJobTitle: 'Software Engineer',
      templateId: 1,
      language: 'English',
      sectionsJson: '{}',
      status: 'DRAFT',
      atsScore: 0,
      isPublic: false,
      viewCount: 0,
      createdAt: new Date().toISOString(),
    }))
  }),
  rest.put(`${API_BASE}/resumes/10`, (_req, res, ctx) => {
    return res(ctx.json({
      resumeId: 10,
      userId: 101,
      title: 'Updated Resume',
      targetJobTitle: 'Senior Software Engineer',
      templateId: 1,
      language: 'English',
      sectionsJson: '{}',
      status: 'DRAFT',
      atsScore: 0,
      isPublic: false,
      viewCount: 0,
      createdAt: new Date().toISOString(),
    }))
  }),
  rest.put(`${API_BASE}/resumes/10/publish`, (_req, res, ctx) => res(ctx.json({}))),
  rest.put(`${API_BASE}/resumes/10/unpublish`, (_req, res, ctx) => res(ctx.json({}))),
  rest.post(`${API_BASE}/export/10`, (_req, res, ctx) => {
    return res(ctx.json({
      jobId: 'job-123',
      resumeId: 10,
      userId: 101,
      format: 'PDF',
      status: 'COMPLETED',
      fileUrl: '/api/v1/export/file/job-123',
      requestedAt: new Date().toISOString(),
    }))
  }),
  rest.get(`${API_BASE}/export/file/job-123`, (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.set('Content-Type', 'application/pdf'),
      ctx.body('pdf-bytes')
    )
  }),
]
