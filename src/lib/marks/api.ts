// Marks Entry & Evaluation API — LocalStorage backed (mock runtime),
// integrated with the Workflow Engine, Audit Log and Notification Engine.

import { getCollection, setCollection, uid } from '@/mock/db';
import { getCurrentUser } from '@/auth/mockAuth';
import { logAudit } from '@/lib/audit';
import { notifyAll } from '@/lib/notify';
import * as workflow from '@/lib/workflow';
import { listExams, type ExamMaster } from '@/lib/exam/master';
import { componentsFromScheme } from './schemes';
import type {
  MarksSheet, MarksSheetStatus, MarksRow, MarksHistoryEntry, ComponentConfig,
} from './types';

const COL = 'marks_sheets';
const HIST = 'marks_history';
const ROSTER = 'marks_roster';
const ASSIGN = 'teacher_subjects';

// ---------------- roster ----------------
export interface RosterStudent {
  id: string; roll: string; name: string; admissionNo: string; classId: string; section: string;
}
export const listRoster = () => getCollection<RosterStudent>(ROSTER);
export const rosterFor = (classId: string, section: string) =>
  listRoster().filter(s => s.classId === classId && s.section === section)
    .sort((a, b) => a.roll.localeCompare(b.roll, undefined, { numeric: true }));

// ---------------- teacher assignments ----------------
export interface TeacherSubject {
  id: string; teacherId: string; teacherName: string;
  classId: string; section: string; subjectName: string;
}
export const listAssignments = () => getCollection<TeacherSubject>(ASSIGN);
export const assignmentsForTeacher = (teacherId: string) =>
  listAssignments().filter(a => a.teacherId === teacherId);

/** Exams a teacher can enter marks for: published/scheduled/completed masters only. */
export function visibleExams(role: string | null, teacherId?: string): ExamMaster[] {
  const rows = listExams();
  const usable = rows.filter(e => ['published', 'scheduled', 'completed'].includes(e.status));
  if (role === 'teacher' && teacherId) {
    const mine = assignmentsForTeacher(teacherId);
    return usable.filter(e => mine.some(a => e.classes.includes(a.classId) && e.sections.includes(a.section)));
  }
  return usable;
}

// ---------------- CRUD ----------------
export const listSheets = () => getCollection<MarksSheet>(COL);
export const getSheet = (id: string) => listSheets().find(s => s.id === id);

export interface SheetFilter {
  academicYear?: string; examId?: string; classId?: string; section?: string;
  subjectName?: string; teacherId?: string; status?: MarksSheetStatus | 'all'; q?: string;
  from?: string; to?: string;
}

