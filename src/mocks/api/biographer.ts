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

function profileSnapshot(b: Biographer) {
  return {
    name: b.name, phone: b.phone, email: b.email, avatar: b.avatar, city: b.city, intro: b.intro,
    title: b.title, specialties: b.specialties, experience: b.experience, serviceAreas: b.serviceAreas,
    education: b.education, certificates: b.certificates, tags: b.tags, services: b.services, cases: b.cases,
  }
}

function ensureBiographers(): Biographer[] {
  const stored = getItem<Biographer[]>(storeKeys.biographers, [])
  // 首次初始化和已有浏览器数据都要补齐新增 seed，避免旧 localStorage 永远看不到新 mock。
  const existingIds = new Set(stored.map((b) => b.id))
  const missingSeeds = defaultBiographers
    .filter((seed) => !existingIds.has(seed.id))
    .map((seed) => ({
      ...seed,
      profileReviewStatus: seed.profileReviewStatus || (seed.publishedProfile ? 'approved' : 'unsubmitted'),
      publishedProfile: seed.publishedProfile || (seed.status === 'approved' ? profileSnapshot(seed) : undefined),
    }))
  let changed = missingSeeds.length > 0
  const merged = stored.map((b) => {
    const seed = defaultBiographers.find((d) => d.id === b.id)
    if (!seed) return b
    const completedOrders = b.completedOrders ?? seed.completedOrders
    const mergedFields = {
      email: b.email || seed.email,
      avatar: b.avatar || seed.avatar,
      city: b.city || seed.city,
      intro: b.intro || seed.intro,
      title: b.title || seed.title,
      education: b.education || seed.education,
      specialties: b.specialties?.length ? b.specialties : seed.specialties,
      serviceAreas: b.serviceAreas?.length ? b.serviceAreas : seed.serviceAreas,
      tags: b.tags?.length ? b.tags : seed.tags,
      services: b.services?.length ? b.services : seed.services,
      cases: b.cases?.length ? b.cases : seed.cases,
      certificates: b.certificates?.length ? b.certificates : seed.certificates,
    }
    const publishedProfile = b.publishedProfile || (b.status === 'approved' ? profileSnapshot({ ...b, ...mergedFields }) : undefined)
    const profileReviewStatus = b.profileReviewStatus || (publishedProfile ? 'approved' : 'unsubmitted')
    if (completedOrders !== b.completedOrders || publishedProfile !== b.publishedProfile || profileReviewStatus !== b.profileReviewStatus
      || Object.entries(mergedFields).some(([key, value]) => value !== b[key as keyof Biographer])) {
      changed = true
      return { ...b, ...mergedFields, completedOrders, publishedProfile, profileReviewStatus }
    }
    return b
  })
  const result = [...merged, ...missingSeeds]
  if (changed) setItem(storeKeys.biographers, result)
  return result
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
  const currentUser = getItem<{ id?: string; phone?: string } | null>(storeKeys.currentUser, null)
  // 演示环境兜底：当前账号未绑定传记师资料时回退到演示传记师，保证传记师端各页面有数据
  return biographers.find((b) => b.userId === currentUser?.id)
    || biographers.find((b) => b.phone && b.phone === currentUser?.phone)
    || biographers.find((b) => b.id === 'bio_001')
    || null
}

function hasPaidDeposit(userId: string): boolean {
  const orders = getItem<Order[]>(storeKeys.orders, [])
  return orders.some(
    (o) => o.userId === userId && o.productId === DEPOSIT_PRODUCT_ID && (o.status === 'paid' || o.status === 'completed')
  )
}

const nextProgressMap: Record<string, string> = {
  '预约采访': '提交初稿',
  '提交初稿': '修改完善',
  '修改完善': '交付定稿',
}

