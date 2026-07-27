import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface Props {
  month: number; // 0-11
  year: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
}

export function AttendanceFilterBar({ month, year, onMonthChange, onYearChange }: Props) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);
  const prev = () => {
    if (month === 0) { onMonthChange(11); onYearChange(year - 1); }
    else onMonthChange(month - 1);
  };
  const next = () => {
    if (month === 11) { onMonthChange(0); onYearChange(year + 1); }
    else onMonthChange(month + 1);
  };
  return (
    <Card><CardContent className="p-3 flex flex-wrap items-center gap-2">
      <Button size="icon" variant="outline" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
      <Select value={String(month)} onValueChange={v => onMonthChange(parseInt(v))}>
        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={String(year)} onValueChange={v => onYearChange(parseInt(v))}>
        <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
        <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
      </Select>
      <Button size="icon" variant="outline" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
    </CardContent></Card>
  );
}
