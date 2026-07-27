import type { AppRole } from '@/hooks/useRole';

export type ExtRole = AppRole | 'principal' | 'accountant' | 'staff';

export function roleHome(role: ExtRole | string | null | undefined): string {
  switch (role) {
    case 'admin': return '/admin/dashboard';
    case 'principal': return '/principal/dashboard';
    case 'accountant': return '/accountant/dashboard';
    case 'staff': return '/staff/dashboard';
    case 'teacher': return '/teacher/dashboard';
    case 'parent': return '/parent/dashboard';
    case 'student': return '/student/dashboard';
    default: return '/';
  }
}

export function roleLogin(role: Exclude<ExtRole, null | 'member' | undefined>): string {
  switch (role) {
    case 'admin': return '/admin';
    case 'principal': return '/principal/login';
    case 'accountant': return '/accountant/login';
    case 'staff': return '/staff/login';
    case 'teacher': return '/teacher/login';
    case 'parent': return '/parent/login';
    case 'student': return '/student/login';
  }
}
