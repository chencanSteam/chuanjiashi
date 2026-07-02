import { createContext, useEffect, useState, type ReactNode } from 'react';
import { registerUser, loadRegisteredUsers } from '../data/userInviteData';

export type UserRole = 'user' | 'partner' | 'admin';

export interface User {
  phone: string;
  name?: string;
  token: string;
  isNewUser?: boolean;
  inviteCode?: string;
  roles?: UserRole[];
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (phone: string, code: string, options?: { isRegister?: boolean; name?: string }) => boolean;
  logout: () => void;
  setNewUser: (value: boolean) => void;
  addRole: (role: UserRole) => void;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = 'cj_user';
const TOKEN_KEY = 'cj_token';
const DEMO_ADMIN_PHONE = '13800138000';

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as User;
    // 同步 registeredUsers 中的最新角色
    const registered = loadRegisteredUsers().find((u) => u.phone === user.phone);
    if (registered?.roles) {
      user.roles = registered.roles as UserRole[];
    }
    // 演示账号默认管理员
    if (user.phone === DEMO_ADMIN_PHONE && !user.roles?.includes('admin')) {
      user.roles = [...(user.roles || []), 'admin'];
    }
    return user;
  } catch {
    // ignore
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadUser());

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_KEY, user.token);
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [user]);

  const generateUserInviteCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const login = (phone: string, code: string, options?: { isRegister?: boolean; name?: string; inviteCode?: string }) => {
    if (!phone.trim() || !code.trim()) return false;
    const token = `demo-token-${phone}-${Date.now()}`;
    const existing = loadUser();
    const userInviteCode = existing?.inviteCode || options?.inviteCode || generateUserInviteCode();
    const roles = existing?.roles || ['user'];
    // 演示账号默认是管理员，方便测试
    if (phone === DEMO_ADMIN_PHONE && !roles.includes('admin')) {
      roles.push('admin');
    }
    setUser({
      phone,
      name: options?.name || phone.slice(-4),
      token,
      isNewUser: options?.isRegister ? true : undefined,
      inviteCode: userInviteCode,
      roles,
    });
    registerUser(phone, options?.name || phone.slice(-4), userInviteCode, roles);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const addRole = (role: UserRole) => {
    setUser((prev) => {
      if (!prev) return prev;
      const roles = prev.roles || ['user'];
      if (roles.includes(role)) return prev;
      return { ...prev, roles: [...roles, role] };
    });
  };

  const hasRole = (role: UserRole) => {
    return user?.roles?.includes(role) ?? false;
  };

  const setNewUser = (value: boolean) => {
    setUser((prev) => (prev ? { ...prev, isNewUser: value } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user?.token,
        login,
        logout,
        setNewUser,
        addRole,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
