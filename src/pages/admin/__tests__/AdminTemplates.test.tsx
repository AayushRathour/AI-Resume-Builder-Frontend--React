import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdminTemplates from '../AdminTemplates'
import { adminApi } from '@/api/adminApi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { validateTemplate } from '@/utils/validation'

// Mock dependencies
jest.mock('@/api/adminApi', () => ({
  adminApi: {
    getTemplates: jest.fn(),
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn()
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

jest.mock('@/utils/validation', () => ({
  validateTemplate: jest.fn()
}))

jest.mock('@/utils/templateNormalizer', () => ({
  normalizeTemplate: jest.fn(t => t)
}))

jest.mock('@/utils/templateEngine', () => ({
  renderTemplate: jest.fn(() => '<div>Preview</div>')
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

describe('AdminTemplates', () => {
  const mockTemplates = [
    {
      templateId: 1,
      name: 'Modern Template',
      category: 'MODERN',
      isPremium: false,
      isActive: true,
      htmlLayout: '<div>{{name}}</div>',
      cssStyles: ''
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(adminApi.getTemplates as jest.Mock).mockResolvedValue(mockTemplates)
    ;(validateTemplate as jest.Mock).mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
      foundPlaceholders: ['{{name}}'],
      hasHardcodedNames: false
    })
  })

  test('renders templates table', async () => {
    renderWithQuery(<AdminTemplates />)
    await waitFor(() => {
      expect(screen.getByText('Modern Template')).toBeInTheDocument()
      expect(screen.getByText('MODERN')).toBeInTheDocument()
    })
  })

  test('opens create form and handles submission', async () => {
    ;(adminApi.createTemplate as jest.Mock).mockResolvedValue({ success: true })
    renderWithQuery(<AdminTemplates />)
    
    fireEvent.click(screen.getByText(/New Template/i))
    
    const nameInput = screen.getByPlaceholderText(/Template name/i)
    fireEvent.change(nameInput, { target: { value: 'New Template' } })
    
    const layoutInput = screen.getByPlaceholderText(/<div style=/i)
    fireEvent.change(layoutInput, { target: { value: '<div>{{name}}</div>' } })
    
    const createBtn = screen.getByRole('button', { name: /Create Template/i })
    fireEvent.click(createBtn)
    
    await waitFor(() => {
      expect(adminApi.createTemplate).toHaveBeenCalled()
    })
  })

  test('handles normalization of templates', async () => {
    window.confirm = jest.fn(() => true)
    renderWithQuery(<AdminTemplates />)
    
    await waitFor(() => screen.getByText('Modern Template'))
    
    fireEvent.click(screen.getByText(/Normalize DB Templates/i))
    
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled()
    })
  })

  test('handles template deletion', async () => {
    window.confirm = jest.fn(() => true)
    ;(adminApi.deleteTemplate as jest.Mock).mockResolvedValue({ success: true })
    renderWithQuery(<AdminTemplates />)
    
    await waitFor(() => screen.getByText('Modern Template'))
    
    // Find the delete button using the data-testid
    const deleteBtn = screen.getByTestId('delete-template-1')
    fireEvent.click(deleteBtn)
    
    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() => {
      expect(adminApi.deleteTemplate).toHaveBeenCalledWith(1)
    })
  })
})
