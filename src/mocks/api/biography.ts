import { http, type HttpHandler } from 'msw'
import { success, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import type { Biography, BiographyChapter, InterviewSession, Archive } from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

function findBiography(archiveId: string): Biography | undefined {
  const biographies = getItem<Biography[]>(storeKeys.biographies, [])
  return biographies.find(b => b.archiveId === archiveId)
}

function saveBiography(biography: Biography): void {
  const biographies = getItem<Biography[]>(storeKeys.biographies, [])
  const idx = biographies.findIndex(b => b.id === biography.id)
  if (idx >= 0) biographies[idx] = biography
  else biographies.push(biography)
  setItem(storeKeys.biographies, biographies)
}

function getArchiveName(archiveId: string): string {
  const archives = getItem<Archive[]>(storeKeys.archives, [])
  return archives.find(a => a.id === archiveId)?.name || '主人公'
}

function getInterviewAnswers(archiveId: string): string {
  const sessions = getItem<InterviewSession[]>(storeKeys.interviews, [])
  const session = sessions.find(s => s.archiveId === archiveId)
  if (!session || session.answers.length === 0) return ''
  return session.answers.map(a => `${a.category}：${a.answer}`).join('\n')
}

const defaultChapterTitles = [
  '前言',
  '童年记忆',
  '求学岁月',
  '工作经历',
  '创业之路',
  '家庭生活',
  '人生感悟',
  '后记',
]

function generateChapterContent(title: string, name: string, answers: string, style: string, wordCount: string): string {
  const isShort = wordCount === 'short'
  const paragraphs = isShort ? 2 : 4
  const styleText = style === 'warm' ? '温情怀念' : style === 'family' ? '家族传承' : '朴实纪实'
  let content = `「${title}」\n\n`
  content += `${name}的人生故事，以${styleText}的笔触徐徐展开。`
  if (answers) {
    content += `根据采访资料，我们整理出这段珍贵的回忆。\n\n`
  } else {
    content += `由于目前资料尚不完整，本章先以示例文本呈现，后续可补充真实经历后重新生成。\n\n`
  }
  for (let i = 0; i < paragraphs; i++) {
    content += `    第 ${i + 1} 段：这里将结合${name}的真实经历，呈现那个时代的生活细节与心路历程。`
    if (answers && i === 0) {
      content += `从采访记录中可以看到：${answers.slice(0, 60)}...`
    }
    content += `（此为 mock 仿真生成的示例正文，用于演示传记阅读效果。）\n\n`
  }
  return content.trim()
}

function generateGoldenQuotes(answers: string): string[] {
  if (!answers) return ['人生如逆旅，我亦是行人。', '家风正，则子孙兴。']
  return [
    '无论走到哪里，家永远是最温暖的港湾。',
    '做人要厚道，做事要认真。',
    '把平凡的日子过成诗，就是最大的成就。',
  ]
}

export const biographyHandlers: HttpHandler[] = [
  http.get('/api/biographies/:archiveId/outline', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const archiveId = params.archiveId as string
    return success({
      archiveId,
      title: `${getArchiveName(archiveId)}传记`,
      chapters: defaultChapterTitles.map((title, idx) => ({ id: `ch_${idx}`, order: idx, title })),
    })
  }),

  http.post('/api/biographies/:archiveId/generate', async ({ request, params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const archiveId = params.archiveId as string
    const { style = 'plain', wordCount = 'standard' } = await request.json() as { style?: string; wordCount?: string }
    const name = getArchiveName(archiveId)
    const answers = getInterviewAnswers(archiveId)

    const chapters: BiographyChapter[] = defaultChapterTitles.map((title, idx) => ({
      id: generateId(),
      order: idx,
      title,
      content: generateChapterContent(title, name, answers, style, wordCount),
      images: [],
    }))

    const biography: Biography = {
      id: generateId(),
      archiveId,
      title: `${name}传记`,
      style: style as any,
      wordCount: wordCount as any,
      chapters,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveBiography(biography)
    return success(biography, '传记生成成功')
  }),

  http.get('/api/biographies/:archiveId', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const biography = findBiography(params.archiveId as string)
    if (!biography) return notFound('传记不存在')
    return success(biography)
  }),

  http.put('/api/biographies/:archiveId/chapters/:chapterId', async ({ request, params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const biography = findBiography(params.archiveId as string)
    if (!biography) return notFound('传记不存在')
    const body = await request.json() as Partial<BiographyChapter>
    const chapter = biography.chapters.find(c => c.id === params.chapterId)
    if (!chapter) return notFound('章节不存在')
    Object.assign(chapter, body)
    biography.updatedAt = new Date().toISOString()
    saveBiography(biography)
    return success(biography)
  }),

  http.post('/api/biographies/:archiveId/chapters/:chapterIdOrTitle/regenerate', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const biography = findBiography(params.archiveId as string)
    if (!biography) return notFound('传记不存在')
    const key = params.chapterIdOrTitle as string
    const chapter = biography.chapters.find(c => c.id === key || c.title === key)
    if (!chapter) return notFound('章节不存在')
    const { style, wordCount } = biography
    const name = getArchiveName(params.archiveId as string)
    const answers = getInterviewAnswers(params.archiveId as string)
    chapter.content = generateChapterContent(chapter.title, name, answers, style, wordCount)
    biography.updatedAt = new Date().toISOString()
    saveBiography(biography)
    return success(biography)
  }),

  http.post('/api/biographies/:archiveId/finalize', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const biography = findBiography(params.archiveId as string)
    if (!biography) return notFound('传记不存在')
    biography.status = 'final'
    biography.updatedAt = new Date().toISOString()
    saveBiography(biography)
    return success(biography, '传记已定稿')
  }),

  http.get('/api/biographies/:archiveId/derivatives', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const sessions = getItem<InterviewSession[]>(storeKeys.interviews, [])
    const session = sessions.find(s => s.archiveId === params.archiveId)
    const answers = session?.answers || []
    return success({
      timeline: answers.map((a, idx) => ({
        year: 1960 + idx * 5,
        title: a.category,
        description: a.answer.slice(0, 100),
      })),
      quotes: generateGoldenQuotes(answers.map(a => a.answer).join('\n')),
      familyMotto: '忠厚传家久，诗书继世长。',
      messageToDescendants: '愿你们健康平安，做一个善良而有担当的人。',
    })
  }),
]
