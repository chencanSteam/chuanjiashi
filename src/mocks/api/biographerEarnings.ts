import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import { defaultBiographerSettlements, defaultBiographerDeposits, defaultBiographerPenalties } from '../data/seed'
import type { Biographer, BiographerSettlement, BiographerDepositRecord, BiographerPenaltyRecord } from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

function ensureSettlements(): BiographerSettlement[] {
  const settlements = getItem<BiographerSettlement[]>(storeKeys.biographerSettlements, [])
  if (settlements.length === 0) {
    setItem(storeKeys.biographerSettlements, defaultBiographerSettlements)
    return defaultBiographerSettlements
  }
  return settlements
}

function ensureDeposits(): BiographerDepositRecord[] {
  const deposits = getItem<BiographerDepositRecord[]>(storeKeys.biographerDeposits, [])
  if (deposits.length === 0) {
    setItem(storeKeys.biographerDeposits, defaultBiographerDeposits)
    return defaultBiographerDeposits
  }
  return deposits
}

function ensurePenalties(): BiographerPenaltyRecord[] {
  const penalties = getItem<BiographerPenaltyRecord[]>(storeKeys.biographerPenalties, [])
  if (penalties.length === 0) {
    setItem(storeKeys.biographerPenalties, defaultBiographerPenalties)
    return defaultBiographerPenalties
  }
  return penalties
}

export const biographerEarningsHandlers: HttpHandler[] = [
  // 结算总览（默认返回第一位传记师）
  http.get('/api/biographer/earnings', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const url = new URL(request.url)
    const biographerId = url.searchParams.get('biographerId') || ''
    const settlements = ensureSettlements()
    const settlement = biographerId
      ? settlements.find((s) => s.biographerId === biographerId)
      : settlements[0]
    if (!settlement) return notFound('结算信息不存在')
    return success(settlement)
  }),

  // 提现申请
  http.post('/api/biographer/earnings/withdraw', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { amount, biographerId } = (await request.json()) as { amount?: number; biographerId?: string }
    if (!amount || amount <= 0) return fail('提现金额无效')
    const settlements = ensureSettlements()
    const settlement = biographerId
      ? settlements.find((s) => s.biographerId === biographerId)
      : settlements[0]
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

  // ===== 管理后台：押金管理 =====

  // 押金记录列表
  http.get('/api/admin/biographer/deposits', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    return success(ensureDeposits())
  }),

  // 退还押金
  http.post('/api/admin/biographer/deposits/:id/refund', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const deposits = ensureDeposits()
    const deposit = deposits.find((d) => d.id === params.id)
    if (!deposit) return notFound('押金记录不存在')
    if (deposit.status !== 'paid') return fail('仅已缴纳的押金可以退还')
    deposit.status = 'refunded'
    setItem(storeKeys.biographerDeposits, deposits)
    return success(deposit, '押金已退还')
  }),

  // 扣除押金
  http.post('/api/admin/biographer/deposits/:id/deduct', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const deposits = ensureDeposits()
    const deposit = deposits.find((d) => d.id === params.id)
    if (!deposit) return notFound('押金记录不存在')
    if (deposit.status !== 'paid') return fail('仅已缴纳的押金可以扣除')
    deposit.status = 'deducted'
    setItem(storeKeys.biographerDeposits, deposits)
    return success(deposit, '押金已扣除')
  }),

  // ===== 管理后台：违规处罚 =====

  // 处罚记录列表
  http.get('/api/admin/biographer/penalties', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    return success(ensurePenalties())
  }),

  // 新增处罚（扣款同步扣减传记师可结算金额）
  http.post('/api/admin/biographer/penalties', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as Partial<BiographerPenaltyRecord>
    if (!body.biographerId) return fail('请选择传记师')
    if (!body.violationType?.trim() || !body.measure?.trim()) return fail('请填写违规类型和处罚措施')
    if (!body.reason?.trim()) return fail('请填写处罚原因')
    const amount = Number(body.amount) || 0
    if (amount < 0) return fail('扣款金额无效')

    const biographers = getItem<Biographer[]>(storeKeys.biographers, [])
    const biographer = biographers.find((b) => b.id === body.biographerId)

    const penalties = ensurePenalties()
    const penalty: BiographerPenaltyRecord = {
      id: generateId(),
      biographerId: body.biographerId,
      biographerName: biographer?.name || body.biographerName || '未知传记师',
      violationType: body.violationType.trim(),
      measure: body.measure.trim(),
      amount,
      reason: body.reason.trim(),
      status: 'effective',
      createdAt: new Date().toISOString(),
    }
    penalties.unshift(penalty)
    setItem(storeKeys.biographerPenalties, penalties)

    // 联动写入结算：扣减可结算金额并追加违规扣款记录
    if (amount > 0) {
      const settlements = ensureSettlements()
      const settlement = settlements.find((s) => s.biographerId === body.biographerId)
      if (settlement) {
        settlement.availableAmount = Math.max(0, settlement.availableAmount - amount)
        settlement.penalties.unshift({
          id: penalty.id,
          reason: penalty.reason,
          amount,
          createdAt: penalty.createdAt,
        })
        setItem(storeKeys.biographerSettlements, settlements)
      }
    }

    return success(penalty, '处罚已记录')
  }),
]
