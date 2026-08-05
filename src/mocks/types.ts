export interface User {
  id: string
  phone: string
  nickname: string
  avatar?: string
  inviteCode: string
  invitedBy?: string
  community?: string
  neighborhood?: string
  agreementAccepted: boolean
  privacyAccepted: boolean
  createdAt: string
}

export type ArchiveStatus = 'living' | 'deceased'
export type ArchiveType = 'self' | 'parent' | 'grandparent' | 'relative' | 'other'

export interface Archive {
  id: string
  userId: string
  type: ArchiveType
  name: string
  gender?: 'male' | 'female' | 'other'
  birthDate?: string
  birthPlace?: string
  deathDate?: string
  relation?: string
  status: ArchiveStatus
  cover?: string
  bio?: string
  completion: number
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: string
  category: string
  title: string
  question: string
  order: number
}

export interface Answer {
  questionId: string
  category: string
  answer: string
}

export interface InterviewSession {
  id: string
  archiveId: string
  answers: Answer[]
  currentCategory: string
  currentQuestionIndex: number
  status: 'pending' | 'in_progress' | 'completed'
  createdAt: string
  updatedAt: string
}

export interface Biography {
  id: string
  archiveId: string
  title: string
  style: 'plain' | 'warm' | 'family'
  wordCount: 'short' | 'standard' | 'long'
  chapters: BiographyChapter[]
  status: 'draft' | 'final'
  createdAt: string
  updatedAt: string
}

export interface BiographyChapter {
  id: string
  order: number
  title: string
  content: string
  images: string[]
}

export interface TimelineEvent {
  id: string
  archiveId: string
  year: number
  title: string
  description: string
  category: string
  images: string[]
}

export interface Material {
  id: string
  archiveId: string
  type: 'image' | 'audio' | 'document'
  url: string
  title?: string
  category: string
  description?: string
  shootTime?: string
  shootPlace?: string
  people?: string
  createdAt: string
}

export interface Museum {
  id: string
  archiveId: string
  title: string
  intro: string
  cover: string
  visibility: 'public' | 'private' | 'password' | 'family'
  password?: string
  views: number
  visitors: number
  likes: number
  candles: number
  flowers: number
  createdAt: string
}

// 数字馆留言
export interface MuseumMessage {
  id: string
  archiveId: string
  userNickname: string
  content: string
  createdAt: string
}

export interface DigitalPerson {
  id: string
  archiveId: string
  avatar: string
  voice?: string
  knowledgeBaseReady: boolean
  createdAt: string
}

// ========== 商业化类型 ==========

export type ProductType = 'biography' | 'digital_person' | 'video' | 'qrcode' | 'book' | 'biographer_service' | 'derivative'

export interface ProductPackage {
  id: string
  type: ProductType
  name: string
  price: number
  originalPrice?: number
  description: string
  rights: string[]
  sales?: number
  hot?: boolean
  /** 上下架状态，缺省视为 active（上架） */
  status?: 'active' | 'inactive'
  createdAt: string
}

export type OrderStatus = 'pending_pay' | 'paid' | 'delivering' | 'completed' | 'refunded' | 'closed'
export type OrderType = 'biography' | 'digital_person' | 'video' | 'qrcode' | 'book' | 'biographer_service' | 'group_buy' | 'derivative'

export interface OrderAddress {
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
}

