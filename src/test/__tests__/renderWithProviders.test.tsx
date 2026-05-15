import { renderWithProviders } from '../renderWithProviders'

function Dummy() {
  return <div>ok</div>
}

describe('renderWithProviders', () => {
  test('renders with router and query client', () => {
    const { getByText } = renderWithProviders(<Dummy />)
    expect(getByText('ok')).toBeInTheDocument()
  })
})
