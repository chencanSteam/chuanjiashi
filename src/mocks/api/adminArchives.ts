import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, storeKeys } from '../utils/store'
import { defaultAdminArchives } from '../data/seed'
import type { AdminArchive } from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

function ensureAdminArchives(): AdminArchive[] {
  const archives = getItem<AdminArchive[]>(storeKeys.adminArchives, [])
  if (archives.length === 0) {
    setItem(storeKeys.adminArchives, defaultAdminArchives)
    return defaultAdminArchives
  }
  return archives
}

export const adminArchiveHandlers: HttpHandler[] = [
  // 档案列表（关键词/档案类型/隐私状态过滤）
  http.get('/api/admin/archives', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const url = new URL(request.url)
    const keyword = url.searchParams.get('keyword') || ''
    const archiveType = url.searchParams.get('archiveType') || 'all'
    const privacyStatus = url.searchParams.get('privacyStatus') || 'all'
    let archives = ensureAdminArchives()
    if (archiveType !== 'all') archives = archives.filter((a) => a.archiveType === archiveType)
    if (privacyStatus !== 'all') archives = archives.filter((a) => a.privacyStatus === privacyStatus)
    if (keyword) {
      const lower = keyword.toLowerCase()
      archives = archives.filter((a) =>
        a.ownerName.toLowerCase().includes(lower) || a.creatorNickname.toLowerCase().includes(lower)
      )
    }
    return success(archives)
  }),

  // 档案详情
  http.get('/api/admin/archives/:id', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const archive = ensureAdminArchives().find((a) => a.id === params.id)
    if (!archive) return notFound('档案不存在')
    return success(archive)
  }),

  // 修改隐私状态
  http.patch('/api/admin/archives/:id/privacy', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { privacyStatus } = (await request.json()) as { privacyStatus?: AdminArchive['privacyStatus'] }
    if (!privacyStatus || !['private', 'shared', 'public'].includes(privacyStatus)) return fail('状态错误')
    const archives = ensureAdminArchives()
    const archive = archives.find((a) => a.id === params.id)
    if (!archive) return notFound('档案不存在')
    archive.privacyStatus = privacyStatus
    setItem(storeKeys.adminArchives, archives)
    return success(archive, '隐私状态已更新')
  }),
]
