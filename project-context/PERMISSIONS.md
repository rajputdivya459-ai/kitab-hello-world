# PERMISSIONS

File: `src/lib/permissions.ts` · Hook: `src/hooks/useCan.ts` ·
Guards: `src/components/RequirePermission.tsx`, `src/components/RequireRole.tsx`

## Model

A flat `Action` union of `domain.verb` strings. Each role owns an explicit array of
actions. `can(role, action)` is a simple membership test:

```ts
export function can(role: RoleLike, action: Action): boolean {
  if (!role || role === 'member') return false;
  return (PERMISSIONS[role] ?? []).includes(action);
}
```

There is no inheritance and no wildcard at runtime — `admin` is granted the full `ALL`
array explicitly. This keeps the matrix auditable at the cost of verbosity.

## Action catalogue

```
dashboard.read
students.read|write      staff.read|write        attendance.read|write
finance.read|write       results.read|write      exams.read|write
inquiries.read|write     visitors.read|write     certificates.read|write
notifications.read|write notices.read|write      homework.read|write
leaves.read|write        calendar.read|write     transport.read|write
idcards.read|write       reminders.read|write    messages.read|write
website.read|write       identity.read|write     admissions.read|write
expenses.read|write      salaries.read|write     approvals.read|write
analytics.read           defaulters.read         reports.read
settings.write           audit.read
```

## Role assignments

| Role | Actions |
|---|---|
| `admin` | `ALL` — every action in the catalogue |
| `principal` | dashboard; students.read; staff.read; attendance.read/write; results.read/write; exams.read; certificates.read/write; notifications.read/write; notices.read/write; homework.read; leaves.read/write; calendar.read/write; inquiries.read/write; visitors.read/write; reminders.read; analytics.read; reports.read; messages.read; admissions.read/write; approvals.read/write; audit.read |
| `accountant` | dashboard; students.read; finance.read/write; defaulters.read; reports.read; notifications.read; reminders.read; expenses.read/write; salaries.read/write; approvals.read/write; audit.read |
| `staff` | dashboard; notices.read; notifications.read; calendar.read; visitors.read/write; inquiries.read/write |
| `teacher` | dashboard; students.read; attendance.read/write; results.read/write; homework.read/write; notices.read; notifications.read |
| `parent` | attendance.read; finance.read; results.read; notifications.read; notices.read |
| `student` | attendance.read; finance.read; results.read; notifications.read; notices.read |
| `member` | none |

Deliberate exclusions worth remembering:

- **Principal has no finance access at all** (no `finance.*`, `expenses.*`, `salaries.*`).
- **Accountant cannot see academics** (no attendance/results/exams).
- **Nobody but admin** holds `website.*`, `settings.write`, `identity.*`, `idcards.*`.

## Enforcement layers

1. **`RequireRole`** — shell isolation. Wrong role → redirected to `roleHome(currentRole)`;
   no session → the shell's `loginPath`. Admin does not bypass.
2. **`RequirePermission`** — every admin-family route carries a required action.
   No session → `/admin`; missing permission → `roleHome(role)`.
3. **Sidebar filtering** — `AdminLayout` drops menu groups/items whose action fails
   `can()`, so users never see dead links.
4. **Conditional UI** — `useCan('finance.write')` etc. hides create/edit/delete controls.
5. **Backend RLS** — the real authority. UI gates are UX, not security.

## Adding a permission

1. Add the string to the `Action` union.
2. Append it to `ALL` and to each role array that should hold it.
3. Reference it in the route tuple in `App.tsx` and in `roleMenus.ts`.
4. Add the matching RLS policy + `GRANT` in a migration — the UI check is not enough.
5. Update `ROLE_MATRIX.md`.

## Security notes

- Roles live in `public.user_roles`, never on `profiles`. Reads go through the
  security-definer `public.has_role(uid, role)` to avoid recursive RLS.
- Never derive admin status from LocalStorage or a hard-coded credential for anything
  that touches real data; the mock session is a development convenience only.
- `RoleLike` widens `AppRole` with `principal | accountant | staff` because those roles
  currently exist only in the mock runtime, not in the `app_role` enum.
