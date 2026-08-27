import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole, User } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({ children, allowedRoles, redirectTo = '/' }: ProtectedRouteProps) {
  const { user } = useAuth();

  const storedUser = !user ? (() => {
    try {
      const s = sessionStorage.getItem('permit_user');
      return s ? JSON.parse(s) as User : null;
    } catch { return null; }
  })() : user;

  const currentUser = user || storedUser;
  
  // Failsafe for older sessions that might have saved 'manager' or 'associate' instead of 'staff'
  if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'associate')) {
    currentUser.role = 'staff';
  }

  // Not logged in
  if (!currentUser) return <Navigate to={redirectTo} replace />;

  // Role not permitted for this route
  if (!allowedRoles.includes(currentUser.role)) {
    const fallback =
      currentUser.role === 'admin'    ? '/admin'    :
      currentUser.role === 'provider' ? '/provider' :
      currentUser.role === 'staff'    ? '/staff'    :
                                        '/customer';
    return <Navigate to={fallback} replace />;
  }

  // Staff with no providerId linkage — deny access
  if (currentUser.role === 'staff' && !currentUser.providerId) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
