import { api } from './client'
import type { MediaReviewItem, ContentReport } from '../mocks/types'

export const contentReviewApi = {
  // 素材审核
  mediaList: () => api.get<MediaReviewItem[]>('/api/admin/content-review/media'),
  reviewMedia: (id: string, status: 'approved' | 'rejected') =>
    api.patch<MediaReviewItem>(`/api/admin/content-review/media/${id}`, { status }),

  // 举报管理
  reportList: () => api.get<ContentReport[]>('/api/admin/content-review/reports'),
  processReport: (id: string) =>
    api.patch<ContentReport>(`/api/admin/content-review/reports/${id}`, { status: 'processed' }),
}
