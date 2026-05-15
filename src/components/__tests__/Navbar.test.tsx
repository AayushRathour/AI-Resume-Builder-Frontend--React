import { screen } from '@testing-library/react'
import Navbar from '../Navbar'
import { renderWithProviders } from '../../test/renderWithProviders'

// Mocking useAuth
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { fullName: 'John Doe', role: 'USER' },
    isAuthenticated: true,
    logout: jest.fn(),
  }),
}))

// Mocking useNotifications
jest.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({
    unreadCount: 5,
    connected: true,
  }),
}))

describe('Navbar', () => {
  test('renders user name and unread count', () => {
    renderWithProviders(<Navbar />)
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  test('renders navigation links', () => {
    renderWithProviders(<Navbar />)
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/Job Match/i)).toBeInTheDocument()
    expect(screen.getByText(/ATS Check/i)).toBeInTheDocument()
  })
})
