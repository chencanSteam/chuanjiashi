import { http, type HttpHandler } from 'msw'
import { success, unauthorized } from '../utils/response'
import { getItem, setItem, storeKeys } from '../utils/store'
import { defaultComplianceRecords, defaultAgreementConfigs, defaultComplianceAlerts } from '../data/seed'
import type { ComplianceRecord, AgreementConfig, ComplianceAlert } from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

function ensureComplianceRecords(): ComplianceRecord[] {
  const records = getItem<ComplianceRecord[]>(storeKeys.complianceRecords, [])
  if (records.length === 0) {
    setItem(storeKeys.complianceRecords, defaultComplianceRecords)
    return defaultComplianceRecords
  }
  return records
}

function ensureAgreementConfigs(): AgreementConfig[] {
  const configs = getItem<AgreementConfig[]>(storeKeys.agreementConfigs, [])
  if (configs.length === 0) {
    setItem(storeKeys.agreementConfigs, defaultAgreementConfigs)
    return defaultAgreementConfigs
  }
  return configs
}

function ensureComplianceAlerts(): ComplianceAlert[] {
  const alerts = getItem<ComplianceAlert[]>(storeKeys.complianceAlerts, [])
  if (alerts.length === 0) {
    setItem(storeKeys.complianceAlerts, defaultComplianceAlerts)
    return defaultComplianceAlerts
  }
  return alerts
}

export const complianceHandlers: HttpHandler[] = [
  // 授权记录列表（按类型/状态过滤）
  http.get('/api/admin/compliance/records', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'all'
    const status = url.searchParams.get('status') || 'all'
    let records = ensureComplianceRecords()
    if (type !== 'all') records = records.filter((r) => r.type === type)
    if (status !== 'all') records = records.filter((r) => r.status === status)
    return success(records)
  }),

  // 协议配置列表
  http.get('/api/admin/compliance/agreements', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    return success(ensureAgreementConfigs())
  }),

  // 私单预警列表
  http.get('/api/admin/compliance/alerts', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'all'
    let alerts = ensureComplianceAlerts()
    if (status !== 'all') alerts = alerts.filter((a) => a.status === status)
    return success(alerts)
  }),
]
