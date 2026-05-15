import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BuilderPage from '../pages/BuilderPage'
import { renderWithProviders } from '../test/renderWithProviders'
import { exportApi } from '../api/exportApi'
import { resumeApi } from '../api/resumeApi'

const mockNavigate = jest.fn()

const storeState: any = {
  currentStep: 0,
  templateId: 1,
  resumeTitle: 'Flow Resume',
  targetJobTitle: 'Developer',
  data: {
    personal: { name: 'Flow User', email: 'flow@example.com', phone: '', location: '', linkedin: '', github: '', website: '', title: 'Developer' },
    summary: 'summary',
    skills: ['React'],
    experience: [],
    education: [],
    projects: [],
  },
  loadFromResume: jest.fn(),
  reset: jest.fn(),
  setTemplateId: jest.fn(),
  setResumeTitle: jest.fn(),
  setTargetJobTitle: jest.fn(),
  setResumeId: jest.fn(),
  toSectionsJson: () => JSON.stringify({ personal: { name: 'Flow User' }, summary: 'summary', skills: ['React'], experience: [], education: [], projects: [] }),
}

function mockUseResumeStore(selector?: any) {
  if (typeof selector === 'function') return selector(storeState)
  return storeState
}
(mockUseResumeStore as any).getState = () => storeState

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ resumeId: '10' }),
  useSearchParams: () => [new URLSearchParams()],
  useNavigate: () => mockNavigate,
}))

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { userId: 101 } }),
}))

jest.mock('../store/useResumeStore', () => ({
  __esModule: true,
  default: mockUseResumeStore,
  STEPS: [{ key: 'personal', label: 'Personal Info', icon: 'User' }],
}))

jest.mock('../api/resumeApi', () => ({
  resumeApi: {
    getById: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    publish: jest.fn(),
    unpublish: jest.fn(),
  },
}))

jest.mock('../api/sectionApi', () => ({
  sectionApi: {
    deleteAll: jest.fn(async () => {}),
    add: jest.fn(async () => {}),
    getByResume: jest.fn(async () => []),
  },
}))

jest.mock('../api/templateApi', () => ({
  templateApi: { getById: jest.fn(async () => ({ templateId: 1, name: 'T', htmlLayout: '<div/>', cssStyles: '', category: 'PROFESSIONAL', isPremium: false, isActive: true, usageCount: 0, createdAt: '' })) },
}))

jest.mock('../api/exportApi', () => ({
  exportApi: { exportPdf: jest.fn(async () => {}) },
}))

jest.mock('../components/layout/MainLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}))
jest.mock('../components/builder/StepIndicator', () => ({ __esModule: true, default: () => <div /> }))
jest.mock('../components/builder/StepNavigation', () => ({ __esModule: true, default: () => <div /> }))
jest.mock('../components/builder/LivePreview', () => ({ __esModule: true, default: () => <div /> }))
jest.mock('../components/builder/TemplateSwitcher', () => ({ __esModule: true, default: () => <div /> }))
jest.mock('../components/builder/PersonalInfoStep', () => ({ __esModule: true, default: () => <div /> }))
jest.mock('../components/builder/SummaryStep', () => ({ __esModule: true, default: () => <div /> }))
jest.mock('../components/builder/SkillsStep', () => ({ __esModule: true, default: () => <div /> }))
jest.mock('../components/builder/ExperienceStep', () => ({ __esModule: true, default: () => <div /> }))
jest.mock('../components/builder/EducationStep', () => ({ __esModule: true, default: () => <div /> }))
jest.mock('../components/builder/ProjectsStep', () => ({ __esModule: true, default: () => <div /> }))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn(), loading: jest.fn() },
}))

describe('E2E flow: create/save/export', () => {
  test('save then export calls APIs in sequence', async () => {
    ;(resumeApi.getById as jest.Mock).mockResolvedValue({
      resumeId: 10,
      title: 'Flow Resume',
      targetJobTitle: 'Developer',
      templateId: 1,
      sectionsJson: '{}',
      atsScore: 0,
      status: 'DRAFT',
      language: 'English',
      isPublic: false,
      viewCount: 0,
      userId: 101,
      createdAt: '',
    })
    ;(resumeApi.update as jest.Mock).mockResolvedValue({ resumeId: 10, templateId: 1 })

    renderWithProviders(<BuilderPage />, '/builder/10')
    await userEvent.click(await screen.findByRole('button', { name: /save changes/i }))
    await userEvent.click(await screen.findByRole('button', { name: /export pdf/i }))

    await waitFor(() => {
      expect(resumeApi.update).toHaveBeenCalled()
      expect(exportApi.exportPdf).toHaveBeenCalledWith(10, 101, 1)
    })
  })
})
