import { screen } from '@testing-library/react'
import LandingPage from '../LandingPage'
import { renderWithProviders } from '../../test/renderWithProviders'

// Mocking useAuth
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
  }),
}))

// Mocking Navbar
jest.mock('../../components/Navbar', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar">Navbar</div>,
}))

describe('LandingPage', () => {
  test('renders correctly for non-authenticated user', () => {
    renderWithProviders(<LandingPage />)

    expect(screen.getByText('Build Smarter Resumes.')).toBeInTheDocument()
    expect(screen.getByText('Land More Interviews.')).toBeInTheDocument()
    expect(screen.getByText('Start Building Free')).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByText('Everything you need to get hired')).toBeInTheDocument()
  })

  test('renders pricing plans correctly', () => {
    renderWithProviders(<LandingPage />)

    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('Premium')).toBeInTheDocument()
    expect(screen.getByText('₹599/mo')).toBeInTheDocument()
    expect(screen.getByText('Get Started Free')).toBeInTheDocument()
  })
})
