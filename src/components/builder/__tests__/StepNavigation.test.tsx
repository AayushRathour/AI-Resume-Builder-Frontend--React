import { screen, fireEvent, render } from '@testing-library/react'
import StepNavigation from '../StepNavigation'
import useResumeStore, { STEPS } from '../../../store/useResumeStore'
import { isPersonalInfoValid } from '../../../utils/validation'

// Mock dependencies
jest.mock('../../../store/useResumeStore', () => {
  const original = jest.requireActual('../../../store/useResumeStore')
  return {
    __esModule: true,
    default: jest.fn(),
    STEPS: original.STEPS
  }
})

jest.mock('../../../utils/validation', () => ({
  isPersonalInfoValid: jest.fn()
}))

describe('StepNavigation', () => {
  const mockNextStep = jest.fn()
  const mockPrevStep = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useResumeStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        currentStep: 0,
        nextStep: mockNextStep,
        prevStep: mockPrevStep,
        data: { personal: {} }
      }
      return selector(state)
    })
    ;(isPersonalInfoValid as jest.Mock).mockReturnValue(true)
  })

  test('renders navigation buttons', () => {
    render(<StepNavigation />)
    
    expect(screen.getByRole('button', { name: /Previous/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument()
    expect(screen.getByText(`Step 1 of ${STEPS.length}`)).toBeInTheDocument()
  })

  test('disables Previous on first step', () => {
    render(<StepNavigation />)
    
    const prevButton = screen.getByRole('button', { name: /Previous/i })
    expect(prevButton).toBeDisabled()
  })

  test('enables Previous on later steps', () => {
    ;(useResumeStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({ currentStep: 1, prevStep: mockPrevStep, data: { personal: {} } })
    })
    
    render(<StepNavigation />)
    
    const prevButton = screen.getByRole('button', { name: /Previous/i })
    expect(prevButton).not.toBeDisabled()
    
    fireEvent.click(prevButton)
    expect(mockPrevStep).toHaveBeenCalled()
  })

  test('calls nextStep when Next is clicked and valid', () => {
    render(<StepNavigation />)
    
    const nextButton = screen.getByRole('button', { name: /Next/i })
    fireEvent.click(nextButton)
    
    expect(mockNextStep).toHaveBeenCalled()
  })

  test('disables Next if personal info is invalid on step 0', () => {
    ;(isPersonalInfoValid as jest.Mock).mockReturnValue(false)
    
    render(<StepNavigation />)
    
    const nextButton = screen.getByRole('button', { name: /Next/i })
    expect(nextButton).toBeDisabled()
  })

  test('shows "Last step" text on the last step', () => {
    ;(useResumeStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({ currentStep: STEPS.length - 1, prevStep: mockPrevStep, data: { personal: {} } })
    })
    
    render(<StepNavigation />)
    
    expect(screen.queryByRole('button', { name: /Next/i })).not.toBeInTheDocument()
    expect(screen.getByText('Last step')).toBeInTheDocument()
  })
})
