# ROUTES

All routes are declared in `src/App.tsx`. Guard legend:

- **RequirePermission(action)** — action-based gate (`src/components/RequirePermission.tsx`).
  Unauthenticated → `/admin`; wrong permission → `roleHome(role)`.
- **RequireRole(role)** — strict shell isolation; admin does not bypass.
- Portal routes render inside their shell, which performs its own session check.

---

## Public

| Route | Purpose | Role | Layout |
|---|---|---|---|
| `/` | Homepage (hero, about, stats, programs, campus, events) | none | `PublicLayout` |
| `/about` | Alias of homepage | none | `PublicLayout` |
| `/departments` | Department listing | none | `PublicLayout` |
| `/faculty` | Faculty directory | none | `PublicLayout` |
| `/events` | Events listing | none | `PublicLayout` |
| `/gallery` | Photo gallery | none | `PublicLayout` |
| `/contact` | Contact form → `contact_submissions` | none | `PublicLayout` |
| `/login` | Unified login + developer quick-access panel | none | standalone |
| `*` | NotFound | none | standalone |

## Logins

| Route | Purpose |
|---|---|
| `/admin` | Admin login (`AdminLogin`) |
| `/parent/login` | Parent login |
| `/student/login` | Student login |
| `/teacher/login` | Teacher login |
| `/login` | Any role, with seeded quick-access cards |

`roleLogin(role)` in `src/lib/roleRoutes.ts` maps a role to its login path
(`principal`/`accountant`/`staff` map to `/principal/login`, `/accountant/login`,
`/staff/login` — these currently funnel through `/login`).

## Admin family (`AdminLayout`)

Generated from a `[path, element, action]` tuple array. Every route below is
`/admin/<path>` and wrapped in `RequirePermission(action)`. Principal, accountant and
staff reuse these pages — their sidebars expose only the subset their permissions allow.

| Path | Purpose | Required action |
|---|---|---|
| `dashboard` | Executive KPIs + widgets | `dashboard.read` |
| `profile` | Shared My Profile | `dashboard.read` |
| `settings` | Site settings | `settings.write` |
| `stats` | Homepage statistics CMS | `website.write` |
| `homepage` | Homepage sections CMS | `website.write` |
| `about` | About page CMS | `website.write` |
| `departments` | Departments CMS | `website.write` |
| `members` | Management team CMS | `website.write` |
| `faculty` | Faculty CMS | `website.write` |
| `events` | Events CMS | `website.write` |
| `gallery` | Gallery CMS | `website.write` |
| `social-links` | Social links CMS | `website.write` |
| `explore-videos` | Campus videos CMS | `website.write` |
| `programs` | Programs & activities CMS | `website.write` |
| `course-structure` | Course/Year/Semester, Class/Section | `settings.write` |
| `students` | Student master | `students.read` |
| `student-requests` | Student change requests (workflow) | `students.write` |
| `attendance` | Bulk daily attendance | `attendance.read` |
| `exams` | Exam schedules & subjects | `exams.read` |
| `results` | Marks entry & publishing | `results.read` |
| `finance` | Fees / expenses / salaries / receipts | `finance.read` |
| `finance-requests` | Finance requests (workflow) | `finance.write` |
| `defaulters` | Fee defaulters | `defaulters.read` |
| `analytics` | Demographic & financial analytics | `analytics.read` |
| `staff` | Staff directory | `staff.read` |
| `teacher-assignments` | Teacher ↔ class/subject matrix | `staff.write` |
| `staff-attendance` | Staff attendance | `attendance.read` |
| `transport` | Routes / vehicles / drivers / allocation | `transport.read` |
| `id-cards` | Student & staff ID cards | `idcards.read` |
| `certificates` | Certificate issuance | `certificates.read` |
| `leaves` | Student & staff leave approvals | `leaves.read` |
| `calendar` | Academic calendar | `calendar.read` |
| `inquiries` | Admission inquiry CRM | `inquiries.read` |
| `visitors` | Visitor entry/exit log | `visitors.read` |
| `reminders` | Task reminders | `reminders.read` |
| `notices` | Notices | `notices.read` |
| `announcements` | Announcements | `notices.write` |
| `homework` | Homework | `homework.read` |
| `notifications` | Notification centre | `notifications.read` |
| `messages` | Contact-form inbox | `messages.read` |
| `identity` | Identity & Access (mock users) | `identity.read` |
| `approvals` | Approval Center | `approvals.read` |
| `audit-log` | Audit trail | `audit.read` |

## Principal

| Route | Purpose | Role | Layout |
|---|---|---|---|
| `/principal/dashboard` | Executive oversight dashboard | principal | `AdminLayout` |
| `/principal/profile` | My Profile | principal | `AdminLayout` |

Principal's sidebar also links into `/admin/*` pages allowed by `PRINCIPAL` permissions.

## Accountant

| Route | Purpose | Role | Layout |
|---|---|---|---|
| `/accountant/dashboard` | Finance dashboard | accountant | `AdminLayout` |
| `/accountant/profile` | My Profile | accountant | `AdminLayout` |

Sidebar pins `/admin/finance-requests` and `/admin/approvals` at the top.

## Staff

| Route | Purpose | Role | Layout |
|---|---|---|---|
| `/staff/dashboard` | Front-desk dashboard | staff | `AdminLayout` |
| `/staff/profile` | My Profile | staff | `AdminLayout` |

## Teacher (`TeacherShell`)

| Route | Purpose |
|---|---|
| `/teacher/dashboard` | Today's classes, pending tasks |
| `/teacher/classes` | Assigned classes & sections |
| `/teacher/attendance` | Mark attendance for own sections |
| `/teacher/marks` | Enter marks for own subjects |
| `/teacher/homework` | Create/list homework |
| `/teacher/notices` | Notices feed |
| `/teacher/profile` | Teacher profile |
| `/teacher/my-profile` | Shared My Profile |

## Parent (`ParentShell`)

| Route | Purpose |
|---|---|
| `/parent/dashboard` | Child summary cards |
| `/parent/fees` | Fee position |
| `/parent/receipts` | Payment receipts |
| `/parent/attendance` | Attendance calendar & summary |
| `/parent/results` | Report cards |
| `/parent/notices` | Notices / announcements / homework feed |
| `/parent/transport` | Route & pickup details |
| `/parent/profile` | My Profile |

## Student (`StudentShell`)

| Route | Purpose |
|---|---|
| `/student/dashboard` | Personal summary |
| `/student/attendance` | Attendance calendar & summary |
| `/student/fees` | Fee position |
| `/student/results` | Results |
| `/student/notices` | Notices feed |
| `/student/profile` | My Profile |

## Redirect helpers

`roleHome(role)` (`src/lib/roleRoutes.ts`) — post-login and guard-rejection target:

```
admin → /admin/dashboard        principal  → /principal/dashboard
accountant → /accountant/dashboard  staff  → /staff/dashboard
teacher → /teacher/dashboard    parent     → /parent/dashboard
student → /student/dashboard    otherwise  → /
```
