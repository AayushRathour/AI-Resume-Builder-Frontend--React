import { screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VerifyOtpPage from '../VerifyOtpPage'
import { authApi } from '@/api/authApi'
import { sendOtpEmail } from '@/api/emailService'
import { useAuth } from '@/context/AuthContext'
import { renderWithProviders } from '@/test/renderWithProviders'
import { useLocation, useNavigate } from 'react-router-dom'

// Mock dependencies
jest.mock('@/api/authApi', () => ({
  authApi: {
    verifyOtp: jest.fn(),
    resendOtp: jest.fn()
  }
}))

jest.mock('@/api/emailService', () => ({
  sendOtpEmail: jest.fn()
}))

jest.mock('@/context/AuthContext', () => {
  const original = jest.requireActual('@/context/AuthContext')
  return {
    ...original,
    useAuth: jest.fn()
  }
})

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
  useNavigate: jest.fn()
}))

describe('VerifyOtpPage', () => {
  const mockNavigate = jest.fn()
  const mockLogin = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    ;(useNavigate as jest.Mock).mockReturnValue(mockNavigate)
    ;(useAuth as jest.Mock).mockReturnValue({ login: mockLogin })
    ;(useLocation as jest.Mock).mockReturnValue({
      state: { email: 'test@example.com', name: 'Test User', purpose: 'REGISTER' }
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('redirects to login if no email in state', () => {
    ;(useLocation as jest.Mock).mockReturnValue({ state: null })
    renderWithProviders(<VerifyOtpPage />)
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
  })

  test('renders page elements', () => {
    renderWithProviders(<VerifyOtpPage />)
    expect(screen.getByText('Verify your email')).toBeInTheDocument()
    expect(screen.getByText(/@example.com/)).toBeInTheDocument()
    expect(screen.getAllByRole('textbox').length).toBe(6)
  })

  test('handles OTP input via sequential changes and auto-submits', async () => {
    ;(authApi.verifyOtp as jest.Mock).mockResolvedValue({
      success: true,
      authResponse: { token: 'tok', role: 'USER', userId: '123' }
    })
    
    renderWithProviders(<VerifyOtpPage />)
    
    const inputs = screen.getAllByRole('textbox')
    
    // Set first 5 digits
    for (let i = 0; i < 5; i++) {
      fireEvent.change(inputs[i], { target: { value: (i + 1).toString() } })
    }
    
    // Trigger the final digit which should call mutate
    fireEvent.change(inputs[5], { target: { value: '6' } })
    
    await waitFor(() => {
      expect(authApi.verifyOtp).toHaveBeenCalled()
    })

    // Success animation and redirect
    act(() => { jest.advanceTimersByTime(1500) })
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
  })

  test('handles resend cooldown and resend action', async () => {
    ;(authApi.resendOtp as jest.Mock).mockResolvedValue({
      success: true,
      rawOtp: '654321',
      resendCooldownSeconds: 30
    })
    ;(sendOtpEmail as jest.Mock).mockResolvedValue(true)
    
    renderWithProviders(<VerifyOtpPage />)
    
    const resendBtn = screen.getByText(/Resend in 30s/i)
    
    // Advance time by 30 seconds
    act(() => { jest.advanceTimersByTime(30000) })
    
    await waitFor(() => {
      expect(screen.getByText('Resend code')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Resend code'))
    
    await waitFor(() => {
      expect(authApi.resendOtp).toHaveBeenCalled()
      expect(sendOtpEmail).toHaveBeenCalled()
    })
  })
})
