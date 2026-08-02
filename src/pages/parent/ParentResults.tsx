import { useParentCtx } from '@/contexts/ParentContext';
import { ChildSwitcher } from '@/components/portal/ChildSwitcher';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { EmptyState } from '@/components/portal/EmptyState';
import { Users } from 'lucide-react';
import { StudentResultsPanel } from '@/components/results/StudentResultsPanel';
import { linkedStudentId } from '@/lib/results/portalLink';

export default function ParentResults() {
  const { loading, selected, children, selectedId, setSelectedId } = useParentCtx();
  if (loading) return <PortalSkeleton />;
  if (!selected) return <EmptyState icon={Users} title="No child linked" />;
  return (
    <div className="space-y-3">
      {children.length > 1 && <ChildSwitcher children={children} selectedId={selectedId} onSelect={setSelectedId} />}
      <StudentResultsPanel studentId={linkedStudentId(selected.id, selected.admission_number)} title={`${selected.name} — Results`} />
    </div>
  );
}
