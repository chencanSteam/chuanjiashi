import { api } from './client'
import type { Biographer, BiographerOrder } from '../mocks/types'

export const biographerApi = {
  list: (city?: string) =>
    api.get<Biographer[]>(`/api/biographers${city ? `?city=${encodeURIComponent(city)}` : ''}`),
  get: (id: string) => api.get<Biographer>(`/api/biographers/${id}`),
  createOrder: (biographerId: string, serviceId: string) =>
    api.post<{ order: unknown; biographerOrder: BiographerOrder }>('/api/biographer-orders', {
      biographerId,
      serviceId,
    }),
  orders: () => api.get<BiographerOrder[]>('/api/biographer-orders'),

  // 传记师端
  me: () => api.get<Biographer>('/api/biographer/me'),
  myOrders: () => api.get<BiographerOrder[]>('/api/biographer/orders'),
  updateProfile: (data: Partial<Biographer>) => api.put<Biographer>('/api/biographer/me', data),

  // 管理后台
  adminList: () => api.get<Biographer[]>('/api/biographers/all'),
  create: (data: Partial<Biographer>) => api.post<Biographer>('/api/biographers', data),
  update: (id: string, data: Partial<Biographer>) => api.put<Biographer>(`/api/biographers/${id}`, data),
  delete: (id: string) => api.delete<null>(`/api/biographers/${id}`),
}
