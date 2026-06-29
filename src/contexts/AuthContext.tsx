import { createContext, useEffect, useState, type ReactNode } from 'react';

interface User {
  phone: string;
  name?: string;
  token: string;
  isNewUser?: boolean;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (phone: string, code: string, options?: { isRegister?: boolean; name?: string }) => boolean;
  logout: () => void;
  setNewUser: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = 'cj_user';
const TOKEN_KEY = 'cj_token';

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw) as User;
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

  const login = (phone: string, code: string, options?: { isRegister?: boolean; name?: string }) => {
    if (!phone.trim() || !code.trim()) return false;
    const token = `demo-token-${phone}-${Date.now()}`;
    setUser({
      phone,
      name: options?.name || phone.slice(-4),
      token,
      isNewUser: options?.isRegister ? true : undefined,
    });
    return true;
  };

  const logout = () => {
    setUser(null);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
