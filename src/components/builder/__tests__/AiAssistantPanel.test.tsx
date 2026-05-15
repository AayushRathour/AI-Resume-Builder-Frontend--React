import { screen, fireEvent, render, waitFor } from '@testing-library/react'
import AiAssistantPanel from '../AiAssistantPanel'
import useResumeStore from '../../../store/useResumeStore'
import { useAuth } from '../../../context/AuthContext'
import { aiApi } from '../../../api/aiApi'

// Mock dependencies
jest.mock('../../../store/useResumeStore', () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock('../../../context/AuthContext', () => {
  const original = jest.requireActual('../../../context/AuthContext')
  return {
    ...original,
    useAuth: jest.fn()
  }
})

jest.mock('../../../api/aiApi', () => ({
  aiApi: {
    tailorForJob: jest.fn()
  }
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn()
}))

describe('AiAssistantPanel', () => {
  const mockToSectionsJson = jest.fn().mockReturnValue('{}')

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({ user: { userId: 'user-1' } })
    ;(useResumeStore as unknown as jest.Mock).mockReturnValue({
      toSectionsJson: mockToSectionsJson
    })
  })

  test('renders closed by default', () => {
    render(<AiAssistantPanel />)
    
    expect(screen.getByRole('button', { name: /Ask AI/i })).toBeInTheDocument()
    expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument()
  })

  test('opens and closes panel', () => {
    render(<AiAssistantPanel />)
    
    const toggleButton = screen.getByRole('button', { name: /Ask AI/i })
    fireEvent.click(toggleButton)
    
    expect(screen.getByText('AI Assistant')).toBeInTheDocument()
    
    const closeButton = screen.getAllByRole('button')[0] // The X button
    fireEvent.click(closeButton)
    
    expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument()
  })

  test('calls tailorForJob when Tailor Resume is clicked', async () => {
    ;(aiApi.tailorForJob as jest.Mock).mockResolvedValue('Tailored content recommendations')
    
    render(<AiAssistantPanel />)
    
    fireEvent.click(screen.getByRole('button', { name: /Ask AI/i }))
    
    const textarea = screen.getByPlaceholderText(/Paste Job Description here/i)
    fireEvent.change(textarea, { target: { value: 'Frontend Developer required' } })
    
    const tailorButton = screen.getByRole('button', { name: /Tailor Resume/i })
    fireEvent.click(tailorButton)
    
    await waitFor(() => {
      expect(aiApi.tailorForJob).toHaveBeenCalledWith('user-1', 'free', '{}', 'Frontend Developer required')
      expect(screen.getByText('Tailored content recommendations')).toBeInTheDocument()
    })
  })

  test('handles API error', async () => {
    ;(aiApi.tailorForJob as jest.Mock).mockRejectedValue(new Error('API Error'))
    
    render(<AiAssistantPanel />)
    
    fireEvent.click(screen.getByRole('button', { name: /Ask AI/i }))
    
    const textarea = screen.getByPlaceholderText(/Paste Job Description here/i)
    fireEvent.change(textarea, { target: { value: 'Job' } })
    
    fireEvent.click(screen.getByRole('button', { name: /Tailor Resume/i }))
    
    await waitFor(() => {
      const toast = require('react-hot-toast')
      expect(toast.error).toHaveBeenCalledWith('AI is temporarily unavailable.')
    })
  })
})
