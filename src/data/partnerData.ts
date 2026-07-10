import type {
  Partner,
  PartnerType,
  PartnerStatus,
  PartnerCustomer,
  CommissionRecord,
  Withdrawal,
  PartnerApplication,
  ApplicationStatus,
  WithdrawalStatus,
  CommissionStatus,
} from '../types/partner';
import { addRoleToUser } from './userInviteData';

const PARTNERS_KEY = 'cj_partners';
const PARTNER_CUSTOMERS_KEY = 'cj_partner_customers';
const COMMISSION_RECORDS_KEY = 'cj_commission_records';
const WITHDRAWALS_KEY = 'cj_withdrawals';
const APPLICATIONS_KEY = 'cj_partner_applications';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function ensureUniqueInviteCode(codes: Set<string>): string {
  let code = generateInviteCode();
  while (codes.has(code)) {
    code = generateInviteCode();
  }
  return code;
}

// 修正相互依赖的 inviteCode 唯一性
function initDefaultPartners(): Partner[] {
  const codes = new Set<string>();
  return [
    {
      id: 'p_zj',
      type: 'province',
      name: '浙江总代',
      phone: '13800001111',
      email: 'zj@example.com',
      regionCode: '330000',
      regionName: '浙江省',
      inviteCode: ensureUniqueInviteCode(codes),
      commissionRate: 0.2,
      balance: 0,
      totalEarnings: 0,
      status: 'active',
      createdAt: '2024-01-10T08:00:00',
    },
    {
      id: 'p_hz',
      type: 'city',
      name: '杭州代理',
      phone: '13800002222',
      email: 'hz@example.com',
      regionCode: '330100',
      regionName: '杭州市',
      parentId: 'p_zj',
      inviteCode: ensureUniqueInviteCode(codes),
      commissionRate: 0.2,
      balance: 0,
      totalEarnings: 0,
      status: 'active',
      createdAt: '2024-01-15T08:00:00',
    },
    {
      id: 'p_xh',
      type: 'district',
      name: '西湖区代理',
      phone: '13800003333',
      email: 'xh@example.com',
      regionCode: '330106',
      regionName: '杭州市西湖区',
      parentId: 'p_hz',
      inviteCode: ensureUniqueInviteCode(codes),
      commissionRate: 0.2,
      balance: 0,
      totalEarnings: 0,
      status: 'active',
      createdAt: '2024-02-01T08:00:00',
    },
    {
      id: 'p_inv_001',
      type: 'inviter',
      name: '张推广',
      phone: '13900001111',
      email: 'zhang@example.com',
      inviteCode: ensureUniqueInviteCode(codes),
      commissionRate: 0.2,
      balance: 120,
      totalEarnings: 450,
      status: 'active',
      createdAt: '2024-03-01T08:00:00',
    },
  ];
}

export function loadPartners(): Partner[] {
  const stored = load<Partner[] | null>(PARTNERS_KEY, null);
  if (stored) return stored;
  const defaults = initDefaultPartners();
  save(PARTNERS_KEY, defaults);
  return defaults;
}

export function savePartners(partners: Partner[]) {
  save(PARTNERS_KEY, partners);
}

export function loadPartnerCustomers(): PartnerCustomer[] {
  return load<PartnerCustomer[]>(PARTNER_CUSTOMERS_KEY, []);
}

export function savePartnerCustomers(customers: PartnerCustomer[]) {
  save(PARTNER_CUSTOMERS_KEY, customers);
}

export function loadCommissionRecords(): CommissionRecord[] {
  return load<CommissionRecord[]>(COMMISSION_RECORDS_KEY, []);
}

export function saveCommissionRecords(records: CommissionRecord[]) {
  save(COMMISSION_RECORDS_KEY, records);
}

export function loadWithdrawals(): Withdrawal[] {
  return load<Withdrawal[]>(WITHDRAWALS_KEY, []);
}

export function saveWithdrawals(withdrawals: Withdrawal[]) {
  save(WITHDRAWALS_KEY, withdrawals);
}

export function loadApplications(): PartnerApplication[] {
  return load<PartnerApplication[]>(APPLICATIONS_KEY, []);
}

export function saveApplications(applications: PartnerApplication[]) {
  save(APPLICATIONS_KEY, applications);
}

export function getPartnerById(id: string): Partner | undefined {
  return loadPartners().find((p) => p.id === id);
}

export function getPartnerByInviteCode(code: string): Partner | undefined {
  return loadPartners().find((p) => p.inviteCode === code);
}

export function getPartnerByPhone(phone: string): Partner | undefined {
  return loadPartners().find((p) => p.phone === phone);
}

export function getActivePartners(): Partner[] {
  return loadPartners().filter((p) => p.status === 'active');
}

export function generateUniqueInviteCode(): string {
  const partners = loadPartners();
  const codes = new Set(partners.map((p) => p.inviteCode));
  return ensureUniqueInviteCode(codes);
}

