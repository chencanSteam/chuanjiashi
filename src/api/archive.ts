import { api } from './client'
import type { Archive } from '../mocks/types'

export const archiveApi = {
  list: () => api.get<Archive[]>('/api/archives'),
  get: (id: string) => api.get<Archive>(`/api/archives/${id}`),
  create: (data: Partial<Archive>) => api.post<Archive>('/api/archives', data),
  update: (id: string, data: Partial<Archive>) => api.put<Archive>(`/api/archives/${id}`, data),
  delete: (id: string) => api.delete<null>(`/api/archives/${id}`),
  questions: (id: string) => api.get('/api/archives/:id/questions'.replace(':id', id)),
  types: () => api.get<{ value: string; label: string }[]>('/api/archive-types'),
}
