import { screen, fireEvent, waitFor } from '@testing-library/react'
import SkillsStep from '../SkillsStep'
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
    suggestSkills: jest.fn()
  }
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn()
}))

describe('SkillsStep', () => {
  const mockAddSkill = jest.fn()
  const mockRemoveSkill = jest.fn()
  const mockUpdateSkill = jest.fn()
  
  const mockSkills = ['React', 'TypeScript']

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({ user: { userId: 'user-1' } })
    
    const state = {
      data: { 
        skills: mockSkills,
        personal: { title: 'Frontend Developer' }
      },
      targetJobTitle: 'Frontend Developer',
      addSkill: mockAddSkill,
      removeSkill: mockRemoveSkill,
      updateSkill: mockUpdateSkill
    }
    
    ;(useResumeStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector(state)
    })
    
    ;(useResumeStore.getState as jest.Mock).mockReturnValue(state)
  })

  test('renders skills list', () => {
    renderWithProviders(<SkillsStep />)
    
    expect(screen.getByText('Skills')).toBeInTheDocument()
    expect(screen.getByDisplayValue('React')).toBeInTheDocument()
    expect(screen.getByDisplayValue('TypeScript')).toBeInTheDocument()
  })

  test('adds single skill via Add button', () => {
    renderWithProviders(<SkillsStep />)
    
    const input = screen.getByPlaceholderText(/e.g. React, Node.js/i)
    fireEvent.change(input, { target: { value: 'Jest' } })
    
    const addButton = screen.getByRole('button', { name: /Add/i })
    fireEvent.click(addButton)
    
    expect(mockAddSkill).toHaveBeenCalledWith('Jest')
  })

  test('adds multiple skills comma separated', () => {
    renderWithProviders(<SkillsStep />)
    
    const input = screen.getByPlaceholderText(/e.g. React, Node.js/i)
    fireEvent.change(input, { target: { value: 'Jest, HTML, CSS' } })
    
    const addButton = screen.getByRole('button', { name: /Add/i })
    fireEvent.click(addButton)
    
    expect(mockAddSkill).toHaveBeenCalledWith('Jest')
    expect(mockAddSkill).toHaveBeenCalledWith('HTML')
    expect(mockAddSkill).toHaveBeenCalledWith('CSS')
  })

  test('calls suggestSkills when AI Suggest button is clicked', async () => {
    ;(aiApi.suggestSkills as jest.Mock).mockResolvedValue(['Redux', 'GraphQL'])
    
    renderWithProviders(<SkillsStep />)
    
    const suggestButton = screen.getByRole('button', { name: /Suggest Skills/i })
    fireEvent.click(suggestButton)
    
    await waitFor(() => {
      expect(aiApi.suggestSkills).toHaveBeenCalledWith('user-1', 'Frontend Developer', 'React, TypeScript')
      // Suggested skills should appear
      expect(screen.getByText('Redux')).toBeInTheDocument()
      expect(screen.getByText('GraphQL')).toBeInTheDocument()
    })
  })

  test('adds suggested skill when clicked', async () => {
    ;(aiApi.suggestSkills as jest.Mock).mockResolvedValue(['Redux'])
    
    renderWithProviders(<SkillsStep />)
    
    const suggestButton = screen.getByRole('button', { name: /Suggest Skills/i })
    fireEvent.click(suggestButton)
    
    await waitFor(() => {
      const reduxButton = screen.getByText('Redux')
      fireEvent.click(reduxButton)
      expect(mockAddSkill).toHaveBeenCalledWith('Redux')
    })
  })

  test('removes skill when X is clicked', () => {
    renderWithProviders(<SkillsStep />)
    
    // Get all remove buttons (they have X icon but we can select by click handler or parent)
    // Here we'll use a more direct approach by clicking the button directly
    const removeButtons = screen.getAllByRole('button').filter(b => b.className.includes('text-slate-400 hover:text-red-500'))
    fireEvent.click(removeButtons[0]) // Remove first skill
    
    expect(mockRemoveSkill).toHaveBeenCalledWith(0)
  })

  test('shows empty state when no skills', () => {
    ;(useResumeStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({ data: { skills: [] } })
    })
    
    renderWithProviders(<SkillsStep />)
    expect(screen.getByText(/No skills added yet/i)).toBeInTheDocument()
  })
})
