import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '../pages/LoginPage'
import { renderWithProviders } from '../test/renderWithProviders'
import { authApi } from '../api/authApi'

const mockNavigate = jest.fn()
const mockLogin = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams()],
}))

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}))

jest.mock('../api/authApi', () => ({
  authApi: {
    login: jest.fn(),
  },
}))

jest.mock('../api/emailService', () => ({
  sendOtpEmail: jest.fn(async () => true),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}))

describe('E2E flow: login -> dashboard', () => {
  test('user login flow redirects to dashboard', async () => {
    ;(authApi.login as jest.Mock).mockResolvedValue({
      token: 'tkn',
      email: 'flow@example.com',
      fullName: 'Flow User',
      role: 'USER',
      subscriptionPlan: 'FREE',
      userId: 1,
    })

    renderWithProviders(<LoginPage />, '/login')
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'flow@example.com')
    await userEvent.type(screen.getByPlaceholderText('********'), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })
})
