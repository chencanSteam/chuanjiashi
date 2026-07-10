import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import { defaultGroupBuyActivity } from '../data/seed'
import { createOrder, saveOrder, findOrder } from './order'
import type { GroupBuyActivity, GroupBuyRecord, GroupBuyOrder } from '../types'

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

function drawFreeMembers(members: GroupBuyOrder[], count: number): GroupBuyOrder[] {
  const shuffled = [...members].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export const groupBuyHandlers: HttpHandler[] = [
  http.get('/api/group-buy/activity', async () => {
    return success(ensureActivity())
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
      freeMembers.forEach((m) => (m.isFree = true))
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