// 完成某节点后订单进入的状态（按下一个待办节点映射；最后一个节点完成即 completed）
const statusByNode: Record<string, BiographerOrder['status']> = {
  '提交初稿': 'interview_scheduled',
  '修改完善': 'draft_submitted',
  '交付定稿': 'final_submitted',
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
    let list = ensureBiographers().filter((b) => b.status === 'approved' && b.profileReviewStatus === 'approved' && b.publishedProfile)
    list = list.map((b) => ({ ...b, ...b.publishedProfile, id: b.id, userId: b.userId, status: b.status }))
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
    if (!item || item.status !== 'approved' || item.profileReviewStatus !== 'approved' || !item.publishedProfile) return notFound('传记师主页暂未开放')
    return success({ ...item, ...item.publishedProfile, id: item.id, userId: item.userId, status: item.status })
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
      status: 'pending_schedule',
      schedule: {
        time: body.preferredTime || '',
        address: body.location || '',
      },
      progress: [
        { node: '预约采访', status: 'pending' },
        { node: '提交初稿', status: 'pending' },
        { node: '修改完善', status: 'pending' },
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
    const nextStatus = nextNode ? statusByNode[nextNode] : 'completed'

    orders[idx] = {
      ...orders[idx],
      status: nextStatus,
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
    const currentUser = getItem<{ id?: string; phone?: string } | null>(storeKeys.currentUser, null)
    const biographer = biographers.find((b) => b.userId === userId)
      || biographers.find((b) => b.phone && b.phone === currentUser?.phone)
    return success({
      // 传记师演示账号已有历史押金，避免首次进入认证页出现空白申请表。
      depositPaid: hasPaidDeposit(userId) || Boolean(biographer?.deposit),
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
    if (!biographer) return notFound('当前账号尚未绑定传记师资料，请从登录页选择传记师端演示账号')

    let orders = getItem<BiographerOrder[]>(storeKeys.biographerOrders, []).filter(
      (o) => o.biographerId === biographer.id
    )

    // 演示环境：为每位传记师幂等补齐演示订单；旧版含「支付定金/支付尾款」节点的演示订单直接替换为新流程版本
    const dayMs = 24 * 60 * 60 * 1000
    const doneNode = (node: string): BiographerOrder['progress'][number] => ({ node, status: 'done', time: new Date().toISOString() })
    const pendingNode = (node: string): BiographerOrder['progress'][number] => ({ node, status: 'pending' })
    const buildProgress = (doneCount: number) =>
      ['预约采访', '提交初稿', '修改完善', '交付定稿'].map((node, i) => (i < doneCount ? doneNode(node) : pendingNode(node)))
    const demoOrders: BiographerOrder[] = [
      {
        id: generateId(), userId: 'u_demo_001', customerName: '张先生',
        deadline: new Date(Date.now() + 4 * dayMs).toISOString(),
        remark: '希望重点记录父亲的创业经历和家庭教育。',
        orderId: 'ord_demo_001', biographerId: biographer.id, serviceId: 'svc_001',
        serviceName: '家族传记标准版', amount: 2999, status: 'interview_scheduled',
        schedule: { time: new Date(Date.now() + dayMs).toLocaleString('zh-CN', { hour12: false }), address: '杭州市西湖区某某小区' },
        progress: buildProgress(1),
        createdAt: new Date(Date.now() - 2 * dayMs).toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        id: generateId(), userId: 'u_demo_002', customerName: '王女士',
        deadline: new Date(Date.now() + 8 * dayMs).toISOString(),
        remark: '初稿希望保留口述中的原有语气。',
        orderId: 'ord_demo_002', biographerId: biographer.id, serviceId: 'svc_002',
        serviceName: '个人回忆录长篇版', amount: 5999, status: 'modifying',
        schedule: { time: new Date(Date.now() - 5 * dayMs).toLocaleString('zh-CN', { hour12: false }), address: '线上视频采访' },
        progress: buildProgress(2),
        createdAt: new Date(Date.now() - 10 * dayMs).toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        id: generateId(), userId: 'u_demo_003', customerName: '陈先生',
        deadline: new Date(Date.now() - 10 * dayMs).toISOString(),
        remark: '项目已完成，客户已确认交付。',
        orderId: 'ord_demo_003', biographerId: biographer.id, serviceId: 'svc_003',
        serviceName: '企业家传记', amount: 9999, status: 'completed',
        schedule: { time: new Date(Date.now() - 20 * dayMs).toLocaleString('zh-CN', { hour12: false }), address: '北京市朝阳区（客户提供资料）' },
        progress: buildProgress(4),
        createdAt: new Date(Date.now() - 30 * dayMs).toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        id: generateId(), userId: 'u_demo_004', customerName: '赵女士',
        deadline: new Date(Date.now() + 6 * dayMs).toISOString(),
        remark: '刚完成下单，等待确认采访时间。',
        orderId: 'ord_demo_004', biographerId: biographer.id, serviceId: 'svc_001',
        serviceName: '基础采访套餐', amount: 1999, status: 'pending_schedule',
        progress: buildProgress(0),
        createdAt: new Date(Date.now() - dayMs).toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        id: generateId(), userId: 'u_demo_006', customerName: '孙女士',
        deadline: new Date(Date.now() + 3 * dayMs).toISOString(),
        remark: '终稿已发送，等待客户确认后交付。',
        orderId: 'ord_demo_006', biographerId: biographer.id, serviceId: 'svc_002',
        serviceName: '深度定制套餐', amount: 5999, status: 'final_submitted',
        schedule: { time: new Date(Date.now() - 12 * dayMs).toLocaleString('zh-CN', { hour12: false }), address: '线上视频采访' },
        progress: buildProgress(3),
        createdAt: new Date(Date.now() - 18 * dayMs).toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        id: generateId(), userId: 'u_demo_007', customerName: '周先生',
        deadline: new Date(Date.now() - 2 * dayMs).toISOString(),
        remark: '客户提出两处文字修改，已进入售后跟进。',
        orderId: 'ord_demo_007', biographerId: biographer.id, serviceId: 'svc_002',
        serviceName: '深度定制套餐', amount: 5999, status: 'after_sales',
        schedule: { time: new Date(Date.now() - 26 * dayMs).toLocaleString('zh-CN', { hour12: false }), address: '杭州市西湖区' },
        progress: buildProgress(4),
        createdAt: new Date(Date.now() - 40 * dayMs).toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        id: generateId(), userId: 'u_demo_008', customerName: '吴女士',
        deadline: new Date(Date.now() + 6 * dayMs).toISOString(),
        remark: '初稿已收到，正在按客户意见修改完善。',
        orderId: 'ord_demo_008', biographerId: biographer.id, serviceId: 'svc_001',
        serviceName: '基础采访套餐', amount: 1999, status: 'draft_submitted',
        schedule: { time: new Date(Date.now() - 6 * dayMs).toLocaleString('zh-CN', { hour12: false }), address: '线上视频采访' },
        progress: buildProgress(2),
        createdAt: new Date(Date.now() - 8 * dayMs).toISOString(), updatedAt: new Date().toISOString(),
      },
    ]
    const allOrders = getItem<BiographerOrder[]>(storeKeys.biographerOrders, [])
    // 清掉旧流程（含定金/尾款节点）的演示订单
    const cleaned = allOrders.filter(
      (o) => !(String(o.orderId || '').startsWith('ord_demo_') && o.progress.some((p) => p.node === '支付定金' || p.node === '支付尾款'))
    )
    const existingIds = new Set(cleaned.map((order) => order.orderId))
    const missingDemoOrders = demoOrders.filter((order) => !existingIds.has(order.orderId))
    if (missingDemoOrders.length > 0 || cleaned.length !== allOrders.length) {
      cleaned.push(...missingDemoOrders)
      setItem(storeKeys.biographerOrders, cleaned)
      orders = cleaned.filter((o) => o.biographerId === biographer.id)
    }

    return success(orders)
  }),

  // 传记师提交主页内容审核：新内容先进入草稿，不覆盖线上主页
  http.put('/api/biographer/me', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as Partial<Biographer>
    const biographers = ensureBiographers()
    const currentUser = getItem<{ id?: string; phone?: string } | null>(storeKeys.currentUser, null)
    const idx = biographers.findIndex((b) => b.userId === currentUser?.id || (b.phone && b.phone === currentUser?.phone))
    if (idx < 0) return notFound('您还不是传记师')
    if (biographers[idx].status !== 'approved') return fail('请先通过入驻审核')
    const source = { ...biographers[idx], ...body }
    const draft = {
      name: source.name, phone: source.phone, email: source.email, avatar: source.avatar, city: source.city, intro: source.intro,
      title: source.title, specialties: source.specialties, experience: source.experience, serviceAreas: source.serviceAreas,
      education: source.education, certificates: source.certificates, tags: source.tags, services: source.services, cases: source.cases,
    }
    biographers[idx] = {
      ...biographers[idx], profileDraft: draft, profileReviewStatus: 'pending',
      profileRejectReason: undefined, profileSubmittedAt: new Date().toISOString(),
      profileRevision: (biographers[idx].profileRevision || 0) + 1, updatedAt: new Date().toISOString(),
    }
    saveBiographers(biographers)
    return success(biographers[idx], '主页已提交平台审核')
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

  // 更新传记师（后台维护账号/运营字段；主页内容不应通过此接口直接发布）
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

  // 审核主页内容（与入驻审核独立）
  http.patch('/api/biographers/:id/profile-review', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { action, reason } = (await request.json()) as { action?: 'approve' | 'reject'; reason?: string }
    if (action !== 'approve' && action !== 'reject') return fail('参数错误')
    const biographers = ensureBiographers()
    const idx = biographers.findIndex((b) => b.id === params.id)
    if (idx < 0) return notFound('传记师不存在')
    const item = biographers[idx]
    if (item.profileReviewStatus !== 'pending' || !item.profileDraft) return fail('该主页不在待审核状态')
    if (action === 'approve') {
      biographers[idx] = { ...item, ...item.profileDraft, publishedProfile: item.profileDraft, profileDraft: undefined, profileReviewStatus: 'approved', profileRejectReason: undefined, profileReviewedAt: new Date().toISOString(), profileReviewedBy: userId, updatedAt: new Date().toISOString() }
    } else {
      biographers[idx] = { ...item, profileReviewStatus: 'rejected', profileRejectReason: reason?.trim() || '主页内容不符合平台规范，请修改后重新提交。', profileReviewedAt: new Date().toISOString(), profileReviewedBy: userId, updatedAt: new Date().toISOString() }
    }
    saveBiographers(biographers)
    return success(biographers[idx], action === 'approve' ? '主页审核已通过' : '主页审核已驳回')
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
