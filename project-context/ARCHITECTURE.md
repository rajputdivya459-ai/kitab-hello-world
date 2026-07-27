# ARCHITECTURE

## Stack

- **React 18** + **TypeScript 5** + **Vite 5** (SPA, no SSR)
- **Tailwind CSS v3** + **shadcn/ui** (Radix primitives) — `src/components/ui/*`
- **React Router v6** — all routing in `src/App.tsx`
- **TanStack Query v5** — server-state cache for Supabase reads
- **Supabase JS** (Lovable Cloud) — Postgres + RLS + Auth
- **framer-motion** (motion), **lucide-react** (icons), **recharts** (admin charts only)
- **jspdf + html2canvas** (PDF export), **qrcode.react** (ID card QR)
- **Vitest** — `src/test/`

## Frontend Architecture

Layered, top to bottom:

```
App.tsx                     routing + global providers
  └─ Layouts / Shells       chrome per audience
       └─ Pages             one file per route
            └─ Feature comps  src/components/{admin,portal,public}
                 └─ Shared     src/components/shared  (DataTable, Toolbar…)
                      └─ UI    src/components/ui      (shadcn primitives)
```

**Providers** (wrapped in `App.tsx`, outermost first):
`QueryClientProvider` → `AuthProvider` (Supabase session) → `SessionProvider`
(mock session) → `SiteSettingsProvider` → `TooltipProvider` → `BrowserRouter`.
`<ScrollToTop />` and the dev-only `<RoleSwitcher />` live inside the router.

**Shells** (`src/layouts/`):

| Shell | Audience | Notes |
|---|---|---|
| `PublicLayout` | website | header + footer + floating WhatsApp |
| `AdminLayout` | admin, principal, accountant, staff | sidebar built from `menuForRole(role)` |
| `TeacherShell` | teacher | own nav, teacher vocabulary |
| `ParentShell` | parent | mobile-first tab/app feel, no tables |
| `StudentShell` | student | mobile-first, student vocabulary |
| `PortalLayout` | shared portal scaffolding | |

Rule: **portal shells never import admin components.**

## Backend Architecture

Supabase (Lovable Cloud) is the system of record for the website CMS and all real
ERP domain data. Access rules:

- All tables live in `public`, RLS enabled, explicit `GRANT`s per role.
- Role checks go through the security-definer function `public.has_role(uid, role)`
  reading `public.user_roles`. Roles are **never** stored on `profiles`.
- Client access only via `import { supabase } from "@/integrations/supabase/client"`.
  `client.ts` and `types.ts` are auto-generated — never edit.
- Schema changes are migrations in `supabase/migrations/*.sql`.

Governance data (mock users, workflows, audit log, finance ledger) currently lives in
the **LocalStorage runtime DB**, not Postgres — see below.

## Folder Structure

```
src/
  App.tsx                 all routes
  main.tsx                bootstrap
  index.css               design tokens (HSL CSS variables)
  assets/                 (unused — project policy: external image URLs only)
  auth/
    mockAuth.ts           sign in/out against LocalStorage users
    SessionProvider.tsx   broadcasts `erp:session` changes
    RoleSwitcher.tsx      dev-only floating role switch
  components/
    ui/                   shadcn primitives (do not fork; extend variants)
    shared/               DataTable, DataToolbar, Pagination, EmptyState,
                          ErrorState, TableSkeleton, ActivityTimeline
    admin/                DashboardWidgets, ExecutiveKPIs, idcards/, certificates/
    portal/               parent+student cards, feeds, calendars, report cards
    public/               marketing site sections
    RequireRole.tsx       strict role gate
    RequirePermission.tsx action-based route gate
    NavLink.tsx, ScrollToTop.tsx
  config/roleMenus.ts     sidebar definitions per role
  contexts/               ParentContext, StudentContext, TeacherContext
  hooks/                  useRole, useCan, useAuth, useInstitution,
                          useSiteSettings, useSocialLinks, useCourseStructure,
                          useDebouncedValue, useScrollReveal, use-mobile, use-toast
  layouts/                shells listed above
  lib/                    workflow, workflowApply, audit, notify, permissions,
                          roleRoutes, grading, pdf, export, errors, utils
  mock/                   db.ts (LocalStorage), users.ts, seeds.ts
  pages/                  public / admin / principal / accountant / staff /
                          teacher / parent / student / profile
  services/api.ts         Supabase data-access helpers
  types/database.ts       hand-written row types for CMS entities
supabase/migrations/      SQL migrations
project-context/          this documentation package
```

## Shared Components

`src/components/shared/` is the standard stack for any admin list screen:
`DataToolbar` (search + filters + export) → `DataTable` (loading / error / empty
states baked in) → `Pagination`. Details and props in `COMPONENTS.md`.

## Hooks

