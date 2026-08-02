import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Award, ArrowRight } from 'lucide-react';
import * as api from '@/lib/results/api';
import { publicationQueue } from '@/lib/results/bulk';
import { ensureDemoResults } from '@/lib/results/seed';
import { StatusBadge } from './ResultSetList';

type Variant = 'admin' | 'principal' | 'teacher';

/** Compact results widget for the role dashboards. */
export function ResultDashboardWidget({ variant = 'admin', classSections }: { variant?: Variant; classSections?: Array<{ classId: string; section: string }> }) {
  const data = useMemo(() => {
    ensureDemoResults();
    const all = variant === 'teacher' && classSections?.length
      ? api.setsForClassSections(classSections, false)
      : api.listSets();
    const q = publicationQueue(all);
    const stats = api.statsFor(all.filter(s => s.status === 'published'));
    const recent = all.filter(s => s.status === 'published')
      .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')).slice(0, 4);
    const pendingRemarks = all.filter(s => s.status !== 'published' && s.students.some(st => !st.teacherRemarks?.trim())).length;
    return { all, q, stats, recent, pendingRemarks };
  }, [variant, classSections]);

  const link = variant === 'teacher' ? '/teacher/results' : '/admin/results';

  const tiles = variant === 'teacher'
    ? [
      { label: 'My Result Sets', value: data.all.length },
      { label: 'Pending Remarks', value: data.pendingRemarks },
      { label: 'Published', value: data.q.published.length },
      { label: 'Pass %', value: `${data.stats.passPercent}%` },
    ]
    : [
      { label: variant === 'principal' ? 'Approval Queue' : 'Pending Publications', value: variant === 'principal' ? data.q.pending.length : data.q.ready.length + data.q.blocked.length },
      { label: 'Published', value: data.q.published.length },
      { label: 'Pass %', value: `${data.stats.passPercent}%` },
      { label: 'Fail %', value: `${data.stats.failPercent}%` },
    ];

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4" />Results</CardTitle>
        <Button asChild size="sm" variant="ghost"><Link to={link}>Open<ArrowRight className="h-3.5 w-3.5 ml-1" /></Link></Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {tiles.map(t => (
            <div key={t.label} className="rounded-lg border p-3">
              <p className="text-[11px] text-muted-foreground">{t.label}</p>
              <p className="text-lg font-semibold tabular-nums">{t.value}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Recently published</p>
          {!data.recent.length && <p className="text-xs text-muted-foreground">Nothing published yet.</p>}
          {data.recent.map(s => (
            <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{s.examName} · {s.classId}-{s.section}</span>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline">{s.students.length}</Badge>
                <StatusBadge status={s.status} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
