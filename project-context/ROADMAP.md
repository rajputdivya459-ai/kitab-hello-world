# ROADMAP

## Delivered

| Phase | Theme |
|---|---|
| 1 | Parent & Student portal UX separation (dedicated shells, no admin UI) |
| 2 | Attendance management (bulk marking, history, portal visibility) |
| 3 | Exams, marks, grading, report cards |
| 4 | Communication: notices, announcements, homework |
| 5 | Staff management + dedicated Teacher portal |
| 6 | Transport, ID cards, certificates, PDF/QR engine |
| 6.5 | Leaves, calendar, admissions CRM, visitors, reminders, dashboard widgets |
| 6.8 | Shared component stack, exports, permission foundation, executive KPIs |
| 6.9 | Permission enforcement across routes and menus, notification automation |
| 6.95 | Full notification wiring, mobile pass, dashboard optimisation |
| 7 | Identity & Access, role workspaces, mock runtime |
| 7.1 | Unified login, role menus, shared My Profile |
| 7.2 | Workflow engine, Approval Center, audit log |
| 7.3 | Workflow integration into Student and Finance modules |
| — | AI bootstrap / documentation package |

## Planned

### Phase 7.4 — Workflow completion
Wire Results, Homework, Leaves and Staff changes into the engine; migrate `workflows`
and `audit_log` to Postgres with RLS; add multi-step approval chains and remarks history.

### Phase 7.5 — Real authentication
Retire mock auth. Expand `app_role` to all seven roles, add `parents` and
`student_parents` tables, link `staff.auth_user_id` and student logins, add password
reset and invite flows.

### Phase 8 — Multi-tenant SaaS
`tenants → branches → academic years`, tenant-scoped RLS, per-tenant branding and
domains, provisioning console, subscription billing.

### Phase 9 — Payments & messaging
Online fee payment gateway, automated receipts and reconciliation, email/SMS/WhatsApp
delivery for notifications, scheduled reminders and digests.

### Phase 10 — Mobile-grade portals
Installable PWA for parents/students, push notifications, offline attendance capture,
document wallet.

### Ongoing
Test coverage, performance budgets, accessibility audit, and keeping this
documentation package current.
