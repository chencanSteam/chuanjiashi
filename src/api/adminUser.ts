import { api, toQuery } from './client'
import type { AdminUser, CommissionRecord } from '../mocks/types'

export type AdminUserDetail = AdminUser & {
  /** 推广关系：直接邀请的下级用户 */
  invitees: AdminUser[]
  /** 佣金明细 */
  commissions: CommissionRecord[]
}

export const adminUserApi = {
  // 用户列表（关键词/状态过滤）
  list: (params?: { keyword?: string; status?: AdminUser['status'] | 'all' }) =>
    api.get<AdminUser[]>(`/api/admin/users?${toQuery(params)}`),
  // 用户详情（含推广关系、佣金明细）
  get: (id: string) => api.get<AdminUserDetail>(`/api/admin/users/${id}`),
  // 禁用/启用
  updateStatus: (id: string, status: AdminUser['status']) =>
    api.patch<AdminUser>(`/api/admin/users/${id}/status`, { status }),
  // 实名审核列表
  realnameList: (params?: { status?: AdminUser['realNameStatus'] | 'all' }) =>
    api.get<AdminUser[]>(`/api/admin/users/realname?${toQuery(params)}`),
  // 实名审核通过/驳回
  reviewRealname: (id: string, status: 'verified' | 'rejected') =>
    api.patch<AdminUser>(`/api/admin/users/${id}/realname`, { status }),
}
