import { screen, waitFor } from '@testing-library/react'
import QuotaBadge from '../QuotaBadge'
import { useAuth } from '../../context/AuthContext'
import { aiApi } from '../../api/aiApi'
import { renderWithProviders } from '../../test/renderWithProviders'

jest.mock('../../context/AuthContext', () => {
  const original = jest.requireActual('../../context/AuthContext')
  return {
    ...original,
    useAuth: jest.fn()
  }
})

jest.mock('../../api/aiApi', () => ({
  aiApi: {
    getQuota: jest.fn()
  }
}))

describe('QuotaBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders premium badge if user is premium', () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: { userId: '123' }, isPremium: true })
    
    renderWithProviders(<QuotaBadge />)
    
    expect(screen.getByText('Unlimited AI Calls')).toBeInTheDocument()
    expect(screen.queryByText('Monthly AI Quota')).not.toBeInTheDocument()
  })

  test('renders null if not premium and no data', () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: { userId: '123' }, isPremium: false })
    ;(aiApi.getQuota as jest.Mock).mockResolvedValue(null)
    
    const { container } = renderWithProviders(<QuotaBadge />)
    expect(container).toBeEmptyDOMElement()
  })

  test('renders quota details for non-premium user', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: { userId: '123' }, isPremium: false })
    ;(aiApi.getQuota as jest.Mock).mockResolvedValue({
      contentRemaining: 5,
      contentAllowed: 10,
      atsRemaining: 2,
      atsAllowed: 5
    })
    
    renderWithProviders(<QuotaBadge />)
    
    await waitFor(() => {
      expect(screen.getByText('Monthly AI Quota')).toBeInTheDocument()
      expect(screen.getByText('5/10 left')).toBeInTheDocument()
      expect(screen.getByText('2/5 left')).toBeInTheDocument()
    })
  })
})
