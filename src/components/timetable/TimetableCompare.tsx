import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { listTimetables, duplicateAsDraft } from '@/lib/timetable/api';
import { diffTimetables, diffSummary } from '@/lib/timetable/diff';
import type { TimetableRecord } from '@/lib/timetable/types';

interface Props { defaultAId?: string; }

export function TimetableCompare({ defaultAId }: Props) {
  const rows = useMemo(() => listTimetables(), []);
  const [aId, setAId] = useState<string | undefined>(defaultAId ?? rows[0]?.id);
  const [bId, setBId] = useState<string | undefined>(rows[1]?.id ?? rows[0]?.id);
  const a = rows.find(r => r.id === aId);
  const b = rows.find(r => r.id === bId);
  const diffs = a && b ? diffTimetables(a, b) : [];
  const sum = diffSummary(diffs);
  const shown = diffs.filter(d => d.kind !== 'same');

  const label = (r?: TimetableRecord) => r ? `${r.className}-${r.section} · v${r.version} · ${r.status}` : '';

  const restore = () => {
    if (!a) return;
    const d = duplicateAsDraft(a.id);
    if (d) toast.success(`Restored as new draft v${d.version}`);
  };

  return (
    <div className="space-y-3">
      <Card><CardContent className="p-3 flex flex-wrap gap-3 items-end">
        <div className="min-w-[220px]">
          <label className="text-xs text-muted-foreground">Version A</label>
          <Select value={aId} onValueChange={setAId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{rows.map(r => <SelectItem key={r.id} value={r.id}>{label(r)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <ArrowRight className="h-4 w-4 mb-2" />
        <div className="min-w-[220px]">
          <label className="text-xs text-muted-foreground">Version B</label>
          <Select value={bId} onValueChange={setBId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{rows.map(r => <SelectItem key={r.id} value={r.id}>{label(r)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex gap-2 items-center">
          <Badge variant="secondary">+{sum.added}</Badge>
          <Badge variant="destructive">-{sum.removed}</Badge>
          <Badge>~{sum.changed}</Badge>
          {a?.status === 'archived' && (
            <Button size="sm" variant="outline" onClick={restore}><RotateCcw className="h-3 w-3 mr-1" />Restore A</Button>
          )}
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-muted/50"><tr>
            <th className="p-2 text-left">Slot</th><th className="p-2 text-left">A</th><th className="p-2 text-left">B</th><th className="p-2 text-left">Change</th>
          </tr></thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No differences.</td></tr>}
            {shown.map(d => (
              <tr key={d.key} className={
                d.kind === 'added' ? 'bg-emerald-50' :
                d.kind === 'removed' ? 'bg-rose-50' : 'bg-amber-50'
              }>
                <td className="p-2 font-mono">{d.day} {d.start}</td>
                <td className="p-2">{d.a ? `${d.a.subject ?? '—'}${d.a.teacherId ? ` · ${d.a.teacherId}` : ''}${d.a.room ? ` · ${d.a.room}` : ''}` : '—'}</td>
                <td className="p-2">{d.b ? `${d.b.subject ?? '—'}${d.b.teacherId ? ` · ${d.b.teacherId}` : ''}${d.b.room ? ` · ${d.b.room}` : ''}` : '—'}</td>
                <td className="p-2">
                  {d.kind === 'added' && <Badge variant="secondary">added</Badge>}
                  {d.kind === 'removed' && <Badge variant="destructive">removed</Badge>}
                  {d.kind === 'changed' && d.changes?.map(c => <span key={c.field} className="mr-2">{c.field}: {String(c.from)} → {String(c.to)}</span>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
