import { render, screen } from '@testing-library/react'
import AtsScoreBar from '../AtsScoreBar'

describe('AtsScoreBar', () => {
  test('renders label and width for high score', () => {
    const { container } = render(<AtsScoreBar score={80} />)

    expect(screen.getByText(/80\/100/i)).toBeInTheDocument()
    expect(screen.getByText(/Excellent/i)).toBeInTheDocument()

    const bar = container.querySelector('div[style*="width: 80%"]') as HTMLElement
    expect(bar).toBeTruthy()
  })

  test('renders label for low score', () => {
    render(<AtsScoreBar score={40} />)
    expect(screen.getByText(/Needs Work/i)).toBeInTheDocument()
  })
})
