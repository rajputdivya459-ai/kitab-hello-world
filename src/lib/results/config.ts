// Result configuration store — Grade Master, GPA scales, pass/promotion rules.
// Everything grading-related is configurable here; no hardcoded logic elsewhere.

import { getCollection, setCollection } from '@/mock/db';
import { logAudit } from '@/lib/audit';
import type { GradeBand, GpaScale, ResultConfig } from './types';

const COL = 'result_configs';
const ACTIVE = 'result_active_config';

export const DEFAULT_GRADES: GradeBand[] = [
  { id: 'g_ap', grade: 'A+', min: 91, max: 100, point: 10, remarks: 'Outstanding' },
  { id: 'g_a',  grade: 'A',  min: 81, max: 90,  point: 9,  remarks: 'Excellent' },
  { id: 'g_bp', grade: 'B+', min: 71, max: 80,  point: 8,  remarks: 'Very Good' },
  { id: 'g_b',  grade: 'B',  min: 61, max: 70,  point: 7,  remarks: 'Good' },
  { id: 'g_c',  grade: 'C',  min: 51, max: 60,  point: 6,  remarks: 'Above Average' },
  { id: 'g_d',  grade: 'D',  min: 41, max: 50,  point: 5,  remarks: 'Average' },
  { id: 'g_e',  grade: 'E',  min: 33, max: 40,  point: 4,  remarks: 'Needs Improvement' },
  { id: 'g_f',  grade: 'F',  min: 0,  max: 32,  point: 0,  remarks: 'Fail' },
];

export const DEFAULT_GPA_SCALES: GpaScale[] = [
  { id: 'gpa_4',  label: '4 Point Scale',  max: 4 },
  { id: 'gpa_5',  label: '5 Point Scale',  max: 5 },
  { id: 'gpa_10', label: '10 Point Scale', max: 10 },
  { id: 'gpa_pct', label: 'Percentage Only', max: 0 },
];

export const defaultConfig = (): ResultConfig => ({
  id: 'rc_default',
  label: 'Default Result Rules',
  mode: 'both',
  gpaScaleId: 'gpa_10',
  gpaScales: DEFAULT_GPA_SCALES,
  grades: DEFAULT_GRADES,
  subjectPassRule: 'each_subject',
  subjectPassPercent: 33,
  overallPassPercent: 33,
  graceMarks: 5,
  graceMaxSubjects: 1,
  promotionMinPercent: 33,
  promotionMaxFailedSubjects: 0,
  distinctionPercent: 75,
  firstDivisionPercent: 60,
  secondDivisionPercent: 45,
  thirdDivisionPercent: 33,
  meritTopN: 10,
  tieBreakers: ['higher_total', 'higher_subject_marks', 'better_attendance', 'alphabetical'],
  prioritySubjects: ['Mathematics', 'Science', 'English'],
  defaultTemplate: 'high',
  updatedAt: new Date().toISOString(),
});

export function listConfigs(): ResultConfig[] {
  const rows = getCollection<ResultConfig>(COL);
  if (!rows.length) {
    const d = defaultConfig();
    setCollection(COL, [d]);
    return [d];
  }
  return rows;
}

export function activeConfigId(): string {
  return localStorage.getItem('erp.mock.' + ACTIVE) || listConfigs()[0].id;
}

export function getConfig(id?: string): ResultConfig {
  const rows = listConfigs();
  return rows.find(r => r.id === (id ?? activeConfigId())) ?? rows[0];
}

export function setActiveConfig(id: string) {
  localStorage.setItem('erp.mock.' + ACTIVE, id);
  logAudit({ module: 'results', action: 'result.config.activated', recordId: id });
}

export function saveConfig(cfg: ResultConfig): ResultConfig {
  const rows = listConfigs();
  const next = { ...cfg, updatedAt: new Date().toISOString() };
  const i = rows.findIndex(r => r.id === cfg.id);
  if (i >= 0) rows[i] = next; else rows.push(next);
  setCollection(COL, rows);
  logAudit({ module: 'results', action: 'result.rules.updated', recordId: next.id, after: { mode: next.mode, gpaScaleId: next.gpaScaleId } });
  return next;
}

export function saveGrades(configId: string, grades: GradeBand[]) {
  const cfg = getConfig(configId);
  const next = saveConfig({ ...cfg, grades: [...grades].sort((a, b) => b.min - a.min) });
  logAudit({ module: 'results', action: 'result.gradescale.changed', recordId: configId, after: { bands: grades.length } });
  return next;
}

export function resetConfig(): ResultConfig {
  const d = defaultConfig();
  setCollection(COL, [d]);
  setActiveConfig(d.id);
  return d;
}
