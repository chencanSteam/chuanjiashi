import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import { findOrder, saveOrder } from './order'
import { increaseProductSales } from './product'
import { generateCommission } from './commission'
import type { Payment } from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

function savePayment(payment: Payment): void {
  const payments = getItem<Payment[]>(storeKeys.payments, [])
  payments.push(payment)
  setItem(storeKeys.payments, payments)
}

export const paymentHandlers: HttpHandler[] = [
  http.post('/api/payments', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { orderId, channel } = (await request.json()) as { orderId?: string; channel?: 'wechat' | 'alipay' }
    if (!orderId || !channel) return fail('参数错误')

    const order = findOrder(orderId)
    if (!order || order.userId !== userId) return notFound('订单不存在')
    if (order.status !== 'pending_pay') return fail('订单状态不正确')
    if (order.expireAt && new Date(order.expireAt) < new Date()) {
      order.status = 'closed'
      order.updatedAt = new Date().toISOString()
      saveOrder(order)
      return fail('订单已超时关闭，请重新下单')
    }

    // 模拟支付成功
    const payment: Payment = {
      id: generateId(),
      orderId,
      userId,
      amount: order.amount,
      channel,
      status: 'success',
      paidAt: new Date().toISOString(),
      transactionId: `mock_${channel}_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    savePayment(payment)

    // 数字商品（传记导出/二维码/纪念视频/数字人）无需物流交付，支付成功即完成；实体商品支付后进入已支付待发货
    const DIGITAL_TYPES = ['biography', 'qrcode', 'video', 'digital_person']
    order.status = DIGITAL_TYPES.includes(order.type) ? 'completed' : 'paid'
    order.payTime = payment.paidAt || new Date().toISOString()
    order.updatedAt = payment.paidAt || new Date().toISOString()
    saveOrder(order)

    increaseProductSales(order.productId)

    // 生成一级推广佣金
    const users = getItem<{ id: string; invitedBy?: string }[]>(storeKeys.users, [])
    const currentUser = users.find((u) => u.id === userId)
    if (currentUser?.invitedBy) {
      generateCommission(order, currentUser.invitedBy)
    }

    return success({ payment, order }, '支付成功')
  }),

  http.get('/api/payments', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const payments = getItem<Payment[]>(storeKeys.payments, []).filter((p) => p.userId === userId)
    return success(payments)
  }),
]
