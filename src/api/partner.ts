import { api, toQuery } from './client'
import type {
  Partner,
  PartnerApplication,
  PartnerCustomer,
  PartnerType,
  PartnerChannel,
  PartnerAssessment,
  PartnerLocalOrder,
  GmvLineStat,
  AdminUser,
  PartnerFeeRecord,
  PartnerShareConfig,
  PartnerRewardConfig,
  PartnerAssessmentRecord,
} from '../mocks/types'

export interface PartnerApplyData {
  name: string
  phone: string
  email?: string
  type: PartnerType
  regionCode?: string
  regionName?: string
  reason?: string
}

export interface PartnerFormData {
  name: string
  phone: string
  email?: string
  type: PartnerType
  regionCode?: string
  regionName?: string
  parentId?: string
  commissionRate: number
  status: Partner['status']
}

export const partnerApi = {
  // 合伙人自己
  me: () => api.get<Partner>('/api/partner/me'),
  apply: (data: PartnerApplyData) =>
    api.post<{ partner: Partner; application: PartnerApplication }>('/api/partner/apply', data),
  customers: () => api.get<PartnerCustomer[]>('/api/partner/customers'),
  applications: () => api.get<PartnerApplication[]>('/api/partner/applications'),

  // 管理后台
  adminApplications: () => api.get<PartnerApplication[]>('/api/partner/applications/all'),
  processApplication: (id: string, status: PartnerApplication['status']) =>
    api.post<PartnerApplication>(`/api/partner/applications/${id}/process`, { status }),
  listPartners: () => api.get<Partner[]>('/api/partners'),
  createPartner: (data: Partial<Partner>) => api.post<Partner>('/api/partners', data),
  updatePartner: (id: string, data: Partial<Partner>) => api.put<Partner>(`/api/partners/${id}`, data),
  deletePartner: (id: string) => api.delete<null>(`/api/partners/${id}`),
  adminCustomers: () => api.get<PartnerCustomer[]>('/api/partner/customers/all'),
  bindCustomer: (data: Partial<PartnerCustomer>) =>
    api.post<PartnerCustomer>('/api/partner/customers/admin/bind', data),

  // 渠道管理
  channels: (params?: { type?: PartnerChannel['type'] | 'all'; status?: PartnerChannel['status'] | 'all' }) =>
    api.get<PartnerChannel[]>(`/api/partner/channels?${toQuery(params)}`),
  createChannel: (data: Partial<PartnerChannel>) =>
    api.post<PartnerChannel>('/api/partner/channels', data),
  // 年度考核结算
  assessment: () => api.get<PartnerAssessment>('/api/partner/assessment'),
  // GMV 分业务线统计
  gmvStats: () => api.get<GmvLineStat[]>('/api/partner/gmv-stats'),
  // 本地用户/本地订单
  localUsers: () => api.get<AdminUser[]>('/api/partner/local/users'),
  localOrders: () => api.get<PartnerLocalOrder[]>('/api/partner/local/orders'),

  // 管理后台：服务商费用/分成/奖励/考核
  adminFees: () => api.get<PartnerFeeRecord[]>('/api/admin/partner/fees'),
  shareConfigs: () => api.get<PartnerShareConfig[]>('/api/admin/partner/share-configs'),
  updateShareConfig: (id: string, data: Partial<PartnerShareConfig>) =>
    api.put<PartnerShareConfig>(`/api/admin/partner/share-configs/${id}`, data),
  rewardConfigs: () => api.get<PartnerRewardConfig[]>('/api/admin/partner/reward-configs'),
  updateRewardConfig: (id: string, data: Partial<PartnerRewardConfig>) =>
    api.put<PartnerRewardConfig>(`/api/admin/partner/reward-configs/${id}`, data),
  adminAssessments: () => api.get<PartnerAssessmentRecord[]>('/api/admin/partner/assessments'),
}
