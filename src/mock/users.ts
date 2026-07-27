export type MockRole =
  | 'admin' | 'principal' | 'accountant' | 'teacher' | 'staff' | 'parent' | 'student';

export interface MockUser {
  id: string;
  name: string;
  username: string;
  password: string;
  email: string;
  mobile: string;
  role: MockRole;
  status: 'active' | 'inactive';
  photo?: string;
  profileId?: string;
  profileType?: 'teacher' | 'parent' | 'student' | 'staff';
  lastLogin?: string;
  createdAt: string;
  prefs?: { emailNotifs?: boolean; smsNotifs?: boolean; pushNotifs?: boolean };
  // Optional context labels shown on the Dev quick-login cards.
  context?: string; // e.g. "Class 10 · Sec A", "Physics · 8/9", "Front Desk"
}

const now = new Date().toISOString();

// Phase 7.2 expanded seeds — multiple accounts per role for realistic testing.
export const mockUsers: MockUser[] = [
  // Admin
  { id: 'u_admin',      name: 'System Admin',     username: 'admin',      password: 'admin123',      email: 'admin@mgcm.ac.in',      mobile: '9000000001', role: 'admin',      status: 'active', createdAt: now, context: 'Super Admin' },

  // Principal
  { id: 'u_principal',  name: 'Dr. R. Kulkarni',  username: 'principal',  password: 'principal123',  email: 'principal@mgcm.ac.in',  mobile: '9000000002', role: 'principal',  status: 'active', profileType: 'staff', profileId: 'st_princ', createdAt: now, context: 'Head of Institution' },

  // Accountant
  { id: 'u_accountant', name: 'S. Deshmukh',      username: 'accountant', password: 'accountant123', email: 'accounts@mgcm.ac.in',   mobile: '9000000003', role: 'accountant', status: 'active', profileType: 'staff', profileId: 'st_acc', createdAt: now, context: 'Finance Dept' },

  // Teachers (3)
  { id: 'u_teacher',    name: 'P. Patil',         username: 'teacher1',   password: 'teacher123',    email: 'teacher@mgcm.ac.in',    mobile: '9000000004', role: 'teacher',    status: 'active', profileType: 'teacher', profileId: 't_1', createdAt: now, context: 'Math · Class 10-A' },
  { id: 'u_teacher_2',  name: 'A. Iyer',          username: 'teacher2',   password: 'teacher123',    email: 'iyer@mgcm.ac.in',       mobile: '9000000041', role: 'teacher',    status: 'active', profileType: 'teacher', profileId: 't_2', createdAt: now, context: 'English · Class 9-B' },
  { id: 'u_teacher_3',  name: 'N. Rao',           username: 'teacher3',   password: 'teacher123',    email: 'rao@mgcm.ac.in',        mobile: '9000000042', role: 'teacher',    status: 'active', profileType: 'teacher', profileId: 't_3', createdAt: now, context: 'Science · Class 8-A' },

  // Staff (2)
  { id: 'u_staff',      name: 'M. Jadhav',        username: 'staff1',     password: 'staff123',      email: 'staff@mgcm.ac.in',      mobile: '9000000005', role: 'staff',      status: 'active', profileType: 'staff', profileId: 'st_1', createdAt: now, context: 'Front Desk' },
  { id: 'u_staff_2',    name: 'K. Nair',          username: 'staff2',     password: 'staff123',      email: 'nair@mgcm.ac.in',       mobile: '9000000051', role: 'staff',      status: 'active', profileType: 'staff', profileId: 'st_2', createdAt: now, context: 'Library' },

  // Parents (3)
  { id: 'u_parent',     name: 'A. Sharma',        username: 'parent1',    password: 'parent123',     email: 'parent@example.com',    mobile: '9000000006', role: 'parent',     status: 'active', profileType: 'parent', profileId: 'p_1', createdAt: now, context: 'Parent of R. Sharma (10-A)' },
  { id: 'u_parent_2',   name: 'V. Mehta',         username: 'parent2',    password: 'parent123',     email: 'vmehta@example.com',    mobile: '9000000061', role: 'parent',     status: 'active', profileType: 'parent', profileId: 'p_2', createdAt: now, context: 'Parent of S. Mehta (9-B)' },
  { id: 'u_parent_3',   name: 'H. Khan',          username: 'parent3',    password: 'parent123',     email: 'hkhan@example.com',     mobile: '9000000062', role: 'parent',     status: 'active', profileType: 'parent', profileId: 'p_3', createdAt: now, context: 'Parent of Z. Khan (8-A)' },

  // Students (3)
  { id: 'u_student',    name: 'R. Sharma',        username: 'student1',   password: 'student123',    email: 'student@example.com',   mobile: '9000000007', role: 'student',    status: 'active', profileType: 'student', profileId: 's_1', createdAt: now, context: 'Class 10 · Section A · Roll 12' },
  { id: 'u_student_2',  name: 'S. Mehta',         username: 'student2',   password: 'student123',    email: 'smehta@example.com',    mobile: '9000000071', role: 'student',    status: 'active', profileType: 'student', profileId: 's_2', createdAt: now, context: 'Class 9 · Section B · Roll 05' },
  { id: 'u_student_3',  name: 'Z. Khan',          username: 'student3',   password: 'student123',    email: 'zkhan@example.com',     mobile: '9000000072', role: 'student',    status: 'active', profileType: 'student', profileId: 's_3', createdAt: now, context: 'Class 8 · Section A · Roll 22' },
];

// Bump when seed data shape/credentials change so existing installs re-seed.
export const SEED_VERSION = '7.4.0';
