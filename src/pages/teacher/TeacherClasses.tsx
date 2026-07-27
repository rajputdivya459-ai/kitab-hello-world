import { Card, CardContent } from '@/components/ui/card';
import { useTeacherCtx } from '@/contexts/TeacherContext';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { EmptyState } from '@/components/portal/EmptyState';
import { BookOpen } from 'lucide-react';

export default function TeacherClasses() {
  const { loading, assignments, classMap, sectionMap, subjectMap } = useTeacherCtx();
  if (loading) return <PortalSkeleton />;
  if (assignments.length === 0)
    return <EmptyState icon={BookOpen} title="No assignments" description="Your admin has not assigned any classes yet." />;

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-semibold">My Classes</h2>
      <div className="grid gap-3">
        {assignments.map(a => (
          <Card key={a.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{classMap[a.class_id]}{a.section_id ? ` · ${sectionMap[a.section_id]}` : ''}</p>
                  <p className="text-sm text-muted-foreground">{a.subject_id ? subjectMap[a.subject_id] : '—'}</p>
                </div>
                {a.is_class_teacher && (
                  <span className="text-[10px] uppercase font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded">
                    Class Teacher
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
