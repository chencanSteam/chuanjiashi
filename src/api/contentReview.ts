import { api } from './client'
import type { MediaReviewItem } from '../mocks/types'

export const contentReviewApi = {
  // 素材审核
  mediaList: () => api.get<MediaReviewItem[]>('/api/admin/content-review/media'),
  reviewMedia: (id: string, status: 'approved' | 'rejected') =>
    api.patch<MediaReviewItem>(`/api/admin/content-review/media/${id}`, { status }),
}
