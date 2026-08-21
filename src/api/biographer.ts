import { api } from './client'
import type { Biographer, BiographerOrder, BiographerReview } from '../mocks/types'

export interface BiographerApplyPayload {
  name: string
  idCard: string
  phone: string
  city: string
  specialties: string[]
}

export interface BiographerApplicationInfo {
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  submittedAt: string
  name: string
  phone: string
  city: string
  specialties: string[]
  reason?: string
}

export interface BiographerApplyStatusResult {
  depositPaid: boolean
  application: BiographerApplicationInfo | null
}

export const biographerApi = {
  list: (city?: string) =>
    api.get<Biographer[]>(`/api/biographers${city ? `?city=${encodeURIComponent(city)}` : ''}`),
  get: (id: string) => api.get<Biographer>(`/api/biographers/${id}`),
  /** 当前用户是否已下单该传记师的套餐（决定能否查看完整联系电话） */
  getContactAccess: (biographerId: string) =>
    api.get<{ unlocked: boolean }>(`/api/biographers/${biographerId}/contact-access`),
  createOrder: (biographerId: string, serviceId: string, payload?: { interviewee?: string; relation?: string; preferredTime?: string; location?: string; remark?: string; contactPhone?: string }) =>
    api.post<{ order: unknown; biographerOrder: BiographerOrder }>('/api/biographer-orders', {
      biographerId,
      serviceId,
      ...payload,
    }),
  orders: () => api.get<BiographerOrder[]>('/api/biographer-orders'),
  getReviews: (biographerId: string) => api.get<BiographerReview[]>(`/api/biographers/${biographerId}/reviews`),
  submitReview: (biographerOrderId: string, data: { rating: number; content: string; tags?: string[] }) =>
    api.post<BiographerReview>(`/api/biographer-orders/${biographerOrderId}/review`, data),
  scheduleInterview: (biographerOrderId: string, schedule: { time: string; address: string }) =>
    api.put<BiographerOrder>(`/api/biographer-orders/${biographerOrderId}/schedule`, schedule),
  updateProgress: (biographerOrderId: string, node: string) =>
    api.put<BiographerOrder>(`/api/biographer-orders/${biographerOrderId}/progress`, { node }),

  // 传记师端
  me: () => api.get<Biographer>('/api/biographer/me'),
  myOrders: () => api.get<BiographerOrder[]>('/api/biographer/orders'),
  updateProfile: (data: Partial<Biographer>) => api.put<Biographer>('/api/biographer/me', data),
  payDeposit: () => api.post('/api/biographer/deposit'),
  apply: (data: BiographerApplyPayload) => api.post<Biographer>('/api/biographer/apply', data),
  applyStatus: () => api.get<BiographerApplyStatusResult>('/api/biographer/apply/status'),

  // 管理后台
  adminList: () => api.get<Biographer[]>('/api/biographers/all'),
  adminGetBiographerOrderByOrderId: (orderId: string) =>
    api.get<BiographerOrder>(`/api/admin/biographer-orders?orderId=${encodeURIComponent(orderId)}`),
  create: (data: Partial<Biographer>) => api.post<Biographer>('/api/biographers', data),
  update: (id: string, data: Partial<Biographer>) => api.put<Biographer>(`/api/biographers/${id}`, data),
  review: (id: string, action: 'approve' | 'reject', reason?: string) =>
    api.patch<Biographer>(`/api/biographers/${id}/review`, { action, reason }),
  delete: (id: string) => api.delete<null>(`/api/biographers/${id}`),
}
