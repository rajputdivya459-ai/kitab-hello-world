import { useMemo, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Wand2, RefreshCw } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { can } from '@/lib/permissions';
import * as api from '@/lib/results/api';
import { getConfig, saveConfig, setActiveConfig, listConfigs } from '@/lib/results/config';
import { ensureDemoResults } from '@/lib/results/seed';
import { ResultStatCards } from '@/components/results/ResultStatCards';
import { ResultAnalyticsPanel } from '@/components/results/ResultAnalyticsPanel';
import { ResultSetList } from '@/components/results/ResultSetList';
import { ResultSetDetail } from '@/components/results/ResultSetDetail';
import { ResultFilterBar, applySetFilters, emptyFilters, type ResultFilters } from '@/components/results/ResultFilterBar';
import { PublicationQueue } from '@/components/results/PublicationQueue';
import { ValidationPanel } from '@/components/results/ValidationPanel';
import { DownloadCenter } from '@/components/results/DownloadCenter';
import { ResultHistoryPanel } from '@/components/results/ResultHistoryPanel';
import { MeritListPanel } from '@/components/results/MeritListPanel';
import { ProgressReport } from '@/components/results/ProgressReport';
import { ResultConfigPanel } from '@/components/results/ResultConfigPanel';
import { ReportCardDoc } from '@/components/results/ReportCardDoc';
import type { ResultSet } from '@/lib/results/types';

