import { api } from './client'
import type { BiographerSettlement, BiographerDepositRecord, BiographerPenaltyRecord } from '../mocks/types'

export const biographerEarningsApi = {
  // 结算总览（不传 biographerId 时返回当前传记师/默认数据）
  overview: (biographerId?: string) =>
    api.get<BiographerSettlement>(`/api/biographer/earnings?${new URLSearchParams(biographerId ? { biographerId } : {}).toString()}`),
  // 提现申请
  withdraw: (amount: number, biographerId?: string) =>
    api.post<BiographerSettlement>('/api/biographer/earnings/withdraw', { amount, biographerId }),

  // 管理后台：押金管理
  adminDeposits: () => api.get<BiographerDepositRecord[]>('/api/admin/biographer/deposits'),
  refundDeposit: (id: string) => api.post<BiographerDepositRecord>(`/api/admin/biographer/deposits/${id}/refund`),
  deductDeposit: (id: string) => api.post<BiographerDepositRecord>(`/api/admin/biographer/deposits/${id}/deduct`),

  // 管理后台：违规处罚
  adminPenalties: () => api.get<BiographerPenaltyRecord[]>('/api/admin/biographer/penalties'),
  createPenalty: (data: { biographerId: string; violationType: string; measure: string; amount: number; reason: string }) =>
    api.post<BiographerPenaltyRecord>('/api/admin/biographer/penalties', data),
}
