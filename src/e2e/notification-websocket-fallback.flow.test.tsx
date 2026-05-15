import { screen } from '@testing-library/react'
import NotificationCenterPage from '../pages/NotificationCenterPage'
import { renderWithProviders } from '../test/renderWithProviders'

const mockUseNotifications = jest.fn()

jest.mock('../context/NotificationContext', () => ({
  useNotifications: () => mockUseNotifications(),
}))

jest.mock('../components/Navbar', () => ({
  __esModule: true,
  default: () => <div>Navbar</div>,
}))

describe('E2E flow: notification websocket fallback visibility', () => {
  test('shows connecting when websocket not connected', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      connected: false,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      refreshNotifications: jest.fn(),
    })

    renderWithProviders(<NotificationCenterPage />, '/notifications')
    expect(screen.getByText(/connecting/i)).toBeInTheDocument()
  })

  test('shows live when websocket is connected', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      connected: true,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      refreshNotifications: jest.fn(),
    })

    renderWithProviders(<NotificationCenterPage />, '/notifications')
    expect(screen.getByText(/live/i)).toBeInTheDocument()
  })
})
