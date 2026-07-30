import { mockUsers } from './users';

// Light seeds — real academic data still comes from Supabase. These exist so
// mock profiles resolve without hitting the backend during Phase 7 UI testing.
export const mockStudents = [
  { id: 's_1', name: 'R. Sharma', class: '10', section: 'A', roll: '12', parentId: 'p_1' },
  { id: 's_2', name: 'S. Mehta',  class: '9',  section: 'B', roll: '05', parentId: 'p_2' },
  { id: 's_3', name: 'Z. Khan',   class: '8',  section: 'A', roll: '22', parentId: 'p_3' },
];
export const mockParents = [
  { id: 'p_1', name: 'A. Sharma', children: ['s_1'] },
  { id: 'p_2', name: 'V. Mehta',  children: ['s_2'] },
  { id: 'p_3', name: 'H. Khan',   children: ['s_3'] },
];
export const mockTeachers = [
  { id: 't_1', name: 'P. Patil', subjects: ['Math', 'Physics'] },
  { id: 't_2', name: 'A. Iyer',  subjects: ['English'] },
  { id: 't_3', name: 'N. Rao',   subjects: ['Science'] },
];
export const mockStaff = [
  { id: 'st_1',     name: 'M. Jadhav',        designation: 'Office Assistant' },
  { id: 'st_2',     name: 'K. Nair',          designation: 'Librarian' },
  { id: 'st_acc',   name: 'S. Deshmukh',      designation: 'Accountant' },
  { id: 'st_princ', name: 'Dr. R. Kulkarni',  designation: 'Principal' },
];

export const mockAccountants = [
  { id: 'st_acc', name: 'S. Deshmukh' },
];

// Sample pending approval requests so the Approval Center demos immediately.
export const mockWorkflows = [
  {
    id: 'wf_seed_1',
    module: 'finance.expense',
    recordId: 'exp_101',
    title: 'Expense — Ravi Stationers · ₹4,800',
    status: 'pending',
    createdBy: 'u_accountant',
    submittedBy: 'u_accountant',
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
    submittedAt: new Date(Date.now() - 3600_000).toISOString(),
    after: { vendor: 'Ravi Stationers', amount: 4800, category: 'Office Supplies' },
    meta: { amount: 4800 },
  },
  {
    id: 'wf_seed_2',
    module: 'finance.fee',
    recordId: 's_1',
    title: 'Fee — R. Sharma · ₹12,000 (Tuition)',
    status: 'pending',
    createdBy: 'u_accountant',
    submittedBy: 'u_accountant',
    createdAt: new Date(Date.now() - 5400_000).toISOString(),
    submittedAt: new Date(Date.now() - 5400_000).toISOString(),
    after: { amount: 12000, category: 'Tuition', method: 'upi' },
    meta: { studentId: 's_1', amount: 12000 },
  },
  {
    id: 'wf_seed_3',
    module: 'finance.salary',
    recordId: 'st_acc',
    title: 'Salary — S. Deshmukh · 2026-07 · ₹42,000',
    status: 'pending',
    createdBy: 'u_admin',
    submittedBy: 'u_admin',
    createdAt: new Date(Date.now() - 7200_000).toISOString(),
    submittedAt: new Date(Date.now() - 7200_000).toISOString(),
    after: { amount: 42000, month: '2026-07' },
    meta: { staffId: 'st_acc', amount: 42000 },
  },
  {
    id: 'wf_seed_4',
    module: 'student.change',
    recordId: 's_2',
    title: 'S. Mehta — mobile, address',
    status: 'pending',
    createdBy: 'u_staff',
    submittedBy: 'u_staff',
    createdAt: new Date(Date.now() - 86400_000).toISOString(),
    submittedAt: new Date(Date.now() - 86400_000).toISOString(),
    before: { mobile: '9111111111', address: 'Old Lane 3' },
    after:  { mobile: '9888800001', address: 'New Lane 12, Pune' },
    meta: { studentId: 's_2', class: '9', section: 'B' },
  },
  {
    id: 'wf_seed_5',
    module: 'student.change',
    recordId: 's_1',
    title: 'R. Sharma — section transfer A → C',
    status: 'draft',
    createdBy: 'u_staff',
    submittedBy: 'u_staff',
    createdAt: new Date(Date.now() - 172800_000).toISOString(),
    before: { section: 'A' },
    after:  { section: 'C' },
    meta: { studentId: 's_1', class: '10' },
  },
];

