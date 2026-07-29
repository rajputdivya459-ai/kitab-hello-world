import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getCollection } from '@/mock/db';
import { WEEKDAYS, type TimetableRecord, type Weekday } from '@/lib/timetable/types';

interface Room { id: string; number: string; capacity: number; block?: string; floor?: string; available: boolean; }

export function RoomView() {
  const rooms = useMemo(() => getCollection<Room>('rooms'), []);
  const tables = useMemo(() => getCollection<TimetableRecord>('timetables').filter(t => t.status === 'published'), []);
  const exams = useMemo(() => getCollection<any>('exam_schedules').filter(e => e.status === 'published'), []);
  const [block, setBlock] = useState('all');
  const [search, setSearch] = useState('');

  const blocks = Array.from(new Set(rooms.map(r => r.block ?? '—')));
  const shown = rooms.filter(r =>
    (block === 'all' || r.block === block) &&
    (!search || r.number.toLowerCase().includes(search.toLowerCase()))
  );

  const usageForRoom = (rn: string) => {
    const perDay: Record<Weekday, Array<{ start: string; end: string; subject: string; class: string }>> = {} as any;
    WEEKDAYS.forEach(d => (perDay[d] = []));
    tables.forEach(t => t.periods.forEach(p => {
      if (p.kind === 'class' && p.room === rn) {
        perDay[p.day].push({ start: p.start, end: p.end, subject: p.subject ?? '—', class: `${t.className}-${t.section}` });
      }
    }));
    Object.values(perDay).forEach(list => list.sort((a, b) => a.start.localeCompare(b.start)));
    const total = WEEKDAYS.reduce((n, d) => n + perDay[d].length, 0);
    const examUse = exams.reduce((n, e) => n + (e.slots ?? []).filter((s: any) => (s.roomIds ?? []).some((rid: string) => rn.includes(rid) || rid.includes(rn))).length, 0);
    return { perDay, total, examUse };
  };

  return (
    <div className="space-y-3">
      <Card><CardContent className="p-3 flex flex-wrap gap-2">
        <Input placeholder="Search room…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={block} onValueChange={setBlock}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All blocks</SelectItem>
            {blocks.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardContent></Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {shown.length === 0 && <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No rooms found.</CardContent></Card>}
        {shown.map(r => {
          const u = usageForRoom(r.number);
          const pct = Math.min(100, Math.round((u.total / 40) * 100));
          return (
            <Card key={r.id}><CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Room {r.number}</h4>
                  <p className="text-xs text-muted-foreground">Block {r.block ?? '—'} · Cap {r.capacity}</p>
                </div>
                <div className="text-right">
                  <Badge variant={r.available ? 'secondary' : 'destructive'}>{r.available ? 'Available' : 'Blocked'}</Badge>
                  <p className="text-[10px] mt-1">{u.total} classes · {u.examUse} exam slots</p>
                </div>
              </div>
              <div className="h-2 rounded bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <div className="grid grid-cols-7 gap-1 text-[9px]">
                {WEEKDAYS.map(d => (
                  <div key={d} className="border rounded p-1 min-h-[60px]">
                    <p className="font-medium mb-0.5">{d}</p>
                    {u.perDay[d].slice(0, 4).map((it, i) => (
                      <p key={i} className="truncate text-muted-foreground">{it.start} {it.class}</p>
                    ))}
                    {u.perDay[d].length === 0 && <p className="text-muted-foreground/50">free</p>}
                  </div>
                ))}
              </div>
            </CardContent></Card>
          );
        })}
      </div>
    </div>
  );
}
