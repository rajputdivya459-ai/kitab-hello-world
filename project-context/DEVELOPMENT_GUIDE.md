# DEVELOPMENT GUIDE

## Setup

```bash
npm install
npm run dev        # http://localhost:8080
npm run build
npx vitest run     # tests in src/test/
```

Env vars (`.env`, auto-generated — do not edit): `VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.

## Never edit

`src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`,
`.env`, `supabase/config.toml`.

## Coding standards

- TypeScript everywhere; explicit `interface Props`; avoid `any` in public APIs.
- One component per file, named export matching the filename; split past ~200 lines.
- Tailwind with **semantic tokens only** — no `text-white`, `bg-black`, `bg-[#hex]`.
- Mobile-first; no hover-only affordances.
- Media via **external URLs only** — no local assets, no Storage, no base64.
- Every route transition scrolls to top (`ScrollToTop` is global).

## Data access

- Reads through TanStack Query; counts with `count:'exact', head:true`.
- Prefer helpers in `src/services/api.ts` over inline `supabase.from(...)`.
- Errors surfaced via `lib/errors.ts` → `ErrorState` / toast.

## Adding a module (checklist)

1. Migration: `CREATE TABLE` → `GRANT` → `ENABLE ROW LEVEL SECURITY` → policies.
2. Page in `src/pages/admin/`, built from `DataToolbar` + `DataTable` + `Pagination`.
3. Action(s) in `lib/permissions.ts`, added to the relevant role arrays.
4. Route tuple in `App.tsx` wrapped in `RequirePermission`.
5. Sidebar entry in `config/roleMenus.ts`.
6. Notifications via `lib/notify.ts` for user-visible events.
7. Workflow via `lib/workflow.ts` if the change is sensitive.
8. Portal surface if parents/students need it — portal components only.
9. Update `DATABASE.md`, `MODULES.md`, `ROUTES.md`, `ROLE_MATRIX.md`, `CHANGELOG.md`.

## Migration rules

Every `CREATE TABLE public.x` must be followed, in the same migration, by GRANTs:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.x TO authenticated;
GRANT ALL ON public.x TO service_role;
-- GRANT SELECT ON public.x TO anon;  -- only for genuinely public data
ALTER TABLE public.x ENABLE ROW LEVEL SECURITY;
CREATE POLICY … USING (public.has_role(auth.uid(),'admin'));
```

Never touch `auth`, `storage`, `realtime`, `supabase_functions`, `vault` schemas.
Roles never live on `profiles`.

## Portal UX contract

Parent/student/teacher screens: card-based, plain language, no admin imports, no
charts, no dense tables, no complex filters (month/year only).

## Testing & verification

- Unit tests: Vitest (`src/test/`).
- Manual role sweep: use the dev quick-access panel on `/login` or the floating
  `RoleSwitcher` to check each of the 7 roles after permission changes.

## Git & docs discipline

Small, focused commits. After any phase or major feature, update `CURRENT_STATUS.md`,
`ROADMAP.md`, `CHANGELOG.md` and `AI_BOOTSTRAP.md`.
