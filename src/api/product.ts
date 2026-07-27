import { api } from './client'
import type { ProductPackage } from '../mocks/types'

export interface ProductReview {
  id: string
  orderId: string
  userName: string
  productId: string
  productName: string
  rating: number
  content: string
  createdAt: string
}

export const productApi = {
  list: () => api.get<ProductPackage[]>('/api/products'),
  get: (id: string) => api.get<ProductPackage>(`/api/products/${id}`),
  reviews: (id: string) => api.get<ProductReview[]>(`/api/products/${id}/reviews`),

  // 管理后台
  adminList: () => api.get<ProductPackage[]>('/api/products/all'),
  create: (data: Partial<ProductPackage>) => api.post<ProductPackage>('/api/products', data),
  update: (id: string, data: Partial<ProductPackage>) => api.put<ProductPackage>(`/api/products/${id}`, data),
  remove: (id: string) => api.delete<null>(`/api/products/${id}`),
  updateStatus: (id: string, status: 'active' | 'inactive') =>
    api.patch<ProductPackage>(`/api/products/${id}/status`, { status }),
}
