import { api } from './client'
import type { FamilyMember, FamilyRelation, Place } from '../mocks/types'

export const familyApi = {
  // 家庭成员
  members: (archiveId: string) => api.get<FamilyMember[]>(`/api/families/${archiveId}/members`),
  addOrUpdateMember: (archiveId: string, member: Partial<FamilyMember>) =>
    api.post<FamilyMember>(`/api/families/${archiveId}/members`, member),
  updateMember: (archiveId: string, id: string, member: Partial<FamilyMember>) =>
    api.put<FamilyMember>(`/api/families/${archiveId}/members/${id}`, member),
  removeMember: (archiveId: string, id: string) => api.delete<null>(`/api/families/${archiveId}/members/${id}`),

  // 家庭关系
  relations: (archiveId: string) => api.get<FamilyRelation[]>(`/api/families/${archiveId}/relations`),
  addRelation: (archiveId: string, relation: Omit<FamilyRelation, 'id'>) =>
    api.post<FamilyRelation>(`/api/families/${archiveId}/relations`, relation),
  removeRelation: (archiveId: string, id: string) => api.delete<null>(`/api/families/${archiveId}/relations/${id}`),

  // 地点足迹
  places: (archiveId: string) => api.get<Place[]>(`/api/families/${archiveId}/places`),
  addPlace: (archiveId: string, place: Omit<Place, 'id'>) =>
    api.post<Place>(`/api/families/${archiveId}/places`, place),
  updatePlace: (archiveId: string, id: string, place: Partial<Place>) =>
    api.put<Place>(`/api/families/${archiveId}/places/${id}`, place),
  removePlace: (archiveId: string, id: string) => api.delete<null>(`/api/families/${archiveId}/places/${id}`),

  // 同步
  syncPlace: (archiveId: string, text: string, year?: string, event?: string) =>
    api.post<Place | null>(`/api/families/${archiveId}/sync-place`, { text, year, event }),
  syncRelation: (archiveId: string, subjectName: string, eventTitle: string, eventSummary?: string) =>
    api.post<{ added: boolean }>(`/api/families/${archiveId}/sync-relation`, { subjectName, eventTitle, eventSummary }),
}
