import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

interface RoleRouteProps {
  children: React.ReactNode;
  role: UserRole;
  fallback?: string;
}

export default function RoleRoute({ children, role, fallback = '/' }: RoleRouteProps) {
  return (
    <ProtectedRoute>
      <RoleGuard role={role} fallback={fallback}>
        {children}
      </RoleGuard>
    </ProtectedRoute>
  );
}

function RoleGuard({ children, role, fallback }: { children: React.ReactNode; role: UserRole; fallback: string }) {
  const { hasRole } = useAuth();
  if (!hasRole(role)) {
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}
