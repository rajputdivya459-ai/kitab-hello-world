// Bulk operations for timetables.
import { getTimetable, listTimetables, saveTimetable, publishTimetable, duplicateAsDraft } from './api';
import { logAudit } from '@/lib/audit';
import type { TimetableRecord, Period } from './types';

export function copyToSection(id: string, toClass: string, toSection: string): TimetableRecord | undefined {
  const src = getTimetable(id); if (!src) return;
  const rec = saveTimetable({
    kind: src.kind, academicYear: src.academicYear,
    className: toClass, section: toSection,
    workingDays: src.workingDays, startTime: src.startTime, endTime: src.endTime,
    periodDuration: src.periodDuration, breakDuration: src.breakDuration, breakCount: src.breakCount,
    periods: src.periods.map(p => ({ ...p })),
    templateKey: src.templateKey, status: 'draft',
  } as any);
  logAudit({ module: 'timetable', action: 'timetable.bulk.copy', recordId: rec.id, meta: { from: id, toClass, toSection } });
  return rec;
}

export function bulkReplaceTeacher(id: string, fromTeacherId: string, toTeacherId: string): TimetableRecord | undefined {
  const src = getTimetable(id); if (!src) return;
  const periods: Period[] = src.periods.map(p => p.teacherId === fromTeacherId ? { ...p, teacherId: toTeacherId } : p);
  const rec = saveTimetable({ ...src, periods } as any);
  logAudit({ module: 'timetable', action: 'timetable.bulk.teacher', recordId: id, meta: { fromTeacherId, toTeacherId } });
  return rec;
}

export function bulkReplaceRoom(id: string, fromRoom: string, toRoom: string): TimetableRecord | undefined {
  const src = getTimetable(id); if (!src) return;
  const periods: Period[] = src.periods.map(p => p.room === fromRoom ? { ...p, room: toRoom } : p);
  const rec = saveTimetable({ ...src, periods } as any);
  logAudit({ module: 'timetable', action: 'timetable.bulk.room', recordId: id, meta: { fromRoom, toRoom } });
  return rec;
}

export function bulkReplaceSubject(id: string, fromSubject: string, toSubject: string): TimetableRecord | undefined {
  const src = getTimetable(id); if (!src) return;
  const periods: Period[] = src.periods.map(p => p.subject === fromSubject ? { ...p, subject: toSubject } : p);
  const rec = saveTimetable({ ...src, periods } as any);
  logAudit({ module: 'timetable', action: 'timetable.bulk.subject', recordId: id, meta: { fromSubject, toSubject } });
  return rec;
}

export function bulkPublish(ids: string[]): number {
  let n = 0;
  ids.forEach(id => { if (publishTimetable(id)) n++; });
  logAudit({ module: 'timetable', action: 'timetable.bulk.publish', meta: { count: n } });
  return n;
}

export function bulkDuplicate(ids: string[]): number {
  let n = 0;
  ids.forEach(id => { if (duplicateAsDraft(id)) n++; });
  return n;
}
