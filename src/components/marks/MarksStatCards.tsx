import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MarksStats } from '@/lib/marks/api';

interface Item { label: string; value: number | string; hint?: string; tone?: string }

export function MarksStatCards({ items, className }: { items: Item[]; className?: string }) {
  return (
    <div className={cn('grid gap-3 grid-cols-2 lg:grid-cols-4', className)}>
      {items.map(i => (
        <Card key={i.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{i.label}</p>
            <p className={cn('text-2xl font-semibold tabular-nums', i.tone)}>{i.value}</p>
            {i.hint && <p className="text-[11px] text-muted-foreground">{i.hint}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function statItems(role: string | null, s: MarksStats): Item[] {
  if (role === 'teacher') {
    return [
      { label: 'Pending Marks', value: s.draft + s.returned, hint: 'Drafts + returned', tone: 'text-amber-600' },
      { label: 'Draft Sheets', value: s.draft },
      { label: 'Submitted', value: s.submitted, tone: 'text-blue-600' },
      { label: 'Returned', value: s.returned, tone: 'text-rose-600' },
    ];
  }
  if (role === 'principal') {
    return [
      { label: 'Pending Approvals', value: s.submitted, tone: 'text-blue-600' },
      { label: 'Recently Published', value: s.published, tone: 'text-emerald-600' },
      { label: 'Returned Papers', value: s.returned, tone: 'text-amber-600' },
      { label: 'Approved', value: s.approved },
    ];
  }
  return [
    { label: 'Overall Completion', value: `${s.completion}%`, hint: `${s.total} sheets`, tone: 'text-primary' },
    { label: 'Published Exams', value: s.published, tone: 'text-emerald-600' },
    { label: 'Pending Reviews', value: s.submitted, tone: 'text-blue-600' },
    { label: 'Drafts / Returned', value: s.draft + s.returned, tone: 'text-amber-600' },
  ];
}
