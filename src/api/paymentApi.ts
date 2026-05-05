import api from './axios'
import { EP_PAYMENT } from '../config/endpoints'

export type PaymentOrderResponse = {
  orderId: string
  amount: number
  currency: string
  keyId: string
  plan: string
}

export type PaymentVerifyRequest = {
  orderId: string
  paymentId: string
  signature: string
}

export const paymentApi = {
  createOrder: (amount: number, currency: string, plan: string) =>
    api.post(EP_PAYMENT.ORDER, { amount, currency, plan }).then(r => r.data as PaymentOrderResponse),

  verifyPayment: (payload: PaymentVerifyRequest) =>
    api.post(EP_PAYMENT.VERIFY, payload).then(r => r.data),
}
