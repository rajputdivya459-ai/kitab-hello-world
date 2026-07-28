// Exam schedule generator + conflict validator + invigilator balancer.
import { uid } from '@/mock/db';
import type {
  ExamSchedule, ExamSlot, ExamConflict, ExamGeneratorInput, Room, Invigilator,
} from './types';

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as const;

function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`;
}

function eachDate(from: string, to: string): string[] {
  const out: string[] = [];
  const d = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Greedy generator: iterates working dates, places subjects sequentially for
 * each (class,section) pair, respecting daily limit, then assigns rooms and
 * invigilators balancing workload.
 */
export function generateExamSchedule(
  input: ExamGeneratorInput,
  rooms: Room[] = [],
  invigilators: Invigilator[] = [],
): { slots: ExamSlot[]; conflicts: ExamConflict[] } {
  const dates = eachDate(input.startDate, input.endDate).filter(d => {
    const dow = DAY_NAMES[new Date(d + 'T00:00:00').getDay()];
    return input.workingDays.includes(dow as any) && !input.holidays.includes(d);
  });

  const slots: ExamSlot[] = [];
  const conflicts: ExamConflict[] = [];
  const preferredStart = input.preferredStart ?? '09:00';
  const invLoad: Record<string, number> = {};
  invigilators.forEach(i => { invLoad[i.id] = 0; });

  // For each class+section, place each subject on a distinct available date
  for (const cls of input.classes) {
    for (const sec of input.sections) {
      // Track per-day count for this class-section
      const perDay: Record<string, number> = {};
      let dateIdx = 0;
      let slotOffsetInDay = 0;

      for (const subject of input.subjects) {
        // Find next date with room in daily limit
        while (dateIdx < dates.length) {
          const d = dates[dateIdx];
          if ((perDay[d] ?? 0) < input.dailyLimit) break;
          dateIdx++; slotOffsetInDay = 0;
        }
        if (dateIdx >= dates.length) {
          conflicts.push({ kind: 'outside_date_range', message: `Not enough working days to fit ${subject} for ${cls}-${sec}.` });
          break;
        }
        const date = dates[dateIdx];
        const start = addMinutes(preferredStart, slotOffsetInDay * (input.examDuration + input.breakDuration));
        const end = addMinutes(start, input.examDuration);

        // Pick room (first available that isn't double-booked at that time)
        const takenRoomIds = new Set(
          slots.filter(s => s.date === date && overlaps(s.start, s.end, start, end)).flatMap(s => s.roomIds)
        );
        const room = rooms.find(r => r.available !== false && !takenRoomIds.has(r.id));
        if (rooms.length && !room) {
          conflicts.push({ kind: 'no_room_available', message: `No room free for ${cls}-${sec} ${subject} on ${date}.`, meta: { date, subject } });
        }

        // Pick 1-2 invigilators with lowest load, not already assigned in overlapping slot
        const busyInv = new Set(
          slots.filter(s => s.date === date && overlaps(s.start, s.end, start, end)).flatMap(s => s.invigilatorIds)
        );
        const ranked = [...invigilators]
          .filter(i => i.available !== false && !busyInv.has(i.id))
          .sort((a, b) => (invLoad[a.id] ?? 0) - (invLoad[b.id] ?? 0));
        const picked = ranked.slice(0, Math.min(2, ranked.length));
        picked.forEach(p => { invLoad[p.id] = (invLoad[p.id] ?? 0) + 1; });
        if (invigilators.length && picked.length === 0) {
          conflicts.push({ kind: 'no_invigilator_available', message: `No invigilator free for ${cls}-${sec} ${subject} on ${date}.` });
        }

        slots.push({
          id: uid('es'),
          date, start, end, subject,
          className: cls, section: sec,
          roomIds: room ? [room.id] : [],
          invigilatorIds: picked.map(p => p.id),
          duration: input.examDuration,
        });

        perDay[date] = (perDay[date] ?? 0) + 1;
        slotOffsetInDay++;
        if ((perDay[date] ?? 0) >= input.dailyLimit) { dateIdx++; slotOffsetInDay = 0; }
      }
    }
  }

  return { slots, conflicts };
}

/** Validate an existing schedule; returns all conflicts (multiple kinds). */
export function validateExamSchedule(schedule: ExamSchedule, rooms: Room[] = []): ExamConflict[] {
  const out: ExamConflict[] = [];
  const roomById = new Map(rooms.map(r => [r.id, r]));

  // Per class-section-date dedup + daily limit + duplicate subject
  const dayGroup: Record<string, ExamSlot[]> = {};
  schedule.slots.forEach(s => {
    const key = `${s.className}|${s.section}|${s.date}`;
    (dayGroup[key] ??= []).push(s);
  });
  Object.entries(dayGroup).forEach(([k, list]) => {
    if (list.length > schedule.dailyLimit) {
      out.push({ kind: 'daily_limit_exceeded', message: `${list[0].className}-${list[0].section}: ${list.length} exams on ${list[0].date} (limit ${schedule.dailyLimit}).` });
    }
    const subs: Record<string, number> = {};
    list.forEach(s => { subs[s.subject] = (subs[s.subject] ?? 0) + 1; });
    Object.entries(subs).forEach(([sub, n]) => {
      if (n > 1) out.push({ kind: 'duplicate_subject', message: `${list[0].className}-${list[0].section}: ${sub} scheduled ${n}× on ${list[0].date}.` });
    });
  });

  // Holiday hits
  schedule.slots.forEach(s => {
    if (schedule.holidays.includes(s.date)) out.push({ kind: 'holiday_hit', message: `${s.subject} on ${s.date} falls on a holiday.`, slotId: s.id });
  });

  // Teacher & room double-booking across concurrent slots
  for (let i = 0; i < schedule.slots.length; i++) {
    for (let j = i + 1; j < schedule.slots.length; j++) {
      const a = schedule.slots[i], b = schedule.slots[j];
      if (a.date !== b.date) continue;
      if (!(a.start < b.end && b.start < a.end)) continue;
      const roomClash = a.roomIds.find(r => b.roomIds.includes(r));
      if (roomClash) out.push({ kind: 'room_double_booked', message: `Room ${roomById.get(roomClash)?.number ?? roomClash} double-booked on ${a.date} ${a.start}.`, slotId: a.id });
      const invClash = a.invigilatorIds.find(t => b.invigilatorIds.includes(t));
      if (invClash) out.push({ kind: 'teacher_double_booked', message: `Invigilator ${invClash} double-booked on ${a.date} ${a.start}.`, slotId: a.id });
    }
  }

  return out;
}

/** Rebalance invigilators across all slots (used after manual edits). */
export function autoAssignInvigilators(schedule: ExamSchedule, invigilators: Invigilator[]): ExamSchedule {
  const load: Record<string, number> = {};
  invigilators.forEach(i => { load[i.id] = 0; });
  const slots = [...schedule.slots].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const updated = slots.map(s => {
    const busy = new Set(slots.filter(o => o !== s && o.date === s.date && o.start < s.end && s.start < o.end).flatMap(o => o.invigilatorIds));
    const ranked = invigilators.filter(i => i.available !== false && !busy.has(i.id)).sort((a, b) => load[a.id] - load[b.id]);
    const picked = ranked.slice(0, 2).map(p => p.id);
    picked.forEach(id => { load[id]++; });
    return { ...s, invigilatorIds: picked };
  });
  return { ...schedule, slots: updated };
}
