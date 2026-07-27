# Phase 7 — Role-Based Workspace & Identity Management

Architecture-only phase. No Supabase Auth changes, no multi-tenant work. Existing modules stay intact; new role shells sit alongside the current admin app and share the existing shared components (DataTable, DataToolbar, permissions engine, notify).

## 1. Mock runtime layer (LocalStorage)

New folder `src/mock/`:
- `users.ts`, `students.ts`, `parents.ts`, `teachers.ts`, `staff.ts`, `accountants.ts` — seed arrays.
- `db.ts` — generic LocalStorage CRUD (`getCollection`, `setCollection`, `upsert`, `remove`, `resetAll`, `seedIfEmpty`).
- Keys namespaced `erp.mock.<collection>`.

On app boot (`main.tsx`) call `seedIfEmpty()` — never overwrite existing data.

Dev actions exposed in the Role Switcher panel: **Load Mock Data**, **Clear Runtime Data**, **Reset Runtime Database**.

## 2. Mock auth + session

`src/auth/mockAuth.ts`:
- `signIn(username, password)` → validates against mock users, stores `erp.session` = `{ userId, role, rememberMe, issuedAt }`.
- `signOut()`, `getSession()`, `getCurrentUser()`.
- `resetPassword(userId, newPassword)` (mock).

`src/auth/SessionProvider.tsx` — React context exposing `{ user, role, profile, signIn, signOut, switchRole }`. Wraps existing `AuthProvider` (Supabase stays untouched); new provider is the source of truth for role/profile in Phase 7 UI. `useRole()` gets a thin adapter so existing components keep working.

Profile linking: each mock user has `profileId` + `profileType` → resolves to student/parent/teacher/staff row.

## 3. Central Identity & Access module

New route `/admin/identity` (permission `identity.write`, admin-only):
- Uses shared DataTable + DataToolbar + Pagination + EmptyState.
- Columns: Name, Username, Email, Mobile, Role, Status, Last Login, Created.
- Actions: Create, Edit, Activate/Deactivate, Reset Password, Assign Role, Delete.
- Search + role/status filters + CSV export.
- Backed by mock `users` collection.

Add `identity.read` / `identity.write` to `src/lib/permissions.ts` (admin only).

## 4. Role Switcher (dev-only)

Floating panel bottom-right, visible when `import.meta.env.DEV`:
- Dropdown of all 7 roles → signs in as first mock user of that role.
- Buttons: Load Mock, Clear, Reset DB.

## 5. Role workspaces (shells + dashboards + sidebars)

Reuse existing shells where possible. Sidebar items are generated from a per-role menu registry (`src/config/roleMenus.ts`) filtered through the permission engine.

New shells + dashboards (each with a role-specific KPI dashboard, not the admin one):
- **Principal** — `/principal/*` shell, dashboard (school KPIs, pending approvals), Students/Staff/Attendance/Results/Reports/Leaves/Admissions (reuse admin pages read-only via `useCan`).
- **Accountant** — `/accountant/*` shell, finance-only dashboard, Fees/Expenses/Salaries/Receipts/Reports.
- **Staff** — `/staff/*` shell, generic dashboard driven by granted permissions.
- **Teacher / Parent / Student** — reuse existing shells + dashboards; refresh sidebars from new registry.
- **Admin** — existing shell; add Identity & Access link.

Route protection: existing `<RequirePermission>` on all admin routes; add same wrapper on new shells' child routes. Add a `<RequireRole>` layer at each shell root so URL access is blocked cross-role.

Each dashboard is a small dedicated component under `src/components/dashboards/` (PrincipalKPIs, AccountantKPIs, StaffKPIs). Teacher/Parent/Student dashboards already exist — leave logic, only ensure they use their role's data scope.

## 6. Permission expansion

Extend `Action` type + matrix in `src/lib/permissions.ts`:
- `identity.read`, `identity.write` (admin only)
- `admissions.read`, `admissions.write` (admin, principal)
- `expenses.read`, `expenses.write`, `salaries.read`, `salaries.write` (admin, accountant)

Grant lists per role updated. `principal`, `accountant`, `staff` become real routable roles (previously matrix-only).

## 7. Scope enforcement (UI level)

- Teacher pages already filter by assigned classes via `TeacherContext` — keep.
- Parent pages filter by children via `ParentContext` — keep.
- Student pages filter by `StudentContext` — keep.
- Principal/Accountant/Staff read only — hide write buttons through `useCan`.

## 8. Files

**New (~18):**
- `src/mock/{db,users,students,parents,teachers,staff,accountants}.ts`
- `src/auth/{mockAuth,SessionProvider,RoleSwitcher}.tsx`
- `src/config/roleMenus.ts`
- `src/layouts/{PrincipalShell,AccountantShell,StaffShell}.tsx`
- `src/pages/principal/{PrincipalLogin,PrincipalDashboard,...}.tsx` (dashboard + thin wrappers reusing admin pages)
- `src/pages/accountant/{AccountantLogin,AccountantDashboard,...}.tsx`
- `src/pages/staff/{StaffLogin,StaffDashboard}.tsx`
- `src/pages/admin/AdminIdentity.tsx`
- `src/components/dashboards/{PrincipalKPIs,AccountantKPIs,StaffKPIs}.tsx`

**Edited:**
- `src/App.tsx` — mount new routes + Role Switcher, wrap `<SessionProvider>`.
- `src/main.tsx` — call `seedIfEmpty`.
- `src/lib/permissions.ts` — new actions.
- `src/lib/roleRoutes.ts` — add principal/accountant/staff.
- `src/layouts/AdminLayout.tsx` — add Identity & Access nav.
- `src/hooks/useRole.tsx` — adapter reading session first, DB second.

## 9. Out of scope

- Real Supabase Auth changes (existing admin login flow stays as backup).
- Multi-tenant, org tables, RLS changes.
- New business modules.
- Email/SMS/push channels.
- Replacing shared components.

## 10. Verification

- `tsgo` typecheck clean.
- Playwright smoke: sign in as each role via Role Switcher, verify sidebar contents differ, cross-role URL access redirects to role home.
- Existing admin flows (Finance record, Attendance save, Identity CRUD) still work.
