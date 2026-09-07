import { loadJson, saveJson, type ChapterData } from './aiMock'
import { loadCollaborators, addCollaborator } from './interviewCollaboration'

/** 演示用协助人账号（登录页"协助人端"入口使用该账号） */
export const COLLAB_DEMO_PHONE = '13900001111'
export const COLLAB_DEMO_NAME = '李秀英'

const DEMO_ARCHIVE_ID = 'default'

const DEMO_COLLAB_CHAPTERS: Array<Pick<ChapterData, 'title' | 'content'>> = [
  {
    title: '故里童年 · 初心萌芽',
    content: '写下父亲的故事，是希望把这一生的风雨与温暖留给后人。\n\n他常说，人这一辈子，靠的是双手和良心。',
  },
  {
    title: '求学成长 · 岁月积淀',
    content: '张明远 1958 年出生于苏州平江路的一座老宅。清晨的巷口总有卖桂花糖粥的吆喝声，那是他童年最深刻的记忆。\n\n父亲在绸缎庄做账房先生，母亲在家操持家务，日子清苦却安稳。',
  },
]

/**
 * 协助人演示数据：把演示协助人加入示例档案的协作者名单，
 * 并准备两章示例传记内容 + 一条待处理的修改建议（仅在无数据时写入，不覆盖用户已有内容）
 */
export function ensureCollabDemoData() {
  const archives = loadJson<Array<{ id: string }>>('cj_archives', [])
  if (!archives.some((a) => a.id === DEMO_ARCHIVE_ID)) return

  if (!loadCollaborators(DEMO_ARCHIVE_ID).some((c) => c.name === COLLAB_DEMO_NAME)) {
    addCollaborator(DEMO_ARCHIVE_ID, { name: COLLAB_DEMO_NAME, relation: '女儿', phone: COLLAB_DEMO_PHONE })
  }

  const chaptersKey = `cj_biography_chapters_${DEMO_ARCHIVE_ID}`
  const existing = loadJson<ChapterData[] | null>(chaptersKey, null)
  const hasContent = existing?.some((c) => c.content?.trim())
  if (hasContent) return

  const now = new Date().toLocaleString('zh-CN')
  const chapters: ChapterData[] = DEMO_COLLAB_CHAPTERS.map((c) => ({
    title: c.title,
    content: c.content,
    materials: 2,
    status: 'edited',
    updatedAt: now,
  }))
  saveJson(chaptersKey, chapters)

  if (loadSuggestions(DEMO_ARCHIVE_ID).length === 0) {
    saveSuggestions(DEMO_ARCHIVE_ID, [
      makeSuggestion({
        chapterIndex: 1,
        chapterTitle: '求学成长 · 岁月积淀',
        sentenceIndex: 1,
        original: '清晨的巷口总有卖桂花糖粥的吆喝声，那是他童年最深刻的记忆。',
        suggested: '清晨的巷口总有卖桂花糖粥的吆喝声，那声音穿过薄雾，是他童年最温暖的记忆。',
        note: '加了一点画面感，供爸爸参考',
        authorName: COLLAB_DEMO_NAME,
      }),
    ])
  }
}

/** 传记协作修改：句级修改建议的读写（纯 localStorage，与采访协作者体系配套） */

export interface EditSuggestion {
  id: string
  chapterIndex: number
  chapterTitle: string
  /** 该章第几句（按 splitSentences 切分） */
  sentenceIndex: number
  /** 提交建议时的原句快照 */
  original: string
  /** 建议改成的句子 */
  suggested: string
  /** 修改说明（选填） */
  note?: string
  authorName: string
  /** 用稳定协作者身份区分同名协助人，旧建议无此字段时按 authorName 兼容 */
  collaboratorId?: string
  authorPhone?: string
  status: 'pending' | 'accepted' | 'rejected' | 'outdated'
  createdAt: string
  resolvedAt?: string
}

function suggestionsKey(archiveId: string) {
  return `cj_biography_suggestions_${archiveId}`
}

export function loadSuggestions(archiveId: string): EditSuggestion[] {
  return loadJson<EditSuggestion[]>(suggestionsKey(archiveId), [])
}

export function saveSuggestions(archiveId: string, list: EditSuggestion[]) {
  saveJson(suggestionsKey(archiveId), list)
}

export function makeSuggestion(input: Omit<EditSuggestion, 'id' | 'status' | 'createdAt'>): EditSuggestion {
  return {
    ...input,
    id: `sug_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
}
