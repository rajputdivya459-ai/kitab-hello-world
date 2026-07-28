import {
  Home, FileText, Building2, Users, Calendar, Image, MessageSquare,
  GraduationCap, Settings, BarChart3, Globe, Video, BookOpen,
  IndianRupee, PieChart, UserCheck, AlertTriangle, School,
  CalendarCheck, ClipboardList, Award, Bell, Megaphone, Briefcase, UserPlus,
  Bus, IdCard, FileCheck, CalendarRange, UserCircle, BellRing, ShieldCheck,
  Wallet, Receipt, Landmark, Inbox, Activity, UserPen, LucideIcon,
} from 'lucide-react';

export type NavItem = { href: string; label: string; icon: LucideIcon };
export type NavGroup = { id: string; label: string; icon: LucideIcon; items: NavItem[] };

const websiteGroup: NavGroup = {
  id: 'website', label: 'Website', icon: Globe, items: [
    { href: '/admin/settings',        label: 'Site Settings',   icon: Settings },
    { href: '/admin/homepage',        label: 'Homepage',        icon: FileText },
    { href: '/admin/about',           label: 'About',           icon: FileText },
    { href: '/admin/stats',           label: 'Statistics',      icon: BarChart3 },
    { href: '/admin/departments',     label: 'Departments',     icon: Building2 },
    { href: '/admin/members',         label: 'Members',         icon: Users },
    { href: '/admin/faculty',         label: 'Faculty',         icon: Users },
    { href: '/admin/events',          label: 'Events',          icon: Calendar },
    { href: '/admin/gallery',         label: 'Gallery',         icon: Image },
    { href: '/admin/social-links',    label: 'Social Links',    icon: Globe },
    { href: '/admin/explore-videos',  label: 'Explore Videos',  icon: Video },
    { href: '/admin/programs',        label: 'Programs',        icon: BookOpen },
  ],
};

const commsGroup: NavGroup = {
  id: 'communication', label: 'Communication', icon: MessageSquare, items: [
    { href: '/admin/notices',       label: 'Notices',       icon: Bell },
    { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/admin/notifications', label: 'Notifications', icon: MessageSquare },
    { href: '/admin/messages',      label: 'Messages',      icon: MessageSquare },
  ],
};

export const adminMenu: NavGroup[] = [
  {
    id: 'main', label: 'Workspace', icon: Home, items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
      { href: '/admin/profile',   label: 'My Profile', icon: UserCircle },
    ],
  },
  websiteGroup,
  {
    id: 'school', label: 'School ERP', icon: School, items: [
      { href: '/admin/course-structure', label: 'Course Structure', icon: GraduationCap },
      { href: '/admin/timetable',        label: 'Timetable Studio', icon: CalendarRange },
      { href: '/admin/students',         label: 'Students',         icon: UserCheck },
      { href: '/admin/student-requests', label: 'Student Requests', icon: UserPen },
      { href: '/admin/attendance',       label: 'Attendance',       icon: CalendarCheck },
      { href: '/admin/exams',            label: 'Exams',            icon: ClipboardList },
      { href: '/admin/exam-scheduler',   label: 'Exam Scheduler',   icon: ClipboardList },
      { href: '/admin/results',          label: 'Results',          icon: Award },
      { href: '/admin/finance',          label: 'Finance',          icon: IndianRupee },
      { href: '/admin/finance-requests', label: 'Finance Requests', icon: Wallet },
      { href: '/admin/analytics',        label: 'Analytics',        icon: PieChart },
      { href: '/admin/defaulters',       label: 'Defaulters',       icon: AlertTriangle },
      { href: '/admin/transport',        label: 'Transport',        icon: Bus },
      { href: '/admin/id-cards',         label: 'ID Cards',         icon: IdCard },
      { href: '/admin/certificates',     label: 'Certificates',     icon: FileCheck },
      { href: '/admin/leaves',           label: 'Leave Management', icon: CalendarRange },
      { href: '/admin/calendar',         label: 'Academic Calendar',icon: Calendar },
      { href: '/admin/inquiries',        label: 'Admissions',       icon: UserPlus },
      { href: '/admin/visitors',         label: 'Visitors',         icon: UserCircle },
      { href: '/admin/reminders',        label: 'Reminders',        icon: BellRing },
    ],
  },
  {
    id: 'staff', label: 'Staff', icon: Briefcase, items: [
      { href: '/admin/staff',                label: 'Staff Directory',      icon: Users },
      { href: '/admin/teacher-assignments',  label: 'Teacher Assignments',  icon: UserPlus },
      { href: '/admin/staff-attendance',     label: 'Staff Attendance',     icon: CalendarCheck },
    ],
  },
  commsGroup,
  {
    id: 'workflow', label: 'Workflow', icon: Inbox, items: [
      { href: '/admin/approvals', label: 'Approval Center', icon: Inbox },
      { href: '/admin/audit-log', label: 'Audit Log',       icon: Activity },
    ],
  },
  {
    id: 'admin', label: 'Administration', icon: ShieldCheck, items: [
      { href: '/admin/identity', label: 'Identity & Access', icon: ShieldCheck },
    ],
  },
];

