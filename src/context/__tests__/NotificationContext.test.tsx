import { renderHook, act, waitFor } from '@testing-library/react'
import { NotificationProvider, useNotifications } from '../NotificationContext'
import { notificationApi } from '../../api/notificationApi'

// Mocking useAuth
jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: { userId: 1 },
    token: 'test-token',
  }),
}))

// Mocking notificationApi
jest.mock('../../api/notificationApi', () => ({
  notificationApi: {
    getByRecipient: jest.fn(async () => []),
    getUnreadCount: jest.fn(async () => 0),
    markRead: jest.fn(async () => { }),
    markAllRead: jest.fn(async () => { }),
    delete: jest.fn(async () => { }),
  },
}))

// Mocking stompjs Client
const mockClient = {
  activate: jest.fn(),
  deactivate: jest.fn(async () => { }),
  subscribe: jest.fn(),
}
jest.mock('@stomp/stompjs', () => ({
  Client: jest.fn(() => mockClient),
}))

// Mocking sockjs-client
jest.mock('sockjs-client', () => jest.fn())

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NotificationProvider>{children}</NotificationProvider>
)

describe('NotificationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('initializes and connects to websocket', async () => {
    renderHook(() => useNotifications(), { wrapper })

    await waitFor(() => {
      expect(mockClient.activate).toHaveBeenCalled()
      expect(notificationApi.getByRecipient).toHaveBeenCalledWith(1)
    })
  })

  test('marks notification as read', async () => {
    ; (notificationApi.getByRecipient as jest.Mock).mockResolvedValue([
      { notificationId: 'n1', isRead: false, title: 'Test' }
    ])
      ; (notificationApi.getUnreadCount as jest.Mock).mockResolvedValue(1)

    const { result } = renderHook(() => useNotifications(), { wrapper })

    await waitFor(() => {
      expect(result.current.notifications.length).toBe(1)
    })

    await act(async () => {
      await result.current.markAsRead('n1')
    })

    expect(notificationApi.markRead).toHaveBeenCalledWith('n1')
    expect(result.current.notifications[0].isRead).toBe(true)
    expect(result.current.unreadCount).toBe(0)
  })
})
