# WORKFLOW ENGINE

File: `src/lib/workflow.ts` · Side effects: `src/lib/workflowApply.ts` ·
UI: `src/pages/admin/AdminApprovals.tsx`

A reusable, module-agnostic approval engine. Any feature attaches to it by calling
`saveDraft()`/`submit()`; the Approval Center calls `decide()`. The engine only owns
**state** — it never mutates domain data itself.

## Storage

LocalStorage collection `erp.mock.workflows` via `src/mock/db.ts`. New records are
unshifted (newest first). Migration to a Postgres `workflows` table is Phase 7.4.

## Record shape

```ts
interface WorkflowRecord<T = any> {
  id: string;                 // uid('wf')
  module: WorkflowModule;
  recordId: string;           // module-scoped natural id
  title: string;              // short display label
  status: WorkflowStatus;
  createdBy: string;          // user id
  submittedBy?: string;
  approvedBy?: string;
  rejectedBy?: string;
  createdAt: string;
  submittedAt?: string;
  decidedAt?: string;
  remarks?: string;
  before?: T;                 // previous snapshot (change requests)
  after?: T;                  // proposed snapshot
  meta?: Record<string, any>; // studentId, sectionId, amount…
}
```

## Statuses

`draft` · `pending` · `approved` · `rejected` · `published`

```text
        saveDraft()            submit()
  ── draft ─────────► draft ──submitDraft()──► pending
                                   │
                       decide('approved')   decide('rejected')
                                   ▼               ▼
                               approved         rejected
                                   │
                              publish()  (opt-in: result, homework)
                                   ▼
                               published
```

- `draft` — visible only to its creator; editable.
- `pending` — awaiting a decision; appears in the Approval Center.
- `approved` — decision recorded; `applyApprovedWorkflow()` runs the side effect.
- `rejected` — terminal; remarks explain why.
- `published` — terminal opt-in state for modules where approval and visibility are
  separate steps (results, homework).

## Modules

`finance.fee` · `finance.expense` · `finance.salary` · `student.change` ·
`staff.change` · `result` · `homework` · `leave` · `other`

## API

| Function | Behaviour |
|---|---|
| `listWorkflows()` | all records, newest first |
| `getWorkflow(id)` | single record |
| `submit(input)` | create with `status: 'pending'` (or the status supplied); stamps `createdBy`/`submittedBy` from the current mock user and `submittedAt` |
| `saveDraft(input)` | `submit({...input, status:'draft'})`; no `submittedAt` |
| `submitDraft(id)` | draft → pending, stamps `submittedAt`/`submittedBy` |
| `decide(id, 'approved'\|'rejected', remarks?)` | sets status, `approvedBy`/`rejectedBy`, `decidedAt`, `remarks` |
| `publish(id)` | → `published`, refreshes `decidedAt` |
| `removeWorkflow(id)` | hard delete |

Every mutation writes an audit entry: `draft.save`, `workflow.submit`,
`workflow.approved`, `workflow.rejected`, `workflow.publish`.

## Side effects — `workflowApply.ts`

`applyApprovedWorkflow(record)` is invoked by the Approval Center **after** a successful
approval. It maps module → effect:

| Module | Effect |
|---|---|
| `finance.fee` | append fee entry to the mock `finance_ledger`, generate receipt reference, fire `notifyFeePaid` |
| `finance.expense` | append expense entry to the ledger |
| `finance.salary` | append salary entry, update the staff salary record |
| `student.change` | write `after` values onto the student record, notify the student/parent |
| `staff.change` | write `after` values onto the staff record |
| `result` | mark the result set publishable, fire `notifyResultPublished` |
| `homework` | publish the homework, fire `notifyHomeworkAssigned` |
| `leave` | set the leave status, notify the applicant |

Effects are best-effort: a failing notification never rolls back the approval.

## Approval Center

`/admin/approvals` (`approvals.read`). Features:

- Tabs / filters by status and module.
- Row detail with **before → after JSON diff**.
- Approve / Reject with a remarks field.
- On approve: `decide()` → `applyApprovedWorkflow()` → toast → list refresh.
- Reachable by admin, principal and accountant.

## Attaching a new module

1. Add the module string to `WorkflowModule` in `workflow.ts`.
2. In the feature page, replace the direct write with
   `submit({ module, recordId, title, before, after, meta })`.
3. Add a `case` in `applyApprovedWorkflow()` performing the real write + notification.
4. Grant `approvals.*` where needed and add the submission page to `roleMenus.ts`.
5. Embed `<ActivityTimeline module="…" recordId="…" />` on the record's detail view.

## Known limitations

- Single-step approval only (no multi-level chains or delegation).
- No SLA/escalation timers.
- LocalStorage persistence — per-browser, not shared between users.
- No attachment support on workflow records.
