import { screen } from '@testing-library/react'
import PricingPage from '../PricingPage'
import { renderWithProviders } from '../../test/renderWithProviders'

// Mocking useAuth
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { userId: 1, fullName: 'Test User', email: 'test@example.com' },
    isPremium: false,
    login: jest.fn(),
  }),
}))

// Mocking paymentApi
jest.mock('../../api/paymentApi', () => ({
  paymentApi: {
    createOrder: jest.fn(),
    verifyPayment: jest.fn(),
  },
}))

// Mocking Navbar
jest.mock('../../components/Navbar', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar">Navbar</div>,
}))

describe('PricingPage', () => {
  test('renders correctly and shows both plans', () => {
    renderWithProviders(<PricingPage />)

    expect(screen.getByText('Simple, transparent pricing')).toBeInTheDocument()
    expect(screen.getByText('Free Plan')).toBeInTheDocument()
    expect(screen.getByText('Premium Plan')).toBeInTheDocument()
    expect(screen.getByText('₹599')).toBeInTheDocument()
    expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
  })

  test('shows features for both plans', () => {
    renderWithProviders(<PricingPage />)

    expect(screen.getByText('Create up to 3 Resumes')).toBeInTheDocument()
    expect(screen.getByText('Unlimited Resumes')).toBeInTheDocument()
    expect(screen.getByText('DOCX & JSON Exports')).toBeInTheDocument()
  })
})
