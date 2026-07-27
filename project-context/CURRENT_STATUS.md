# CURRENT STATUS

_Last updated: Phase 7.3 + documentation package_

## Completed

- **Public website CMS** — homepage, about, stats, departments, members, faculty,
  events, gallery, social links, videos, programs, site settings.
- **Academics** — course structure, students, attendance (bulk + history + analytics),
  exams/subjects/marks, grading, report cards.
- **Finance** — fee collection, expenses, salaries, discounts, defaulters, receipts,
  finance analytics.
- **Staff** — directory, teacher assignments, staff attendance, salary structures.
- **Operations** — transport, ID cards, certificates, leaves, academic calendar,
  admission inquiries, visitors, reminders.
- **Communication** — notices, announcements, homework, notification engine, inbox.
- **Portals** — dedicated Parent, Student and Teacher shells with portal-only UI.
- **Governance** — permission matrix, route guards, Identity & Access, workflow engine,
  Approval Center, audit log, activity timelines.
- **Hardening** — shared DataTable/Toolbar/Pagination stack, skeleton/empty/error
  states, CSV+PDF export, executive KPI dashboard, mobile pass.
- **Docs** — this `project-context/` package.

## In progress / partial

- Workflow coverage: Student + Finance integrated; Results, Homework, Leaves and Staff
  changes defined in the engine but not yet wired end-to-end.
- Real auth exists for admin only; other roles run on the mock runtime.
- Parents have no Postgres table — parent identity is mock-only.

## Known gaps

- `workflows` and `audit_log` live in LocalStorage (per-browser, 500-entry cap).
- No email/SMS/WhatsApp delivery; notifications are in-app only.
- No online payments or gateway integration.
- Single tenant, single branch, single academic year.
- Test coverage is minimal (one example spec).

## Immediate next steps

1. Wire workflows into Results, Homework and Leaves.
2. Move workflows + audit log to Postgres with RLS.
3. Replace mock auth with real auth for all seven roles; add `parents` and
   `student_parents` tables.
