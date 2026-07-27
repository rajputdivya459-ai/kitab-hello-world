// Constraint-based timetable generator.
// Hard constraints: teacher not double-booked (across other published tables of same year),
// no back-to-back identical subject, respect breaks & timings.
// Soft: spread difficult subjects earlier, distribute across week.

import { getCollection } from '@/mock/db';
import type {
  GeneratorInput, Period, TimetableRecord, Conflict, Weekday, SubjectInput,
} from './types';

function addMinutes(hhmm: string, min: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + min;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}
function minutesBetween(a: string, b: string): number {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return (bh * 60 + bm) - (ah * 60 + am);
}

/** Build the empty daily slot skeleton: alternating class/break blocks respecting timings. */
function buildDaySlots(day: Weekday, input: GeneratorInput): Period[] {
  const totalMin = minutesBetween(input.startTime, input.endTime);
  const perPeriod = input.periodDuration;
  const breakLen = input.breakDuration;
  const breakCount = Math.max(0, input.breakCount);

  const periods: Period[] = [];
  let cursor = input.startTime;
  let idx = 0;
  let remaining = totalMin;

  // Distribute breaks approximately evenly: after every ~ceil(N/(breaks+1)) periods.
  const maxClassMin = Math.max(0, totalMin - breakCount * breakLen);
  const classSlots = Math.floor(maxClassMin / perPeriod);
  const gap = breakCount > 0 ? Math.max(1, Math.floor(classSlots / (breakCount + 1))) : classSlots + 1;
  let breaksInserted = 0;

  while (remaining >= perPeriod && idx < 40) {
    const end = addMinutes(cursor, perPeriod);
    periods.push({
      id: `p_${day}_${idx}`, day, index: idx, start: cursor, end, kind: 'class',
    });
    cursor = end; remaining -= perPeriod; idx++;

    if (breaksInserted < breakCount && idx % gap === 0 && remaining >= breakLen) {
      const bend = addMinutes(cursor, breakLen);
      periods.push({
        id: `p_${day}_${idx}`, day, index: idx, start: cursor, end: bend,
        kind: 'break', subject: breaksInserted === 0 ? 'Short Break' : 'Lunch',
      });
      cursor = bend; remaining -= breakLen; idx++; breaksInserted++;
    }
  }
  return periods;
}

interface TeacherBusyIndex {
  // key: `${day}|${start}` -> teacherIds already booked in published tables
  [key: string]: Set<string>;
}

function loadTeacherBusy(academicYear: string, excludeId?: string): TeacherBusyIndex {
  const idx: TeacherBusyIndex = {};
  const rows = getCollection<TimetableRecord>('timetables').filter(
    r => r.status === 'published' && r.academicYear === academicYear && r.id !== excludeId
  );
  for (const r of rows) {
    for (const p of r.periods) {
      if (p.kind !== 'class' || !p.teacherId) continue;
      const k = `${p.day}|${p.start}`;
      (idx[k] ??= new Set()).add(p.teacherId);
    }
  }
  return idx;
}

export interface GenerationResult {
  periods: Period[];
  conflicts: Conflict[];
}

