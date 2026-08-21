import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import { defaultBiographers, defaultReviews } from '../data/seed'
import { createOrder, saveOrder } from './order'
import type { Biographer, BiographerOrder, BiographerReview, Order } from '../types'

const DEPOSIT_PRODUCT_ID = 'biographer_deposit'
const DEPOSIT_AMOUNT = 500

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
  // 老数据回填新增字段（完成订单数、荣誉证书），以种子数据中同 id 的记录为准
  let changed = false
  const merged = biographers.map((b) => {
    const seed = defaultBiographers.find((d) => d.id === b.id)
    if (!seed) return b
    const completedOrders = b.completedOrders ?? seed.completedOrders
    const certificates = b.certificates?.length ? b.certificates : seed.certificates
    if (completedOrders !== b.completedOrders || certificates !== b.certificates) {
      changed = true
      return { ...b, completedOrders, certificates }
    }
    return b
  })
  if (changed) setItem(storeKeys.biographers, merged)
  return merged
}

function saveBiographers(biographers: Biographer[]): void {
  setItem(storeKeys.biographers, biographers)
}

function ensureReviews(): BiographerReview[] {
  const reviews = getItem<BiographerReview[]>(storeKeys.biographerReviews, [])
  if (reviews.length === 0) {
    setItem(storeKeys.biographerReviews, defaultReviews)
    return defaultReviews
  }
  return reviews
}

function saveReviews(reviews: BiographerReview[]): void {
  setItem(storeKeys.biographerReviews, reviews)
}

function recalcBiographerRating(biographerId: string): void {
  const reviews = ensureReviews().filter((r) => r.biographerId === biographerId)
  const biographers = ensureBiographers()
  const idx = biographers.findIndex((b) => b.id === biographerId)
  if (idx < 0) return
  const rating = reviews.length
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 5.0
  biographers[idx] = {
    ...biographers[idx],
    rating,
    reviewCount: reviews.length,
    updatedAt: new Date().toISOString(),
  }
  saveBiographers(biographers)
}

function getCurrentBiographer(): Biographer | null {
  const biographers = ensureBiographers()
  const currentUser = getItem<{ phone?: string } | null>(storeKeys.currentUser, null)
  let biographer = biographers.find((b) => b.phone && b.phone === currentUser?.phone)
  if (!biographer) biographer = biographers.find((b) => b.status === 'approved')
  if (!biographer) biographer = biographers[0]
  return biographer || null
}

function hasPaidDeposit(userId: string): boolean {
  const orders = getItem<Order[]>(storeKeys.orders, [])
  return orders.some(
    (o) => o.userId === userId && o.productId === DEPOSIT_PRODUCT_ID && (o.status === 'paid' || o.status === 'completed')
  )
}

const nextProgressMap: Record<string, string> = {
  '支付定金': '预约采访',
  '预约采访': '提交初稿',
  '提交初稿': '修改完善',
  '修改完善': '支付尾款',
  '支付尾款': '交付定稿',
}

