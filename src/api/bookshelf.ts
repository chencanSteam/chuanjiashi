import { api, toQuery } from './client'
import type { PublicBook, BookComment } from '../mocks/types'

export type BookReviewStatus = 'approved' | 'rejected' | 'off_shelf'

export const bookshelfApi = {
  list: (params?: { category?: string; keyword?: string }) =>
    api.get<PublicBook[]>(`/api/bookshelf?${toQuery(params)}`),
  get: (id: string) => api.get<PublicBook>(`/api/bookshelf/${id}`),
  like: (id: string) => api.post<PublicBook>(`/api/bookshelf/${id}/like`),
  collect: (id: string) => api.post<PublicBook>(`/api/bookshelf/${id}/collect`),
  publish: (id: string, data: Partial<PublicBook>) => api.post<PublicBook>(`/api/bookshelf/${id}/publish`, data),
  myList: () => api.get<PublicBook[]>('/api/my-bookshelf'),

  // 评论
  comments: (id: string) => api.get<BookComment[]>(`/api/bookshelf/${id}/comments`),
  postComment: (id: string, content: string) =>
    api.post<BookComment>(`/api/bookshelf/${id}/comments`, { content }),
  // 付费解锁全本
  unlock: (id: string) => api.post<PublicBook>(`/api/bookshelf/${id}/unlock`),

  // 管理后台
  adminList: (params?: { status?: PublicBook['status'] | 'all'; keyword?: string }) =>
    api.get<PublicBook[]>(`/api/admin/bookshelf?${toQuery(params)}`),
  review: (id: string, status: BookReviewStatus, reason?: string) =>
    api.put<PublicBook>(`/api/admin/bookshelf/${id}/review`, { status, reason }),
}