export function generateTimetable(input: GeneratorInput, excludeId?: string): GenerationResult {
  const conflicts: Conflict[] = [];
  const busy = loadTeacherBusy(input.academicYear, excludeId);

  // Build skeleton for each working day
  const skeleton: Period[] = input.workingDays.flatMap(d => buildDaySlots(d, input));
  const classSlots = skeleton.filter(p => p.kind === 'class');

  // Validate total capacity
  const totalNeeded = input.subjects.reduce((s, x) => s + x.periodsPerWeek, 0);
  if (totalNeeded > classSlots.length) {
    conflicts.push({
      kind: 'insufficient_slots',
      message: `Need ${totalNeeded} periods but only ${classSlots.length} class slots available.`,
    });
  }

  // Track counts remaining per subject, distributed across days
  const remaining: Record<string, number> = {};
  input.subjects.forEach(s => { remaining[s.name] = s.periodsPerWeek; });
  const perDayCount: Record<string, Record<string, number>> = {}; // day -> subject -> count
  input.workingDays.forEach(d => { perDayCount[d] = {}; });

  // Sort subjects by difficulty (desc) then by count (desc) for prioritized placement
  const orderedSubjects = [...input.subjects].sort((a, b) =>
    (b.difficulty ?? 1) - (a.difficulty ?? 1) || b.periodsPerWeek - a.periodsPerWeek
  );

  // Score a candidate slot for a subject
  const scoreSlot = (slot: Period, subj: SubjectInput): number => {
    let score = 100;
    // Difficulty → prefer earlier in day
    const difficultyBonus = (subj.difficulty ?? 1) * (10 - Math.min(slot.index, 10));
    score += difficultyBonus;
    // Even distribution across days
    const dayCount = perDayCount[slot.day]?.[subj.name] ?? 0;
    score -= dayCount * 25;
    return score;
  };

  // Fill slots greedily
  for (const subj of orderedSubjects) {
    let need = remaining[subj.name];
    while (need > 0) {
      // Candidate = empty class slot where teacher is free and not adjacent to same subject
      const candidates = classSlots
        .filter(s => !s.subject)
        .filter(s => {
          const key = `${s.day}|${s.start}`;
          if ((busy[key] ??= new Set()).has(subj.teacherId)) return false;
          // Prevent back-to-back same subject
          const daySlots = classSlots.filter(x => x.day === s.day).sort((a, b) => a.index - b.index);
          const pos = daySlots.findIndex(x => x.id === s.id);
          if (pos > 0 && daySlots[pos - 1].subject === subj.name) return false;
          if (pos < daySlots.length - 1 && daySlots[pos + 1].subject === subj.name) return false;
          return true;
        })
        .sort((a, b) => scoreSlot(b, subj) - scoreSlot(a, subj));

      if (candidates.length === 0) {
        conflicts.push({
          kind: 'no_teacher_available',
          message: `Could not place ${need} more period(s) of ${subj.name} (teacher ${subj.teacherId} unavailable or conflicts).`,
          meta: { subject: subj.name, remaining: need },
        });
        break;
      }
      const pick = candidates[0];
      pick.subject = subj.name;
      pick.teacherId = subj.teacherId;
      pick.room = subj.preferredRoom;
      perDayCount[pick.day][subj.name] = (perDayCount[pick.day][subj.name] ?? 0) + 1;
      const key = `${pick.day}|${pick.start}`;
      (busy[key] ??= new Set()).add(subj.teacherId);
      need--;
    }
  }

  // Mark unused class slots as free periods
  classSlots.forEach(s => { if (!s.subject) { s.kind = 'free'; s.subject = 'Free'; } });

  return { periods: skeleton, conflicts };
}

/** Re-validate a manually edited timetable against the published set. */
export function validateTimetable(t: TimetableRecord): Conflict[] {
  const conflicts: Conflict[] = [];
  const busy = loadTeacherBusy(t.academicYear, t.id);
  const seen = new Map<string, string>(); // key -> teacherId
  for (const p of t.periods) {
    if (p.kind !== 'class' || !p.teacherId) continue;
    const key = `${p.day}|${p.start}`;
    if (seen.get(key) === p.teacherId) {
      conflicts.push({ kind: 'teacher_double_booked', message: `Teacher ${p.teacherId} booked twice at ${p.day} ${p.start}.` });
    }
    seen.set(key, p.teacherId);
    if ((busy[key] ??= new Set()).has(p.teacherId)) {
      conflicts.push({ kind: 'teacher_double_booked', message: `Teacher ${p.teacherId} conflicts with another published timetable at ${p.day} ${p.start}.` });
    }
  }
  // Same subject back-to-back check
  const byDay: Record<string, typeof t.periods> = {};
  for (const p of t.periods) (byDay[p.day] ??= []).push(p);
  Object.values(byDay).forEach(list => {
    list.sort((a, b) => a.index - b.index);
    for (let i = 1; i < list.length; i++) {
      if (list[i].kind === 'class' && list[i].subject && list[i].subject === list[i - 1].subject) {
        conflicts.push({ kind: 'consecutive_same_subject', message: `${list[i].subject} scheduled back-to-back on ${list[i].day}.` });
      }
    }
  });
  return conflicts;
}
