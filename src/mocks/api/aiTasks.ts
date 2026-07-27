import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import { defaultAITasks, defaultPromptTemplates, defaultQrCodes } from '../data/seed'
import { getQuestions, getSortedQuestions } from '../utils/questions'
import type { AITask, AITaskType, PromptTemplate, QrCodeRecord, Question } from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

function ensureAITasks(): AITask[] {
  const tasks = getItem<AITask[]>(storeKeys.aiTasks, [])
  if (tasks.length === 0) {
    setItem(storeKeys.aiTasks, defaultAITasks)
    return defaultAITasks
  }
  return tasks
}

function ensurePromptTemplates(): PromptTemplate[] {
  const templates = getItem<PromptTemplate[]>(storeKeys.promptTemplates, [])
  if (templates.length === 0) {
    setItem(storeKeys.promptTemplates, defaultPromptTemplates)
    return defaultPromptTemplates
  }
  return templates
}

function ensureQrCodes(): QrCodeRecord[] {
  const codes = getItem<QrCodeRecord[]>(storeKeys.qrCodes, [])
  if (codes.length === 0) {
    setItem(storeKeys.qrCodes, defaultQrCodes)
    return defaultQrCodes
  }
  return codes
}

export const aiTaskHandlers: HttpHandler[] = [
  // 任务列表（按类型/状态过滤）
  http.get('/api/admin/ai-tasks', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'all'
    const status = url.searchParams.get('status') || 'all'
    let tasks = ensureAITasks()
    if (type !== 'all') tasks = tasks.filter((t) => t.type === type)
    if (status !== 'all') tasks = tasks.filter((t) => t.status === status)
    return success(tasks)
  }),

  // Token 成本统计（按类型汇总）
  http.get('/api/admin/ai-tasks/token-stats', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const tasks = ensureAITasks()
    const statsMap = new Map<AITaskType, { type: AITaskType; taskCount: number; totalTokens: number }>()
    tasks.forEach((t) => {
      const stat = statsMap.get(t.type) || { type: t.type, taskCount: 0, totalTokens: 0 }
      stat.taskCount += 1
      stat.totalTokens += t.tokens
      statsMap.set(t.type, stat)
    })
    return success(Array.from(statsMap.values()))
  }),

  // 失败任务重试
  http.post('/api/admin/ai-tasks/:id/retry', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const tasks = ensureAITasks()
    const task = tasks.find((t) => t.id === params.id)
    if (!task) return notFound('任务不存在')
    if (task.status !== 'failed') return fail('仅失败任务可以重试')
    task.status = 'queued'
    task.failReason = undefined
    task.finishedAt = undefined
    task.createdAt = new Date().toISOString()
    setItem(storeKeys.aiTasks, tasks)
    return success(task, '任务已重新排队')
  }),

  // 提示词模板列表
  http.get('/api/admin/prompt-templates', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'all'
    let templates = ensurePromptTemplates()
    if (type !== 'all') templates = templates.filter((t) => t.type === type)
    return success(templates)
  }),

  // 提示词模板启用/停用
  http.patch('/api/admin/prompt-templates/:id/status', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { enabled } = (await request.json()) as { enabled?: boolean }
    if (typeof enabled !== 'boolean') return fail('参数错误')
    const templates = ensurePromptTemplates()
    const idx = templates.findIndex((t) => t.id === params.id)
    if (idx < 0) return notFound('模板不存在')
    templates[idx] = { ...templates[idx], enabled, updatedAt: new Date().toISOString() }
    setItem(storeKeys.promptTemplates, templates)
    return success(templates[idx], enabled ? '模板已启用' : '模板已停用')
  }),

  // 二维码列表
  http.get('/api/admin/qrcodes', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    return success(ensureQrCodes())
  }),

  // 二维码启用/停用
  http.patch('/api/admin/qrcodes/:id/status', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { status } = (await request.json()) as { status?: 'enabled' | 'disabled' }
    if (status !== 'enabled' && status !== 'disabled') return fail('参数错误')
    const codes = ensureQrCodes()
    const idx = codes.findIndex((c) => c.id === params.id)
    if (idx < 0) return notFound('二维码不存在')
    codes[idx] = { ...codes[idx], status }
    setItem(storeKeys.qrCodes, codes)
    return success(codes[idx], status === 'enabled' ? '二维码已启用' : '二维码已停用')
  }),

  // 采访题库列表
  http.get('/api/admin/questions', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    return success(getSortedQuestions())
  }),

  // 采访题库新增
  http.post('/api/admin/questions', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as Partial<Question>
    if (!body.category?.trim() || !body.title?.trim() || !body.question?.trim()) return fail('分类、标题、题干不能为空')
    const questions = getQuestions()
    const question: Question = {
      id: generateId(),
      category: body.category.trim(),
      title: body.title.trim(),
      question: body.question.trim(),
      order: Math.max(0, ...questions.map((q) => q.order)) + 1,
    }
    questions.push(question)
    setItem(storeKeys.questions, questions)
    return success(question, '题目已添加')
  }),

  // 采访题库编辑
  http.put('/api/admin/questions/:id', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const body = (await request.json()) as Partial<Question>
    if (!body.category?.trim() || !body.title?.trim() || !body.question?.trim()) return fail('分类、标题、题干不能为空')
    const questions = getQuestions()
    const idx = questions.findIndex((q) => q.id === params.id)
    if (idx < 0) return notFound('题目不存在')
    questions[idx] = {
      ...questions[idx],
      category: body.category.trim(),
      title: body.title.trim(),
      question: body.question.trim(),
      order: typeof body.order === 'number' ? body.order : questions[idx].order,
    }
    setItem(storeKeys.questions, questions)
    return success(questions[idx], '题目已更新')
  }),

  // 采访题库删除
  http.delete('/api/admin/questions/:id', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const questions = getQuestions()
    const idx = questions.findIndex((q) => q.id === params.id)
    if (idx < 0) return notFound('题目不存在')
    questions.splice(idx, 1)
    setItem(storeKeys.questions, questions)
    return success(null, '题目已删除')
  }),
]
