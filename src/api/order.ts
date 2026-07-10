import { api } from './client'
import type { Order, OrderStatus } from '../mocks/types'

export type AdminOrder = Order & { userName?: string; userPhone?: string }

export const orderApi = {
  list: () => api.get<Order[]>('/api/orders'),
  get: (id: string) => api.get<Order>(`/api/orders/${id}`),
  create: (data: Partial<Order>) => api.post<Order>('/api/orders', data),
  updateStatus: (id: string, status: OrderStatus) => api.put<Order>(`/api/orders/${id}/status`, { status }),

  // 管理后台
  adminList: () => api.get<AdminOrder[]>('/api/admin/orders'),
  adminUpdateStatus: (id: string, status: OrderStatus) => api.put<AdminOrder>(`/api/admin/orders/${id}/status`, { status }),
}
