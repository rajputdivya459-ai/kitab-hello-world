// Bulk workflow + publication operations. Thin orchestration over the existing
// results API (no duplicate business logic) with validation gating and audit trails.

import { logAudit } from '@/lib/audit';
import * as api from './api';
import { validateSet } from './validation';
import type { ResultSet, ResultSetStatus } from './types';

export interface BulkOutcome { ok: string[]; skipped: Array<{ id: string; title: string; reason: string }> }

const title = (s: ResultSet) => `${s.examName} · ${s.classId}-${s.section}`;
const empty = (): BulkOutcome => ({ ok: [], skipped: [] });

export function bulkSubmit(ids: string[]): BulkOutcome {
  const out = empty();
  ids.forEach(id => {
    const s = api.getSet(id); if (!s) return;
    if (s.status !== 'draft') return out.skipped.push({ id, title: title(s), reason: `Status is ${s.status}` });
    api.submitSet(id); out.ok.push(id);
  });
  return out;
}

export function bulkApprove(ids: string[], remarks?: string): BulkOutcome {
  const out = empty();
  ids.forEach(id => {
    const s = api.getSet(id); if (!s) return;
    if (s.status !== 'submitted') return out.skipped.push({ id, title: title(s), reason: `Status is ${s.status}` });
    api.approveSet(id, remarks); out.ok.push(id);
  });
  return out;
}

/** Publish with mandatory validation gating. */
export function bulkPublish(ids: string[]): BulkOutcome {
  const out = empty();
  ids.forEach(id => {
    const s = api.getSet(id); if (!s) return;
    if (s.status !== 'approved' && s.status !== 'published') {
      return out.skipped.push({ id, title: title(s), reason: 'Must be approved first' });
    }
    const report = validateSet(s);
    if (!report.canPublish) {
      logAudit({ module: 'results', action: 'result.publish.blocked', recordId: id, meta: { errors: report.errors } });
      return out.skipped.push({ id, title: title(s), reason: `${report.errors} validation error(s)` });
    }
    api.publishSet(id); out.ok.push(id);
  });
  return out;
}

export function bulkArchive(ids: string[]): BulkOutcome {
  const out = empty();
  ids.forEach(id => {
    const s = api.getSet(id); if (!s) return;
    if (s.status === 'archived') return out.skipped.push({ id, title: title(s), reason: 'Already archived' });
    api.archiveSet(id); out.ok.push(id);
  });
  return out;
}

/** Rollback any non-draft set back to Draft (publication rollback / unpublish). */
export function bulkRollback(ids: string[], reason = 'Rolled back to draft'): BulkOutcome {
  const out = empty();
  ids.forEach(id => {
    const s = api.getSet(id); if (!s) return;
    if (s.status === 'draft') return out.skipped.push({ id, title: title(s), reason: 'Already a draft' });
    api.saveSet({ ...s, status: 'draft', publishedAt: undefined, approvedAt: undefined, submittedAt: undefined, reviewerRemarks: reason });
    logAudit({ module: 'results', action: 'result.rollback', recordId: id, meta: { from: s.status, reason } });
    out.ok.push(id);
  });
  return out;
}

export const publishByClass = (examId: string, classId: string) =>
  bulkPublish(api.listSets().filter(s => s.examId === examId && s.classId === classId).map(s => s.id));

export const publishBySection = (examId: string, classId: string, section: string) =>
  bulkPublish(api.listSets().filter(s => s.examId === examId && s.classId === classId && s.section === section).map(s => s.id));

export const publishByExam = (examId: string) =>
  bulkPublish(api.listSets().filter(s => s.examId === examId).map(s => s.id));

// ---------------- publication queue ----------------
export interface QueueBuckets {
  pending: ResultSet[];      // draft / submitted — not yet approved
  ready: ResultSet[];        // approved and validation-clean
  blocked: ResultSet[];      // approved but validation errors
  published: ResultSet[];
  archived: ResultSet[];
}

export function publicationQueue(rows: ResultSet[] = api.listSets()): QueueBuckets {
  const inStatus = (s: ResultSetStatus[]) => rows.filter(r => s.includes(r.status));
  const approved = rows.filter(r => r.status === 'approved');
  return {
    pending: inStatus(['draft', 'submitted']),
    ready: approved.filter(r => validateSet(r).canPublish),
    blocked: approved.filter(r => !validateSet(r).canPublish),
    published: inStatus(['published']),
    archived: inStatus(['archived']),
  };
}
