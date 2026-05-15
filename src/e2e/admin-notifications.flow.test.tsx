import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminNotifications from '../pages/admin/AdminNotifications'
import { renderWithProviders } from '../test/renderWithProviders'
import { notificationApi } from '../api/notificationApi'

jest.mock('../api/adminApi', () => ({
  adminApi: {
    getUsers: jest.fn(async () => [
      { userId: 1, subscriptionPlan: 'FREE' },
      { userId: 2, subscriptionPlan: 'PREMIUM' },
      { userId: 3, subscriptionPlan: 'FREE' },
    ]),
  },
}))

jest.mock('../api/notificationApi', () => ({
  notificationApi: {
    getAll: jest.fn(async () => []),
    delete: jest.fn(async () => {}),
    sendBulk: jest.fn(async () => []),
  },
}))

jest.mock('../components/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}))

describe('E2E flow: admin notifications', () => {
  test('broadcast to FREE users sends only free user ids', async () => {
    renderWithProviders(<AdminNotifications />, '/admin/notifications')

    await userEvent.type(screen.getByPlaceholderText(/notification title/i), 'Notice')
    await userEvent.type(screen.getByPlaceholderText(/broadcast message/i), 'Message body')
    const selects = screen.getAllByRole('combobox')
    await userEvent.selectOptions(selects[1], 'FREE')
    await userEvent.click(screen.getByRole('button', { name: /send broadcast/i }))

    await waitFor(() => {
      expect(notificationApi.sendBulk).toHaveBeenCalledWith(
        [1, 3],
        'Notice',
        'Message body',
        'GENERAL'
      )
    })
  })
})
