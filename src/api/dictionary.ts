import { api } from './client'
import type { DictionaryItem, DictionaryType } from '../mocks/types'

export const dictionaryApi = {
  /** 用户端：仅启用的标签 */
  list: (type: DictionaryType) => api.get<DictionaryItem[]>(`/api/dictionary?type=${type}`),
  adminList: (type: DictionaryType) => api.get<DictionaryItem[]>(`/api/admin/dictionary?type=${type}`),
  create: (type: DictionaryType, label: string) => api.post<DictionaryItem>('/api/admin/dictionary', { type, label }),
  update: (id: string, label: string) => api.put<DictionaryItem>(`/api/admin/dictionary/${id}`, { label }),
  updateStatus: (id: string, enabled: boolean) => api.patch<DictionaryItem>(`/api/admin/dictionary/${id}/status`, { enabled }),
  remove: (id: string) => api.delete<null>(`/api/admin/dictionary/${id}`),
  reorder: (type: DictionaryType, ids: string[]) => api.put<DictionaryItem[]>('/api/admin/dictionary/order', { type, ids }),
}
