import { api } from './client'
import type { User } from '../mocks/types'

export interface LoginResult {
  user: User
  token: string
}

export const authApi = {
  sendCode: (phone: string) => api.post<{ phone: string; code: string; expire: number }>('/api/auth/send-code', { phone }),
  login: (phone: string, code: string, inviteCode?: string) =>
    api.post<LoginResult>('/api/auth/login', { phone, code, inviteCode }),
  logout: () => api.post<null>('/api/auth/logout'),
  me: () => api.get<User>('/api/auth/me'),
  acceptAgreement: (type: 'agreement' | 'privacy') => api.post<User>('/api/auth/agreement', { type }),
}
