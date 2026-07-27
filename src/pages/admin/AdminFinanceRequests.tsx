import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Send, ArrowRight, Inbox, Receipt, Banknote, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import { submit, listWorkflows, type WorkflowRecord, type WorkflowModule } from '@/lib/workflow';
import { getCollection } from '@/mock/db';
import { formatDistanceToNow } from 'date-fns';
import { EmptyState } from '@/components/shared/EmptyState';

const FEE_CATEGORIES = ['Tuition', 'Transport', 'Exam', 'Library', 'Other'];
const EXPENSE_CATEGORIES = ['Office Supplies', 'Utilities', 'Maintenance', 'Salaries', 'Events', 'Other'];

export default function AdminFinanceRequests() {
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [rows, setRows] = useState<WorkflowRecord[]>([]);
  const [tab, setTab] = useState<'fee' | 'expense' | 'salary'>('fee');

  // Fee form
  const [feeStudent, setFeeStudent] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeCategory, setFeeCategory] = useState('Tuition');
  const [feeMethod, setFeeMethod] = useState('cash');
  const [feeRemarks, setFeeRemarks] = useState('');

  // Expense form
  const [expVendor, setExpVendor] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Office Supplies');
  const [expRemarks, setExpRemarks] = useState('');

  // Salary form
  const [salStaff, setSalStaff] = useState('');
  const [salAmount, setSalAmount] = useState('');
  const [salMonth, setSalMonth] = useState(new Date().toISOString().slice(0, 7));

  const load = () => {
    setStudents(getCollection<any>('students'));
    setStaff(getCollection<any>('staff'));
    setRows(listWorkflows().filter(w => w.module.startsWith('finance.')));
  };
  useEffect(load, []);

  const submitFee = () => {
    if (!feeStudent || !feeAmount) { toast.error('Student and amount required'); return; }
    const s = students.find(x => x.id === feeStudent);
    submit({
      module: 'finance.fee',
      recordId: feeStudent,
      title: `Fee — ${s?.name ?? feeStudent} · ₹${Number(feeAmount).toLocaleString('en-IN')} (${feeCategory})`,
      after: { amount: Number(feeAmount), category: feeCategory, method: feeMethod, remarks: feeRemarks },
      meta: { studentId: feeStudent, amount: Number(feeAmount) },
    });
    toast.success('Fee submitted for approval');
    setFeeAmount(''); setFeeRemarks(''); load();
  };

  const submitExpense = () => {
    if (!expVendor || !expAmount) { toast.error('Vendor and amount required'); return; }
    submit({
      module: 'finance.expense',
      recordId: `exp_${Date.now()}`,
      title: `Expense — ${expVendor} · ₹${Number(expAmount).toLocaleString('en-IN')}`,
      after: { vendor: expVendor, amount: Number(expAmount), category: expCategory, remarks: expRemarks },
      meta: { amount: Number(expAmount) },
    });
    toast.success('Expense submitted for approval');
    setExpVendor(''); setExpAmount(''); setExpRemarks(''); load();
  };

  const submitSalary = () => {
    if (!salStaff || !salAmount) { toast.error('Staff and amount required'); return; }
    const st = staff.find(x => x.id === salStaff);
    submit({
      module: 'finance.salary',
      recordId: salStaff,
      title: `Salary — ${st?.name ?? salStaff} · ${salMonth} · ₹${Number(salAmount).toLocaleString('en-IN')}`,
      after: { amount: Number(salAmount), month: salMonth },
      meta: { staffId: salStaff, amount: Number(salAmount) },
    });
    toast.success('Salary submitted for approval');
    setSalAmount(''); load();
  };

  const historyModule: WorkflowModule = tab === 'fee' ? 'finance.fee' : tab === 'expense' ? 'finance.expense' : 'finance.salary';
  const history = useMemo(() => rows.filter(r => r.module === historyModule), [rows, historyModule]);

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="h-6 w-6 text-primary" /> Finance Requests</h1>
            <p className="text-sm text-muted-foreground">Every fee, expense, and salary posts only after approval. Ledger updates automatically on approve.</p>
          </div>
          <Link to="/admin/approvals" className="text-sm text-primary hover:underline flex items-center gap-1">
            Approval Center <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <Tabs value={tab} onValueChange={v => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="fee"><Receipt className="h-4 w-4 mr-1" />Fee</TabsTrigger>
            <TabsTrigger value="expense"><Banknote className="h-4 w-4 mr-1" />Expense</TabsTrigger>
            <TabsTrigger value="salary"><Users2 className="h-4 w-4 mr-1" />Salary</TabsTrigger>
          </TabsList>

          <TabsContent value="fee" className="mt-4">
            <Card className="p-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Student</Label>
                <Select value={feeStudent} onValueChange={setFeeStudent}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} — {s.class}{s.section ? '-' + s.section : ''}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Amount (₹)</Label><Input type="number" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} /></div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={feeCategory} onValueChange={setFeeCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FEE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Method</Label>
                <Select value={feeMethod} onValueChange={setFeeMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 lg:col-span-3"><Label className="text-xs">Remarks</Label><Textarea rows={2} value={feeRemarks} onChange={e => setFeeRemarks(e.target.value)} /></div>
              <div className="md:col-span-2 lg:col-span-3 flex justify-end"><Button onClick={submitFee}><Send className="h-4 w-4 mr-1" />Submit for Approval</Button></div>
            </Card>
          </TabsContent>

          <TabsContent value="expense" className="mt-4">
            <Card className="p-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div><Label className="text-xs">Vendor / Payee</Label><Input value={expVendor} onChange={e => setExpVendor(e.target.value)} /></div>
              <div><Label className="text-xs">Amount (₹)</Label><Input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} /></div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={expCategory} onValueChange={setExpCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 lg:col-span-3"><Label className="text-xs">Remarks</Label><Textarea rows={2} value={expRemarks} onChange={e => setExpRemarks(e.target.value)} /></div>
              <div className="md:col-span-2 lg:col-span-3 flex justify-end"><Button onClick={submitExpense}><Send className="h-4 w-4 mr-1" />Submit for Approval</Button></div>
            </Card>
          </TabsContent>

          <TabsContent value="salary" className="mt-4">
            <Card className="p-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Staff</Label>
                <Select value={salStaff} onValueChange={setSalStaff}>
                  <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                  <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name} — {s.designation}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Month</Label><Input type="month" value={salMonth} onChange={e => setSalMonth(e.target.value)} /></div>
              <div><Label className="text-xs">Amount (₹)</Label><Input type="number" value={salAmount} onChange={e => setSalAmount(e.target.value)} /></div>
              <div className="md:col-span-2 lg:col-span-3 flex justify-end"><Button onClick={submitSalary}><Send className="h-4 w-4 mr-1" />Submit for Approval</Button></div>
            </Card>
          </TabsContent>
        </Tabs>

        <div>
          <h2 className="text-lg font-semibold mb-2">History — {tab}</h2>
          {history.length === 0 ? (
            <EmptyState icon={Inbox} title="No requests yet" description="Submitted requests appear here across all statuses." />
          ) : (
            <div className="space-y-2">
              {history.map(w => (
                <Card key={w.id} className="p-3 flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{w.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {w.submittedAt ? formatDistanceToNow(new Date(w.submittedAt), { addSuffix: true }) : 'draft'} · by {w.submittedBy ?? w.createdBy}
                      {w.remarks ? ' · ' + w.remarks : ''}
                    </p>
                  </div>
                  <Badge className="capitalize text-[10px]">{w.status}</Badge>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