export interface OrderLogistics {
  company: string
  trackingNo: string
  shippedAt: string
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface OrderReview {
  rating: number
  content: string
  tags?: string[]
  status: ReviewStatus
  createdAt: string
}

export interface RefundRequest {
  reason: string
  createdAt: string
}

export interface Deliverable {
  type: 'pdf' | 'video' | 'qrcode' | 'link' | 'image'
  url: string
  name: string
  createdAt: string
}

export interface Order {
  id: string
  userId: string
  archiveId?: string
  type: OrderType
  productId: string
  productName: string
  amount: number
  status: OrderStatus
  sku?: string
  remark?: string
  address?: OrderAddress
  logistics?: OrderLogistics
  deliverables?: Deliverable[]
  review?: OrderReview
  refundRequest?: RefundRequest
  expireAt?: string
  payTime?: string
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  orderId: string
  userId: string
  amount: number
  channel: 'wechat' | 'alipay'
  status: 'success' | 'failed' | 'pending'
  paidAt?: string
  transactionId: string
  createdAt: string
}

export interface GroupBuyActivity {
  id: string
  name: string
  price: number
  firstRoundSize: number
  firstRoundFreeCount: number
  laterRoundSize: number
  laterRoundFreeCount: number
  durationHours: number
  startAt: string
  endAt: string
  status: 'active' | 'inactive'
}

export interface GroupBuyOrder {
  id: string
  activityId: string
  userId: string
  phone: string
  orderId: string
  isLauncher: boolean
  isFree: boolean
  /** 是否已退款（免单自动退 / 未成团人工确认退） */
  refunded?: boolean
  joinedAt: string
}

export interface GroupBuyRecord {
  id: string
  activityId: string
  launcherId: string
  launcherPhone: string
  currentCount: number
  targetCount: number
  status: 'pending' | 'success' | 'failed'
  endAt: string
  members: GroupBuyOrder[]
  createdAt: string
}

/** 拼团规则配置（管理端可编辑，用户端开团/参团即时生效） */
export interface GroupBuyRules {
  firstRoundSize: number
  laterRoundSize: number
  durationHours: number
  freeEnabled: boolean
  firstRoundFreeCount: number
  laterRoundFreeCount: number
  maxLaunchPerDevice: number
  maxJoinPerPhone: number
}

/** 分润规则配置（管理端可编辑） */
export interface CommissionRules {
  directRate: number
  platformPoolRate: number
  bookshelfRate: number
  biographerRate: number
}

export interface CommissionRecord {
  id: string
  userId: string
  fromUserId?: string
  fromUserPhone?: string
  orderId: string
  orderType: OrderType
  amount: number
  rate: number
  commission: number
  status: 'pending' | 'settled' | 'frozen' | 'deducted'
  createdAt: string
  settledAt?: string
}

export interface WithdrawalRecord {
  id: string
  userId: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  appliedAt: string
  paidAt?: string
  partnerName?: string
}

export interface PublicBook {
  id: string
  archiveId: string
  userId: string
  title: string
  cover?: string
  author: string
  intro: string
  category: string
  price: number
  isFree: boolean
  status: 'pending' | 'approved' | 'rejected' | 'off_shelf'
  views: number
  likes: number
  collects: number
  shares: number
  /** 试看字数（按字数从全本截取试读内容，未设置时默认试读第一章） */
  trialWords?: number
  /** 第一章试读文本 */
  trialContent?: string
  /** 全本文本 */
  fullContent?: string
  /** 是否已付费解锁（mock 简化，直接挂在书上） */
  unlocked?: boolean
  createdAt: string
}

export interface Biographer {
  id: string
  userId: string
  phone: string
  name: string
  email?: string
  avatar?: string
  city: string
  intro: string
  title?: string
  specialties: string[]
  experience: number
  serviceAreas?: string[]
  education?: string
  certificates?: string[]
  tags?: string[]
  services: BiographerService[]
  cases: BiographerCase[]
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  /** 入驻审核驳回原因 */
  rejectReason?: string
  /** 入驻申请时登记的身份证号 */
  idCard?: string
  certificationLevel: BiographerCertificationLevel
  rating: number
  reviewCount: number
  deposit: number
  createdAt: string
  updatedAt?: string
}

export interface BiographerService {
  id: string
  name: string
  price: number
  description: string
}

export interface BiographerCase {
  id: string
  title: string
  cover?: string
  summary: string
}

export type BiographerCertificationLevel = 'gold' | 'silver' | 'standard'

export interface BiographerReview {
  id: string
  biographerId: string
  userId: string
  userName: string
  userAvatar?: string
  orderId: string
  rating: number
  content: string
  tags?: string[]
  createdAt: string
}

export interface BiographerBookingForm {
  interviewee: string
  relation: string
  preferredTime: string
  location: string
  contactPhone: string
  remark: string
}

export interface BiographerOrder {
  id: string
  userId: string
  orderId?: string
  biographerId: string
  serviceId: string
  serviceName: string
  amount: number
  deposit: number
  status: 'pending_deposit' | 'paid_deposit' | 'interview_scheduled' | 'draft_submitted' | 'modifying' | 'final_submitted' | 'paid_full' | 'completed' | 'after_sales'
  schedule?: {
    time: string
    address: string
  }
  progress: BiographerOrderProgress[]
  createdAt: string
  updatedAt: string
}

export interface BiographerOrderProgress {
  node: string
  status: 'pending' | 'done'
  time?: string
}

export interface ApiRequest<T = unknown> {
  body: T
}

// ========== AI 额度类型 ==========

export interface QuotaItem {
  used: number
  total: number
  tokensUsed?: number
}

export interface AIQuota {
  plan: string
  interviewQuestion: QuotaItem
  followUp: QuotaItem
  biographyGenerate: QuotaItem
  digitalDialog: QuotaItem
  storage: { usedMB: number; totalMB: number }
}

// ========== 家庭空间类型 ==========

export interface FamilyMember {
  id: string
  name: string
  role: string
  tag?: string
  gen?: string
  phone?: string
  email?: string
  location?: string
  birth?: string
  bio?: string
}

export interface FamilyRelation {
  id: string
  from: string
  to: string
  relation: string
}

export interface Place {
  id: string
  place: string
  year: string
  event: string
  left?: number
  top?: number
  count?: number
}

// ========== 合伙人/服务商类型 ==========

export type PartnerType = 'province' | 'city' | 'district' | 'inviter'
export type PartnerStatus = 'pending' | 'active' | 'inactive' | 'rejected'
export type ApplicationStatus = 'pending' | 'approved' | 'rejected'
export type BindType = 'invite_code' | 'region_auto' | 'manual'

export interface Partner {
  id: string
  userId: string
  type: PartnerType
  name: string
  phone: string
  email?: string
  regionCode?: string
  regionName?: string
  parentId?: string
  inviteCode: string
  commissionRate: number
  balance: number
  totalEarnings: number
  status: PartnerStatus
  createdAt: string
}

export interface PartnerApplication {
  id: string
  userId: string
  name: string
  phone: string
  email?: string
  type: PartnerType
  regionCode?: string
  regionName?: string
  reason?: string
  status: ApplicationStatus
  createdAt: string
  processedAt?: string
  processorId?: string
}

export interface PartnerCustomer {
  id: string
  partnerId: string
  userId: string
  userName?: string
  userPhone?: string
  bindType: BindType
  hasPaid: boolean
  totalOrderAmount: number
  createdAt: string
}

// ========== 后台管理类型 ==========

/** 后台用户（管理端视角） */
export interface AdminUser {
  id: string
  /** 昵称 */
  nickname: string
  /** 手机号 */
  phone: string
  /** 注册时间 */
  registeredAt: string
  /** 账号状态：active 正常 / disabled 已禁用 */
  status: 'active' | 'disabled'
  /** 实名状态：none 未提交 / pending 待审核 / verified 已通过 / rejected 已驳回 */
  realNameStatus: 'none' | 'pending' | 'verified' | 'rejected'
  /** 档案数 */
  archiveCount: number
  /** 订单数 */
  orderCount: number
  /** 邀请人昵称 */
  inviterName?: string
}

/** 后台档案（管理端视角） */
export interface AdminArchive {
  id: string
  /** 档案主人姓名 */
  ownerName: string
  /** 档案类型：self 本人 / parent 父母 / grandparent 祖辈 / relative 亲友 / other 其他 */
  archiveType: ArchiveType
  /** 创建人昵称 */
  creatorNickname: string
  /** 素材数（图片/音频/文档） */
  materialCounts: {
    image: number
    audio: number
    document: number
  }
  /** 隐私状态：private 私密 / shared 家庭共享 / public 公开 */
  privacyStatus: 'private' | 'shared' | 'public'
  /** 完整度（0-100） */
  completion: number
  /** 创建时间 */
  createdAt: string
}

/** AI 任务类型：biography 传记生成 / digital_person 数字人 / short_video 短视频 / pdf 排版导出 */
export type AITaskType = 'biography' | 'digital_person' | 'short_video' | 'pdf' | 'qrcode'
export type AITaskStatus = 'queued' | 'running' | 'success' | 'failed'

/** AI 生成任务 */
export interface AITask {
  id: string
  /** 任务类型 */
  type: AITaskType
  /** 关联对象名（档案主人/传记名等） */
  targetName: string
  /** 任务所属用户的昵称 */
  userName: string
  /** 任务所属用户的手机号 */
  userPhone: string
  /** 状态：queued 排队中 / running 生成中 / success 成功 / failed 失败 */
  status: AITaskStatus
  /** Token 消耗 */
  tokens: number
  /** 创建时间 */
  createdAt: string
  /** 完成时间 */
  finishedAt?: string
  /** 失败原因 */
  failReason?: string
}

/** 提示词模板类型：prompt 生成提示词 / questionnaire 采访问卷 / style 文风模板 / interview_rule 采访规则 */
export type PromptTemplateType = 'prompt' | 'questionnaire' | 'style' | 'interview_rule'

/** 提示词/规则模板 */
export interface PromptTemplate {
  id: string
  /** 模板类型 */
  type: PromptTemplateType
  /** 名称 */
  name: string
  /** 内容摘要 */
  summary: string
  /** 更新时间 */
  updatedAt: string
  /** 启用状态 */
  enabled: boolean
}

/** 合规授权记录类型：biography_public 传记公开授权 / portrait 肖像授权 / voice 声音授权 */
export type ComplianceRecordType = 'biography_public' | 'portrait' | 'voice'

/** 合规授权记录 */
export interface ComplianceRecord {
  id: string
  /** 授权类型 */
  type: ComplianceRecordType
  /** 对象名（传记名/档案主人名） */
  targetName: string
  /** 授权人 */
  authorizedBy: string
  /** 授权时间 */
  authorizedAt: string
  /** 状态：valid 有效 / expired 已过期 / revoked 已撤销 */
  status: 'valid' | 'expired' | 'revoked'
}

/** 协议配置（用户协议/隐私政策等） */
export interface AgreementConfig {
  id: string
  /** 协议名 */
  name: string
  /** 版本号 */
  version: string
  /** 协议全文（段落以 \n\n 分隔） */
  content: string
  /** 更新时间 */
  updatedAt: string
}

/** 私单预警记录 */
export interface ComplianceAlert {
  id: string
  /** 传记师姓名 */
  biographerName: string
  /** 涉及用户昵称 */
  userNickname: string
  /** 预警原因 */
  reason: string
  /** 风险等级：low / medium / high */
  riskLevel: 'low' | 'medium' | 'high'
  /** 状态：pending 待处理 / resolved 已处理 */
  status: 'pending' | 'resolved'
  /** 创建时间 */
  createdAt: string
}

/** 书架传记评论 */
export interface BookComment {
  id: string
  /** 书 id */
  bookId: string
  /** 用户昵称 */
  userNickname: string
  /** 评论内容 */
  content: string
  /** 评论时间 */
  createdAt: string
  /** 点赞数 */
  likes: number
}

/** 内容审核-素材审核项（图片/音频） */
export interface MediaReviewItem {
  id: string
  type: 'image' | 'audio'
  title: string
  owner: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
}

/** 内容审核-举报记录 */
export interface ContentReport {
  id: string
  reporter: string
  target: string
  reason: string
  createdAt: string
  status: 'pending' | 'processed'
}

// ========== 合伙人渠道/考核类型 ==========

/** 合伙人渠道类型：cemetery 陵园 / elderly 养老 */
export type PartnerChannelType = 'cemetery' | 'elderly'

/** 合伙人渠道 */
export interface PartnerChannel {
  id: string
  /** 所属合伙人 id */
  partnerId: string
  /** 渠道类型 */
  type: PartnerChannelType
  /** 机构名 */
  orgName: string
  /** 联系人 */
  contact: string
  /** 联系电话 */
  phone: string
  /** 状态：active 合作中 / inactive 已停用 */
  status: 'active' | 'inactive'
  /** 合作时间 */
  cooperatedAt: string
}

/** 考核指标项 */
export interface AssessmentMetric {
  /** 指标名（渠道拓展/服务履约/品牌运营/合规风控） */
  name: string
  /** 目标值 */
  target: number
  /** 完成值 */
  completed: number
}

/** 分成发放记录 */
export interface PayoutRecord {
  id: string
  /** 结算周期，如 2026-05 */
  period: string
  /** 发放金额 */
  amount: number
  /** 状态：pending 待发放 / paid 已发放 */
  status: 'pending' | 'paid'
  /** 发放时间 */
  paidAt?: string
}

/** 合伙人年度考核 */
export interface PartnerAssessment {
  /** 考核年度 */
  year: number
  /** 年度 GMV 档位，如「S 档（≥500 万）」 */
  gmvTier: string
  /** 档位目标 GMV */
  gmvTarget: number
  /** 当前已完成 GMV */
  gmvCompleted: number
  /** 考核指标（渠道拓展/服务履约/品牌运营/合规风控） */
  metrics: AssessmentMetric[]
  /** 分成发放记录 */
  payouts: PayoutRecord[]
}

/** GMV 月度数据点 */
export interface GmvMonthPoint {
  /** 月份，如 2026-01 */
  month: string
  /** 当月 GMV */
  gmv: number
}

/** 分业务线 GMV 统计 */
export interface GmvLineStat {
  /** 业务线：ai_biography AI传记 / bookshelf 书架付费 / biographer_service 传记师服务 / robot_hardware 机器人硬件 */
  line: 'ai_biography' | 'bookshelf' | 'biographer_service' | 'robot_hardware'
  /** 业务线名称 */
  lineName: string
  /** 月度 GMV 数组 */
  monthly: GmvMonthPoint[]
}

/** 合伙人本地订单（简化视图） */
export interface PartnerLocalOrder {
  id: string
  /** 下单用户昵称 */
  userNickname: string
  /** 商品名 */
  productName: string
  /** 金额 */
  amount: number
  /** 订单状态 */
  status: OrderStatus
  /** 创建时间 */
  createdAt: string
}

// ========== 传记师结算类型 ==========

/** 传记师收入明细 */
export interface BiographerIncomeItem {
  /** 订单号 */
  orderNo: string
  /** 订单金额 */
  amount: number
  /** 平台抽佣金额 */
  commission: number
  /** 入账时间 */
  createdAt: string
}

/** 传记师提现记录 */
export interface BiographerWithdrawal {
  id: string
  /** 提现金额 */
  amount: number
  /** 状态：pending 待审核 / approved 已通过 / rejected 已驳回 / paid 已打款 */
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  /** 申请时间 */
  appliedAt: string
  /** 打款时间 */
  paidAt?: string
}

/** 传记师违规扣款记录 */
export interface BiographerPenalty {
  id: string
  /** 违规原因 */
  reason: string
  /** 扣款金额 */
  amount: number
  /** 扣款时间 */
  createdAt: string
}

/** 传记师结算总览 */
export interface BiographerSettlement {
  /** 传记师 id */
  biographerId: string
  /** 托管金额（订单进行中、平台托管中） */
  escrowAmount: number
  /** 可结算金额 */
  availableAmount: number
  /** 平台抽佣比例（如 0.15 表示 15%） */
  commissionRate: number
  /** 收入明细 */
  incomes: BiographerIncomeItem[]
  /** 提现记录 */
  withdrawals: BiographerWithdrawal[]
  /** 违规扣款记录 */
  penalties: BiographerPenalty[]
}

// ========== 平台管理端扩展类型 ==========

/** 二维码类型：tombstone 墓碑码 / memorial 纪念物码 / share 分享码 */
export type QrCodeType = 'tombstone' | 'memorial' | 'share'

/** 二维码状态：enabled 启用 / disabled 停用 / bound 已绑定 / unbound 未绑定 */
export type QrCodeStatus = 'enabled' | 'disabled' | 'bound' | 'unbound'

/** 二维码记录（管理端视角） */
export interface QrCodeRecord {
  id: string
  /** 二维码编号 */
  code: string
  /** 关联数字馆名称 */
  museumName: string
  /** 码类型 */
  type: QrCodeType
  /** 状态 */
  status: QrCodeStatus
  /** 生成时间 */
  createdAt: string
}

/** 传记师押金状态：paid 已缴纳 / refunded 已退还 / deducted 已扣除 */
export type BiographerDepositStatus = 'paid' | 'refunded' | 'deducted'

/** 传记师押金记录（管理端视角） */
export interface BiographerDepositRecord {
  id: string
  /** 传记师 id */
  biographerId: string
  /** 传记师姓名 */
  biographerName: string
  /** 押金金额 */
  amount: number
  /** 缴纳时间 */
  paidAt: string
  /** 状态 */
  status: BiographerDepositStatus
}

/** 处罚状态：effective 生效中 / revoked 已撤销 */
export type BiographerPenaltyStatus = 'effective' | 'revoked'

/** 传记师违规处罚记录（管理端视角） */
export interface BiographerPenaltyRecord {
  id: string
  /** 传记师 id */
  biographerId: string
  /** 传记师姓名 */
  biographerName: string
  /** 违规类型（如 私单/交付逾期/服务质量/违规内容） */
  violationType: string
  /** 处罚措施（如 扣款/警告/暂停接单/清退） */
  measure: string
  /** 扣款金额 */
  amount: number
  /** 处罚原因 */
  reason: string
  /** 状态 */
  status: BiographerPenaltyStatus
  /** 处罚时间 */
  createdAt: string
}

/** 服务商费用类型：license 区域授权费 / saas SaaS 系统使用费 / deposit 履约保证金 */
export type PartnerFeeType = 'license' | 'saas' | 'deposit'

/** 服务商费用状态：paid 已缴纳 / pending 待缴纳 / refunded 已退还 */
export type PartnerFeeStatus = 'paid' | 'pending' | 'refunded'

/** 服务商费用记录 */
export interface PartnerFeeRecord {
  id: string
  /** 合伙人 id */
  partnerId: string
  /** 合伙人名称 */
  partnerName: string
  /** 费用类型 */
  feeType: PartnerFeeType
  /** 金额 */
  amount: number
  /** 缴纳时间 */
  paidAt: string
  /** 状态 */
  status: PartnerFeeStatus
}

/** 县区分成比例配置 */
export interface PartnerShareConfig {
  id: string
  /** 区域名称 */
  regionName: string
  /** 合伙人 id */
  partnerId: string
  /** 合伙人名称 */
  partnerName: string
  /** 分成比例（如 0.15 表示 15%） */
  rate: number
  /** 生效时间 */
  effectiveAt: string
}

/** 奖励级别：city 市级扶持金 / province 省级年度奖励 */
export type PartnerRewardLevel = 'city' | 'province'

/** 服务商奖励配置 */
export interface PartnerRewardConfig {
  id: string
  /** 奖励级别 */
  level: PartnerRewardLevel
  /** 档位条件（如 年度 GMV ≥ 100 万） */
  condition: string
  /** 奖励金额 */
  amount: number
  /** 状态：enabled 启用 / disabled 停用 */
  status: 'enabled' | 'disabled'
}

/** 服务商年度考核（管理端视角） */
export interface PartnerAssessmentRecord {
  id: string
  /** 合伙人 id */
  partnerId: string
  /** 合伙人名称 */
  partnerName: string
  /** 考核年度 */
  year: number
  /** 年度 GMV 档位，如「A 档（100-300 万）」 */
  gmvTier: string
  /** 渠道拓展得分（0-100） */
  channelScore: number
  /** 服务履约得分（0-100） */
  fulfillmentScore: number
  /** 品牌运营得分（0-100） */
  brandScore: number
  /** 合规风控得分（0-100） */
  complianceScore: number
  /** 综合评级：优秀/良好/合格/不合格 */
  rating: '优秀' | '良好' | '合格' | '不合格'
}

// ========== AI 接入配置类型 ==========

/** AI 服务商连接状态：unconfigured 未配置 / connected 连接正常 / failed 连接失败 */
export type AiProviderStatus = 'unconfigured' | 'connected' | 'failed'

/** AI 服务商配置（管理端） */
export interface AiProviderConfig {
  id: string
  /** 服务商名称（Kimi / DeepSeek / 通义千问 / 文心一言 / OpenAI 兼容自定义） */
  name: string
  /** API Key（接口返回时已脱敏，如 sk-****3f2a） */
  apiKey: string
  /** API Base URL */
  baseUrl: string
  /** 默认模型名 */
  model: string
  /** 连接状态 */
  status: AiProviderStatus
  /** 是否启用（启用后可被场景分配选择） */
  enabled: boolean
}

/** AI 场景标识 */
export type AiSceneKey =
  | 'interview_followup'
  | 'biography_chapter'
  | 'derivative_content'
  | 'digital_person_qa'
  | 'content_moderation'

/** AI 场景分配（每个场景绑定一个服务商与模型参数） */
export interface AiSceneBinding {
  /** 场景标识 */
  scene: AiSceneKey
  /** 绑定的服务商 id（空串表示未分配） */
  providerId: string
  /** 使用的模型名 */
  model: string
  /** 温度 0-1 */
  temperature: number
  /** 最大 Token 数 */
  maxTokens: number
}

/** 知识库状态：not_built 未构建 / building 构建中 / ready 已完成 / stale 需更新 */
export type KnowledgeBaseStatus = 'not_built' | 'building' | 'ready' | 'stale'

/** 知识库条目（传记章节 / 采访问答 / 上传文档） */
export interface KnowledgeEntry {
  /** 条目类型：chapter 传记章节 / qa 采访问答 / document 上传文档 */
  type: 'chapter' | 'qa' | 'document'
  /** 条目标题（章节名/问题/文档名） */
  title: string
  /** 内容摘要 */
  snippet: string
}

/** 数字人知识库（管理端视角） */
export interface KnowledgeBase {
  id: string
  /** 关联人物姓名 */
  personName: string
  /** 关联档案 id */
  archiveId: string
  /** 来源构成 */
  sources: {
    /** 传记章节篇数 */
    chapters: number
    /** 采访问答条数 */
    qas: number
    /** 上传文档个数 */
    documents: number
  }
  /** 向量条目数 */
  vectorCount: number
  /** 构建状态 */
  status: KnowledgeBaseStatus
  /** 最后构建时间 */
  lastBuiltAt?: string
  /** 知识库条目 */
  entries: KnowledgeEntry[]
}

/** 知识库命中测试结果片段 */
export interface KnowledgeHitResult {
  /** 来源章节/条目名 */
  source: string
  /** 命中片段内容 */
  snippet: string
  /** 相似度分数（0-1） */
  score: number
}
