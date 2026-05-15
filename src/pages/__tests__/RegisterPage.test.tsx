import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterPage from '../RegisterPage'
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
    register: jest.fn(),
  },
}))

// Mocking react-hot-toast via spyOn
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  }
}))

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders correctly', () => {
    renderWithProviders(<RegisterPage />)
    expect(screen.getByText('Create your account')).toBeInTheDocument()
  })

  test('simulates successful registration', async () => {
    const mockUserData = { userId: 1, fullName: 'John Doe', role: 'USER', requiresOtp: false }
    ;(authApi.register as jest.Mock).mockResolvedValue(mockUserData)

    renderWithProviders(<RegisterPage />)

    await userEvent.type(screen.getByPlaceholderText('John Doe'), 'John Doe')
    await userEvent.type(screen.getByPlaceholderText('john@example.com'), 'john@example.com')
    await userEvent.type(screen.getByPlaceholderText('Min 6 characters'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /Create Account/i }))

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalled()
      expect(mockLogin).toHaveBeenCalledWith(mockUserData)
    })
  })

  test('simulates registration failure', async () => {
    ;(authApi.register as jest.Mock).mockRejectedValue({
      response: { data: { error: 'Email already exists' } }
    })

    renderWithProviders(<RegisterPage />)

    // Fill all required fields
    await userEvent.type(screen.getByPlaceholderText('John Doe'), 'John Doe')
    await userEvent.type(screen.getByPlaceholderText('john@example.com'), 'exists@example.com')
    await userEvent.type(screen.getByPlaceholderText('Min 6 characters'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /Create Account/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email already exists')
    })
  })
})
