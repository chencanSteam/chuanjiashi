const PREFIX = 'cj_mock_'

export const storeKeys = {
  users: `${PREFIX}users`,
  currentUser: `${PREFIX}current_user`,
  archives: `${PREFIX}archives`,
  currentArchiveId: `${PREFIX}current_archive_id`,
  interviews: `${PREFIX}interviews`,
  biographies: `${PREFIX}biographies`,
  museums: `${PREFIX}museums`,
  digitalPersons: `${PREFIX}digital_persons`,
  materials: `${PREFIX}materials`,
  timeline: `${PREFIX}timeline`,
  sessions: `${PREFIX}sessions`,
  // 商业化
  products: `${PREFIX}products`,
  orders: `${PREFIX}orders`,
  payments: `${PREFIX}payments`,
  groupBuyActivities: `${PREFIX}group_buy_activities`,
  groupBuyRecords: `${PREFIX}group_buy_records`,
  commissions: `${PREFIX}commissions`,
  withdrawals: `${PREFIX}withdrawals`,
  publicBooks: `${PREFIX}public_books`,
  biographers: `${PREFIX}biographers`,
  biographerOrders: `${PREFIX}biographer_orders`,
  partners: `${PREFIX}partners`,
  partnerApplications: `${PREFIX}partner_applications`,
  partnerCustomers: `${PREFIX}partner_customers`,
  familyMembers: `${PREFIX}family_members`,
  familyRelations: `${PREFIX}family_relations`,
  places: `${PREFIX}places`,
  quota: `${PREFIX}ai_quota`,
} as const

export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return defaultValue
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

export function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function removeItem(key: string): void {
  localStorage.removeItem(key)
}

export function clearStore(): void {
  Object.values(storeKeys).forEach(removeItem)
}

export function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
