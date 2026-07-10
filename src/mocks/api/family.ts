import { http, type HttpHandler } from 'msw'
import { success, notFound } from '../utils/response'
import { getItem, setItem, generateId } from '../utils/store'
import type { FamilyMember, FamilyRelation, Place } from '../types'

const PREFIX = 'cj_mock_'
function membersKey(archiveId: string) {
  return `${PREFIX}family_members_${archiveId}`
}
function relationsKey(archiveId: string) {
  return `${PREFIX}family_relations_${archiveId}`
}
function placesKey(archiveId: string) {
  return `${PREFIX}places_${archiveId}`
}

const defaultMembers: FamilyMember[] = [
  { id: 'm1', name: '张明远', role: '我', tag: '家主', gen: '第1代', phone: '138****1234', email: 'zhang@example.com', location: '江苏省苏州市', birth: '1975-08-15', bio: '张氏家庭现任家主，明远机械有限公司创始人，致力于家族档案数字化与家风传承。' },
  { id: 'm2', name: '李婉如', role: '配偶', gen: '第1代', phone: '139****5678', email: 'li@example.com', location: '江苏省苏州市', birth: '1978-03-22', bio: '家庭主妇，热心家族公益事业，擅长整理家族老照片与口述史资料。' },
  { id: 'm3', name: '张子涵', role: '长子', gen: '第2代', phone: '137****9012', email: 'zihan@example.com', location: '上海市', birth: '2003-05-12', bio: '在校大学生，机械工程专业，积极参与家族故事共创与数字纪念馆建设。' },
  { id: 'm4', name: '张若曦', role: '儿媳', gen: '第2代', phone: '136****3456', email: 'ruoxi@example.com', location: '上海市', birth: '2006-11-08', bio: '设计师，负责家风馆视觉设计与家族相册整理。' },
  { id: 'm5', name: '张浩然', role: '孙子', gen: '第3代', phone: '135****7890', email: 'haoran@example.com', location: '江苏省苏州市', birth: '2009-09-01', bio: '初中生，喜欢听爷爷讲家族故事，是家族未来的传承希望。' },
  { id: 'm6', name: '张志远', role: '祖父', tag: '已故', gen: '第1代', phone: '-', email: '-', location: '江苏省苏州市', birth: '1920-02-10', bio: '家族始祖，从教40年，一生勤勉正直，为家族奠定了重视教育的家风。' },
  { id: 'm7', name: '王淑兰', role: '祖母', tag: '已故', gen: '第1代', phone: '-', email: '-', location: '江苏省苏州市', birth: '1923-06-18', bio: '家族始祖配偶，擅长苏绣与烹饪，奶奶的拿手菜是家族共同的记忆。' },
  { id: 'm8', name: '张建国', role: '父亲', gen: '第2代' },
  { id: 'm9', name: '李秀英', role: '母亲', gen: '第2代' },
  { id: 'm10', name: '张建军', role: '叔叔', gen: '第2代' },
  { id: 'm11', name: '刘芳', role: '婶婶', gen: '第2代' },
  { id: 'm12', name: '张伟', role: '堂兄', gen: '第3代' },
  { id: 'm13', name: '陈静', role: '堂嫂', gen: '第3代' },
]

const defaultRelations: FamilyRelation[] = [
  { id: 'r1', from: '张明远', to: '李婉如', relation: '配偶' },
  { id: 'r2', from: '张明远', to: '张子涵', relation: '父子' },
  { id: 'r3', from: '张明远', to: '张浩然', relation: '祖孙' },
  { id: 'r4', from: '张建国', to: '张明远', relation: '父子' },
  { id: 'r5', from: '张志远', to: '张建国', relation: '父子' },
  { id: 'r6', from: '张建军', to: '刘芳', relation: '配偶' },
  { id: 'r7', from: '张子涵', to: '张若曦', relation: '配偶' },
]

const defaultPlaces: Place[] = [
  { id: 'p1', place: '江苏苏州', year: '1958', event: '出生、成长', left: 72, top: 58, count: 1 },
  { id: 'p2', place: '南京', year: '1984', event: '进修企业管理', left: 68, top: 56, count: 1 },
  { id: 'p3', place: '上海', year: '1992', event: '拓展业务', left: 76, top: 60, count: 1 },
  { id: 'p4', place: '广东深圳', year: '2008', event: '分公司成立', left: 66, top: 78, count: 1 },
]

