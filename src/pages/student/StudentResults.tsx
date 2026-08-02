import { useStudentCtx } from '@/contexts/StudentContext';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { EmptyState } from '@/components/portal/EmptyState';
import { GraduationCap } from 'lucide-react';
import { StudentResultsPanel } from '@/components/results/StudentResultsPanel';
import { linkedStudentId } from '@/lib/results/portalLink';

export default function StudentResults() {
  const { loading, student } = useStudentCtx();
  if (loading) return <PortalSkeleton />;
  if (!student) return <EmptyState icon={GraduationCap} title="Student record not linked" />;
  return <StudentResultsPanel studentId={linkedStudentId(student.id, student.admission_number)} title="My Results" />;
}
