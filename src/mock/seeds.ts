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

export const SEEDS = {
  users: mockUsers,
  students: mockStudents,
  parents: mockParents,
  teachers: mockTeachers,
  staff: mockStaff,
  accountants: mockAccountants,
  workflows: mockWorkflows,
  timetables: [buildSeedTimetable()],
  audit_log: [],
};
