import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowRightLeft, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExamSchedule, ExamSlot, Room, Invigilator } from '@/lib/exam/types';

interface Props {
  schedule: ExamSchedule;
  rooms: Room[];
  invigilators: Invigilator[];
  editable?: boolean;
  onUpdateSlot?: (slotId: string, patch: Partial<ExamSlot>) => void;
  onSwapSlots?: (aId: string, bId: string) => void;
  highlightInvigilatorId?: string;
}

/**
 * Date-grouped exam schedule view with inline edit dialog for each slot.
 * Click one slot then another to swap their dates/times.
 */
export function ExamScheduleView({ schedule, rooms, invigilators, editable, onUpdateSlot, onSwapSlots, highlightInvigilatorId }: Props) {
  const roomById = useMemo(() => Object.fromEntries(rooms.map(r => [r.id, r])), [rooms]);
  const invById = useMemo(() => Object.fromEntries(invigilators.map(i => [i.id, i])), [invigilators]);
  const [swapPick, setSwapPick] = useState<string | null>(null);
  const [editing, setEditing] = useState<ExamSlot | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, ExamSlot[]>();
    [...schedule.slots]
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
      .forEach(s => { const arr = map.get(s.date) ?? []; arr.push(s); map.set(s.date, arr); });
    return [...map.entries()];
  }, [schedule.slots]);

  const handleClick = (s: ExamSlot) => {
    if (!editable) return;
    if (!swapPick) { setSwapPick(s.id); return; }
    if (swapPick === s.id) { setSwapPick(null); return; }
    onSwapSlots?.(swapPick, s.id);
    setSwapPick(null);
  };

  if (schedule.slots.length === 0) return <p className="text-sm text-muted-foreground p-4 text-center">No exam slots.</p>;

  return (
    <div className="space-y-3">
      {byDate.map(([date, slots]) => (
        <div key={date}>
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            {schedule.holidays.includes(date) && <Badge variant="destructive" className="ml-2 text-[10px]">Holiday!</Badge>}
          </p>
          <div className="grid gap-2">
            {slots.map(s => {
              const isPicked = swapPick === s.id;
              const isHi = highlightInvigilatorId && s.invigilatorIds.includes(highlightInvigilatorId);
              return (
                <Card key={s.id}
                  onClick={() => handleClick(s)}
                  className={cn('p-3 flex flex-wrap items-center gap-2 sm:gap-4 transition',
                    editable && 'cursor-pointer hover:bg-muted/40',
                    isPicked && 'ring-2 ring-primary bg-primary/5',
                    isHi && 'ring-2 ring-teal-400 bg-teal-50/50'
                  )}>
                  <div className="font-mono text-xs w-24">{s.start}–{s.end}</div>
                  <div className="flex-1 min-w-[140px]">
                    <div className="font-medium text-sm">{s.subject}</div>
                    <div className="text-[11px] text-muted-foreground">Class {s.className}-{s.section} · {s.duration} min</div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {s.roomIds.map(r => <Badge key={r} variant="outline" className="text-[10px]">Room {roomById[r]?.number ?? r}</Badge>)}
                    {s.roomIds.length === 0 && <Badge variant="destructive" className="text-[10px]">No room</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {s.invigilatorIds.map(i => <Badge key={i} variant="secondary" className="text-[10px]">{invById[i]?.name ?? i}</Badge>)}
                    {s.invigilatorIds.length === 0 && <Badge variant="destructive" className="text-[10px]">No invigilator</Badge>}
                  </div>
                  {editable && (
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditing(s); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}
      {editable && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <ArrowRightLeft className="h-3 w-3" /> Click two exams to swap their date/time.
          {swapPick && <span className="ml-2 text-primary font-medium">Selected — pick target</span>}
        </p>
      )}

      {editing && (
        <SlotEditDialog
          slot={editing}
          rooms={rooms}
          invigilators={invigilators}
          onClose={() => setEditing(null)}
          onSave={(patch) => { onUpdateSlot?.(editing.id, patch); setEditing(null); }}
        />
      )}
    </div>
  );
}

function SlotEditDialog({ slot, rooms, invigilators, onClose, onSave }: {
  slot: ExamSlot; rooms: Room[]; invigilators: Invigilator[]; onClose: () => void; onSave: (p: Partial<ExamSlot>) => void;
}) {
  const [date, setDate] = useState(slot.date);
  const [start, setStart] = useState(slot.start);
  const [end, setEnd] = useState(slot.end);
  const [subject, setSubject] = useState(slot.subject);
  const [roomId, setRoomId] = useState(slot.roomIds[0] ?? '');
  const [inv1, setInv1] = useState(slot.invigilatorIds[0] ?? '');
  const [inv2, setInv2] = useState(slot.invigilatorIds[1] ?? '');
  const [notes, setNotes] = useState(slot.notes ?? '');

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Exam Slot</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs">Date</label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          <div><label className="text-xs">Subject</label><Input value={subject} onChange={e => setSubject(e.target.value)} /></div>
          <div><label className="text-xs">Start</label><Input type="time" value={start} onChange={e => setStart(e.target.value)} /></div>
          <div><label className="text-xs">End</label><Input type="time" value={end} onChange={e => setEnd(e.target.value)} /></div>
          <div className="col-span-2"><label className="text-xs">Room</label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger><SelectValue placeholder="No room" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— none —</SelectItem>
                {rooms.map(r => <SelectItem key={r.id} value={r.id}>Room {r.number} · cap {r.capacity}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><label className="text-xs">Invigilator 1</label>
            <Select value={inv1} onValueChange={setInv1}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— none —</SelectItem>
                {invigilators.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><label className="text-xs">Invigilator 2</label>
            <Select value={inv2} onValueChange={setInv2}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— none —</SelectItem>
                {invigilators.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><label className="text-xs">Notes</label><Input value={notes} onChange={e => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({
            date, start, end, subject,
            roomIds: roomId && roomId !== '__none' ? [roomId] : [],
            invigilatorIds: [inv1, inv2].filter(v => v && v !== '__none'),
            notes,
          })}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
