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

  http.get('/api/admin/quota-summary', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()

    const map = getItem<Record<string, AIQuota>>(storeKeys.quota, {})
    const entries = Object.entries(map)

    // 如果没有数据，生成一些 demo 数据
    if (entries.length === 0) {
      const demoData: Array<{ id: string; plan: string; interview: [number, number, number]; followUp: [number, number, number]; bio: [number, number, number]; dialog: [number, number, number]; storage: number }> = [
        { id: 'u_demo_1', plan: '标准传记包', interview: [18, 30, 24500], followUp: [6, 10, 8200], bio: [1, 3, 156000], dialog: [12, 50, 18500], storage: 268 },
        { id: 'u_demo_2', plan: '尊享家族包', interview: [28, 50, 41200], followUp: [9, 15, 13800], bio: [2, 5, 298000], dialog: [22, 80, 32400], storage: 456 },
        { id: 'u_demo_3', plan: '标准传记包', interview: [8, 30, 11200], followUp: [3, 10, 4800], bio: [1, 3, 138000], dialog: [6, 50, 9600], storage: 186 },
        { id: 'u_demo_4', plan: '标准传记包', interview: [22, 30, 29800], followUp: [8, 10, 11200], bio: [2, 3, 265000], dialog: [18, 50, 24800], storage: 342 },
        { id: 'u_demo_5', plan: '尊享家族包', interview: [35, 50, 52800], followUp: [12, 15, 17600], bio: [3, 5, 386000], dialog: [31, 80, 45200], storage: 512 },
        { id: 'u_demo_6', plan: '数字人纪念包', interview: [5, 30, 7600], followUp: [2, 10, 3200], bio: [0, 3, 0], dialog: [42, 100, 56800], storage: 298 },
        { id: 'u_demo_7', plan: '标准传记包', interview: [14, 30, 19800], followUp: [5, 10, 7400], bio: [1, 3, 142000], dialog: [9, 50, 12800], storage: 224 },
        { id: 'u_demo_8', plan: '尊享家族包', interview: [31, 50, 46800], followUp: [11, 15, 16200], bio: [2, 5, 312000], dialog: [27, 80, 38600], storage: 478 },
        { id: 'u_demo_9', plan: '标准传记包', interview: [11, 30, 15400], followUp: [4, 10, 6200], bio: [1, 3, 128000], dialog: [8, 50, 11400], storage: 198 },
        { id: 'u_demo_10', plan: '数字人纪念包', interview: [6, 30, 8400], followUp: [2, 10, 3600], bio: [0, 3, 0], dialog: [38, 100, 49800], storage: 276 },
      ]
      demoData.forEach((d) => {
        map[d.id] = {
          plan: d.plan,
          interviewQuestion: { used: d.interview[0], total: d.interview[1], tokensUsed: d.interview[2] },
          followUp: { used: d.followUp[0], total: d.followUp[1], tokensUsed: d.followUp[2] },
          biographyGenerate: { used: d.bio[0], total: d.bio[1], tokensUsed: d.bio[2] },
          digitalDialog: { used: d.dialog[0], total: d.dialog[1], tokensUsed: d.dialog[2] },
          storage: { usedMB: d.storage, totalMB: 1024 },
        }
      })
      setItem(storeKeys.quota, map)
    }

    const details: Array<AIQuota & { userId: string; totalTokens: number }> = []
    let totalTokens = 0

    const summary = Object.entries(map).reduce(
      (acc, [uid, q]) => {
        acc.userCount += 1
        acc.interviewQuestion.used += q.interviewQuestion.used
        acc.interviewQuestion.total += q.interviewQuestion.total
        acc.interviewQuestion.tokensUsed += q.interviewQuestion.tokensUsed || 0
        acc.followUp.used += q.followUp.used
        acc.followUp.total += q.followUp.total
        acc.followUp.tokensUsed += q.followUp.tokensUsed || 0
        acc.biographyGenerate.used += q.biographyGenerate.used
        acc.biographyGenerate.total += q.biographyGenerate.total
        acc.biographyGenerate.tokensUsed += q.biographyGenerate.tokensUsed || 0
        acc.digitalDialog.used += q.digitalDialog.used
        acc.digitalDialog.total += q.digitalDialog.total
        acc.digitalDialog.tokensUsed += q.digitalDialog.tokensUsed || 0
        acc.storage.usedMB += q.storage.usedMB
        acc.storage.totalMB += q.storage.totalMB

        const userTotalTokens =
          (q.interviewQuestion.tokensUsed || 0) +
          (q.followUp.tokensUsed || 0) +
          (q.biographyGenerate.tokensUsed || 0) +
          (q.digitalDialog.tokensUsed || 0)
        totalTokens += userTotalTokens
        details.push({ userId: uid, totalTokens, ...q })

        return acc
      },
      {
        userCount: 0,
        interviewQuestion: { used: 0, total: 0, tokensUsed: 0 },
        followUp: { used: 0, total: 0, tokensUsed: 0 },
        biographyGenerate: { used: 0, total: 0, tokensUsed: 0 },
        digitalDialog: { used: 0, total: 0, tokensUsed: 0 },
        storage: { usedMB: 0, totalMB: 0 },
      }
    )

    return success({
      ...summary,
      totalTokens,
      details: details.sort((a, b) => b.totalTokens - a.totalTokens),
    })
  }),
]
