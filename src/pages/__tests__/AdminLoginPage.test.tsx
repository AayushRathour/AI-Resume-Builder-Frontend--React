import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminLoginPage from '../AdminLoginPage'
import { authApi } from '@/api/authApi'
import { sendOtpEmail } from '@/api/emailService'
import { useAuth } from '@/context/AuthContext'
import { renderWithProviders } from '@/test/renderWithProviders'
import { useNavigate } from 'react-router-dom'

// Mock dependencies
jest.mock('@/api/authApi', () => ({
  authApi: {
    login: jest.fn()
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
  useNavigate: jest.fn()
}))

describe('AdminLoginPage', () => {
  const mockNavigate = jest.fn()
  const mockLogin = jest.fn()
  const mockLogout = jest.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useNavigate as jest.Mock).mockReturnValue(mockNavigate)
    ;(useAuth as jest.Mock).mockReturnValue({ login: mockLogin, logout: mockLogout })
  })

  test('renders login form', () => {
    renderWithProviders(<AdminLoginPage />)
    expect(screen.getByText('Admin Sign In')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Password')).toBeInTheDocument()
  })

  test('toggles password visibility', async () => {
    renderWithProviders(<AdminLoginPage />)
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement
    const toggleBtn = screen.getAllByRole('button')[0]
    
    expect(passwordInput).toHaveAttribute('type', 'password')
    await user.click(toggleBtn)
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  test('handles successful admin login', async () => {
    ;(authApi.login as jest.Mock).mockResolvedValue({
      role: 'ADMIN',
      token: 'admin-tok',
      userId: 'admin-1'
    })
    
    renderWithProviders(<AdminLoginPage />)
    
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement
    
    await user.type(emailInput, 'admin@test.com')
    await user.type(passwordInput, 'password123')
    
    await user.click(screen.getByRole('button', { name: /Sign In as Admin/i }))
    
    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalled()
      expect(mockLogin).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/admin')
    })
  })

  test('handles non-admin login rejection', async () => {
    ;(authApi.login as jest.Mock).mockResolvedValue({
      role: 'USER',
      token: 'user-tok',
      userId: 'user-1'
    })
    
    renderWithProviders(<AdminLoginPage />)
    
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement
    
    await user.type(emailInput, 'user@test.com')
    await user.type(passwordInput, 'password123')
    
    await user.click(screen.getByRole('button', { name: /Sign In as Admin/i }))
    
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
    })
  })

  test('handles login with OTP requirement', async () => {
    ;(authApi.login as jest.Mock).mockResolvedValue({
      requiresOtp: true,
      otpEmail: 'admin@test.com',
      userName: 'Admin User',
      rawOtp: '123456'
    })
    ;(sendOtpEmail as jest.Mock).mockResolvedValue(true)
    
    renderWithProviders(<AdminLoginPage />)
    
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement
    
    await user.type(emailInput, 'admin@test.com')
    await user.type(passwordInput, 'password123')
    
    await user.click(screen.getByRole('button', { name: /Sign In as Admin/i }))
    
    await waitFor(() => {
      expect(sendOtpEmail).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/verify-otp', expect.any(Object))
    })
  })
})
