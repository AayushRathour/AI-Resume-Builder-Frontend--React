import { render, screen } from '@testing-library/react'
import LoadingSpinner from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  test('renders default spinner and text', () => {
    const { container } = render(<LoadingSpinner text="Loading..." />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    const spinner = container.querySelector('.animate-spin') as HTMLElement
    expect(spinner).toBeTruthy()
    expect(spinner).toHaveStyle({ width: '24px', height: '24px' })
  })

  test('respects custom size', () => {
    const { container } = render(<LoadingSpinner size={40} />)
    const spinner = container.querySelector('.animate-spin') as HTMLElement
    expect(spinner).toHaveStyle({ width: '40px', height: '40px' })
  })
})