const statusByNode: Record<string, BiographerOrder['status']> = {
  '支付定金': 'pending_deposit',
  '预约采访': 'paid_deposit',
  '提交初稿': 'interview_scheduled',
  '修改完善': 'draft_submitted',
  '支付尾款': 'modifying',
  '交付定稿': 'paid_full',
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

  http.get('/api/biographers/:id/contact-access', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return success({ unlocked: false })
    const bioOrders = getItem<BiographerOrder[]>(storeKeys.biographerOrders, []).filter(
      (o) => o.userId === userId && o.biographerId === params.id
    )
    if (bioOrders.length === 0) return success({ unlocked: false })
    const orders = getItem<Order[]>(storeKeys.orders, [])
    const unlocked = bioOrders.some((bo) => {
      const order = orders.find((o) => o.id === bo.orderId)
      return !!order && (order.status === 'paid' || order.status === 'completed')
    })
    return success({ unlocked })
  }),

  http.get('/api/biographers/:id', async ({ params }) => {
    const list = ensureBiographers()
    const item = list.find((b) => b.id === params.id)
    if (!item) return notFound('传记师不存在')
    return success(item)
  }),

  http.get('/api/biographers/:id/reviews', async ({ params }) => {
    const reviews = ensureReviews().filter((r) => r.biographerId === params.id)
    return success(reviews.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)))
  }),

  http.post('/api/biographer-orders', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as {
      biographerId?: string
      serviceId?: string
      interviewee?: string
      relation?: string
      preferredTime?: string
      location?: string
      remark?: string
      contactPhone?: string
    }
    const { biographerId, serviceId } = body
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
      orderId: order.id,
      biographerId,
      serviceId,
      serviceName: service.name,
      amount: service.price,
      deposit: Math.round(service.price * 0.3),
      status: 'pending_deposit',
      schedule: {
        time: body.preferredTime || '',
        address: body.location || '',
      },
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

  http.put('/api/biographer-orders/:id/schedule', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const schedule = (await request.json()) as { time: string; address: string }
    const orders = getItem<BiographerOrder[]>(storeKeys.biographerOrders, [])
    const idx = orders.findIndex((o) => o.id === params.id)
    if (idx < 0) return notFound('订单不存在')
    orders[idx] = {
      ...orders[idx],
      schedule,
      status: 'interview_scheduled',
      progress: orders[idx].progress.map((p) =>
        p.node === '预约采访' ? { ...p, status: 'done', time: new Date().toISOString() } : p
      ),
      updatedAt: new Date().toISOString(),
    }
    setItem(storeKeys.biographerOrders, orders)
    return success(orders[idx])
  }),

  http.put('/api/biographer-orders/:id/progress', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { node } = (await request.json()) as { node: string }
    const orders = getItem<BiographerOrder[]>(storeKeys.biographerOrders, [])
    const idx = orders.findIndex((o) => o.id === params.id)
    if (idx < 0) return notFound('订单不存在')

    const currentNode = orders[idx].progress.find((p) => p.node === node)
    if (!currentNode) return fail('进度节点不存在')

    const progress = orders[idx].progress.map((p) => {
      if (p.node === node) return { ...p, status: 'done' as const, time: new Date().toISOString() }
      return p
    })

    const nextNode = nextProgressMap[node]
    const nextStatus = statusByNode[nextNode || '']

    orders[idx] = {
      ...orders[idx],
      status: nextStatus || orders[idx].status,
      progress,
      updatedAt: new Date().toISOString(),
    }
    setItem(storeKeys.biographerOrders, orders)
    return success(orders[idx])
  }),

  http.post('/api/biographer-orders/:id/review', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as { rating: number; content: string; tags?: string[] }
    const orders = getItem<BiographerOrder[]>(storeKeys.biographerOrders, [])
    const orderIdx = orders.findIndex((o) => o.id === params.id)
    if (orderIdx < 0) return notFound('订单不存在')
    if (orders[orderIdx].status !== 'completed') return fail('订单未完成，无法评价')

    const currentUser = getItem<{ nickname?: string } | null>(storeKeys.currentUser, null)
    const review: BiographerReview = {
      id: generateId(),
      biographerId: orders[orderIdx].biographerId,
      userId,
      userName: currentUser?.nickname || '匿名用户',
      orderId: params.id as string,
      rating: body.rating,
      content: body.content,
      tags: body.tags || [],
      createdAt: new Date().toISOString(),
    }
    const reviews = ensureReviews()
    reviews.push(review)
    saveReviews(reviews)
    recalcBiographerRating(review.biographerId)

    return success(review, '评价成功')
  }),

  // ===== 传记师端接口 =====

  // 缴纳入驻押金（生成真实订单记录，可在订单管理中查到）
  http.post('/api/biographer/deposit', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    if (hasPaidDeposit(userId)) return fail('您已缴纳过入驻押金')

    const order = createOrder(userId, {
      type: 'biographer_service',
      productId: DEPOSIT_PRODUCT_ID,
      productName: '传记师入驻押金',
      amount: DEPOSIT_AMOUNT,
    })
    order.status = 'paid'
    order.payTime = new Date().toISOString()
    saveOrder(order)
    return success(order, '押金缴纳成功')
  }),

  // 提交入驻申请（写入传记师库，状态 pending，等待管理端审核）
  http.post('/api/biographer/apply', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as {
      name?: string
      idCard?: string
      phone?: string
      city?: string
      specialties?: string[]
    }
    const name = (body.name || '').trim()
    const idCard = (body.idCard || '').trim()
    const phone = (body.phone || '').trim()
    const city = (body.city || '').trim()
    if (!name) return fail('请填写真实姓名')
    if (!/^\d{15}(\d{2}[0-9Xx])?$/.test(idCard)) return fail('请填写正确的身份证号')
    if (!/^1\d{10}$/.test(phone)) return fail('请填写正确的手机号')
    if (!city) return fail('请填写服务城市')
    if (!body.specialties || body.specialties.length === 0) return fail('请选择至少一个擅长领域')
    if (!hasPaidDeposit(userId)) return fail('请先缴纳入驻押金')

    const biographers = ensureBiographers()
    const idx = biographers.findIndex((b) => b.userId === userId)
    if (idx >= 0 && biographers[idx].status === 'pending') return fail('您已提交过申请，请耐心等待审核')
    if (idx >= 0 && biographers[idx].status === 'approved') return fail('您已是认证传记师，无需重复申请')

    if (idx >= 0) {
      // 被驳回后重新提交：更新原记录并回到待审核
      biographers[idx] = {
        ...biographers[idx],
        name,
        phone,
        idCard,
        city,
        specialties: body.specialties,
        status: 'pending',
        rejectReason: undefined,
        deposit: DEPOSIT_AMOUNT,
        updatedAt: new Date().toISOString(),
      }
      saveBiographers(biographers)
      return success(biographers[idx], '入驻申请已重新提交')
    }

    const biographer: Biographer = {
      id: generateId(),
      userId,
      phone,
      name,
      idCard,
      city,
      intro: '',
      specialties: body.specialties,
      experience: 0,
      serviceAreas: [city],
      certificates: [],
      tags: [],
      services: [],
      cases: [],
      status: 'pending',
      certificationLevel: 'standard',
      rating: 5.0,
      reviewCount: 0,
      deposit: DEPOSIT_AMOUNT,
      createdAt: new Date().toISOString(),
    }
    biographers.push(biographer)
    saveBiographers(biographers)
    return success(biographer, '入驻申请已提交')
  }),

  // 查询当前用户入驻申请状态与押金缴纳情况
  http.get('/api/biographer/apply/status', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const biographers = ensureBiographers()
    const biographer = biographers.find((b) => b.userId === userId)
    return success({
      depositPaid: hasPaidDeposit(userId),
      application: biographer
        ? {
            status: biographer.status,
            submittedAt: (biographer.updatedAt || biographer.createdAt),
            name: biographer.name,
            phone: biographer.phone,
            city: biographer.city,
            specialties: biographer.specialties,
            reason: biographer.rejectReason,
          }
        : null,
    })
  }),

  // 当前传记师信息
  http.get('/api/biographer/me', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const biographer = getCurrentBiographer()
    if (!biographer) return notFound('您还不是传记师')
    return success(biographer)
  }),

  // 当前传记师的订单
  http.get('/api/biographer/orders', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const biographer = getCurrentBiographer()
    if (!biographer) return notFound('您还不是传记师')

    let orders = getItem<BiographerOrder[]>(storeKeys.biographerOrders, []).filter(
      (o) => o.biographerId === biographer.id
    )

    // 演示环境：没有订单时自动生成几个
    if (orders.length === 0) {
      const demoOrders: BiographerOrder[] = [
        {
          id: generateId(),
          userId: 'u_demo_001',
          orderId: 'ord_demo_001',
          biographerId: biographer.id,
          serviceId: 'svc_001',
          serviceName: '家族传记标准版',
          amount: 2999,
          deposit: 900,
          status: 'interview_scheduled',
          schedule: { time: '2024-07-20 14:00', address: '杭州市西湖区某某小区' },
          progress: [
            { node: '支付定金', status: 'done' },
            { node: '预约采访', status: 'done', time: new Date().toISOString() },
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
          orderId: 'ord_demo_002',
          biographerId: biographer.id,
          serviceId: 'svc_002',
          serviceName: '个人回忆录长篇版',
          amount: 5999,
          deposit: 1800,
          status: 'modifying',
          schedule: { time: '2024-07-10 10:00', address: '线上视频采访' },
          progress: [
            { node: '支付定金', status: 'done' },
            { node: '预约采访', status: 'done', time: new Date().toISOString() },
            { node: '提交初稿', status: 'done', time: new Date().toISOString() },
            { node: '修改完善', status: 'done', time: new Date().toISOString() },
            { node: '支付尾款', status: 'pending' },
            { node: '交付定稿', status: 'pending' },
          ],
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          userId: 'u_demo_003',
          orderId: 'ord_demo_003',
          biographerId: biographer.id,
          serviceId: 'svc_003',
          serviceName: '企业家传记',
          amount: 9999,
          deposit: 3000,
          status: 'completed',
          schedule: { time: '2024-06-15 09:30', address: '北京市朝阳区' },
          progress: [
            { node: '支付定金', status: 'done' },
            { node: '预约采访', status: 'done', time: new Date().toISOString() },
            { node: '提交初稿', status: 'done', time: new Date().toISOString() },
            { node: '修改完善', status: 'done', time: new Date().toISOString() },
            { node: '支付尾款', status: 'done', time: new Date().toISOString() },
            { node: '交付定稿', status: 'done', time: new Date().toISOString() },
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
    if (idx < 0) idx = biographers.findIndex((b) => b.status === 'approved')
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
      title: body.title,
      specialties: body.specialties || [],
      experience: body.experience || 0,
      serviceAreas: body.serviceAreas || [],
      education: body.education,
      certificates: body.certificates || [],
      tags: body.tags || [],
      services: body.services || [],
      cases: body.cases || [],
      status: (body.status as Biographer['status']) || 'pending',
      certificationLevel: body.certificationLevel || 'standard',
      rating: body.rating ?? 5.0,
      reviewCount: body.reviewCount ?? 0,
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

    biographers[idx] = { ...biographers[idx], ...body, id: biographers[idx].id, updatedAt: new Date().toISOString() }
    saveBiographers(biographers)
    return success(biographers[idx])
  }),

  // 审核入驻申请（通过 → approved / 驳回 → rejected 并记录原因）
  http.patch('/api/biographers/:id/review', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { action, reason } = (await request.json()) as { action?: 'approve' | 'reject'; reason?: string }
    if (action !== 'approve' && action !== 'reject') return fail('参数错误')
    const biographers = ensureBiographers()
    const idx = biographers.findIndex((b) => b.id === params.id)
    if (idx < 0) return notFound('传记师不存在')
    if (biographers[idx].status !== 'pending') return fail('该传记师不在待审核状态')

    biographers[idx] = {
      ...biographers[idx],
      status: action === 'approve' ? 'approved' : 'rejected',
      rejectReason: action === 'reject' ? reason?.trim() || '资质材料不符合要求，请修改后重新提交。' : undefined,
      updatedAt: new Date().toISOString(),
    }
    saveBiographers(biographers)
    return success(biographers[idx], action === 'approve' ? '已通过审核' : '已驳回申请')
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

  // 后台：根据订单 ID 查询传记师订单
  http.get('/api/admin/biographer-orders', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const url = new URL(request.url)
    const orderId = url.searchParams.get('orderId') || ''
    const orders = getItem<BiographerOrder[]>(storeKeys.biographerOrders, [])
    const found = orders.find((o) => o.orderId === orderId)
    if (!found) return notFound('未找到关联的传记师订单')
    return success(found)
  }),
]
