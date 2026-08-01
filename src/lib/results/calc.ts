// Centralized result calculation. All grading/GPA/division/promotion logic lives here
// and is driven entirely by ResultConfig — never hardcoded in UI.

import type { MarksSheet, MarksRow } from '@/lib/marks/types';
import { rowTotals } from '@/lib/marks/calc';
import type {
  GradeBand, ResultConfig, StudentResult, SubjectResult, PromotionStatus, ResultStats,
} from './types';

export function gradeFor(cfg: ResultConfig, pct: number): GradeBand {
  const bands = [...cfg.grades].sort((a, b) => b.min - a.min);
  return bands.find(b => pct >= b.min && pct <= Math.max(b.max, b.min)) ?? bands[bands.length - 1];
}

/** Grade points are stored on a 10-point base and converted to the active scale. */
export function toGpa(cfg: ResultConfig, point: number): number {
  const scale = cfg.gpaScales.find(s => s.id === cfg.gpaScaleId);
  if (!scale || scale.max === 0) return 0;
  return Math.round((point / 10) * scale.max * 100) / 100;
}

export function divisionFor(cfg: ResultConfig, pct: number, passed: boolean): string {
  if (!passed) return 'Fail';
  if (pct >= cfg.distinctionPercent) return 'Distinction';
  if (pct >= cfg.firstDivisionPercent) return 'First Division';
  if (pct >= cfg.secondDivisionPercent) return 'Second Division';
  if (pct >= cfg.thirdDivisionPercent) return 'Third Division';
  return 'Pass';
}

function subjectFromRow(cfg: ResultConfig, sheet: MarksSheet, row: MarksRow): SubjectResult {
  const t = rowTotals(row, sheet.components);
  const active = sheet.components.filter(c => c.enabled);
  const evaluated = row.status === 'present';
  const passMark = (t.outOf * cfg.subjectPassPercent) / 100;
  const raw = evaluated ? t.subjectTotal : 0;
  let grace = 0;
  if (evaluated && raw < passMark && passMark - raw <= cfg.graceMarks) grace = Math.ceil(passMark - raw);
  const obtained = raw + grace;
  const pct = t.outOf > 0 ? Math.round((obtained / t.outOf) * 10000) / 100 : 0;
  const band = gradeFor(cfg, pct);
  return {
    subjectName: sheet.subjectName,
    obtained,
    max: t.outOf,
    percentage: pct,
    grade: evaluated ? band.grade : row.status === 'exempt' ? 'EX' : 'AB',
    gradePoint: evaluated ? band.point : 0,
    passed: evaluated ? obtained >= passMark : row.status === 'exempt',
    graceApplied: grace,
    attendance: row.status,
    components: active.map(c => ({ label: c.label, value: t.componentTotals[c.id] ?? null, max: c.max })),
  };
}

export interface BuildInput {
  cfg: ResultConfig;
  sheets: MarksSheet[];            // approved/published sheets for one exam+class+section
  studentId: string;
  roll: string;
  name: string;
  admissionNo: string;
  attendancePct: number;
  reportCardNo: string;
}

