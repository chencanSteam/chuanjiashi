import { api } from './client'
import type { InterviewSession, TimelineEvent } from '../mocks/types'

export const interviewApi = {
  session: (archiveId: string) => api.get<{ session: InterviewSession; question: any }>(`/api/interviews/${archiveId}/session`),
  answer: (archiveId: string, questionId: string, answer: string) =>
    api.post<{ session: InterviewSession; followUp: string | null; nextQuestion: any }>(`/api/interviews/${archiveId}/answer`, { questionId, answer }),
  complete: (archiveId: string) =>
    api.post<{ session: InterviewSession; extractedEvents: TimelineEvent[] }>(`/api/interviews/${archiveId}/complete`),
  review: (archiveId: string, events: TimelineEvent[]) =>
    api.post<TimelineEvent[]>(`/api/interviews/${archiveId}/review`, { events }),
}
