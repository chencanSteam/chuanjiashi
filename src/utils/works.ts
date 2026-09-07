export type WorkStatus = '采访进行中' | '传记修改中' | '已完成'

export interface BiographySnapshot {
  title?: string
  author?: string
  createdAt?: string
  completedAt?: string
  status?: 'draft' | 'final'
  chapters?: Array<{ title?: string; content?: string }>
}

function readSnapshot(archiveId: string): BiographySnapshot | null {
  try {
    const raw = localStorage.getItem(`cj_biography_${archiveId}`)
    return raw ? JSON.parse(raw) as BiographySnapshot : null
  } catch {
    return null
  }
}

export function getWorkStatus(archiveId: string): WorkStatus {
  const snapshot = readSnapshot(archiveId)
  if (!snapshot) return '采访进行中'
  if (snapshot.status === 'final' || snapshot.completedAt) return '已完成'
  // 已有内容但未定稿：修改中
  if (snapshot.status === 'draft' && snapshot.chapters?.some((chapter) => chapter.content?.trim())) {
    return '传记修改中'
  }
  // 兼容旧版本已经生成的非空传记快照
  if (snapshot.chapters?.some((chapter) => chapter.content?.trim())) {
    return '已完成'
  }
  return '采访进行中'
}

export function isWorkCompleted(archiveId: string): boolean {
  return getWorkStatus(archiveId) === '已完成'
}
