import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatItem { label: string; value: number | string; hint?: string; tone?: string }

export function ResultStatCards({ items, className }: { items: StatItem[]; className?: string }) {
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
