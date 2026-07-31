// Phase 7.6 demo data — roster, teacher subject assignments and marks sheets
// covering every workflow state (draft / submitted / returned / approved / published).

const FIRST = ['Aarav','Isha','Rohan','Sneha','Kabir','Meera','Arjun','Diya','Vivaan','Ananya','Neel','Tara','Ritvik','Sara'];
const LAST  = ['Sharma','Mehta','Khan','Patil','Iyer','Rao','Joshi','Kulkarni','Nair','Desai'];

export interface SeedRosterStudent {
  id: string; roll: string; name: string; admissionNo: string; classId: string; section: string;
}

const CLASSES = ['8', '9', '10'];
const SECTIONS = ['A', 'B'];
const PER_SECTION = 10;

export const seedRoster: SeedRosterStudent[] = (() => {
  const out: SeedRosterStudent[] = [];
  CLASSES.forEach((cls, ci) => SECTIONS.forEach((sec, si) => {
    for (let i = 0; i < PER_SECTION; i++) {
      const n = ci * 20 + si * 10 + i;
      out.push({
        id: `rs_${cls}${sec}_${i + 1}`,
        roll: String(i + 1).padStart(2, '0'),
        name: `${FIRST[n % FIRST.length]} ${LAST[(n + i) % LAST.length]}`,
        admissionNo: `ADM${2026}${String(100 + n).padStart(4, '0')}`,
        classId: cls, section: sec,
      });
    }
  }));
  return out;
})();

export const seedTeacherSubjects = [
  { id: 'ts_1', teacherId: 't_1', teacherName: 'P. Patil', classId: '10', section: 'A', subjectName: 'Mathematics' },
  { id: 'ts_2', teacherId: 't_1', teacherName: 'P. Patil', classId: '10', section: 'B', subjectName: 'Mathematics' },
  { id: 'ts_3', teacherId: 't_1', teacherName: 'P. Patil', classId: '9',  section: 'A', subjectName: 'Mathematics' },
  { id: 'ts_4', teacherId: 't_2', teacherName: 'A. Iyer',  classId: '10', section: 'A', subjectName: 'English' },
  { id: 'ts_5', teacherId: 't_2', teacherName: 'A. Iyer',  classId: '9',  section: 'B', subjectName: 'English' },
  { id: 'ts_6', teacherId: 't_3', teacherName: 'N. Rao',   classId: '10', section: 'A', subjectName: 'Science' },
  { id: 'ts_7', teacherId: 't_3', teacherName: 'N. Rao',   classId: '8',  section: 'A', subjectName: 'Science' },
  { id: 'ts_8', teacherId: 't_2', teacherName: 'A. Iyer',  classId: '8',  section: 'A', subjectName: 'English' },
];

const COMPONENTS = {
  split_80_20: [
    { id: 'theory',   label: 'Theory',   max: 80, required: true, decimals: 0, enabled: true },
    { id: 'internal', label: 'Internal', max: 20, required: true, decimals: 0, enabled: true },
  ],
  split_70_30: [
    { id: 'theory',    label: 'Theory',    max: 70, required: true, decimals: 0, enabled: true },
    { id: 'practical', label: 'Practical', max: 30, required: true, decimals: 0, enabled: true },
  ],
  full_100: [
    { id: 'theory', label: 'Theory', max: 100, required: true, decimals: 0, enabled: true },
  ],
};

const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * 86400_000).toISOString();

