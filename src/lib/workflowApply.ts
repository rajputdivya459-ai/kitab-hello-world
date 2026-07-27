// Applies an approved workflow record to the mock runtime DB and fires notifications.
// Called from the Approval Center after `decide(id, 'approved')`. This is intentionally
// separate from the workflow engine — the engine only tracks state; this file translates
// approved requests into concrete side-effects.

import { getCollection, setCollection, uid } from '@/mock/db';
import { logAudit } from '@/lib/audit';
import {
  notify, notifyStudent, notifyFeePaid,
} from '@/lib/notify';
import type { WorkflowRecord } from '@/lib/workflow';

interface Ledger { id: string; ts: string; type: string; amount: number; refId?: string; meta?: any }

function pushLedger(entry: Omit<Ledger, 'id' | 'ts'>) {
  const rows = getCollection<Ledger>('finance_ledger');
  rows.unshift({ id: uid('led'), ts: new Date().toISOString(), ...entry });
  setCollection('finance_ledger', rows.slice(0, 500));
}

/** Dispatch an approved workflow to its side effects. Returns a summary string. */
export function applyApprovedWorkflow(w: WorkflowRecord): string {
  try {
    switch (w.module) {
      case 'student.change': {
        const studentId = (w.meta?.studentId as string) ?? w.recordId;
        const students = getCollection<any>('students');
        const i = students.findIndex(s => s.id === studentId);
        if (i >= 0) {
          students[i] = { ...students[i], ...(w.after ?? {}) };
          setCollection('students', students);
        }
        notifyStudent(studentId, {
          title: 'Profile updated',
          message: `Approved change: ${w.title}`,
          category: 'general',
        }).catch(() => {});
        return 'Student record updated.';
      }
      case 'finance.fee': {
        const amount = Number(w.meta?.amount ?? (w.after as any)?.amount ?? 0);
        const studentId = (w.meta?.studentId as string) ?? '';
        const receipt = `R-${Date.now().toString().slice(-6)}`;
        pushLedger({ type: 'fee', amount, refId: studentId, meta: { ...w.after, receipt } });
        if (studentId) notifyFeePaid(studentId, amount, receipt).catch(() => {});
        return `Fee ₹${amount.toLocaleString('en-IN')} recorded · Receipt ${receipt}.`;
      }
      case 'finance.expense': {
        const amount = Number(w.meta?.amount ?? (w.after as any)?.amount ?? 0);
        pushLedger({ type: 'expense', amount, meta: w.after });
        notify({ title: 'Expense approved', message: `${w.title} · ₹${amount.toLocaleString('en-IN')}`, category: 'general' }).catch(() => {});
        return `Expense ₹${amount.toLocaleString('en-IN')} recorded.`;
      }
      case 'finance.salary': {
        const staffId = (w.meta?.staffId as string) ?? w.recordId;
        const salaries = getCollection<any>('salary_structures');
        const i = salaries.findIndex(s => s.staffId === staffId);
        const next = { staffId, ...(w.after ?? {}) };
        if (i >= 0) salaries[i] = { ...salaries[i], ...next };
        else salaries.push({ id: uid('sal'), ...next });
        setCollection('salary_structures', salaries);
        const amount = Number((w.after as any)?.amount ?? 0);
        pushLedger({ type: 'salary', amount, refId: staffId, meta: w.after });
        return `Salary updated for ${staffId}.`;
      }
      case 'staff.change': {
        const staffId = (w.meta?.staffId as string) ?? w.recordId;
        const staff = getCollection<any>('staff');
        const i = staff.findIndex(s => s.id === staffId);
        if (i >= 0) { staff[i] = { ...staff[i], ...(w.after ?? {}) }; setCollection('staff', staff); }
        return `Staff ${staffId} updated.`;
      }
      default:
        return 'Approved.';
    }
  } catch (e) {
    logAudit({ module: w.module, action: 'workflow.apply.error', recordId: w.recordId, meta: { workflowId: w.id, error: String(e) }, status: 'error' });
    return 'Approved (side-effects failed).';
  }
}
