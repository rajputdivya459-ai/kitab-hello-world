import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useParentCtx } from '@/contexts/ParentContext';
import { ReceiptCard, Fee } from '@/components/portal/ReceiptCard';
import { EmptyState } from '@/components/portal/EmptyState';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { Receipt } from 'lucide-react';

export default function ParentReceipts() {
  const { loading, selected } = useParentCtx();
  const [fees, setFees] = useState<Fee[]>([]);

  useEffect(() => {
    if (!selected) return;
    supabase.from('fees_collection').select('id,amount,date').eq('student_id', selected.id).order('date', { ascending: false })
      .then(({ data }) => setFees((data ?? []) as Fee[]));
  }, [selected?.id]);

  if (loading) return <PortalSkeleton />;
  if (!selected) return null;

  if (fees.length === 0) {
    return <EmptyState icon={Receipt} title="No receipts available" description="Receipts will appear here once payments are recorded." />;
  }

  return (
    <>
      <h3 className="font-semibold text-sm px-1">{fees.length} receipt{fees.length !== 1 ? 's' : ''}</h3>
      {fees.map(f => <ReceiptCard key={f.id} fee={f} student={selected} />)}
    </>
  );
}
