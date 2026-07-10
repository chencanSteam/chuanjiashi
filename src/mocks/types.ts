export interface User {
  id: string
  phone: string
  nickname: string
  avatar?: string
  inviteCode: string
  invitedBy?: string
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
  visibility: 'public' | 'private' | 'password'
  password?: string
  views: number
  visitors: number
  likes: number
  candles: number
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

export type ProductType = 'biography' | 'digital_person' | 'video' | 'qrcode' | 'book' | 'biographer_service'

export interface ProductPackage {
  id: string
  type: ProductType
  name: string
  price: number
  originalPrice?: number
  description: string
  rights: string[]
  createdAt: string
}

export type OrderStatus = 'pending_pay' | 'paid' | 'delivering' | 'completed' | 'refunded' | 'closed'
export type OrderType = 'biography' | 'digital_person' | 'video' | 'qrcode' | 'book' | 'biographer_service' | 'group_buy'

export interface Order {
  id: string
  userId: string
  archiveId?: string
  type: OrderType
  productId: string
  productName: string
  amount: number
  status: OrderStatus
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

export interface BiographerOrder {
  id: string
  userId: string
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
