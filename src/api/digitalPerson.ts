import { api } from './client'
import type { DigitalPerson } from '../mocks/types'

export interface ChatMessage {
  role: 'user' | 'ai'
  content: string
  source?: string
  time: string
}

export const digitalPersonApi = {
  get: (archiveId: string) => api.get<{ person: DigitalPerson; dialogue: ChatMessage[] }>(`/api/digital-persons/${archiveId}`),
  build: (archiveId: string) => api.post<{ person: DigitalPerson; knowledgeSize: number }>(`/api/digital-persons/${archiveId}/build`),
  chat: (archiveId: string, question: string) =>
    api.post<{ answer: string; source?: string; dialogue: ChatMessage[] }>(`/api/digital-persons/${archiveId}/chat`, { question }),
}
