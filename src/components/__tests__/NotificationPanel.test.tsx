import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NotificationPanel from '../NotificationPanel'
import { renderWithProviders } from '../../test/renderWithProviders'

// Mocking useNotifications
const mockMarkRead = jest.fn()
const mockDelete = jest.fn()
jest.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [
      { notificationId: '1', title: 'New Message', message: 'Hello', isRead: false, sentAt: new Date().toISOString(), type: 'GENERAL' },
    ],
    unreadCount: 1,
    markAsRead: mockMarkRead,
    deleteNotification: mockDelete,
    refreshNotifications: jest.fn(),
    markAllAsRead: jest.fn(),
  }),
}))

describe('NotificationPanel', () => {
  test('renders notifications', async () => {
    renderWithProviders(<NotificationPanel onClose={jest.fn()} />)
    expect(screen.getByText('New Message')).toBeInTheDocument()
  })
})
