import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getCollection } from '@/mock/db';
import { assignSubstitute } from '@/lib/timetable/substitutes';
import type { Period } from '@/lib/timetable/types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  timetableId: string;
  period: Period;
  onDone?: () => void;
}

export function SubstituteDialog({ open, onOpenChange, timetableId, period, onDone }: Props) {
  const teachers = getCollection<any>('teachers').filter((t: any) => t.id !== period.teacherId);
  const [subId, setSubId] = useState(teachers[0]?.id ?? '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');

  const submit = () => {
    const res = assignSubstitute({ timetableId, periodId: period.id, date, substituteTeacherId: subId, reason });
    if ('error' in res) { toast.error(res.error); return; }
    toast.success('Substitute assigned & notified');
    onDone?.(); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Substitute</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{period.day} · {period.start}–{period.end} · {period.subject}</p>
          <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          <div><Label>Substitute teacher</Label>
            <Select value={subId} onValueChange={setSubId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{teachers.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Reason</Label><Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Leave, sick, etc." /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
