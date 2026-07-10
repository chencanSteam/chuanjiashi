import { http, type HttpHandler } from 'msw'
import { success, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import type { Museum, Biography, TimelineEvent, Material } from '../types'

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

export const museumHandlers: HttpHandler[] = [
  http.get('/api/museums/:archiveId', async ({ params }) => {
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

  http.post('/api/museums/:archiveId/share', async ({ params }) => {
    const museum = findMuseum(params.archiveId as string)
    if (!museum) return notFound('数字馆不存在')
    return success({
      link: `/museum/${museum.id}`,
      qrCode: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg"><text>${museum.id}</text></svg>`)}`,
    })
  }),
]
