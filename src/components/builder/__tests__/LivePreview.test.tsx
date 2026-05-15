import { screen } from '@testing-library/react'
import LivePreview from '../LivePreview'
import { renderWithProviders } from '../../../test/renderWithProviders'

// Mocking useResumeStore
jest.mock('../../../store/useResumeStore', () => ({
  __esModule: true,
  default: (selector: any) => selector({
    data: {
      personal: { name: 'John Doe', email: 'john@example.com', phone: '', location: '', title: '', linkedin: '', github: '', website: '' },
      summary: 'Experienced dev',
      skills: ['React'],
      experience: [],
      education: [],
      projects: [],
    }
  })
}))

describe('LivePreview', () => {
  test.skip('renders personal info in preview', () => {
    const mockHtml = '<div>{{name}}</div>'
    renderWithProviders(<LivePreview templateHtml={mockHtml} templateCss="" templateName="Modern" useEmptyTemplate={false} />)
    
    // const iframe = screen.getByTitle(/Resume Preview/i) as HTMLIFrameElement
    // expect(iframe).toBeInTheDocument()
  })

  test.skip('shows empty state when no template', () => {
    renderWithProviders(<LivePreview templateHtml="" templateCss="" templateName="" useEmptyTemplate={true} />)
    expect(screen.getByText(/Select a template to see your preview/i)).toBeInTheDocument()
  })
})
