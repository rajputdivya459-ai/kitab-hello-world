// Exam Scheduler — types (Phase 7.4 Slice B). Reuses timetable kind registry
// (unit_test, quarterly, etc.) but stores its own record shape optimized for
// date-based (rather than weekday-based) scheduling.

export type ExamStatus = 'draft' | 'pending' | 'approved' | 'published' | 'archived';

export interface Room {
  id: string;
  number: string;
  capacity: number;
  block?: string;
  available?: boolean;
}

export interface Invigilator {
  id: string;          // links to teacher/staff id (t_1, st_1, etc.)
  name: string;
  role: 'teacher' | 'staff';
  available?: boolean;
}

export interface ExamSlot {
  id: string;
  date: string;         // YYYY-MM-DD
  start: string;        // HH:mm
  end: string;          // HH:mm
  subject: string;
  className: string;
  section: string;
  roomIds: string[];
  invigilatorIds: string[];
  duration: number;     // minutes
  notes?: string;
}

export interface ExamSchedule {
  id: string;
  kind: string;                    // 'quarterly', 'annual', etc.
  status: ExamStatus;
  version: number;
  academicYear: string;
  title: string;
  classes: string[];               // ['9','10']
  sections: string[];              // ['A','B']
  subjects: string[];
  startDate: string;               // YYYY-MM-DD
  endDate: string;
  examDuration: number;            // minutes
  breakDuration: number;           // minutes between exams same day
  dailyLimit: number;              // max exams per class per day
  holidays: string[];              // YYYY-MM-DD
  workingDays: Array<'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun'>;
  preferredStart?: string;         // HH:mm default 09:00
  roomIds?: string[];              // pool
  invigilatorIds?: string[];       // pool
  slots: ExamSlot[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  createdBy?: string;
  parentId?: string;
  workflowId?: string;
  meta?: Record<string, any>;
}

export type ExamConflictKind =
  | 'teacher_double_booked'
  | 'room_double_booked'
  | 'room_over_capacity'
  | 'holiday_hit'
  | 'daily_limit_exceeded'
  | 'duplicate_subject'
  | 'no_room_available'
  | 'no_invigilator_available'
  | 'outside_date_range';

export interface ExamConflict {
  kind: ExamConflictKind;
  message: string;
  slotId?: string;
  meta?: Record<string, any>;
}

export interface ExamGeneratorInput {
  kind: string;
  academicYear: string;
  title: string;
  classes: string[];
  sections: string[];
  subjects: string[];
  startDate: string;
  endDate: string;
  examDuration: number;
  breakDuration: number;
  dailyLimit: number;
  holidays: string[];
  workingDays: Array<'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun'>;
  preferredStart?: string;
  roomIds?: string[];
  invigilatorIds?: string[];
}
