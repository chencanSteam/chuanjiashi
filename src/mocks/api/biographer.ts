import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import { defaultBiographers } from '../data/seed'
import { createOrder } from './order'
import type { Biographer, BiographerOrder } from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

function ensureBiographers(): Biographer[] {
  const biographers = getItem<Biographer[]>(storeKeys.biographers, [])
  if (biographers.length === 0) {
    setItem(storeKeys.biographers, defaultBiographers)
    return defaultBiographers
  }
  return biographers
}

function saveBiographers(biographers: Biographer[]): void {
  setItem(storeKeys.biographers, biographers)
}

export const biographerHandlers: HttpHandler[] = [
  // 管理后台接口放在前面，避免被 :id 路由拦截
  http.get('/api/biographers/all', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    return success(ensureBiographers())
  }),

  http.get('/api/biographers', async ({ request }) => {
    const url = new URL(request.url)
    const city = url.searchParams.get('city') || ''
    let list = ensureBiographers().filter((b) => b.status === 'approved')
    if (city) list = list.filter((b) => b.city.includes(city))
    return success(list)
  }),

  http.get('/api/biographers/:id', async ({ params }) => {
    const list = ensureBiographers()
    const item = list.find((b) => b.id === params.id)
    if (!item) return notFound('传记师不存在')
    return success(item)
  }),

  http.post('/api/biographer-orders', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { biographerId, serviceId } = (await request.json()) as { biographerId?: string; serviceId?: string }
    const biographers = ensureBiographers()
    const biographer = biographers.find((b) => b.id === biographerId)
    if (!biographer) return notFound('传记师不存在')
    const service = biographer.services.find((s) => s.id === serviceId)
    if (!service || !biographerId || !serviceId) return fail('参数错误')

    const order = createOrder(userId, {
      type: 'biographer_service',
      productId: serviceId,
      productName: `${biographer.name} - ${service.name}`,
      amount: service.price,
    })

    const bioOrder: BiographerOrder = {
      id: generateId(),
      userId,
      biographerId,
      serviceId,
      serviceName: service.name,
      amount: service.price,
      deposit: Math.round(service.price * 0.3),
      status: 'pending_deposit',
      progress: [
        { node: '支付定金', status: 'pending' },
        { node: '预约采访', status: 'pending' },
        { node: '提交初稿', status: 'pending' },
        { node: '修改完善', status: 'pending' },
        { node: '支付尾款', status: 'pending' },
        { node: '交付定稿', status: 'pending' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const bioOrders = getItem<BiographerOrder[]>(storeKeys.biographerOrders, [])
    bioOrders.push(bioOrder)
    setItem(storeKeys.biographerOrders, bioOrders)

    return success({ order, biographerOrder: bioOrder }, '下单成功')
  }),

  http.get('/api/biographer-orders', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const orders = getItem<BiographerOrder[]>(storeKeys.biographerOrders, []).filter((o) => o.userId === userId)
    return success(orders)
  }),

  // ===== 传记师端接口 =====

  // 当前传记师信息
  http.get('/api/biographer/me', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const biographers = ensureBiographers()
    const currentUser = getItem<{ phone?: string } | null>(storeKeys.currentUser, null)
    let biographer = biographers.find((b) => b.phone && b.phone === currentUser?.phone)
    if (!biographer) {
      biographer = biographers.find((b) => b.status === 'approved')
    }
    if (!biographer) {
      biographer = biographers[0]
    }
    if (!biographer) return notFound('您还不是传记师')
    return success(biographer)
  }),

  // 当前传记师的订单
  http.get('/api/biographer/orders', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const biographers = ensureBiographers()
    const currentUser = getItem<{ phone?: string } | null>(storeKeys.currentUser, null)
    let biographer = biographers.find((b) => b.phone && b.phone === currentUser?.phone)
    if (!biographer) {
      biographer = biographers.find((b) => b.status === 'approved')
    }
    if (!biographer) {
      biographer = biographers[0]
    }
    if (!biographer) return notFound('您还不是传记师')

    let orders = getItem<BiographerOrder[]>(storeKeys.biographerOrders, []).filter(
      (o) => o.biographerId === biographer!.id
    )

    // 演示环境：没有订单时自动生成几个
    if (orders.length === 0) {
      const demoOrders: BiographerOrder[] = [
        {
          id: generateId(),
          userId: 'u_demo_001',
          biographerId: biographer.id,
          serviceId: 'svc_001',
          serviceName: '家族传记标准版',
          amount: 2999,
          deposit: 900,
          status: 'interview_scheduled',
          progress: [
            { node: '支付定金', status: 'done' },
            { node: '预约采访', status: 'done' },
            { node: '提交初稿', status: 'pending' },
            { node: '修改完善', status: 'pending' },
            { node: '支付尾款', status: 'pending' },
            { node: '交付定稿', status: 'pending' },
          ],
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          userId: 'u_demo_002',
          biographerId: biographer.id,
          serviceId: 'svc_002',
          serviceName: '个人回忆录长篇版',
          amount: 5999,
          deposit: 1800,
          status: 'modifying',
          progress: [
            { node: '支付定金', status: 'done' },
            { node: '预约采访', status: 'done' },
            { node: '提交初稿', status: 'done' },
            { node: '修改完善', status: 'done' },
            { node: '支付尾款', status: 'pending' },
            { node: '交付定稿', status: 'pending' },
          ],
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          userId: 'u_demo_003',
          biographerId: biographer.id,
          serviceId: 'svc_003',
          serviceName: '企业家传记',
          amount: 9999,
          deposit: 3000,
          status: 'completed',
          progress: [
            { node: '支付定金', status: 'done' },
            { node: '预约采访', status: 'done' },
            { node: '提交初稿', status: 'done' },
            { node: '修改完善', status: 'done' },
            { node: '支付尾款', status: 'done' },
            { node: '交付定稿', status: 'done' },
          ],
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      const allOrders = getItem<BiographerOrder[]>(storeKeys.biographerOrders, [])
      allOrders.push(...demoOrders)
      setItem(storeKeys.biographerOrders, allOrders)
      orders = demoOrders
    }

    return success(orders)
  }),

  // 传记师更新自己资料
  http.put('/api/biographer/me', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as Partial<Biographer>
    const biographers = ensureBiographers()
    const currentUser = getItem<{ phone?: string } | null>(storeKeys.currentUser, null)
    let idx = biographers.findIndex((b) => b.phone && b.phone === currentUser?.phone)
    if (idx < 0) {
      idx = biographers.findIndex((b) => b.status === 'approved')
    }
    if (idx < 0) return notFound('您还不是传记师')

    biographers[idx] = { ...biographers[idx], ...body, id: biographers[idx].id, updatedAt: new Date().toISOString() }
    saveBiographers(biographers)
    return success(biographers[idx])
  }),

  // ===== 管理后台接口 =====

  // 创建传记师
  http.post('/api/biographers', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as Partial<Biographer>
    if (!body.name || !body.phone) return fail('请填写姓名和手机号')

    const biographers = ensureBiographers()
    const biographer: Biographer = {
      id: generateId(),
      userId: userId,
      phone: body.phone,
      name: body.name,
      email: body.email,
      avatar: body.avatar,
      city: body.city || '未知城市',
      intro: body.intro || '',
      specialties: body.specialties || [],
      experience: body.experience || 0,
      services: body.services || [],
      cases: body.cases || [],
      status: (body.status as Biographer['status']) || 'pending',
      deposit: body.deposit || 0,
      createdAt: new Date().toISOString(),
    }
    biographers.push(biographer)
    saveBiographers(biographers)
    return success(biographer)
  }),

  // 更新传记师
  http.put('/api/biographers/:id', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as Partial<Biographer>
    const biographers = ensureBiographers()
    const idx = biographers.findIndex((b) => b.id === params.id)
    if (idx < 0) return notFound('传记师不存在')

    biographers[idx] = { ...biographers[idx], ...body, id: biographers[idx].id }
    saveBiographers(biographers)
    return success(biographers[idx])
  }),

  // 删除传记师
  http.delete('/api/biographers/:id', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const biographers = ensureBiographers()
    const next = biographers.filter((b) => b.id !== params.id)
    saveBiographers(next)
    return success(null, '删除成功')
  }),
]
