// Centralized marks calculations. Statuses (absent/medical/exempt) are stored
// separately from numeric marks and never contribute to totals.

import type { ComponentConfig, MarksRow, MarksSheet, AssessmentComponentId } from './types';

export const isNumericStatus = (r: MarksRow) => r.status === 'present';

export function componentValue(row: MarksRow, id: AssessmentComponentId): number | null {
  if (!isNumericStatus(row)) return null;
  const v = row.marks?.[id];
  return v === null || v === undefined || (v as any) === '' ? null : Number(v);
}

export interface RowTotals {
  theoryTotal: number;
  practicalTotal: number;
  internalTotal: number;
  componentTotals: Partial<Record<AssessmentComponentId, number>>;
  subjectTotal: number;
  outOf: number;
  percentage: number;
  evaluated: boolean;      // false for absent/medical/exempt
}

const THEORY_GROUP: AssessmentComponentId[] = ['theory'];
const PRACTICAL_GROUP: AssessmentComponentId[] = ['practical', 'viva', 'oral'];
const INTERNAL_GROUP: AssessmentComponentId[] = ['internal', 'project', 'assignment'];

export function rowTotals(row: MarksRow, components: ComponentConfig[]): RowTotals {
  const active = components.filter(c => c.enabled);
  const outOf = active.reduce((s, c) => s + c.max, 0);
  const componentTotals: Partial<Record<AssessmentComponentId, number>> = {};
  let subjectTotal = 0;
  active.forEach(c => {
    const v = componentValue(row, c.id);
    if (v !== null) { componentTotals[c.id] = v; subjectTotal += v; }
  });
  const sum = (group: AssessmentComponentId[]) =>
    active.filter(c => group.includes(c.id)).reduce((s, c) => s + (componentTotals[c.id] ?? 0), 0);
  return {
    theoryTotal: sum(THEORY_GROUP),
    practicalTotal: sum(PRACTICAL_GROUP),
    internalTotal: sum(INTERNAL_GROUP),
    componentTotals,
    subjectTotal,
    outOf,
    percentage: outOf > 0 ? Math.round((subjectTotal / outOf) * 10000) / 100 : 0,
    evaluated: isNumericStatus(row),
  };
}

export interface SheetTotals {
  students: number;
  entered: number;
  absent: number;
  exempt: number;
  medical: number;
  overallTotal: number;
  outOf: number;
  average: number;
  highest: number;
  lowest: number;
  completion: number;   // 0..100
}

export function sheetTotals(sheet: MarksSheet): SheetTotals {
  const active = sheet.components.filter(c => c.enabled);
  const outOf = active.reduce((s, c) => s + c.max, 0);
  let entered = 0, overall = 0, highest = 0, lowest = Number.POSITIVE_INFINITY;
  let absent = 0, exempt = 0, medical = 0;
  sheet.rows.forEach(r => {
    if (r.status === 'absent') { absent++; return; }
    if (r.status === 'exempt') { exempt++; return; }
    if (r.status === 'medical') { medical++; return; }
    const t = rowTotals(r, sheet.components);
    const complete = active.filter(c => c.required).every(c => componentValue(r, c.id) !== null);
    if (complete) {
      entered++;
      overall += t.subjectTotal;
      highest = Math.max(highest, t.subjectTotal);
      lowest = Math.min(lowest, t.subjectTotal);
    }
  });
  const gradable = sheet.rows.length - absent - exempt - medical;
  return {
    students: sheet.rows.length,
    entered, absent, exempt, medical,
    overallTotal: overall,
    outOf,
    average: entered ? Math.round((overall / entered) * 100) / 100 : 0,
    highest: entered ? highest : 0,
    lowest: entered ? lowest : 0,
    completion: gradable > 0 ? Math.round((entered / gradable) * 100) : 100,
  };
}
