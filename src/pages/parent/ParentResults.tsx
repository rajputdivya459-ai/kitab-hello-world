import { useParentCtx } from '@/contexts/ParentContext';
import { ChildSwitcher } from '@/components/portal/ChildSwitcher';
import { ResultsView } from '@/components/portal/ResultsView';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { EmptyState } from '@/components/portal/EmptyState';
import { Users } from 'lucide-react';

export default function ParentResults() {
  const { loading, selected, children, selectedId, setSelectedId, classMap, sectionMap } = useParentCtx();
  if (loading) return <PortalSkeleton />;
  if (!selected) return <EmptyState icon={Users} title="No child linked" />;
  return (
    <div className="space-y-3">
      {children.length > 1 && <ChildSwitcher children={children} selectedId={selectedId} onSelect={setSelectedId} />}
      <ResultsView
        studentId={selected.id}
        studentName={selected.name}
        classId={selected.class_id}
        sectionId={selected.section_id}
        admissionNumber={selected.admission_number}
        parentName={null}
        classMap={classMap}
        sectionMap={sectionMap}
      />
    </div>
  );
}
