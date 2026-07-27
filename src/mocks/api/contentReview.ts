import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, storeKeys } from '../utils/store'
import { defaultMediaReviewItems, defaultContentReports } from '../data/seed'
import type { MediaReviewItem, ContentReport } from '../types'

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

function ensureContentReports(): ContentReport[] {
  const reports = getItem<ContentReport[]>(storeKeys.contentReports, [])
  if (reports.length === 0) {
    setItem(storeKeys.contentReports, defaultContentReports)
    return defaultContentReports
  }
  return reports
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

  // 举报列表
  http.get('/api/admin/content-review/reports', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    return success(ensureContentReports())
  }),

  // 举报标记已处理
  http.patch('/api/admin/content-review/reports/:id', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { status } = (await request.json()) as { status?: ContentReport['status'] }
    if (status !== 'processed') return fail('状态错误')
    const reports = ensureContentReports()
    const idx = reports.findIndex((r) => r.id === params.id)
    if (idx < 0) return notFound('举报记录不存在')
    reports[idx] = { ...reports[idx], status }
    setItem(storeKeys.contentReports, reports)
    return success(reports[idx], '举报已处理')
  }),
]
