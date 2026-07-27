# COMPONENTS

Import rules first, because they matter most:

- Admin pages may use everything.
- **Portal shells (parent/student/teacher) must not import from `src/components/admin/`.**
- Public pages use `src/components/public/` + `ui/` only.
- Never fork a shadcn primitive — extend it with variants.

---

## `src/components/ui/` — shadcn primitives

Standard Radix-based set: `button`, `input`, `textarea`, `select`, `checkbox`,
`switch`, `radio-group`, `label`, `form`, `card`, `dialog`, `sheet`, `drawer`,
`popover`, `dropdown-menu`, `tabs`, `table`, `badge`, `alert`, `avatar`, `calendar`,
`accordion`, `tooltip`, `toast`/`toaster`, `sonner`, `skeleton`, `separator`,
`scroll-area`, `progress`, `carousel`, `command`, `pagination`, `sidebar`, and more.

All styling comes from semantic design tokens in `src/index.css`. Never hardcode
`text-white` / `bg-black` / `bg-[#hex]` in a component.

---

## `src/components/shared/` — cross-module building blocks

### `DataTable`
The standard admin list surface. Handles loading, error and empty states internally.
```tsx
<DataTable
  columns={[{ key, header, render?, className? }]}
  rows={data}
  loading={isLoading}
  error={error}
  emptyMessage="No students yet"
  onRowClick={row => …}
/>
```
Always wrapped in `overflow-x-auto` for mobile.

### `DataToolbar`
Search + filter + action row that sits above a table: debounced search box
(`useDebouncedValue`), filter slots, primary action button, export menu
(CSV/PDF via `lib/export.ts`). Stacks vertically on mobile.

### `Pagination`
Page-size selector + prev/next + range label. Pairs with `DataTable`.

### `EmptyState` / `ErrorState` / `TableSkeleton`
Consistent zero-data, failure and loading presentations. `ErrorState` renders the
friendly message from `lib/errors.ts` plus a retry callback.

### `ActivityTimeline`
```tsx
<ActivityTimeline module="student.change" recordId={student.id} />
```
Renders the audit entries for one record as a vertical timeline (actor, action,
timestamp, optional diff). Drop it on any detail view.

---

## `src/components/admin/` — admin-only

| Component | Purpose |
|---|---|
| `ExecutiveKPIs` | 9 KPI tiles (students, staff, attendance %, fees collected, admission leads, upcoming events, pending leaves, pending approvals, defaulters). Uses `count:'exact', head:true` with 60s cache |
| `DashboardWidgets` | Upcoming events, pending leaves, admission follow-ups, reminders, pending approvals |
| `idcards/StudentIdCard` | Printable student ID (photo, QR, school branding) |
| `idcards/StaffIdCard` | Printable staff ID |
| `certificates/CertificateTemplate` | Bonafide / leaving / character certificate layout for PDF export |

---

## `src/components/portal/` — parent / student / teacher

Card-based, mobile-first, plain language. No tables, no charts, no ERP vocabulary.

| Component | Purpose |
|---|---|
| `StudentProfileCard` | Identity header (name, class, roll, photo) |
| `ChildSwitcher` | Parent multi-child selector, bound to `ParentContext` |
| `FeeSummaryCards` | Total / paid / due in plain language |
| `ReceiptCard` | One payment, with PDF download |
| `AttendanceCalendar` | Month grid with per-day status colours |
| `AttendanceSummary` | Present / absent / leave counts + percentage |
| `AttendanceList` | Recent day-by-day list |
| `AttendanceFilterBar` | Simple month/year selector (the only filter allowed in portals) |
| `AttendanceAnalytics` | Lightweight stat cards (not charts) |
| `ResultsView` | Exam-wise result cards |
| `ReportCard` | Printable report card (grades from `lib/grading.ts`) |
| `NoticesFeed` / `AnnouncementsFeed` / `HomeworkFeed` | Chronological feeds |
| `NotificationsList` | Unified notification feed with read state |
| `EmptyState` | Portal-flavoured empty state (distinct from the shared one) |
| `PortalSkeleton` | Portal loading placeholder |

---

## `src/components/public/` — marketing site

`Header`, `Footer`, `HeroSection` (100vh, separate mobile/desktop images),
`AboutSection`, `StatsSection` (animated counters), `ProgramsSection`,
`ExploreCampusSection`, `CollegePhotoSection`, `AutoScrollImages`,
`EventsCarousel`, `EventCard`, `MembersCarousel`, `DepartmentCard`, `FacultyCard`,
`GalleryGrid`, `ContactForm`, `FloatingWhatsApp`.

---

## Guards & utilities

| Component | Purpose |
|---|---|
| `RequireRole` | strict shell isolation by role |
| `RequirePermission` | action-based route gate |
| `NavLink` | active-aware navigation link |
| `ScrollToTop` | scrolls to top on every route change (mandatory) |
| `common/LoadingSpinner` (`PageLoader`) | full-page loading state used by guards |
| `common/Skeleton` | generic skeleton block |
| `auth/RoleSwitcher` | dev-only floating role switcher |

---

## Conventions

1. One component per file, named export matching the filename.
2. Props typed with an explicit `interface Props`; no `any` in public props.
3. Small and focused — extract when a file passes ~200 lines.
4. Loading / empty / error states are the component's responsibility, not the page's.
5. Mobile-first classes; never rely on hover to reveal essential actions.
6. Semantic tokens only for colour, spacing and shadow.
