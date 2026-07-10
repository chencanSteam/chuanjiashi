import { api } from './client'
import type {
  Partner,
  PartnerApplication,
  PartnerCustomer,
  PartnerType,
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
}
