// Centralized validation for marks entry. Every cell/row error surfaces here.

import type { ComponentConfig, MarksRow, MarksSheet, AssessmentComponentId } from './types';
import { isNumericStatus } from './calc';

export type CellKey = string; // `${studentId}:${componentId}`
export const cellKey = (studentId: string, componentId: string): CellKey => `${studentId}:${componentId}`;

export interface ValidationResult {
  cellErrors: Record<CellKey, string>;
  rowErrors: Record<string, string>;   // studentId -> message
  errorCount: number;
  missingCount: number;
  valid: boolean;                      // no hard errors (missing counts as error for submit)
}

function decimalPlaces(v: string) {
  const i = v.indexOf('.');
  return i < 0 ? 0 : v.length - i - 1;
}

/** Validate one raw cell input. Returns an error message or null. */
export function validateCell(raw: string | number | null | undefined, comp: ComponentConfig): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const s = String(raw).trim();
  if (!/^-?\d*\.?\d*$/.test(s) || s === '.' || s === '-') return 'Invalid value';
  const n = Number(s);
  if (Number.isNaN(n)) return 'Invalid value';
  if (n < 0) return 'Negative not allowed';
  if (n > comp.max) return `Max ${comp.max}`;
  if (decimalPlaces(s) > comp.decimals) return comp.decimals === 0 ? 'Whole numbers only' : `Max ${comp.decimals} decimals`;
  return null;
}

export function validateSheet(sheet: MarksSheet): ValidationResult {
  const cellErrors: Record<CellKey, string> = {};
  const rowErrors: Record<string, string> = {};
  const active = sheet.components.filter(c => c.enabled);
  const seen = new Set<string>();
  let missingCount = 0;

  sheet.rows.forEach(row => {
    if (seen.has(row.studentId)) rowErrors[row.studentId] = 'Duplicate entry for this student';
    seen.add(row.studentId);

    if (!isNumericStatus(row)) return; // absent/medical/exempt need no marks

    const missing: string[] = [];
    active.forEach(c => {
      const raw = row.marks?.[c.id as AssessmentComponentId];
      const err = validateCell(raw as any, c);
      if (err) cellErrors[cellKey(row.studentId, c.id)] = err;
      const empty = raw === null || raw === undefined || (raw as any) === '';
      if (empty && c.required) { missing.push(c.label); missingCount++; }
    });
    if (missing.length) rowErrors[row.studentId] = `Missing: ${missing.join(', ')}`;
  });

  const errorCount = Object.keys(cellErrors).length + Object.keys(rowErrors).length;
  return { cellErrors, rowErrors, errorCount, missingCount, valid: errorCount === 0 };
}

/** Save (draft) allows missing marks; only hard cell errors block. */
export function canSaveDraft(sheet: MarksSheet): { ok: boolean; reason?: string } {
  const { cellErrors } = validateSheet(sheet);
  const n = Object.keys(cellErrors).length;
  return n ? { ok: false, reason: `${n} invalid cell${n > 1 ? 's' : ''}` } : { ok: true };
}

/** Submit requires a fully valid sheet. */
export function canSubmit(sheet: MarksSheet): { ok: boolean; reason?: string } {
  const v = validateSheet(sheet);
  if (v.valid) return { ok: true };
  return { ok: false, reason: `${v.errorCount} validation issue${v.errorCount > 1 ? 's' : ''} to fix` };
}