export function createPartner(data: Omit<Partner, 'id' | 'inviteCode' | 'balance' | 'totalEarnings' | 'createdAt'>): Partner {
  const partners = loadPartners();
  const newPartner: Partner = {
    ...data,
    id: `p_${Date.now()}`,
    inviteCode: generateUniqueInviteCode(),
    balance: 0,
    totalEarnings: 0,
    createdAt: new Date().toISOString(),
  };
  savePartners([...partners, newPartner]);
  return newPartner;
}

export function updatePartner(id: string, data: Partial<Partner>): Partner | null {
  const partners = loadPartners();
  const index = partners.findIndex((p) => p.id === id);
  if (index === -1) return null;
  const updated = { ...partners[index], ...data };
  const next = [...partners];
  next[index] = updated;
  savePartners(next);
  return updated;
}

export function deletePartner(id: string): boolean {
  const partners = loadPartners();
  const next = partners.filter((p) => p.id !== id);
  if (next.length === partners.length) return false;
  savePartners(next);
  return true;
}

// 绑定客户给邀请码合伙人
export function bindCustomerByInviteCode(inviteCode: string, userId: string, userName?: string, userPhone?: string): PartnerCustomer | null {
  const partner = getPartnerByInviteCode(inviteCode);
  if (!partner || partner.status !== 'active') return null;

  const customers = loadPartnerCustomers();
  const existing = customers.find((c) => c.userId === userId);
  if (existing) return existing;

  const newCustomer: PartnerCustomer = {
    id: `pc_${Date.now()}`,
    partnerId: partner.id,
    userId,
    userName,
    userPhone,
    bindType: 'invite_code',
    hasPaid: false,
    totalOrderAmount: 0,
    createdAt: new Date().toISOString(),
  };
  savePartnerCustomers([...customers, newCustomer]);
  return newCustomer;
}

// 根据用户注册地区绑定区域合伙人（只绑定到区县）
export function bindCustomerByRegion(regionCode: string, userId: string, userName?: string, userPhone?: string): PartnerCustomer | null {
  if (!regionCode || regionCode.length < 6) return null;
  const districtCode = regionCode.slice(0, 6);
  const partners = getActivePartners();
  const districtPartner = partners.find((p) => p.type === 'district' && p.regionCode === districtCode);
  if (!districtPartner) return null;

  const customers = loadPartnerCustomers();
  const existing = customers.find((c) => c.userId === userId && c.partnerId === districtPartner.id);
  if (existing) return existing;

  const newCustomer: PartnerCustomer = {
    id: `pc_${Date.now()}`,
    partnerId: districtPartner.id,
    userId,
    userName,
    userPhone,
    bindType: 'region_auto',
    hasPaid: false,
    totalOrderAmount: 0,
    createdAt: new Date().toISOString(),
  };
  savePartnerCustomers([...customers, newCustomer]);
  return newCustomer;
}

// 手动绑定客户
export function bindCustomerManually(partnerId: string, userId: string, userName?: string, userPhone?: string): PartnerCustomer | null {
  const partner = getPartnerById(partnerId);
  if (!partner) return null;

  const customers = loadPartnerCustomers();
  const existing = customers.find((c) => c.userId === userId && c.partnerId === partnerId);
  if (existing) return existing;

  const newCustomer: PartnerCustomer = {
    id: `pc_${Date.now()}`,
    partnerId,
    userId,
    userName,
    userPhone,
    bindType: 'manual',
    hasPaid: false,
    totalOrderAmount: 0,
    createdAt: new Date().toISOString(),
  };
  savePartnerCustomers([...customers, newCustomer]);
  return newCustomer;
}

