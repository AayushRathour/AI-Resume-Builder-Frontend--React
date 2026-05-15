import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StepIndicator from '../StepIndicator'
import useResumeStore from '../../../store/useResumeStore'

describe('StepIndicator', () => {
  beforeEach(() => {
    useResumeStore.getState().reset()
  })

  test('renders steps and updates store on click', async () => {
    const user = userEvent.setup()

    render(<StepIndicator />)

    expect(screen.getByRole('button', { name: /Personal Info/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Skills/i }))

    expect(useResumeStore.getState().currentStep).toBe(2)
  })
})
