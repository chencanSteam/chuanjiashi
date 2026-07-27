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
  groupBuyRules: `${PREFIX}group_buy_rules`,
  commissions: `${PREFIX}commissions`,
  commissionRules: `${PREFIX}commission_rules`,
  withdrawals: `${PREFIX}withdrawals`,
  publicBooks: `${PREFIX}public_books`,
  biographers: `${PREFIX}biographers`,
  biographerOrders: `${PREFIX}biographer_orders`,
  biographerReviews: `${PREFIX}biographer_reviews`,
  partners: `${PREFIX}partners`,
  partnerApplications: `${PREFIX}partner_applications`,
  partnerCustomers: `${PREFIX}partner_customers`,
  familyMembers: `${PREFIX}family_members`,
  familyRelations: `${PREFIX}family_relations`,
  places: `${PREFIX}places`,
  quota: `${PREFIX}ai_quota`,
  // 后台管理
  adminUsers: `${PREFIX}admin_users`,
  adminArchives: `${PREFIX}admin_archives`,
  aiTasks: `${PREFIX}ai_tasks`,
  questions: `${PREFIX}questions`,
  promptTemplates: `${PREFIX}prompt_templates`,
  complianceRecords: `${PREFIX}compliance_records`,
  agreementConfigs: `${PREFIX}agreement_configs`,
  complianceAlerts: `${PREFIX}compliance_alerts`,
  bookComments: `${PREFIX}book_comments`,
  museumMessages: `${PREFIX}museum_messages`,
  mediaReviewItems: `${PREFIX}media_review_items`,
  contentReports: `${PREFIX}content_reports`,
  // 合伙人渠道/考核 + 传记师结算
  partnerChannels: `${PREFIX}partner_channels`,
  partnerAssessment: `${PREFIX}partner_assessment`,
  partnerLocalOrders: `${PREFIX}partner_local_orders`,
  biographerSettlements: `${PREFIX}biographer_settlements`,
  // 平台管理端扩展
  qrCodes: `${PREFIX}qr_codes`,
  biographerDeposits: `${PREFIX}biographer_deposits`,
  biographerPenalties: `${PREFIX}biographer_penalties`,
  partnerFees: `${PREFIX}partner_fees`,
  partnerShareConfigs: `${PREFIX}partner_share_configs`,
  partnerRewardConfigs: `${PREFIX}partner_reward_configs`,
  partnerAssessments: `${PREFIX}partner_assessments`,
  // AI 接入配置
  aiProviders: `${PREFIX}ai_providers`,
  aiScenes: `${PREFIX}ai_scenes`,
  knowledgeBases: `${PREFIX}knowledge_bases`,
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
