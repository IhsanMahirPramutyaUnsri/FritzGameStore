import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If set, only users with this role can access the route. */
  requiredRole?: UserRole;
  /** If set, any of these roles may access the route. */
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, session, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // Not authenticated
  if (!session || !user) {
    // Redirect admin routes to admin login, others to regular login
    const loginPath = location.pathname.startsWith('/admin')
      ? '/admin/login'
      : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Banned user
  if (user.is_banned) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600">Akun Diblokir</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Akun Anda telah diblokir oleh admin. Silakan hubungi dukungan untuk
          informasi lebih lanjut.
        </p>
      </div>
    );
  }

  // Role check — requiredRole takes precedence, then allowedRoles
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
