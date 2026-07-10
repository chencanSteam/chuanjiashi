import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import { findPartnerByUserId, savePartner } from './partner'
import { partnerTypeConfig } from '../../data/partnerData'
import type { CommissionRecord, WithdrawalRecord, Order, User } from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

function saveCommission(record: CommissionRecord): void {
  const records = getItem<CommissionRecord[]>(storeKeys.commissions, [])
  records.push(record)
  setItem(storeKeys.commissions, records)
}

export function generateCommission(order: Order, inviterId: string): CommissionRecord | null {
  const users = getItem<{ id: string }[]>(storeKeys.users, [])
  const inviter = users.find((u) => u.id === inviterId)
  if (!inviter) return null
  const partner = findPartnerByUserId(inviterId)
  const rate = partner ? partnerTypeConfig[partner.type].rate : 0.15
  const commission: CommissionRecord = {
    id: generateId(),
    userId: inviterId,
    fromUserId: order.userId,
    orderId: order.id,
    orderType: order.type,
    amount: order.amount,
    rate,
    commission: Math.round(order.amount * rate * 100) / 100,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  saveCommission(commission)

  // 更新合伙人累计收益
  if (partner) {
    partner.totalEarnings += commission.commission
    savePartner(partner)
  }

  return commission
}

function getPartnerName(userId: string): string {
  const partner = findPartnerByUserId(userId)
  if (partner) return partner.name
  const users = getItem<{ id: string; nickname?: string; phone?: string }[]>(storeKeys.users, [])
  const user = users.find((u) => u.id === userId)
  return user?.nickname || user?.phone || userId
}

export const commissionHandlers: HttpHandler[] = [
  http.get('/api/commissions', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const records = getItem<CommissionRecord[]>(storeKeys.commissions, []).filter((r) => r.userId === userId)
    return success(records)
  }),

  http.get('/api/commissions/summary', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    let records = getItem<CommissionRecord[]>(storeKeys.commissions, []).filter((r) => r.userId === userId)
    if (records.length === 0) {
      records = [
        { id: generateId(), userId, fromUserId: 'u_cus_001', orderId: 'ord_001', orderType: 'biography', amount: 599, rate: 0.2, commission: 119.8, status: 'settled', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
        { id: generateId(), userId, fromUserId: 'u_cus_002', orderId: 'ord_002', orderType: 'digital_person', amount: 299, rate: 0.2, commission: 59.8, status: 'settled', createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
        { id: generateId(), userId, fromUserId: 'u_cus_004', orderId: 'ord_003', orderType: 'biography', amount: 999, rate: 0.2, commission: 199.8, status: 'pending', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      ]
      const all = getItem<CommissionRecord[]>(storeKeys.commissions, [])
      all.push(...records)
      setItem(storeKeys.commissions, all)
      const partner = findPartnerByUserId(userId)
      if (partner) {
        partner.totalEarnings = records.reduce((s, r) => s + r.commission, 0)
        partner.balance = partner.totalEarnings * 0.8
        savePartner(partner)
      }
    }
    const settled = records.filter((r) => r.status === 'settled').reduce((s, r) => s + r.commission, 0)
    const pending = records.filter((r) => r.status === 'pending').reduce((s, r) => s + r.commission, 0)
    const frozen = records.filter((r) => r.status === 'frozen').reduce((s, r) => s + r.commission, 0)
    const users = getItem<User[]>(storeKeys.users, [])
    const inviteCount = users.filter((u) => u.invitedBy === userId).length || 12
    return success({ total: settled + pending + frozen, settled, pending, frozen, inviteCount })
  }),

  // 管理后台：所有佣金流水
  http.get('/api/commissions/all', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const records = getItem<CommissionRecord[]>(storeKeys.commissions, [])
    return success(records)
  }),

  http.post('/api/withdrawals', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { amount } = (await request.json()) as { amount?: number }
    if (!amount || amount <= 0) return fail('提现金额错误')
    const records = getItem<CommissionRecord[]>(storeKeys.commissions, []).filter((r) => r.userId === userId)
    const settled = records.filter((r) => r.status === 'settled').reduce((s, r) => s + r.commission, 0)
    if (amount > settled) return fail('可提现金额不足')
    const withdrawal: WithdrawalRecord = {
      id: generateId(),
      userId,
      amount,
      status: 'pending',
      appliedAt: new Date().toISOString(),
      partnerName: getPartnerName(userId),
    }
    const withdrawals = getItem<WithdrawalRecord[]>(storeKeys.withdrawals, [])
    withdrawals.push(withdrawal)
    setItem(storeKeys.withdrawals, withdrawals)
    return success(withdrawal, '提现申请已提交')
  }),

  http.get('/api/withdrawals', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    let withdrawals = getItem<WithdrawalRecord[]>(storeKeys.withdrawals, []).filter((w) => w.userId === userId)
    if (withdrawals.length === 0) {
      withdrawals = [
        { id: generateId(), userId, amount: 1000, status: 'paid', appliedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), paidAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), partnerName: '演示合伙人' },
        { id: generateId(), userId, amount: 500, status: 'pending', appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), partnerName: '演示合伙人' },
      ]
      const all = getItem<WithdrawalRecord[]>(storeKeys.withdrawals, [])
      all.push(...withdrawals)
      setItem(storeKeys.withdrawals, all)
    }
    return success(withdrawals)
  }),

  // 管理后台：所有提现记录
  http.get('/api/withdrawals/all', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const withdrawals = getItem<WithdrawalRecord[]>(storeKeys.withdrawals, [])
    return success(withdrawals)
  }),

  // 管理后台：处理提现
  http.post('/api/withdrawals/:id/process', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { status } = (await request.json()) as { status?: WithdrawalRecord['status'] }
    if (!status || !['approved', 'rejected', 'paid'].includes(status)) return fail('状态错误')

    const withdrawals = getItem<WithdrawalRecord[]>(storeKeys.withdrawals, [])
    const idx = withdrawals.findIndex((w) => w.id === params.id)
    if (idx < 0) return fail('提现记录不存在')

    const withdrawal = withdrawals[idx]
    withdrawal.status = status
    if (status === 'paid') {
      withdrawal.paidAt = new Date().toISOString()
      // 扣减合伙人可提现余额
      const partner = findPartnerByUserId(withdrawal.userId)
      if (partner) {
        partner.balance = Math.max(0, partner.balance - withdrawal.amount)
        savePartner(partner)
      }
    }

    setItem(storeKeys.withdrawals, withdrawals)
    return success(withdrawal)
  }),
]
