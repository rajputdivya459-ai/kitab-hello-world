import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Download, Printer } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { StudentIdCard, StudentIdCardData } from '@/components/admin/idcards/StudentIdCard';
import { StaffIdCard, StaffIdCardData } from '@/components/admin/idcards/StaffIdCard';
import { nodesToMultiPagePdf, nodeToPdf, printNode } from '@/lib/pdf';
import { toast } from 'sonner';

export default function AdminIdCards() {
  const { getSetting } = useSiteSettings();
  const schoolName = getSetting('college_name', 'School');
  const schoolAddress = getSetting('address', '');
  const schoolLogo = getSetting('logo_url', '');

  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [classes, setClasses] = useState<Record<string, string>>({});
  const [sections, setSections] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [selStudents, setSelStudents] = useState<Set<string>>(new Set());
  const [selStaff, setSelStaff] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const [s, st, c, sec] = await Promise.all([
        supabase.from('students').select('id,name,admission_number,class_id,section_id,parent_phone,profile_image_url').order('name'),
        supabase.from('staff').select('id,full_name,staff_code,role,phone,photo_url').eq('status', 'active').order('full_name'),
        supabase.from('classes').select('id,name'),
        supabase.from('sections').select('id,name'),
      ]);
      setStudents(s.data ?? []);
      setStaff(st.data ?? []);
      setClasses(Object.fromEntries((c.data ?? []).map((x: any) => [x.id, x.name])));
      setSections(Object.fromEntries((sec.data ?? []).map((x: any) => [x.id, x.name])));
    })();
  }, []);

  const filteredStudents = useMemo(() => students.filter(s => {
    if (classFilter !== 'all' && s.class_id !== classFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.admission_number?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [students, search, classFilter]);

  const filteredStaff = useMemo(() => staff.filter(s =>
    !search || s.full_name.toLowerCase().includes(search.toLowerCase()) || s.staff_code.toLowerCase().includes(search.toLowerCase())
  ), [staff, search]);

  const studentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const staffRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const downloadStudents = async (ids: string[]) => {
    if (ids.length === 0) return toast.error('Select at least one');
    const nodes = ids.map(id => studentRefs.current[id]).filter(Boolean) as HTMLDivElement[];
    if (nodes.length === 0) return;
    if (nodes.length === 1) await nodeToPdf(nodes[0], `student-id-${ids[0]}.pdf`);
    else await nodesToMultiPagePdf(nodes, `student-id-cards.pdf`);
    toast.success('PDF generated');
  };
  const downloadStaff = async (ids: string[]) => {
    if (ids.length === 0) return toast.error('Select at least one');
    const nodes = ids.map(id => staffRefs.current[id]).filter(Boolean) as HTMLDivElement[];
    if (nodes.length === 0) return;
    if (nodes.length === 1) await nodeToPdf(nodes[0], `staff-id-${ids[0]}.pdf`);
    else await nodesToMultiPagePdf(nodes, `staff-id-cards.pdf`);
    toast.success('PDF generated');
  };

  return (
    <AdminLayout>
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Student Cards</TabsTrigger>
          <TabsTrigger value="staff">Staff Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <Card className="p-3 flex flex-wrap items-center gap-3">
            <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {Object.entries(classes).map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setSelStudents(new Set(filteredStudents.map(s => s.id)))}>Select All</Button>
            <Button variant="outline" onClick={() => setSelStudents(new Set())}>Clear</Button>
            <Button onClick={() => downloadStudents(Array.from(selStudents))}>
              <Download className="h-4 w-4 mr-2" />Download ({selStudents.size})
            </Button>
          </Card>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
            {filteredStudents.map(s => {
              const data: StudentIdCardData = {
                name: s.name, admission_number: s.admission_number,
                className: s.class_id ? classes[s.class_id] : null,
                section: s.section_id ? sections[s.section_id] : null,
                parent_phone: s.parent_phone, photo: s.profile_image_url,
              };
              return (
                <div key={s.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selStudents.has(s.id)} onCheckedChange={(v) => {
                      const next = new Set(selStudents);
                      v ? next.add(s.id) : next.delete(s.id);
                      setSelStudents(next);
                    }} />
                    <span className="text-sm font-medium flex-1 truncate">{s.name}</span>
                    <Button size="icon" variant="ghost" onClick={() => downloadStudents([s.id])}><Download className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => studentRefs.current[s.id] && printNode(studentRefs.current[s.id]!)}><Printer className="h-4 w-4" /></Button>
                  </div>
                  <StudentIdCard ref={el => { studentRefs.current[s.id] = el; }} student={data} schoolName={schoolName} schoolAddress={schoolAddress} schoolLogo={schoolLogo} />
                </div>
              );
            })}
            {filteredStudents.length === 0 && <Card className="p-8 text-center text-muted-foreground">No students match</Card>}
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card className="p-3 flex flex-wrap items-center gap-3">
            <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setSelStaff(new Set(filteredStaff.map(s => s.id)))}>Select All</Button>
            <Button variant="outline" onClick={() => setSelStaff(new Set())}>Clear</Button>
            <Button onClick={() => downloadStaff(Array.from(selStaff))}>
              <Download className="h-4 w-4 mr-2" />Download ({selStaff.size})
            </Button>
          </Card>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
            {filteredStaff.map(s => {
              const data: StaffIdCardData = { full_name: s.full_name, staff_code: s.staff_code, role: s.role, phone: s.phone, photo_url: s.photo_url };
              return (
                <div key={s.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selStaff.has(s.id)} onCheckedChange={(v) => {
                      const next = new Set(selStaff);
                      v ? next.add(s.id) : next.delete(s.id);
                      setSelStaff(next);
                    }} />
                    <span className="text-sm font-medium flex-1 truncate">{s.full_name}</span>
                    <Button size="icon" variant="ghost" onClick={() => downloadStaff([s.id])}><Download className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => staffRefs.current[s.id] && printNode(staffRefs.current[s.id]!)}><Printer className="h-4 w-4" /></Button>
                  </div>
                  <StaffIdCard ref={el => { staffRefs.current[s.id] = el; }} staff={data} schoolName={schoolName} schoolAddress={schoolAddress} schoolLogo={schoolLogo} />
                </div>
              );
            })}
            {filteredStaff.length === 0 && <Card className="p-8 text-center text-muted-foreground">No staff match</Card>}
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
