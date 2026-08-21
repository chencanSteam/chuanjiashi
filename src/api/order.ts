import { api } from './client'
import type { Order, OrderStatus, Deliverable, OrderLogistics, OrderReview, RefundRequest, ReviewStatus } from '../mocks/types'

export type AdminOrder = Order & { userName?: string; userPhone?: string }

export const orderApi = {
  list: () => api.get<Order[]>('/api/orders'),
  get: (id: string) => api.get<Order>(`/api/orders/${id}`),
  create: (data: Partial<Order>) => api.post<Order>('/api/orders', data),
  updateStatus: (id: string, status: OrderStatus) => api.put<Order>(`/api/orders/${id}/status`, { status }),

  // 管理后台
  adminList: () => api.get<AdminOrder[]>('/api/admin/orders'),
  adminCreate: (data: { userId: string; type: Order['type']; productName?: string; amount: number; remark?: string }) =>
    api.post<AdminOrder>('/api/admin/orders', data),
  adminUpdateStatus: (id: string, status: OrderStatus) => api.put<AdminOrder>(`/api/admin/orders/${id}/status`, { status }),
  adminDeliver: (id: string, logistics: OrderLogistics) => api.put<AdminOrder>(`/api/admin/orders/${id}/deliver`, { logistics }),
  adminAddDeliverable: (id: string, deliverable: Deliverable) => api.put<AdminOrder>(`/api/admin/orders/${id}/deliverable`, { deliverable }),
  adminAuditReview: (id: string, status: ReviewStatus) => api.put<AdminOrder>(`/api/admin/orders/${id}/review`, { status }),
  adminApproveRefund: (id: string) => api.post<AdminOrder>(`/api/admin/orders/${id}/refund/approve`),
  adminRejectRefund: (id: string, rejectionReason: string) => api.post<AdminOrder>(`/api/admin/orders/${id}/refund/reject`, { rejectionReason }),
  review: (id: string, review: OrderReview) => api.post<Order>(`/api/orders/${id}/review`, review),
  refund: (id: string, data: RefundRequest) => api.post<Order>(`/api/orders/${id}/refund`, data),
}
