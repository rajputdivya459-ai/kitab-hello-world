# AI BOOTSTRAP

**Read this file first. It is the minimum context needed to work on this project.**

## What this is

A React SPA that serves a school/college **public website** + a **role-based ERP** with
dedicated portals for Teachers, Parents and Students. Single institution today,
multi-tenant later.

## Stack

React 18 · TypeScript · Vite · Tailwind v3 · shadcn/ui · React Router v6 ·
TanStack Query · Supabase (Lovable Cloud: Postgres + RLS + Auth) · Vitest.
No SSR, no other frameworks.

## Roles (7)

`admin` · `principal` · `accountant` · `staff` · `teacher` · `parent` · `student`
Each has its own login, home route and shell. Admin/principal/accountant/staff share
`AdminLayout` with different menus; teacher/parent/student have isolated shells.

## Key files

| File | Why it matters |
|---|---|
| `src/App.tsx` | every route + guards |
| `src/lib/permissions.ts` | action union + per-role action lists + `can()` |
| `src/config/roleMenus.ts` | sidebar per role |
| `src/lib/workflow.ts` | approval engine (draft→pending→approved/rejected/published) |
| `src/lib/workflowApply.ts` | side effects on approval |
| `src/lib/notify.ts` | the only way to create notifications |
| `src/lib/audit.ts` | audit trail |
| `src/mock/db.ts`, `src/mock/users.ts` | LocalStorage runtime + demo logins |
| `src/components/shared/*` | DataTable / DataToolbar / Pagination stack |
| `supabase/migrations/*.sql` | schema of record |

## Non-negotiable rules

1. **Portals never import admin components.** No charts, no dense tables, no ERP
   jargon, no complex filters in parent/student/teacher screens.
2. **Semantic design tokens only** — no `text-white`, `bg-black`, `bg-[#hex]`.
3. **External image URLs only** — no local assets, no Storage, no base64.
4. **Roles live in `public.user_roles`**, never on `profiles`; check via
   `public.has_role()`.
5. Every `CREATE TABLE public.x` migration must include `GRANT`s, then RLS, then policies.
6. Never edit `src/integrations/supabase/client.ts`, `types.ts`, `.env`,
   `supabase/config.toml`.
7. Notifications only through `notify()`; sensitive changes only through `workflow.ts`.
8. Mobile-first, no hover-only affordances, scroll-to-top on every route change.
9. Don't break admin ERP functionality when changing portals, and vice versa.

## Permission enforcement chain

`RequireRole` (shell isolation, admin does not bypass) → `RequirePermission(action)`
(per route) → sidebar filtering → `useCan()` in-page → **RLS is the real authority**.

## Dev logins

`/login` → Developer Quick Access. Pattern `role` / `role123`
(`admin/admin123`, `parent/parent123`, …). Seeded by `SEED_VERSION` in
`src/mock/users.ts` — bump it whenever seed data changes.

## Current state

Phase 7.3 complete. Workflows integrated into Student + Finance only; workflows and
audit log are LocalStorage-backed; mock auth covers non-admin roles; single tenant.
See `CURRENT_STATUS.md`.

## Where to look next

`ARCHITECTURE.md` (system shape) · `DATABASE.md` (schema) · `MODULES.md` (features) ·
`ROUTES.md` · `ROLE_MATRIX.md` · `PERMISSIONS.md` · `WORKFLOW_ENGINE.md` ·
`NOTIFICATION_ENGINE.md` · `COMPONENTS.md` · `MOCK_RUNTIME.md` ·
`DEVELOPMENT_GUIDE.md` · `ROADMAP.md` · `CHANGELOG.md`.

## Maintenance duty

After completing any phase, feature or refactor, update `CURRENT_STATUS.md`,
`ROADMAP.md`, `CHANGELOG.md` and this file.
