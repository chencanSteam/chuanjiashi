import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import { partnerTypeConfig } from '../../data/partnerData'
import { defaultPartnerChannels, defaultPartnerAssessment, defaultGmvLineStats, defaultPartnerLocalOrders, defaultAdminUsers, defaultPartnerFees, defaultPartnerShareConfigs, defaultPartnerRewardConfigs, defaultPartnerAssessments } from '../data/seed'
import type { Partner, PartnerApplication, PartnerCustomer, PartnerChannel, PartnerAssessment, PartnerLocalOrder, AdminUser, PartnerFeeRecord, PartnerShareConfig, PartnerRewardConfig, PartnerAssessmentRecord } from '../types'

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

const DEMO_REGION = {
  regionCode: '330106',
  regionName: '杭州市西湖区',
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

function validateRegionalPartner(partners: Partner[], candidate: Partial<Partner>, currentId?: string): string | null {
  if (candidate.type !== 'province' && candidate.type !== 'city' && candidate.type !== 'district') return null
  if (!candidate.regionCode) return '请选择代理区域'
  if (candidate.commissionRate !== undefined && (!Number.isFinite(candidate.commissionRate) || candidate.commissionRate < 0 || candidate.commissionRate > 1)) {
    return '分成比例需在 0-1 之间'
  }
  const occupied = partners.some((p) => p.id !== currentId && (p.status === 'active' || p.status === 'pending') && p.type === candidate.type && p.regionCode === candidate.regionCode)
  return occupied ? '该区域已有同级合伙人' : null
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
        ...DEMO_REGION,
        inviteCode: ensureUniqueInviteCode(partners),
        commissionRate: partnerTypeConfig[type].rate,
        balance: 3280,
        totalEarnings: 12800,
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      savePartner(partner)
    } else if (!partner.regionCode || !partner.regionName) {
      partner = { ...partner, ...DEMO_REGION }
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
    const validationError = validateRegionalPartner(partners, body)
    if (validationError) return fail(validationError)
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
    const validationError = validateRegionalPartner(partners, { ...partners[idx], ...body }, partners[idx].id)
    if (validationError) return fail(validationError)
    if (body.commissionRate !== undefined && (!Number.isFinite(body.commissionRate) || body.commissionRate < 0 || body.commissionRate > 1)) return fail('分成比例需在 0-1 之间')
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

  // ===== 渠道/考核/GMV/本地数据 =====

  // 渠道列表（按类型/状态过滤）
  http.get('/api/partner/channels', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'all'
    const status = url.searchParams.get('status') || 'all'
    let channels = getItem<PartnerChannel[]>(storeKeys.partnerChannels, [])
    if (channels.length === 0) {
      channels = defaultPartnerChannels
      setItem(storeKeys.partnerChannels, channels)
    }
    if (type !== 'all') channels = channels.filter((c) => c.type === type)
    if (status !== 'all') channels = channels.filter((c) => c.status === status)
    return success(channels)
  }),

  // 新增渠道
  http.post('/api/partner/channels', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as Partial<PartnerChannel>
    if (!body.orgName || !body.type) return fail('请填写机构名和渠道类型')
    const partner = findPartnerByUserId(userId)
    const channels = getItem<PartnerChannel[]>(storeKeys.partnerChannels, [])
    const channel: PartnerChannel = {
      id: generateId(),
      partnerId: body.partnerId || partner?.id || 'partner_demo',
      type: body.type,
      orgName: body.orgName,
      contact: body.contact || '',
      phone: body.phone || '',
      status: 'active',
      cooperatedAt: new Date().toISOString(),
    }
    channels.push(channel)
    setItem(storeKeys.partnerChannels, channels)
    return success(channel, '渠道添加成功')
  }),

  // 年度考核结算数据
  http.get('/api/partner/assessment', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const assessment = getItem<PartnerAssessment | null>(storeKeys.partnerAssessment, null)
    if (assessment) return success(assessment)
    setItem(storeKeys.partnerAssessment, defaultPartnerAssessment)
    return success(defaultPartnerAssessment)
  }),

  // GMV 分业务线统计
  http.get('/api/partner/gmv-stats', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    return success(defaultGmvLineStats)
  }),

  // 本地用户列表
  http.get('/api/partner/local/users', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const users = getItem<AdminUser[]>(storeKeys.adminUsers, [])
    return success(users.length > 0 ? users : defaultAdminUsers)
  }),

  // 本地订单列表
  http.get('/api/partner/local/orders', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    let orders = getItem<PartnerLocalOrder[]>(storeKeys.partnerLocalOrders, [])
    if (orders.length === 0) {
      orders = defaultPartnerLocalOrders
      setItem(storeKeys.partnerLocalOrders, orders)
    }
    return success(orders)
  }),

  // ===== 管理后台：服务商费用/分成/奖励/考核 =====

  // 费用记录列表
  http.get('/api/admin/partner/fees', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    let fees = getItem<PartnerFeeRecord[]>(storeKeys.partnerFees, [])
    if (fees.length === 0) {
      fees = defaultPartnerFees
      setItem(storeKeys.partnerFees, fees)
    }
    return success(fees)
  }),

  // 分成配置列表
  http.get('/api/admin/partner/share-configs', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    let configs = getItem<PartnerShareConfig[]>(storeKeys.partnerShareConfigs, [])
    if (configs.length === 0) {
      configs = defaultPartnerShareConfigs
      setItem(storeKeys.partnerShareConfigs, configs)
    }
    return success(configs)
  }),

  // 更新分成配置
  http.put('/api/admin/partner/share-configs/:id', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as Partial<PartnerShareConfig>
    const configs = getItem<PartnerShareConfig[]>(storeKeys.partnerShareConfigs, defaultPartnerShareConfigs)
    const idx = configs.findIndex((c) => c.id === params.id)
    if (idx < 0) return notFound('分成配置不存在')
    if (body.rate !== undefined && (body.rate < 0 || body.rate > 1)) return fail('分成比例需在 0-1 之间')
    configs[idx] = { ...configs[idx], ...body, id: configs[idx].id }
    setItem(storeKeys.partnerShareConfigs, configs)
    return success(configs[idx], '分成配置已更新')
  }),

  // 奖励配置列表
  http.get('/api/admin/partner/reward-configs', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    let configs = getItem<PartnerRewardConfig[]>(storeKeys.partnerRewardConfigs, [])
    if (configs.length === 0) {
      configs = defaultPartnerRewardConfigs
      setItem(storeKeys.partnerRewardConfigs, configs)
    }
    return success(configs)
  }),

  // 更新奖励配置
  http.put('/api/admin/partner/reward-configs/:id', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as Partial<PartnerRewardConfig>
    const configs = getItem<PartnerRewardConfig[]>(storeKeys.partnerRewardConfigs, defaultPartnerRewardConfigs)
    const idx = configs.findIndex((c) => c.id === params.id)
    if (idx < 0) return notFound('奖励配置不存在')
    if (body.amount !== undefined && body.amount < 0) return fail('奖励金额无效')
    configs[idx] = { ...configs[idx], ...body, id: configs[idx].id }
    setItem(storeKeys.partnerRewardConfigs, configs)
    return success(configs[idx], '奖励配置已更新')
  }),

  // 考核记录列表（管理端视角）
  http.get('/api/admin/partner/assessments', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    let records = getItem<PartnerAssessmentRecord[]>(storeKeys.partnerAssessments, [])
    if (records.length === 0) {
      records = defaultPartnerAssessments
      setItem(storeKeys.partnerAssessments, records)
    }
    return success(records)
  }),
]
