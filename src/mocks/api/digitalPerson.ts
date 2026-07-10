import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import type { DigitalPerson, Biography, InterviewSession } from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

function findDigitalPerson(archiveId: string): DigitalPerson | undefined {
  const persons = getItem<DigitalPerson[]>(storeKeys.digitalPersons, [])
  return persons.find(p => p.archiveId === archiveId)
}

function saveDigitalPerson(person: DigitalPerson): void {
  const persons = getItem<DigitalPerson[]>(storeKeys.digitalPersons, [])
  const idx = persons.findIndex(p => p.id === person.id)
  if (idx >= 0) persons[idx] = person
  else persons.push(person)
  setItem(storeKeys.digitalPersons, persons)
}

function buildKnowledge(archiveId: string): string {
  const biographies = getItem<Biography[]>(storeKeys.biographies, [])
  const biography = biographies.find(b => b.archiveId === archiveId)
  const sessions = getItem<InterviewSession[]>(storeKeys.interviews, [])
  const session = sessions.find(s => s.archiveId === archiveId)
  const parts: string[] = []
  if (biography) {
    parts.push(biography.chapters.map(c => c.content).join('\n\n'))
  }
  if (session) {
    parts.push(session.answers.map(a => `${a.category}：${a.answer}`).join('\n'))
  }
  return parts.join('\n\n')
}

function answerQuestion(question: string, knowledge: string, name: string): { answer: string; source?: string } {
  const lower = question.toLowerCase()
  if (lower.includes('你好') || lower.includes('是谁')) {
    return { answer: `你好，我是${name}的数字人。你可以问我关于我的经历、家庭、事业等问题。` }
  }
  if (lower.includes('童年') || lower.includes('小时候')) {
    return { answer: `关于我的童年，资料里这样记录：${knowledge.slice(0, 80)}...`, source: '采访资料' }
  }
  if (lower.includes('家庭') || lower.includes('家')) {
    return { answer: '家庭对我来说是最重要的港湾。我很珍惜和家人在一起的时光。', source: '家风传承' }
  }
  if (lower.includes('事业') || lower.includes('工作')) {
    return { answer: '我一生从事过不少工作，每一段经历都让我成长。你希望我详细讲讲哪一段？', source: '事业经历' }
  }
  if (lower.includes('家训') || lower.includes('家风')) {
    return { answer: '我们家的家训是：忠厚传家久，诗书继世长。', source: '家风传承' }
  }
  if (knowledge.length > 0) {
    return { answer: `根据我的资料，我想这样回答你：${knowledge.slice(0, 100)}...（这只是 mock 仿真回复）`, source: '传记资料' }
  }
  return { answer: '关于这个问题，我目前的资料还不够完整，无法给出准确的回答。' }
}

const sessionsKey = `${storeKeys.sessions}_dp`

function getDialogue(archiveId: string): { role: 'user' | 'ai'; content: string; source?: string; time: string }[] {
  const all = getItem<Record<string, any[]>>(sessionsKey, {})
  return all[archiveId] || []
}

function saveDialogue(archiveId: string, dialogue: any[]): void {
  const all = getItem<Record<string, any[]>>(sessionsKey, {})
  all[archiveId] = dialogue
  setItem(sessionsKey, all)
}

export const digitalPersonHandlers: HttpHandler[] = [
  http.get('/api/digital-persons/:archiveId', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const archiveId = params.archiveId as string
    let person = findDigitalPerson(archiveId)
    if (!person) {
      person = {
        id: generateId(),
        archiveId,
        avatar: '',
        knowledgeBaseReady: false,
        createdAt: new Date().toISOString(),
      }
      saveDigitalPerson(person)
    }
    return success({ person, dialogue: getDialogue(archiveId) })
  }),

  http.post('/api/digital-persons/:archiveId/build', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const archiveId = params.archiveId as string
    let person = findDigitalPerson(archiveId)
    if (!person) {
      person = {
        id: generateId(),
        archiveId,
        avatar: '',
        knowledgeBaseReady: false,
        createdAt: new Date().toISOString(),
      }
    }
    person.knowledgeBaseReady = true
    saveDigitalPerson(person)
    return success({ person, knowledgeSize: buildKnowledge(archiveId).length }, '数字人知识库构建完成')
  }),

  http.post('/api/digital-persons/:archiveId/chat', async ({ request, params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const archiveId = params.archiveId as string
    const person = findDigitalPerson(archiveId)
    if (!person) return notFound('数字人不存在')
    const { question } = await request.json() as { question?: string }
    if (!question) return fail('请输入问题')

    const biographies = getItem<Biography[]>(storeKeys.biographies, [])
    const biography = biographies.find(b => b.archiveId === archiveId)
    const name = biography?.title?.replace('传记', '') || '主人公'
    const knowledge = buildKnowledge(archiveId)

    const dialogue = getDialogue(archiveId)
    dialogue.push({ role: 'user', content: question, time: new Date().toISOString() })

    const { answer, source } = answerQuestion(question, knowledge, name)
    dialogue.push({ role: 'ai', content: answer, source, time: new Date().toISOString() })
    saveDialogue(archiveId, dialogue)

    return success({ answer, source, dialogue })
  }),
]