export const principalMenu: NavGroup[] = [
  {
    id: 'main', label: 'Executive', icon: Home, items: [
      { href: '/principal/dashboard', label: 'Dashboard',        icon: Home },
      { href: '/principal/profile',   label: 'My Profile',       icon: UserCircle },
    ],
  },
  {
    id: 'academic', label: 'Academic', icon: School, items: [
      { href: '/admin/students',   label: 'Students',    icon: UserCheck },
      { href: '/admin/staff',      label: 'Staff',       icon: Users },
      { href: '/admin/attendance', label: 'Attendance',  icon: CalendarCheck },
      { href: '/admin/results',    label: 'Results',     icon: Award },
      { href: '/admin/exams',      label: 'Exams',       icon: ClipboardList },
      { href: '/admin/timetable',  label: 'Timetable',   icon: CalendarRange },
      { href: '/admin/analytics',  label: 'Reports',     icon: PieChart },
    ],
  },
  {
    id: 'ops', label: 'Operations', icon: Briefcase, items: [
      { href: '/admin/approvals', label: 'Approval Center',       icon: Inbox },
      { href: '/admin/leaves',    label: 'Leave Approvals',       icon: CalendarRange },
      { href: '/admin/inquiries', label: 'Admissions',            icon: UserPlus },
      { href: '/admin/calendar',  label: 'Academic Calendar',     icon: Calendar },
      { href: '/admin/notices',   label: 'Notices',               icon: Bell },
      { href: '/admin/audit-log', label: 'Audit Log',             icon: Activity },
    ],
  },
];

export const accountantMenu: NavGroup[] = [
  {
    id: 'main', label: 'Accounts', icon: Home, items: [
      { href: '/accountant/dashboard', label: 'Dashboard',   icon: Home },
      { href: '/accountant/profile',   label: 'My Profile',  icon: UserCircle },
    ],
  },
  {
    id: 'finance', label: 'Finance', icon: IndianRupee, items: [
      { href: '/admin/finance-requests', label: 'Submit Request',  icon: Wallet },
      { href: '/admin/approvals',   label: 'Approval Center', icon: Inbox },
      { href: '/admin/finance',     label: 'Fee Collection',  icon: IndianRupee },
      { href: '/admin/finance',     label: 'Expenses',        icon: Wallet },
      { href: '/admin/finance',     label: 'Salaries',        icon: Landmark },
      { href: '/admin/finance',     label: 'Receipts',        icon: Receipt },
      { href: '/admin/defaulters',  label: 'Defaulters',      icon: AlertTriangle },
      { href: '/admin/reminders',   label: 'Reminders',       icon: BellRing },
      { href: '/admin/analytics',   label: 'Finance Reports', icon: PieChart },
    ],
  },
];

export const staffMenu: NavGroup[] = [
  {
    id: 'main', label: 'Workspace', icon: Home, items: [
      { href: '/staff/dashboard', label: 'Dashboard',   icon: Home },
      { href: '/staff/profile',   label: 'My Profile',  icon: UserCircle },
    ],
  },
  {
    id: 'ops', label: 'Front Desk', icon: Briefcase, items: [
      { href: '/admin/visitors',     label: 'Visitors',        icon: UserCircle },
      { href: '/admin/inquiries',    label: 'Admissions',      icon: UserPlus },
      { href: '/admin/transport',    label: 'Transport',       icon: Bus },
      { href: '/admin/certificates', label: 'Certificates',    icon: FileCheck },
      { href: '/admin/notices',      label: 'Notices',         icon: Bell },
      { href: '/admin/calendar',     label: 'Calendar',        icon: Calendar },
      { href: '/admin/leaves',       label: 'Leave',           icon: CalendarRange },
    ],
  },
];

export function menuForRole(role: string | null | undefined): NavGroup[] {
  switch (role) {
    case 'principal':  return principalMenu;
    case 'accountant': return accountantMenu;
    case 'staff':      return staffMenu;
    default:           return adminMenu;
  }
}
