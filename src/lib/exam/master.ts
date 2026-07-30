// Phase 7.5 — Exam Management Foundation.
// Exam Master sits ON TOP of the existing Exam Scheduler (src/lib/exam/api.ts).
// It owns exam metadata, class/section mapping, subject mapping, instructions,
// coordinator and lifecycle. Scheduling itself is delegated to the scheduler.

import { getCollection, setCollection, uid } from '@/mock/db';
import { logAudit } from '@/lib/audit';
import { notify } from '@/lib/notify';
import { getCurrentUser } from '@/auth/mockAuth';
import * as workflow from '@/lib/workflow';
import { generateExamSchedule } from './generator';
import { listRooms, listInvigilators, saveSchedule, publishSchedule, getSchedule, deleteSchedule } from './api';
import type { ExamSchedule } from './types';

const COL = 'exam_masters';

export type ExamMasterStatus =
  | 'draft' | 'pending' | 'approved' | 'scheduled' | 'published' | 'completed' | 'archived';

export type ExamTypeId =
  | 'unit_test' | 'weekly_test' | 'monthly_test' | 'quarterly'
  | 'half_yearly' | 'annual' | 'practical' | 'oral' | 'supplementary' | 'custom';

export const EXAM_TYPES: Array<{ id: ExamTypeId; label: string; abbr: string }> = [
  { id: 'unit_test', label: 'Unit Test', abbr: 'UT' },
  { id: 'weekly_test', label: 'Weekly Test', abbr: 'WT' },
  { id: 'monthly_test', label: 'Monthly Test', abbr: 'MT' },
  { id: 'quarterly', label: 'Quarterly Examination', abbr: 'QE' },
  { id: 'half_yearly', label: 'Half-Yearly Examination', abbr: 'HY' },
  { id: 'annual', label: 'Annual Examination', abbr: 'AE' },
  { id: 'practical', label: 'Practical Examination', abbr: 'PR' },
  { id: 'oral', label: 'Oral Examination', abbr: 'OR' },
  { id: 'supplementary', label: 'Supplementary Examination', abbr: 'SU' },
  { id: 'custom', label: 'Custom Examination', abbr: 'CX' },
];

export const examTypeLabel = (id: string) => EXAM_TYPES.find(t => t.id === id)?.label ?? id;

export type SubjectCategory = 'mandatory' | 'optional' | 'elective' | 'practical';

export interface ExamSubject {
  id: string;
  name: string;
  code: string;
  maxMarks: number;
  passingMarks: number;
  duration: number;              // minutes
  isPractical: boolean;
  category: SubjectCategory;
}

export interface ExamInstructions {
  general?: string;              // rich text (HTML)
  allowedMaterials?: string;
  reportingTime?: string;        // HH:mm
  uniform?: string;
  calculator?: string;
  mobilePolicy?: string;
  attendanceRules?: string;
}

export interface ExamMaster {
  id: string;
  code: string;                  // auto-generated e.g. QE-2026-27-01
  name: string;
  academicYear: string;
  type: ExamTypeId;
  description?: string;
  status: ExamMasterStatus;
  startDate: string;             // YYYY-MM-DD
  endDate: string;
  workingDays: Array<'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun'>;
  holidays: string[];
  coordinatorId?: string;
  coordinatorName?: string;
  classes: string[];
  sections: string[];
  wholeSchool?: boolean;
  subjects: ExamSubject[];
  instructions: ExamInstructions;
  visible: boolean;              // visibility to portals
  scheduleId?: string;           // link to ExamSchedule
  workflowId?: string;
  roomIds?: string[];
  invigilatorIds?: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  createdBy?: string;
  parentId?: string;
}

// ---------------- helpers ----------------
export function nextExamCode(type: ExamTypeId, academicYear: string, rows = listExams()): string {
  const abbr = EXAM_TYPES.find(t => t.id === type)?.abbr ?? 'EX';
  const n = rows.filter(r => r.type === type && r.academicYear === academicYear).length + 1;
  return `${abbr}-${academicYear}-${String(n).padStart(2, '0')}`;
}

export function workingDayCount(e: Pick<ExamMaster, 'startDate' | 'endDate' | 'workingDays' | 'holidays'>): number {
  const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let n = 0;
  const d = new Date(e.startDate + 'T00:00:00');
  const end = new Date(e.endDate + 'T00:00:00');
  while (d <= end) {
    const iso = d.toISOString().slice(0, 10);
    if (e.workingDays.includes(names[d.getDay()] as any) && !(e.holidays ?? []).includes(iso)) n++;
    d.setDate(d.getDate() + 1);
  }
  return n;
}

export type ExamPhase = 'upcoming' | 'ongoing' | 'completed';
export function examPhase(e: ExamMaster, today = new Date().toISOString().slice(0, 10)): ExamPhase {
  if (today < e.startDate) return 'upcoming';
  if (today > e.endDate) return 'completed';
  return 'ongoing';
}

