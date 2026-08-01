// Results API — generation from approved marks, workflow lifecycle, remarks,
// history/audit, notifications, analytics and progress reports.

import { getCollection, setCollection, uid } from '@/mock/db';
import { getCurrentUser } from '@/auth/mockAuth';
import { logAudit } from '@/lib/audit';
import { notifyAll, notifyClass } from '@/lib/notify';
import * as workflow from '@/lib/workflow';
import { listExams, getExam, type ExamMaster } from '@/lib/exam/master';
import { listSheets, rosterFor } from '@/lib/marks/api';
import type { MarksSheet } from '@/lib/marks/types';
import { getConfig } from './config';
import { buildStudentResult, computeStats } from './calc';
import { recomputeRanks } from './rank';
import type { ResultSet, ResultSetStatus, ResultStats, StudentResult } from './types';

const COL = 'result_sets';

export const listSets = () => getCollection<ResultSet>(COL);
export const getSet = (id: string) => listSets().find(s => s.id === id);
export const publishedSets = () => listSets().filter(s => s.status === 'published');

function persist(rows: ResultSet[]) { setCollection(COL, rows); }

export function saveSet(set: ResultSet): ResultSet {
  const rows = listSets();
  const next = { ...set, updatedAt: new Date().toISOString() };
  const i = rows.findIndex(r => r.id === set.id);
  if (i >= 0) rows[i] = next; else rows.unshift(next);
  persist(rows);
  return next;
}

export function deleteSet(id: string) {
  persist(listSets().filter(s => s.id !== id));
}

export interface ResultFilter {
  academicYear?: string; examId?: string; classId?: string; section?: string;
  status?: ResultSetStatus | 'all'; q?: string; from?: string; to?: string;
}

export function filterSets(f: ResultFilter, rows = listSets()): ResultSet[] {
  return rows.filter(s => {
    if (f.academicYear && s.academicYear !== f.academicYear) return false;
    if (f.examId && s.examId !== f.examId) return false;
    if (f.classId && s.classId !== f.classId) return false;
    if (f.section && s.section !== f.section) return false;
    if (f.status && f.status !== 'all' && s.status !== f.status) return false;
    if (f.from && s.updatedAt.slice(0, 10) < f.from) return false;
    if (f.to && s.updatedAt.slice(0, 10) > f.to) return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      const hay = `${s.examName} ${s.classId}-${s.section} ${s.academicYear}`.toLowerCase();
      const inStudents = s.students.some(st => `${st.name} ${st.admissionNo} ${st.roll}`.toLowerCase().includes(q));
      if (!hay.includes(q) && !inStudents) return false;
    }
    return true;
  });
}

/** Marks sheets usable as a result source: approved or published only. */
export const sourceSheets = (examId: string, classId: string, section: string): MarksSheet[] =>
  listSheets().filter(s =>
    s.examId === examId && s.classId === classId && s.section === section &&
    (s.status === 'approved' || s.status === 'published'));

export interface GenerateTarget { examId: string; classId: string; section: string }

/** Class/section combinations that have approved marks and can be generated. */
export function generatableTargets(): Array<GenerateTarget & { examName: string; subjects: number; academicYear: string }> {
  const map = new Map<string, { examId: string; examName: string; classId: string; section: string; subjects: number; academicYear: string }>();
  listSheets().forEach(s => {
    if (s.status !== 'approved' && s.status !== 'published') return;
    const key = `${s.examId}|${s.classId}|${s.section}`;
    const cur = map.get(key);
    if (cur) cur.subjects++;
    else map.set(key, { examId: s.examId, examName: s.examName, classId: s.classId, section: s.section, subjects: 1, academicYear: s.academicYear });
  });
  return [...map.values()];
}

const attendanceFor = (studentId: string, sheets: MarksSheet[]) => {
  let present = 0, total = 0;
  sheets.forEach(sh => {
    const r = sh.rows.find(x => x.studentId === studentId);
    if (!r) return;
    total++;
    if (r.status === 'present' || r.status === 'medical') present++;
  });
  return total ? Math.round((present / total) * 100) : 0;
};

const reportNo = (set: { academicYear: string; classId: string; section: string }, roll: string, examCode: string) =>
  `RC/${set.academicYear.replace('-', '')}/${examCode}/${set.classId}${set.section}/${roll}`;

