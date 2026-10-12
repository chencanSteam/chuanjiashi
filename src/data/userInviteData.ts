const USER_INVITES_KEY = 'cj_user_invites';
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

// 注册用户列表，用于通过 inviteCode 查找邀请人
export function loadRegisteredUsers(): Array<{ phone: string; name?: string; inviteCode?: string; roles?: string[] }> {
  return load<Array<{ phone: string; name?: string; inviteCode?: string; roles?: string[] }>>(REGISTERED_USERS_KEY, []);
}

export function saveRegisteredUsers(users: Array<{ phone: string; name?: string; inviteCode?: string; roles?: string[] }>) {
  save(REGISTERED_USERS_KEY, users);
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
