// Extra / special / doubt classes shown alongside regular timetable.
import { getCollection, setCollection, uid } from '@/mock/db';
import { logAudit } from '@/lib/audit';
import { notify } from '@/lib/notify';

export type ExtraKind = 'weekend' | 'holiday' | 'revision' | 'doubt' | 'coaching';

export interface ExtraClass {
  id: string;
  kind: ExtraKind;
  date: string;             // YYYY-MM-DD
  start: string;            // HH:mm
  end: string;
  subject: string;
  teacherId: string;
  room?: string;
  className: string;
  section: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

const COL = 'extra_classes';

export function listExtras(filter?: Partial<Pick<ExtraClass, 'className' | 'section' | 'teacherId' | 'date' | 'kind'>>): ExtraClass[] {
  return getCollection<ExtraClass>(COL)
    .filter(e =>
      (!filter?.className || e.className === filter.className) &&
      (!filter?.section || e.section === filter.section) &&
      (!filter?.teacherId || e.teacherId === filter.teacherId) &&
      (!filter?.date || e.date === filter.date) &&
      (!filter?.kind || e.kind === filter.kind)
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
}

export function addExtra(input: Omit<ExtraClass, 'id' | 'createdAt'>): ExtraClass {
  const rec: ExtraClass = { id: uid('ex'), createdAt: new Date().toISOString(), ...input };
  setCollection(COL, [rec, ...listExtras()]);
  logAudit({ module: 'timetable', action: 'extra.create', recordId: rec.id, meta: { kind: rec.kind, date: rec.date } });
  notify({ title: `Extra class — ${rec.subject}`, message: `${rec.date} ${rec.start}–${rec.end} · Class ${rec.className}-${rec.section}`, category: 'notice' }).catch(() => {});
  return rec;
}

export function removeExtra(id: string) {
  setCollection(COL, listExtras().filter(e => e.id !== id));
  logAudit({ module: 'timetable', action: 'extra.remove', recordId: id });
}