// ---------------- CRUD ----------------
export function listExams(): ExamMaster[] {
  return getCollection<ExamMaster>(COL).sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
}
export function getExam(id: string): ExamMaster | undefined {
  return listExams().find(e => e.id === id);
}
export function publishedExams(): ExamMaster[] {
  return listExams().filter(e => e.visible && (e.status === 'published' || e.status === 'completed'));
}
export function publishedExamsFor(className: string, section: string): ExamMaster[] {
  return publishedExams().filter(e => e.wholeSchool || (e.classes.includes(className) && (!e.sections.length || e.sections.includes(section))));
}
export function examsForCoordinator(id: string): ExamMaster[] {
  return listExams().filter(e => e.coordinatorId === id);
}

type SaveInput = Partial<ExamMaster> & { name: string; type: ExamTypeId; academicYear: string; startDate: string; endDate: string };

export function saveExam(input: SaveInput): ExamMaster {
  const rows = listExams();
  const now = new Date().toISOString();
  const existing = input.id ? rows.find(r => r.id === input.id) : undefined;
  const rec: ExamMaster = existing
    ? { ...existing, ...input, updatedAt: now } as ExamMaster
    : {
        status: 'draft',
        classes: [],
        sections: [],
        subjects: [],
        instructions: {},
        holidays: [],
        workingDays: ['Mon','Tue','Wed','Thu','Fri','Sat'],
        visible: false,
        ...input,
        id: uid('em'),
        code: input.code || nextExamCode(input.type, input.academicYear, rows),
        createdAt: now,
        updatedAt: now,
        createdBy: getCurrentUser()?.id,
      } as ExamMaster;
  setCollection(COL, existing ? rows.map(r => (r.id === rec.id ? rec : r)) : [rec, ...rows]);
  logAudit({
    module: 'exam', action: existing ? 'exam.master.update' : 'exam.master.create',
    recordId: rec.id, after: { name: rec.name, type: rec.type, status: rec.status },
  });
  if (!existing) {
    notify({ title: `Exam created — ${rec.name}`, message: `${examTypeLabel(rec.type)} (${rec.code}) has been created.`, category: 'notice' }).catch(() => {});
  }
  return rec;
}

export function setSubjects(id: string, subjects: ExamSubject[]) {
  const rec = getExam(id); if (!rec) return;
  logAudit({ module: 'exam', action: 'exam.master.subjects', recordId: id, after: { count: subjects.length } });
  return saveExam({ ...rec, subjects });
}

export function setMapping(id: string, classes: string[], sections: string[], wholeSchool = false) {
  const rec = getExam(id); if (!rec) return;
  logAudit({ module: 'exam', action: 'exam.master.mapping', recordId: id, after: { classes, sections, wholeSchool } });
  return saveExam({ ...rec, classes, sections, wholeSchool });
}

export function setCoordinator(id: string, coordinatorId: string, coordinatorName: string) {
  const rec = getExam(id); if (!rec) return;
  logAudit({ module: 'exam', action: 'exam.master.coordinator', recordId: id, before: { coordinatorId: rec.coordinatorId }, after: { coordinatorId } });
  return saveExam({ ...rec, coordinatorId, coordinatorName });
}

export function setInstructions(id: string, instructions: ExamInstructions) {
  const rec = getExam(id); if (!rec) return;
  logAudit({ module: 'exam', action: 'exam.master.instructions', recordId: id });
  return saveExam({ ...rec, instructions });
}

export function deleteExam(id: string) {
  const rec = getExam(id);
  if (rec?.scheduleId) deleteSchedule(rec.scheduleId);
  setCollection(COL, listExams().filter(e => e.id !== id));
  logAudit({ module: 'exam', action: 'exam.master.delete', recordId: id });
}

// ---------------- Lifecycle (workflow engine) ----------------
export function submitExam(id: string) {
  const rec = getExam(id); if (!rec) return;
  const wf = workflow.submit({
    module: 'other',
    recordId: rec.id,
    title: `Exam Master — ${rec.name}`,
    after: { code: rec.code, type: rec.type, classes: rec.classes, subjects: rec.subjects.length },
    meta: { examMasterId: rec.id },
  });
  return saveExam({ ...rec, status: 'pending', workflowId: wf.id });
}

export function approveExam(id: string, remarks?: string) {
  const rec = getExam(id); if (!rec) return;
  if (rec.workflowId) workflow.decide(rec.workflowId, 'approved', remarks);
  logAudit({ module: 'exam', action: 'exam.master.approve', recordId: id });
  return saveExam({ ...rec, status: rec.scheduleId ? 'scheduled' : 'approved' });
}

export function rejectExam(id: string, remarks?: string) {
  const rec = getExam(id); if (!rec) return;
  if (rec.workflowId) workflow.decide(rec.workflowId, 'rejected', remarks);
  logAudit({ module: 'exam', action: 'exam.master.reject', recordId: id, meta: { remarks } });
  return saveExam({ ...rec, status: 'draft' });
}