export function buildStudentResult(input: BuildInput): StudentResult {
  const { cfg, sheets } = input;
  const subjects: SubjectResult[] = [];
  let graceUsed = 0;
  sheets.forEach(sheet => {
    const row = sheet.rows.find(r => r.studentId === input.studentId);
    if (!row) return;
    const s = subjectFromRow(cfg, sheet, row);
    if (s.graceApplied > 0) {
      if (graceUsed >= cfg.graceMaxSubjects) {
        s.obtained -= s.graceApplied;
        s.graceApplied = 0;
        s.percentage = s.max ? Math.round((s.obtained / s.max) * 10000) / 100 : 0;
        s.passed = s.obtained >= (s.max * cfg.subjectPassPercent) / 100;
        const b = gradeFor(cfg, s.percentage);
        s.grade = s.attendance === 'present' ? b.grade : s.grade;
        s.gradePoint = s.attendance === 'present' ? b.point : 0;
      } else graceUsed++;
    }
    subjects.push(s);
  });

  const counted = subjects.filter(s => s.attendance !== 'exempt');
  const total = counted.reduce((a, s) => a + s.obtained, 0);
  const outOf = counted.reduce((a, s) => a + s.max, 0);
  const percentage = outOf > 0 ? Math.round((total / outOf) * 10000) / 100 : 0;
  const failedSubjects = counted.filter(s => !s.passed).length;

  const aggregateOk = percentage >= cfg.overallPassPercent;
  const passed = cfg.subjectPassRule === 'each_subject'
    ? failedSubjects === 0 && aggregateOk && counted.length > 0
    : aggregateOk && counted.length > 0;

  const band = gradeFor(cfg, percentage);
  const avgPoint = counted.length ? counted.reduce((a, s) => a + s.gradePoint, 0) / counted.length : 0;
  const promotion: PromotionStatus =
    percentage >= cfg.promotionMinPercent && failedSubjects <= cfg.promotionMaxFailedSubjects
      ? 'promoted' : passed ? 'promoted' : 'detained';

  return {
    studentId: input.studentId,
    roll: input.roll,
    name: input.name,
    admissionNo: input.admissionNo,
    subjects,
    total,
    outOf,
    percentage,
    grade: passed ? band.grade : gradeFor(cfg, 0).grade,
    gradePoint: Math.round(avgPoint * 100) / 100,
    gpa: toGpa(cfg, avgPoint),
    division: divisionFor(cfg, percentage, passed),
    passed,
    failedSubjects,
    promotion,
    attendancePct: input.attendancePct,
    sectionRank: 0, classRank: 0, schoolRank: 0,
    reportCardNo: input.reportCardNo,
  };
}

// ---------------- statistics ----------------
export function computeStats(cfg: ResultConfig, students: StudentResult[]): ResultStats {
  const n = students.length;
  const passed = students.filter(s => s.passed).length;
  const pcts = students.map(s => s.percentage);
  const gradeDistribution = [...cfg.grades]
    .sort((a, b) => b.min - a.min)
    .map(g => ({ grade: g.grade, count: students.filter(s => s.grade === g.grade).length }));

  const scaleMax = cfg.gpaScales.find(s => s.id === cfg.gpaScaleId)?.max || 10;
  const bands = [0.25, 0.5, 0.75, 1].map((f, i, arr) => {
    const lo = i === 0 ? 0 : arr[i - 1] * scaleMax;
    const hi = f * scaleMax;
    return {
      band: `${lo.toFixed(1)}–${hi.toFixed(1)}`,
      count: students.filter(s => s.gpa > lo - (i === 0 ? 0.01 : 0) && s.gpa <= hi).length,
    };
  });

  const subjectNames = Array.from(new Set(students.flatMap(s => s.subjects.map(x => x.subjectName))));
  const subjectPerformance = subjectNames.map(sub => {
    const rows = students.map(s => s.subjects.find(x => x.subjectName === sub)).filter(Boolean) as SubjectResult[];
    const evaluated = rows.filter(r => r.attendance === 'present');
    const vals = evaluated.map(r => r.percentage);
    return {
      subject: sub,
      average: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : 0,
      highest: vals.length ? Math.max(...vals) : 0,
      lowest: vals.length ? Math.min(...vals) : 0,
      passPercent: evaluated.length ? Math.round((evaluated.filter(r => r.passed).length / evaluated.length) * 100) : 0,
    };
  }).sort((a, b) => b.average - a.average);

  return {
    students: n,
    passed,
    failed: n - passed,
    passPercent: n ? Math.round((passed / n) * 100) : 0,
    failPercent: n ? Math.round(((n - passed) / n) * 100) : 0,
    average: n ? Math.round((pcts.reduce((a, b) => a + b, 0) / n) * 100) / 100 : 0,
    highest: n ? Math.max(...pcts) : 0,
    lowest: n ? Math.min(...pcts) : 0,
    averageGpa: n ? Math.round((students.reduce((a, s) => a + s.gpa, 0) / n) * 100) / 100 : 0,
    distinction: students.filter(s => s.percentage >= cfg.distinctionPercent).length,
    promoted: students.filter(s => s.promotion === 'promoted').length,
    detained: students.filter(s => s.promotion === 'detained').length,
    gradeDistribution,
    gpaDistribution: bands,
    subjectPerformance,
  };
}
