import { api } from './client'
import type { AIQuota } from '../mocks/types'

export type QuotaConsumeType = 'interviewQuestion' | 'followUp' | 'biographyGenerate' | 'digitalDialog'

export interface QuotaItemSummary {
  used: number;
  total: number;
  tokensUsed: number;
}

export interface QuotaSummary {
  userCount: number;
  totalTokens: number;
  interviewQuestion: QuotaItemSummary;
  followUp: QuotaItemSummary;
  biographyGenerate: QuotaItemSummary;
  digitalDialog: QuotaItemSummary;
  storage: { usedMB: number; totalMB: number };
  details: Array<AIQuota & { userId: string; totalTokens: number }>;
}

export const quotaApi = {
  get: () => api.get<AIQuota>('/api/quota'),
  consume: (type: QuotaConsumeType) => api.post<AIQuota>('/api/quota/consume', { type }),

  // 管理后台
  adminSummary: () => api.get<QuotaSummary>('/api/admin/quota-summary'),
}
