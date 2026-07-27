// Smart Timetable — types & extensible type registry.
// Add a new timetable type at runtime with `registerTimetableType(...)`.

export type TimetableStatus = 'draft' | 'published' | 'archived';

export type TimetableKind = string; // extensible via registry

export interface TimetableTypeDef {
  key: TimetableKind;
  label: string;
  category: 'academic' | 'exam' | 'special';
  requiresApproval?: boolean;
}

const REGISTRY: Record<string, TimetableTypeDef> = {};
export function registerTimetableType(def: TimetableTypeDef) { REGISTRY[def.key] = def; }
export function listTimetableTypes(): TimetableTypeDef[] { return Object.values(REGISTRY); }
export function getTimetableType(key: string): TimetableTypeDef | undefined { return REGISTRY[key]; }

// Seed defaults
[
  { key: 'academic',        label: 'Academic Timetable',      category: 'academic' },
  { key: 'unit_test',       label: 'Unit Test',               category: 'exam' },
  { key: 'monthly_test',    label: 'Monthly Test',            category: 'exam' },
  { key: 'quarterly',       label: 'Quarterly Examination',   category: 'exam' },
  { key: 'half_yearly',     label: 'Half-Yearly Examination', category: 'exam' },
  { key: 'annual',          label: 'Annual Examination',      category: 'exam' },
  { key: 'practical',       label: 'Practical Examination',   category: 'exam' },
  { key: 'special',         label: 'Special Classes',         category: 'special' },
  { key: 'extra',           label: 'Extra Classes',           category: 'special' },
  { key: 'holiday',         label: 'Holiday Schedule',        category: 'special' },
].forEach((d) => registerTimetableType(d as TimetableTypeDef));

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export const WEEKDAYS: Weekday[] = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export interface Period {
  id: string;
  day: Weekday;
  index: number;          // period order 0..n
  start: string;          // "09:00"
  end: string;            // "09:45"
  kind: 'class' | 'break' | 'free';
  subject?: string;
  teacherId?: string;
  room?: string;
  notes?: string;
}

export interface TimetableRecord {
  id: string;
  kind: TimetableKind;
  status: TimetableStatus;
  version: number;
  academicYear: string;
  className: string;
  section: string;
  workingDays: Weekday[];
  startTime: string;
  endTime: string;
  periodDuration: number;   // minutes
  breakDuration: number;    // minutes
  breakCount: number;
  periods: Period[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  publishedAt?: string;
  parentId?: string;        // previous version
  templateKey?: string;
  meta?: Record<string, any>;
}

export interface SubjectInput {
  name: string;
  periodsPerWeek: number;
  teacherId: string;        // e.g. 't_1'
  difficulty?: 1 | 2 | 3;   // 3 = hardest → schedule earlier in day
  preferredRoom?: string;
}

export interface GeneratorInput {
  kind: TimetableKind;
  academicYear: string;
  className: string;
  section: string;
  workingDays: Weekday[];
  startTime: string;
  endTime: string;
  periodDuration: number;
  breakDuration: number;
  breakCount: number;
  subjects: SubjectInput[];
  templateKey?: string;
}

export type ConflictKind =
  | 'teacher_double_booked'
  | 'room_double_booked'
  | 'over_capacity'
  | 'consecutive_same_subject'
  | 'no_teacher_available'
  | 'insufficient_slots';

export interface Conflict {
  kind: ConflictKind;
  message: string;
  meta?: Record<string, any>;
}
