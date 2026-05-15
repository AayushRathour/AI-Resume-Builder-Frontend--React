import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ExperienceStep from '../ExperienceStep'
import useResumeStore from '@/store/useResumeStore'
import { aiApi } from '@/api/aiApi'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

// Mock dependencies
jest.mock('@/store/useResumeStore', () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock('@/api/aiApi', () => ({
  aiApi: {
    generateBullets: jest.fn(),
    improveSection: jest.fn()
  }
}))

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn()
}))

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}))

jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }: any) => <div>{children}</div>,
  Droppable: ({ children }: any) => children({
    draggableProps: {},
    innerRef: jest.fn(),
  }, {}),
  Draggable: ({ children, draggableId }: any) => children({
    draggableProps: { 'data-testid': `draggable-${draggableId}` },
    dragHandleProps: {},
    innerRef: jest.fn(),
  }, { isDragging: false }),
}))

describe('ExperienceStep', () => {
  const mockAddExperience = jest.fn()
  const mockUpdateExperience = jest.fn()
  const mockRemoveExperience = jest.fn()
  const mockExperience = [
    {
      id: '1',
      position: 'Software Engineer',
      company: 'Google',
      startDate: 'Jan 2020',
      endDate: 'Dec 2022',
      current: false,
      description: 'Built things.'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useResumeStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        data: { experience: mockExperience },
        addExperience: mockAddExperience,
        updateExperience: mockUpdateExperience,
        removeExperience: mockRemoveExperience
      }
      return selector(state)
    })
    ;(useAuth as jest.Mock).mockReturnValue({ user: { userId: 'user123' } })
  })

  test('renders experience list', () => {
    render(<ExperienceStep />)
    expect(screen.getByText('Work Experience')).toBeInTheDocument()
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Google')).toBeInTheDocument()
  })

  test('calls addExperience when clicking Add', () => {
    render(<ExperienceStep />)
    const addBtn = screen.getByRole('button', { name: /add/i })
    fireEvent.click(addBtn)
    expect(mockAddExperience).toHaveBeenCalled()
  })

  test('calls updateExperience on input change', () => {
    render(<ExperienceStep />)
    const positionInput = screen.getByPlaceholderText(/e.g. Senior Software Engineer/i)
    fireEvent.change(positionInput, { target: { value: 'Lead Engineer' } })
    expect(mockUpdateExperience).toHaveBeenCalledWith('1', 'position', 'Lead Engineer')
  })

  test('calls removeExperience when clicking delete', () => {
    render(<ExperienceStep />)
    const deleteBtn = screen.getAllByRole('button').find(b => b.innerHTML.includes('svg')) // The Trash2 icon
    // Actually, I'll use a better way to find the delete button
    const deleteBtns = screen.getAllByRole('button')
    // The Trash2 button is the one with the specific class or icon
    // Let's just find by index or something if needed, but I'll try to find by icon name if possible
    // In our code: <button onClick={(e) => { e.stopPropagation(); removeExperience(exp.id) }} ...> <Trash2 size={14} /> </button>
    // I'll just click the first button that isn't "Add"
    fireEvent.click(deleteBtns[1]) 
    expect(mockRemoveExperience).toHaveBeenCalledWith('1')
  })

  test('handles generate bullets with AI', async () => {
    ;(aiApi.generateBullets as jest.Mock).mockResolvedValue(['Did A', 'Did B'])
    render(<ExperienceStep />)
    
    const genBtn = screen.getByText(/Generate Bullets/i)
    fireEvent.click(genBtn)
    
    await waitFor(() => {
      expect(aiApi.generateBullets).toHaveBeenCalled()
      expect(mockUpdateExperience).toHaveBeenCalledWith('1', 'description', '• Did A\n• Did B')
      expect(toast.success).toHaveBeenCalledWith('Bullets generated!')
    })
  })

  test('handles improve description with AI', async () => {
    ;(aiApi.improveSection as jest.Mock).mockResolvedValue('Improved description.')
    render(<ExperienceStep />)
    
    const improveBtn = screen.getByText(/Improve/i)
    fireEvent.click(improveBtn)
    
    await waitFor(() => {
      expect(aiApi.improveSection).toHaveBeenCalled()
      expect(mockUpdateExperience).toHaveBeenCalledWith('1', 'description', 'Improved description.')
      expect(toast.success).toHaveBeenCalledWith('Description improved!')
    })
  })
})
