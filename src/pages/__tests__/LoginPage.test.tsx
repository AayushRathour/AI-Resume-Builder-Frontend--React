import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '../LoginPage'
import { renderWithProviders } from '../../test/renderWithProviders'
import { authApi } from '../../api/authApi'
import toast from 'react-hot-toast'

// Mocking useAuth
const mockLogin = jest.fn()
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}))

// Mocking authApi
jest.mock('../../api/authApi', () => ({
  authApi: {
    login: jest.fn(),
  },
}))

// Mocking react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  }
}))

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders correctly', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })

  test('simulates successful login', async () => {
    const mockUserData = { userId: 1, fullName: 'John Doe', role: 'USER', requiresOtp: false }
    ;(authApi.login as jest.Mock).mockResolvedValue(mockUserData)

    renderWithProviders(<LoginPage />)

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'john@example.com')
    await userEvent.type(screen.getByPlaceholderText('********'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /Sign In/i }))

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalled()
      expect(mockLogin).toHaveBeenCalledWith(mockUserData)
    })
  })

  test('simulates failed login', async () => {
    ;(authApi.login as jest.Mock).mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } }
    })

    renderWithProviders(<LoginPage />)

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'wrong@example.com')
    await userEvent.type(screen.getByPlaceholderText('********'), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: /Sign In/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials')
    })
  })
})
