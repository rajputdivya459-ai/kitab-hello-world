import { Card } from '@/components/ui/card';
import { CheckCircle2, Clock } from 'lucide-react';

interface Props { paid: number; pending: number; }

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

export function FeeSummaryCards({ paid, pending }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="p-4 border-green-200 bg-green-50/50">
        <div className="flex items-center gap-1.5 text-green-700 text-xs font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" /> Paid
        </div>
        <p className="text-xl font-bold text-green-700 mt-1.5">{fmt(paid)}</p>
      </Card>
      <Card className={`p-4 ${pending > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-muted bg-muted/30'}`}>
        <div className={`flex items-center gap-1.5 text-xs font-medium ${pending > 0 ? 'text-amber-700' : 'text-muted-foreground'}`}>
          <Clock className="h-3.5 w-3.5" /> Pending
        </div>
        <p className={`text-xl font-bold mt-1.5 ${pending > 0 ? 'text-amber-700' : 'text-foreground'}`}>{fmt(pending)}</p>
      </Card>
    </div>
  );
}
