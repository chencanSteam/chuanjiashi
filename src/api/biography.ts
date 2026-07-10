import { api } from './client'
import type { Biography, BiographyChapter } from '../mocks/types'

export const biographyApi = {
  outline: (archiveId: string) => api.get('/api/biographies/:id/outline'.replace(':id', archiveId)),
  generate: (archiveId: string, style?: string, wordCount?: string) =>
    api.post<Biography>('/api/biographies/:id/generate'.replace(':id', archiveId), { style, wordCount }),
  get: (archiveId: string) => api.get<Biography>('/api/biographies/:id'.replace(':id', archiveId)),
  updateChapter: (archiveId: string, chapterId: string, data: Partial<BiographyChapter>) =>
    api.put<Biography>(`/api/biographies/${archiveId}/chapters/${chapterId}`, data),
  regenerateChapter: (archiveId: string, chapterIdOrTitle: string) =>
    api.post<Biography>(`/api/biographies/${archiveId}/chapters/${encodeURIComponent(chapterIdOrTitle)}/regenerate`),
  finalize: (archiveId: string) => api.post<Biography>(`/api/biographies/${archiveId}/finalize`),
  derivatives: (archiveId: string) => api.get('/api/biographies/:id/derivatives'.replace(':id', archiveId)),
}
