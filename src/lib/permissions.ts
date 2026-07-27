import type { AppRole } from '@/hooks/useRole';

/**
 * Centralized permission matrix. Admin has '*' (all).
 * Principal / accountant rows are matrix-ready but currently no users
 * carry these DB roles — they activate in Phase 7 (multi-tenant).
 */
export type Action =
  | 'dashboard.read'
  | 'students.read' | 'students.write'
  | 'staff.read' | 'staff.write'
  | 'attendance.read' | 'attendance.write'
  | 'finance.read' | 'finance.write'
  | 'results.read' | 'results.write'
  | 'exams.read' | 'exams.write'
  | 'inquiries.read' | 'inquiries.write'
  | 'visitors.read' | 'visitors.write'
  | 'certificates.read' | 'certificates.write'
  | 'notifications.read' | 'notifications.write'
  | 'notices.read' | 'notices.write'
  | 'homework.read' | 'homework.write'
  | 'leaves.read' | 'leaves.write'
  | 'calendar.read' | 'calendar.write'
  | 'transport.read' | 'transport.write'
  | 'idcards.read' | 'idcards.write'
  | 'reminders.read' | 'reminders.write'
  | 'analytics.read'
  | 'defaulters.read'
  | 'reports.read'
  | 'messages.read' | 'messages.write'
  | 'website.read' | 'website.write'
  | 'settings.write'
  | 'identity.read' | 'identity.write'
  | 'admissions.read' | 'admissions.write'
  | 'expenses.read' | 'expenses.write'
  | 'salaries.read' | 'salaries.write'
  | 'approvals.read' | 'approvals.write'
  | 'audit.read';


const ALL: Action[] = [
  'dashboard.read',
  'students.read','students.write','staff.read','staff.write',
  'attendance.read','attendance.write','finance.read','finance.write',
  'results.read','results.write','exams.read','exams.write',
  'inquiries.read','inquiries.write','visitors.read','visitors.write',
  'certificates.read','certificates.write','notifications.read','notifications.write',
  'notices.read','notices.write','homework.read','homework.write',
  'leaves.read','leaves.write','calendar.read','calendar.write',
  'transport.read','transport.write','idcards.read','idcards.write',
  'reminders.read','reminders.write','analytics.read','defaulters.read',
  'reports.read','messages.read','messages.write',
  'website.read','website.write','settings.write',
  'identity.read','identity.write',
  'admissions.read','admissions.write',
  'expenses.read','expenses.write','salaries.read','salaries.write',
  'approvals.read','approvals.write','audit.read',
];


const PRINCIPAL: Action[] = [
  'dashboard.read',
  'students.read','staff.read',
  'attendance.read','attendance.write',
  'results.read','results.write','exams.read',
  'certificates.read','certificates.write',
  'notifications.read','notifications.write',
  'notices.read','notices.write','homework.read',
  'leaves.read','leaves.write','calendar.read','calendar.write',
  'inquiries.read','inquiries.write','visitors.read','visitors.write',
  'reminders.read','analytics.read','reports.read','messages.read',
  'admissions.read','admissions.write',
  'approvals.read','approvals.write','audit.read',
];

const ACCOUNTANT: Action[] = [
  'dashboard.read',
  'students.read','finance.read','finance.write','defaulters.read',
  'reports.read','notifications.read','reminders.read',
  'expenses.read','expenses.write','salaries.read','salaries.write',
  'approvals.read','approvals.write','audit.read',
];

const STAFF: Action[] = [
  'dashboard.read','notices.read','notifications.read','calendar.read',
  'visitors.read','visitors.write','inquiries.read','inquiries.write',
];


const TEACHER: Action[] = [
  'dashboard.read','students.read',
  'attendance.read','attendance.write',
  'results.read','results.write',
  'homework.read','homework.write',
  'notices.read','notifications.read',
];

const PARENT: Action[] = ['attendance.read','finance.read','results.read','notifications.read','notices.read'];
const STUDENT: Action[] = ['attendance.read','finance.read','results.read','notifications.read','notices.read'];

export const PERMISSIONS: Record<string, Action[]> = {
  admin: ALL,
  principal: PRINCIPAL,
  accountant: ACCOUNTANT,
  teacher: TEACHER,
  parent: PARENT,
  student: STUDENT,
  staff: STAFF,
};

export type RoleLike = AppRole | 'principal' | 'accountant' | 'staff' | null;


export function can(role: RoleLike, action: Action): boolean {
  if (!role || role === 'member') return false;
  return (PERMISSIONS[role] ?? []).includes(action);
}
