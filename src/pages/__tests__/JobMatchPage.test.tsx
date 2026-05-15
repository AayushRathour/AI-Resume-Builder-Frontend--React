import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JobMatchPage from '../JobMatchPage'
import { renderWithProviders } from '../../test/renderWithProviders'
import { jobMatchApi } from '../../api/jobMatchApi'
import { resumeApi } from '../../api/resumeApi'

// Mocking useAuth
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { userId: 1, name: 'Test User' },
    isPremium: true,
  }),
}))

// Mocking APIs
jest.mock('../../api/jobMatchApi', () => ({
  jobMatchApi: {
    getTopMatches: jest.fn(async () => []),
    analyzeWithFile: jest.fn(),
    search: jest.fn(async () => []),
    getSavedJobs: jest.fn(async () => []),
    bookmark: jest.fn(async () => ({})),
  },
}))

jest.mock('../../api/resumeApi', () => ({
  resumeApi: {
    getByUser: jest.fn(async () => [
      { resumeId: 10, title: 'My Resume' }
    ]),
  },
}))

// Mocking Navbar
jest.mock('../../components/Navbar', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar">Navbar</div>,
}))

describe('JobMatchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders correctly and allows tab switching', async () => {
    renderWithProviders(<JobMatchPage />)

    expect(screen.getByText('Job Matching')).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()

    // Default tab is 'Analyze Resume'
    expect(screen.getByText('Find Matching Jobs')).toBeInTheDocument()

    // Switch to Live Job Search
    const liveSearchTab = screen.getByText('Live Job Search')
    await userEvent.click(liveSearchTab)
    expect(screen.getByPlaceholderText('Job title (e.g. Full Stack Developer)')).toBeInTheDocument()

    // Switch to Saved Jobs
    const savedJobsTab = screen.getByText('Saved Jobs')
    await userEvent.click(savedJobsTab)
    expect(screen.getByText('Saved Adzuna Jobs')).toBeInTheDocument()

    // Switch to My Matches
    const matchesTab = screen.getByText(/My Matches/i)
    await userEvent.click(matchesTab)
    expect(screen.getByText(/No matches yet/i)).toBeInTheDocument()
  })

  test('simulates resume analysis flow', async () => {
    const mockAnalysisResult = {
      extractedData: {
        roles: ['Frontend Developer'],
        skills: ['React', 'TypeScript'],
        keywords: ['Redux', 'Jest'],
        experienceLevel: 'Mid',
        summary: 'A skilled frontend developer.'
      },
      jobs: [{ title: 'Frontend Role', company: 'Tech Inc', url: 'http://test.com', location: 'Remote' }]
    }
      ; (jobMatchApi.analyzeWithFile as jest.Mock).mockResolvedValue(mockAnalysisResult)
      ; (jobMatchApi.search as jest.Mock).mockResolvedValue(mockAnalysisResult.jobs)

    renderWithProviders(<JobMatchPage />)

    // Select resume
    const select = await screen.findByRole('combobox')
    await waitFor(() => expect(screen.getByText('My Resume')).toBeInTheDocument())
    await userEvent.selectOptions(select, '10')
    expect(select).toHaveValue('10')

    // Click Analyze
    const analyzeBtn = screen.getByText('Find Jobs')
    fireEvent.click(analyzeBtn)

    await waitFor(() => {
      expect(jobMatchApi.analyzeWithFile).toHaveBeenCalled()
      expect(screen.getByText('Frontend Role')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  test('simulates live job search', async () => {
    const mockJobs = [
      { title: 'React Developer', company: 'ABC Corp', url: 'http://abc.com', location: 'Delhi' }
    ]
      ; (jobMatchApi.search as jest.Mock).mockResolvedValue(mockJobs)

    renderWithProviders(<JobMatchPage />)

    // Switch to Live Job Search
    await userEvent.click(screen.getByText('Live Job Search'))

    const searchInput = screen.getByPlaceholderText('Job title (e.g. Full Stack Developer)')
    await userEvent.type(searchInput, 'React Developer')

    // Using getByRole with a more specific name or getByText
    const searchBtn = screen.getByText('Search').closest('button')
    if (searchBtn) await userEvent.click(searchBtn)

    await waitFor(() => {
      expect(jobMatchApi.search).toHaveBeenCalledWith('React Developer')
      expect(screen.getByText('React Developer')).toBeInTheDocument()
      expect(screen.getByText('ABC Corp')).toBeInTheDocument()
    })
  })

  test('handles file upload in analysis', async () => {
    const { container } = renderWithProviders(<JobMatchPage />)

    const file = new File(['hello'], 'resume.pdf', { type: 'application/pdf' })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.getByText('resume.pdf')).toBeInTheDocument()
  })
})
