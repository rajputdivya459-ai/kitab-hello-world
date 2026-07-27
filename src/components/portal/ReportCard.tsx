import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { summarize, type SubjectMark } from '@/lib/grading';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface ExamLite { id: string; name: string; exam_type: string; academic_year: string; start_date?: string | null; end_date?: string | null }
interface StudentLite {
  id: string; name: string; admission_number: string | null;
  class_id: string | null; section_id: string | null;
  date_of_birth?: string | null; parent_name?: string | null;
}

interface Props {
  student: StudentLite;
  exam: ExamLite;
  className?: string;
  sectionName?: string;
}

export function ReportCard({ student, exam, className, sectionName }: Props) {
  const { getSetting } = useSiteSettings();
  const schoolName = getSetting('site_name') || getSetting('school_name') || 'School Report Card';
  const [rows, setRows] = useState<SubjectMark[]>([]);
  const [attendancePct, setAttendancePct] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: examSubs }, { data: marks }, { data: att }] = await Promise.all([
        supabase.from('exam_subjects').select('subject_id, max_marks, passing_marks, subjects(name)').eq('exam_id', exam.id),
        supabase.from('marks').select('subject_id, marks_obtained, remarks').eq('exam_id', exam.id).eq('student_id', student.id),
        supabase.from('attendance').select('status').eq('student_id', student.id),
      ]);
      const markMap = new Map((marks ?? []).map((m: any) => [m.subject_id, m]));
      const list: SubjectMark[] = (examSubs ?? []).map((es: any) => {
        const m = markMap.get(es.subject_id);
        return {
          subject_id: es.subject_id,
          subject_name: es.subjects?.name ?? 'Subject',
          marks_obtained: Number(m?.marks_obtained ?? 0),
          max_marks: Number(es.max_marks ?? 100),
          passing_marks: Number(es.passing_marks ?? 33),
          remarks: m?.remarks ?? null,
        };
      });
      setRows(list);
      if (att && att.length) {
        const present = att.filter((a: any) => a.status === 'present' || a.status === 'half_day').length;
        setAttendancePct(Math.round((present / att.length) * 100));
      } else setAttendancePct(null);
      setLoading(false);
    })();
  }, [exam.id, student.id]);

  const summary = summarize(rows);

  const handlePrint = () => {
    const html = printRef.current?.innerHTML;
    if (!html) return;
    const w = window.open('', '_blank', 'width=900,height=1100');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Report Card - ${student.name}</title>
      <meta charset="utf-8" />
      <style>
        body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 32px; color:#0f172a; }
        h1,h2,h3 { margin: 0 0 8px; }
        table { width:100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
        th,td { border:1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
        th { background:#f1f5f9; }
        .header { display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #0f172a; padding-bottom:12px; margin-bottom:16px; }
        .meta { display:grid; grid-template-columns:1fr 1fr; gap:6px 24px; font-size:13px; margin:12px 0; }
        .summary { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-top:16px; }
        .summary div { border:1px solid #cbd5e1; border-radius:6px; padding:10px; text-align:center; }
        .summary strong { display:block; font-size:18px; }
        .grade { font-size:42px; font-weight:800; }
        .sign { margin-top:48px; display:flex; justify-content:space-between; }
        .sign div { text-align:center; border-top:1px solid #475569; padding-top:6px; width:180px; font-size:12px; }
        .fail { color:#be123c; font-weight:600; }
      </style></head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 250);
  };

  if (loading) return <div className="p-6 text-center text-sm text-muted-foreground">Loading report card…</div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 justify-end print:hidden">
        <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" />Print</Button>
        <Button size="sm" onClick={handlePrint}><Download className="h-4 w-4 mr-1" />Save PDF</Button>
      </div>
      <Card className="p-0 overflow-hidden">
        <div ref={printRef} className="p-6 bg-white text-slate-900">
          <div className="header flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold">{schoolName}</h1>
              <p className="text-sm text-slate-600">Academic Report Card · {exam.academic_year}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold">{exam.name}</p>
              <p className="text-slate-600 capitalize">{exam.exam_type.replace('_',' ')}</p>
            </div>
          </div>

          <div className="meta grid grid-cols-2 gap-y-1 gap-x-6 text-sm my-3">
            <div><span className="text-slate-500">Student:</span> <b>{student.name}</b></div>
            <div><span className="text-slate-500">Admission #:</span> <b>{student.admission_number ?? '-'}</b></div>
            <div><span className="text-slate-500">Class:</span> <b>{className ?? '-'}</b></div>
            <div><span className="text-slate-500">Section:</span> <b>{sectionName ?? '-'}</b></div>
            {student.parent_name && <div><span className="text-slate-500">Parent:</span> <b>{student.parent_name}</b></div>}
            {attendancePct !== null && <div><span className="text-slate-500">Attendance:</span> <b>{attendancePct}%</b></div>}
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2 text-left">Subject</th>
                <th className="border border-slate-300 p-2 text-center">Max</th>
                <th className="border border-slate-300 p-2 text-center">Passing</th>
                <th className="border border-slate-300 p-2 text-center">Obtained</th>
                <th className="border border-slate-300 p-2 text-center">Result</th>
                <th className="border border-slate-300 p-2 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const passed = r.marks_obtained >= r.passing_marks;
                return (
                  <tr key={r.subject_id}>
                    <td className="border border-slate-300 p-2">{r.subject_name}</td>
                    <td className="border border-slate-300 p-2 text-center">{r.max_marks}</td>
                    <td className="border border-slate-300 p-2 text-center">{r.passing_marks}</td>
                    <td className="border border-slate-300 p-2 text-center font-semibold">{r.marks_obtained}</td>
                    <td className={`border border-slate-300 p-2 text-center ${passed ? '' : 'fail text-rose-700 font-semibold'}`}>{passed ? 'Pass' : 'Fail'}</td>
                    <td className="border border-slate-300 p-2 text-slate-600">{r.remarks ?? '-'}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="border border-slate-300 p-3 text-center text-slate-500">No marks recorded.</td></tr>
              )}
            </tbody>
          </table>

          <div className="summary grid grid-cols-4 gap-3 mt-4">
            <div className="border border-slate-300 rounded p-3 text-center">
              <div className="text-xs text-slate-500">Total</div>
              <strong className="block text-lg">{summary.total} / {summary.outOf}</strong>
            </div>
            <div className="border border-slate-300 rounded p-3 text-center">
              <div className="text-xs text-slate-500">Percentage</div>
              <strong className="block text-lg">{summary.percentage}%</strong>
            </div>
            <div className="border border-slate-300 rounded p-3 text-center">
              <div className="text-xs text-slate-500">Grade</div>
              <strong className="block grade text-2xl">{summary.grade.grade}</strong>
            </div>
            <div className="border border-slate-300 rounded p-3 text-center">
              <div className="text-xs text-slate-500">Result</div>
              <strong className={`block text-lg ${summary.passed ? 'text-emerald-700' : 'text-rose-700'}`}>{summary.passed ? 'PASS' : 'FAIL'}</strong>
            </div>
          </div>

          <div className="sign mt-12 flex justify-between">
            <div className="text-center border-t border-slate-500 pt-1 w-40 text-xs">Class Teacher</div>
            <div className="text-center border-t border-slate-500 pt-1 w-40 text-xs">Examination Officer</div>
            <div className="text-center border-t border-slate-500 pt-1 w-40 text-xs">Principal</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
