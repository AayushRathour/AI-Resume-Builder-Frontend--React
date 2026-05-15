import { screen, fireEvent, render } from '@testing-library/react'
import PersonalInfoStep from '../PersonalInfoStep'
import useResumeStore from '../../../store/useResumeStore'
import { validateField } from '../../../utils/validation'

// Mock the store hook
jest.mock('../../../store/useResumeStore', () => ({
  __esModule: true,
  default: jest.fn()
}))

// Mock validation
jest.mock('../../../utils/validation', () => ({
  validateField: jest.fn()
}))

describe('PersonalInfoStep', () => {
  const mockSetPersonalField = jest.fn()
  const mockPersonalData = {
    name: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: ''
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useResumeStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        data: { personal: mockPersonalData },
        setPersonalField: mockSetPersonalField
      }
      return selector(state)
    })
    ;(validateField as jest.Mock).mockReturnValue('')
  })

  test('renders all input fields', () => {
    render(<PersonalInfoStep />)
    
    expect(screen.getByPlaceholderText(/e.g. Aayush Rathour/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g. Software Engineer/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g. john@example.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g. \+91-9876543210/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g. Mumbai, India/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g. https:\/\/linkedin.com\/in\/yourname/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g. https:\/\/github.com\/yourname/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g. https:\/\/yoursite.com/i)).toBeInTheDocument()
  })

  test('calls setPersonalField on input change', () => {
    render(<PersonalInfoStep />)
    
    const nameInput = screen.getByPlaceholderText(/e.g. Aayush Rathour/i)
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    
    expect(mockSetPersonalField).toHaveBeenCalledWith('name', 'John Doe')
  })

  test('validates on blur', () => {
    ;(validateField as jest.Mock).mockReturnValue('Name is required')
    
    render(<PersonalInfoStep />)
    
    const nameInput = screen.getByPlaceholderText(/e.g. Aayush Rathour/i)
    fireEvent.blur(nameInput)
    
    expect(validateField).toHaveBeenCalledWith('name', '')
    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })

  test('re-validates on change if already touched', () => {
    ;(validateField as jest.Mock).mockReturnValue('Invalid name')
    
    render(<PersonalInfoStep />)
    
    const nameInput = screen.getByPlaceholderText(/e.g. Aayush Rathour/i)
    
    // First blur to mark as touched
    fireEvent.blur(nameInput)
    expect(screen.getByText('Invalid name')).toBeInTheDocument()
    
    // Then change should trigger re-validation
    jest.clearAllMocks()
    ;(validateField as jest.Mock).mockReturnValue('') // Clear error
    fireEvent.change(nameInput, { target: { value: 'J' } })
    
    expect(validateField).toHaveBeenCalledWith('name', 'J')
    // Wait for state update - the error should disappear
    expect(screen.queryByText('Invalid name')).not.toBeInTheDocument()
  })
})
