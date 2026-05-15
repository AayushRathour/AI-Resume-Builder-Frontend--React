import { screen } from '@testing-library/react'
import PublicGalleryPage from '../PublicGalleryPage'
import { renderWithProviders } from '../../test/renderWithProviders'
import { resumeApi } from '../../api/resumeApi'

// Mocking resumeApi
jest.mock('../../api/resumeApi', () => ({
  resumeApi: {
    getPublic: jest.fn(),
  },
}))

// Mocking useAuth and useNotifications
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
  }),
}))

jest.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({
    unreadCount: 0,
    connected: true,
  }),
}))

jest.mock('../../components/Navbar', () => () => <div data-testid="mock-navbar" />)

describe('PublicGalleryPage', () => {
  const mockPublicResumes = [
    { resumeId: 1, title: 'Public Resume One', userFullName: 'Author One', targetJobTitle: 'Dev' },
    { resumeId: 2, title: 'Public Resume Two', userFullName: 'Author Two', targetJobTitle: 'Designer' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(resumeApi.getPublic as jest.Mock).mockResolvedValue(mockPublicResumes)
  })

  test('renders public resumes', async () => {
    renderWithProviders(<PublicGalleryPage />)
    
    expect(screen.getByText(/Public Resume Gallery/i)).toBeInTheDocument()
    expect(await screen.findByText('Public Resume One')).toBeInTheDocument()
    expect(screen.getByText('Public Resume Two')).toBeInTheDocument()
  })
})