function buildSheet(
  n: number,
  exam: { id: string; name: string },
  classId: string, section: string, subjectName: string,
  teacher: { id: string; name: string },
  schemeId: keyof typeof COMPONENTS,
  status: 'draft' | 'submitted' | 'returned' | 'approved' | 'published',
  fillRatio = 1,
) {
  const comps = COMPONENTS[schemeId].map(c => ({ ...c }));
  const students = seedRoster.filter(s => s.classId === classId && s.section === section);
  const rows = students.map((st, i) => {
    const filled = i < Math.round(students.length * fillRatio);
    const statuses = ['present', 'present', 'present', 'present', 'present', 'present', 'present', 'absent', 'medical', 'exempt'];
    const rowStatus = statuses[(i + n) % statuses.length] as any;
    const marks: Record<string, number> = {};
    if (filled && rowStatus === 'present') {
      comps.forEach((c, ci) => {
        const base = 0.55 + ((i * 7 + ci * 13 + n * 5) % 40) / 100;
        marks[c.id] = Math.round(c.max * Math.min(base, 0.98));
      });
    }
    return {
      studentId: st.id, roll: st.roll, name: st.name, admissionNo: st.admissionNo,
      status: rowStatus, marks, remarks: '',
    };
  });
  return {
    id: `ms_seed_${n}`,
    examId: exam.id, examName: exam.name, academicYear: '2026-27',
    classId, section,
    subjectId: `${subjectName}-${classId}`, subjectName,
    teacherId: teacher.id, teacherName: teacher.name,
    schemeId, components: comps, rows,
    status,
    locked: status === 'published',
    reviewerRemarks: status === 'returned' ? 'Internal assessment marks look inconsistent for roll 03–06. Please recheck and resubmit.' : undefined,
    reviewedBy: ['returned', 'approved', 'published'].includes(status) ? 'Dr. R. Kulkarni' : undefined,
    createdAt: iso(-9 + n),
    updatedAt: iso(-2 + n * 0.1),
    submittedAt: status !== 'draft' ? iso(-3) : undefined,
    decidedAt: ['returned', 'approved', 'published'].includes(status) ? iso(-1) : undefined,
    publishedAt: status === 'published' ? iso(-1) : undefined,
  };
}

const EX_UT = { id: 'em_seed_unit_test', name: 'Unit Test I — 2026-27' };
const EX_MT = { id: 'em_seed_monthly_test', name: 'Monthly Test — August' };
const EX_QE = { id: 'em_seed_quarterly', name: 'Quarterly Examination — 2026-27' };

const T1 = { id: 't_1', name: 'P. Patil' };
const T2 = { id: 't_2', name: 'A. Iyer' };
const T3 = { id: 't_3', name: 'N. Rao' };

export const seedMarksSheets = [
  buildSheet(1, EX_QE, '10', 'A', 'Mathematics', T1, 'split_80_20', 'published'),
  buildSheet(2, EX_QE, '10', 'A', 'English',     T2, 'split_80_20', 'approved'),
  buildSheet(3, EX_QE, '10', 'A', 'Science',     T3, 'split_70_30', 'submitted'),
  buildSheet(4, EX_QE, '10', 'B', 'Mathematics', T1, 'split_80_20', 'returned'),
  buildSheet(5, EX_QE, '9',  'A', 'Mathematics', T1, 'split_80_20', 'draft', 0.5),
  buildSheet(6, EX_QE, '9',  'B', 'English',     T2, 'split_80_20', 'submitted'),
  buildSheet(7, EX_MT, '10', 'A', 'Mathematics', T1, 'full_100',    'published'),
  buildSheet(8, EX_MT, '10', 'B', 'Mathematics', T1, 'full_100',    'draft', 0),
  buildSheet(9, EX_UT, '10', 'A', 'Science',     T3, 'full_100',    'approved'),
  buildSheet(10, EX_UT, '8', 'A', 'Science',     T3, 'full_100',    'draft', 0.3),
  buildSheet(11, EX_UT, '8', 'A', 'English',     T2, 'full_100',    'returned'),
];

export const seedMarksHistory = seedMarksSheets.flatMap((s, i) => ([
  {
    id: `mh_seed_${i}_a`, sheetId: s.id, action: 'created', status: 'draft',
    userId: 'u_teacher', userName: s.teacherName, ts: s.createdAt,
  },
  ...(s.submittedAt ? [{
    id: `mh_seed_${i}_b`, sheetId: s.id, action: 'submitted', status: 'submitted',
    userId: 'u_teacher', userName: s.teacherName, ts: s.submittedAt,
  }] : []),
  ...(s.decidedAt ? [{
    id: `mh_seed_${i}_c`, sheetId: s.id,
    action: s.status === 'returned' ? 'returned' : 'approved',
    status: s.status === 'returned' ? 'returned' : 'approved',
    reason: s.reviewerRemarks, userId: 'u_principal', userName: 'Dr. R. Kulkarni', ts: s.decidedAt,
  }] : []),
  ...(s.publishedAt ? [{
    id: `mh_seed_${i}_d`, sheetId: s.id, action: 'published', status: 'published',
    userId: 'u_admin', userName: 'System Admin', ts: s.publishedAt,
  }] : []),
]));
