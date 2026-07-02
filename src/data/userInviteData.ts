import { getPartnerByInviteCode } from './partnerData';

const USER_INVITES_KEY = 'cj_user_invites';
const USER_REWARDS_KEY = 'cj_user_rewards';
const USER_WITHDRAWALS_KEY = 'cj_user_withdrawals';
const REGISTERED_USERS_KEY = 'cj_registered_users';

export interface UserInvite {
  id: string;
  inviterUserId: string; // 邀请人的手机号
  inviteeUserId: string; // 被邀请人的手机号
  createdAt: string;
}

export interface UserReward {
  id: string;
  userId: string; // 获得奖励的用户手机号
  fromUserId: string; // 消费的用户手机号
  orderId: string;
  amount: number; // 订单金额
  reward: number; // 奖励金额
  status: 'pending' | 'settled' | 'withdrawn';
  type: 'invite_reward';
  createdAt: string;
  settledAt?: string;
}

export interface UserWithdrawal {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  remark?: string;
  createdAt: string;
  processedAt?: string;
}

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

export function loadUserInvites(): UserInvite[] {
  return load<UserInvite[]>(USER_INVITES_KEY, []);
}

export function saveUserInvites(invites: UserInvite[]) {
  save(USER_INVITES_KEY, invites);
}

export function loadUserRewards(): UserReward[] {
  return load<UserReward[]>(USER_REWARDS_KEY, []);
}

export function saveUserRewards(rewards: UserReward[]) {
  save(USER_REWARDS_KEY, rewards);
}

export function loadUserWithdrawals(): UserWithdrawal[] {
  return load<UserWithdrawal[]>(USER_WITHDRAWALS_KEY, []);
}

export function saveUserWithdrawals(withdrawals: UserWithdrawal[]) {
  save(USER_WITHDRAWALS_KEY, withdrawals);
}

// 绑定用户邀请关系
export function bindUserInvite(inviterCode: string, inviteeUserId: string): UserInvite | null {
  if (!inviterCode) return null;

  // 优先检查合伙人邀请码
  const partner = getPartnerByInviteCode(inviterCode);
  if (partner) return null; // 合伙人邀请码在 partnerData 中处理

  // 查找普通用户邀请码
  const inviter = loadRegisteredUsers().find((u) => u.inviteCode === inviterCode && u.phone !== inviteeUserId);
  if (!inviter) return null;

  const invites = loadUserInvites();
  const existing = invites.find((i) => i.inviteeUserId === inviteeUserId);
  if (existing) return existing;

  const newInvite: UserInvite = {
    id: `ui_${Date.now()}`,
    inviterUserId: inviter.phone,
    inviteeUserId,
    createdAt: new Date().toISOString(),
  };
  saveUserInvites([...invites, newInvite]);
  return newInvite;
}

// 注册用户列表，用于通过 inviteCode 查找邀请人
export function loadRegisteredUsers(): Array<{ phone: string; name?: string; inviteCode?: string; roles?: string[] }> {
  return load<Array<{ phone: string; name?: string; inviteCode?: string; roles?: string[] }>>(REGISTERED_USERS_KEY, []);
}

export function saveRegisteredUsers(users: Array<{ phone: string; name?: string; inviteCode?: string; roles?: string[] }>) {
  save(REGISTERED_USERS_KEY, users);
}

export function registerUser(phone: string, name?: string, inviteCode?: string, roles?: string[]) {
  const users = loadRegisteredUsers();
  const existing = users.find((u) => u.phone === phone);
  if (!existing) {
    saveRegisteredUsers([...users, { phone, name, inviteCode, roles }]);
  } else {
    existing.inviteCode = inviteCode || existing.inviteCode;
    existing.name = name || existing.name;
    existing.roles = roles || existing.roles;
    saveRegisteredUsers(users);
  }
}

export function addRoleToUser(phone: string, role: string) {
  const users = loadRegisteredUsers();
  const user = users.find((u) => u.phone === phone);
  if (user) {
    const roles = user.roles || ['user'];
    if (!roles.includes(role)) {
      user.roles = [...roles, role];
      saveRegisteredUsers(users);
    }
  }
}

// 通过扫描 localStorage 找到某个手机号对应的邀请码
export function findUserInviteCode(phone: string): string | undefined {
  const raw = localStorage.getItem('cj_user');
  if (raw) {
    try {
      const user = JSON.parse(raw);
      if (user.phone === phone) return user.inviteCode;
    } catch {
      // ignore
    }
  }
  return loadRegisteredUsers().find((u) => u.phone === phone)?.inviteCode;
}

// 记录用户邀请奖励
export function recordUserInviteReward(
  inviteeUserId: string,
  orderId: string,
  amount: number
): UserReward | null {
  const invites = loadUserInvites();
  const invite = invites.find((i) => i.inviteeUserId === inviteeUserId);
  if (!invite) return null;

  const rewards = loadUserRewards();
  const rewardAmount = Math.round(amount * 0.2 * 100) / 100;
  if (rewardAmount <= 0) return null;

  const newReward: UserReward = {
    id: `ur_${Date.now()}`,
    userId: invite.inviterUserId,
    fromUserId: inviteeUserId,
    orderId,
    amount,
    reward: rewardAmount,
    status: 'settled',
    type: 'invite_reward',
    createdAt: new Date().toISOString(),
    settledAt: new Date().toISOString(),
  };
  saveUserRewards([newReward, ...rewards]);
  return newReward;
}

export function getUserRewards(userId: string): UserReward[] {
  return loadUserRewards().filter((r) => r.userId === userId);
}

export function getUserRewardStats(userId: string) {
  const rewards = getUserRewards(userId);
  const settled = rewards.filter((r) => r.status === 'settled').reduce((sum, r) => sum + r.reward, 0);
  const withdrawn = rewards.filter((r) => r.status === 'withdrawn').reduce((sum, r) => sum + r.reward, 0);
  const pendingWithdrawals = loadUserWithdrawals()
    .filter((w) => w.userId === userId && w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);
  return {
    total: rewards.reduce((sum, r) => sum + r.reward, 0),
    balance: Math.round((settled - withdrawn - pendingWithdrawals) * 100) / 100,
    withdrawn,
    inviteCount: loadUserInvites().filter((i) => i.inviterUserId === userId).length,
  };
}

export function applyUserWithdrawal(userId: string, userName: string, amount: number): UserWithdrawal | null {
  const stats = getUserRewardStats(userId);
  if (stats.balance < amount || amount <= 0) return null;

  const withdrawals = loadUserWithdrawals();
  const newWithdrawal: UserWithdrawal = {
    id: `uwd_${Date.now()}`,
    userId,
    userName,
    amount: Math.round(amount * 100) / 100,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  saveUserWithdrawals([newWithdrawal, ...withdrawals]);
  return newWithdrawal;
}

export function processUserWithdrawal(id: string, status: UserWithdrawal['status'], remark?: string): UserWithdrawal | null {
  const withdrawals = loadUserWithdrawals();
  const index = withdrawals.findIndex((w) => w.id === id);
  if (index === -1) return null;

  const updated = { ...withdrawals[index], status, remark, processedAt: new Date().toISOString() };
  withdrawals[index] = updated;
  saveUserWithdrawals(withdrawals);
  return updated;
}

export function getUserWithdrawals(userId: string): UserWithdrawal[] {
  return loadUserWithdrawals().filter((w) => w.userId === userId);
}

export function getAllUserRewards(): UserReward[] {
  return loadUserRewards();
}

export function getAllUserWithdrawals(): UserWithdrawal[] {
  return loadUserWithdrawals();
}
