// Validation Center — pre-publication checks for result sets.
// Reuses the existing marks sheets, exam master and result config. No duplicate logic.

import { listSheets } from '@/lib/marks/api';
import { getExam } from '@/lib/exam/master';
import { getConfig } from './config';
import { listSets } from './api';
import type { ResultSet } from './types';

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  code: string;
  severity: IssueSeverity;
  label: string;
  detail: string;
  students?: string[];
}

export interface ValidationReport {
  setId: string;
  title: string;
  issues: ValidationIssue[];
  errors: number;
  warnings: number;
  canPublish: boolean;
}

const cap = (names: string[], n = 6) =>
  names.length <= n ? names.join(', ') : `${names.slice(0, n).join(', ')} +${names.length - n} more`;

export function validateSet(set: ResultSet, all: ResultSet[] = listSets()): ValidationReport {
  const cfg = getConfig(set.configId);
  const issues: ValidationIssue[] = [];
  const push = (code: string, severity: IssueSeverity, label: string, detail: string, students?: string[]) =>
    issues.push({ code, severity, label, detail, students });

  // 1. Marks approval / completeness at source
  const sheets = listSheets().filter(s => s.examId === set.examId && s.classId === set.classId && s.section === set.section);
  const unapproved = sheets.filter(s => s.status !== 'approved' && s.status !== 'published');
  if (unapproved.length) {
    push('marks_unapproved', 'error', 'Unapproved marks',
      `${unapproved.length} marks sheet(s) are not approved: ${cap(unapproved.map(s => s.subjectName))}.`);
  }
  if (!set.sourceSheetIds.length) {
    push('marks_missing', 'error', 'No source marks', 'This result set has no linked approved marks sheets.');
  }

  // 2. Subject mapping against exam master
  const exam = getExam(set.examId);
  const mapped = (exam?.subjects ?? []).map((s: any) => s.name ?? s.subjectName ?? s).filter(Boolean) as string[];
  if (mapped.length) {
    const missing = mapped.filter(m => !set.subjects.includes(m));
    if (missing.length) {
      push('subject_mapping', 'error', 'Missing subject mapping',
        `Subjects mapped in the Exam Master but absent from results: ${cap(missing)}.`);
    }
  }

  // 3. Per-student checks
  const missingMarks: string[] = [], badGrade: string[] = [], noAttendance: string[] = [],
    noRemarks: string[] = [], calcErr: string[] = [];
  const gradeSet = new Set(cfg.grades.map(g => g.grade));

  set.students.forEach(st => {
    const incomplete = st.subjects.some(s =>
      s.attendance === 'present' && s.components.some(c => c.value === null || c.value === undefined));
    if (incomplete) missingMarks.push(st.name);
    if (!st.grade || !gradeSet.has(st.grade)) badGrade.push(st.name);
    if (!st.attendancePct) noAttendance.push(st.name);
    if (!st.teacherRemarks?.trim()) noRemarks.push(st.name);
    const pct = st.outOf ? (st.total / st.outOf) * 100 : 0;
    const drift = Math.abs(pct - st.percentage);
    if (!Number.isFinite(st.total) || !Number.isFinite(st.percentage) || st.total > st.outOf || drift > 0.5) calcErr.push(st.name);
  });

  if (!set.students.length) push('no_students', 'error', 'No students', 'This result set contains no students.');
  if (missingMarks.length) push('missing_marks', 'error', 'Missing marks', `Incomplete component marks for ${cap(missingMarks)}.`, missingMarks);
  if (badGrade.length) push('invalid_grade', 'error', 'Invalid grades', `Grade outside the configured Grade Master for ${cap(badGrade)}.`, badGrade);
  if (calcErr.length) push('calc_error', 'error', 'Calculation errors', `Totals / percentage mismatch for ${cap(calcErr)}.`, calcErr);
  if (noAttendance.length) push('missing_attendance', 'warning', 'Missing attendance', `Attendance is 0% for ${cap(noAttendance)}.`, noAttendance);
  if (noRemarks.length) push('missing_remarks', 'warning', 'Missing teacher remarks', `No remarks recorded for ${cap(noRemarks)}.`, noRemarks);

  // 4. Duplicates
  const dupes = all.filter(s => s.id !== set.id && s.examId === set.examId && s.classId === set.classId && s.section === set.section && s.status !== 'archived');
  if (dupes.length) push('duplicate', 'error', 'Duplicate result set', `${dupes.length} other active set(s) exist for the same exam and class-section.`);

  const errors = issues.filter(i => i.severity === 'error').length;
  return {
    setId: set.id,
    title: `${set.examName} · ${set.classId}-${set.section}`,
    issues,
    errors,
    warnings: issues.length - errors,
    canPublish: errors === 0,
  };
}

export const validateMany = (sets: ResultSet[]): ValidationReport[] => {
  const all = listSets();
  return sets.map(s => validateSet(s, all));
};
