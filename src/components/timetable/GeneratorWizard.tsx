import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Wand2 } from 'lucide-react';
import { WEEKDAYS, type Weekday, type SubjectInput, type GeneratorInput, listTimetableTypes } from '@/lib/timetable/types';
import { TEMPLATES, getTemplate } from '@/lib/timetable/templates';
import { generateTimetable } from '@/lib/timetable/generator';
import { getCollection } from '@/mock/db';

interface Props {
  onGenerated: (input: GeneratorInput, periods: ReturnType<typeof generateTimetable>) => void;
}

export function GeneratorWizard({ onGenerated }: Props) {
  const teachers = getCollection<any>('teachers');
  const [templateKey, setTemplateKey] = useState('high_6day');
  const tpl = getTemplate(templateKey)?.defaults;

  const [kind, setKind] = useState('academic');
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [className, setClassName] = useState('10');
  const [section, setSection] = useState('A');
  const [workingDays, setWorkingDays] = useState<Weekday[]>(tpl?.workingDays ?? ['Mon','Tue','Wed','Thu','Fri','Sat']);
  const [startTime, setStartTime] = useState(tpl?.startTime ?? '08:00');
  const [endTime, setEndTime] = useState(tpl?.endTime ?? '14:30');
  const [periodDuration, setPeriodDuration] = useState(tpl?.periodDuration ?? 45);
  const [breakDuration, setBreakDuration] = useState(tpl?.breakDuration ?? 15);
  const [breakCount, setBreakCount] = useState(tpl?.breakCount ?? 2);

  const [subjects, setSubjects] = useState<SubjectInput[]>([
    { name: 'Mathematics', periodsPerWeek: 6, teacherId: teachers[0]?.id ?? 't_1', difficulty: 3 },
    { name: 'English',     periodsPerWeek: 5, teacherId: teachers[1]?.id ?? 't_2', difficulty: 2 },
    { name: 'Science',     periodsPerWeek: 6, teacherId: teachers[2]?.id ?? 't_3', difficulty: 3 },
    { name: 'Social',      periodsPerWeek: 4, teacherId: teachers[0]?.id ?? 't_1', difficulty: 2 },
    { name: 'Hindi',       periodsPerWeek: 4, teacherId: teachers[1]?.id ?? 't_2', difficulty: 1 },
    { name: 'PE',          periodsPerWeek: 2, teacherId: teachers[2]?.id ?? 't_3', difficulty: 1 },
  ]);

  const applyTemplate = (key: string) => {
    setTemplateKey(key);
    const d = getTemplate(key)?.defaults; if (!d) return;
    if (d.workingDays)     setWorkingDays(d.workingDays);
    if (d.startTime)       setStartTime(d.startTime);
    if (d.endTime)         setEndTime(d.endTime);
    if (d.periodDuration)  setPeriodDuration(d.periodDuration);
    if (d.breakDuration != null) setBreakDuration(d.breakDuration);
    if (d.breakCount != null)    setBreakCount(d.breakCount);
  };

  const toggleDay = (d: Weekday) =>
    setWorkingDays(cur => cur.includes(d) ? cur.filter(x => x !== d) : [...cur, d]);

  const addSubject = () => setSubjects(s => [...s, { name: '', periodsPerWeek: 3, teacherId: teachers[0]?.id ?? 't_1', difficulty: 2 }]);
  const removeSubject = (i: number) => setSubjects(s => s.filter((_, idx) => idx !== i));
  const patchSubject = (i: number, p: Partial<SubjectInput>) =>
    setSubjects(s => s.map((x, idx) => idx === i ? { ...x, ...p } : x));

  const totals = useMemo(() => subjects.reduce((sum, s) => sum + s.periodsPerWeek, 0), [subjects]);

  const handleGenerate = () => {
    const input: GeneratorInput = {
      kind, academicYear, className, section,
      workingDays: [...workingDays].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b)),
      startTime, endTime, periodDuration, breakDuration, breakCount, subjects,
      templateKey,
    };
    onGenerated(input, generateTimetable(input));
  };

  return (
    <div className="space-y-5">
      <Card><CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label>Template</Label>
          <Select value={templateKey} onValueChange={applyTemplate}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TEMPLATES.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{listTimetableTypes().map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Academic Year</Label>
          <Input value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
        </div>
        <div>
          <Label>Class</Label>
          <Input value={className} onChange={e => setClassName(e.target.value)} />
        </div>
        <div>
          <Label>Section</Label>
          <Input value={section} onChange={e => setSection(e.target.value)} />
        </div>
        <div>
          <Label>Working Days</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {WEEKDAYS.map(d => (
              <label key={d} className="flex items-center gap-1 text-xs cursor-pointer">
                <Checkbox checked={workingDays.includes(d)} onCheckedChange={() => toggleDay(d)} />
                {d}
              </label>
            ))}
          </div>
        </div>
        <div><Label>Start Time</Label><Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} /></div>
        <div><Label>End Time</Label><Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} /></div>
        <div><Label>Period (min)</Label><Input type="number" value={periodDuration} onChange={e => setPeriodDuration(+e.target.value)} /></div>
        <div><Label>Break (min)</Label><Input type="number" value={breakDuration} onChange={e => setBreakDuration(+e.target.value)} /></div>
        <div><Label># Breaks</Label><Input type="number" value={breakCount} onChange={e => setBreakCount(+e.target.value)} /></div>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Subjects</Label>
            <p className="text-xs text-muted-foreground">Total periods/week: <Badge variant="secondary">{totals}</Badge></p>
          </div>
          <Button size="sm" variant="outline" onClick={addSubject}><Plus className="h-4 w-4 mr-1" />Add</Button>
        </div>
        <div className="space-y-2">
          {subjects.map((s, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4"><Input placeholder="Subject" value={s.name} onChange={e => patchSubject(i, { name: e.target.value })} /></div>
              <div className="col-span-2"><Input type="number" min={1} value={s.periodsPerWeek} onChange={e => patchSubject(i, { periodsPerWeek: +e.target.value })} /></div>
              <div className="col-span-3">
                <Select value={s.teacherId} onValueChange={v => patchSubject(i, { teacherId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{teachers.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Select value={String(s.difficulty ?? 2)} onValueChange={v => patchSubject(i, { difficulty: +v as 1|2|3 })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Easy</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1"><Button size="icon" variant="ghost" onClick={() => removeSubject(i)}><Trash2 className="h-4 w-4" /></Button></div>
            </div>
          ))}
        </div>
      </CardContent></Card>

      <div className="flex justify-end">
        <Button onClick={handleGenerate} size="lg"><Wand2 className="h-4 w-4 mr-2" />Generate Timetable</Button>
      </div>
    </div>
  );
}
