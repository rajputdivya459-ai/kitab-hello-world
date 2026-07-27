# ROLE MATRIX

Seven active roles. Each role has its own login entry, home route, shell and sidebar.

| Role | Login | Home | Shell |
|---|---|---|---|
| admin | `/admin`, `/login` | `/admin/dashboard` | `AdminLayout` |
| principal | `/login` | `/principal/dashboard` | `AdminLayout` (principal menu) |
| accountant | `/login` | `/accountant/dashboard` | `AdminLayout` (accountant menu) |
| staff | `/login` | `/staff/dashboard` | `AdminLayout` (staff menu) |
| teacher | `/teacher/login`, `/login` | `/teacher/dashboard` | `TeacherShell` |
| parent | `/parent/login`, `/login` | `/parent/dashboard` | `ParentShell` |
| student | `/student/login`, `/login` | `/student/dashboard` | `StudentShell` |

`member` = authenticated with no privileges (`can()` always false).

---

## Capability matrix

Legend: **F** full (read+write) · **R** read only · **O** own records only · **—** no access

| Capability | admin | principal | accountant | staff | teacher | parent | student |
|---|---|---|---|---|---|---|---|
| Dashboard | F | F | F | F | F | own | own |
| Website CMS | F | — | — | — | — | — | — |
| Site settings / course structure | F | — | — | — | — | — | — |
| Students | F | R | R | — | R | O (child) | O |
| Student change requests | F | — | — | — | — | — | — |
| Attendance | F | F | — | — | F (own classes) | O | O |
| Exams | F | R | — | — | R | — | — |
| Results / marks | F | F | — | — | F (own subjects) | O | O |
| Homework | F | R | — | — | F | R | R |
| Notices | F | F | — | R | R | R | R |
| Announcements | F | F | — | R | R | R | R |
| Notifications | F | F | R | R | R | R | R |
| Messages (contact inbox) | F | R | — | — | — | — | — |
| Fees / finance | F | — | F | — | — | O | O |
| Expenses | F | — | F | — | — | — | — |
| Salaries | F | — | F | — | — | — | — |
| Defaulters | F | — | R | — | — | — | — |
| Analytics / reports | F | R | R | — | — | — | — |
| Staff directory | F | R | — | — | — | — | — |
| Teacher assignments | F | — | — | — | — | — | — |
| Transport | F | — | — | R* | — | R (own) | — |
| ID cards | F | — | — | — | — | — | — |
| Certificates | F | F | — | R* | — | — | — |
| Leaves | F | F | — | R* | — | — | — |
| Academic calendar | F | F | — | R | — | R | R |
| Admission inquiries | F | F | — | F | — | — | — |
| Visitors | F | F | — | F | — | — | — |
| Reminders | F | R | R | — | — | — | — |
| Approvals | F | F | F | — | — | — | — |
| Audit log | F | R | R | — | — | — | — |
| Identity & Access | F | — | — | — | — | — | — |

\* Front-desk staff reach these pages via their sidebar; write capability is limited by
the action list in `src/lib/permissions.ts` (`STAFF` currently grants write only for
visitors and inquiries).

---

## Sidebar composition (`src/config/roleMenus.ts`)

- **admin** — Workspace · Website · School ERP · Staff · Communication · Workflow ·
  Administration (7 groups, ~45 links).
- **principal** — Executive · Academic · Operations. No finance, no CMS, no identity.
- **accountant** — Accounts · Finance (submit request, approvals, fee collection,
  expenses, salaries, receipts, defaulters, reminders, finance reports).
- **staff** — Workspace · Front Desk (visitors, admissions, transport, certificates,
  notices, calendar, leave).
- **teacher / parent / student** — hard-coded navigation inside their own shells,
  not driven by `roleMenus.ts`.

`AdminLayout` additionally filters every group/item through `can(role, action)`, so a
menu entry never appears for a role that the permission engine would block.

---

## Enforcement layers

1. **Shell isolation** — `RequireRole` keeps each role inside its own app; admin does
   **not** bypass a teacher/parent/student shell.
2. **Route gate** — `RequirePermission(action)` on every admin-family route.
3. **Menu filter** — sidebar items hidden when the action is not allowed.
4. **Conditional UI** — `useCan(action)` hides buttons/tabs inside pages.
5. **Backend RLS** — the actual authority; UI gates are convenience only.

---

## Design contract per audience

| Audience | UX rules |
|---|---|
| Admin family | Sidebar, dense tables, filters, charts, exports, ERP vocabulary |
| Teacher | Task-first cards, only own classes, minimal filters |
| Parent | App-like cards, child switcher, plain language ("Fees due", not "Receivables"), no charts, no tables |
| Student | Same as parent minus finance depth and the child switcher |
