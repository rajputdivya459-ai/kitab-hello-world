// Portal identity bridge — links mock student/parent accounts to the marks roster
// used by the Results engine. Keeps portal pages free of ID-mapping logic.

import { listRoster } from '@/lib/marks/api';
import { getCurrentUser } from '@/auth/mockAuth';

/** profileId of the mock student user → roster student id. */
const STUDENT_LINK: Record<string, string> = {
  s_1: 'rs_10A_1',
  s_2: 'rs_9B_5',
  s_3: 'rs_8A_2',
};

/** profileId of the mock parent user → linked children (roster ids). */
const PARENT_LINK: Record<string, string[]> = {
  p_1: ['rs_10A_1'],
  p_2: ['rs_9B_5'],
  p_3: ['rs_8A_2', 'rs_8A_3'],
};

export interface LinkedStudent { id: string; roll: string; name: string; admissionNo: string; classId: string; section: string }

export const rosterStudent = (id: string): LinkedStudent | undefined => listRoster().find(s => s.id === id);

/** Roster record for the signed-in student (falls back to the first roster entry in demo mode). */
export function currentStudent(): LinkedStudent | undefined {
  const user = getCurrentUser();
  const id = user?.profileId ? STUDENT_LINK[user.profileId] : undefined;
  return (id && rosterStudent(id)) || listRoster()[0];
}

/** Children of the signed-in parent. */
export function currentChildren(): LinkedStudent[] {
  const user = getCurrentUser();
  const ids = user?.profileId ? PARENT_LINK[user.profileId] ?? [] : [];
  const kids = ids.map(rosterStudent).filter(Boolean) as LinkedStudent[];
  return kids.length ? kids : listRoster().slice(0, 1);
}

/** Resolve a portal student (or child) to the roster id the Results engine uses. */
export function linkedStudentId(portalId?: string | null, admissionNo?: string | null): string {
  if (portalId && rosterStudent(portalId)) return portalId;
  if (portalId && STUDENT_LINK[portalId]) return STUDENT_LINK[portalId];
  if (admissionNo) {
    const byAdm = listRoster().find(s => s.admissionNo === admissionNo);
    if (byAdm) return byAdm.id;
  }
  return currentStudent()?.id ?? portalId ?? '';
}