export default function AdminResults() {
  const { role } = useRole();
  const canApprove = can(role as any, 'results.write');
  const canPublish = can(role as any, 'results.write');

  const [tick, setTick] = useState(0);
  const [filters, setFilters] = useState<ResultFilters>(emptyFilters);
  const [openSet, setOpenSet] = useState<ResultSet | null>(null);
  const [cfg, setCfg] = useState(() => { ensureDemoResults(); return getConfig(); });

  const refresh = () => setTick(t => t + 1);

  const all = useMemo(() => api.listSets(), [tick]);
  const sets = useMemo(() => applySetFilters(all, filters), [all, filters]);
  const counts = useMemo(() => api.setCounts(all), [all]);
  const stats = useMemo(() => api.statsFor(sets), [sets]);
  const targets = useMemo(() => api.generatableTargets(), [tick]);
  const published = useMemo(() => sets.filter(s => s.status === 'published'), [sets]);

  const current = openSet ? all.find(s => s.id === openSet.id) ?? openSet : null;

  // Report Card tab state
  const [cardSetId, setCardSetId] = useState('');
  const [cardStudentId, setCardStudentId] = useState('');
  const cardSet = all.find(s => s.id === cardSetId);
  const cardStudent = cardSet?.students.find(s => s.studentId === cardStudentId);

  // Progress tab state
  const [progressId, setProgressId] = useState('');
  const progressOptions = useMemo(() => {
    const m = new Map<string, string>();
    published.forEach(s => s.students.forEach(st => m.set(st.studentId, `${st.name} · ${s.classId}-${s.section}`)));
    return [...m.entries()];
  }, [published]);

  const generate = (t: typeof targets[number]) => {
    const r = api.generateResults(t);
    if ('error' in r) return toast({ title: 'Generation failed', description: r.error, variant: 'destructive' });
    toast({ title: `Generated ${r.students.length} results`, description: `${r.examName} · ${r.classId}-${r.section}` });
    refresh();
  };

  const generateAll = (examId: string) => {
    const r = api.generateForExam(examId);
    toast({ title: `${r.created} result set(s) generated`, description: r.errors.join(' · ') || undefined });
    refresh();
  };

  const examGroups = Array.from(new Map(targets.map(t => [t.examId, t.examName])).entries());

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-xl font-semibold">Result Center</h1>
            <p className="text-sm text-muted-foreground">Generate, approve, publish and distribute results end to end.</p>
          </div>
          <div className="flex gap-2">
            {counts.submitted > 0 && <Badge variant="outline">{counts.submitted} awaiting approval</Badge>}
            {counts.approved > 0 && <Badge variant="outline">{counts.approved} ready to publish</Badge>}
            <Button size="sm" variant="outline" onClick={refresh}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
          </div>
        </div>

        <ResultStatCards items={[
          { label: 'Result Sets', value: counts.total, hint: `${counts.draft} draft · ${counts.archived} archived` },
          { label: 'Students Evaluated', value: stats.students, hint: `${stats.distinction} with distinction` },
          { label: 'Pass %', value: `${stats.passPercent}%`, tone: 'text-emerald-600', hint: `${stats.passed} passed` },
          { label: 'Fail %', value: `${stats.failPercent}%`, tone: 'text-rose-600', hint: `${stats.failed} failed` },
        ]} />

        <Card><CardContent className="p-3"><ResultFilterBar sets={all} value={filters} onChange={setFilters} /></CardContent></Card>

        <Tabs defaultValue="dashboard">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="cards">Report Cards</TabsTrigger>
            <TabsTrigger value="merit">Merit Lists</TabsTrigger>
            <TabsTrigger value="progress">Progress Reports</TabsTrigger>
            <TabsTrigger value="grades">Grade Configuration</TabsTrigger>
            <TabsTrigger value="rules">Result Rules</TabsTrigger>
            <TabsTrigger value="queue">Publication Queue</TabsTrigger>
            <TabsTrigger value="downloads">Downloads</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-3 space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wand2 className="h-4 w-4" />Generate from approved marks</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {!targets.length && <p className="text-sm text-muted-foreground">No approved marks sheets available yet.</p>}
                {examGroups.map(([examId, examName]) => (
                  <div key={examId} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{examName}</p>
                      <Button size="sm" variant="outline" onClick={() => generateAll(examId)}>Generate all sections</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {targets.filter(t => t.examId === examId).map(t => (
                        <Button key={`${t.classId}-${t.section}`} size="sm" variant="ghost" className="border" onClick={() => generate(t)}>
                          {t.classId}-{t.section} · {t.subjects} subjects
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <ResultAnalyticsPanel stats={stats} />
            <ValidationPanel sets={sets.filter(s => s.status === 'submitted' || s.status === 'approved')} />
          </TabsContent>

          <TabsContent value="results" className="mt-3">
            <ResultSetList sets={sets} onOpen={s => setOpenSet(s)} onChanged={refresh} canApprove={canApprove} canPublish={canPublish} />
          </TabsContent>

          <TabsContent value="cards" className="mt-3 space-y-3">
            <Card><CardContent className="p-3 flex flex-wrap gap-2">
              <Select value={cardSetId} onValueChange={v => { setCardSetId(v); setCardStudentId(''); }}>
                <SelectTrigger className="h-9 w-full sm:w-[320px]"><SelectValue placeholder="Result set" /></SelectTrigger>
                <SelectContent>{sets.map(s => <SelectItem key={s.id} value={s.id}>{s.examName} · {s.classId}-{s.section}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={cardStudentId} onValueChange={setCardStudentId}>
                <SelectTrigger className="h-9 w-full sm:w-[260px]"><SelectValue placeholder="Student" /></SelectTrigger>
                <SelectContent>{(cardSet?.students ?? []).map(s => <SelectItem key={s.studentId} value={s.studentId}>{s.roll} · {s.name}</SelectItem>)}</SelectContent>
              </Select>
            </CardContent></Card>
            {cardSet && cardStudent
              ? <ReportCardDoc set={cardSet} student={cardStudent} />
              : <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Select a result set and student to preview the report card.</CardContent></Card>}
          </TabsContent>

          <TabsContent value="merit" className="mt-3"><MeritListPanel sets={sets} topN={cfg.meritTopN} /></TabsContent>

          <TabsContent value="progress" className="mt-3 space-y-3">
            <Card><CardContent className="p-3">
              <Select value={progressId} onValueChange={setProgressId}>
                <SelectTrigger className="h-9 w-full sm:w-[320px]"><SelectValue placeholder="Select a student" /></SelectTrigger>
                <SelectContent>{progressOptions.map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </CardContent></Card>
            {progressId
              ? <ProgressReport studentId={progressId} />
              : <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Select a student to view their progress report.</CardContent></Card>}
          </TabsContent>

          <TabsContent value="grades" className="mt-3 space-y-3">
            <Card><CardContent className="p-3 flex flex-wrap items-center gap-2">
              <Select value={cfg.id} onValueChange={v => { setActiveConfig(v); setCfg(getConfig(v)); }}>
                <SelectTrigger className="h-9 w-[260px]"><SelectValue /></SelectTrigger>
                <SelectContent>{listConfigs().map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Active grade master and GPA scale used by every generated result.</p>
            </CardContent></Card>
            <ResultConfigPanel config={cfg} onChange={c => { setCfg(c); saveConfig(c); refresh(); }} />
          </TabsContent>

          <TabsContent value="rules" className="mt-3">
            <ResultConfigPanel config={cfg} onChange={c => { setCfg(c); saveConfig(c); refresh(); }} />
          </TabsContent>

          <TabsContent value="queue" className="mt-3"><PublicationQueue sets={sets} onChanged={refresh} canPublish={canPublish} /></TabsContent>
          <TabsContent value="downloads" className="mt-3"><DownloadCenter sets={sets} /></TabsContent>
          <TabsContent value="history" className="mt-3"><ResultHistoryPanel /></TabsContent>
        </Tabs>

        {current && (
          <ResultSetDetail
            set={current} open={!!openSet} onOpenChange={o => !o && setOpenSet(null)} onChanged={refresh}
            canApprove={canApprove} canPublish={canPublish} canRemark
          />
        )}
      </div>
    </AdminLayout>
  );
}
