import { screen, fireEvent, render, waitFor } from '@testing-library/react'
import AiButton from '../AiButton'

describe('AiButton', () => {
  test('renders with default props', () => {
    const mockOnClick = jest.fn().mockResolvedValue(undefined)
    render(<AiButton label="Generate" onClick={mockOnClick} />)
    
    const button = screen.getByRole('button', { name: /Generate/i })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  test('calls onClick and shows loading state', async () => {
    let resolvePromise: any
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    const mockOnClick = jest.fn().mockReturnValue(promise)
    
    render(<AiButton label="Generate" onClick={mockOnClick} />)
    
    const button = screen.getByRole('button', { name: /Generate/i })
    fireEvent.click(button)
    
    expect(mockOnClick).toHaveBeenCalled()
    expect(screen.getByText('Generating...')).toBeInTheDocument()
    expect(button).toBeDisabled()
    
    // Resolve promise
    resolvePromise()
    
    await waitFor(() => {
      expect(screen.getByText('Generate')).toBeInTheDocument()
      expect(button).not.toBeDisabled()
    })
  })

  test('shows error message on failure and allows retry', async () => {
    const mockOnClick = jest.fn()
      .mockRejectedValueOnce(new Error('Test error'))
      .mockResolvedValueOnce(undefined)
      
    render(<AiButton label="Generate" onClick={mockOnClick} />)
    
    const button = screen.getByRole('button', { name: /Generate/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })
    
    // Retry
    const retryButton = screen.getByTitle('Retry')
    fireEvent.click(retryButton)
    
    expect(mockOnClick).toHaveBeenCalledTimes(2)
    
    await waitFor(() => {
      expect(screen.queryByText('Test error')).not.toBeInTheDocument()
    })
  })

  test('dismisses error message', async () => {
    const mockOnClick = jest.fn().mockRejectedValue(new Error('Test error'))
      
    render(<AiButton label="Generate" onClick={mockOnClick} />)
    
    const button = screen.getByRole('button', { name: /Generate/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })
    
    const dismissButton = screen.getByTitle('Dismiss')
    fireEvent.click(dismissButton)
    
    expect(screen.queryByText('Test error')).not.toBeInTheDocument()
  })
})
