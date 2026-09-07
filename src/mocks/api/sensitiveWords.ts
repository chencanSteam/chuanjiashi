import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { generateId, getItem, setItem, storeKeys } from '../utils/store'
import { defaultSensitiveWords, defaultSensitiveHits } from '../data/seed'
import type {
  SensitiveWord,
  SensitiveWordAction,
  SensitiveWordCategory,
  SensitiveHit,
} from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

function ensureSensitiveWords(): SensitiveWord[] {
  const words = getItem<SensitiveWord[]>(storeKeys.sensitiveWords, [])
  if (words.length === 0) {
    setItem(storeKeys.sensitiveWords, defaultSensitiveWords)
    return defaultSensitiveWords
  }
  return words
}

function ensureSensitiveHits(): SensitiveHit[] {
  const hits = getItem<SensitiveHit[]>(storeKeys.sensitiveHits, [])
  if (hits.length === 0) {
    setItem(storeKeys.sensitiveHits, defaultSensitiveHits)
    return defaultSensitiveHits
  }
  return hits
}

const CATEGORY_SET: SensitiveWordCategory[] = ['politics', 'porn', 'violence', 'ads', 'abuse', 'custom']
const ACTION_SET: SensitiveWordAction[] = ['block', 'review', 'replace']

/** 批量录入拆分：每行一个或顿号/逗号分隔，trim、去空、批内+现有词去重 */
function parseWords(input: string[], existing: Set<string>): string[] {
  const result: string[] = []
  input.forEach((line) => {
    line.split(/[、,，\n]/).forEach((raw) => {
      const word = raw.trim()
      if (!word || existing.has(word) || result.includes(word)) return
      result.push(word)
    })
  })
  return result
}

export const sensitiveWordsHandlers: HttpHandler[] = [
  // 词库列表
  http.get('/api/admin/sensitive-words', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    return success(ensureSensitiveWords())
  }),

  // 批量新增敏感词
  http.post('/api/admin/sensitive-words', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as {
      words?: string[]
      category?: SensitiveWordCategory
      action?: SensitiveWordAction
      replacement?: string
    }
    if (!Array.isArray(body.words) || body.words.length === 0) return fail('请录入敏感词')
    if (!body.category || !CATEGORY_SET.includes(body.category)) return fail('分类错误')
    if (!body.action || !ACTION_SET.includes(body.action)) return fail('处置方式错误')

    const list = ensureSensitiveWords()
    const existing = new Set(list.map((w) => w.word))
    const newWords = parseWords(body.words, existing)
    if (newWords.length === 0) return fail('没有可新增的敏感词（可能已存在或为空）')

    const now = new Date().toISOString()
    const created: SensitiveWord[] = newWords.map((word) => ({
      id: `sw_${generateId()}`,
      word,
      category: body.category!,
      action: body.action!,
      replacement: body.action === 'replace' ? (body.replacement?.trim() || '**') : undefined,
      enabled: true,
      hitCount: 0,
      createdAt: now,
      updatedAt: now,
    }))
    setItem(storeKeys.sensitiveWords, [...list, ...created])
    return success([...list, ...created], `已新增 ${created.length} 个敏感词`)
  }),

  // 编辑敏感词
  http.put('/api/admin/sensitive-words/:id', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as Partial<Pick<SensitiveWord, 'word' | 'category' | 'action' | 'replacement'>>
    const list = ensureSensitiveWords()
    const idx = list.findIndex((w) => w.id === params.id)
    if (idx < 0) return notFound('敏感词不存在')

    const word = body.word?.trim()
    if (!word) return fail('敏感词不能为空')
    if (list.some((w) => w.id !== params.id && w.word === word)) return fail('该敏感词已存在')
    if (body.category && !CATEGORY_SET.includes(body.category)) return fail('分类错误')
    if (body.action && !ACTION_SET.includes(body.action)) return fail('处置方式错误')

    const action = body.action || list[idx].action
    list[idx] = {
      ...list[idx],
      word,
      category: body.category || list[idx].category,
      action,
      replacement: action === 'replace' ? (body.replacement?.trim() || list[idx].replacement || '**') : undefined,
      updatedAt: new Date().toISOString(),
    }
    setItem(storeKeys.sensitiveWords, list)
    return success(list[idx], '敏感词已更新')
  }),

  // 启用/停用
  http.patch('/api/admin/sensitive-words/:id/status', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { enabled } = (await request.json()) as { enabled?: boolean }
    if (typeof enabled !== 'boolean') return fail('状态错误')
    const list = ensureSensitiveWords()
    const idx = list.findIndex((w) => w.id === params.id)
    if (idx < 0) return notFound('敏感词不存在')
    list[idx] = { ...list[idx], enabled, updatedAt: new Date().toISOString() }
    setItem(storeKeys.sensitiveWords, list)
    return success(list[idx], enabled ? '已启用' : '已停用')
  }),

  // 删除敏感词
  http.delete('/api/admin/sensitive-words/:id', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const list = ensureSensitiveWords()
    const idx = list.findIndex((w) => w.id === params.id)
    if (idx < 0) return notFound('敏感词不存在')
    list.splice(idx, 1)
    setItem(storeKeys.sensitiveWords, list)
    return success(null, '敏感词已删除')
  }),

  // 命中记录列表
  http.get('/api/admin/sensitive-hits', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    return success(ensureSensitiveHits())
  }),

  // 命中复核处置（放行/拦截）
  http.patch('/api/admin/sensitive-hits/:id', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { status } = (await request.json()) as { status?: SensitiveHit['status'] }
    if (status !== 'blocked' && status !== 'released') return fail('状态错误')
    const hits = ensureSensitiveHits()
    const idx = hits.findIndex((h) => h.id === params.id)
    if (idx < 0) return notFound('命中记录不存在')
    hits[idx] = { ...hits[idx], status, processorId: userId, processedAt: new Date().toISOString() }
    setItem(storeKeys.sensitiveHits, hits)
    return success(hits[idx], status === 'blocked' ? '已拦截' : '已放行')
  }),
]
