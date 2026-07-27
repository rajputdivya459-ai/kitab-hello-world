import { Outlet } from 'react-router-dom';
import { Home, CalendarCheck, IndianRupee, Bell, Award, User } from 'lucide-react';
import { RequireRole } from '@/components/RequireRole';
import { PortalLayout } from '@/layouts/PortalLayout';
import { StudentProvider, useStudentCtx } from '@/contexts/StudentContext';

const navItems = [
  { to: '/student/dashboard', label: 'Home', icon: Home },
  { to: '/student/attendance', label: 'Attend', icon: CalendarCheck },
  { to: '/student/results', label: 'Results', icon: Award },
  { to: '/student/fees', label: 'Fees', icon: IndianRupee },
  { to: '/student/notices', label: 'Notices', icon: Bell },
  { to: '/student/profile', label: 'Me', icon: User },
];


function Inner() {
  const { student } = useStudentCtx();
  return (
    <PortalLayout
      title="Student Portal"
      subtitle={student?.name ?? 'Welcome'}
      loginPath="/student/login"
      navItems={navItems}
      accent="student"
    >
      <Outlet />
    </PortalLayout>
  );
}

export default function StudentShell() {
  return (
    <RequireRole role="student" loginPath="/student/login">
      <StudentProvider>
        <Inner />
      </StudentProvider>
    </RequireRole>
  );
}
