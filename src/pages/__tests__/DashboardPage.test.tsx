import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardPage from '../DashboardPage'
import { renderWithProviders } from '../../test/renderWithProviders'
import { resumeApi } from '../../api/resumeApi'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { userId: 101 },
    isPremium: true,
  }),
}))

jest.mock('../../api/resumeApi', () => ({
  resumeApi: {
    getByUser: jest.fn(),
    delete: jest.fn(async () => { }),
    duplicate: jest.fn(async () => ({ resumeId: 22 })),
    publish: jest.fn(async () => { }),
    unpublish: jest.fn(async () => { }),
  },
}))

jest.mock('../../api/templateApi', () => ({
  templateApi: {
    getAll: jest.fn(async () => []),
  },
}))

jest.mock('../../api/exportApi', () => ({
  exportApi: {
    getStats: jest.fn(async () => ({})),
  },
}))

jest.mock('../../components/layout/MainLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}))
jest.mock('../../components/QuotaBadge', () => ({
  __esModule: true,
  default: () => <div>QuotaBadge</div>,
}))
jest.mock('../../components/AtsScoreBar', () => ({
  __esModule: true,
  default: ({ score }: any) => <div>ATS {score}</div>,
}))
jest.mock('../../components/builder/ResumePreviewFrame', () => ({
  __esModule: true,
  default: () => <div>ResumePreviewFrame</div>,
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    window.confirm = jest.fn(() => true)
  })

  test('renders resumes and deletes selected resume', async () => {
    ; (resumeApi.getByUser as jest.Mock).mockResolvedValue([
      {
        resumeId: 10,
        userId: 101,
        title: 'QA Resume',
        targetJobTitle: 'Engineer',
        atsScore: 70,
        status: 'DRAFT',
        language: 'English',
        isPublic: false,
        viewCount: 0,
        createdAt: '2026-05-13T00:00:00Z',
        sectionsJson: '{}',
      },
    ])

    renderWithProviders(<DashboardPage />, '/dashboard')

    expect(await screen.findByText('QA Resume')).toBeInTheDocument()
    const deleteButtons = screen.getAllByTitle('Delete')
    await userEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(resumeApi.delete).toHaveBeenCalledWith(10)
    })
  })
})
