import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { saveConfig, resetConfig } from '@/lib/results/config';
import { TIE_BREAKERS, REPORT_TEMPLATES, type GradeBand, type ResultConfig } from '@/lib/results/types';
import { uid } from '@/mock/db';

export function ResultConfigPanel({ config, onChange }: { config: ResultConfig; onChange: (c: ResultConfig) => void }) {
  const [cfg, setCfg] = useState<ResultConfig>(config);
  const patch = (p: Partial<ResultConfig>) => setCfg(c => ({ ...c, ...p }));

  const num = (label: string, key: keyof ResultConfig, hint?: string) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input type="number" value={Number(cfg[key] as number)} onChange={e => patch({ [key]: Number(e.target.value) } as any)} className="h-9" />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );

  const setGrade = (id: string, p: Partial<GradeBand>) =>
    patch({ grades: cfg.grades.map(g => g.id === id ? { ...g, ...p } : g) });

  const save = () => {
    const next = saveConfig({ ...cfg, grades: [...cfg.grades].sort((a, b) => b.min - a.min) });
    onChange(next);
    toast({ title: 'Result rules saved', description: 'New results will use the updated configuration.' });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => { const d = resetConfig(); setCfg(d); onChange(d); toast({ title: 'Configuration reset to defaults' }); }}>
          <RotateCcw className="h-4 w-4 mr-1" />Reset
        </Button>
        <Button size="sm" onClick={save}><Save className="h-4 w-4 mr-1" />Save Configuration</Button>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Result Mode & Scales</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">Result Mode</Label>
            <Select value={cfg.mode} onValueChange={(v: any) => patch({ mode: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage Only</SelectItem>
                <SelectItem value="gpa">GPA Only</SelectItem>
                <SelectItem value="both">Percentage + GPA</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">GPA / CGPA Scale</Label>
            <Select value={cfg.gpaScaleId} onValueChange={v => patch({ gpaScaleId: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {cfg.gpaScales.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Custom Scale Max</Label>
            <Input
              type="number" className="h-9"
              value={cfg.gpaScales.find(s => s.id === cfg.gpaScaleId)?.max ?? 0}
              onChange={e => patch({ gpaScales: cfg.gpaScales.map(s => s.id === cfg.gpaScaleId ? { ...s, max: Number(e.target.value) } : s) })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Default Report Card Template</Label>
            <Select value={cfg.defaultTemplate} onValueChange={(v: any) => patch({ defaultTemplate: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REPORT_TEMPLATES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Pass, Grace, Division & Promotion Rules</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">Subject Pass Rule</Label>
            <Select value={cfg.subjectPassRule} onValueChange={(v: any) => patch({ subjectPassRule: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="each_subject">Must pass every subject</SelectItem>
                <SelectItem value="aggregate_only">Aggregate only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {num('Subject Passing %', 'subjectPassPercent')}
          {num('Overall Pass %', 'overallPassPercent')}
          {num('Grace Marks', 'graceMarks', 'Max grace per subject')}
          {num('Grace Subject Limit', 'graceMaxSubjects')}
          {num('Distinction %', 'distinctionPercent')}
          {num('First Division %', 'firstDivisionPercent')}
          {num('Second Division %', 'secondDivisionPercent')}
          {num('Third Division %', 'thirdDivisionPercent')}
          {num('Promotion Min %', 'promotionMinPercent')}
          {num('Max Failed Subjects for Promotion', 'promotionMaxFailedSubjects')}
          {num('Merit List Size', 'meritTopN')}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Tie-Breaking Rules</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {TIE_BREAKERS.map(t => {
              const i = cfg.tieBreakers.indexOf(t.id);
              return (
                <Badge
                  key={t.id}
                  variant={i >= 0 ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => patch({ tieBreakers: i >= 0 ? cfg.tieBreakers.filter(x => x !== t.id) : [...cfg.tieBreakers, t.id] })}
                >
                  {i >= 0 ? `${i + 1}. ` : ''}{t.label}
                </Badge>
              );
            })}
          </div>
          <div className="space-y-1 max-w-md">
            <Label className="text-xs">Priority Subjects (comma separated)</Label>
            <Input
              className="h-9"
              value={cfg.prioritySubjects.join(', ')}
              onChange={e => patch({ prioritySubjects: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm">Grade Master</CardTitle>
          <Button size="sm" variant="outline" onClick={() => patch({ grades: [...cfg.grades, { id: uid('g'), grade: 'New', min: 0, max: 0, point: 0, remarks: '' }] })}>
            <Plus className="h-4 w-4 mr-1" />Add Grade
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead><TableHead>Min %</TableHead><TableHead>Max %</TableHead>
                  <TableHead>Grade Point (of 10)</TableHead><TableHead>Remarks</TableHead><TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cfg.grades.map(g => (
                  <TableRow key={g.id}>
                    <TableCell><Input className="h-8 w-20" value={g.grade} onChange={e => setGrade(g.id, { grade: e.target.value })} /></TableCell>
                    <TableCell><Input className="h-8 w-20" type="number" value={g.min} onChange={e => setGrade(g.id, { min: Number(e.target.value) })} /></TableCell>
                    <TableCell><Input className="h-8 w-20" type="number" value={g.max} onChange={e => setGrade(g.id, { max: Number(e.target.value) })} /></TableCell>
                    <TableCell><Input className="h-8 w-20" type="number" step="0.1" value={g.point} onChange={e => setGrade(g.id, { point: Number(e.target.value) })} /></TableCell>
                    <TableCell><Input className="h-8" value={g.remarks} onChange={e => setGrade(g.id, { remarks: e.target.value })} /></TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => patch({ grades: cfg.grades.filter(x => x.id !== g.id) })}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
