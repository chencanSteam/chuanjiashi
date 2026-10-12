import { api } from './client'
import type { Order, OrderStatus, RefundRequest } from '../mocks/types'

export type AdminOrder = Order & { userName?: string; userPhone?: string }

export const orderApi = {
  list: () => api.get<Order[]>('/api/orders'),
  get: (id: string) => api.get<Order>(`/api/orders/${id}`),
  create: (data: Partial<Order>) => api.post<Order>('/api/orders', data),
  updateStatus: (id: string, status: OrderStatus) => api.put<Order>(`/api/orders/${id}/status`, { status }),

  // 管理后台
  adminList: () => api.get<AdminOrder[]>('/api/admin/orders'),
  refund: (id: string, data: RefundRequest) => api.post<Order>(`/api/orders/${id}/refund`, data),
}
