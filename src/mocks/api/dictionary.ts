import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import { defaultDictionaryItems } from '../data/seed'
import type { DictionaryItem, DictionaryType } from '../types'

/** 默认标签种子版本：每次扩充 defaultDictionaryItems 时 +1，老缓存自动补齐新增项 */
const DICT_SEED_VERSION = 4

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
