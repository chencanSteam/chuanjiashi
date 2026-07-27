import { api } from './client'
import type { ComplianceRecord, AgreementConfig, ComplianceAlert } from '../mocks/types'

export const complianceApi = {
  // 授权记录列表（按类型/状态过滤）
  records: (params?: { type?: ComplianceRecord['type'] | 'all'; status?: ComplianceRecord['status'] | 'all' }) =>
    api.get<ComplianceRecord[]>(`/api/admin/compliance/records?${new URLSearchParams(params || {}).toString()}`),
  // 协议配置列表
  agreements: () => api.get<AgreementConfig[]>('/api/admin/compliance/agreements'),
  // 私单预警列表
  alerts: (params?: { status?: ComplianceAlert['status'] | 'all' }) =>
    api.get<ComplianceAlert[]>(`/api/admin/compliance/alerts?${new URLSearchParams(params || {}).toString()}`),
}