// 记录订单佣金
export function recordCommission(
  userId: string,
  orderId: string,
  amount: number,
  type: CommissionRecord['type'] = 'other'
): CommissionRecord[] {
  const customers = loadPartnerCustomers();
  const userBindings = customers.filter((c) => c.userId === userId);
  if (userBindings.length === 0) return [];

  const partners = loadPartners();
  const records: CommissionRecord[] = [];
  const now = new Date().toISOString();

  userBindings.forEach((binding) => {
    const partner = partners.find((p) => p.id === binding.partnerId);
    if (!partner || partner.status !== 'active') return;

    const commission = Math.round(amount * partner.commissionRate * 100) / 100;
    if (commission <= 0) return;

    const record: CommissionRecord = {
      id: `cr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      partnerId: partner.id,
      userId,
      orderId,
      amount,
      commission,
      type,
      status: 'settled',
      createdAt: now,
      settledAt: now,
    };
    records.push(record);

    partner.balance = Math.round((partner.balance + commission) * 100) / 100;
    partner.totalEarnings = Math.round((partner.totalEarnings + commission) * 100) / 100;

    binding.hasPaid = true;
    binding.totalOrderAmount = Math.round((binding.totalOrderAmount + amount) * 100) / 100;
  });

  if (records.length > 0) {
    const allRecords = loadCommissionRecords();
    saveCommissionRecords([...records, ...allRecords]);
    savePartners(partners);
    savePartnerCustomers(customers);
  }

  return records;
}

// 申请成为合伙人
export function applyForPartner(data: Omit<PartnerApplication, 'id' | 'status' | 'createdAt'>): PartnerApplication {
  const applications = loadApplications();
  const newApp: PartnerApplication = {
    ...data,
    id: `pa_${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  saveApplications([newApp, ...applications]);
  return newApp;
}

// 审核申请
export function processApplication(id: string, status: ApplicationStatus, processorId?: string): PartnerApplication | null {
  const applications = loadApplications();
  const index = applications.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const updated = { ...applications[index], status, processedAt: new Date().toISOString(), processorId };
  applications[index] = updated;
  saveApplications(applications);

  if (status === 'approved') {
    createPartner({
      name: updated.name,
      phone: updated.phone,
      email: updated.email,
      type: updated.type,
      regionCode: updated.regionCode,
      regionName: updated.regionName,
      commissionRate: 0.2,
      status: 'active',
    });
    // 合伙人申请通过后，给用户账号添加 partner 角色
    addRoleToUser(updated.phone, 'partner');
  }

  return updated;
}

// 提现申请
export function applyWithdrawal(partnerId: string, amount: number): Withdrawal | null {
  const partner = getPartnerById(partnerId);
  if (!partner || partner.balance < amount || amount <= 0) return null;

  const withdrawals = loadWithdrawals();
  const newWithdrawal: Withdrawal = {
    id: `wd_${Date.now()}`,
    partnerId,
    partnerName: partner.name,
    amount: Math.round(amount * 100) / 100,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  saveWithdrawals([newWithdrawal, ...withdrawals]);

  partner.balance = Math.round((partner.balance - amount) * 100) / 100;
  savePartners(
    loadPartners().map((p) => (p.id === partnerId ? partner : p))
  );

  return newWithdrawal;
}

// 处理提现
export function processWithdrawal(id: string, status: WithdrawalStatus, remark?: string): Withdrawal | null {
  const withdrawals = loadWithdrawals();
  const index = withdrawals.findIndex((w) => w.id === id);
  if (index === -1) return null;

  const updated = {
    ...withdrawals[index],
    status,
    remark,
    processedAt: new Date().toISOString(),
  };
  withdrawals[index] = updated;
  saveWithdrawals(withdrawals);

  // 如果拒绝，余额退回
  if (status === 'rejected') {
    const partners = loadPartners();
    const partner = partners.find((p) => p.id === updated.partnerId);
    if (partner) {
      partner.balance = Math.round((partner.balance + updated.amount) * 100) / 100;
      savePartners(partners);
    }
  }

  return updated;
}

export function getCustomersByPartner(partnerId: string): PartnerCustomer[] {
  return loadPartnerCustomers().filter((c) => c.partnerId === partnerId);
}

export function getCommissionRecordsByPartner(partnerId: string): CommissionRecord[] {
  return loadCommissionRecords().filter((r) => r.partnerId === partnerId);
}

export function getWithdrawalsByPartner(partnerId: string): Withdrawal[] {
  return loadWithdrawals().filter((w) => w.partnerId === partnerId);
}

export function getSubPartners(partnerId: string): Partner[] {
  return loadPartners().filter((p) => p.parentId === partnerId);
}

export function getPartnerStatusLabel(status: PartnerStatus): string {
  const map: Record<PartnerStatus, string> = {
    pending: '待审核',
    active: '已启用',
    inactive: '已停用',
    rejected: '已拒绝',
  };
  return map[status];
}

export function getApplicationStatusLabel(status: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  };
  return map[status];
}

export function getCommissionStatusLabel(status: CommissionStatus): string {
  const map: Record<CommissionStatus, string> = {
    pending: '待结算',
    settled: '已结算',
    withdrawn: '已提现',
  };
  return map[status];
}

export function getWithdrawalStatusLabel(status: WithdrawalStatus): string {
  const map: Record<WithdrawalStatus, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    paid: '已打款',
  };
  return map[status];
}

export const partnerTypeConfig: Record<
  PartnerType,
  { label: string; rate: number; color: string; benefits: string[] }
> = {
  province: { label: '省级合伙人', rate: 0.3, color: '#3b82f6', benefits: ['区域最高佣金 30%', '省级运营支持', '年度峰会资格', '优先提现'] },
  city: { label: '市级合伙人', rate: 0.25, color: '#8b5cf6', benefits: ['区域佣金 25%', '市级运营支持', '专属推广素材'] },
  district: { label: '县级合伙人', rate: 0.2, color: '#10b981', benefits: ['区域佣金 20%', '县级推广支持', '专属邀请码'] },
  inviter: { label: '邀请码合伙人', rate: 0.15, color: '#f59e0b', benefits: ['基础佣金 15%', '专属邀请码', '裂变奖励'] },
};

export function getPartnerTypeLabel(type: PartnerType): string {
  return partnerTypeConfig[type]?.label || type;
}
