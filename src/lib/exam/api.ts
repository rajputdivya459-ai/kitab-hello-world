// Exam schedule CRUD + versioning + workflow + notifications + audit.
import { getCollection, setCollection, uid } from '@/mock/db';
import { logAudit } from '@/lib/audit';
import { notify } from '@/lib/notify';
import { getCurrentUser } from '@/auth/mockAuth';
import * as workflow from '@/lib/workflow';
import type { ExamSchedule, ExamSlot, Room, Invigilator, ExamStatus } from './types';

const COL = 'exam_schedules';
const ROOMS = 'rooms';
const INVIGILATORS = 'invigilators';

// ---------------- Rooms ----------------
export function listRooms(): Room[] { return getCollection<Room>(ROOMS); }
export function saveRoom(r: Room) {
  const rows = listRooms();
  const idx = rows.findIndex(x => x.id === r.id);
  if (idx >= 0) rows[idx] = r; else rows.push(r);
  setCollection(ROOMS, rows);
  logAudit({ module: 'exam', action: 'room.save', recordId: r.id, after: r });
}
export function removeRoom(id: string) {
  setCollection(ROOMS, listRooms().filter(r => r.id !== id));
  logAudit({ module: 'exam', action: 'room.delete', recordId: id });
}

// ---------------- Invigilators ----------------
export function listInvigilators(): Invigilator[] {
  // Merge explicit list + all teachers as candidates
  const explicit = getCollection<Invigilator>(INVIGILATORS);
  if (explicit.length) return explicit;
  const teachers = getCollection<any>('teachers').map(t => ({ id: t.id, name: t.name, role: 'teacher' as const, available: true }));
  return teachers;
}
export function saveInvigilators(list: Invigilator[]) { setCollection(INVIGILATORS, list); }

// ---------------- Schedules ----------------
export function listSchedules(): ExamSchedule[] {
  return getCollection<ExamSchedule>(COL).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export function getSchedule(id: string): ExamSchedule | undefined {
  return listSchedules().find(s => s.id === id);
}
export function publishedSchedulesFor(className: string, section: string): ExamSchedule[] {
  return listSchedules().filter(s => s.status === 'published' && s.classes.includes(className) && s.sections.includes(section));
}
export function schedulesWithInvigilator(invId: string): ExamSchedule[] {
  return listSchedules().filter(s => s.status === 'published' && s.slots.some(sl => sl.invigilatorIds.includes(invId)));
}

export function saveSchedule(input: Omit<ExamSchedule, 'id' | 'createdAt' | 'updatedAt' | 'version'> & { id?: string; version?: number }): ExamSchedule {
  const rows = listSchedules();
  const now = new Date().toISOString();
  const user = getCurrentUser();
  const existing = input.id ? rows.find(r => r.id === input.id) : undefined;
  const rec: ExamSchedule = existing
    ? { ...existing, ...input, updatedAt: now } as ExamSchedule
    : {
        id: uid('ex'),
        version: 1,
        createdAt: now,
        updatedAt: now,
        createdBy: user?.id,
        ...input,
      } as ExamSchedule;
  const next = existing ? rows.map(r => r.id === rec.id ? rec : r) : [rec, ...rows];
  setCollection(COL, next);
  logAudit({ module: 'exam', action: existing ? 'exam.update' : 'exam.create', recordId: rec.id, meta: { title: rec.title, kind: rec.kind } });
  return rec;
}

export function duplicateSchedule(id: string): ExamSchedule | undefined {
  const src = getSchedule(id); if (!src) return;
  const now = new Date().toISOString();
  const copy: ExamSchedule = {
    ...src,
    id: uid('ex'),
    version: src.version + 1,
    parentId: src.id,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    publishedAt: undefined,
    workflowId: undefined,
    slots: src.slots.map(s => ({ ...s, id: uid('es') })),
  };
  setCollection(COL, [copy, ...listSchedules()]);
  logAudit({ module: 'exam', action: 'exam.duplicate', recordId: copy.id, meta: { from: src.id } });
  return copy;
}

/** Submit for approval via existing workflow engine. */
export function submitForApproval(id: string): ExamSchedule | undefined {
  const rec = getSchedule(id); if (!rec) return;
  const wf = workflow.submit({
    module: 'other',
    recordId: rec.id,
    title: `Exam — ${rec.title}`,
    after: { title: rec.title, kind: rec.kind, slots: rec.slots.length },
    meta: { examId: rec.id, kind: rec.kind },
  });
  return saveSchedule({ ...rec, status: 'pending', workflowId: wf.id });
}

export function approveSchedule(id: string): ExamSchedule | undefined {
  const rec = getSchedule(id); if (!rec) return;
  if (rec.workflowId) workflow.decide(rec.workflowId, 'approved');
  return saveSchedule({ ...rec, status: 'approved' });
}

export function publishSchedule(id: string): ExamSchedule | undefined {
  const rec = getSchedule(id); if (!rec) return;
  const now = new Date().toISOString();
  // Archive any earlier published for same kind+year+classes
  const rows = listSchedules().map(r => {
    if (r.id === id) return { ...r, status: 'published' as const, publishedAt: now, updatedAt: now };
    if (r.status === 'published' && r.kind === rec.kind && r.academicYear === rec.academicYear
        && r.classes.join(',') === rec.classes.join(',') && r.id !== id) {
      return { ...r, status: 'archived' as const, updatedAt: now };
    }
    return r;
  });
  setCollection(COL, rows);
  if (rec.workflowId) workflow.publish(rec.workflowId);
  logAudit({ module: 'exam', action: 'exam.publish', recordId: id, meta: { title: rec.title } });
  notify({ title: `Exam schedule published — ${rec.title}`, message: `${rec.kind} timetable is live for ${rec.classes.join(', ')}.`, category: 'notice' }).catch(() => {});
  return rows.find(r => r.id === id);
}

export function archiveSchedule(id: string) {
  const rows = listSchedules().map(r => r.id === id ? { ...r, status: 'archived' as const, updatedAt: new Date().toISOString() } : r);
  setCollection(COL, rows);
  logAudit({ module: 'exam', action: 'exam.archive', recordId: id });
}

export function deleteSchedule(id: string) {
  setCollection(COL, listSchedules().filter(r => r.id !== id));
  logAudit({ module: 'exam', action: 'exam.delete', recordId: id });
}

export function updateSlot(scheduleId: string, slotId: string, patch: Partial<ExamSlot>): ExamSchedule | undefined {
  const rec = getSchedule(scheduleId); if (!rec) return;
  const changed = { ...rec, slots: rec.slots.map(s => s.id === slotId ? { ...s, ...patch } : s) };
  const saved = saveSchedule(changed);
  logAudit({ module: 'exam', action: 'exam.slot.update', recordId: scheduleId, meta: { slotId, patch } });
  if (rec.status === 'published') {
    notify({ title: `Exam updated — ${rec.title}`, message: `A slot was rescheduled. Please review.`, category: 'notice' }).catch(() => {});
  }
  return saved;
}

export function swapSlots(scheduleId: string, aId: string, bId: string): ExamSchedule | undefined {
  const rec = getSchedule(scheduleId); if (!rec) return;
  const a = rec.slots.find(s => s.id === aId);
  const b = rec.slots.find(s => s.id === bId);
  if (!a || !b) return;
  const na = { ...a, date: b.date, start: b.start, end: b.end };
  const nb = { ...b, date: a.date, start: a.start, end: a.end };
  return saveSchedule({ ...rec, slots: rec.slots.map(s => s.id === aId ? na : s.id === bId ? nb : s) });
}
