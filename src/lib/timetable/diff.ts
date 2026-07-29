// Version comparison utilities.
import type { TimetableRecord, Period } from './types';

export type DiffKind = 'added' | 'removed' | 'changed' | 'same';
export interface PeriodDiff {
  kind: DiffKind;
  key: string;             // day|start
  day: string; start: string; end: string;
  a?: Period; b?: Period;
  changes?: Array<{ field: string; from: any; to: any }>;
}

const FIELDS: (keyof Period)[] = ['subject', 'teacherId', 'room', 'kind', 'notes'];

export function diffTimetables(a: TimetableRecord, b: TimetableRecord): PeriodDiff[] {
  const key = (p: Period) => `${p.day}|${p.start}`;
  const mapA = new Map(a.periods.map(p => [key(p), p]));
  const mapB = new Map(b.periods.map(p => [key(p), p]));
  const keys = new Set([...mapA.keys(), ...mapB.keys()]);
  const out: PeriodDiff[] = [];
  for (const k of keys) {
    const pa = mapA.get(k); const pb = mapB.get(k);
    if (pa && !pb) out.push({ kind: 'removed', key: k, day: pa.day, start: pa.start, end: pa.end, a: pa });
    else if (!pa && pb) out.push({ kind: 'added', key: k, day: pb.day, start: pb.start, end: pb.end, b: pb });
    else if (pa && pb) {
      const changes = FIELDS
        .filter(f => (pa as any)[f] !== (pb as any)[f])
        .map(f => ({ field: f as string, from: (pa as any)[f], to: (pb as any)[f] }));
      out.push({ kind: changes.length ? 'changed' : 'same', key: k, day: pa.day, start: pa.start, end: pa.end, a: pa, b: pb, changes });
    }
  }
  return out.sort((x, y) => x.key.localeCompare(y.key));
}

export function diffSummary(diffs: PeriodDiff[]) {
  return {
    added: diffs.filter(d => d.kind === 'added').length,
    removed: diffs.filter(d => d.kind === 'removed').length,
    changed: diffs.filter(d => d.kind === 'changed').length,
    same: diffs.filter(d => d.kind === 'same').length,
  };
}
