import { api } from './client'
import type { PublicBook } from '../mocks/types'

export type BookReviewStatus = 'approved' | 'rejected' | 'off_shelf'

export const bookshelfApi = {
  list: (params?: { category?: string; keyword?: string }) =>
    api.get<PublicBook[]>(`/api/bookshelf?${new URLSearchParams(params || {}).toString()}`),
  get: (id: string) => api.get<PublicBook>(`/api/bookshelf/${id}`),
  like: (id: string) => api.post<PublicBook>(`/api/bookshelf/${id}/like`),
  collect: (id: string) => api.post<PublicBook>(`/api/bookshelf/${id}/collect`),
  publish: (id: string, data: Partial<PublicBook>) => api.post<PublicBook>(`/api/bookshelf/${id}/publish`, data),
  myList: () => api.get<PublicBook[]>('/api/my-bookshelf'),

  // 管理后台
  adminList: (params?: { status?: PublicBook['status'] | 'all'; keyword?: string }) =>
    api.get<PublicBook[]>(`/api/admin/bookshelf?${new URLSearchParams(params || {}).toString()}`),
  review: (id: string, status: BookReviewStatus, reason?: string) =>
    api.put<PublicBook>(`/api/admin/bookshelf/${id}/review`, { status, reason }),
}
