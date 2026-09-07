import { api } from './client'
import type {
  SensitiveWord,
  SensitiveWordAction,
  SensitiveWordCategory,
  SensitiveHit,
} from '../mocks/types'

export const sensitiveWordsApi = {
  // 敏感词库
  list: () => api.get<SensitiveWord[]>('/api/admin/sensitive-words'),
  createBatch: (data: { words: string[]; category: SensitiveWordCategory; action: SensitiveWordAction; replacement?: string }) =>
    api.post<SensitiveWord[]>('/api/admin/sensitive-words', data),
  update: (id: string, data: { word: string; category: SensitiveWordCategory; action: SensitiveWordAction; replacement?: string }) =>
    api.put<SensitiveWord>(`/api/admin/sensitive-words/${id}`, data),
  toggleStatus: (id: string, enabled: boolean) =>
    api.patch<SensitiveWord>(`/api/admin/sensitive-words/${id}/status`, { enabled }),
  remove: (id: string) => api.delete<null>(`/api/admin/sensitive-words/${id}`),

  // 命中记录
  hitList: () => api.get<SensitiveHit[]>('/api/admin/sensitive-hits'),
  processHit: (id: string, status: 'blocked' | 'released') =>
    api.patch<SensitiveHit>(`/api/admin/sensitive-hits/${id}`, { status }),
}
