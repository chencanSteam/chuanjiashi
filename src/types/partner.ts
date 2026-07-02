export type PartnerType = 'province' | 'city' | 'district' | 'inviter';
export type PartnerStatus = 'pending' | 'active' | 'inactive' | 'rejected';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type CommissionStatus = 'pending' | 'settled' | 'withdrawn';
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid';
export type BindType = 'invite_code' | 'region_auto' | 'manual';

export interface Partner {
  id: string;
  type: PartnerType;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  regionCode?: string;      // 行政区划编码，省/市/区县合伙人必填
  regionName?: string;      // 如：浙江省 / 杭州市 / 西湖区
  parentId?: string;        // 上级合伙人ID，市->省，区县->市
  inviteCode: string;       // 唯一邀请码
  commissionRate: number;   // 分佣比例，默认 0.2
  balance: number;          // 可提现余额
  totalEarnings: number;    // 累计收益
  status: PartnerStatus;
  createdAt: string;
}

export interface PartnerCustomer {
  id: string;
  partnerId: string;
  userId: string;           // 用户手机号或用户ID
  userName?: string;
  userPhone?: string;
  bindType: BindType;
  hasPaid: boolean;         // 是否已付费
  totalOrderAmount: number; // 累计订单金额
  createdAt: string;
}

export interface CommissionRecord {
  id: string;
  partnerId: string;
  userId: string;
  orderId: string;
  amount: number;           // 订单金额
  commission: number;       // 合伙人获得佣金
  type: 'interview' | 'biography' | 'digital_person' | 'subscription' | 'print' | 'other';
  status: CommissionStatus;
  createdAt: string;
  settledAt?: string;
}

export interface Withdrawal {
  id: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  status: WithdrawalStatus;
  remark?: string;
  createdAt: string;
  processedAt?: string;
}

export interface PartnerApplication {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: PartnerType;
  regionCode?: string;
  regionName?: string;
  reason?: string;
  status: ApplicationStatus;
  createdAt: string;
  processedAt?: string;
  processorId?: string;
}

export interface PartnerFormData {
  name: string;
  phone: string;
  email?: string;
  type: PartnerType;
  regionCode?: string;
  regionName?: string;
  parentId?: string;
  commissionRate: number;
  status: PartnerStatus;
}
