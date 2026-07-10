import { api } from './client'
import type { ProductPackage } from '../mocks/types'

export const productApi = {
  list: () => api.get<ProductPackage[]>('/api/products'),
  get: (id: string) => api.get<ProductPackage>(`/api/products/${id}`),
}
