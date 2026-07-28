import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ExamGeneratorInput } from '@/lib/exam/types';
import { listTimetableTypes } from '@/lib/timetable/types';

const DAYS: Array<'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'> = ['Mon','Tue','Wed','Thu','Fri','Sat'];

interface Props {
  onGenerate: (input: ExamGeneratorInput) => void;
  initial?: Partial<ExamGeneratorInput>;
}

export function ExamGeneratorWizard({ onGenerate, initial }: Props) {
  const examTypes = listTimetableTypes().filter(t => t.category === 'exam');
  const [kind, setKind] = useState(initial?.kind ?? 'quarterly');
  const [title, setTitle] = useState(initial?.title ?? 'Quarterly Examination — 2026-27');
  const [academicYear, setAcademicYear] = useState(initial?.academicYear ?? '2026-27');
  const [classes, setClasses] = useState((initial?.classes ?? ['9','10']).join(','));
  const [sections, setSections] = useState((initial?.sections ?? ['A','B']).join(','));
  const [subjects, setSubjects] = useState((initial?.subjects ?? ['Mathematics','English','Science','Social','Hindi']).join(','));
  const [startDate, setStartDate] = useState(initial?.startDate ?? new Date().toISOString().slice(0,10));
  const [endDate, setEndDate] = useState(initial?.endDate ?? new Date(Date.now() + 15 * 86400000).toISOString().slice(0,10));
  const [examDuration, setExamDuration] = useState(initial?.examDuration ?? 180);
  const [breakDuration, setBreakDuration] = useState(initial?.breakDuration ?? 30);
  const [dailyLimit, setDailyLimit] = useState(initial?.dailyLimit ?? 1);
  const [preferredStart, setPreferredStart] = useState(initial?.preferredStart ?? '09:00');
  const [holidays, setHolidays] = useState((initial?.holidays ?? []).join(','));
  const [workingDays, setWorkingDays] = useState<string[]>(initial?.workingDays ?? ['Mon','Tue','Wed','Thu','Fri','Sat']);

  const toggle = (d: string) => setWorkingDays(w => w.includes(d) ? w.filter(x => x !== d) : [...w, d]);

  const submit = () => {
    onGenerate({
      kind, title, academicYear,
      classes: classes.split(',').map(s => s.trim()).filter(Boolean),
      sections: sections.split(',').map(s => s.trim()).filter(Boolean),
      subjects: subjects.split(',').map(s => s.trim()).filter(Boolean),
      startDate, endDate,
      examDuration: Number(examDuration), breakDuration: Number(breakDuration),
      dailyLimit: Number(dailyLimit), preferredStart,
      holidays: holidays.split(',').map(s => s.trim()).filter(Boolean),
      workingDays: workingDays as any,
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Exam Generator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Examination Type</Label>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{examTypes.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Academic Year</Label><Input value={academicYear} onChange={e => setAcademicYear(e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div><Label>Classes (comma-separated)</Label><Input value={classes} onChange={e => setClasses(e.target.value)} placeholder="9,10" /></div>
          <div><Label>Sections</Label><Input value={sections} onChange={e => setSections(e.target.value)} placeholder="A,B" /></div>
          <div className="sm:col-span-2"><Label>Subjects</Label>
            <Textarea rows={2} value={subjects} onChange={e => setSubjects(e.target.value)} placeholder="Mathematics, English, Science…" />
          </div>
          <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
          <div><Label>End Date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          <div><Label>Exam Duration (min)</Label><Input type="number" value={examDuration} onChange={e => setExamDuration(Number(e.target.value))} /></div>
          <div><Label>Break (min)</Label><Input type="number" value={breakDuration} onChange={e => setBreakDuration(Number(e.target.value))} /></div>
          <div><Label>Daily Limit / class</Label><Input type="number" value={dailyLimit} onChange={e => setDailyLimit(Number(e.target.value))} /></div>
          <div><Label>Preferred Start</Label><Input type="time" value={preferredStart} onChange={e => setPreferredStart(e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>Holidays (YYYY-MM-DD, comma-separated)</Label>
            <Input value={holidays} onChange={e => setHolidays(e.target.value)} placeholder="2026-10-02" />
          </div>
          <div className="sm:col-span-2">
            <Label>Working Days</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {DAYS.map(d => (
                <button key={d} type="button" onClick={() => toggle(d)}
                  className={`px-3 py-1 rounded-md border text-xs ${workingDays.includes(d) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}>{d}</button>
              ))}
            </div>
          </div>
        </div>
        <Button onClick={submit} className="w-full">Generate Schedule</Button>
      </CardContent>
    </Card>
  );
}
