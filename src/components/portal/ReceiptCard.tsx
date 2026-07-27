import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Printer, MessageCircle, Receipt } from 'lucide-react';

export interface Fee { id: string; amount: number; date: string; }
export interface ReceiptStudent { name: string; admission_number: string | null; course: string; parent_phone: string | null; }

interface Props { fee: Fee; student: ReceiptStudent; }

export function ReceiptCard({ fee, student }: Props) {
  const print = () => {
    const html = `<html><head><title>Receipt</title><style>body{font-family:sans-serif;padding:40px;max-width:600px;margin:auto}h1{color:#1e3a8a}table{width:100%;border-collapse:collapse;margin-top:20px}td{padding:8px 0;border-bottom:1px solid #eee}</style></head><body><h1>Fee Receipt</h1><p>Receipt ID: ${fee.id.slice(0,8).toUpperCase()}</p><p>Date: ${new Date(fee.date).toLocaleDateString()}</p><table><tr><td><b>Student</b></td><td>${student.name}</td></tr><tr><td><b>Admission No</b></td><td>${student.admission_number ?? '-'}</td></tr><tr><td><b>Course</b></td><td>${student.course}</td></tr><tr><td><b>Amount Paid</b></td><td>₹${Number(fee.amount).toLocaleString('en-IN')}</td></tr></table><p style="margin-top:30px;color:#666;font-size:12px">This is a computer-generated receipt.</p></body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html); w.document.close(); w.focus(); w.print();
  };
  const download = () => {
    const txt = `Fee Receipt\n\nReceipt: ${fee.id.slice(0,8).toUpperCase()}\nDate: ${new Date(fee.date).toLocaleDateString()}\nStudent: ${student.name}\nAdmission No: ${student.admission_number ?? '-'}\nCourse: ${student.course}\nAmount: ₹${Number(fee.amount).toLocaleString('en-IN')}\n`;
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `receipt-${fee.id.slice(0,8)}.txt`; a.click();
    URL.revokeObjectURL(url);
  };
  const share = () => {
    const msg = `Fee Receipt%0A%0AStudent: ${student.name}%0AAdmission: ${student.admission_number ?? '-'}%0AAmount: ₹${Number(fee.amount).toLocaleString('en-IN')}%0ADate: ${new Date(fee.date).toLocaleDateString()}`;
    const phone = (student.parent_phone || '').replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Receipt className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-semibold text-base">₹{Number(fee.amount).toLocaleString('en-IN')}</p>
            <p className="text-xs text-muted-foreground">{new Date(fee.date).toLocaleDateString()}</p>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Receipt #{fee.id.slice(0,8).toUpperCase()}</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <Button size="sm" variant="outline" className="h-9" onClick={download}>
              <Download className="h-3.5 w-3.5" />
              <span className="ml-1 text-xs">Save</span>
            </Button>
            <Button size="sm" variant="outline" className="h-9" onClick={print}>
              <Printer className="h-3.5 w-3.5" />
              <span className="ml-1 text-xs">Print</span>
            </Button>
            <Button size="sm" variant="outline" className="h-9 text-green-700 border-green-200 hover:bg-green-50" onClick={share}>
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="ml-1 text-xs">Share</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
