import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { ResultSet, ResultSetStatus } from '@/lib/results/types';

export interface ResultFilters {
  q: string;
  academicYear: string;
  examId: string;
  classId: string;
  section: string;
  status: ResultSetStatus | 'all';
  grade: string;
  promotion: string;
  rank: string;
}

export const emptyFilters: ResultFilters = {
  q: '', academicYear: 'all', examId: 'all', classId: 'all', section: 'all',
  status: 'all', grade: 'all', promotion: 'all', rank: 'all',
};

const uniq = (xs: string[]) => Array.from(new Set(xs.filter(Boolean))).sort();

/** Set-level filtering (shared by every Result Center tab). */
export function applySetFilters(sets: ResultSet[], f: ResultFilters): ResultSet[] {
  return sets.filter(s => {
    if (f.academicYear !== 'all' && s.academicYear !== f.academicYear) return false;
    if (f.examId !== 'all' && s.examId !== f.examId) return false;
    if (f.classId !== 'all' && s.classId !== f.classId) return false;
    if (f.section !== 'all' && s.section !== f.section) return false;
    if (f.status !== 'all' && s.status !== f.status) return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      const hay = `${s.examName} ${s.classId}-${s.section} ${s.academicYear}`.toLowerCase();
      if (!hay.includes(q) && !s.students.some(st => `${st.name} ${st.admissionNo} ${st.roll}`.toLowerCase().includes(q))) return false;
    }
    if (f.grade !== 'all' && !s.students.some(st => st.grade === f.grade)) return false;
    if (f.promotion !== 'all' && !s.students.some(st => st.promotion === f.promotion)) return false;
    return true;
  });
}

/** Student-level filtering inside a set. */
export function applyStudentFilters(set: ResultSet, f: ResultFilters) {
  return set.students.filter(st => {
    if (f.grade !== 'all' && st.grade !== f.grade) return false;
    if (f.promotion !== 'all' && st.promotion !== f.promotion) return false;
    if (f.rank !== 'all' && st.classRank > Number(f.rank)) return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      if (!`${st.name} ${st.admissionNo} ${st.roll}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

const Sel = ({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: Array<{ v: string; l: string }>; placeholder: string }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent>{options.map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
  </Select>
);

export function ResultFilterBar({ sets, value, onChange, compact }: {
  sets: ResultSet[]; value: ResultFilters; onChange: (f: ResultFilters) => void; compact?: boolean;
}) {
  const patch = (p: Partial<ResultFilters>) => onChange({ ...value, ...p });
  const exams = Array.from(new Map(sets.map(s => [s.examId, s.examName])).entries());
  const grades = uniq(sets.flatMap(s => s.students.map(st => st.grade)));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input value={value.q} onChange={e => patch({ q: e.target.value })} placeholder="Search exam, class or student…" className="h-9 w-full sm:w-56" />
      <Sel placeholder="Year" value={value.academicYear} onChange={v => patch({ academicYear: v })}
        options={[{ v: 'all', l: 'All years' }, ...uniq(sets.map(s => s.academicYear)).map(v => ({ v, l: v }))]} />
      <Sel placeholder="Exam" value={value.examId} onChange={v => patch({ examId: v })}
        options={[{ v: 'all', l: 'All exams' }, ...exams.map(([v, l]) => ({ v, l }))]} />
      <Sel placeholder="Class" value={value.classId} onChange={v => patch({ classId: v })}
        options={[{ v: 'all', l: 'All classes' }, ...uniq(sets.map(s => s.classId)).map(v => ({ v, l: `Class ${v}` }))]} />
      <Sel placeholder="Section" value={value.section} onChange={v => patch({ section: v })}
        options={[{ v: 'all', l: 'All sections' }, ...uniq(sets.map(s => s.section)).map(v => ({ v, l: `Sec ${v}` }))]} />
      <Sel placeholder="Status" value={value.status} onChange={v => patch({ status: v as ResultFilters['status'] })}
        options={[{ v: 'all', l: 'All statuses' }, ...['draft', 'submitted', 'approved', 'published', 'archived'].map(v => ({ v, l: v[0].toUpperCase() + v.slice(1) }))]} />
      {!compact && <>
        <Sel placeholder="Grade" value={value.grade} onChange={v => patch({ grade: v })}
          options={[{ v: 'all', l: 'All grades' }, ...grades.map(v => ({ v, l: `Grade ${v}` }))]} />
        <Sel placeholder="Promotion" value={value.promotion} onChange={v => patch({ promotion: v })}
          options={[{ v: 'all', l: 'All promotion' }, { v: 'promoted', l: 'Promoted' }, { v: 'detained', l: 'Detained' }, { v: 'pending', l: 'Pending' }]} />
        <Sel placeholder="Rank" value={value.rank} onChange={v => patch({ rank: v })}
          options={[{ v: 'all', l: 'Any rank' }, { v: '3', l: 'Top 3' }, { v: '5', l: 'Top 5' }, { v: '10', l: 'Top 10' }]} />
      </>}
    </div>
  );
}
