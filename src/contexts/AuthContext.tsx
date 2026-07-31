import { createContext, useEffect, useState, type ReactNode } from 'react';

export type UserRole = 'user' | 'partner' | 'admin' | 'biographer';

export interface User {
  phone: string;
  name?: string;
  token: string;
  isNewUser?: boolean;
  inviteCode?: string;
  community?: string;
  neighborhood?: string;
  roles?: UserRole[];
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (phone: string, code: string, options?: { isRegister?: boolean; name?: string; inviteCode?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setNewUser: (value: boolean) => void;
  addRole: (role: UserRole) => void;
  hasRole: (role: UserRole) => boolean;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = 'cj_user';
const TOKEN_KEY = 'cj_token';
const MOCK_CURRENT_USER_KEY = 'cj_mock_current_user';
const DEMO_ADMIN_PHONE = '13800138000';

function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createLocalUser(phone: string, options?: { isRegister?: boolean; name?: string; inviteCode?: string }): User {
  const roles: UserRole[] = ['user'];
  if (phone === DEMO_ADMIN_PHONE) roles.push('admin');
  return {
    phone,
    name: options?.name || `用户${phone.slice(-4)}`,
    token: `local_token_${generateId()}`,
    isNewUser: options?.isRegister ? true : undefined,
    inviteCode: options?.inviteCode || Math.random().toString(36).slice(2, 8).toUpperCase(),
    roles,
  };
}

function syncMockAuth(user: User | null): void {
  if (!user) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(MOCK_CURRENT_USER_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, user.token);
  localStorage.setItem(
    MOCK_CURRENT_USER_KEY,
    JSON.stringify({
      id: `u_${user.phone}`,
      phone: user.phone,
      nickname: user.name || `用户${user.phone.slice(-4)}`,
      inviteCode: user.inviteCode || '',
    })
  );
}

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (!parsed?.phone || !parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // 用惰性初始化直接读取本地登录态，避免 effect 恢复与写入 effect 在 StrictMode 下交错清除 cj_user
  const [user, setUser] = useState<User | null>(() => loadStoredUser());
  const [ready] = useState(true);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
    syncMockAuth(user);
  }, [user]);

  const login = async (phone: string, code: string, options?: { isRegister?: boolean; name?: string; inviteCode?: string }) => {
    if (!phone.trim() || !code.trim()) {
      return { success: false, error: '请输入手机号和验证码' };
    }
    if (!/^1\d{10}$/.test(phone.trim())) {
      return { success: false, error: '请输入正确的手机号' };
    }
    // 原型阶段验证码固定为 123456
    if (code.trim() !== '123456') {
      return { success: false, error: '验证码错误' };
    }
    const localUser = createLocalUser(phone.trim(), options);
    setUser(localUser);
    return { success: true };
  };

  const logout = async () => {
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

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
  };

  const hasRole = (role: UserRole) => {
    return user?.roles?.includes(role) ?? false;
  };

  const setNewUser = (value: boolean) => {
    setUser((prev) => (prev ? { ...prev, isNewUser: value } : prev));
  };

  if (!ready) {
    return <div className="app-loading">加载中...</div>;
  }

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
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
