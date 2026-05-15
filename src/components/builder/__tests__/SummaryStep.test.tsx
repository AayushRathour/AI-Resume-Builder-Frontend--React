import { screen, fireEvent, waitFor } from '@testing-library/react'
import SummaryStep from '../SummaryStep'
import useResumeStore from '../../../store/useResumeStore'
import { useAuth } from '../../../context/AuthContext'
import { aiApi } from '../../../api/aiApi'
import { renderWithProviders } from '../../../test/renderWithProviders'

jest.mock('../../../store/useResumeStore', () => {
  const mockStore = jest.fn() as any
  mockStore.getState = jest.fn()
  return {
    __esModule: true,
    default: mockStore
  }
})

jest.mock('../../../context/AuthContext', () => {
  const original = jest.requireActual('../../../context/AuthContext')
  return {
    ...original,
    useAuth: jest.fn()
  }
})

jest.mock('../../../api/aiApi', () => ({
  aiApi: {
    generateSummary: jest.fn(),
    improveSection: jest.fn()
  }
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn()
}))

describe('SummaryStep', () => {
  const mockSetSummary = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({ user: { userId: 'user-1' } })
    
    const state = {
      data: { 
        summary: 'Test summary',
        personal: { title: 'Software Engineer' },
        skills: ['React', 'Node'],
        experience: [{}]
      },
      setSummary: mockSetSummary
    }
    
    ;(useResumeStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector(state)
    })
    
    ;(useResumeStore.getState as jest.Mock).mockReturnValue(state)
  })

  test('renders summary field', () => {
    renderWithProviders(<SummaryStep />)
    
    expect(screen.getByText('Professional Summary')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test summary')).toBeInTheDocument()
  })

  test('updates summary text', () => {
    renderWithProviders(<SummaryStep />)
    
    const textarea = screen.getByDisplayValue('Test summary')
    fireEvent.change(textarea, { target: { value: 'New summary' } })
    
    expect(mockSetSummary).toHaveBeenCalledWith('New summary')
  })

  test('calls generateSummary when Generate with AI is clicked', async () => {
    ;(aiApi.generateSummary as jest.Mock).mockResolvedValue('Generated AI summary')
    
    renderWithProviders(<SummaryStep />)
    
    const generateButton = screen.getByRole('button', { name: /Generate with AI/i })
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      expect(aiApi.generateSummary).toHaveBeenCalledWith('user-1', 'free', 'Software Engineer', 1, 'React, Node', 'Test summary')
      expect(mockSetSummary).toHaveBeenCalledWith('Generated AI summary')
    })
  })

  test('calls improveSection when Improve button is clicked', async () => {
    ;(aiApi.improveSection as jest.Mock).mockResolvedValue('Improved AI summary')
    
    renderWithProviders(<SummaryStep />)
    
    const improveButton = screen.getByRole('button', { name: /Improve/i })
    fireEvent.click(improveButton)
    
    await waitFor(() => {
      expect(aiApi.improveSection).toHaveBeenCalledWith('user-1', 'free', 'summary', 'Test summary')
      expect(mockSetSummary).toHaveBeenCalledWith('Improved AI summary')
    })
  })
})
