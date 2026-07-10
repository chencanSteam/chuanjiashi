import { http, type HttpHandler } from 'msw'
import { success, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import type { Order, OrderStatus, User } from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

export function findOrder(orderId: string): Order | undefined {
  const orders = getItem<Order[]>(storeKeys.orders, [])
  return orders.find((o) => o.id === orderId)
}

export function saveOrder(order: Order): void {
  const orders = getItem<Order[]>(storeKeys.orders, [])
  const idx = orders.findIndex((o) => o.id === order.id)
  if (idx >= 0) orders[idx] = order
  else orders.push(order)
  setItem(storeKeys.orders, orders)
}

export function createOrder(userId: string, data: Partial<Order>): Order {
  const order: Order = {
    id: generateId(),
    userId,
    archiveId: data.archiveId,
    type: data.type || 'biography',
    productId: data.productId || '',
    productName: data.productName || '未知商品',
    amount: data.amount || 0,
    status: 'pending_pay',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  saveOrder(order)
  return order
}

function ensureDemoUsers(): User[] {
  const existing = getItem<User[]>(storeKeys.users, [])
  const users = Array.isArray(existing) ? existing : []
  const demoUsers: User[] = [
    { id: 'u_demo_1', phone: '13800001001', nickname: '张先生', inviteCode: 'ABC123', agreementAccepted: true, privacyAccepted: true, createdAt: '2024-01-10T08:00:00' },
    { id: 'u_demo_2', phone: '13800001002', nickname: '李女士', inviteCode: 'DEF456', agreementAccepted: true, privacyAccepted: true, createdAt: '2024-01-15T08:00:00' },
    { id: 'u_demo_3', phone: '13800001003', nickname: '王先生', inviteCode: 'GHI789', agreementAccepted: true, privacyAccepted: true, createdAt: '2024-02-01T08:00:00' },
    { id: 'u_demo_4', phone: '13800001004', nickname: '赵女士', inviteCode: 'JKL012', agreementAccepted: true, privacyAccepted: true, createdAt: '2024-02-10T08:00:00' },
    { id: 'u_demo_5', phone: '13800001005', nickname: '陈先生', inviteCode: 'MNO345', agreementAccepted: true, privacyAccepted: true, createdAt: '2024-02-15T08:00:00' },
    { id: 'u_demo_6', phone: '13800001006', nickname: '刘女士', inviteCode: 'PQR678', agreementAccepted: true, privacyAccepted: true, createdAt: '2024-02-20T08:00:00' },
    { id: 'u_demo_7', phone: '13800001007', nickname: '杨先生', inviteCode: 'STU901', agreementAccepted: true, privacyAccepted: true, createdAt: '2024-03-01T08:00:00' },
    { id: 'u_demo_8', phone: '13800001008', nickname: '周女士', inviteCode: 'VWX234', agreementAccepted: true, privacyAccepted: true, createdAt: '2024-03-05T08:00:00' },
    { id: 'u_demo_9', phone: '13800001009', nickname: '吴先生', inviteCode: 'YZA567', agreementAccepted: true, privacyAccepted: true, createdAt: '2024-03-10T08:00:00' },
    { id: 'u_demo_10', phone: '13800001010', nickname: '孙女士', inviteCode: 'BCD890', agreementAccepted: true, privacyAccepted: true, createdAt: '2024-03-15T08:00:00' },
  ]
  if (users.length === 0) {
    setItem(storeKeys.users, demoUsers)
    return demoUsers
  }
  // 合并确保 demo 用户存在
  const userMap = new Map(users.map((u) => [u.id, u]))
  demoUsers.forEach((u) => {
    if (!userMap.has(u.id)) userMap.set(u.id, u)
  })
  const merged = Array.from(userMap.values())
  setItem(storeKeys.users, merged)
  return merged
}

function initDemoOrders(): Order[] {
  const existing = getItem<Order[]>(storeKeys.orders, [])
  const orders = Array.isArray(existing) ? existing : []
  if (orders.length > 0) return orders

  const users = ensureDemoUsers().filter((u) => u && u.id)
  if (users.length === 0) return []

  const userAt = (idx: number) => users[Math.min(idx, users.length - 1)].id

  const demoOrders: Order[] = [
    { id: 'ord_001', userId: userAt(0), type: 'biography', productId: 'prod_001', productName: '标准传记服务', amount: 1999, status: 'paid', payTime: '2024-06-15T10:30:00', createdAt: '2024-06-15T10:00:00', updatedAt: '2024-06-15T10:30:00' },
    { id: 'ord_002', userId: userAt(1), type: 'digital_person', productId: 'prod_002', productName: '数字人基础版', amount: 2999, status: 'completed', payTime: '2024-06-16T14:20:00', createdAt: '2024-06-16T14:00:00', updatedAt: '2024-06-18T09:00:00' },
    { id: 'ord_003', userId: userAt(2), type: 'biography', productId: 'prod_003', productName: '家族传记尊享版', amount: 5999, status: 'pending_pay', createdAt: '2024-06-17T16:00:00', updatedAt: '2024-06-17T16:00:00' },
    { id: 'ord_004', userId: userAt(3), type: 'book', productId: 'prod_004', productName: '实体书印刷（精装）', amount: 688, status: 'delivering', payTime: '2024-06-18T09:10:00', createdAt: '2024-06-18T09:00:00', updatedAt: '2024-06-19T11:00:00' },
    { id: 'ord_005', userId: userAt(0), type: 'biographer_service', productId: 'prod_005', productName: '传记师上门服务', amount: 3999, status: 'refunded', payTime: '2024-06-19T10:00:00', createdAt: '2024-06-19T09:30:00', updatedAt: '2024-06-20T15:00:00' },
    { id: 'ord_006', userId: userAt(1), type: 'digital_person', productId: 'prod_002', productName: '数字人基础版', amount: 2999, status: 'closed', createdAt: '2024-06-20T11:00:00', updatedAt: '2024-06-21T09:00:00' },
    { id: 'ord_007', userId: userAt(4), type: 'biography', productId: 'prod_003', productName: '家族传记尊享版', amount: 5999, status: 'paid', payTime: '2024-06-21T10:00:00', createdAt: '2024-06-21T09:30:00', updatedAt: '2024-06-21T10:00:00' },
    { id: 'ord_008', userId: userAt(5), type: 'video', productId: 'prod_006', productName: '纪念视频制作', amount: 1288, status: 'delivering', payTime: '2024-06-22T15:20:00', createdAt: '2024-06-22T15:00:00', updatedAt: '2024-06-23T09:00:00' },
    { id: 'ord_009', userId: userAt(6), type: 'qrcode', productId: 'prod_007', productName: '家风纪念馆二维码', amount: 199, status: 'completed', payTime: '2024-06-23T11:00:00', createdAt: '2024-06-23T10:30:00', updatedAt: '2024-06-24T09:00:00' },
    { id: 'ord_010', userId: userAt(7), type: 'biography', productId: 'prod_001', productName: '标准传记服务', amount: 1999, status: 'pending_pay', createdAt: '2024-06-24T14:00:00', updatedAt: '2024-06-24T14:00:00' },
    { id: 'ord_011', userId: userAt(8), type: 'digital_person', productId: 'prod_002', productName: '数字人基础版', amount: 2999, status: 'paid', payTime: '2024-06-25T09:10:00', createdAt: '2024-06-25T09:00:00', updatedAt: '2024-06-25T09:10:00' },
    { id: 'ord_012', userId: userAt(9), type: 'book', productId: 'prod_004', productName: '实体书印刷（精装）', amount: 688, status: 'refunded', payTime: '2024-06-25T16:00:00', createdAt: '2024-06-25T15:30:00', updatedAt: '2024-06-26T10:00:00' },
    { id: 'ord_013', userId: userAt(2), type: 'biographer_service', productId: 'prod_005', productName: '传记师上门服务', amount: 3999, status: 'completed', payTime: '2024-06-26T10:00:00', createdAt: '2024-06-26T09:00:00', updatedAt: '2024-06-28T16:00:00' },
    { id: 'ord_014', userId: userAt(3), type: 'biography', productId: 'prod_001', productName: '标准传记服务', amount: 1999, status: 'closed', createdAt: '2024-06-27T11:00:00', updatedAt: '2024-06-28T09:00:00' },
    { id: 'ord_015', userId: userAt(4), type: 'group_buy', productId: 'prod_008', productName: '家族传记团购套餐', amount: 1599, status: 'paid', payTime: '2024-06-28T14:20:00', createdAt: '2024-06-28T14:00:00', updatedAt: '2024-06-28T14:20:00' },
    { id: 'ord_016', userId: userAt(5), type: 'digital_person', productId: 'prod_002', productName: '数字人基础版', amount: 2999, status: 'delivering', payTime: '2024-06-29T10:00:00', createdAt: '2024-06-29T09:30:00', updatedAt: '2024-06-30T11:00:00' },
    { id: 'ord_017', userId: userAt(6), type: 'biography', productId: 'prod_003', productName: '家族传记尊享版', amount: 5999, status: 'pending_pay', createdAt: '2024-06-30T15:00:00', updatedAt: '2024-06-30T15:00:00' },
    { id: 'ord_018', userId: userAt(7), type: 'video', productId: 'prod_006', productName: '纪念视频制作', amount: 1288, status: 'completed', payTime: '2024-07-01T09:30:00', createdAt: '2024-07-01T09:00:00', updatedAt: '2024-07-02T16:00:00' },
    { id: 'ord_019', userId: userAt(8), type: 'book', productId: 'prod_004', productName: '实体书印刷（简装）', amount: 388, status: 'paid', payTime: '2024-07-02T11:10:00', createdAt: '2024-07-02T11:00:00', updatedAt: '2024-07-02T11:10:00' },
    { id: 'ord_020', userId: userAt(9), type: 'biography', productId: 'prod_001', productName: '标准传记服务', amount: 1999, status: 'delivering', payTime: '2024-07-03T10:00:00', createdAt: '2024-07-03T09:30:00', updatedAt: '2024-07-04T11:00:00' },
  ]

  setItem(storeKeys.orders, demoOrders)
  return demoOrders
}

function getOrderUserInfo(order: Order): { userName?: string; userPhone?: string } {
  const users = getItem<User[]>(storeKeys.users, [])
  const user = users.find((u) => u.id === order.userId)
  return user ? { userName: user.nickname, userPhone: user.phone } : {}
}

export const orderHandlers: HttpHandler[] = [
  http.get('/api/orders', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const orders = getItem<Order[]>(storeKeys.orders, []).filter((o) => o.userId === userId)
    return success(orders)
  }),

  http.get('/api/orders/:id', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const order = findOrder(params.id as string)
    if (!order || order.userId !== userId) return notFound('订单不存在')
    return success(order)
  }),

  http.post('/api/orders', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as Partial<Order>
    const order = createOrder(userId, body)
    return success(order, '订单创建成功')
  }),

  http.put('/api/orders/:id/status', async ({ request, params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const order = findOrder(params.id as string)
    if (!order || order.userId !== userId) return notFound('订单不存在')
    const { status } = (await request.json()) as { status: OrderStatus }
    order.status = status
    order.updatedAt = new Date().toISOString()
    if (status === 'paid') order.payTime = new Date().toISOString()
    saveOrder(order)
    return success(order)
  }),

  http.get('/api/admin/orders', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const orders = initDemoOrders()
    return success(orders.map((o) => ({ ...o, ...getOrderUserInfo(o) })))
  }),

  http.put('/api/admin/orders/:id/status', async ({ request, params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const order = findOrder(params.id as string)
    if (!order) return notFound('订单不存在')
    const { status } = (await request.json()) as { status: OrderStatus }
    order.status = status
    order.updatedAt = new Date().toISOString()
    if (status === 'paid' && !order.payTime) order.payTime = new Date().toISOString()
    saveOrder(order)
    return success({ ...order, ...getOrderUserInfo(order) })
  }),
]
