import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized } from '../utils/response'
import { getItem, setItem, storeKeys } from '../utils/store'
import type { AIQuota } from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

const defaultQuota: AIQuota = {
  plan: '标准传记包',
  interviewQuestion: { used: 18, total: 30, tokensUsed: 24500 },
  followUp: { used: 6, total: 10, tokensUsed: 8200 },
  biographyGenerate: { used: 1, total: 3, tokensUsed: 156000 },
  digitalDialog: { used: 12, total: 50, tokensUsed: 18500 },
  storage: { usedMB: 268, totalMB: 1024 },
}

function loadQuota(userId: string): AIQuota {
  const map = getItem<Record<string, AIQuota>>(storeKeys.quota, {})
  return map[userId] || defaultQuota
}

function saveQuota(userId: string, quota: AIQuota): void {
  const map = getItem<Record<string, AIQuota>>(storeKeys.quota, {})
  map[userId] = quota
  setItem(storeKeys.quota, map)
}

export const quotaHandlers: HttpHandler[] = [
  http.get('/api/quota', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    return success(loadQuota(userId))
  }),

  http.post('/api/quota/consume', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { type } = (await request.json()) as { type?: keyof Omit<AIQuota, 'plan' | 'storage'> }
    if (!type || !['interviewQuestion', 'followUp', 'biographyGenerate', 'digitalDialog'].includes(type)) {
      return fail('额度类型错误')
    }
    const quota = loadQuota(userId)
    const item = quota[type]
    if (item.used >= item.total) return fail('额度不足')
    const next: AIQuota = {
      ...quota,
      [type]: { ...item, used: item.used + 1 },
    }
    saveQuota(userId, next)
    return success(next)
  }),
]
