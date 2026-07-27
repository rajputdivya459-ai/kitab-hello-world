import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRole, AppRole } from '@/hooks/useRole';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { roleHome } from '@/lib/roleRoutes';

interface Props {
  role: Exclude<AppRole, null | 'member'>;
  loginPath: string;
  children: ReactNode;
}

/**
 * Strict role guard. Admin does NOT bypass — each role is isolated
 * to its own application shell. Mismatched roles are routed to their own home.
 */
export function RequireRole({ role, loginPath, children }: Props) {
  const { role: currentRole, user, loading } = useRole();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to={loginPath} replace />;
  if (currentRole !== role) {
    if (currentRole === 'admin' || currentRole === 'teacher' || currentRole === 'parent' || currentRole === 'student') {
      return <Navigate to={roleHome(currentRole)} replace />;
    }
    return <Navigate to={loginPath} replace />;
  }
  return <>{children}</>;
}