function loadMembers(archiveId: string): FamilyMember[] {
  return getItem<FamilyMember[]>(membersKey(archiveId), archiveId === 'default' ? defaultMembers : [])
}

function saveMembers(archiveId: string, members: FamilyMember[]): void {
  setItem(membersKey(archiveId), members)
}

function loadRelations(archiveId: string): FamilyRelation[] {
  return getItem<FamilyRelation[]>(relationsKey(archiveId), archiveId === 'default' ? defaultRelations : [])
}

function saveRelations(archiveId: string, relations: FamilyRelation[]): void {
  setItem(relationsKey(archiveId), relations)
}

function loadPlaces(archiveId: string): Place[] {
  return getItem<Place[]>(placesKey(archiveId), archiveId === 'default' ? defaultPlaces : [])
}

function savePlaces(archiveId: string, places: Place[]): void {
  setItem(placesKey(archiveId), places)
}

function ensureMemberExists(archiveId: string, name: string, role = '家庭成员') {
  const members = loadMembers(archiveId)
  if (members.some((m) => m.name === name)) return
  const next: FamilyMember = {
    id: generateId(),
    name,
    role,
    gen: '其他',
  }
  saveMembers(archiveId, [...members, next])
}

export const familyHandlers: HttpHandler[] = [
  // 家庭成员
  http.get('/api/families/:archiveId/members', async ({ params }) => {
    const archiveId = params.archiveId as string
    return success(loadMembers(archiveId))
  }),

  http.post('/api/families/:archiveId/members', async ({ params, request }) => {
    const archiveId = params.archiveId as string
    const body = (await request.json()) as Partial<FamilyMember>
    const members = loadMembers(archiveId)
    const id = body.id || generateId()
    const next: FamilyMember = { ...body, id } as FamilyMember
    const index = members.findIndex((m) => m.id === id || m.name === next.name)
    const updated = index >= 0
      ? members.map((m, i) => (i === index ? { ...m, ...next, id: m.id || id } : m))
      : [...members, next]
    saveMembers(archiveId, updated)
    return success(next)
  }),

  http.put('/api/families/:archiveId/members/:id', async ({ params, request }) => {
    const archiveId = params.archiveId as string
    const id = params.id as string
    const body = (await request.json()) as Partial<FamilyMember>
    const members = loadMembers(archiveId)
    const idx = members.findIndex((m) => m.id === id)
    if (idx < 0) return notFound('成员不存在')
    members[idx] = { ...members[idx], ...body, id }
    saveMembers(archiveId, members)
    return success(members[idx])
  }),

  http.delete('/api/families/:archiveId/members/:id', async ({ params }) => {
    const archiveId = params.archiveId as string
    const id = params.id as string
    const members = loadMembers(archiveId)
    const target = members.find((m) => m.id === id)
    if (!target) return notFound('成员不存在')
    const nextMembers = members.filter((m) => m.id !== id)
    saveMembers(archiveId, nextMembers)
    const relations = loadRelations(archiveId)
    const nextRelations = relations.filter((r) => r.from !== target.name && r.to !== target.name)
    saveRelations(archiveId, nextRelations)
    return success(null, '删除成功')
  }),

  // 家庭关系
  http.get('/api/families/:archiveId/relations', async ({ params }) => {
    const archiveId = params.archiveId as string
    return success(loadRelations(archiveId))
  }),

  http.post('/api/families/:archiveId/relations', async ({ params, request }) => {
    const archiveId = params.archiveId as string
    const body = (await request.json()) as Omit<FamilyRelation, 'id'>
    const relations = loadRelations(archiveId)
    const next: FamilyRelation = { ...body, id: generateId() }
    saveRelations(archiveId, [...relations, next])
    return success(next)
  }),

  http.delete('/api/families/:archiveId/relations/:id', async ({ params }) => {
    const archiveId = params.archiveId as string
    const id = params.id as string
    const relations = loadRelations(archiveId)
    saveRelations(archiveId, relations.filter((r) => r.id !== id))
    return success(null, '删除成功')
  }),

  // 地点足迹
  http.get('/api/families/:archiveId/places', async ({ params }) => {
    const archiveId = params.archiveId as string
    return success(loadPlaces(archiveId))
  }),

  http.post('/api/families/:archiveId/places', async ({ params, request }) => {
    const archiveId = params.archiveId as string
    const body = (await request.json()) as Omit<Place, 'id'>
    const places = loadPlaces(archiveId)
    const id = generateId()
    const existing = places.find((p) => p.place === body.place)
    let next: Place
    if (existing) {
      next = { ...existing, count: (existing.count || 1) + 1 }
      savePlaces(archiveId, places.map((p) => (p.id === existing.id ? next : p)))
    } else {
      next = { ...body, id, count: body.count || 1 }
      savePlaces(archiveId, [next, ...places])
    }
    return success(next)
  }),

  http.put('/api/families/:archiveId/places/:id', async ({ params, request }) => {
    const archiveId = params.archiveId as string
    const id = params.id as string
    const body = (await request.json()) as Partial<Place>
    const places = loadPlaces(archiveId)
    const idx = places.findIndex((p) => p.id === id)
    if (idx < 0) return notFound('地点不存在')
    places[idx] = { ...places[idx], ...body, id }
    savePlaces(archiveId, places)
    return success(places[idx])
  }),

  http.delete('/api/families/:archiveId/places/:id', async ({ params }) => {
    const archiveId = params.archiveId as string
    const id = params.id as string
    const places = loadPlaces(archiveId)
    savePlaces(archiveId, places.filter((p) => p.id !== id))
    return success(null, '删除成功')
  }),

  // 同步地点（从文本提取）
  http.post('/api/families/:archiveId/sync-place', async ({ params, request }) => {
    const archiveId = params.archiveId as string
    const { text, year, event } = (await request.json()) as { text?: string; year?: string; event?: string }
    if (!text?.trim()) return success(null)
    const place = text.trim()
    const places = loadPlaces(archiveId)
    const existing = places.find((p) => p.place === place)
    let next: Place
    if (existing) {
      next = { ...existing, count: (existing.count || 1) + 1 }
      savePlaces(archiveId, places.map((p) => (p.id === existing.id ? next : p)))
    } else {
      next = {
        id: generateId(),
        place,
        year: year || '',
        event: event || '相关事件',
        left: 40 + Math.round(Math.random() * 40),
        top: 30 + Math.round(Math.random() * 45),
        count: 1,
      }
      savePlaces(archiveId, [next, ...places])
    }
    return success(next)
  }),

  // 同步关系（从事件文本提取）
  http.post('/api/families/:archiveId/sync-relation', async ({ params, request }) => {
    const archiveId = params.archiveId as string
    const { subjectName, eventTitle, eventSummary } = (await request.json()) as {
      subjectName?: string
      eventTitle?: string
      eventSummary?: string
    }
    if (!subjectName || !eventTitle) return success({ added: false })

    const text = `${eventTitle} ${eventSummary || ''}`
    const relationPatterns = [
      { pattern: /(?:与|和)([^，,。]{2,8}?)(?:女士|先生|妻子|丈夫|配偶)?(?:结为夫妻|结婚|成婚|成亲)/, relation: '配偶' },
      { pattern: /(?:妻子|配偶|夫人|老婆|丈夫|老公)(?:是|为)([^，,。]{2,8})/, relation: '配偶' },
      { pattern: /(?:儿子|长子|次子)([^，,。]{2,8})(?:出生|出生|出生|出生|出生)/, relation: '父子' },
      { pattern: /(?:女儿|长女|次女)([^，,。]{2,8})(?:出生|出生|出生|出生|出生)/, relation: '父女' },
      { pattern: /父亲(?:是|为)([^，,。]{2,8})/, relation: '父亲' },
      { pattern: /母亲(?:是|为)([^，,。]{2,8})/, relation: '母亲' },
    ]

    const relations = loadRelations(archiveId)
    let added = false

    relationPatterns.forEach(({ pattern, relation }) => {
      const match = text.match(pattern)
      if (match && match[1]) {
        const name = match[1].trim()
        if (!name) return
        ensureMemberExists(archiveId, name, relation.includes('父亲') || relation.includes('母亲') ? '长辈' : '家庭成员')
        const exists = relations.some(
          (r) =>
            (r.from === subjectName && r.to === name) ||
            (r.from === name && r.to === subjectName)
        )
        if (!exists) {
          relations.push({ id: generateId(), from: subjectName, to: name, relation })
          added = true
        }
      }
    })

    if (added) saveRelations(archiveId, relations)
    return success({ added })
  }),
]
