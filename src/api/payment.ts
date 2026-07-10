import { api } from './client'
import type { Order, Payment } from '../mocks/types'

export const paymentApi = {
  pay: (orderId: string, channel: 'wechat' | 'alipay') =>
    api.post<{ payment: Payment; order: Order }>('/api/payments', { orderId, channel }),
  list: () => api.get<Payment[]>('/api/payments'),
}
