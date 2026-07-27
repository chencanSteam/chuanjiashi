import { api } from './client'
import type { Museum, MuseumMessage, Biography, TimelineEvent, Material } from '../mocks/types'

/** 数字馆完整数据 */
export interface MuseumData {
  museum: Museum
  biography?: Biography
  timeline: TimelineEvent[]
  images: string[]
  honors: Material[]
}

/** 数字馆访问统计 */
export interface MuseumStats {
  views: number
  visitors: number
  likes: number
  candles: number
  flowers: number
  /** 近 7 日访问趋势 */
  daily: { date: string; views: number; visitors: number }[]
}

export const museumApi = {
  get: (archiveId: string) => api.get<MuseumData>(`/api/museums/${archiveId}`),
  update: (archiveId: string, data: Partial<Museum>) =>
    api.put<Museum>(`/api/museums/${archiveId}`, data),
  like: (archiveId: string) => api.post<Museum>(`/api/museums/${archiveId}/like`),
  candle: (archiveId: string) => api.post<Museum>(`/api/museums/${archiveId}/candle`),
  // 献花计数
  flower: (archiveId: string) => api.post<Museum>(`/api/museums/${archiveId}/flower`),
  share: (archiveId: string) =>
    api.post<{ link: string; qrCode: string }>(`/api/museums/${archiveId}/share`),
  // 访问统计
  stats: (archiveId: string) => api.get<MuseumStats>(`/api/museums/${archiveId}/stats`),
  // 留言列表
  messages: (archiveId: string) => api.get<MuseumMessage[]>(`/api/museums/${archiveId}/messages`),
  // 发表留言
  postMessage: (archiveId: string, content: string) =>
    api.post<MuseumMessage>(`/api/museums/${archiveId}/messages`, { content }),
}
