import { screen, fireEvent, waitFor } from '@testing-library/react'
import TemplateSwitcher from '../TemplateSwitcher'
import useResumeStore from '../../../store/useResumeStore'
import { templateApi } from '../../../api/templateApi'
import { renderWithProviders } from '../../../test/renderWithProviders'

// Mock dependencies
jest.mock('../../../store/useResumeStore', () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock('../../../api/templateApi', () => ({
  templateApi: {
    getAll: jest.fn()
  }
}))

describe('TemplateSwitcher', () => {
  const mockSetTemplateId = jest.fn()

  const mockTemplates = [
    { templateId: 1, name: 'Modern', isActive: true, isPremium: false },
    { templateId: 2, name: 'Professional', isActive: true, isPremium: true },
    { templateId: 3, name: 'Creative', isActive: false, isPremium: false } // Should not render
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(templateApi.getAll as jest.Mock).mockResolvedValue(mockTemplates)
    ;(useResumeStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        templateId: 1,
        setTemplateId: mockSetTemplateId
      }
      return selector(state)
    })
  })

  test('renders templates from API', async () => {
    renderWithProviders(<TemplateSwitcher />)
    
    expect(screen.getByText('Switch Template')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('Modern')).toBeInTheDocument()
      expect(screen.getByText('Professional')).toBeInTheDocument()
      // Active = false should not be in the document
      expect(screen.queryByText('Creative')).not.toBeInTheDocument()
    })
  })

  test('shows Premium badge for premium templates', async () => {
    renderWithProviders(<TemplateSwitcher />)
    
    await waitFor(() => {
      expect(screen.getByText('Premium')).toBeInTheDocument()
    })
  })

  test('calls setTemplateId when a template is clicked', async () => {
    renderWithProviders(<TemplateSwitcher />)
    
    await waitFor(() => {
      expect(screen.getByText('Professional')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Professional'))
    
    expect(mockSetTemplateId).toHaveBeenCalledWith(2)
  })

  test('calls setTemplateId with null when Default is clicked', async () => {
    renderWithProviders(<TemplateSwitcher />)
    
    const defaultBtn = screen.getByText('Default (No Template)')
    fireEvent.click(defaultBtn)
    
    expect(mockSetTemplateId).toHaveBeenCalledWith(null)
  })
})
