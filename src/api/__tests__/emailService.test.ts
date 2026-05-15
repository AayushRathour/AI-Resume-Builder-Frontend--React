const mockSend = jest.fn()

jest.mock('@emailjs/browser', () => ({
  __esModule: true,
  default: { send: (...args: unknown[]) => mockSend(...args) },
}))

describe('emailService', () => {
  let errorSpy: jest.SpyInstance

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.resetModules()
    mockSend.mockReset()
  })

  afterEach(() => {
    errorSpy.mockRestore()
  })

  test('returns false when config is missing', async () => {
    jest.doMock('../../config/api', () => ({
      EMAILJS_SERVICE_ID: '',
      EMAILJS_TEMPLATE_ID: '',
      EMAILJS_PUBLIC_KEY: '',
    }))

    const { sendOtpEmail } = await import('../emailService')
    const result = await sendOtpEmail({ email: 'a@b.com', name: 'A', otp: '123456' })
    expect(result).toBe(false)
    expect(mockSend).not.toHaveBeenCalled()
  })

  test('returns false when email or otp is missing', async () => {
    jest.doMock('../../config/api', () => ({
      EMAILJS_SERVICE_ID: 'svc',
      EMAILJS_TEMPLATE_ID: 'tpl',
      EMAILJS_PUBLIC_KEY: 'pub',
    }))

    const { sendOtpEmail } = await import('../emailService')
    const result = await sendOtpEmail({ email: '', name: 'A', otp: '' })
    expect(result).toBe(false)
  })

  test('sends email and returns true', async () => {
    jest.doMock('../../config/api', () => ({
      EMAILJS_SERVICE_ID: 'svc',
      EMAILJS_TEMPLATE_ID: 'tpl',
      EMAILJS_PUBLIC_KEY: 'pub',
    }))
    mockSend.mockResolvedValue({})

    const { sendOtpEmail } = await import('../emailService')
    const result = await sendOtpEmail({ email: 'a@b.com', name: 'A', otp: '123456' })
    expect(result).toBe(true)
    expect(mockSend).toHaveBeenCalled()
  })

  test('returns false on send error', async () => {
    jest.doMock('../../config/api', () => ({
      EMAILJS_SERVICE_ID: 'svc',
      EMAILJS_TEMPLATE_ID: 'tpl',
      EMAILJS_PUBLIC_KEY: 'pub',
    }))
    mockSend.mockRejectedValue(new Error('fail'))

    const { sendOtpEmail } = await import('../emailService')
    const result = await sendOtpEmail({ email: 'a@b.com', name: 'A', otp: '123456' })
    expect(result).toBe(false)
  })
})
