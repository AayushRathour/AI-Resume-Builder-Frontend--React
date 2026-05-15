import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminPagination from '../AdminPagination'

describe('AdminPagination', () => {
  test('renders range and handles navigation', async () => {
    const onPageChange = jest.fn()
    const user = userEvent.setup()

    render(
      <AdminPagination
        currentPage={2}
        totalPages={3}
        onPageChange={onPageChange}
        totalItems={30}
        itemsPerPage={10}
      />
    )

    expect(screen.getByText(/Showing/i)).toHaveTextContent('Showing 11 to 20 of 30 items')

    await user.click(screen.getByTitle('Previous page'))
    await user.click(screen.getByTitle('Next page'))
    await user.click(screen.getByRole('button', { name: '3' }))

    expect(onPageChange).toHaveBeenCalledWith(1)
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  test('renders nothing when totalPages is 1', () => {
    const { container } = render(
      <AdminPagination
        currentPage={1}
        totalPages={1}
        onPageChange={jest.fn()}
        totalItems={5}
        itemsPerPage={5}
      />
    )

    expect(container.firstChild).toBeNull()
  })
})
