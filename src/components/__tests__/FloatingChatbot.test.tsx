import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FloatingChatbot from '../FloatingChatbot'
import { useAuth } from '@/context/AuthContext'
import { aiApi } from '@/api/aiApi'
import api from '@/api/axios'

// Mock dependencies
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn()
}))

jest.mock('@/api/aiApi', () => ({
  aiApi: {
    chat: jest.fn()
  }
}))

jest.mock('@/api/axios', () => ({
  post: jest.fn(),
  defaults: { baseURL: '' },
  interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
}))

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn()

describe('FloatingChatbot', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({ user: { userId: 'user123' } })
  })

  test('opens and closes the chatbot', () => {
    render(<FloatingChatbot />)
    const toggleBtn = screen.getByLabelText(/Toggle AI Assistant/i)
    
    fireEvent.click(toggleBtn)
    expect(screen.getByText(/Online • AI Powered/i)).toBeInTheDocument()
    
    fireEvent.click(toggleBtn)
    expect(screen.queryByText(/Online • AI Powered/i)).not.toBeInTheDocument()
  })

  test('sends a message and receives AI response', async () => {
    ;(aiApi.chat as jest.Mock).mockResolvedValue('Hello there! How can I help?')
    render(<FloatingChatbot />)
    fireEvent.click(screen.getByLabelText(/Toggle AI Assistant/i))
    
    const input = screen.getByPlaceholderText(/Ask me anything/i)
    fireEvent.change(input, { target: { value: 'How to write a resume?' } })
    
    // Find the form by its aria-label
    const form = screen.getByRole('form', { name: /chat-form/i })
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(screen.getByText(/Hello there!/i)).toBeInTheDocument()
    })
  })

  test('switches to tailor mode and handles job description analysis', async () => {
    ;(api.post as jest.Mock).mockResolvedValue({ data: { data: { text: 'Suggestions: 1. Use keywords.' } } })
    render(<FloatingChatbot />)
    fireEvent.click(screen.getByLabelText(/Toggle AI Assistant/i))
    
    // Click Briefcase icon to switch to tailor mode
    const tailorModeBtn = screen.getByTitle(/Tailor Resume/i)
    fireEvent.click(tailorModeBtn)
    
    const textarea = screen.getByPlaceholderText(/Paste the job description/i)
    fireEvent.change(textarea, { target: { value: 'Software Engineer at Google' } })
    
    fireEvent.click(screen.getByText(/Get Tailoring Tips/i))
    
    await waitFor(() => {
      expect(screen.getByText(/Use keywords/i)).toBeInTheDocument()
    })
  })

  test('clears chat history', async () => {
    render(<FloatingChatbot />)
    fireEvent.click(screen.getByLabelText(/Toggle AI Assistant/i))
    
    const clearBtn = screen.getByTitle(/Clear chat/i)
    fireEvent.click(clearBtn)
    
    // It should reset to welcome message
    expect(screen.getByText(/Hi! I'm/i)).toBeInTheDocument()
  })
})
