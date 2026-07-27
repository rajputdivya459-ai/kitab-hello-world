# CHANGELOG

Newest first. Update after every phase or major feature.

## Documentation package
- Added `project-context/` with 16 AI-context and documentation files.

## Phase 7.3 — Workflow integration (Student & Finance)
- `lib/workflowApply.ts`: approved workflows now perform real side effects.
- `AdminStudentRequests`, `AdminFinanceRequests` pages; Approval Center applies effects.
- Dashboard "Pending Approvals" widget; `SEED_VERSION` 7.3.0.

## Phase 7.2 — Workflow engine, approvals, audit
- `lib/workflow.ts`, `lib/audit.ts`, `ActivityTimeline`.
- `AdminApprovals` (JSON diffs) and `AdminAuditLog`.
- Expanded developer login panel; 17 demo users.

## Phase 7.1 — Complete role workspaces
- Unified `/login` with quick access; `config/roleMenus.ts`; shared `MyProfile`.

## Phase 7 — Identity & role workspaces
- Mock runtime (`mock/db.ts`, `mockAuth.ts`, `SessionProvider`, `RoleSwitcher`).
- `/admin/identity`; principal, accountant and staff dashboards.

## Phase 6.95 — Production readiness
- Notification automation across finance, attendance, exams, homework, transport.
- KPI query optimisation; mobile responsiveness pass.

## Phase 6.9 — Standardization & enforcement
- `RequirePermission`, `useCan`; permission-filtered sidebar; Executive Dashboard V2.

## Phase 6.8 — Hardening
- Shared `DataTable`/`DataToolbar`/`Pagination`/`EmptyState`/`ErrorState`/`TableSkeleton`.
- `lib/export.ts`, `lib/errors.ts`, `lib/permissions.ts`, `lib/notify.ts`, `ExecutiveKPIs`.

## Phase 6.5 — Operations automation
- Leaves, academic calendar, admissions CRM, visitors, reminders, dashboard widgets.
- Attendance month/year filters and analytics.

## Phase 6 — Transport, ID cards, certificates
- Transport tables and admin; PDF/QR engine; ID card and certificate templates.

## Phase 5 — Staff & Teacher portal
- `staff`, `teacher_assignments`, `staff_attendance`, `salary_structures`; `TeacherShell`.

## Phase 4 — Communication & homework
- `notices`, `homework`, `announcements` with targeting; portal feeds.

## Phase 3 — Exams & results
- `exams`, `subjects`, `exam_subjects`, `marks`; `lib/grading.ts`; report cards.

## Phase 2 — Attendance
- `attendance` table; bulk marking; calendar and portal visibility.

## Phase 1 — Portal UX separation
- `ParentShell`, `StudentShell`, portal component library, parent/student contexts.
