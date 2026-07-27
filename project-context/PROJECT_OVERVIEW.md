# PROJECT OVERVIEW

## Product Identity

**MGCM School & College ERP + Public Website** — a single React SPA that serves two
audiences from one codebase:

1. A **public marketing website** for the institution (homepage, departments, faculty,
   events, gallery, contact).
2. A **role-based School ERP** covering academics, finance, staff, operations,
   communication, approvals and audit — plus dedicated **portals** for Teachers,
   Parents and Students.

## Product Vision

Give a single institution (and later, many institutions) one system that replaces
spreadsheets, WhatsApp groups and paper registers — while keeping every role in a
workspace that feels purpose-built for them, not a stripped-down admin panel.

## Product Goals

- One source of truth for students, staff, attendance, exams, fees and documents.
- Every role gets an **independent application shell** (own login, sidebar, dashboard,
  vocabulary). Admin UI is never reused inside parent/student portals.
- Enterprise controls: permission matrix, approval workflows, audit trail.
- Mobile-first, no-hover-dependency UI (most parents use phones).
- CMS-driven public website so non-technical staff can edit content.

## Target Users

| User | Primary need |
|---|---|
| School administrator / owner | Full control, oversight, configuration |
| Principal | Read-heavy oversight + approvals, no finance internals |
| Accountant | Fees, expenses, salaries, defaulters, finance requests |
| Office / front-desk staff | Visitors, admissions inquiries, certificates, transport |
| Teacher | Own classes: attendance, marks, homework, notices |
| Parent | Child's fees, receipts, attendance, results, notices, transport |
| Student | Own attendance, fees, results, notices |
| Public visitor | Institution info, programs, events, contact |

## Supported Roles

`admin`, `principal`, `accountant`, `staff`, `teacher`, `parent`, `student`
(plus `member` = authenticated but unprivileged).

See `ROLE_MATRIX.md` for the full capability table.

## School ERP Overview

Functional pillars, each documented in `MODULES.md`:

1. **Website CMS** — homepage, about, stats, departments, members, faculty, events,
   gallery, social links, explore videos, programs.
2. **Academics** — course structure (Course → Year → Semester, Class → Section),
   students, attendance, exams, subjects, marks, results.
3. **Finance** — fee collection, expenses, salaries, discounts, defaulters, analytics.
4. **Staff** — directory, teacher assignments, staff attendance, salary structures.
5. **Operations** — transport, ID cards, certificates, leaves, academic calendar,
   admission inquiries, visitors, reminders.
6. **Communication** — notices, announcements, homework, notification centre, messages.
7. **Governance** — Identity & Access, Permission engine, Workflow/Approval Center,
   Audit Log.
8. **Portals** — Teacher, Parent, Student (separate shells, separate UX language).

## Business Model

- Per-institution annual/monthly licence (single tenant today).
- Tiering by module bundle: *Core* (academics + communication), *Plus* (finance +
  operations), *Enterprise* (workflows, audit, multi-branch).
- Add-ons: SMS/WhatsApp credits, ID-card/certificate printing volume.

## SaaS Vision

Move from one deployment per school to a multi-tenant platform:
`tenant → branches → academic years`, tenant-scoped RLS, per-tenant branding and
domains, subscription billing, and a tenant provisioning console. **Not implemented
yet** — see `ROADMAP.md` (Phase 8).

## Current Development Phase

**Phase 7.3 complete** — Workflow integration into Student and Finance modules.
Documentation package (this folder) added on top.

Next planned: Phase 7.4 (extend workflows to Results / Homework / Leaves and replace
the LocalStorage workflow runtime with real backend tables).

## Future Roadmap (summary)

| Phase | Theme |
|---|---|
| 7.4 | Workflow coverage for remaining modules + backend persistence |
| 7.5 | Real authentication for all roles (retire mock auth) |
| 8 | Multi-tenant SaaS foundation |
| 9 | Payment gateway, online fee payment, automated receipts |
| 10 | Native-feel PWA portals, push notifications, offline attendance |

Full detail in `ROADMAP.md`.
