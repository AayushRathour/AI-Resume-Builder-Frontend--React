import { screen, fireEvent, waitFor } from '@testing-library/react'
import ProjectsStep from '../ProjectsStep'
import useResumeStore from '../../../store/useResumeStore'
import { useAuth } from '../../../context/AuthContext'
import { aiApi } from '../../../api/aiApi'
import { renderWithProviders } from '../../../test/renderWithProviders'

// Mock react-beautiful-dnd
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }: any) => <div>{children}</div>,
  Droppable: ({ children }: any) => children({ droppableProps: {}, innerRef: jest.fn(), placeholder: null }, {}),
  Draggable: ({ children }: any) => children({ draggableProps: {}, dragHandleProps: {}, innerRef: jest.fn() }, { isDragging: false }),
}))

// Mock dependencies
jest.mock('../../../store/useResumeStore', () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn()
}))

jest.mock('../../../api/aiApi', () => ({
  aiApi: {
    improveSection: jest.fn()
  }
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn()
}))

describe('ProjectsStep', () => {
  const mockAddProject = jest.fn()
  const mockUpdateProject = jest.fn()
  const mockRemoveProject = jest.fn()
  const mockReorderProject = jest.fn()
  
  const mockProjects = [
    {
      id: 'proj-1',
      name: 'Test Project',
      technologies: 'React, Jest',
      link: 'https://test.com',
      description: 'Test description'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({ user: { userId: 'user-1' } })
    ;(useResumeStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        data: { projects: mockProjects },
        addProject: mockAddProject,
        updateProject: mockUpdateProject,
        removeProject: mockRemoveProject,
        reorderProject: mockReorderProject
      }
      return selector(state)
    })
  })

  test('renders project items', () => {
    renderWithProviders(<ProjectsStep />)
    
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByDisplayValue('React, Jest')).toBeInTheDocument()
  })

  test('calls addProject when Add button is clicked', () => {
    renderWithProviders(<ProjectsStep />)
    
    const addButton = screen.getByRole('button', { name: /Add/i })
    fireEvent.click(addButton)
    
    expect(mockAddProject).toHaveBeenCalled()
  })

  test('updates project fields', () => {
    renderWithProviders(<ProjectsStep />)
    
    const nameInput = screen.getByDisplayValue('Test Project')
    fireEvent.change(nameInput, { target: { value: 'New Project' } })
    
    expect(mockUpdateProject).toHaveBeenCalledWith('proj-1', 'name', 'New Project')
  })

  test('calls improveSection when Improve button is clicked', async () => {
    ;(aiApi.improveSection as jest.Mock).mockResolvedValue('Improved description')
    
    renderWithProviders(<ProjectsStep />)
    
    const improveButton = screen.getByRole('button', { name: /Improve/i })
    fireEvent.click(improveButton)
    
    await waitFor(() => {
      expect(aiApi.improveSection).toHaveBeenCalledWith('user-1', 'free', 'project', 'Test description')
    })
  })

  test('shows empty state when no projects', () => {
    ;(useResumeStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({ data: { projects: [] }, addProject: mockAddProject })
    })
    
    renderWithProviders(<ProjectsStep />)
    expect(screen.getByText(/No projects added yet/i)).toBeInTheDocument()
  })
})
