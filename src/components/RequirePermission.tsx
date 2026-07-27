import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '@/hooks/useRole';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { roleHome } from '@/lib/roleRoutes';
import { can, type Action, type RoleLike } from '@/lib/permissions';

interface Props {
  action: Action;
  children: ReactNode;
}

/**
 * Route-level UI permission gate. Backend RLS is the source of truth;
 * this layer hides routes the current role isn't allowed to navigate to.
 */
export function RequirePermission({ action, children }: Props) {
  const { role, user, loading } = useRole();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/admin" replace />;
  if (!can(role as RoleLike, action)) return <Navigate to={roleHome(role)} replace />;
  return <>{children}</>;
}