export function filterSheets(f: SheetFilter, rows = listSheets()): MarksSheet[] {
  return rows.filter(s => {
    if (f.academicYear && s.academicYear !== f.academicYear) return false;
    if (f.examId && s.examId !== f.examId) return false;
    if (f.classId && s.classId !== f.classId) return false;
    if (f.section && s.section !== f.section) return false;
    if (f.subjectName && s.subjectName !== f.subjectName) return false;
    if (f.teacherId && s.teacherId !== f.teacherId) return false;
    if (f.status && f.status !== 'all' && s.status !== f.status) return false;
    if (f.from && s.updatedAt.slice(0, 10) < f.from) return false;
    if (f.to && s.updatedAt.slice(0, 10) > f.to) return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      const hay = `${s.examName} ${s.subjectName} ${s.classId} ${s.section} ${s.teacherName}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function persist(rows: MarksSheet[]) { setCollection(COL, rows); }

export function saveSheet(sheet: MarksSheet): MarksSheet {
  const rows = listSheets();
  const i = rows.findIndex(r => r.id === sheet.id);
  const next = { ...sheet, updatedAt: new Date().toISOString() };
  if (i >= 0) rows[i] = next; else rows.unshift(next);
  persist(rows);
  return next;
}

export interface CreateSheetInput {
  exam: ExamMaster; classId: string; section: string; subjectName: string;
  schemeId: string; teacherId: string; teacherName: string; components?: ComponentConfig[];
}

/** Returns the existing sheet for this exam/class/section/subject or creates a draft. */
export function ensureSheet(input: CreateSheetInput): MarksSheet {
  const found = listSheets().find(s =>
    s.examId === input.exam.id && s.classId === input.classId &&
    s.section === input.section && s.subjectName === input.subjectName);
  if (found) return found;

  const now = new Date().toISOString();
  const rows: MarksRow[] = rosterFor(input.classId, input.section).map(st => ({
    studentId: st.id, roll: st.roll, name: st.name, admissionNo: st.admissionNo,
    status: 'present', marks: {}, remarks: '',
  }));
  const sheet: MarksSheet = {
    id: uid('ms'),
    examId: input.exam.id,
    examName: input.exam.name,
    academicYear: input.exam.academicYear,
    classId: input.classId,
    section: input.section,
    subjectId: `${input.subjectName}-${input.classId}`,
    subjectName: input.subjectName,
    teacherId: input.teacherId,
    teacherName: input.teacherName,
    schemeId: input.schemeId,
    components: input.components ?? componentsFromScheme(input.schemeId),
    rows,
    status: 'draft',
    locked: false,
    createdAt: now,
    updatedAt: now,
  };
  const next = saveSheet(sheet);
  addHistory(next, 'created');
  logAudit({ module: 'marks', action: 'marks.created', recordId: next.id, meta: label(next) });
  return next;
}

export function deleteSheet(id: string) {
  persist(listSheets().filter(s => s.id !== id));
}

const label = (s: MarksSheet) => ({
  exam: s.examName, class: `${s.classId}-${s.section}`, subject: s.subjectName, teacher: s.teacherName,
});

// ---------------- history ----------------
export const listHistory = (sheetId?: string) =>
  getCollection<MarksHistoryEntry>(HIST).filter(h => !sheetId || h.sheetId === sheetId);

export function addHistory(sheet: MarksSheet, action: string, extra?: Partial<MarksHistoryEntry>) {
  const user = getCurrentUser();
  const entry: MarksHistoryEntry = {
    id: uid('mh'),
    sheetId: sheet.id,
    action,
    status: sheet.status,
    userId: user?.id ?? 'system',
    userName: user?.name ?? 'System',
    ts: new Date().toISOString(),
    ...extra,
  };
  const rows = getCollection<MarksHistoryEntry>(HIST);
  rows.unshift(entry);
  setCollection(HIST, rows.slice(0, 1000));
  return entry;
}

/** Records per-student diffs so nothing is ever silently overwritten. */
export function recordRowChanges(before: MarksSheet, after: MarksSheet, reason?: string) {
  const prev = new Map(before.rows.map(r => [r.studentId, r]));
  after.rows.forEach(r => {
    const p = prev.get(r.studentId);
    if (!p) return;
    const changed = JSON.stringify(p.marks) !== JSON.stringify(r.marks) || p.status !== r.status || (p.remarks ?? '') !== (r.remarks ?? '');
    if (changed) {
      addHistory(after, 'marks.updated', {
        studentId: r.studentId,
        before: { marks: p.marks, status: p.status, remarks: p.remarks },
        after: { marks: r.marks, status: r.status, remarks: r.remarks },
        reason,
      });
    }
  });
}

// ---------------- workflow transitions ----------------
function transition(sheet: MarksSheet, status: MarksSheetStatus, patch: Partial<MarksSheet> = {}): MarksSheet {
  return saveSheet({ ...sheet, ...patch, status });
}

export function saveDraft(sheet: MarksSheet, reason?: string): MarksSheet {
  const before = getSheet(sheet.id);
  const next = transition(sheet, sheet.status === 'returned' ? 'returned' : 'draft');
  if (before) recordRowChanges(before, next, reason);
  addHistory(next, 'draft.save');
  logAudit({ module: 'marks', action: 'marks.draft.save', recordId: next.id, meta: label(next) });
  return next;
}

export function submitSheet(sheet: MarksSheet): MarksSheet {
  const wf = workflow.submit({
    module: 'result',
    recordId: sheet.id,
    title: `Marks — ${sheet.examName} · ${sheet.classId}-${sheet.section} · ${sheet.subjectName}`,
    after: { rows: sheet.rows.length, components: sheet.components.map(c => c.label) },
    meta: { sheetId: sheet.id, subject: sheet.subjectName, class: `${sheet.classId}-${sheet.section}` },
  });
  const next = transition(sheet, 'submitted', { workflowId: wf.id, submittedAt: new Date().toISOString(), reviewerRemarks: undefined });
  addHistory(next, 'submitted');
  logAudit({ module: 'marks', action: 'marks.submitted', recordId: next.id, meta: label(next) });
  notifyAll({ title: 'Marks submitted for review', message: `${next.teacherName} submitted ${next.subjectName} marks for ${next.classId}-${next.section} (${next.examName}).`, category: 'result' });
  return next;
}

export function returnSheet(sheet: MarksSheet, remarks: string): MarksSheet {
  if (sheet.workflowId) workflow.decide(sheet.workflowId, 'rejected', remarks);
  const next = transition(sheet, 'returned', { reviewerRemarks: remarks, reviewedBy: getCurrentUser()?.name, decidedAt: new Date().toISOString() });
  addHistory(next, 'returned', { reason: remarks });
  logAudit({ module: 'marks', action: 'marks.returned', recordId: next.id, meta: { ...label(next), remarks } });
  notifyAll({ title: 'Marks returned for correction', message: `${next.subjectName} · ${next.classId}-${next.section}: ${remarks}`, category: 'result' });
  return next;
}

export function approveSheet(sheet: MarksSheet, remarks?: string): MarksSheet {
  if (sheet.workflowId) workflow.decide(sheet.workflowId, 'approved', remarks);
  const next = transition(sheet, 'approved', { reviewerRemarks: remarks, reviewedBy: getCurrentUser()?.name, decidedAt: new Date().toISOString() });
  addHistory(next, 'approved', { reason: remarks });
  logAudit({ module: 'marks', action: 'marks.approved', recordId: next.id, meta: label(next) });
  notifyAll({ title: 'Marks approved', message: `${next.subjectName} · ${next.classId}-${next.section} (${next.examName}) approved.`, category: 'result' });
  return next;
}

export function rejectSheet(sheet: MarksSheet, remarks: string): MarksSheet {
  if (sheet.workflowId) workflow.decide(sheet.workflowId, 'rejected', remarks);
  const next = transition(sheet, 'returned', { reviewerRemarks: `Rejected: ${remarks}`, reviewedBy: getCurrentUser()?.name, decidedAt: new Date().toISOString() });
  addHistory(next, 'rejected', { reason: remarks });
  logAudit({ module: 'marks', action: 'marks.rejected', recordId: next.id, meta: { ...label(next), remarks } });
  return next;
}

export function publishSheet(sheet: MarksSheet): MarksSheet {
  if (sheet.workflowId) workflow.publish(sheet.workflowId);
  const next = transition(sheet, 'published', { locked: true, publishedAt: new Date().toISOString() });
  addHistory(next, 'published');
  logAudit({ module: 'marks', action: 'marks.published', recordId: next.id, meta: label(next) });
  // Phase 7.6: staff-facing only. Student/parent notifications happen in 7.7.
  notifyAll({ title: 'Marks published', message: `${next.subjectName} · ${next.classId}-${next.section} (${next.examName}) marks published.`, category: 'result' });
  return next;
}

export function setLocked(sheet: MarksSheet, locked: boolean): MarksSheet {
  const next = saveSheet({ ...sheet, locked });
  addHistory(next, locked ? 'locked' : 'unlocked');
  logAudit({ module: 'marks', action: locked ? 'marks.locked' : 'marks.unlocked', recordId: next.id, meta: label(next) });
  return next;
}

// ---------------- bulk ----------------
export function bulkTransition(ids: string[], op: 'submit' | 'approve' | 'reject' | 'publish' | 'lock' | 'unlock', remarks = ''): number {
  let n = 0;
  ids.forEach(id => {
    const s = getSheet(id);
    if (!s) return;
    if (op === 'submit' && ['draft', 'returned'].includes(s.status)) { submitSheet(s); n++; }
    else if (op === 'approve' && s.status === 'submitted') { approveSheet(s, remarks); n++; }
    else if (op === 'reject' && s.status === 'submitted') { rejectSheet(s, remarks || 'Returned by reviewer'); n++; }
    else if (op === 'publish' && s.status === 'approved') { publishSheet(s); n++; }
    else if (op === 'lock' && !s.locked) { setLocked(s, true); n++; }
    else if (op === 'unlock' && s.locked) { setLocked(s, false); n++; }
  });
  return n;
}

// ---------------- stats ----------------
export interface MarksStats {
  total: number; draft: number; submitted: number; returned: number; approved: number; published: number;
  completion: number;
}
export function statsFor(rows: MarksSheet[]): MarksStats {
  const count = (s: MarksSheetStatus) => rows.filter(r => r.status === s).length;
  const published = count('published');
  return {
    total: rows.length,
    draft: count('draft'), submitted: count('submitted'), returned: count('returned'),
    approved: count('approved'), published,
    completion: rows.length ? Math.round(((published + count('approved')) / rows.length) * 100) : 0,
  };
}

// ---------------- import helpers ----------------
/**
 * Parse pasted spreadsheet / CSV text into per-student values.
 * Expected columns: Roll, [Name], then one column per enabled component.
 */
export function parseBulkText(text: string, components: ComponentConfig[], rows: MarksRow[]):
  { updated: MarksRow[]; matched: number; skipped: string[] } {
  const active = components.filter(c => c.enabled);
  const byRoll = new Map(rows.map(r => [r.roll.trim().toLowerCase(), r]));
  const byAdm = new Map(rows.map(r => [r.admissionNo.trim().toLowerCase(), r]));
  const next = rows.map(r => ({ ...r, marks: { ...r.marks } }));
  const idx = new Map(next.map((r, i) => [r.studentId, i]));
  const skipped: string[] = [];
  let matched = 0;

  text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(line => {
    const cells = line.split(/\t|,|;/).map(c => c.trim());
    if (!cells.length) return;
    const key = cells[0].toLowerCase();
    const target = byRoll.get(key) ?? byAdm.get(key);
    if (!target) { skipped.push(cells[0]); return; }
    const i = idx.get(target.studentId)!;
    // numeric cells after the identifier (name column tolerated)
    const values = cells.slice(1).filter(c => c === '' || /^-?\d*\.?\d*$/.test(c) || /^(A|AB|ABSENT|M|MEDICAL|E|EXEMPT)$/i.test(c));
    const flag = values.find(v => /^(A|AB|ABSENT|M|MEDICAL|E|EXEMPT)$/i.test(v));
    if (flag) {
      next[i].status = /^(M|MEDICAL)$/i.test(flag) ? 'medical' : /^(E|EXEMPT)$/i.test(flag) ? 'exempt' : 'absent';
      next[i].marks = {};
    } else {
      next[i].status = 'present';
      active.forEach((c, j) => {
        const v = values[j];
        if (v !== undefined && v !== '') next[i].marks[c.id] = Number(v);
      });
    }
    matched++;
  });
  return { updated: next, matched, skipped };
}
