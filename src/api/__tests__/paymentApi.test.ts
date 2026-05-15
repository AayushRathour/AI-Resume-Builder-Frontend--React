import { rest } from 'msw'
import { server } from '../../test/msw/server'
import { paymentApi } from '../paymentApi'

const API_BASE = 'http://localhost:8080/api/v1'

describe('paymentApi', () => {
  test('createOrder returns payment details', async () => {
    server.use(
      rest.post(`${API_BASE}/payment/order`, (_req, res, ctx) =>
        res(ctx.json({ orderId: 'ord_1', amount: 199, currency: 'INR', keyId: 'key', plan: 'PREMIUM' }))
      )
    )

    const result = await paymentApi.createOrder(199, 'INR', 'PREMIUM')
    expect(result.orderId).toBe('ord_1')
    expect(result.plan).toBe('PREMIUM')
  })

  test('verifyPayment returns response body', async () => {
    server.use(
      rest.post(`${API_BASE}/payment/verify`, (_req, res, ctx) =>
        res(ctx.json({ verified: true }))
      )
    )

    const result = await paymentApi.verifyPayment({ orderId: 'ord_1', paymentId: 'pay_1', signature: 'sig' })
    expect(result).toEqual({ verified: true })
  })
})
