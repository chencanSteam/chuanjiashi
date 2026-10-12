import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, storeKeys } from '../utils/store'
import { defaultMediaReviewItems } from '../data/seed'
import type { MediaReviewItem } from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

function ensureMediaReviewItems(): MediaReviewItem[] {
  const items = getItem<MediaReviewItem[]>(storeKeys.mediaReviewItems, [])
  if (items.length === 0) {
    setItem(storeKeys.mediaReviewItems, defaultMediaReviewItems)
    return defaultMediaReviewItems
  }
  return items
}

export const contentReviewHandlers: HttpHandler[] = [
  // 素材审核列表
  http.get('/api/admin/content-review/media', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    return success(ensureMediaReviewItems())
  }),

  // 素材审核操作（通过/驳回）
  http.patch('/api/admin/content-review/media/:id', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { status } = (await request.json()) as { status?: MediaReviewItem['status'] }
    if (status !== 'approved' && status !== 'rejected') return fail('状态错误')
    const items = ensureMediaReviewItems()
    const idx = items.findIndex((m) => m.id === params.id)
    if (idx < 0) return notFound('素材不存在')
    items[idx] = { ...items[idx], status }
    setItem(storeKeys.mediaReviewItems, items)
    return success(items[idx], status === 'approved' ? '素材已通过' : '素材已驳回')
  }),
]
