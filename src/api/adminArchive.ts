import { api } from './client'
import type { AdminArchive } from '../mocks/types'

export const adminArchiveApi = {
  // 档案列表（关键词/档案类型/隐私状态过滤）
  list: (params?: {
    keyword?: string
    archiveType?: AdminArchive['archiveType'] | 'all'
    privacyStatus?: AdminArchive['privacyStatus'] | 'all'
  }) => api.get<AdminArchive[]>(`/api/admin/archives?${new URLSearchParams(params || {}).toString()}`),
  // 档案详情
  get: (id: string) => api.get<AdminArchive>(`/api/admin/archives/${id}`),
  // 修改隐私状态
  updatePrivacy: (id: string, privacyStatus: AdminArchive['privacyStatus']) =>
    api.patch<AdminArchive>(`/api/admin/archives/${id}/privacy`, { privacyStatus }),
}
