import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Download, Printer, FileCheck } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { CertificateTemplate, CertType, CertificateData } from '@/components/admin/certificates/CertificateTemplate';
import { nodeToPdf, printNode } from '@/lib/pdf';
import { toast } from 'sonner';

const TYPES: { value: CertType; label: string }[] = [
  { value: 'bonafide', label: 'Bonafide Certificate' },
  { value: 'leaving', label: 'Leaving Certificate' },
  { value: 'character', label: 'Character Certificate' },
];

export default function AdminCertificates() {
  const { getSetting } = useSiteSettings();
  const schoolName = getSetting('college_name', 'School');
  const schoolAddress = getSetting('address', '');
  const schoolLogo = getSetting('logo_url', '');
  const principalName = getSetting('principal_name', 'Principal');

  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<Record<string, string>>({});
  const [sections, setSections] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<any[]>([]);

  const [type, setType] = useState<CertType>('bonafide');
  const [studentId, setStudentId] = useState('');
  const [reason, setReason] = useState('');
  const [conduct, setConduct] = useState('Good');
  const [leavingDate, setLeavingDate] = useState(new Date().toISOString().slice(0, 10));

  const previewRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    const [s, c, sec, h] = await Promise.all([
      supabase.from('students').select('id,name,admission_number,class_id,section_id,parent_name,date_of_birth,admission_date').order('name'),
      supabase.from('classes').select('id,name'),
      supabase.from('sections').select('id,name'),
      supabase.from('certificates').select('*').order('issued_on', { ascending: false }).limit(100),
    ]);
    setStudents(s.data ?? []);
    setClasses(Object.fromEntries((c.data ?? []).map((x: any) => [x.id, x.name])));
    setSections(Object.fromEntries((sec.data ?? []).map((x: any) => [x.id, x.name])));
    setHistory(h.data ?? []);
  };
  useEffect(() => { refresh(); }, []);

  const student = students.find(s => s.id === studentId);

  const previewCert = useMemo<CertificateData>(() => ({
    type,
    certificate_number: 'PREVIEW',
    issued_on: new Date().toISOString().slice(0, 10),
    student_name: student?.name ?? '________________',
    father_name: student?.parent_name,
    admission_number: student?.admission_number,
    class: student?.class_id ? classes[student.class_id] : null,
    section: student?.section_id ? sections[student.section_id] : null,
    date_of_birth: student?.date_of_birth,
    admission_date: student?.admission_date,
    reason: reason || undefined,
    conduct,
    leaving_date: type === 'leaving' ? leavingDate : undefined,
  }), [type, student, classes, sections, reason, conduct, leavingDate]);

  const generate = async () => {
    if (!studentId) return toast.error('Select a student');
    const { data: numData, error: numErr } = await supabase.rpc('generate_certificate_number', { _type: type });
    if (numErr || !numData) return toast.error(numErr?.message ?? 'Could not generate number');
    const cert_no = numData as unknown as string;

    const dataSnapshot = { ...previewCert, certificate_number: cert_no };
    const { error } = await supabase.from('certificates').insert({
      certificate_type: type, student_id: studentId, certificate_number: cert_no,
      data: dataSnapshot as any, issued_on: new Date().toISOString().slice(0, 10), remarks: reason || null,
    } as any);
    if (error) return toast.error(error.message);

    toast.success(`Certificate ${cert_no} saved`);
    await refresh();
    // download PDF of preview with the new number
    if (previewRef.current) {
      // give React a tick to potentially update; here preview shows PREVIEW so use the historical render
      await downloadHistorical({ ...dataSnapshot, type, certificate_number: cert_no });
    }
  };

  const downloadHistorical = async (data: any) => {
    const node = historyRef.current;
    if (!node) return;
    // re-mount happens via state below — use direct render technique:
    setRender({ open: true, data });
    await new Promise(r => setTimeout(r, 150));
    if (historyRef.current) await nodeToPdf(historyRef.current, `${data.certificate_number}.pdf`, 'p');
    setRender({ open: false, data: null });
  };

  const [render, setRender] = useState<{ open: boolean; data: any | null }>({ open: false, data: null });

  return (
    <AdminLayout>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2"><FileCheck className="h-5 w-5 text-primary" /><h2 className="font-semibold">Generate Certificate</h2></div>

          <div><Label>Certificate Type</Label>
            <Select value={type} onValueChange={v => setType(v as CertType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div><Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="Search student" /></SelectTrigger>
              <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.admission_number ?? '—'})</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {(type === 'bonafide' || type === 'leaving') && (
            <div><Label>{type === 'leaving' ? 'Reason for Leaving' : 'Purpose / Reason'}</Label>
              <Input value={reason} onChange={e => setReason(e.target.value)} placeholder={type === 'leaving' ? 'e.g. Family relocation' : 'e.g. scholarship application'} />
            </div>
          )}
          {type === 'character' && (
            <div><Label>Conduct</Label>
              <Select value={conduct} onValueChange={setConduct}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Very Good">Very Good</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Satisfactory">Satisfactory</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {type === 'leaving' && (
            <div><Label>Date of Leaving</Label><Input type="date" value={leavingDate} onChange={e => setLeavingDate(e.target.value)} /></div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={generate}><Download className="h-4 w-4 mr-2" />Save & Download</Button>
            <Button variant="outline" onClick={() => previewRef.current && printNode(previewRef.current)}><Printer className="h-4 w-4 mr-2" />Print Preview</Button>
          </div>
        </Card>

        <div className="overflow-auto">
          <p className="text-xs text-muted-foreground mb-2">Live Preview</p>
          <div style={{ transform: 'scale(0.55)', transformOrigin: 'top left', width: 800 }}>
            <CertificateTemplate ref={previewRef} cert={previewCert} schoolName={schoolName} schoolAddress={schoolAddress} schoolLogo={schoolLogo} principalName={principalName} />
          </div>
        </div>
      </div>

      <Card className="p-5 mt-6">
        <h2 className="font-semibold mb-3">Certificate History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr><th className="text-left p-3">Number</th><th className="text-left p-3">Type</th><th className="text-left p-3">Student</th><th className="text-left p-3">Issued</th><th className="p-3"></th></tr></thead>
            <tbody>
              {history.map(h => {
                const s = students.find(x => x.id === h.student_id);
                return (
                  <tr key={h.id} className="border-t">
                    <td className="p-3 font-mono text-xs">{h.certificate_number}</td>
                    <td className="p-3 capitalize">{h.certificate_type}</td>
                    <td className="p-3">{s?.name ?? '—'}</td>
                    <td className="p-3">{new Date(h.issued_on).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => downloadHistorical(h.data)}>
                        <Download className="h-3 w-3 mr-1" />Re-download
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {history.length === 0 && <tr><td colSpan={5} className="text-center p-8 text-muted-foreground">No certificates issued yet</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Off-screen render area for historical PDF generation */}
      {render.open && render.data && (
        <div style={{ position: 'fixed', left: -10000, top: 0 }}>
          <CertificateTemplate ref={historyRef} cert={render.data} schoolName={schoolName} schoolAddress={schoolAddress} schoolLogo={schoolLogo} principalName={principalName} />
        </div>
      )}
    </AdminLayout>
  );
}
