import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import { defaultBiographers, defaultBiographerSettlements } from '../data/seed'
import type { Biographer, BiographerSettlement } from '../types'

function getCurrentBiographerId(): string | null {
  const currentUser = getItem<{ id?: string; phone?: string } | null>(storeKeys.currentUser, null)
  const stored = getItem<Biographer[]>(storeKeys.biographers, [])
  const biographers = stored.length > 0 ? stored : defaultBiographers
  // 演示环境兜底：匹配不到传记师时回退到演示传记师 bio_001
  const match = biographers.find((b) => b.userId === currentUser?.id || b.phone === currentUser?.phone)
    || biographers.find((b) => b.id === 'bio_001')
  if (stored.length === 0) setItem(storeKeys.biographers, defaultBiographers)
  return match?.id || null
}

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

function ensureSettlements(): BiographerSettlement[] {
  const stored = getItem<BiographerSettlement[]>(storeKeys.biographerSettlements, [])
  const byId = new Map(stored.map((item) => [item.biographerId, item]))
  let changed = false
  for (const seed of defaultBiographerSettlements) {
    const current = byId.get(seed.biographerId)
    if (!current) {
      byId.set(seed.biographerId, seed)
      changed = true
      continue
    }
    const merged = {
      ...current,
      incomes: current.incomes?.length ? current.incomes : seed.incomes,
      withdrawals: current.withdrawals || seed.withdrawals,
      penalties: current.penalties || seed.penalties,
    }
    if (merged.incomes !== current.incomes || merged.withdrawals !== current.withdrawals || merged.penalties !== current.penalties) {
      byId.set(seed.biographerId, merged)
      changed = true
    }
  }
  const result = Array.from(byId.values())
  if (changed) setItem(storeKeys.biographerSettlements, result)
  return result
}

export const biographerEarningsHandlers: HttpHandler[] = [
  // 结算总览仅返回当前登录传记师的数据
  http.get('/api/biographer/earnings', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const currentBiographerId = getCurrentBiographerId()
    if (!currentBiographerId) return notFound('当前账号尚未绑定传记师资料')
    const url = new URL(request.url)
    const requestedId = url.searchParams.get('biographerId') || currentBiographerId
    if (requestedId !== currentBiographerId) return unauthorized()
    const settlement = ensureSettlements().find((s) => s.biographerId === currentBiographerId)
    if (!settlement) return notFound('结算信息不存在')
    return success(settlement)
  }),

  // 提现申请
  http.post('/api/biographer/earnings/withdraw', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { amount, biographerId } = (await request.json()) as { amount?: number; biographerId?: string }
    if (!amount || amount <= 0) return fail('提现金额无效')
    const currentBiographerId = getCurrentBiographerId()
    if (!currentBiographerId) return notFound('当前账号尚未绑定传记师资料')
    if (biographerId && biographerId !== currentBiographerId) return unauthorized()
    const settlements = ensureSettlements()
    const settlement = settlements.find((s) => s.biographerId === currentBiographerId)
    if (!settlement) return notFound('结算信息不存在')
    if (amount > settlement.availableAmount) return fail('提现金额超过可结算余额')
    settlement.availableAmount -= amount
    settlement.withdrawals.unshift({
      id: generateId(),
      amount,
      status: 'pending',
      appliedAt: new Date().toISOString(),
    })
    setItem(storeKeys.biographerSettlements, settlements)
    return success(settlement, '提现申请已提交')
  }),
]
