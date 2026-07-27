// Configurable grading helpers used across admin/portal result views.

export interface GradeBand {
  grade: string;
  min: number; // inclusive percentage
  label: string;
  color: string; // tailwind classes
}

export const GRADE_BANDS: GradeBand[] = [
  { grade: 'A+', min: 90, label: 'Outstanding', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { grade: 'A',  min: 80, label: 'Excellent',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { grade: 'B',  min: 70, label: 'Very Good',   color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { grade: 'C',  min: 60, label: 'Good',        color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { grade: 'D',  min: 40, label: 'Pass',        color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { grade: 'F',  min: 0,  label: 'Fail',        color: 'bg-rose-100 text-rose-700 border-rose-200' },
];

export function getGrade(percentage: number, passed: boolean): GradeBand {
  if (!passed) return GRADE_BANDS[GRADE_BANDS.length - 1];
  return GRADE_BANDS.find(b => percentage >= b.min) ?? GRADE_BANDS[GRADE_BANDS.length - 1];
}

export interface SubjectMark {
  subject_id: string;
  subject_name: string;
  marks_obtained: number;
  max_marks: number;
  passing_marks: number;
  remarks?: string | null;
}

export interface ResultSummary {
  total: number;
  outOf: number;
  percentage: number;
  passed: boolean;
  grade: GradeBand;
  failedSubjects: number;
}

export function summarize(rows: SubjectMark[]): ResultSummary {
  const total = rows.reduce((s, r) => s + Number(r.marks_obtained || 0), 0);
  const outOf = rows.reduce((s, r) => s + Number(r.max_marks || 0), 0);
  const pct = outOf > 0 ? (total / outOf) * 100 : 0;
  const failedSubjects = rows.filter(r => Number(r.marks_obtained || 0) < Number(r.passing_marks || 0)).length;
  const passed = failedSubjects === 0 && rows.length > 0;
  return {
    total,
    outOf,
    percentage: Math.round(pct * 100) / 100,
    passed,
    grade: getGrade(pct, passed),
    failedSubjects,
  };
}
