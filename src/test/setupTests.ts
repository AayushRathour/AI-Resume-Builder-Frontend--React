import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'util'
import 'whatwg-fetch'
import { server } from './msw/server'

Object.assign(global, { TextDecoder, TextEncoder })

let consoleLogSpy: jest.SpyInstance | null = null

beforeAll(() => {
  consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  server.listen({ onUnhandledRequest: 'warn' })
})

afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
  sessionStorage.clear()
  jest.clearAllMocks()
})

afterAll(() => {
  server.close()
  consoleLogSpy?.mockRestore()
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => { },
    removeListener: () => { },
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatchEvent: () => false,
  }),
})
