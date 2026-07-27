import { useStudentCtx } from '@/contexts/StudentContext';
import { ResultsView } from '@/components/portal/ResultsView';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { EmptyState } from '@/components/portal/EmptyState';
import { GraduationCap } from 'lucide-react';

export default function StudentResults() {
  const { loading, student, classMap, sectionMap } = useStudentCtx();
  if (loading) return <PortalSkeleton />;
  if (!student) return <EmptyState icon={GraduationCap} title="Student record not linked" />;
  return (
    <ResultsView
      studentId={student.id}
      studentName={student.name}
      classId={student.class_id}
      sectionId={student.section_id}
      admissionNumber={student.admission_number}
      classMap={classMap}
      sectionMap={sectionMap}
    />
  );
}
