import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import { defaultQuestions } from '../data/seed'
import type { InterviewSession, Answer, TimelineEvent } from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

function getSessionByArchiveId(archiveId: string): InterviewSession | undefined {
  const sessions = getItem<InterviewSession[]>(storeKeys.interviews, [])
  return sessions.find(s => s.archiveId === archiveId)
}

function saveSession(session: InterviewSession): void {
  const sessions = getItem<InterviewSession[]>(storeKeys.interviews, [])
  const idx = sessions.findIndex(s => s.id === session.id)
  if (idx >= 0) sessions[idx] = session
  else sessions.push(session)
  setItem(storeKeys.interviews, sessions)
}

function buildFollowUp(answer: string, _question: string): string | null {
  const len = answer.trim().length
  if (len < 10) {
    return `您的回答有点简短，能多补充一些细节吗？比如当时有哪些人、发生了什么、您当时的感受如何？`
  }
  if (len < 30 && answer.includes('。')) {
    return `能否再具体讲讲这件事对您后来的人生有什么影响？`
  }
  return null
}

function extractEvents(archiveId: string, answers: Answer[]): TimelineEvent[] {
  const events: TimelineEvent[] = []
  answers.forEach((ans, idx) => {
    if (ans.answer.length < 20) return
    const yearMatch = ans.answer.match(/(\d{4})\s*年/)
    const year = yearMatch ? parseInt(yearMatch[1]) : 1960 + idx * 5
    events.push({
      id: generateId(),
      archiveId,
      year,
      title: ans.category,
      description: ans.answer.slice(0, 120) + (ans.answer.length > 120 ? '...' : ''),
      category: ans.category,
      images: [],
    })
  })
  return events
}

export const interviewHandlers: HttpHandler[] = [
  http.get('/api/interviews/:archiveId/session', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    let session = getSessionByArchiveId(params.archiveId as string)
    if (!session) {
      session = {
        id: generateId(),
        archiveId: params.archiveId as string,
        answers: [],
        currentCategory: defaultQuestions[0].category,
        currentQuestionIndex: 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      saveSession(session)
    }
    const question = defaultQuestions[session.currentQuestionIndex]
    return success({ session, question })
  }),

  http.post('/api/interviews/:archiveId/answer', async ({ request, params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const archiveId = params.archiveId as string
    let session = getSessionByArchiveId(archiveId)
    if (!session) return notFound('采访会话不存在')

    const { answer, questionId } = await request.json() as { answer?: string; questionId?: string }
    if (!answer || !questionId) return fail('参数错误')

    const question = defaultQuestions.find(q => q.id === questionId)
    const category = question?.category || '人生经历'

    const existingIdx = session.answers.findIndex(a => a.questionId === questionId)
    if (existingIdx >= 0) {
      session.answers[existingIdx].answer = answer
    } else {
      session.answers.push({ questionId, category, answer })
    }

    const followUp = buildFollowUp(answer, question?.question || '')
    if (!followUp) {
      session.currentQuestionIndex = Math.min(session.currentQuestionIndex + 1, defaultQuestions.length - 1)
      session.status = session.currentQuestionIndex >= defaultQuestions.length - 1 ? 'completed' : 'in_progress'
    }
    session.updatedAt = new Date().toISOString()
    saveSession(session)

    const nextQuestion = followUp && question
      ? { id: questionId + '_follow', category: question.category, title: '补充提问', question: followUp, order: question.order }
      : defaultQuestions[session.currentQuestionIndex]

    return success({ session, followUp, nextQuestion })
  }),

  http.post('/api/interviews/:archiveId/complete', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const archiveId = params.archiveId as string
    let session = getSessionByArchiveId(archiveId)
    if (!session) return notFound('采访会话不存在')
    session.status = 'completed'
    session.updatedAt = new Date().toISOString()
    saveSession(session)

    const events = extractEvents(archiveId, session.answers)
    const timeline = getItem<TimelineEvent[]>(storeKeys.timeline, [])
    setItem(storeKeys.timeline, [...timeline, ...events])

    return success({ session, extractedEvents: events })
  }),

  http.post('/api/interviews/:archiveId/review', async ({ request, params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const archiveId = params.archiveId as string
    const { events } = await request.json() as { events?: TimelineEvent[] }
    if (!events) return fail('参数错误')
    const timeline = getItem<TimelineEvent[]>(storeKeys.timeline, [])
    const filtered = timeline.filter(e => e.archiveId !== archiveId)
    setItem(storeKeys.timeline, [...filtered, ...events])
    return success(events)
  }),
]