export function publishExam(id: string) {
  const rec = getExam(id); if (!rec) return;
  if (!rec.scheduleId) return rec;
  publishSchedule(rec.scheduleId);
  if (rec.workflowId) workflow.publish(rec.workflowId);
  logAudit({ module: 'exam', action: 'exam.master.publish', recordId: id, meta: { code: rec.code } });
  notify({ title: `Exam published — ${rec.name}`, message: `${examTypeLabel(rec.type)} timetable is now live.`, category: 'notice' }).catch(() => {});
  return saveExam({ ...rec, status: 'published', visible: true, publishedAt: new Date().toISOString() });
}

export function completeExam(id: string) {
  const rec = getExam(id); if (!rec) return;
  logAudit({ module: 'exam', action: 'exam.master.complete', recordId: id });
  return saveExam({ ...rec, status: 'completed' });
}

export function archiveExam(id: string) {
  const rec = getExam(id); if (!rec) return;
  logAudit({ module: 'exam', action: 'exam.master.archive', recordId: id });
  notify({ title: `Exam archived — ${rec.name}`, message: `${rec.code} has been archived.`, category: 'notice' }).catch(() => {});
  return saveExam({ ...rec, status: 'archived', visible: false });
}

// ---------------- Schedule integration (reuses Exam Scheduler) ----------------
export function generateForExam(id: string): { exam?: ExamMaster; conflicts: any[] } {
  const rec = getExam(id);
  if (!rec) return { conflicts: [] };
  const rooms = listRooms().filter(r => !rec.roomIds?.length || rec.roomIds.includes(r.id));
  const invigilators = listInvigilators().filter(i => !rec.invigilatorIds?.length || rec.invigilatorIds.includes(i.id));
  const subjects = rec.subjects.map(s => s.name);
  const duration = rec.subjects[0]?.duration ?? 180;
  const { slots, conflicts } = generateExamSchedule({
    kind: rec.type,
    academicYear: rec.academicYear,
    title: rec.name,
    classes: rec.classes,
    sections: rec.sections.length ? rec.sections : ['A'],
    subjects,
    startDate: rec.startDate,
    endDate: rec.endDate,
    examDuration: duration,
    breakDuration: 30,
    dailyLimit: 1,
    holidays: rec.holidays ?? [],
    workingDays: rec.workingDays,
    preferredStart: rec.instructions.reportingTime ?? '09:00',
    roomIds: rooms.map(r => r.id),
    invigilatorIds: invigilators.map(i => i.id),
  }, rooms, invigilators);

  const existing = rec.scheduleId ? getSchedule(rec.scheduleId) : undefined;
  const schedule = saveSchedule({
    ...(existing ?? {}),
    id: existing?.id,
    kind: rec.type,
    status: existing?.status === 'published' ? 'published' : 'draft',
    academicYear: rec.academicYear,
    title: rec.name,
    classes: rec.classes,
    sections: rec.sections.length ? rec.sections : ['A'],
    subjects,
    startDate: rec.startDate,
    endDate: rec.endDate,
    examDuration: duration,
    breakDuration: 30,
    dailyLimit: 1,
    holidays: rec.holidays ?? [],
    workingDays: rec.workingDays,
    preferredStart: rec.instructions.reportingTime ?? '09:00',
    roomIds: rooms.map(r => r.id),
    invigilatorIds: invigilators.map(i => i.id),
    slots,
  } as any);

  logAudit({ module: 'exam', action: existing ? 'exam.master.schedule.regenerate' : 'exam.master.schedule.generate', recordId: rec.id, meta: { slots: slots.length, conflicts: conflicts.length } });
  notify({ title: `Exam scheduled — ${rec.name}`, message: `${slots.length} exam slots generated.`, category: 'notice' }).catch(() => {});
  const exam = saveExam({ ...rec, scheduleId: schedule.id, status: rec.status === 'draft' ? 'draft' : 'scheduled' });
  return { exam, conflicts };
}

export function scheduleOf(e: ExamMaster): ExamSchedule | undefined {
  return e.scheduleId ? getSchedule(e.scheduleId) : undefined;
}

// ---------------- Bulk operations ----------------
export function duplicateExam(id: string, opts: { copySubjects?: boolean; copySchedule?: boolean } = { copySubjects: true }): ExamMaster | undefined {
  const src = getExam(id); if (!src) return;
  const copy = saveExam({
    ...src,
    id: undefined,
    code: nextExamCode(src.type, src.academicYear),
    name: `${src.name} (Copy)`,
    status: 'draft',
    visible: false,
    workflowId: undefined,
    publishedAt: undefined,
    scheduleId: undefined,
    parentId: src.id,
    subjects: opts.copySubjects === false ? [] : src.subjects.map(s => ({ ...s, id: uid('sub') })),
  } as any);
  if (opts.copySchedule) generateForExam(copy.id);
  logAudit({ module: 'exam', action: 'exam.master.duplicate', recordId: copy.id, meta: { from: src.id } });
  return getExam(copy.id);
}

export function copySubjectMapping(fromId: string, toIds: string[]) {
  const src = getExam(fromId); if (!src) return;
  toIds.forEach(id => setSubjects(id, src.subjects.map(s => ({ ...s, id: uid('sub') }))));
}

export function archiveMany(ids: string[]) { ids.forEach(archiveExam); }
export function publishMany(ids: string[]) { ids.forEach(publishExam); }
