import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import { defaultMuseumMessages, DEMO_MUSEUM_ARCHIVE_ID, defaultDemoBiography, defaultDemoTimeline, defaultDemoMaterials, defaultDemoMuseum } from '../data/seed'
import type { Museum, Biography, TimelineEvent, Material, MuseumMessage } from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

function findMuseum(archiveId: string): Museum | undefined {
  const museums = getItem<Museum[]>(storeKeys.museums, [])
  return museums.find(m => m.archiveId === archiveId)
}

function saveMuseum(museum: Museum): void {
  const museums = getItem<Museum[]>(storeKeys.museums, [])
  const idx = museums.findIndex(m => m.id === museum.id)
  if (idx >= 0) museums[idx] = museum
  else museums.push(museum)
  setItem(storeKeys.museums, museums)
}

function buildMuseumData(archiveId: string) {
  const biographies = getItem<Biography[]>(storeKeys.biographies, [])
  const biography = biographies.find(b => b.archiveId === archiveId)
  const timeline = getItem<TimelineEvent[]>(storeKeys.timeline, [])
    .filter(e => e.archiveId === archiveId)
    .sort((a, b) => a.year - b.year)
  const materials = getItem<Material[]>(storeKeys.materials, [])
    .filter(m => m.archiveId === archiveId)
  const images = materials.filter(m => m.type === 'image').map(m => m.url)
  const honors = materials.filter(m => m.category === '荣誉')

  return {
    biography,
    timeline,
    images,
    honors,
  }
}

/**
 * 懒加载演示数字博物馆（archiveId 固定为 'demo'）。
 * 仅当 demo 博物馆不存在时播种，各 store 只追加缺失的 demo 记录，
 * 不影响用户已有的任何数据。
 */
function ensureDemoMuseum(): void {
  const museums = getItem<Museum[]>(storeKeys.museums, [])
  if (museums.some(m => m.archiveId === DEMO_MUSEUM_ARCHIVE_ID)) return

  const biographies = getItem<Biography[]>(storeKeys.biographies, [])
  if (!biographies.some(b => b.archiveId === DEMO_MUSEUM_ARCHIVE_ID)) {
    setItem(storeKeys.biographies, [...biographies, defaultDemoBiography])
  }

  const timeline = getItem<TimelineEvent[]>(storeKeys.timeline, [])
  const missingEvents = defaultDemoTimeline.filter(e => !timeline.some(t => t.id === e.id))
  if (missingEvents.length > 0) setItem(storeKeys.timeline, [...timeline, ...missingEvents])

  const materials = getItem<Material[]>(storeKeys.materials, [])
  const missingMaterials = defaultDemoMaterials.filter(m => !materials.some(x => x.id === m.id))
  if (missingMaterials.length > 0) setItem(storeKeys.materials, [...materials, ...missingMaterials])

  setItem(storeKeys.museums, [...museums, defaultDemoMuseum])
}

export const museumHandlers: HttpHandler[] = [
  http.get('/api/museums/:archiveId', async ({ params }) => {
    ensureDemoMuseum()
    const archiveId = params.archiveId as string
    let museum = findMuseum(archiveId)
    if (!museum) {
      const data = buildMuseumData(archiveId)
      museum = {
        id: generateId(),
        archiveId,
        title: data.biography?.title || '人生数字博物馆',
        intro: '这里记录着一段珍贵的人生旅程。',
        cover: data.images[0] || '',
        visibility: 'private',
        views: 0,
        visitors: 0,
        likes: 0,
        candles: 0,
        flowers: 0,
        createdAt: new Date().toISOString(),
      }
      saveMuseum(museum)
    }
    return success({ museum, ...buildMuseumData(archiveId) })
  }),

  http.put('/api/museums/:archiveId', async ({ request, params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const museum = findMuseum(params.archiveId as string)
    if (!museum) return notFound('数字馆不存在')
    const body = await request.json() as Partial<Museum>
    Object.assign(museum, body)
    saveMuseum(museum)
    return success(museum)
  }),

  http.post('/api/museums/:archiveId/like', async ({ params }) => {
    const museum = findMuseum(params.archiveId as string)
    if (!museum) return notFound('数字馆不存在')
    museum.likes += 1
    saveMuseum(museum)
    return success(museum)
  }),

  http.post('/api/museums/:archiveId/candle', async ({ params }) => {
    const museum = findMuseum(params.archiveId as string)
    if (!museum) return notFound('数字馆不存在')
    museum.candles += 1
    saveMuseum(museum)
    return success(museum)
  }),

  // 献花计数
  http.post('/api/museums/:archiveId/flower', async ({ params }) => {
    const museum = findMuseum(params.archiveId as string)
    if (!museum) return notFound('数字馆不存在')
    museum.flowers += 1
    saveMuseum(museum)
    return success(museum)
  }),

  // 访问统计（含近 7 日访问趋势）
  http.get('/api/museums/:archiveId/stats', async ({ params }) => {
    // 与 GET /api/museums/:archiveId 并行请求时可能先到达，需幂等播种 demo 馆
    ensureDemoMuseum()
    const museum = findMuseum(params.archiveId as string)
    if (!museum) return notFound('数字馆不存在')
    const daily = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      views: Math.max(1, Math.round(museum.views / 7) + i),
      visitors: Math.max(1, Math.round(museum.visitors / 7) + i),
    }))
    return success({
      views: museum.views,
      visitors: museum.visitors,
      likes: museum.likes,
      candles: museum.candles,
      flowers: museum.flowers,
      daily,
    })
  }),

  // 留言列表
  http.get('/api/museums/:archiveId/messages', async ({ params }) => {
    const archiveId = params.archiveId as string
    let messages = getItem<MuseumMessage[]>(storeKeys.museumMessages, [])
    if (messages.length === 0) {
      messages = defaultMuseumMessages
      setItem(storeKeys.museumMessages, messages)
    }
    return success(messages.filter((m) => m.archiveId === archiveId))
  }),

  // 发表留言
  http.post('/api/museums/:archiveId/messages', async ({ params, request }) => {
    const user = getItem<{ id: string; nickname?: string } | null>(storeKeys.currentUser, null)
    if (!user) return unauthorized()
    const museum = findMuseum(params.archiveId as string)
    if (!museum) return notFound('数字馆不存在')
    const { content } = (await request.json()) as { content?: string }
    if (!content || !content.trim()) return fail('留言内容不能为空')
    const messages = getItem<MuseumMessage[]>(storeKeys.museumMessages, [])
    const message: MuseumMessage = {
      id: generateId(),
      archiveId: museum.archiveId,
      userNickname: user.nickname || '匿名访客',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    }
    messages.unshift(message)
    setItem(storeKeys.museumMessages, messages)
    return success(message, '留言成功')
  }),

  http.post('/api/museums/:archiveId/share', async ({ params }) => {
    const museum = findMuseum(params.archiveId as string)
    if (!museum) return notFound('数字馆不存在')
    return success({
      link: `/museum/${museum.id}`,
      qrCode: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg"><text>${museum.id}</text></svg>`)}`,
    })
  }),
]
