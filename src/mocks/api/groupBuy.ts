import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import { defaultGroupBuyActivity, defaultGroupBuyRules } from '../data/seed'
import { createOrder, saveOrder, findOrder } from './order'
import type { GroupBuyActivity, GroupBuyRecord, GroupBuyOrder, GroupBuyRules } from '../types'

function getCurrentUser(): { id: string; phone: string } | null {
  return getItem<{ id: string; phone: string } | null>(storeKeys.currentUser, null)
}

function ensureActivity(): GroupBuyActivity {
  const activities = getItem<GroupBuyActivity[]>(storeKeys.groupBuyActivities, [])
  if (activities.length === 0) {
    setItem(storeKeys.groupBuyActivities, [defaultGroupBuyActivity])
    return defaultGroupBuyActivity
  }
  return activities[0]
}

function ensureRules(): GroupBuyRules {
  const rules = getItem<GroupBuyRules | null>(storeKeys.groupBuyRules, null)
  if (rules) return rules
  setItem(storeKeys.groupBuyRules, defaultGroupBuyRules)
  return defaultGroupBuyRules
}

function drawFreeMembers(members: GroupBuyOrder[], count: number): GroupBuyOrder[] {
  const shuffled = [...members].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export const groupBuyHandlers: HttpHandler[] = [
  http.get('/api/group-buy/activity', async () => {
    return success(ensureActivity())
  }),

  // 管理端：读取拼团规则（与当前活动同源）
  http.get('/api/group-buy/rules', async () => {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    return success(ensureRules())
  }),

  // 管理端：保存拼团规则，同步写入当前活动，用户端开团/参团即时生效
  http.put('/api/group-buy/rules', async ({ request }) => {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    const body = (await request.json()) as Partial<GroupBuyRules>
    const rules: GroupBuyRules = { ...ensureRules(), ...body }
    if (rules.firstRoundSize < 2 || rules.laterRoundSize < 2) return fail('成团人数不能小于 2')
    if (rules.durationHours < 1) return fail('拼团时限不能小于 1 小时')
    setItem(storeKeys.groupBuyRules, rules)

    const activity = ensureActivity()
    const nextActivity: GroupBuyActivity = {
      ...activity,
      firstRoundSize: rules.firstRoundSize,
      laterRoundSize: rules.laterRoundSize,
      durationHours: rules.durationHours,
      firstRoundFreeCount: rules.freeEnabled ? rules.firstRoundFreeCount : 0,
      laterRoundFreeCount: rules.freeEnabled ? rules.laterRoundFreeCount : 0,
    }
    setItem(storeKeys.groupBuyActivities, [nextActivity])
    return success(rules, '拼团规则已保存')
  }),

  // 管理端：确认未成团退款（持久化团员退款状态）
  http.post('/api/group-buy/refunds/confirm', async ({ request }) => {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    const { memberId } = (await request.json()) as { memberId?: string }
    if (!memberId) return fail('参数错误')
    const records = getItem<GroupBuyRecord[]>(storeKeys.groupBuyRecords, [])
    const record = records.find((r) => r.members.some((m) => m.id === memberId))
    if (!record) return notFound('团员记录不存在')
    if (record.status !== 'failed') return fail('仅未成团订单可以确认退款')
    const member = record.members.find((m) => m.id === memberId)!
    if (member.refunded) return fail('该团员已退款')
    member.refunded = true
    const order = findOrder(member.orderId)
    if (order) {
      order.status = 'refunded'
      order.updatedAt = new Date().toISOString()
      saveOrder(order)
    }
    setItem(storeKeys.groupBuyRecords, records)
    return success(member, '已确认退款')
  }),

  http.get('/api/group-buy/records', async () => {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    const records = getItem<GroupBuyRecord[]>(storeKeys.groupBuyRecords, [])
    return success(records)
  }),

  http.post('/api/group-buy/join', async ({ request }) => {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    const { recordId, isLauncher } = (await request.json()) as { recordId?: string; isLauncher?: boolean }
    const activity = ensureActivity()

    let record: GroupBuyRecord | undefined
    let records = getItem<GroupBuyRecord[]>(storeKeys.groupBuyRecords, [])

    if (recordId) {
      record = records.find((r) => r.id === recordId)
      if (!record) return notFound('拼团不存在')
      if (record.status !== 'pending') return fail('拼团已结束')
    } else {
      record = {
        id: generateId(),
        activityId: activity.id,
        launcherId: user.id,
        launcherPhone: user.phone,
        currentCount: 0,
        targetCount: activity.firstRoundSize,
        status: 'pending',
        endAt: new Date(Date.now() + activity.durationHours * 60 * 60 * 1000).toISOString(),
        members: [],
        createdAt: new Date().toISOString(),
      }
      records.push(record)
    }

    // 创建订单并支付
    const order = createOrder(user.id, {
      type: 'group_buy',
      productId: activity.id,
      productName: activity.name,
      amount: activity.price,
    })
    order.status = 'paid'
    order.payTime = new Date().toISOString()
    saveOrder(order)

    const member: GroupBuyOrder = {
      id: generateId(),
      activityId: activity.id,
      userId: user.id,
      phone: user.phone,
      orderId: order.id,
      isLauncher: !!isLauncher || record.members.length === 0,
      isFree: false,
      joinedAt: new Date().toISOString(),
    }
    record.members.push(member)
    record.currentCount = record.members.length

    if (record.currentCount >= record.targetCount) {
      record.status = 'success'
      const freeCount = record.targetCount === activity.firstRoundSize
        ? activity.firstRoundFreeCount
        : activity.laterRoundFreeCount
      const freeMembers = drawFreeMembers(record.members, freeCount)
      freeMembers.forEach((m) => {
        m.isFree = true
        m.refunded = true
      })
      // 对免单用户创建退款记录
      freeMembers.forEach((m) => {
        const o = findOrder(m.orderId)
        if (o) {
          o.status = 'refunded'
          o.updatedAt = new Date().toISOString()
          saveOrder(o)
        }
      })
    }

    setItem(storeKeys.groupBuyRecords, records)
    return success({ record, order })
  }),
]
