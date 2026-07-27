# MOCK RUNTIME

A LocalStorage-backed runtime that lets all 7 roles be developed and demoed before
real authentication exists for each of them.

## Files

| File | Role |
|---|---|
| `src/mock/db.ts` | LocalStorage collection CRUD |
| `src/mock/users.ts` | demo accounts + `SEED_VERSION` |
| `src/mock/seeds.ts` | sample workflows, ledger and domain rows |
| `src/auth/mockAuth.ts` | sign in/out, session helpers |
| `src/auth/SessionProvider.tsx` | broadcasts `erp:session` changes |
| `src/auth/RoleSwitcher.tsx` | dev-only floating role switcher |
| `src/pages/admin/AdminIdentity.tsx` | manage mock users |

## Storage keys

- Collections: `erp.mock.<collection>`
- Session: `erp.session`

Collections: `users`, `workflows`, `audit_log`, `finance_ledger`, `students`,
`staff`, `salary_structures`, `seed_version`.

## `db.ts` API

`getCollection<T>(name)` · `setCollection(name, rows)` · `upsert(name, row)` ·
`remove(name, id)` · `clearAll()` · `seedIfEmpty(name, rows)` ·
`seedIfVersionChanged(version, seeds)` · `resetAll()` · `uid(prefix)`

## Seeding

`SEED_VERSION` lives in `src/mock/users.ts` (currently **7.3.0**).
`seedIfVersionChanged` compares it with the stored `seed_version` and force-reseeds on
mismatch, so credential or data changes reach browsers that already have old state.
**Bump `SEED_VERSION` whenever seed data or demo passwords change.**

## Session

```ts
{ userId: string; role: string; rememberMe: boolean; issuedAt: string }
```

`signIn(username, password)` validates against the `users` collection and rejects
inactive accounts. `signInAsRole(role)` is the one-click dev path. `signOut()` clears
`erp.session`. Every write dispatches the `erp:session` window event so
`SessionProvider` and `useRole()` re-render.

## Demo accounts

17 seeded users covering all roles. Pattern: username = role name,
password = `<role>123`.

| Role | Username | Password |
|---|---|---|
| admin | `admin` | `admin123` |
| principal | `principal` | `principal123` |
| accountant | `accountant` | `accountant123` |
| staff | `staff` | `staff123` |
| teacher | `teacher` | `teacher123` |
| parent | `parent` | `parent123` |
| student | `student` | `student123` |

Additional numbered variants (`teacher2`, `parent2`, `student2`, …) exist for
multi-user scenarios such as the parent child-switcher. The legacy Supabase admin
credential `admin@mgcm.ac.in / admin` still applies to real Supabase auth.

Fastest entry: `/login` → **Developer Quick Access** panel, or the floating
`RoleSwitcher` in development.

## User record

`id`, `name`, `username`, `password`, `email`, `mobile`, `role`, `status`,
`profileType`, `profileId`, `prefs`, `context`, `lastLogin`, `createdAt`.
`profileId` links a login to a mock student/parent/teacher/staff record; parents carry
`children: string[]` consumed by `ParentContext`.

## Interaction with Supabase

`useRole()` prefers the mock session when one exists, otherwise falls back to the
Supabase session + `user_roles`. Domain data (students, attendance, fees…) still comes
from Postgres; only identity, workflows, audit and the finance ledger are mocked.

## Resetting

Identity & Access has reset controls; programmatically use `resetAll()` or clear all
`erp.*` LocalStorage keys and reload.

## Retirement plan

Phase 7.4 moves `workflows` and `audit_log` into Postgres; Phase 7.5 replaces mock auth
with real Supabase auth for all roles and expands the `app_role` enum to the full seven.
