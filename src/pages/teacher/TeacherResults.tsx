import { useMemo, useState } from 'react';
import { useTeacherCtx } from '@/contexts/TeacherContext';
import { Card, CardContent } from '@/components/ui/card';
import { ResultSetList } from '@/components/results/ResultSetList';
import { ResultSetDetail } from '@/components/results/ResultSetDetail';
import { ResultStatCards } from '@/components/results/ResultStatCards';
import { MeritListPanel } from '@/components/results/MeritListPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as api from '@/lib/results/api';
import { ensureDemoResults } from '@/lib/results/seed';
import type { ResultSet } from '@/lib/results/types';

export default function TeacherResults() {
  const ctx = useTeacherCtx() as any;
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState<ResultSet | null>(null);

  const pairs: Array<{ classId: string; section: string }> = useMemo(
    () => (ctx?.assignments ?? []).map((a: any) => ({ classId: a.classId ?? a.class_id, section: a.section ?? a.section_id })).filter((p: any) => p.classId && p.section),
    [ctx],
  );

  const sets = useMemo(() => {
    ensureDemoResults();
    const rows = pairs.length ? api.setsForClassSections(pairs, false) : api.listSets();
    return rows;
  }, [pairs, tick]);

  const stats = useMemo(() => api.statsFor(sets.filter(s => s.status === 'published')), [sets]);
  const current = open ? sets.find(s => s.id === open.id) ?? open : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold">My Class Results</h1>
        <p className="text-sm text-muted-foreground">View results for your classes, add remarks and print report cards.</p>
      </div>

      <ResultStatCards items={[
        { label: 'Result Sets', value: sets.length },
        { label: 'Students', value: stats.students },
        { label: 'Pass %', value: `${stats.passPercent}%`, tone: 'text-emerald-600' },
        { label: 'Class Average', value: `${stats.average}%` },
      ]} />

      <Tabs defaultValue="sets">
        <TabsList><TabsTrigger value="sets">Result Sets</TabsTrigger><TabsTrigger value="merit">Merit Lists</TabsTrigger></TabsList>
        <TabsContent value="sets" className="mt-3">
          {sets.length
            ? <ResultSetList sets={sets} onOpen={setOpen} onChanged={() => setTick(t => t + 1)} />
            : <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No result sets for your classes yet.</CardContent></Card>}
        </TabsContent>
        <TabsContent value="merit" className="mt-3"><MeritListPanel sets={sets.filter(s => s.status === 'published')} /></TabsContent>
      </Tabs>

      {current && (
        <ResultSetDetail set={current} open={!!open} onOpenChange={o => !o && setOpen(null)}
          onChanged={() => setTick(t => t + 1)} canRemark />
      )}
    </div>
  );
}
