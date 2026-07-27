import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStudentCtx } from '@/contexts/StudentContext';
import { FeeSummaryCards } from '@/components/portal/FeeSummaryCards';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/portal/EmptyState';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { IndianRupee } from 'lucide-react';

interface Fee { id: string; amount: number; date: string }

export default function StudentFees() {
  const { loading, student } = useStudentCtx();
  const [fees, setFees] = useState<Fee[]>([]);

  useEffect(() => {
    if (!student) return;
    supabase.from('fees_collection').select('id,amount,date').eq('student_id', student.id).order('date', { ascending: false })
      .then(({ data }) => setFees((data ?? []) as Fee[]));
  }, [student?.id]);

  if (loading) return <PortalSkeleton />;
  if (!student) return null;

  const total = Number(student.total_fees);
  const paid = Number(student.paid_fees);
  const pending = Math.max(0, total - paid);

  return (
    <>
      <FeeSummaryCards paid={paid} pending={pending} />
      <Card className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Fees</p>
        <p className="text-2xl font-bold mt-1">₹{total.toLocaleString('en-IN')}</p>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${Math.min(100, (paid / (total || 1)) * 100)}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{Math.round((paid / (total || 1)) * 100)}% paid</p>
      </Card>
      <h3 className="font-semibold text-sm px-1">Payment History</h3>
      {fees.length === 0 ? (
        <EmptyState icon={IndianRupee} title="No payments yet" />
      ) : (
        <Card className="divide-y">
          {fees.map(f => (
            <div key={f.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">₹{Number(f.amount).toLocaleString('en-IN')}</p>
                <p className="text-xs text-muted-foreground">{new Date(f.date).toLocaleDateString()}</p>
              </div>
              <span className="text-[11px] text-muted-foreground">#{f.id.slice(0,6).toUpperCase()}</span>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
