import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfilePage from '../ProfilePage'
import { renderWithProviders } from '../../test/renderWithProviders'
import { authApi } from '../../api/authApi'
import { AuthProvider } from '../../context/AuthContext'
import { NotificationProvider } from '../../context/NotificationContext'
import toast from 'react-hot-toast'

// Mocking useAuth
const mockUpdateUser = jest.fn()
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { userId: 1, fullName: 'John Doe', email: 'john@example.com', role: 'USER', subscriptionPlan: 'FREE' },
    updateUser: mockUpdateUser,
    isPremium: false,
  }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}))

// Mocking NotificationContext
jest.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    connected: true,
  }),
  NotificationProvider: ({ children }: any) => <>{children}</>,
}))

// Mocking authApi
jest.mock('../../api/authApi', () => ({
  authApi: {
    getProfile: jest.fn(async () => ({ userId: 1, fullName: 'John Doe', email: 'john@example.com' })),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
  },
}))

// Mocking react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
  error: jest.fn(),
  success: jest.fn(),
}))

describe('ProfilePage', () => {
  test('renders profile info', async () => {
    renderWithProviders(
      <AuthProvider>
        <NotificationProvider>
          <ProfilePage />
        </NotificationProvider>
      </AuthProvider>
    )
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  test('updates profile name', async () => {
    ; (authApi.updateProfile as jest.Mock).mockResolvedValue({ userId: 1, fullName: 'John Updated', phone: '123' })

    renderWithProviders(
      <AuthProvider>
        <NotificationProvider>
          <ProfilePage />
        </NotificationProvider>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    })

    const nameInput = screen.getByDisplayValue('John Doe')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'John Updated')

    await userEvent.click(screen.getByRole('button', { name: /Save Changes/i }))

    await waitFor(() => {
      expect(authApi.updateProfile).toHaveBeenCalled()
      expect(mockUpdateUser).toHaveBeenCalled()
    })
  })
})
