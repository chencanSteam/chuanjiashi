export type BiographerStatus = 'pending' | 'active' | 'inactive';
export type BiographerCertificationLevel = 'gold' | 'silver' | 'standard';

export interface BiographerService {
  id: string;
  name: string;
  price: number;
  description: string;
  /** 采访次数 */
  interviewCount?: string;
  /** 传记字数 */
  wordCount?: string;
  /** 交付周期 */
  deliveryPeriod?: string;
  /** 实体书 */
  physicalBook?: string;
  /** 影像资料 */
  mediaMaterial?: string;
  /** 修改次数 */
  revisionCount?: string;
}

export interface BiographerCase {
  id: string;
  title: string;
  cover?: string;
  summary: string;
}

export interface BiographerProfileDraft {
  name?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  city?: string;
  intro?: string;
  title?: string;
  specialties?: string[];
  experience?: number;
  serviceAreas?: string[];
  education?: string;
  certificates?: string[];
  tags?: string[];
  services?: BiographerService[];
  cases?: BiographerCase[];
}

export interface Biographer {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  city?: string;
  intro: string;
  title?: string;
  specialties: string[];
  experience: number;
  serviceAreas?: string[];
  education?: string;
  certificates?: string[];
  tags?: string[];
  services?: BiographerService[];
  cases?: BiographerCase[];
  status: BiographerStatus;
  certificationLevel?: BiographerCertificationLevel;
  rating?: number;
  reviewCount?: number;
  /** 已完成订单数（主页数据条展示） */
  completedOrders?: number;
  createdAt: string;
  updatedAt?: string;
  profileReviewStatus?: 'unsubmitted' | 'pending' | 'approved' | 'rejected';
  profileRejectReason?: string;
  profileSubmittedAt?: string;
  profileReviewedAt?: string;
  profileReviewedBy?: string;
  profileRevision?: number;
  publishedProfile?: BiographerProfileDraft;
  profileDraft?: BiographerProfileDraft;
}

export interface BiographerFormData {
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  city?: string;
  intro: string;
  title?: string;
  specialties: string[];
  experience: number;
  serviceAreas?: string[];
  education?: string;
  certificates?: string[];
  tags?: string[];
  services?: BiographerService[];
  cases?: BiographerCase[];
  status: BiographerStatus;
  certificationLevel?: BiographerCertificationLevel;
  rating?: number;
  reviewCount?: number;
  /** 已完成订单数（主页数据条展示） */
  completedOrders?: number;
}
