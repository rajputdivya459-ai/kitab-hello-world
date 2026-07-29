// Substitute teacher management.
import { getCollection, setCollection, uid } from '@/mock/db';
import { getTimetable, saveTimetable } from './api';
import { logAudit } from '@/lib/audit';
import { notify } from '@/lib/notify';
import type { TimetableRecord, Weekday } from './types';

export interface SubstituteRecord {
  id: string;
  timetableId: string;
  periodId: string;
  date: string;             // YYYY-MM-DD applied for
  originalTeacherId: string;
  substituteTeacherId: string;
  reason?: string;
  createdAt: string;
  createdBy?: string;
}

const COL = 'substitutes';

export function listSubstitutes(filter?: { teacherId?: string; date?: string }): SubstituteRecord[] {
  return getCollection<SubstituteRecord>(COL)
    .filter(s =>
      (!filter?.teacherId || s.substituteTeacherId === filter.teacherId || s.originalTeacherId === filter.teacherId) &&
      (!filter?.date || s.date === filter.date)
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Check if substitute teacher is free on given weekday/time across all published timetables. */
export function isTeacherFree(teacherId: string, day: Weekday, start: string, academicYear: string): boolean {
  const rows = getCollection<TimetableRecord>('timetables')
    .filter(r => r.status === 'published' && r.academicYear === academicYear);
  for (const r of rows) {
    for (const p of r.periods) {
      if (p.kind === 'class' && p.teacherId === teacherId && p.day === day && p.start === start) return false;
    }
  }
  return true;
}

export function assignSubstitute(input: {
  timetableId: string;
  periodId: string;
  date: string;
  substituteTeacherId: string;
  reason?: string;
}): SubstituteRecord | { error: string } {
  const tt = getTimetable(input.timetableId);
  if (!tt) return { error: 'Timetable not found' };
  const p = tt.periods.find(x => x.id === input.periodId);
  if (!p || !p.teacherId) return { error: 'Period has no assigned teacher' };
  if (!isTeacherFree(input.substituteTeacherId, p.day, p.start, tt.academicYear)) {
    return { error: 'Substitute is not free at that time' };
  }
  const rec: SubstituteRecord = {
    id: uid('sub'), createdAt: new Date().toISOString(),
    timetableId: input.timetableId, periodId: input.periodId,
    date: input.date, originalTeacherId: p.teacherId,
    substituteTeacherId: input.substituteTeacherId, reason: input.reason,
  };
  setCollection(COL, [rec, ...listSubstitutes()]);
  logAudit({ module: 'timetable', action: 'substitute.assign', recordId: rec.id, meta: { timetableId: input.timetableId, date: input.date } });
  notify({ title: `Substitute assigned — ${input.date}`, message: `${p.subject} · ${p.day} ${p.start}`, category: 'notice' }).catch(() => {});
  return rec;
}

export function removeSubstitute(id: string) {
  setCollection(COL, listSubstitutes().filter(s => s.id !== id));
  logAudit({ module: 'timetable', action: 'substitute.remove', recordId: id });
}

/** Substitutes affecting a period on a specific date. */
export function substituteForPeriod(periodId: string, date: string): SubstituteRecord | undefined {
  return listSubstitutes().find(s => s.periodId === periodId && s.date === date);
}
