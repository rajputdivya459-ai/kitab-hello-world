// Timetable analytics — workload, distribution, utilization.
import { listTimetables } from './api';
import { listExtras } from './extra';
import type { TimetableRecord } from './types';

export interface TeacherLoad { teacherId: string; periods: number; subjects: Set<string>; classes: Set<string>; }
export interface SubjectDist { subject: string; periods: number; classes: Set<string>; }
export interface RoomUtil { room: string; used: number; total: number; pct: number; }

export function teacherWorkload(records?: TimetableRecord[]): TeacherLoad[] {
  const rows = records ?? listTimetables().filter(t => t.status === 'published');
  const map = new Map<string, TeacherLoad>();
  for (const r of rows) {
    for (const p of r.periods) {
      if (p.kind !== 'class' || !p.teacherId) continue;
      const l = map.get(p.teacherId) ?? { teacherId: p.teacherId, periods: 0, subjects: new Set(), classes: new Set() };
      l.periods++; if (p.subject) l.subjects.add(p.subject);
      l.classes.add(`${r.className}-${r.section}`);
      map.set(p.teacherId, l);
    }
  }
  return [...map.values()].sort((a, b) => b.periods - a.periods);
}

export function subjectDistribution(records?: TimetableRecord[]): SubjectDist[] {
  const rows = records ?? listTimetables().filter(t => t.status === 'published');
  const map = new Map<string, SubjectDist>();
  for (const r of rows) {
    for (const p of r.periods) {
      if (p.kind !== 'class' || !p.subject) continue;
      const d = map.get(p.subject) ?? { subject: p.subject, periods: 0, classes: new Set() };
      d.periods++; d.classes.add(`${r.className}-${r.section}`);
      map.set(p.subject, d);
    }
  }
  return [...map.values()].sort((a, b) => b.periods - a.periods);
}

export function roomUtilization(records?: TimetableRecord[]): RoomUtil[] {
  const rows = records ?? listTimetables().filter(t => t.status === 'published');
  const use = new Map<string, number>();
  let totalSlots = 0;
  for (const r of rows) {
    for (const p of r.periods) {
      if (p.kind !== 'class') continue;
      totalSlots++;
      if (p.room) use.set(p.room, (use.get(p.room) ?? 0) + 1);
    }
  }
  const total = Math.max(1, totalSlots);
  return [...use.entries()].map(([room, used]) => ({ room, used, total, pct: Math.round((used / total) * 100) }))
    .sort((a, b) => b.used - a.used);
}

export function freePeriodAnalysis(records?: TimetableRecord[]) {
  const rows = records ?? listTimetables().filter(t => t.status === 'published');
  let free = 0, total = 0;
  for (const r of rows) for (const p of r.periods) {
    if (p.kind === 'break') continue;
    total++; if (p.kind === 'free' || !p.subject) free++;
  }
  return { free, total, pct: total ? Math.round((free / total) * 100) : 0 };
}

export function extraClassSummary() {
  const list = listExtras();
  const byKind = new Map<string, number>();
  list.forEach(e => byKind.set(e.kind, (byKind.get(e.kind) ?? 0) + 1));
  return { total: list.length, byKind: [...byKind.entries()].map(([kind, count]) => ({ kind, count })) };
}

export function classLoad(records?: TimetableRecord[]) {
  const rows = records ?? listTimetables().filter(t => t.status === 'published');
  return rows.map(r => ({
    label: `${r.className}-${r.section}`,
    periods: r.periods.filter(p => p.kind === 'class').length,
    free: r.periods.filter(p => p.kind === 'free').length,
  })).sort((a, b) => b.periods - a.periods);
}
