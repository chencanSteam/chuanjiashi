import { api } from './client'
import type { AITask, AITaskType, PromptTemplate, QrCodeRecord, Question } from '../mocks/types'

/** 按类型汇总的 Token 成本统计 */
export interface TokenCostStat {
  type: AITaskType
  taskCount: number
  totalTokens: number
}

export const aiTaskApi = {
  // 任务列表（按类型/状态过滤）
  list: (params?: { type?: AITask['type'] | 'all'; status?: AITask['status'] | 'all' }) =>
    api.get<AITask[]>(`/api/admin/ai-tasks?${new URLSearchParams(params || {}).toString()}`),
  // 失败任务重试
  retry: (id: string) => api.post<AITask>(`/api/admin/ai-tasks/${id}/retry`),
  // 提示词模板列表
  templates: (params?: { type?: PromptTemplate['type'] | 'all' }) =>
    api.get<PromptTemplate[]>(`/api/admin/prompt-templates?${new URLSearchParams(params || {}).toString()}`),
  // 提示词模板启用/停用
  updateTemplateStatus: (id: string, enabled: boolean) =>
    api.patch<PromptTemplate>(`/api/admin/prompt-templates/${id}/status`, { enabled }),
  // Token 成本统计（按类型汇总）
  tokenStats: () => api.get<TokenCostStat[]>('/api/admin/ai-tasks/token-stats'),
  // 二维码列表
  qrCodes: () => api.get<QrCodeRecord[]>('/api/admin/qrcodes'),
  // 二维码启用/停用
  updateQrCodeStatus: (id: string, status: 'enabled' | 'disabled') =>
    api.patch<QrCodeRecord>(`/api/admin/qrcodes/${id}/status`, { status }),
  // 采访题库
  questions: () => api.get<Question[]>('/api/admin/questions'),
  createQuestion: (data: Pick<Question, 'category' | 'title' | 'question'>) =>
    api.post<Question>('/api/admin/questions', data),
  updateQuestion: (id: string, data: Partial<Question>) =>
    api.put<Question>(`/api/admin/questions/${id}`, data),
  deleteQuestion: (id: string) => api.delete<null>(`/api/admin/questions/${id}`),
}
