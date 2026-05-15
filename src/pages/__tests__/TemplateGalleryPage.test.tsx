import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TemplateGalleryPage from '../TemplateGalleryPage'
import { renderWithProviders } from '../../test/renderWithProviders'
import { templateApi } from '../../api/templateApi'
import { AuthProvider } from '../../context/AuthContext'
import { NotificationProvider } from '../../context/NotificationContext'
import toast from 'react-hot-toast'

// Mocking useAuth
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
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

// Mocking templateApi
jest.mock('../../api/templateApi', () => ({
  templateApi: {
    getAll: jest.fn(async () => [
      { templateId: 1, name: 'Default Template', isActive: true, isPremium: false, category: 'PROFESSIONAL' },
      { templateId: 2, name: 'Premium Template', isActive: true, isPremium: true, category: 'CREATIVE' },
    ]),
  },
}))

// Mocking react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn(), loading: jest.fn() },
  error: jest.fn(),
  success: jest.fn(),
  loading: jest.fn(),
}))

describe('TemplateGalleryPage', () => {
  test('renders templates and filters by category', async () => {
    renderWithProviders(
      <AuthProvider>
        <NotificationProvider>
          <TemplateGalleryPage />
        </NotificationProvider>
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Default Template')).toBeInTheDocument()
    })

    const categorySelect = screen.getAllByDisplayValue('ALL')[0]
    await userEvent.selectOptions(categorySelect, 'PROFESSIONAL')

    await waitFor(() => {
      expect(screen.getByText('Default Template')).toBeInTheDocument()
      expect(screen.queryByText('Premium Template')).not.toBeInTheDocument()
    })
  })
})
