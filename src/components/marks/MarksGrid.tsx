import { useMemo, useRef, useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { MarksSheet, MarksRow, AttendanceStatus, AssessmentComponentId } from '@/lib/marks/types';
import { ATTENDANCE_STATUSES } from '@/lib/marks/types';
import { rowTotals } from '@/lib/marks/calc';
import { validateSheet, cellKey } from '@/lib/marks/validation';

interface Props {
  sheet: MarksSheet;
  readOnly?: boolean;
  onChange: (rows: MarksRow[]) => void;
}

/** Spreadsheet-style marks grid with keyboard navigation and live validation. */
export function MarksGrid({ sheet, readOnly, onChange }: Props) {
  const [focus, setFocus] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  const active = useMemo(() => sheet.components.filter(c => c.enabled), [sheet.components]);
  const validation = useMemo(() => validateSheet(sheet), [sheet]);

  const setRow = (studentId: string, patch: Partial<MarksRow>) =>
    onChange(sheet.rows.map(r => (r.studentId === studentId ? { ...r, ...patch } : r)));

  const setMark = (row: MarksRow, id: AssessmentComponentId, raw: string) => {
    const marks = { ...row.marks };
    if (raw === '') delete marks[id];
    else marks[id] = Number(raw);
    setRow(row.studentId, { marks });
  };

  const move = (e: KeyboardEvent<HTMLInputElement>, ri: number, ci: number) => {
    const keys = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab'];
    if (!keys.includes(e.key)) return;
    let r = ri, c = ci;
    if (e.key === 'ArrowDown' || e.key === 'Enter') r++;
    else if (e.key === 'ArrowUp') r--;
    else if (e.key === 'ArrowLeft') c--;
    else if (e.key === 'ArrowRight') c++;
    else if (e.key === 'Tab') { c += e.shiftKey ? -1 : 1; }
    if (c < 0) { c = active.length - 1; r--; }
    if (c > active.length - 1) { c = 0; r++; }
    if (r < 0 || r > sheet.rows.length - 1) return;
    const target = refs.current[`${sheet.rows[r].studentId}:${active[c].id}`];
    if (target) { e.preventDefault(); target.focus(); target.select(); }
  };

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[820px]">
        <thead className="bg-muted/60">
          <tr className="text-left">
            <th className="px-2 py-2 font-medium w-14">Roll</th>
            <th className="px-2 py-2 font-medium min-w-[160px]">Student</th>
            <th className="px-2 py-2 font-medium hidden md:table-cell">Admission No</th>
            <th className="px-2 py-2 font-medium w-[130px]">Status</th>
            {active.map(c => (
              <th key={c.id} className="px-2 py-2 font-medium text-center w-24">
                {c.label}<span className="block text-[10px] font-normal text-muted-foreground">max {c.max}{c.required ? ' · req' : ''}</span>
              </th>
            ))}
            <th className="px-2 py-2 font-medium text-center w-20">Total</th>
            <th className="px-2 py-2 font-medium min-w-[140px]">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {sheet.rows.map((row, ri) => {
            const t = rowTotals(row, sheet.components);
            const rowErr = validation.rowErrors[row.studentId];
            const statusMeta = ATTENDANCE_STATUSES.find(s => s.id === row.status)!;
            return (
              <tr key={row.studentId} className={cn('border-t', rowErr && 'bg-amber-50/60')}>
                <td className="px-2 py-1 font-mono text-xs">{row.roll}</td>
                <td className="px-2 py-1">
                  <span className="font-medium">{row.name}</span>
                  {rowErr && <span className="block text-[10px] text-amber-700">{rowErr}</span>}
                </td>
                <td className="px-2 py-1 text-xs text-muted-foreground hidden md:table-cell">{row.admissionNo}</td>
                <td className="px-2 py-1">
                  {readOnly ? (
                    <Badge variant="outline" className={statusMeta.color}>{statusMeta.label}</Badge>
                  ) : (
                    <Select value={row.status} onValueChange={(v: AttendanceStatus) => setRow(row.studentId, { status: v, marks: v === 'present' ? row.marks : {} })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ATTENDANCE_STATUSES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </td>
                {active.map((c, ci) => {
                  const key = cellKey(row.studentId, c.id);
                  const err = validation.cellErrors[key];
                  const disabled = readOnly || row.status !== 'present';
                  const value = row.marks?.[c.id] ?? '';
                  return (
                    <td key={c.id} className="px-1 py-1">
                      <Input
                        ref={el => { refs.current[key] = el; }}
                        inputMode="decimal"
                        disabled={disabled}
                        value={value === null ? '' : String(value)}
                        onChange={e => setMark(row, c.id, e.target.value)}
                        onKeyDown={e => move(e, ri, ci)}
                        onFocus={() => setFocus(key)}
                        onBlur={() => setFocus(null)}
                        title={err ?? ''}
                        className={cn(
                          'h-8 text-center text-sm tabular-nums',
                          err && 'border-destructive ring-1 ring-destructive/40 bg-destructive/5',
                          focus === key && 'ring-2 ring-primary/50',
                          disabled && 'bg-muted/50',
                        )}
                      />
                      {err && <span className="block text-[10px] text-destructive text-center leading-tight">{err}</span>}
                    </td>
                  );
                })}
                <td className="px-2 py-1 text-center font-semibold tabular-nums">
                  {t.evaluated ? `${t.subjectTotal}/${t.outOf}` : '—'}
                </td>
                <td className="px-1 py-1">
                  <Input
                    disabled={readOnly}
                    value={row.remarks ?? ''}
                    onChange={e => setRow(row.studentId, { remarks: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="—"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!sheet.rows.length && <p className="p-6 text-center text-sm text-muted-foreground">No students in this class/section.</p>}
    </div>
  );
}
