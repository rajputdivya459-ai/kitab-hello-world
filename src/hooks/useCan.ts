import { useRole } from '@/hooks/useRole';
import { can, type Action, type RoleLike } from '@/lib/permissions';

/** Convenience hook for UI gating. Returns `true` while role is loading to avoid flicker on admin views. */
export function useCan(action: Action): boolean {
  const { role, loading } = useRole();
  if (loading) return true;
  return can(role as RoleLike, action);
}
