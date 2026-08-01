import { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download, QrCode } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { getConfig } from '@/lib/results/config';
import { logReportCard } from '@/lib/results/api';
import { REPORT_TEMPLATES, type ReportTemplateId, type ResultSet, type StudentResult } from '@/lib/results/types';

interface Props {
  set: ResultSet;
  student: StudentResult;
  templateId?: ReportTemplateId;
  readOnly?: boolean;
}

/**
 * Professional report card. Layout adapts to the selected template;
 * all values come from the generated result (never editable here).
 */
export function ReportCardDoc({ set, student, templateId, readOnly }: Props) {
  const { getSetting } = useSiteSettings();
  const cfg = getConfig(set.configId);
  const tpl = templateId ?? set.templateId;
  const meta = REPORT_TEMPLATES.find(t => t.id === tpl) ?? REPORT_TEMPLATES[2];
  const landscape = meta.orientation === 'landscape';
  const gradesOnly = tpl === 'primary';
  const showGpa = cfg.mode !== 'percentage';
  const showPct = cfg.mode !== 'gpa';
  const printRef = useRef<HTMLDivElement>(null);

  const schoolName = getSetting('site_name') || getSetting('school_name') || 'School';
  const logo = getSetting('logo_url') || getSetting('site_logo') || '';
  const address = getSetting('address') || getSetting('contact_address') || '';

  const handlePrint = () => {
    const html = printRef.current?.innerHTML;
    if (!html) return;
    logReportCard(set.id, student.studentId, 'downloaded');
    const w = window.open('', '_blank', 'width=1000,height=1200');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>Report Card - ${student.name}</title>
      <style>
        @page { size: A4 ${meta.orientation}; margin: 14mm; }
        body { font-family: ui-sans-serif, system-ui, sans-serif; color:#0f172a; }
        table { width:100%; border-collapse:collapse; font-size:12px; margin-top:10px; }
        th,td { border:1px solid #cbd5e1; padding:6px 8px; }
        th { background:#f1f5f9; text-align:left; }
        .muted { color:#64748b; }
        .grid4 { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-top:12px; }
        .box { border:1px solid #cbd5e1; border-radius:6px; padding:8px; text-align:center; }
        .sign { margin-top:44px; display:flex; justify-content:space-between; }
        .sign div { width:170px; text-align:center; border-top:1px solid #475569; padding-top:4px; font-size:11px; }
      </style></head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 250);
  };

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div className="flex justify-end gap-2 print:hidden">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" />Print</Button>
          <Button size="sm" onClick={handlePrint}><Download className="h-4 w-4 mr-1" />Save PDF</Button>
        </div>
      )}
      <Card className="p-0 overflow-hidden">
        <div ref={printRef} className={`p-6 bg-white text-slate-900 ${landscape ? 'text-[13px]' : 'text-sm'}`}>
          {/* header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-3">
            <div className="flex items-center gap-3">
              {logo && <img src={logo} alt={`${schoolName} logo`} className="h-14 w-14 object-contain" />}
              <div>
                <h1 className="text-xl font-bold">{schoolName}</h1>
                {address && <p className="text-xs muted text-slate-500">{address}</p>}
                <p className="text-xs text-slate-600">{meta.label} Report Card · {set.academicYear}</p>
              </div>
            </div>
            <div className="text-right text-xs">
              <p className="font-semibold text-sm">{set.examName}</p>
              <p className="text-slate-500">Card No: {student.reportCardNo}</p>
              <p className="text-slate-500">Issued: {new Date(set.publishedAt ?? set.generatedAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* student meta */}
          <div className="flex gap-4">
            <div className="h-24 w-20 shrink-0 border border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
              Student Photo
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs flex-1">
              <div><span className="text-slate-500">Name:</span> <b>{student.name}</b></div>
              <div><span className="text-slate-500">Admission No:</span> <b>{student.admissionNo}</b></div>
              <div><span className="text-slate-500">Roll No:</span> <b>{student.roll}</b></div>
              <div><span className="text-slate-500">Class / Section:</span> <b>{set.classId} - {set.section}</b></div>
              <div><span className="text-slate-500">Academic Year:</span> <b>{set.academicYear}</b></div>
              <div><span className="text-slate-500">Attendance:</span> <b>{student.attendancePct}%</b></div>
            </div>
            <div className="h-20 w-20 shrink-0 border border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-[9px] text-slate-400">
              <QrCode className="h-6 w-6 mb-1" />QR Code
            </div>
          </div>

          {/* subjects */}
          <table className="w-full border-collapse text-xs mt-3">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2 text-left">Subject</th>
                {!gradesOnly && <th className="border border-slate-300 p-2 text-center">Max</th>}
                {!gradesOnly && <th className="border border-slate-300 p-2 text-center">Obtained</th>}
                {!gradesOnly && showPct && <th className="border border-slate-300 p-2 text-center">%</th>}
                <th className="border border-slate-300 p-2 text-center">Grade</th>
                {showGpa && <th className="border border-slate-300 p-2 text-center">Grade Point</th>}
                <th className="border border-slate-300 p-2 text-center">Result</th>
              </tr>
            </thead>
            <tbody>
              {student.subjects.map(s => (
                <tr key={s.subjectName}>
                  <td className="border border-slate-300 p-2">
                    {s.subjectName}
                    {tpl !== 'primary' && s.components.length > 1 && (
                      <span className="block text-[10px] text-slate-500">
                        {s.components.map(c => `${c.label} ${c.value ?? '-'} /${c.max}`).join(' · ')}
                      </span>
                    )}
                  </td>
                  {!gradesOnly && <td className="border border-slate-300 p-2 text-center">{s.max}</td>}
                  {!gradesOnly && <td className="border border-slate-300 p-2 text-center font-semibold">{s.attendance === 'present' ? s.obtained : s.attendance.toUpperCase()}</td>}
                  {!gradesOnly && showPct && <td className="border border-slate-300 p-2 text-center">{s.percentage.toFixed(1)}</td>}
                  <td className="border border-slate-300 p-2 text-center">{s.grade}</td>
                  {showGpa && <td className="border border-slate-300 p-2 text-center">{s.gradePoint}</td>}
                  <td className={`border border-slate-300 p-2 text-center ${s.passed ? '' : 'text-rose-700 font-semibold'}`}>{s.passed ? 'Pass' : 'Fail'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* summary */}
          <div className={`grid gap-3 mt-4 ${landscape ? 'grid-cols-6' : 'grid-cols-4'}`}>
            {showPct && <Box label="Total" value={`${student.total} / ${student.outOf}`} />}
            {showPct && <Box label="Percentage" value={`${student.percentage.toFixed(2)}%`} />}
            <Box label="Grade" value={student.grade} />
            {showGpa && <Box label="GPA" value={student.gpa.toFixed(2)} />}
            <Box label="Division" value={student.division} />
            <Box label="Rank (Class)" value={`#${student.classRank}`} />
            <Box label="Result" value={student.passed ? 'PASS' : 'FAIL'} tone={student.passed ? 'text-emerald-700' : 'text-rose-700'} />
            <Box label="Promotion" value={student.promotion.toUpperCase()} />
          </div>

          {/* remarks */}
          <div className="mt-4 grid gap-2 text-xs">
            <div className="border border-slate-300 rounded p-2">
              <span className="text-slate-500">Class Teacher Remarks: </span>
              {student.teacherRemarks || '—'}
            </div>
            <div className="border border-slate-300 rounded p-2">
              <span className="text-slate-500">Principal Remarks: </span>
              {student.principalRemarks || '—'}
            </div>
          </div>

          <div className="sign mt-12 flex justify-between">
            <div className="w-40 text-center border-t border-slate-500 pt-1 text-[11px]">Class Teacher</div>
            <div className="w-40 text-center border-t border-slate-500 pt-1 text-[11px]">Examination Officer</div>
            <div className="w-40 text-center border-t border-slate-500 pt-1 text-[11px]">Principal</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Box({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="box border border-slate-300 rounded p-2 text-center">
      <div className="text-[10px] text-slate-500">{label}</div>
      <strong className={`block text-sm ${tone ?? ''}`}>{value}</strong>
    </div>
  );
}
