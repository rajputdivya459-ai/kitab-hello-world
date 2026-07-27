import { Outlet } from 'react-router-dom';
import { Home, BookOpen, CalendarCheck, ClipboardList, Bell, User } from 'lucide-react';
import { RequireRole } from '@/components/RequireRole';
import { PortalLayout } from '@/layouts/PortalLayout';
import { TeacherProvider, useTeacherCtx } from '@/contexts/TeacherContext';

const navItems = [
  { to: '/teacher/dashboard', label: 'Home', icon: Home },
  { to: '/teacher/classes', label: 'Classes', icon: BookOpen },
  { to: '/teacher/attendance', label: 'Attend', icon: CalendarCheck },
  { to: '/teacher/marks', label: 'Marks', icon: ClipboardList },
  { to: '/teacher/homework', label: 'HW', icon: BookOpen },
  { to: '/teacher/notices', label: 'Notice', icon: Bell },
  { to: '/teacher/profile', label: 'Me', icon: User },
];

function Inner() {
  const { teacher } = useTeacherCtx();
  return (
    <PortalLayout
      title="Teacher Portal"
      subtitle={teacher?.full_name ?? 'Welcome'}
      loginPath="/teacher/login"
      navItems={navItems}
      accent="teacher"
    >
      <Outlet />
    </PortalLayout>
  );
}

export default function TeacherShell() {
  return (
    <RequireRole role="teacher" loginPath="/teacher/login">
      <TeacherProvider>
        <Inner />
      </TeacherProvider>
    </RequireRole>
  );
}
