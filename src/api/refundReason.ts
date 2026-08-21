import { api } from './client'
import type { RefundReasonOption } from '../mocks/types'

export const refundReasonApi = {
  list: () => api.get<RefundReasonOption[]>('/api/refund-reasons'),
  adminList: () => api.get<RefundReasonOption[]>('/api/admin/refund-reasons'),
  create: (label: string) => api.post<RefundReasonOption>('/api/admin/refund-reasons', { label }),
  update: (id: string, label: string) => api.put<RefundReasonOption>(`/api/admin/refund-reasons/${id}`, { label }),
  updateStatus: (id: string, enabled: boolean) => api.patch<RefundReasonOption>(`/api/admin/refund-reasons/${id}/status`, { enabled }),
  remove: (id: string) => api.delete<null>(`/api/admin/refund-reasons/${id}`),
  reorder: (ids: string[]) => api.put<RefundReasonOption[]>('/api/admin/refund-reasons/order', { ids }),
}