// Sample published timetable for Class 10-A so read-only portals work immediately.
function buildSeedTimetable() {
  const days: Array<'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'> = ['Mon','Tue','Wed','Thu','Fri','Sat'];
  const slots = [
    { start: '08:00', end: '08:45', kind: 'class' as const },
    { start: '08:45', end: '09:30', kind: 'class' as const },
    { start: '09:30', end: '09:45', kind: 'break' as const, subject: 'Short Break' },
    { start: '09:45', end: '10:30', kind: 'class' as const },
    { start: '10:30', end: '11:15', kind: 'class' as const },
    { start: '11:15', end: '11:45', kind: 'break' as const, subject: 'Lunch' },
    { start: '11:45', end: '12:30', kind: 'class' as const },
    { start: '12:30', end: '13:15', kind: 'class' as const },
    { start: '13:15', end: '14:00', kind: 'class' as const },
  ];
  const rotation = [
    { subject: 'Mathematics', teacherId: 't_1', room: 'R-101' },
    { subject: 'English',     teacherId: 't_2', room: 'R-102' },
    { subject: 'Science',     teacherId: 't_3', room: 'Lab-1' },
    { subject: 'Social',      teacherId: 't_1', room: 'R-101' },
    { subject: 'Hindi',       teacherId: 't_2', room: 'R-102' },
    { subject: 'PE',          teacherId: 't_3', room: 'Ground' },
  ];
  const periods: any[] = [];
  days.forEach((d, di) => {
    slots.forEach((s, si) => {
      const id = `p_${d}_${si}`;
      if (s.kind === 'break') {
        periods.push({ id, day: d, index: si, start: s.start, end: s.end, kind: 'break', subject: s.subject });
      } else {
        const r = rotation[(di + si) % rotation.length];
        periods.push({ id, day: d, index: si, start: s.start, end: s.end, kind: 'class', ...r });
      }
    });
  });
  const now = new Date().toISOString();
  return {
    id: 'tt_seed_10a', kind: 'academic', status: 'published', version: 1,
    academicYear: '2026-27', className: '10', section: 'A',
    workingDays: days, startTime: '08:00', endTime: '14:00',
    periodDuration: 45, breakDuration: 15, breakCount: 2,
    periods, createdAt: now, updatedAt: now, publishedAt: now, createdBy: 'u_admin',
  };
}

// -------- Rooms & Invigilators seed --------
const seedRooms = [
  { id: 'rm_101', number: '101', capacity: 40, block: 'A', available: true },
  { id: 'rm_102', number: '102', capacity: 40, block: 'A', available: true },
  { id: 'rm_103', number: '103', capacity: 35, block: 'A', available: true },
  { id: 'rm_201', number: '201', capacity: 50, block: 'B', available: true },
  { id: 'rm_202', number: '202', capacity: 50, block: 'B', available: true },
  { id: 'rm_hall', number: 'Hall', capacity: 120, block: 'Main', available: true },
];
const seedInvigilators = [
  { id: 't_1', name: 'P. Patil', role: 'teacher', available: true },
  { id: 't_2', name: 'A. Iyer',  role: 'teacher', available: true },
  { id: 't_3', name: 'N. Rao',   role: 'teacher', available: true },
  { id: 'st_1', name: 'M. Jadhav', role: 'staff', available: true },
  { id: 'st_2', name: 'K. Nair',   role: 'staff', available: true },
];

// -------- Sample exam schedules --------
function buildExam(kind: string, title: string, startOffsetDays: number, subjects: string[], classes: string[], sections: string[], status: 'draft' | 'published' | 'pending') {
  const start = new Date(Date.now() + startOffsetDays * 86400_000);
  const startDate = start.toISOString().slice(0, 10);
  const end = new Date(Date.now() + (startOffsetDays + subjects.length + 3) * 86400_000);
  const endDate = end.toISOString().slice(0, 10);
  const slots: any[] = [];
  let idx = 0;
  classes.forEach(cls => {
    sections.forEach(sec => {
      subjects.forEach((sub, i) => {
        const d = new Date(start.getTime() + i * 86400_000);
        if (d.getDay() === 0) d.setDate(d.getDate() + 1);
        const room = seedRooms[(i + idx) % seedRooms.length];
        const inv1 = seedInvigilators[(i + idx) % seedInvigilators.length];
        const inv2 = seedInvigilators[(i + idx + 2) % seedInvigilators.length];
        slots.push({
          id: `es_${kind}_${cls}${sec}_${i}`,
          date: d.toISOString().slice(0, 10), start: '09:00', end: '12:00',
          subject: sub, className: cls, section: sec,
          roomIds: [room.id], invigilatorIds: [inv1.id, inv2.id], duration: 180,
        });
        idx++;
      });
    });
  });
  const now = new Date().toISOString();
  return {
    id: `ex_seed_${kind}`, kind, status, version: 1,
    academicYear: '2026-27', title,
    classes, sections, subjects,
    startDate, endDate,
    examDuration: 180, breakDuration: 30, dailyLimit: 1,
    holidays: [], workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    preferredStart: '09:00',
    roomIds: seedRooms.map(r => r.id), invigilatorIds: seedInvigilators.map(i => i.id),
    slots, createdAt: now, updatedAt: now,
    publishedAt: status === 'published' ? now : undefined,
    createdBy: 'u_admin',
  };
}

