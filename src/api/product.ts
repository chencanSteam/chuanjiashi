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
}
