import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdminUsers from '../AdminUsers'
import { adminApi } from '@/api/adminApi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock dependencies
jest.mock('@/api/adminApi', () => ({
  adminApi: {
    getUsers: jest.fn(),
    deleteUser: jest.fn(),
    updateSubscription: jest.fn(),
    upgradeUser: jest.fn(),
    suspendUser: jest.fn(),
    restoreUser: jest.fn()
  }
}))

jest.mock('@/components/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="admin-layout">{children}</div>
}))

jest.mock('@/components/admin/AdminPagination', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-pagination" />
}))

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
})

const renderWithQuery = (ui: any) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('AdminUsers', () => {
  const mockUsers = [
    {
      userId: 1,
      fullName: 'Test User',
      email: 'test@example.com',
      subscriptionPlan: 'FREE',
      role: 'USER',
      isActive: true,
      isDeleted: false,
      createdAt: '2023-01-01'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(adminApi.getUsers as jest.Mock).mockResolvedValue(mockUsers)
  })

  test('renders users table', async () => {
    renderWithQuery(<AdminUsers />)
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })
  })

  test('filters users by search', async () => {
    renderWithQuery(<AdminUsers />)
    await waitFor(() => screen.getByText('Test User'))
    
    const searchInput = screen.getByPlaceholderText(/Search users/i)
    fireEvent.change(searchInput, { target: { value: 'unknown' } })
    
    await waitFor(() => {
      expect(screen.queryByText('Test User')).not.toBeInTheDocument()
      expect(screen.getByText('No users found')).toBeInTheDocument()
    })
  })

  test('handles user upgrade to premium', async () => {
    ;(adminApi.updateSubscription as jest.Mock).mockResolvedValue({ success: true })
    renderWithQuery(<AdminUsers />)
    
    await waitFor(() => screen.getByText('Test User'))
    
    const upgradeBtn = screen.getByTitle('Upgrade to Premium')
    fireEvent.click(upgradeBtn)
    
    await waitFor(() => {
      expect(adminApi.updateSubscription).toHaveBeenCalledWith(1, 'PREMIUM')
    })
  })

  test('handles user suspension', async () => {
    ;(adminApi.suspendUser as jest.Mock).mockResolvedValue({ success: true })
    renderWithQuery(<AdminUsers />)
    
    await waitFor(() => screen.getByText('Test User'))
    
    const suspendBtn = screen.getByTitle('Suspend User')
    fireEvent.click(suspendBtn)
    
    await waitFor(() => {
      expect(adminApi.suspendUser).toHaveBeenCalledWith(1)
    })
  })

  test('handles user deletion after confirmation', async () => {
    window.confirm = jest.fn(() => true)
    ;(adminApi.deleteUser as jest.Mock).mockResolvedValue({ success: true })
    renderWithQuery(<AdminUsers />)
    
    await waitFor(() => screen.getByText('Test User'))
    
    const deleteBtn = screen.getByTitle('Delete')
    fireEvent.click(deleteBtn)
    
    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() => {
      expect(adminApi.deleteUser).toHaveBeenCalledWith(1)
    })
  })
})
