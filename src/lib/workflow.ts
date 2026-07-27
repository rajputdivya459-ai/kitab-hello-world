// Reusable localStorage-backed Workflow Engine (Phase 7.2)
// Any module can attach a workflow by calling `submit()` and later `decide()`.
// State transitions: draft -> pending -> approved | rejected. `published` is
// a terminal state modules opt into (e.g. results, homework).

import { getCollection, setCollection, uid } from '@/mock/db';
import { getCurrentUser } from '@/auth/mockAuth';
import { logAudit } from '@/lib/audit';

export type WorkflowStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'published';

export type WorkflowModule =
  | 'finance.fee' | 'finance.expense' | 'finance.salary'
  | 'student.change' | 'staff.change'
  | 'result' | 'homework' | 'leave'
  | 'other';

export interface WorkflowRecord<T = any> {
  id: string;
  module: WorkflowModule;
  recordId: string;              // module-scoped natural id
  title: string;                 // short display label
  status: WorkflowStatus;
  createdBy: string;             // user id
  submittedBy?: string;
  approvedBy?: string;
  rejectedBy?: string;
  createdAt: string;
  submittedAt?: string;
  decidedAt?: string;
  remarks?: string;
  before?: T;                    // previous snapshot (for change requests)
  after?: T;                     // proposed snapshot
  meta?: Record<string, any>;    // freeform (studentId, sectionId, amount…)
}

const COL = 'workflows';

export function listWorkflows(): WorkflowRecord[] {
  return getCollection<WorkflowRecord>(COL);
}

export function getWorkflow(id: string): WorkflowRecord | undefined {
  return listWorkflows().find(w => w.id === id);
}

export function submit<T>(input: Omit<WorkflowRecord<T>, 'id' | 'status' | 'createdAt' | 'createdBy' | 'submittedAt' | 'submittedBy'> & { status?: WorkflowStatus }): WorkflowRecord<T> {
  const user = getCurrentUser();
  const now = new Date().toISOString();
  const rec: WorkflowRecord<T> = {
    id: uid('wf'),
    status: input.status ?? 'pending',
    createdBy: user?.id ?? 'system',
    submittedBy: user?.id ?? 'system',
    createdAt: now,
    submittedAt: input.status === 'draft' ? undefined : now,
    ...input,
  } as WorkflowRecord<T>;
  const rows = listWorkflows();
  rows.unshift(rec);
  setCollection(COL, rows);
  logAudit({ module: rec.module, action: rec.status === 'draft' ? 'draft.save' : 'workflow.submit', recordId: rec.recordId, after: rec.after, meta: { workflowId: rec.id, title: rec.title } });
  return rec;
}

export function saveDraft<T>(input: Omit<Parameters<typeof submit<T>>[0], 'status'>): WorkflowRecord<T> {
  return submit<T>({ ...input, status: 'draft' });
}

export function submitDraft(id: string): WorkflowRecord | undefined {
  const rows = listWorkflows();
  const i = rows.findIndex(r => r.id === id);
  if (i < 0) return;
  const now = new Date().toISOString();
  rows[i] = { ...rows[i], status: 'pending', submittedAt: now, submittedBy: getCurrentUser()?.id ?? rows[i].submittedBy };
  setCollection(COL, rows);
  logAudit({ module: rows[i].module, action: 'workflow.submit', recordId: rows[i].recordId, meta: { workflowId: id } });
  return rows[i];
}

export function decide(id: string, decision: 'approved' | 'rejected', remarks?: string): WorkflowRecord | undefined {
  const rows = listWorkflows();
  const i = rows.findIndex(r => r.id === id);
  if (i < 0) return;
  const user = getCurrentUser();
  const now = new Date().toISOString();
  rows[i] = {
    ...rows[i],
    status: decision,
    approvedBy: decision === 'approved' ? user?.id : rows[i].approvedBy,
    rejectedBy: decision === 'rejected' ? user?.id : rows[i].rejectedBy,
    decidedAt: now,
    remarks: remarks ?? rows[i].remarks,
  };
  setCollection(COL, rows);
  logAudit({ module: rows[i].module, action: `workflow.${decision}`, recordId: rows[i].recordId, before: rows[i].before, after: rows[i].after, meta: { workflowId: id, remarks } });
  return rows[i];
}

export function publish(id: string): WorkflowRecord | undefined {
  const rows = listWorkflows();
  const i = rows.findIndex(r => r.id === id);
  if (i < 0) return;
  rows[i] = { ...rows[i], status: 'published', decidedAt: new Date().toISOString() };
  setCollection(COL, rows);
  logAudit({ module: rows[i].module, action: 'workflow.publish', recordId: rows[i].recordId, meta: { workflowId: id } });
  return rows[i];
}

export function removeWorkflow(id: string) {
  setCollection(COL, listWorkflows().filter(w => w.id !== id));
}
