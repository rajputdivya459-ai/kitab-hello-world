// Phase 7.7 — Results, Rankings & Report Cards. Types only.
// Results are always derived from approved/published marks sheets (Phase 7.6).

export type ResultSetStatus = 'draft' | 'submitted' | 'approved' | 'published' | 'archived';

export const RESULT_STATUS_META: Record<ResultSetStatus, { label: string; color: string }> = {
  draft:     { label: 'Draft',     color: 'bg-slate-100 text-slate-700 border-slate-200' },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  approved:  { label: 'Approved',  color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  published: { label: 'Published', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  archived:  { label: 'Archived',  color: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
};

export type PromotionStatus = 'promoted' | 'detained' | 'pending';

export interface GradeBand {
  id: string;
  grade: string;      // A+, A, B…
  min: number;        // inclusive percentage
  max: number;        // inclusive percentage
  point: number;      // grade point on a 10-point base (converted per GPA scale)
  remarks: string;
}

export interface GpaScale {
  id: string;
  label: string;
  max: number;        // 4 / 5 / 10 / custom
}

export type ResultMode = 'percentage' | 'gpa' | 'both';
export type SubjectPassRule = 'each_subject' | 'aggregate_only';
export type TieBreaker = 'higher_total' | 'higher_subject_marks' | 'better_attendance' | 'alphabetical' | 'same_rank';

export const TIE_BREAKERS: Array<{ id: TieBreaker; label: string }> = [
  { id: 'higher_total',          label: 'Higher Total Marks' },
  { id: 'higher_subject_marks',  label: 'Higher Priority Subject Marks' },
  { id: 'better_attendance',     label: 'Better Attendance' },
  { id: 'alphabetical',          label: 'Alphabetical' },
  { id: 'same_rank',             label: 'Same Rank (shared)' },
];

export type ReportTemplateId =
  | 'primary' | 'middle' | 'high' | 'cbse' | 'state_board' | 'modern_landscape' | 'portrait';

export const REPORT_TEMPLATES: Array<{ id: ReportTemplateId; label: string; orientation: 'portrait' | 'landscape'; description: string }> = [
  { id: 'primary',          label: 'Primary School',   orientation: 'portrait',  description: 'Grade-first, minimal marks detail' },
  { id: 'middle',           label: 'Middle School',    orientation: 'portrait',  description: 'Balanced marks + grades' },
  { id: 'high',             label: 'High School',      orientation: 'portrait',  description: 'Full marks, grades, GPA, rank' },
  { id: 'cbse',             label: 'CBSE Style',       orientation: 'portrait',  description: 'CBSE-like grade sheet layout' },
  { id: 'state_board',      label: 'State Board Style',orientation: 'portrait',  description: 'State board marksheet layout' },
  { id: 'modern_landscape', label: 'Modern Landscape', orientation: 'landscape', description: 'Wide dashboard-style card' },
  { id: 'portrait',         label: 'Modern Portrait',  orientation: 'portrait',  description: 'Clean modern portrait card' },
];

export interface ResultConfig {
  id: string;
  label: string;
  mode: ResultMode;
  gpaScaleId: string;
  gpaScales: GpaScale[];
  grades: GradeBand[];
  subjectPassRule: SubjectPassRule;
  subjectPassPercent: number;     // per-subject pass %
  overallPassPercent: number;     // aggregate pass %
  graceMarks: number;             // max grace marks per subject
  graceMaxSubjects: number;       // number of subjects grace may apply to
  promotionMinPercent: number;
  promotionMaxFailedSubjects: number;
  distinctionPercent: number;
  firstDivisionPercent: number;
  secondDivisionPercent: number;
  thirdDivisionPercent: number;
  meritTopN: number;
  tieBreakers: TieBreaker[];
  prioritySubjects: string[];     // used by 'higher_subject_marks'
  defaultTemplate: ReportTemplateId;
  updatedAt: string;
}

export interface SubjectResult {
  subjectName: string;
  obtained: number;
  max: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  passed: boolean;
  graceApplied: number;
  attendance: 'present' | 'absent' | 'medical' | 'exempt';
  components: Array<{ label: string; value: number | null; max: number }>;
}

export interface StudentResult {
  studentId: string;
  roll: string;
  name: string;
  admissionNo: string;
  subjects: SubjectResult[];
  total: number;
  outOf: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  gpa: number;
  division: string;
  passed: boolean;
  failedSubjects: number;
  promotion: PromotionStatus;
  attendancePct: number;
  sectionRank: number;
  classRank: number;
  schoolRank: number;
  reportCardNo: string;
  teacherRemarks?: string;
  principalRemarks?: string;
}

export interface ResultSet {
  id: string;
  examId: string;
  examName: string;
  examType: string;
  academicYear: string;
  classId: string;
  section: string;
  configId: string;
  status: ResultSetStatus;
  students: StudentResult[];
  subjects: string[];
  sourceSheetIds: string[];
  templateId: ReportTemplateId;
  workflowId?: string;
  reviewerRemarks?: string;
  reviewedBy?: string;
  generatedAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  archivedAt?: string;
}

export interface ResultStats {
  students: number;
  passed: number;
  failed: number;
  passPercent: number;
  failPercent: number;
  average: number;
  highest: number;
  lowest: number;
  averageGpa: number;
  distinction: number;
  promoted: number;
  detained: number;
  gradeDistribution: Array<{ grade: string; count: number }>;
  gpaDistribution: Array<{ band: string; count: number }>;
  subjectPerformance: Array<{ subject: string; average: number; highest: number; lowest: number; passPercent: number }>;
}
