import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EducationStep from '../EducationStep'
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

describe('EducationStep', () => {
  const mockAddEducation = jest.fn()
  const mockUpdateEducation = jest.fn()
  const mockRemoveEducation = jest.fn()
  const mockEducation = [
    {
      id: '1',
      institution: 'IIT Delhi',
      degree: 'B.Tech',
      field: 'Computer Science',
      startDate: 'Aug 2020',
      endDate: 'May 2024',
      description: 'Studied CS.'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useResumeStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        data: { education: mockEducation },
        addEducation: mockAddEducation,
        updateEducation: mockUpdateEducation,
        removeEducation: mockRemoveEducation
      }
      return selector(state)
    })
    ;(useAuth as jest.Mock).mockReturnValue({ user: { userId: 'user123' } })
  })

  test('renders education list', () => {
    render(<EducationStep />)
    expect(screen.getByText('Education')).toBeInTheDocument()
    expect(screen.getByText(/IIT Delhi/i)).toBeInTheDocument()
    expect(screen.getByText(/B.Tech/i)).toBeInTheDocument()
  })

  test('calls addEducation when clicking Add', () => {
    render(<EducationStep />)
    const addBtn = screen.getByRole('button', { name: /add/i })
    fireEvent.click(addBtn)
    expect(mockAddEducation).toHaveBeenCalled()
  })

  test('calls updateEducation on input change', () => {
    render(<EducationStep />)
    const institutionInput = screen.getByPlaceholderText(/e.g. IIT Delhi/i)
    fireEvent.change(institutionInput, { target: { value: 'MIT' } })
    expect(mockUpdateEducation).toHaveBeenCalledWith('1', 'institution', 'MIT')
  })

  test('handles improve description with AI', async () => {
    ;(aiApi.improveSection as jest.Mock).mockResolvedValue('Improved edu description.')
    render(<EducationStep />)
    
    const improveBtn = screen.getByText(/Improve/i)
    fireEvent.click(improveBtn)
    
    await waitFor(() => {
      expect(aiApi.improveSection).toHaveBeenCalled()
      expect(mockUpdateEducation).toHaveBeenCalledWith('1', 'description', 'Improved edu description.')
      expect(toast.success).toHaveBeenCalledWith('Description improved!')
    })
  })
})
