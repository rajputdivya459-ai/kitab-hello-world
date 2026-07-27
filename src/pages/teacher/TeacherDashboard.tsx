import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useTeacherCtx } from '@/contexts/TeacherContext';
import { BookOpen, CalendarCheck, ClipboardList, Bell, GraduationCap } from 'lucide-react';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';

export default function TeacherDashboard() {
  const { loading, teacher, assignments, classMap, sectionMap, subjectMap } = useTeacherCtx();
  if (loading) return <PortalSkeleton />;

  const uniqueClasses = new Set(assignments.map(a => a.class_id)).size;
  const uniqueSubjects = new Set(assignments.map(a => a.subject_id).filter(Boolean)).size;

  const shortcuts = [
    { to: '/teacher/attendance', label: 'Mark Attendance', icon: CalendarCheck, color: 'bg-teal-100 text-teal-700' },
    { to: '/teacher/marks', label: 'Enter Marks', icon: ClipboardList, color: 'bg-blue-100 text-blue-700' },
    { to: '/teacher/homework', label: 'Add Homework', icon: BookOpen, color: 'bg-amber-100 text-amber-700' },
    { to: '/teacher/notices', label: 'Post Notice', icon: Bell, color: 'bg-rose-100 text-rose-700' },
  ];

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-teal-600 to-emerald-600 text-white border-0">
        <CardContent className="p-5 flex items-center gap-3">
          <div className="bg-white/20 rounded-xl p-3"><GraduationCap className="h-7 w-7" /></div>
          <div>
            <p className="text-sm opacity-90">Welcome back,</p>
            <p className="font-semibold text-lg leading-tight">{teacher?.full_name ?? 'Teacher'}</p>
            <p className="text-xs opacity-80">{teacher?.staff_code}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">My Classes</p>
          <p className="text-2xl font-bold text-teal-700">{uniqueClasses}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">My Subjects</p>
          <p className="text-2xl font-bold text-emerald-700">{uniqueSubjects}</p>
        </CardContent></Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {shortcuts.map(s => (
            <Link key={s.to} to={s.to}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col items-start gap-2">
                  <div className={`rounded-lg p-2 ${s.color}`}><s.icon className="h-5 w-5" /></div>
                  <p className="font-medium text-sm">{s.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Today’s Assignments</h2>
        <Card><CardContent className="p-3 divide-y">
          {assignments.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">No classes assigned yet.</p>}
          {assignments.map(a => (
            <div key={a.id} className="py-2.5 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{classMap[a.class_id] ?? 'Class'}{a.section_id ? ` · ${sectionMap[a.section_id]}` : ''}</p>
                <p className="text-xs text-muted-foreground">{a.subject_id ? subjectMap[a.subject_id] : 'Class teacher'}</p>
              </div>
              {a.is_class_teacher && <span className="text-[10px] uppercase font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">Class Teacher</span>}
            </div>
          ))}
        </CardContent></Card>
      </div>
    </div>
  );
}
