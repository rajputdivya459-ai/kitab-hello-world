// Phase 7.6 — Marks Entry & Evaluation. Types only (no logic).
// Marks sheets are keyed to an existing ExamMaster (src/lib/exam/master.ts).

export type AssessmentComponentId =
  | 'theory' | 'practical' | 'viva' | 'internal' | 'project' | 'assignment' | 'oral';

export const ASSESSMENT_COMPONENTS: Array<{ id: AssessmentComponentId; label: string; short: string }> = [
  { id: 'theory',     label: 'Theory',            short: 'TH' },
  { id: 'practical',  label: 'Practical',         short: 'PR' },
  { id: 'viva',       label: 'Viva',              short: 'VV' },
  { id: 'internal',   label: 'Internal Assessment', short: 'IA' },
  { id: 'project',    label: 'Project',           short: 'PJ' },
  { id: 'assignment', label: 'Assignment',        short: 'AS' },
  { id: 'oral',       label: 'Oral Examination',  short: 'OR' },
];

export const componentLabel = (id: string) =>
  ASSESSMENT_COMPONENTS.find(c => c.id === id)?.label ?? id;

export interface ComponentConfig {
  id: AssessmentComponentId;
  label: string;
  max: number;
  required: boolean;
  /** allowed decimal places; 0 = integers only */
  decimals: number;
  enabled: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'medical' | 'exempt';

export const ATTENDANCE_STATUSES: Array<{ id: AttendanceStatus; label: string; color: string; numeric: boolean }> = [
  { id: 'present', label: 'Present', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', numeric: true },
  { id: 'absent',  label: 'Absent',  color: 'bg-rose-100 text-rose-700 border-rose-200',          numeric: false },
  { id: 'medical', label: 'Medical', color: 'bg-amber-100 text-amber-700 border-amber-200',       numeric: false },
  { id: 'exempt',  label: 'Exempt',  color: 'bg-slate-100 text-slate-700 border-slate-200',       numeric: false },
];

export type MarksSheetStatus = 'draft' | 'submitted' | 'returned' | 'approved' | 'published';

export const SHEET_STATUS_META: Record<MarksSheetStatus, { label: string; color: string }> = {
  draft:     { label: 'Draft',                 color: 'bg-slate-100 text-slate-700 border-slate-200' },
  submitted: { label: 'Submitted',             color: 'bg-blue-100 text-blue-700 border-blue-200' },
  returned:  { label: 'Returned for Correction', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved:  { label: 'Approved',              color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  published: { label: 'Published',             color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

export interface MarksRow {
  studentId: string;
  roll: string;
  name: string;
  admissionNo: string;
  status: AttendanceStatus;
  /** componentId -> marks (null = not entered). Ignored when status !== 'present'. */
  marks: Partial<Record<AssessmentComponentId, number | null>>;
  remarks?: string;
}

export interface MarksSheet {
  id: string;
  examId: string;
  examName: string;
  academicYear: string;
  classId: string;              // class name/id e.g. '10'
  section: string;              // 'A'
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  schemeId: string;
  components: ComponentConfig[];
  rows: MarksRow[];
  status: MarksSheetStatus;
  locked: boolean;
  workflowId?: string;
  reviewerRemarks?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  decidedAt?: string;
  publishedAt?: string;
}

export interface MarksHistoryEntry {
  id: string;
  sheetId: string;
  studentId?: string;
  action: string;               // created | updated | draft.save | submit | return | approve | publish | lock | unlock
  before?: any;
  after?: any;
  reason?: string;
  status: MarksSheetStatus;
  userId: string;
  userName: string;
  ts: string;
}
