import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { validateSet, type ValidationReport } from '@/lib/results/validation';
import type { ResultSet } from '@/lib/results/types';

export function ValidationPanel({ sets, reports }: { sets?: ResultSet[]; reports?: ValidationReport[] }) {
  const list = reports ?? (sets ?? []).map(s => validateSet(s));
  if (!list.length) {
    return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Nothing to validate.</CardContent></Card>;
  }
  return (
    <div className="space-y-3">
      {list.map(r => (
        <Card key={r.setId}>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm flex items-center gap-2">
              {r.canPublish ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-rose-600" />}
              {r.title}
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">{r.errors} errors</Badge>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{r.warnings} warnings</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {!r.issues.length && <p className="text-sm text-muted-foreground">All validation checks passed — ready to publish.</p>}
            {r.issues.map(i => (
              <div key={i.code} className={`rounded-md border p-3 text-sm ${i.severity === 'error' ? 'border-rose-200 bg-rose-50/60' : 'border-amber-200 bg-amber-50/60'}`}>
                <p className="font-medium flex items-center gap-1.5">
                  <AlertTriangle className={`h-3.5 w-3.5 ${i.severity === 'error' ? 'text-rose-600' : 'text-amber-600'}`} />
                  {i.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{i.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
