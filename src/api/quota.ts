import { api } from './client'
import type { AIQuota } from '../mocks/types'

export type QuotaConsumeType = 'interviewQuestion' | 'followUp' | 'biographyGenerate' | 'digitalDialog'

export const quotaApi = {
  get: () => api.get<AIQuota>('/api/quota'),
  consume: (type: QuotaConsumeType) => api.post<AIQuota>('/api/quota/consume', { type }),
}
