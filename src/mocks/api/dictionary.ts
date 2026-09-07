import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import { defaultDictionaryItems } from '../data/seed'
import type { DictionaryItem, DictionaryType } from '../types'

const DICT_TYPES: DictionaryType[] = ['book_occupation', 'book_life_stage', 'sensitive_words']

/** 默认标签种子版本：每次扩充 defaultDictionaryItems 时 +1，老缓存自动补齐新增项 */
const DICT_SEED_VERSION = 4

function getCurrentUser(): { id: string } | null {
  return getItem<{ id: string } | null>(storeKeys.currentUser, null)
}

function ensureItems(): DictionaryItem[] {
  const stored = getItem<DictionaryItem[]>(storeKeys.dictionary, [])
  if (stored.length === 0) {
    setItem(storeKeys.dictionary, defaultDictionaryItems)
    setItem(`${storeKeys.dictionary}_seed_v`, DICT_SEED_VERSION)
    return [...defaultDictionaryItems]
  }
  // 种子升级：仅在版本号落后时补齐新增的默认标签（用户手动删除的不会复活），并同步级别等新字段
  const version = getItem<number>(`${storeKeys.dictionary}_seed_v`, 1)
  if (version < DICT_SEED_VERSION) {
    let merged = [...stored]
    defaultDictionaryItems.forEach((def) => {
      const existingIndex = merged.findIndex((item) => item.type === def.type && item.label === def.label)
      if (existingIndex >= 0) {
        if (merged[existingIndex].level === undefined && def.level !== undefined) {
          merged[existingIndex] = { ...merged[existingIndex], level: def.level }
        }
        return
      }
      const maxOrder = Math.max(0, ...merged.filter((item) => item.type === def.type).map((item) => item.order))
      merged.push({ ...def, id: generateId(), order: maxOrder + 1 })
    })
    setItem(storeKeys.dictionary, merged)
    setItem(`${storeKeys.dictionary}_seed_v`, DICT_SEED_VERSION)
    return merged
  }
  return stored
}

function saveItems(items: DictionaryItem[]) {
  setItem(storeKeys.dictionary, items)
}

function isValidType(type: unknown): type is DictionaryType {
  return typeof type === 'string' && DICT_TYPES.includes(type as DictionaryType)
}

function validateLabel(label: unknown, items: DictionaryItem[], type: DictionaryType, currentId?: string): string | null {
  if (typeof label !== 'string' || !label.trim()) return '请填写标签名称'
  if (label.trim().length > 20) return '标签名称不能超过 20 个字'
  if (items.some((item) => item.type === type && item.id !== currentId && item.label.trim() === label.trim())) return '标签名称不能重复'
  return null
}

function listByType(type: DictionaryType, enabledOnly = false): DictionaryItem[] {
  return ensureItems()
    .filter((item) => item.type === type && (!enabledOnly || item.enabled))
    .sort((a, b) => a.order - b.order)
}

/** 敏感词检查：命中启用中的敏感词则返回 { word, level }，否则返回 null（供评论/上架等接口复用） */
export function findSensitiveHit(text: string): { word: string; level: 1 | 2 } | null {
  if (!text) return null
  const words = listByType('sensitive_words', true)
  const hit = words.find((item) => text.includes(item.label))
  return hit ? { word: hit.label, level: hit.level ?? 1 } : null
}

export const dictionaryHandlers: HttpHandler[] = [
  // 用户端：仅返回启用的标签（上架弹窗用）
  http.get('/api/dictionary', async ({ request }) => {
    if (!getCurrentUser()) return unauthorized()
    const type = new URL(request.url).searchParams.get('type') || ''
    if (!isValidType(type)) return fail('字典类型不存在')
    return success(listByType(type, true))
  }),

  http.get('/api/admin/dictionary', async ({ request }) => {
    if (!getCurrentUser()) return unauthorized()
    const type = new URL(request.url).searchParams.get('type') || ''
    if (!isValidType(type)) return fail('字典类型不存在')
    return success(listByType(type))
  }),

  http.post('/api/admin/dictionary', async ({ request }) => {
    if (!getCurrentUser()) return unauthorized()
    const { type, label, level } = (await request.json()) as { type?: string; label?: string; level?: 1 | 2 }
    if (!isValidType(type)) return fail('字典类型不存在')
    const items = ensureItems()
    const error = validateLabel(label, items, type)
    if (error) return fail(error)
    const now = new Date().toISOString()
    const item: DictionaryItem = {
      id: generateId(),
      type,
      label: label!.trim(),
      level: type === 'sensitive_words' ? (level === 2 ? 2 : 1) : undefined,
      enabled: true,
      order: listByType(type).length + 1,
      createdAt: now,
      updatedAt: now,
    }
    saveItems([...items, item])
    return success(item, '标签已新增')
  }),

  http.put('/api/admin/dictionary/order', async ({ request }) => {
    if (!getCurrentUser()) return unauthorized()
    const { type, ids } = (await request.json()) as { type?: string; ids?: string[] }
    if (!isValidType(type)) return fail('字典类型不存在')
    const items = ensureItems()
    const scoped = listByType(type)
    if (!Array.isArray(ids) || ids.length !== scoped.length || new Set(ids).size !== scoped.length || scoped.some((item) => !ids.includes(item.id))) return fail('排序参数错误')
    const now = new Date().toISOString()
    const reordered = ids.map((id, index) => ({ ...scoped.find((item) => item.id === id)!, order: index + 1, updatedAt: now }))
    saveItems([...items.filter((item) => item.type !== type), ...reordered])
    return success(reordered, '排序已更新')
  }),

  http.put('/api/admin/dictionary/:id', async ({ request, params }) => {
    if (!getCurrentUser()) return unauthorized()
    const items = ensureItems()
    const item = items.find((entry) => entry.id === params.id)
    if (!item) return notFound('标签不存在')
    const { label, level } = (await request.json()) as { label?: string; level?: 1 | 2 }
    const error = validateLabel(label, items, item.type, item.id)
    if (error) return fail(error)
    const next: DictionaryItem = { ...item, label: label!.trim(), updatedAt: new Date().toISOString() }
    if (item.type === 'sensitive_words' && (level === 1 || level === 2)) next.level = level
    saveItems(items.map((entry) => (entry.id === item.id ? next : entry)))
    return success(next, '标签已更新')
  }),

  http.patch('/api/admin/dictionary/:id/status', async ({ request, params }) => {
    if (!getCurrentUser()) return unauthorized()
    const items = ensureItems()
    const item = items.find((entry) => entry.id === params.id)
    if (!item) return notFound('标签不存在')
    const { enabled } = (await request.json()) as { enabled?: boolean }
    if (typeof enabled !== 'boolean') return fail('状态参数错误')
    const next = { ...item, enabled, updatedAt: new Date().toISOString() }
    saveItems(items.map((entry) => (entry.id === item.id ? next : entry)))
    return success(next, enabled ? '标签已启用' : '标签已停用')
  }),

  http.delete('/api/admin/dictionary/:id', async ({ params }) => {
    if (!getCurrentUser()) return unauthorized()
    const items = ensureItems()
    const item = items.find((entry) => entry.id === params.id)
    if (!item) return notFound('标签不存在')
    const remaining = items.filter((entry) => entry.id !== item.id)
    // 重排同类型标签的 order
    const reordered = remaining
      .filter((entry) => entry.type === item.type)
      .sort((a, b) => a.order - b.order)
      .map((entry, index) => ({ ...entry, order: index + 1 }))
    saveItems([...remaining.filter((entry) => entry.type !== item.type), ...reordered])
    return success(null, '标签已删除')
  }),
]
