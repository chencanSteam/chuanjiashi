import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import { partnerTypeConfig } from '../../data/partnerData'
import type { Partner, PartnerApplication, PartnerCustomer } from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function ensureUniqueInviteCode(existing: Partner[]): string {
  const codes = new Set(existing.map((p) => p.inviteCode))
  let code = generateInviteCode()
  while (codes.has(code)) {
    code = generateInviteCode()
  }
  return code
}

export function findPartnerByUserId(userId: string): Partner | undefined {
  return getItem<Partner[]>(storeKeys.partners, []).find((p) => p.userId === userId)
}

export function findPartnerById(id: string): Partner | undefined {
  return getItem<Partner[]>(storeKeys.partners, []).find((p) => p.id === id)
}

export function findPartnerByInviteCode(code: string): Partner | undefined {
  return getItem<Partner[]>(storeKeys.partners, []).find((p) => p.inviteCode === code)
}

export function savePartner(partner: Partner): void {
  const partners = getItem<Partner[]>(storeKeys.partners, [])
  const idx = partners.findIndex((p) => p.id === partner.id)
  if (idx >= 0) partners[idx] = partner
  else partners.push(partner)
  setItem(storeKeys.partners, partners)
}

export const partnerHandlers: HttpHandler[] = [
  // 当前合伙人信息
  http.get('/api/partner/me', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    let partner = findPartnerByUserId(userId)
    if (!partner) {
      const currentUser = getItem<{ nickname?: string; phone?: string } | null>(storeKeys.currentUser, null)
      const partners = getItem<Partner[]>(storeKeys.partners, [])
      const type = 'inviter'
      partner = {
        id: generateId(),
        userId,
        type,
        name: currentUser?.nickname || '演示合伙人',
        phone: currentUser?.phone || '13800138000',
        inviteCode: ensureUniqueInviteCode(partners),
        commissionRate: partnerTypeConfig[type].rate,
        balance: 3280,
        totalEarnings: 12800,
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      savePartner(partner)
    }
    return success(partner)
  }),

  // 申请成为合伙人
  http.post('/api/partner/apply', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as Partial<PartnerApplication>
    if (!body.name || !body.phone) return fail('请填写姓名和手机号')

    const applications = getItem<PartnerApplication[]>(storeKeys.partnerApplications, [])
    const pending = applications.find((a) => a.userId === userId && a.status === 'pending')
    if (pending) return fail('您已有待审核的申请')

    const existingPartner = findPartnerByUserId(userId)
    if (existingPartner) return fail('您已经是合伙人')

    const application: PartnerApplication = {
      id: generateId(),
      userId,
      name: body.name,
      phone: body.phone,
      email: body.email,
      type: body.type || 'inviter',
      regionCode: body.regionCode,
      regionName: body.regionName,
      reason: body.reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    applications.push(application)
    setItem(storeKeys.partnerApplications, applications)

    // mock 环境下自动审核通过，方便演示
    const partners = getItem<Partner[]>(storeKeys.partners, [])
    const partner: Partner = {
      id: generateId(),
      userId,
      type: application.type,
      name: application.name,
      phone: application.phone,
      email: application.email,
      regionCode: application.regionCode,
      regionName: application.regionName,
      inviteCode: ensureUniqueInviteCode(partners),
      commissionRate: partnerTypeConfig[application.type].rate,
      balance: 0,
      totalEarnings: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    savePartner(partner)

    application.status = 'approved'
    application.processedAt = new Date().toISOString()
    application.processorId = 'system'
    setItem(storeKeys.partnerApplications, applications)

    return success({ partner, application }, '申请已提交并通过审核')
  }),

  // 客户列表
  http.get('/api/partner/customers', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    let partner = findPartnerByUserId(userId)
    if (!partner) return unauthorized('您还不是合伙人')
    let customers = getItem<PartnerCustomer[]>(storeKeys.partnerCustomers, [])
      .filter((c) => c.partnerId === partner.id)
    if (customers.length === 0) {
      const demoCustomers: PartnerCustomer[] = [
        { id: generateId(), partnerId: partner.id, userId: 'u_cus_001', userName: '张先生', userPhone: '138****0001', bindType: 'invite_code', hasPaid: true, totalOrderAmount: 599, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
        { id: generateId(), partnerId: partner.id, userId: 'u_cus_002', userName: '李女士', userPhone: '139****0002', bindType: 'invite_code', hasPaid: true, totalOrderAmount: 299, createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
        { id: generateId(), partnerId: partner.id, userId: 'u_cus_003', userName: '王先生', userPhone: '137****0003', bindType: 'manual', hasPaid: false, totalOrderAmount: 0, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: generateId(), partnerId: partner.id, userId: 'u_cus_004', userName: '陈女士', userPhone: '136****0004', bindType: 'invite_code', hasPaid: true, totalOrderAmount: 999, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      ]
      const allCustomers = getItem<PartnerCustomer[]>(storeKeys.partnerCustomers, [])
      allCustomers.push(...demoCustomers)
      setItem(storeKeys.partnerCustomers, allCustomers)
      customers = demoCustomers
    }
    return success(customers)
  }),

  // 我的客户：绑定新用户（通过邀请码注册时调用）
  http.post('/api/partner/customers', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const partner = findPartnerByUserId(userId)
    if (!partner) return unauthorized('您还不是合伙人')
    const body = (await request.json()) as Partial<PartnerCustomer>
    if (!body.userId) return fail('参数错误')

    const customers = getItem<PartnerCustomer[]>(storeKeys.partnerCustomers, [])
    if (customers.find((c) => c.userId === body.userId && c.partnerId === partner.id)) {
      return fail('该用户已绑定')
    }
    const customer: PartnerCustomer = {
      id: generateId(),
      partnerId: partner.id,
      userId: body.userId,
      userName: body.userName,
      userPhone: body.userPhone,
      bindType: body.bindType || 'manual',
      hasPaid: false,
      totalOrderAmount: 0,
      createdAt: new Date().toISOString(),
    }
    customers.push(customer)
    setItem(storeKeys.partnerCustomers, customers)
    return success(customer)
  }),

  // 申请列表（自己查看）
  http.get('/api/partner/applications', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const applications = getItem<PartnerApplication[]>(storeKeys.partnerApplications, [])
      .filter((a) => a.userId === userId)
    return success(applications)
  }),

  // ===== 管理后台接口 =====

  // 所有申请列表
  http.get('/api/partner/applications/all', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const applications = getItem<PartnerApplication[]>(storeKeys.partnerApplications, [])
    return success(applications)
  }),

  // 审核申请
  http.post('/api/partner/applications/:id/process', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { status } = (await request.json()) as { status?: PartnerApplication['status'] }
    if (!status || !['approved', 'rejected'].includes(status)) return fail('状态错误')

    const applications = getItem<PartnerApplication[]>(storeKeys.partnerApplications, [])
    const app = applications.find((a) => a.id === params.id)
    if (!app) return notFound('申请不存在')

    app.status = status
    app.processedAt = new Date().toISOString()
    app.processorId = userId

    if (status === 'approved' && !findPartnerByUserId(app.userId)) {
      const partners = getItem<Partner[]>(storeKeys.partners, [])
      const partner: Partner = {
        id: generateId(),
        userId: app.userId,
        type: app.type,
        name: app.name,
        phone: app.phone,
        email: app.email,
        regionCode: app.regionCode,
        regionName: app.regionName,
        inviteCode: ensureUniqueInviteCode(partners),
        commissionRate: partnerTypeConfig[app.type].rate,
        balance: 0,
        totalEarnings: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      savePartner(partner)
    }

    setItem(storeKeys.partnerApplications, applications)
    return success(app)
  }),

  // 所有合伙人
  http.get('/api/partners', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const partners = getItem<Partner[]>(storeKeys.partners, [])
    return success(partners)
  }),

  // 创建合伙人
  http.post('/api/partners', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as Partial<Partner>
    if (!body.name || !body.phone) return fail('请填写姓名和手机号')

    const partners = getItem<Partner[]>(storeKeys.partners, [])
    const partner: Partner = {
      id: generateId(),
      userId: body.userId || generateId(),
      type: body.type || 'inviter',
      name: body.name,
      phone: body.phone,
      email: body.email,
      regionCode: body.regionCode,
      regionName: body.regionName,
      parentId: body.parentId,
      inviteCode: ensureUniqueInviteCode(partners),
      commissionRate: body.commissionRate ?? 0.2,
      balance: body.balance ?? 0,
      totalEarnings: body.totalEarnings ?? 0,
      status: body.status || 'active',
      createdAt: new Date().toISOString(),
    }
    savePartner(partner)
    return success(partner)
  }),

  // 更新合伙人
  http.put('/api/partners/:id', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as Partial<Partner>
    const partners = getItem<Partner[]>(storeKeys.partners, [])
    const idx = partners.findIndex((p) => p.id === params.id)
    if (idx < 0) return notFound('合伙人不存在')
    partners[idx] = { ...partners[idx], ...body, id: partners[idx].id }
    setItem(storeKeys.partners, partners)
    return success(partners[idx])
  }),

  // 删除合伙人
  http.delete('/api/partners/:id', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const partners = getItem<Partner[]>(storeKeys.partners, [])
    const next = partners.filter((p) => p.id !== params.id)
    setItem(storeKeys.partners, next)
    return success(null, '删除成功')
  }),

  // 所有客户（管理后台）
  http.get('/api/partner/customers/all', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const customers = getItem<PartnerCustomer[]>(storeKeys.partnerCustomers, [])
    return success(customers)
  }),

  // 手动绑定客户
  http.post('/api/partner/customers/admin/bind', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as Partial<PartnerCustomer>
    if (!body.partnerId || !body.userId) return fail('请选择合伙人并填写客户ID')

    const partner = findPartnerById(body.partnerId)
    if (!partner) return notFound('合伙人不存在')

    const customers = getItem<PartnerCustomer[]>(storeKeys.partnerCustomers, [])
    if (customers.find((c) => c.userId === body.userId && c.partnerId === body.partnerId)) {
      return fail('该客户已归属此合伙人')
    }
    const customer: PartnerCustomer = {
      id: generateId(),
      partnerId: body.partnerId,
      userId: body.userId,
      userName: body.userName,
      userPhone: body.userPhone,
      bindType: body.bindType || 'manual',
      hasPaid: false,
      totalOrderAmount: 0,
      createdAt: new Date().toISOString(),
    }
    customers.push(customer)
    setItem(storeKeys.partnerCustomers, customers)
    return success(customer)
  }),
]
