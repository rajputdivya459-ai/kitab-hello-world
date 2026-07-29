// Holiday management — integrates with academic calendar events.
import { getCollection, setCollection, uid } from '@/mock/db';

export interface Holiday {
  id: string;
  date: string;      // YYYY-MM-DD
  name: string;
  kind: 'holiday' | 'event' | 'exam' | 'extra';
  meta?: Record<string, any>;
}

const COL = 'holidays';

export function listHolidays(): Holiday[] {
  return getCollection<Holiday>(COL).sort((a, b) => a.date.localeCompare(b.date));
}
export function addHoliday(h: Omit<Holiday, 'id'>): Holiday {
  const rec: Holiday = { id: uid('hol'), ...h };
  setCollection(COL, [...listHolidays(), rec]);
  return rec;
}
export function removeHoliday(id: string) {
  setCollection(COL, listHolidays().filter(h => h.id !== id));
}
export function isHoliday(dateISO: string): Holiday | undefined {
  return listHolidays().find(h => h.date === dateISO && h.kind === 'holiday');
}
export function holidaysBetween(startISO: string, endISO: string): Holiday[] {
  return listHolidays().filter(h => h.date >= startISO && h.date <= endISO);
}
