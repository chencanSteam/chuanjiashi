import { http, type HttpHandler } from 'msw'
import { success, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, removeItem, generateId, storeKeys } from '../utils/store'
import { defaultQuestions } from '../data/seed'
import type { Archive, Material, TimelineEvent } from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

function calculateCompletion(archive: Archive): number {
  let score = 0
  if (archive.name) score += 15
  if (archive.gender) score += 5
  if (archive.birthDate) score += 10
  if (archive.birthPlace) score += 10
  if (archive.cover) score += 10
  if (archive.bio) score += 10
  const materials = getItem<Material[]>(storeKeys.materials, []).filter(m => m.archiveId === archive.id)
  if (materials.length > 0) score += 20
  const events = getItem<TimelineEvent[]>(storeKeys.timeline, []).filter(e => e.archiveId === archive.id)
  if (events.length > 0) score += 20
  return Math.min(score, 100)
}

export const archiveHandlers: HttpHandler[] = [
  http.get('/api/archives', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const archives = getItem<Archive[]>(storeKeys.archives, [])
      .filter(a => a.userId === userId)
      .map(a => ({ ...a, completion: calculateCompletion(a) }))
    return success(archives)
  }),

  http.get('/api/archives/:id', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const archives = getItem<Archive[]>(storeKeys.archives, [])
    const archive = archives.find(a => a.id === params.id && a.userId === userId)
    if (!archive) return notFound()
    return success({ ...archive, completion: calculateCompletion(archive) })
  }),

  http.post('/api/archives', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = await request.json() as Partial<Archive>
    const archive: Archive = {
      id: generateId(),
      userId,
      type: body.type || 'self',
      name: body.name || '未命名档案',
      gender: body.gender,
      birthDate: body.birthDate,
      birthPlace: body.birthPlace,
      deathDate: body.deathDate,
      relation: body.relation,
      status: body.status || 'living',
      cover: body.cover,
      bio: body.bio,
      completion: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const archives = getItem<Archive[]>(storeKeys.archives, [])
    archives.push(archive)
    setItem(storeKeys.archives, archives)
    setItem(storeKeys.currentArchiveId, archive.id)
    return success(archive, '创建成功')
  }),

  http.put('/api/archives/:id', async ({ request, params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const archives = getItem<Archive[]>(storeKeys.archives, [])
    const idx = archives.findIndex(a => a.id === params.id && a.userId === userId)
    if (idx < 0) return notFound()
    const body = await request.json() as Partial<Archive>
    archives[idx] = {
      ...archives[idx],
      ...body,
      updatedAt: new Date().toISOString(),
    }
    archives[idx].completion = calculateCompletion(archives[idx])
    setItem(storeKeys.archives, archives)
    return success(archives[idx], '更新成功')
  }),

  http.delete('/api/archives/:id', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    let archives = getItem<Archive[]>(storeKeys.archives, [])
    const target = archives.find(a => a.id === params.id && a.userId === userId)
    if (!target) return notFound()
    archives = archives.filter(a => a.id !== params.id)
    setItem(storeKeys.archives, archives)
    const currentId = getItem<string | null>(storeKeys.currentArchiveId, null)
    if (currentId === params.id) {
      removeItem(storeKeys.currentArchiveId)
    }
    return success(null, '删除成功')
  }),

  http.get('/api/archives/:id/questions', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    return success(defaultQuestions)
  }),

  http.get('/api/archive-types', async () => {
    return success([
      { value: 'self', label: '本人' },
      { value: 'parent', label: '父母' },
      { value: 'grandparent', label: '祖辈' },
      { value: 'relative', label: '亲友' },
      { value: 'other', label: '其他' },
    ])
  }),
]
