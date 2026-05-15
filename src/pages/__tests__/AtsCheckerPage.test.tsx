import { screen, fireEvent, waitFor } from '@testing-library/react'
import AtsCheckerPage from '../AtsCheckerPage'
import { useAuth } from '@/context/AuthContext'
import api from '@/api/axios'
import { renderWithProviders } from '@/test/renderWithProviders'

// Mock dependencies
jest.mock('@/context/AuthContext', () => {
  const original = jest.requireActual('@/context/AuthContext')
  return {
    ...original,
    useAuth: jest.fn()
  }
})

jest.mock('@/components/layout/MainLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="main-layout">{children}</div>
}))

jest.mock('@/api/axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn()
  }
}))

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn()

describe('AtsCheckerPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({ user: { userId: 'user-1' } })
  })

  test('renders upload section and initial state', () => {
    renderWithProviders(<AtsCheckerPage />)
    
    expect(screen.getByText('ATS Resume Checker')).toBeInTheDocument()
    expect(screen.getByText('Click or drag file to upload')).toBeInTheDocument()
    expect(screen.getByText('Upload a resume to see your ATS score')).toBeInTheDocument()
  })

  test('handles file selection', () => {
    renderWithProviders(<AtsCheckerPage />)
    
    const file = new File(['hello'], 'resume.pdf', { type: 'application/pdf' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    expect(screen.getByText('resume.pdf')).toBeInTheDocument()
  })

  test('uploads and displays analysis result', async () => {
    ;(api.post as jest.Mock).mockResolvedValue({
      data: {
        data: {
          score: 85,
          recommendations: 'Great resume, but add more metrics.',
          missingKeywords: ['React', 'Next.js']
        }
      }
    })
    
    renderWithProviders(<AtsCheckerPage />)
    
    // Select file
    const file = new File(['hello'], 'resume.pdf', { type: 'application/pdf' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    // Click analyze
    const analyzeBtn = screen.getByRole('button', { name: /Analyze Resume/i })
    fireEvent.click(analyzeBtn)
    
    expect(screen.getByText('Analyzing...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/ai/ats-upload', expect.any(FormData), expect.any(Object))
      expect(screen.getByText('85')).toBeInTheDocument()
      expect(screen.getByText('Missing Keywords')).toBeInTheDocument()
      expect(screen.getByText('React')).toBeInTheDocument()
      expect(screen.getByText('Next.js')).toBeInTheDocument()
      expect(screen.getByText('Great resume, but add more metrics.')).toBeInTheDocument()
    })
  })

  test('handles fallback scoring from string response', async () => {
    ;(api.post as jest.Mock).mockResolvedValue({
      data: {
        data: {
          result: 'Your score is 75/100. You are doing well.'
        }
      }
    })
    
    renderWithProviders(<AtsCheckerPage />)
    
    const file = new File(['hello'], 'resume.pdf', { type: 'application/pdf' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    fireEvent.click(screen.getByRole('button', { name: /Analyze Resume/i }))
    
    await waitFor(() => {
      expect(screen.getByText('75')).toBeInTheDocument()
      expect(screen.getByText(/Your score is 75\/100/)).toBeInTheDocument()
    })
  })

  test('handles upload failure', async () => {
    ;(api.post as jest.Mock).mockRejectedValue(new Error('Upload failed'))
    
    renderWithProviders(<AtsCheckerPage />)
    
    const file = new File(['hello'], 'resume.pdf', { type: 'application/pdf' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    fireEvent.click(screen.getByRole('button', { name: /Analyze Resume/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Analyze Resume')).toBeInTheDocument()
    })
  })
})
