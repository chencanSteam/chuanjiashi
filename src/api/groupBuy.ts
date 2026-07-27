import { api } from './client'
import type { GroupBuyActivity, GroupBuyRecord, GroupBuyRules, Order } from '../mocks/types'

export const groupBuyApi = {
  activity: () => api.get<GroupBuyActivity>('/api/group-buy/activity'),
  records: () => api.get<GroupBuyRecord[]>('/api/group-buy/records'),
  join: (recordId?: string, isLauncher?: boolean) =>
    api.post<{ record: GroupBuyRecord; order: Order }>('/api/group-buy/join', { recordId, isLauncher }),

  // 管理后台
  rules: () => api.get<GroupBuyRules>('/api/group-buy/rules'),
  saveRules: (rules: GroupBuyRules) => api.put<GroupBuyRules>('/api/group-buy/rules', rules),
  confirmRefund: (memberId: string) =>
    api.post<GroupBuyRecord['members'][number]>('/api/group-buy/refunds/confirm', { memberId }),
}
