import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import { defaultRefundReasonOptions } from '../data/seed'
import type { RefundReasonOption } from '../types'

function getCurrentUser(): { id: string } | null {
  return getItem<{ id: string } | null>(storeKeys.currentUser, null)
}

function ensureReasons(): RefundReasonOption[] {
  const stored = getItem<RefundReasonOption[]>(storeKeys.refundReasons, [])
  if (stored.length === 0) {
    setItem(storeKeys.refundReasons, defaultRefundReasonOptions)
    return [...defaultRefundReasonOptions]
  }
  const other = stored.find((item) => item.isOther)
  if (!other) {
    const now = new Date().toISOString()
    stored.push({ ...defaultRefundReasonOptions[defaultRefundReasonOptions.length - 1], order: stored.length + 1, createdAt: now, updatedAt: now })
  } else {
    other.enabled = true
    other.isOther = true
  }
  stored.sort((a, b) => a.order - b.order).forEach((item, index) => { item.order = index + 1 })
  setItem(storeKeys.refundReasons, stored)
  return stored
}

function saveReasons(reasons: RefundReasonOption[]) {
  setItem(storeKeys.refundReasons, reasons)
}

function validateLabel(label: unknown, reasons: RefundReasonOption[], currentId?: string): string | null {
  if (typeof label !== 'string' || !label.trim()) return '请填写退款原因'
  if (label.trim().length > 50) return '退款原因不能超过 50 个字'
  if (reasons.some((item) => item.id !== currentId && item.label.trim().toLowerCase() === label.trim().toLowerCase())) return '退款原因不能重复'
  return null
}

export function getRefundReasonOptions(enabledOnly = false): RefundReasonOption[] {
  const reasons = ensureReasons()
  return (enabledOnly ? reasons.filter((item) => item.enabled) : reasons).sort((a, b) => a.order - b.order)
}

export const refundReasonHandlers: HttpHandler[] = [
  http.get('/api/refund-reasons', async () => {
    if (!getCurrentUser()) return unauthorized()
    return success(getRefundReasonOptions(true))
  }),

  http.get('/api/admin/refund-reasons', async () => {
    if (!getCurrentUser()) return unauthorized()
    return success(getRefundReasonOptions())
  }),

  http.post('/api/admin/refund-reasons', async ({ request }) => {
    if (!getCurrentUser()) return unauthorized()
    const { label } = (await request.json()) as { label?: string }
    const reasons = getRefundReasonOptions()
    const error = validateLabel(label, reasons)
    if (error) return fail(error)
    const now = new Date().toISOString()
    const reason: RefundReasonOption = { id: generateId(), label: label!.trim(), enabled: true, order: reasons.length + 1, createdAt: now, updatedAt: now }
    saveReasons([...reasons, reason])
    return success(reason, '退款原因已新增')
  }),

  http.put('/api/admin/refund-reasons/order', async ({ request }) => {
    if (!getCurrentUser()) return unauthorized()
    const { ids } = (await request.json()) as { ids?: string[] }
    const reasons = getRefundReasonOptions()
    if (!Array.isArray(ids) || ids.length !== reasons.length || new Set(ids).size !== reasons.length || reasons.some((item) => !ids.includes(item.id))) return fail('排序参数错误')
    const sorted = ids.map((id, index) => ({ ...reasons.find((item) => item.id === id)!, order: index + 1, updatedAt: new Date().toISOString() }))
    saveReasons(sorted)
    return success(sorted, '排序已更新')
  }),

  http.put('/api/admin/refund-reasons/:id', async ({ request, params }) => {
    if (!getCurrentUser()) return unauthorized()
    const reasons = getRefundReasonOptions()
    const item = reasons.find((reason) => reason.id === params.id)
    if (!item) return notFound('退款原因不存在')
    if (item.isOther) return fail('“其他”是系统选项，不可编辑')
    const { label } = (await request.json()) as { label?: string }
    const error = validateLabel(label, reasons, item.id)
    if (error) return fail(error)
    const next = { ...item, label: label!.trim(), updatedAt: new Date().toISOString() }
    saveReasons(reasons.map((reason) => reason.id === item.id ? next : reason))
    return success(next, '退款原因已更新')
  }),

  http.patch('/api/admin/refund-reasons/:id/status', async ({ request, params }) => {
    if (!getCurrentUser()) return unauthorized()
    const reasons = getRefundReasonOptions()
    const item = reasons.find((reason) => reason.id === params.id)
    if (!item) return notFound('退款原因不存在')
    if (item.isOther) return fail('“其他”必须保持启用')
    const { enabled } = (await request.json()) as { enabled?: boolean }
    if (typeof enabled !== 'boolean') return fail('状态参数错误')
    const next = { ...item, enabled, updatedAt: new Date().toISOString() }
    saveReasons(reasons.map((reason) => reason.id === item.id ? next : reason))
    return success(next, enabled ? '退款原因已启用' : '退款原因已停用')
  }),

  http.delete('/api/admin/refund-reasons/:id', async ({ params }) => {
    if (!getCurrentUser()) return unauthorized()
    const reasons = getRefundReasonOptions()
    const item = reasons.find((reason) => reason.id === params.id)
    if (!item) return notFound('退款原因不存在')
    if (item.isOther) return fail('“其他”是系统选项，不可删除')
    const next = reasons.filter((reason) => reason.id !== item.id).map((reason, index) => ({ ...reason, order: index + 1 }))
    saveReasons(next)
    return success(null, '退款原因已删除')
  }),
]
