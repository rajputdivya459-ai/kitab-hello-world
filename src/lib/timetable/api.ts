// CRUD + versioning for timetables. Backed by LocalStorage.
import { getCollection, setCollection, uid } from '@/mock/db';
import { logAudit } from '@/lib/audit';
import { notify } from '@/lib/notify';
import { getCurrentUser } from '@/auth/mockAuth';
import type { TimetableRecord, Period, TimetableStatus } from './types';

const COL = 'timetables';

export function listTimetables(): TimetableRecord[] {
  return getCollection<TimetableRecord>(COL).sort((a, b) => (b.updatedAt).localeCompare(a.updatedAt));
}
export function getTimetable(id: string): TimetableRecord | undefined {
  return listTimetables().find(t => t.id === id);
}
export function timetablesFor(filter: Partial<Pick<TimetableRecord, 'className' | 'section' | 'kind' | 'status'>>): TimetableRecord[] {
  return listTimetables().filter(t =>
    (!filter.className || t.className === filter.className) &&
    (!filter.section  || t.section  === filter.section) &&
    (!filter.kind     || t.kind     === filter.kind) &&
    (!filter.status   || t.status   === filter.status)
  );
}
export function publishedFor(className: string, section: string, kind = 'academic'): TimetableRecord | undefined {
  return timetablesFor({ className, section, kind, status: 'published' })[0];
}

export function saveTimetable(input: Omit<TimetableRecord, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'status'> & { status?: TimetableStatus; id?: string }): TimetableRecord {
  const rows = listTimetables();
  const now = new Date().toISOString();
  const user = getCurrentUser();
  const existing = input.id ? rows.find(r => r.id === input.id) : undefined;
  const rec: TimetableRecord = existing
    ? { ...existing, ...input, updatedAt: now } as TimetableRecord
    : {
        id: uid('tt'),
        version: 1,
        status: input.status ?? 'draft',
        createdAt: now,
        updatedAt: now,
        createdBy: user?.id,
        ...input,
      } as TimetableRecord;
  const next = existing ? rows.map(r => r.id === rec.id ? rec : r) : [rec, ...rows];
  setCollection(COL, next);
  logAudit({ module: 'timetable', action: existing ? 'timetable.update' : 'timetable.create', recordId: rec.id, meta: { kind: rec.kind, className: rec.className, section: rec.section } });
  return rec;
}

export function duplicateAsDraft(id: string): TimetableRecord | undefined {
  const src = getTimetable(id); if (!src) return;
  const now = new Date().toISOString();
  const copy: TimetableRecord = {
    ...src,
    id: uid('tt'),
    version: src.version + 1,
    parentId: src.id,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    publishedAt: undefined,
    periods: src.periods.map(p => ({ ...p })),
  };
  setCollection(COL, [copy, ...listTimetables()]);
  logAudit({ module: 'timetable', action: 'timetable.duplicate', recordId: copy.id, meta: { from: src.id } });
  return copy;
}

export function publishTimetable(id: string): TimetableRecord | undefined {
  const rows = listTimetables();
  const rec = rows.find(r => r.id === id); if (!rec) return;
  // Archive previous published for same slot
  const now = new Date().toISOString();
  const next = rows.map(r => {
    if (r.id === id) return { ...r, status: 'published' as const, publishedAt: now, updatedAt: now };
    if (r.status === 'published' && r.className === rec.className && r.section === rec.section && r.kind === rec.kind && r.id !== id) {
      return { ...r, status: 'archived' as const, updatedAt: now };
    }
    return r;
  });
  setCollection(COL, next);
  logAudit({ module: 'timetable', action: 'timetable.publish', recordId: id, meta: { kind: rec.kind, className: rec.className, section: rec.section } });
  notify({
    title: `Timetable published — ${rec.className} ${rec.section}`,
    message: `${rec.kind} timetable v${rec.version} is now live.`,
    category: 'notice',
  }).catch(() => {});
  return next.find(r => r.id === id);
}

export function archiveTimetable(id: string) {
  const rows = listTimetables().map(r => r.id === id ? { ...r, status: 'archived' as const, updatedAt: new Date().toISOString() } : r);
  setCollection(COL, rows);
  logAudit({ module: 'timetable', action: 'timetable.archive', recordId: id });
}

export function deleteTimetable(id: string) {
  setCollection(COL, listTimetables().filter(r => r.id !== id));
  logAudit({ module: 'timetable', action: 'timetable.delete', recordId: id });
}

/** Swap two periods (by id) within a timetable and persist. */
export function swapPeriods(id: string, aId: string, bId: string): TimetableRecord | undefined {
  const rec = getTimetable(id); if (!rec) return;
  const a = rec.periods.find(p => p.id === aId);
  const b = rec.periods.find(p => p.id === bId);
  if (!a || !b) return;
  const fields: (keyof Period)[] = ['subject', 'teacherId', 'room', 'notes', 'kind'];
  fields.forEach(f => { const tmp = a[f]; (a as any)[f] = b[f]; (b as any)[f] = tmp; });
  return saveTimetable({ ...rec });
}

export function updatePeriod(id: string, periodId: string, patch: Partial<Period>): TimetableRecord | undefined {
  const rec = getTimetable(id); if (!rec) return;
  const next = { ...rec, periods: rec.periods.map(p => p.id === periodId ? { ...p, ...patch } : p) };
  return saveTimetable(next);
}
