import type { WithdrawalRecord } from '../mocks/types';

const STORAGE_KEY = 'cj_user_withdrawal_accounts_v1';
export const USER_WITHDRAWAL_EVENT = 'cj-user-withdrawal-updated';

export interface UserWithdrawalDemo {
  id: string;
  userId: string;
  applicant: string;
  account: string;
  amount: number;
  appliedAt: string;
  status: WithdrawalRecord['status'];
  rejectionReason?: string;
}

export function readUserWithdrawalDemos(): UserWithdrawalDemo[] {
  try {
    const records: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(records)
      ? records.filter((item): item is UserWithdrawalDemo => item && typeof item.id === 'string' && typeof item.account === 'string')
      : [];
  } catch {
    return [];
  }
}

export function saveUserWithdrawalDemo(record: WithdrawalRecord, applicant: string, phone: string) {
  const next: UserWithdrawalDemo = {
    id: record.id,
    userId: record.userId,
    applicant: applicant || record.userId,
    account: `微信零钱 · ${phone.trim()}`,
    amount: record.amount,
    appliedAt: record.appliedAt,
    status: record.status,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([next, ...readUserWithdrawalDemos().filter((item) => item.id !== next.id)]));
  window.dispatchEvent(new Event(USER_WITHDRAWAL_EVENT));
  return next;
}

export function updateUserWithdrawalDemo(id: string, status: WithdrawalRecord['status'], rejectionReason?: string) {
  const records = readUserWithdrawalDemos();
  if (!records.some((item) => item.id === id)) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.map((item) => item.id === id ? { ...item, status, rejectionReason } : item)));
  window.dispatchEvent(new Event(USER_WITHDRAWAL_EVENT));
}
