import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { listTimetables } from '@/lib/timetable/api';
import { copyToSection, bulkReplaceTeacher, bulkReplaceRoom, bulkReplaceSubject, bulkPublish, bulkDuplicate } from '@/lib/timetable/bulkOps';

export function BulkOpsPanel({ onDone }: { onDone?: () => void }) {
  const rows = listTimetables();
  const [srcId, setSrcId] = useState(rows[0]?.id ?? '');
  const [toClass, setToClass] = useState('11');
  const [toSection, setToSection] = useState('A');
  const [tFrom, setTFrom] = useState(''); const [tTo, setTTo] = useState('');
  const [rFrom, setRFrom] = useState(''); const [rTo, setRTo] = useState('');
  const [sFrom, setSFrom] = useState(''); const [sTo, setSTo] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <Card><CardContent className="p-3 space-y-2">
        <h3 className="font-semibold text-sm">Copy Timetable</h3>
        <Label>Source</Label>
        <Select value={srcId} onValueChange={setSrcId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{rows.map(r => <SelectItem key={r.id} value={r.id}>{r.className}-{r.section} v{r.version}</SelectItem>)}</SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>To class</Label><Input value={toClass} onChange={e => setToClass(e.target.value)} /></div>
          <div><Label>To section</Label><Input value={toSection} onChange={e => setToSection(e.target.value)} /></div>
        </div>
        <Button size="sm" onClick={() => { const r = copyToSection(srcId, toClass, toSection); if (r) toast.success('Copied as draft'); onDone?.(); }}>Copy</Button>
      </CardContent></Card>

      <Card><CardContent className="p-3 space-y-2">
        <h3 className="font-semibold text-sm">Bulk Replace on Selected Source</h3>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="From teacher id" value={tFrom} onChange={e => setTFrom(e.target.value)} />
          <Input placeholder="To teacher id" value={tTo} onChange={e => setTTo(e.target.value)} />
          <Button size="sm" variant="outline" onClick={() => { if (bulkReplaceTeacher(srcId, tFrom, tTo)) toast.success('Teacher replaced'); onDone?.(); }}>Teacher</Button>
          <div />
          <Input placeholder="From room" value={rFrom} onChange={e => setRFrom(e.target.value)} />
          <Input placeholder="To room" value={rTo} onChange={e => setRTo(e.target.value)} />
          <Button size="sm" variant="outline" onClick={() => { if (bulkReplaceRoom(srcId, rFrom, rTo)) toast.success('Room replaced'); onDone?.(); }}>Room</Button>
          <div />
          <Input placeholder="From subject" value={sFrom} onChange={e => setSFrom(e.target.value)} />
          <Input placeholder="To subject" value={sTo} onChange={e => setSTo(e.target.value)} />
          <Button size="sm" variant="outline" onClick={() => { if (bulkReplaceSubject(srcId, sFrom, sTo)) toast.success('Subject replaced'); onDone?.(); }}>Subject</Button>
        </div>
      </CardContent></Card>

      <Card className="lg:col-span-2"><CardContent className="p-3 space-y-2">
        <h3 className="font-semibold text-sm">Bulk Publish / Duplicate</h3>
        <div className="max-h-56 overflow-y-auto space-y-1">
          {rows.map(r => (
            <label key={r.id} className="flex items-center gap-2 text-xs border rounded p-2 cursor-pointer">
              <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} />
              <span className="flex-1">Class {r.className}-{r.section} · v{r.version} · {r.status}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { const n = bulkPublish([...selected]); toast.success(`Published ${n}`); onDone?.(); }}>Publish selected</Button>
          <Button size="sm" variant="outline" onClick={() => { const n = bulkDuplicate([...selected]); toast.success(`Duplicated ${n}`); onDone?.(); }}>Duplicate as draft</Button>
        </div>
      </CardContent></Card>
    </div>
  );
}