/** Generate (or regenerate) a draft result set from approved marks. */
export function generateResults(target: GenerateTarget, configId?: string): ResultSet | { error: string } {
  const cfg = getConfig(configId);
  const sheets = sourceSheets(target.examId, target.classId, target.section);
  if (!sheets.length) return { error: 'No approved or published marks found for this exam / class / section.' };

  const exam: ExamMaster | undefined = getExam(target.examId);
  const existing = listSets().find(s =>
    s.examId === target.examId && s.classId === target.classId && s.section === target.section);
  if (existing && (existing.status === 'published' || existing.status === 'archived')) {
    return { error: `Result set is already ${existing.status}. Unpublish or archive before regenerating.` };
  }

  const roster = rosterFor(target.classId, target.section);
  const base = {
    academicYear: sheets[0].academicYear,
    classId: target.classId,
    section: target.section,
  };
  const examCode = (exam?.code ?? sheets[0].examName.slice(0, 3)).toString().toUpperCase().replace(/\s+/g, '');

  const students: StudentResult[] = roster
    .filter(st => sheets.some(sh => sh.rows.some(r => r.studentId === st.id)))
    .map(st => buildStudentResult({
      cfg, sheets,
      studentId: st.id, roll: st.roll, name: st.name, admissionNo: st.admissionNo,
      attendancePct: attendanceFor(st.id, sheets),
      reportCardNo: reportNo(base, st.roll, examCode),
    }));

  const now = new Date().toISOString();
  const set: ResultSet = {
    id: existing?.id ?? uid('rs'),
    examId: target.examId,
    examName: sheets[0].examName,
    examType: exam?.type ?? 'custom',
    academicYear: base.academicYear,
    classId: target.classId,
    section: target.section,
    configId: cfg.id,
    status: 'draft',
    students,
    subjects: sheets.map(s => s.subjectName),
    sourceSheetIds: sheets.map(s => s.id),
    templateId: existing?.templateId ?? cfg.defaultTemplate,
    generatedAt: now,
    updatedAt: now,
  };
  // preserve remarks entered before regeneration
  if (existing) {
    const prev = new Map(existing.students.map(s => [s.studentId, s]));
    set.students.forEach(s => {
      const p = prev.get(s.studentId);
      if (p) { s.teacherRemarks = p.teacherRemarks; s.principalRemarks = p.principalRemarks; }
    });
  }

  const saved = saveSet(set);
  refreshRanks(saved.examId);
  logAudit({ module: 'results', action: 'result.generated', recordId: saved.id, meta: { exam: saved.examName, class: `${saved.classId}-${saved.section}`, students: students.length } });
  return getSet(saved.id)!;
}

export function generateForExam(examId: string, configId?: string): { created: number; errors: string[] } {
  const errors: string[] = [];
  let created = 0;
  generatableTargets().filter(t => t.examId === examId).forEach(t => {
    const r = generateResults(t, configId);
    if ('error' in r) errors.push(`${t.classId}-${t.section}: ${r.error}`);
    else created++;
  });
  return { created, errors };
}

/** Rank recomputation across every set of an exam (section / class / school). */
export function refreshRanks(examId: string) {
  const cfg = getConfig();
  const rows = listSets();
  const sets = rows.filter(s => s.examId === examId && s.status !== 'archived');
  recomputeRanks(sets, cfg);
  persist(rows.map(r => sets.find(s => s.id === r.id) ?? r));
}

// ---------------- remarks ----------------
export function setRemarks(setId: string, studentId: string, patch: { teacherRemarks?: string; principalRemarks?: string }): ResultSet | undefined {
  const set = getSet(setId);
  if (!set || set.status === 'published' || set.status === 'archived') return set;
  const students = set.students.map(s => s.studentId === studentId ? { ...s, ...patch } : s);
  const next = saveSet({ ...set, students });
  logAudit({ module: 'results', action: 'result.remarks.updated', recordId: setId, meta: { studentId } });
  return next;
}

// ---------------- workflow ----------------
const label = (s: ResultSet) => ({ exam: s.examName, class: `${s.classId}-${s.section}`, students: s.students.length });

export function submitSet(id: string): ResultSet | undefined {
  const set = getSet(id);
  if (!set) return;
  const wf = workflow.submit({
    module: 'result',
    recordId: set.id,
    title: `Result — ${set.examName} · ${set.classId}-${set.section}`,
    after: { students: set.students.length, subjects: set.subjects },
    meta: { resultSetId: set.id },
  });
  const next = saveSet({ ...set, status: 'submitted', workflowId: wf.id, submittedAt: new Date().toISOString(), reviewerRemarks: undefined });
  logAudit({ module: 'results', action: 'result.submitted', recordId: id, meta: label(next) });
  notifyAll({ title: 'Result submitted for approval', message: `${next.examName} · ${next.classId}-${next.section} awaiting approval.`, category: 'result' });
  return next;
}

export function approveSet(id: string, remarks?: string): ResultSet | undefined {
  const set = getSet(id);
  if (!set) return;
  if (set.workflowId) workflow.decide(set.workflowId, 'approved', remarks);
  const next = saveSet({ ...set, status: 'approved', reviewerRemarks: remarks, reviewedBy: getCurrentUser()?.name, approvedAt: new Date().toISOString() });
  logAudit({ module: 'results', action: 'result.approved', recordId: id, meta: label(next) });
  notifyAll({ title: 'Result approved', message: `${next.examName} · ${next.classId}-${next.section} approved and ready to publish.`, category: 'result' });
  return next;
}

