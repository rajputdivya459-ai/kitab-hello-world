// Lightweight audit log — persisted to LocalStorage. Every meaningful action
// (workflow submit/decide, direct writes) should push a row via logAudit().

import { getCollection, setCollection, uid } from '@/mock/db';
import { getCurrentUser } from '@/auth/mockAuth';

export interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  role: string;
  module: string;
  action: string;                // e.g. 'workflow.submit', 'result.publish'
  recordId?: string;
  before?: any;
  after?: any;
  meta?: Record<string, any>;
  ip: string;                    // mocked
  status: 'success' | 'error';
  ts: string;
}

const COL = 'audit_log';

export function logAudit(input: Omit<AuditEntry, 'id' | 'userId' | 'userName' | 'role' | 'ip' | 'status' | 'ts'> & { status?: 'success' | 'error' }): AuditEntry {
  const user = getCurrentUser();
  const entry: AuditEntry = {
    id: uid('a'),
    userId: user?.id ?? 'system',
    userName: user?.name ?? 'System',
    role: user?.role ?? 'system',
    ip: '127.0.0.1',
    status: input.status ?? 'success',
    ts: new Date().toISOString(),
    ...input,
  };
  const rows = getCollection<AuditEntry>(COL);
  rows.unshift(entry);
  // Cap to last 500 entries
  setCollection(COL, rows.slice(0, 500));
  return entry;
}

export function listAudit(filter?: { module?: string; recordId?: string; userId?: string }): AuditEntry[] {
  const rows = getCollection<AuditEntry>(COL);
  return rows.filter(r =>
    (!filter?.module || r.module === filter.module) &&
    (!filter?.recordId || r.recordId === filter.recordId) &&
    (!filter?.userId || r.userId === filter.userId)
  );
}

export function clearAudit() {
  setCollection(COL, []);
}
