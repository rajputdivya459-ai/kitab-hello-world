import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getCollection } from '@/mock/db';
import { addExtra, type ExtraKind } from '@/lib/timetable/extra';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; onDone?: () => void; defaults?: { className?: string; section?: string; teacherId?: string; }; }

export function ExtraClassDialog({ open, onOpenChange, onDone, defaults }: Props) {
  const teachers = getCollection<any>('teachers');
  const [kind, setKind] = useState<ExtraKind>('revision');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState('15:00');
  const [end, setEnd] = useState('16:00');
  const [subject, setSubject] = useState('');
  const [teacherId, setTeacherId] = useState(defaults?.teacherId ?? teachers[0]?.id ?? 't_1');
  const [room, setRoom] = useState('');
  const [className, setClassName] = useState(defaults?.className ?? '10');
  const [section, setSection] = useState(defaults?.section ?? 'A');
  const [notes, setNotes] = useState('');

  const submit = () => {
    if (!subject) { toast.error('Subject is required'); return; }
    addExtra({ kind, date, start, end, subject, teacherId, room, className, section, notes });
    toast.success('Extra class scheduled');
    onDone?.(); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Schedule Extra Class</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Kind</Label>
              <Select value={kind} onValueChange={(v: any) => setKind(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['weekend', 'holiday', 'revision', 'doubt', 'coaching'].map(k => <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div><Label>Start</Label><Input type="time" value={start} onChange={e => setStart(e.target.value)} /></div>
            <div><Label>End</Label><Input type="time" value={end} onChange={e => setEnd(e.target.value)} /></div>
            <div><Label>Class</Label><Input value={className} onChange={e => setClassName(e.target.value)} /></div>
            <div><Label>Section</Label><Input value={section} onChange={e => setSection(e.target.value)} /></div>
          </div>
          <div><Label>Subject</Label><Input value={subject} onChange={e => setSubject(e.target.value)} /></div>
          <div><Label>Teacher</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{teachers.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Room</Label><Input value={room} onChange={e => setRoom(e.target.value)} /></div>
          <div><Label>Notes</Label><Input value={notes} onChange={e => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Schedule & Notify</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
