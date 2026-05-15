import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BuilderPage from '../BuilderPage'
import { renderWithProviders } from '../../test/renderWithProviders'
import { resumeApi } from '../../api/resumeApi'
import { sectionApi } from '../../api/sectionApi'
import { exportApi } from '../../api/exportApi'

const mockNavigate = jest.fn()

const storeState: any = {
  currentStep: 0,
  templateId: 1,
  resumeTitle: 'My Resume',
  targetJobTitle: 'Software Engineer',
  data: {
    personal: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '9999999999',
      location: 'Bhopal',
      linkedin: '',
      github: '',
      website: '',
      title: 'Engineer',
    },
    summary: 'Summary',
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
  toSectionsJson: () => JSON.stringify({
    personal: { name: 'Test User' },
    summary: 'Summary',
    skills: ['React'],
    experience: [],
    education: [],
    projects: [],
  }),
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

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { userId: 101 } }),
}))

jest.mock('../../store/useResumeStore', () => ({
  __esModule: true,
  default: mockUseResumeStore,
  STEPS: [
    { key: 'personal', label: 'Personal Info', icon: 'User' },
    { key: 'summary', label: 'Summary', icon: 'FileText' },
    { key: 'skills', label: 'Skills', icon: 'Zap' },
    { key: 'experience', label: 'Experience', icon: 'Briefcase' },
    { key: 'education', label: 'Education', icon: 'GraduationCap' },
    { key: 'projects', label: 'Projects', icon: 'FolderOpen' },
  ],
}))

jest.mock('../../api/resumeApi', () => ({
  resumeApi: {
    getById: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    publish: jest.fn(),
    unpublish: jest.fn(),
  },
}))

jest.mock('../../api/templateApi', () => ({
  templateApi: {
    getById: jest.fn(async () => ({
      templateId: 1,
      name: 'Template',
      htmlLayout: '<div>{{name}}</div>',
      cssStyles: '',
      category: 'PROFESSIONAL',
      isPremium: false,
      isActive: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    })),
  },
}))

jest.mock('../../api/sectionApi', () => ({
  sectionApi: {
    deleteAll: jest.fn(async () => { }),
    add: jest.fn(async (s: any) => s),
    getByResume: jest.fn(async () => []),
  },
}))

jest.mock('../../api/exportApi', () => ({
  exportApi: { exportPdf: jest.fn(async () => { }) },
}))

jest.mock('../../components/layout/MainLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="main-layout">{children}</div>,
}))
jest.mock('../../components/builder/StepIndicator', () => ({ __esModule: true, default: () => <div>StepIndicator</div> }))
jest.mock('../../components/builder/StepNavigation', () => ({ __esModule: true, default: () => <div>StepNavigation</div> }))
jest.mock('../../components/builder/LivePreview', () => ({ __esModule: true, default: () => <div>LivePreview</div> }))
jest.mock('../../components/builder/TemplateSwitcher', () => ({ __esModule: true, default: () => <div>TemplateSwitcher</div> }))
jest.mock('../../components/builder/PersonalInfoStep', () => ({ __esModule: true, default: () => <div>PersonalInfoStep</div> }))
jest.mock('../../components/builder/SummaryStep', () => ({ __esModule: true, default: () => <div>SummaryStep</div> }))
jest.mock('../../components/builder/SkillsStep', () => ({ __esModule: true, default: () => <div>SkillsStep</div> }))
jest.mock('../../components/builder/ExperienceStep', () => ({ __esModule: true, default: () => <div>ExperienceStep</div> }))
jest.mock('../../components/builder/EducationStep', () => ({ __esModule: true, default: () => <div>EducationStep</div> }))
jest.mock('../../components/builder/ProjectsStep', () => ({ __esModule: true, default: () => <div>ProjectsStep</div> }))

describe('BuilderPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('saves existing resume and syncs sections', async () => {
    ; (resumeApi.getById as jest.Mock).mockResolvedValue({
      resumeId: 10,
      title: 'My Resume',
      templateId: 1,
      sectionsJson: '{}',
    })

      ; (resumeApi.update as jest.Mock).mockResolvedValue({
        resumeId: 10,
        templateId: 1,
      })

    renderWithProviders(<BuilderPage />, '/builder/10')
    const saveBtn = await screen.findByRole('button', { name: /save changes/i })
    await userEvent.click(saveBtn)

    await waitFor(() => {
      expect(resumeApi.update).toHaveBeenCalled()
      expect(sectionApi.deleteAll).toHaveBeenCalledWith(10)
    })
  })

  test('handles PDF export', async () => {
    ; (resumeApi.getById as jest.Mock).mockResolvedValue({
      resumeId: 10,
      title: 'My Resume',
      templateId: 1,
      isPublic: false,
    })
      ; (resumeApi.update as jest.Mock).mockResolvedValue({ resumeId: 10 })

    renderWithProviders(<BuilderPage />, '/builder/10')

    const exportBtn = await screen.findByRole('button', { name: /export pdf/i })
    await userEvent.click(exportBtn)

    await waitFor(() => {
      expect(exportApi.exportPdf).toHaveBeenCalled()
    })
  })
})
