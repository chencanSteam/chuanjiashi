import { api } from './client'
import type { BiographerSettlement } from '../mocks/types'

export const biographerEarningsApi = {
  // 结算总览（不传 biographerId 时返回当前传记师/默认数据）
  overview: (biographerId?: string) =>
    api.get<BiographerSettlement>(`/api/biographer/earnings?${new URLSearchParams(biographerId ? { biographerId } : {}).toString()}`),
  // 提现申请
  withdraw: (amount: number, biographerId?: string) =>
    api.post<BiographerSettlement>('/api/biographer/earnings/withdraw', { amount, biographerId }),
}
