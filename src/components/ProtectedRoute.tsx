import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({ children, allowedRoles, redirectTo = '/login' }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  // Not logged in
  if (!isAuthenticated || !user) return <Navigate to={redirectTo} replace />;

  // Role not permitted for this route
  if (!allowedRoles.includes(user.role)) {
    const fallback =
      user.role === 'admin'    ? '/admin'    :
      user.role === 'provider' ? '/provider' :
      user.role === 'staff'    ? '/staff'    :
                                 '/customer';
    return <Navigate to={fallback} replace />;
  }

  // Staff with no providerId linkage — deny access
  if (user.role === 'staff' && !user.providerId) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