const seedExamSchedules = [
  buildExam('quarterly', 'Quarterly Examination — 2026-27', 7, ['Mathematics', 'English', 'Science', 'Social', 'Hindi'], ['9', '10'], ['A', 'B'], 'published'),
  buildExam('half_yearly', 'Half-Yearly Examination — 2026-27', 60, ['Mathematics', 'English', 'Science', 'Social', 'Hindi', 'PE'], ['9', '10'], ['A'], 'draft'),
  buildExam('annual', 'Annual Examination — 2026-27', 180, ['Mathematics', 'English', 'Science', 'Social', 'Hindi'], ['8', '9', '10'], ['A', 'B'], 'pending'),
  buildExam('monthly_test', 'Monthly Test — August', 21, ['Mathematics', 'English'], ['10'], ['A', 'B'], 'published'),
  buildExam('unit_test', 'Unit Test I — 2026-27', 3, ['Mathematics', 'Science'], ['9', '10'], ['A', 'B'], 'published'),
];

// -------- Phase 7.5: Exam Master records (linked to the schedules above) --------
const SUBJECT_META: Record<string, { code: string; practical?: boolean }> = {
  Mathematics: { code: 'MTH' }, English: { code: 'ENG' }, Science: { code: 'SCI', practical: true },
  Social: { code: 'SST' }, Hindi: { code: 'HIN' }, PE: { code: 'PED', practical: true },
};

const defaultInstructions = {
  general: 'Reach the examination hall 30 minutes before the reporting time.\nCarry your school ID card and hall ticket.\nWrite your roll number clearly on every answer sheet.\nNo candidate is allowed to leave the hall in the first 45 minutes.',
  allowedMaterials: 'Blue/black pen, pencil, geometry box, hall ticket',
  reportingTime: '08:30',
  uniform: 'Full school uniform with polished shoes is mandatory',
  calculator: 'Non-programmable calculators allowed for Class 9 & 10 Science only',
  mobilePolicy: 'Mobile phones and smart watches are strictly prohibited inside the hall',
  attendanceRules: 'Minimum 75% attendance required to appear for the examination',
};

function buildExamMaster(
  schedule: any,
  name: string,
  type: string,
  status: string,
  coordinator: { id: string; name: string },
  visible: boolean,
) {
  const now = new Date().toISOString();
  const abbr: Record<string, string> = { unit_test: 'UT', monthly_test: 'MT', quarterly: 'QE', half_yearly: 'HY', annual: 'AE' };
  return {
    id: `em_seed_${type}`,
    code: `${abbr[type] ?? 'EX'}-2026-27-01`,
    name,
    academicYear: '2026-27',
    type,
    description: `${name} conducted as per the CBSE academic calendar.`,
    status,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    holidays: [],
    coordinatorId: coordinator.id,
    coordinatorName: coordinator.name,
    classes: schedule.classes,
    sections: schedule.sections,
    wholeSchool: false,
    subjects: schedule.subjects.map((s: string, i: number) => ({
      id: `sub_${type}_${i}`,
      name: s,
      code: `${SUBJECT_META[s]?.code ?? s.slice(0, 3).toUpperCase()}-${schedule.classes[0]}`,
      maxMarks: type === 'unit_test' || type === 'monthly_test' ? 25 : 100,
      passingMarks: type === 'unit_test' || type === 'monthly_test' ? 9 : 35,
      duration: type === 'unit_test' || type === 'monthly_test' ? 60 : 180,
      isPractical: !!SUBJECT_META[s]?.practical,
      category: SUBJECT_META[s]?.practical ? 'practical' : i < 3 ? 'mandatory' : 'optional',
    })),
    instructions: defaultInstructions,
    visible,
    scheduleId: schedule.id,
    roomIds: seedRooms.map(r => r.id),
    invigilatorIds: seedInvigilators.map(i => i.id),
    createdAt: now,
    updatedAt: now,
    publishedAt: status === 'published' ? now : undefined,
    createdBy: 'u_admin',
  };
}

const COORD_PRINCIPAL = { id: 'st_princ', name: 'Dr. R. Kulkarni — Principal' };
const COORD_T1 = { id: 't_1', name: 'P. Patil' };
const COORD_T2 = { id: 't_2', name: 'A. Iyer' };

const seedExamMasters = [
  buildExamMaster(seedExamSchedules[4], 'Unit Test I — 2026-27', 'unit_test', 'published', COORD_T1, true),
  buildExamMaster(seedExamSchedules[3], 'Monthly Test — August', 'monthly_test', 'published', COORD_T2, true),
  buildExamMaster(seedExamSchedules[0], 'Quarterly Examination — 2026-27', 'quarterly', 'published', COORD_PRINCIPAL, true),
  buildExamMaster(seedExamSchedules[1], 'Half-Yearly Examination — 2026-27', 'half_yearly', 'draft', COORD_T1, false),
  buildExamMaster(seedExamSchedules[2], 'Annual Examination — 2026-27', 'annual', 'pending', COORD_PRINCIPAL, false),
];

export const SEEDS = {
  users: mockUsers,
  students: mockStudents,
  parents: mockParents,
  teachers: mockTeachers,
  staff: mockStaff,
  accountants: mockAccountants,
  workflows: mockWorkflows,
  timetables: [buildSeedTimetable()],
  rooms: seedRooms,
  invigilators: seedInvigilators,
  exam_schedules: seedExamSchedules,
  exam_masters: seedExamMasters,
  audit_log: [],
};
