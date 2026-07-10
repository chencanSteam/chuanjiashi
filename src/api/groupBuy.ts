import { api } from './client'
import type { GroupBuyActivity, GroupBuyRecord, Order } from '../mocks/types'

export const groupBuyApi = {
  activity: () => api.get<GroupBuyActivity>('/api/group-buy/activity'),
  records: () => api.get<GroupBuyRecord[]>('/api/group-buy/records'),
  join: (recordId?: string, isLauncher?: boolean) =>
    api.post<{ record: GroupBuyRecord; order: Order }>('/api/group-buy/join', { recordId, isLauncher }),
}
