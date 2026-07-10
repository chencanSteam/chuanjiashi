import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const DEMO_PHONE = '13800138000';

function ensureDemoArchive() {
  try {
    const raw = localStorage.getItem('cj_archives');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return;
    }
  } catch {
    // ignore
  }
  const defaultArchive = {
    id: 'default',
    name: '张明远',
    gender: '男' as const,
    birthYear: '1958',
    origin: '江苏省苏州市',
    occupation: '企业家 / 高级工程师',
  };
  localStorage.setItem('cj_archives', JSON.stringify([defaultArchive]));
  localStorage.setItem('cj_current_archive_id', 'default');
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const isDemo = new URLSearchParams(location.search).get('demo') === '1';

  useEffect(() => {
    if (isDemo && !isAuthenticated) {
      login(DEMO_PHONE, '123456', { name: '体验用户' }).then(() => {
        ensureDemoArchive();
      });
    }
  }, [isDemo, isAuthenticated, login]);

  if (!isAuthenticated && !isDemo) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