export function rejectSet(id: string, remarks: string): ResultSet | undefined {
  const set = getSet(id);
  if (!set) return;
  if (set.workflowId) workflow.decide(set.workflowId, 'rejected', remarks);
  const next = saveSet({ ...set, status: 'draft', reviewerRemarks: remarks, reviewedBy: getCurrentUser()?.name });
  logAudit({ module: 'results', action: 'result.returned', recordId: id, meta: { ...label(next), remarks } });
  return next;
}

export function publishSet(id: string): ResultSet | undefined {
  const set = getSet(id);
  if (!set) return;
  const republish = !!set.publishedAt;
  if (set.workflowId) workflow.publish(set.workflowId);
  const next = saveSet({ ...set, status: 'published', publishedAt: new Date().toISOString() });
  logAudit({ module: 'results', action: republish ? 'result.republished' : 'result.published', recordId: id, meta: label(next) });
  notifyClass(next.classId, {
    title: republish ? 'Results updated' : 'Results published',
    message: `${next.examName} results for ${next.classId}-${next.section} are now available. Report cards can be downloaded from the portal.`,
    category: 'result',
  });
  notifyAll({
    title: 'Report cards available',
    message: `${next.examName} · ${next.classId}-${next.section}: promotion status and report cards published.`,
    category: 'result',
  });
  return next;
}

export function archiveSet(id: string): ResultSet | undefined {
  const set = getSet(id);
  if (!set) return;
  const next = saveSet({ ...set, status: 'archived', archivedAt: new Date().toISOString() });
  logAudit({ module: 'results', action: 'result.archived', recordId: id, meta: label(next) });
  return next;
}

export function setTemplate(id: string, templateId: ResultSet['templateId']): ResultSet | undefined {
  const set = getSet(id);
  if (!set) return;
  return saveSet({ ...set, templateId });
}

export const logReportCard = (setId: string, studentId: string, action: 'generated' | 'downloaded') =>
  logAudit({ module: 'results', action: `reportcard.${action}`, recordId: setId, meta: { studentId } });

// ---------------- analytics & portals ----------------
export function statsFor(sets: ResultSet[]): ResultStats {
  return computeStats(getConfig(), sets.flatMap(s => s.students));
}

export interface SetSummary { total: number; draft: number; submitted: number; approved: number; published: number; archived: number }
export function setCounts(rows = listSets()): SetSummary {
  const c = (s: ResultSetStatus) => rows.filter(r => r.status === s).length;
  return { total: rows.length, draft: c('draft'), submitted: c('submitted'), approved: c('approved'), published: c('published'), archived: c('archived') };
}

export interface StudentResultView { set: ResultSet; result: StudentResult }

/** Published results for one student, newest first. Historical years included. */
export function resultsForStudent(studentId: string, includeUnpublished = false): StudentResultView[] {
  return listSets()
    .filter(s => includeUnpublished || s.status === 'published')
    .map(s => {
      const result = s.students.find(x => x.studentId === studentId);
      return result ? { set: s, result } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b!.set.publishedAt ?? b!.set.generatedAt).localeCompare(a!.set.publishedAt ?? a!.set.generatedAt)) as StudentResultView[];
}

export interface ProgressPoint {
  examName: string; date: string; percentage: number; gpa: number; grade: string;
  rank: number; attendance: number; delta: number;
  subjects: Array<{ subject: string; percentage: number }>;
}

export function progressFor(studentId: string): ProgressPoint[] {
  const views = resultsForStudent(studentId).slice().reverse();
  return views.map((v, i) => ({
    examName: v.set.examName,
    date: (v.set.publishedAt ?? v.set.generatedAt).slice(0, 10),
    percentage: v.result.percentage,
    gpa: v.result.gpa,
    grade: v.result.grade,
    rank: v.result.classRank,
    attendance: v.result.attendancePct,
    delta: i === 0 ? 0 : Math.round((v.result.percentage - views[i - 1].result.percentage) * 100) / 100,
    subjects: v.result.subjects.map(s => ({ subject: s.subjectName, percentage: s.percentage })),
  }));
}

/** Result sets visible to a teacher (their assigned class/sections), published only. */
export function setsForClassSections(pairs: Array<{ classId: string; section: string }>, publishedOnly = true) {
  return listSets().filter(s =>
    (!publishedOnly || s.status === 'published') &&
    pairs.some(p => p.classId === s.classId && p.section === s.section));
}

export const examOptions = () => {
  const ids = new Set(listSets().map(s => s.examId));
  return listExams().filter(e => ids.has(e.id));
};
