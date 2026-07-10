import { api } from './client'
import type { CommissionRecord, WithdrawalRecord } from '../mocks/types'

export const commissionApi = {
  list: () => api.get<CommissionRecord[]>('/api/commissions'),
  summary: () =>
    api.get<{ total: number; settled: number; pending: number; frozen: number; inviteCount: number }>('/api/commissions/summary'),
  withdraw: (amount: number) => api.post<WithdrawalRecord>('/api/withdrawals', { amount }),
  withdrawals: () => api.get<WithdrawalRecord[]>('/api/withdrawals'),

  // 管理后台
  adminList: () => api.get<CommissionRecord[]>('/api/commissions/all'),
  adminWithdrawals: () => api.get<WithdrawalRecord[]>('/api/withdrawals/all'),
  processWithdrawal: (id: string, status: WithdrawalRecord['status']) =>
    api.post<WithdrawalRecord>(`/api/withdrawals/${id}/process`, { status }),
}
