import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from 'lucide-react';
import * as api from '@/lib/marks/api';
import { SHEET_STATUS_META } from '@/lib/marks/types';

/** Compact marks status widget for the role dashboards. */
export function MarksDashboardWidget({ role, teacherId, to = '/admin/marks' }: { role: string | null; teacherId?: string; to?: string }) {
  const sheets = useMemo(() => {
    const all = api.listSheets();
    return teacherId ? all.filter(s => s.teacherId === teacherId) : all;
  }, [teacherId]);
  const s = api.statsFor(sheets);

  const rows = role === 'teacher'
    ? [['Pending', s.draft + s.returned], ['Submitted', s.submitted], ['Returned', s.returned], ['Published', s.published]] as const
    : role === 'principal'
      ? [['Pending Approvals', s.submitted], ['Returned', s.returned], ['Approved', s.approved], ['Published', s.published]] as const
      : [['Completion', `${s.completion}%`], ['Pending Reviews', s.submitted], ['Published', s.published], ['Drafts', s.draft]] as const;

  const recent = sheets.slice(0, 4);

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" />Marks & Evaluation</h3>
          <Link to={to} className="text-xs text-primary hover:underline">Open</Link>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-md border p-2 text-center">
              <p className="text-lg font-semibold tabular-nums">{value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
            </div>
          ))}
        </div>
        <div className="divide-y">
          {recent.map(r => (
            <div key={r.id} className="py-1.5 flex items-center justify-between gap-2">
              <span className="text-xs truncate">{r.subjectName} · {r.classId}-{r.section} · {r.examName}</span>
              <Badge variant="outline" className={`${SHEET_STATUS_META[r.status].color} text-[10px]`}>{SHEET_STATUS_META[r.status].label}</Badge>
            </div>
          ))}
          {!recent.length && <p className="text-xs text-muted-foreground py-2">No marks sheets yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