| Hook | Purpose |
|---|---|
| `useRole()` | `{ role, user, loading }` — prefers the mock session, falls back to Supabase `user_roles` |
| `useCan(action)` | boolean permission check, wraps `can()` from `lib/permissions` |
| `useAuth()` | raw Supabase auth session/user |
| `useSiteSettings()` | key/value site settings from `site_settings` |
| `useSocialLinks()` | footer social links |
| `useCourseStructure()` | Course → Year → Semester / Class → Section trees |
| `useInstitution()` | global School vs College toggle (LocalStorage) |
| `useDebouncedValue(v, ms)` | debounced search input |
| `useScrollReveal()` | intersection-observer reveal for public pages |
| `use-mobile`, `use-toast` | viewport breakpoint, toast API |

## Services

`src/services/api.ts` is the Supabase data-access layer for CMS + ERP entities
(fetch/create/update/delete helpers grouped by entity). Pages call these through
TanStack Query rather than issuing raw `supabase.from(...)` calls where a helper
exists.

## Utilities (`src/lib/`)

| File | Responsibility |
|---|---|
| `permissions.ts` | Action union, per-role action lists, `can(role, action)` |
| `roleRoutes.ts` | `roleHome(role)`, `roleLogin(role)` |
| `workflow.ts` | draft/submit/approve/reject/publish engine |
| `workflowApply.ts` | side effects for approved workflows |
| `audit.ts` | `logAudit`, `listAudit`, `clearAudit` (500-entry cap) |
| `notify.ts` | single outbound notification entry point + domain helpers |
| `grading.ts` | percentage → grade / GPA calculation |
| `pdf.ts` | DOM → PDF export (jspdf + html2canvas) |
| `export.ts` | CSV and PDF table export |
| `errors.ts` | technical error → friendly message mapping |
| `utils.ts` | `cn()` class merge |

## Routing

Single route table in `src/App.tsx`:

- Public routes are bare `<Route>`s.
- Admin-family routes are generated from an array of
  `[path, element, requiredAction]` tuples, each wrapped in `<RequirePermission>`.
- Portal routes are nested under their shell (`/parent`, `/student`, `/teacher`).
- `*` → `NotFound`.

Full map in `ROUTES.md`.

## State Management

- **Server state** → TanStack Query (cached, `count:'exact', head:true` for KPI counts).
- **Session state** → `SessionProvider` + LocalStorage `erp.session`, re-broadcast via
  the `erp:session` window event so all subscribers re-render on login/logout/switch.
- **Cross-page domain state** → React Contexts (`ParentContext` selected child,
  `StudentContext`, `TeacherContext` selected class/section).
- **Local UI state** → `useState` in the page. No Redux/Zustand.

## Local Runtime Database

`src/mock/db.ts` — LocalStorage collections namespaced `erp.mock.<collection>`.

API: `getCollection`, `setCollection`, `upsert`, `remove`, `clearAll`,
`seedIfEmpty`, `seedIfVersionChanged(version, seeds)`, `resetAll`, `uid(prefix)`.

Collections in use: `users`, `workflows`, `audit_log`, `finance_ledger`,
`students`, `staff`, `salary_structures`, `seed_version`.

`seedIfVersionChanged` force-reseeds whenever `SEED_VERSION` in `src/mock/users.ts`
changes, so shipped credential/data changes reach existing browsers.
See `MOCK_RUNTIME.md`.

## Mock Authentication

`src/auth/mockAuth.ts` authenticates against the `users` collection:
`signIn(username, password)`, `signInAsRole(role)`, `signOut()`, `getSession()`,
`getCurrentUser()`, `resetPassword(userId, pw)`. The session object
(`{ userId, role, rememberMe, issuedAt }`) is stored at `erp.session`.

This is a **development/demo mechanism**. Supabase auth remains wired for admin and
is the target for all roles in Phase 7.5. `useRole()` prefers the mock session when
present, otherwise falls back to the Supabase `user_roles` lookup.

## Notification Engine

`src/lib/notify.ts` — one `notify(input)` entry point inserting a row into the
`notifications` table. Audience helpers (`notifyAll/Class/Section/Student`) and
domain helpers (`notifyFeePaid`, `notifyAttendanceMarked`, …) sit on top. Failures
are swallowed so a notification never breaks the primary action. See
`NOTIFICATION_ENGINE.md`.

## Workflow Engine

`src/lib/workflow.ts` — LocalStorage-backed records with statuses
`draft → pending → approved | rejected` (+ terminal `published`). The engine only
tracks state; `src/lib/workflowApply.ts` performs the side effects when the Approval
Center approves a record. Every transition writes an audit entry.
See `WORKFLOW_ENGINE.md`.

## Permission Engine

`src/lib/permissions.ts` holds the `Action` union and one action list per role.
`can(role, action)` is consumed by `useCan()` (conditional UI),
`RequirePermission` (route guard) and `AdminLayout` (sidebar filtering).
`RequireRole` additionally isolates whole shells — admin does **not** bypass it.
Backend RLS remains the real authority. See `PERMISSIONS.md`.

## Audit Engine

`src/lib/audit.ts` appends `AuditEntry` rows (user, role, module, action, before/after,
meta, mocked IP, status, timestamp) to `erp.mock.audit_log`, capped at 500 entries.
Surfaced by `/admin/audit-log` (searchable, CSV export) and the reusable
`<ActivityTimeline module recordId />` for per-entity history.
