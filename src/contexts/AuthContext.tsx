import { createContext, useEffect, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth';

export type UserRole = 'user' | 'partner' | 'admin' | 'biographer';

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
  login: (phone: string, code: string, options?: { isRegister?: boolean; name?: string; inviteCode?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setNewUser: (value: boolean) => void;
  addRole: (role: UserRole) => void;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = 'cj_user';
const DEMO_ADMIN_PHONE = '13800138000';

function mapMockUserToLocal(mockUser: { id: string; phone: string; nickname: string; inviteCode: string }, token: string, options?: { isRegister?: boolean; name?: string }): User {
  const roles: UserRole[] = ['user'];
  if (mockUser.phone === DEMO_ADMIN_PHONE) {
    roles.push('admin');
  }
  return {
    phone: mockUser.phone,
    name: options?.name || mockUser.nickname || mockUser.phone.slice(-4),
    token,
    isNewUser: options?.isRegister ? true : undefined,
    inviteCode: mockUser.inviteCode,
    roles,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // 页面刷新时恢复登录态
  useEffect(() => {
    authApi.me()
      .then((mockUser) => {
        const token = localStorage.getItem('cj_token') || `demo-token-${mockUser.phone}`;
        setUser(mapMockUserToLocal(mockUser as any, token));
      })
      .catch(() => {
        // 尝试本地兜底
        try {
          const raw = localStorage.getItem(USER_KEY);
          if (raw) setUser(JSON.parse(raw) as User);
        } catch {
          // ignore
        }
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  const login = async (phone: string, code: string, options?: { isRegister?: boolean; name?: string; inviteCode?: string }) => {
    if (!phone.trim() || !code.trim()) {
      return { success: false, error: '请输入手机号和验证码' };
    }
    try {
      const { user: mockUser, token } = await authApi.login(phone, code, options?.inviteCode);
      const localUser = mapMockUserToLocal(mockUser as any, token, options);
      setUser(localUser);
      return { success: true };
    } catch (err: any) {
      const message = err?.message || '登录失败，请检查网络或稍后重试';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
