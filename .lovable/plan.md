# Phase 7.4 — Smart Timetable & Exam Scheduler

This is a large module. To ship it well without breaking existing modules, I'll build it in **3 iterative slices** on top of the existing engines (Permissions, Workflow, Notifications, Audit, Mock DB). Please confirm the slice order or tell me to compress.

## Architecture

- **Data layer**: LocalStorage collections via `src/mock/db.ts`
  - `timetables` — versioned records (draft/published/archived)
  - `timetable_templates` — reusable presets
  - `exam_schedules` — exam timetable records
  - `invigilations` — invigilator assignments
  - `rooms`, `subjects_catalog`, `teacher_availability` (seeds)
- **Engine (`src/lib/timetable/`)**
  - `types.ts` — TimetableRecord, Period, ExamSlot, Conflict, GeneratorInput
  - `generator.ts` — constraint-based scheduler (greedy + backtracking) for academic timetable
  - `examGenerator.ts` — exam date/slot allocator
  - `invigilation.ts` — balanced invigilator assignment
  - `validators.ts` — teacher/room/overlap conflict detection
  - `templates.ts` — Primary/Middle/High/5-day/6-day presets
  - `versioning.ts` — draft/publish/archive/duplicate/restore/diff
  - `api.ts` — CRUD wrapping mock db + workflow submit/publish
- **Workflow**: new modules `timetable.change`, `exam.schedule` wired into `workflowApply.ts`
- **Notifications**: reuse `notify.ts` with new events (`timetable.published`, `period.changed`, `exam.published`, `extra_class.added`)
- **Permissions**: add actions `timetable.read|write|publish`, `exam.schedule.write`, `invigilation.assign` in `permissions.ts` + role menus

## UI

- **Admin** (`/admin/timetable`)
  - Wizard (`GeneratorWizard`) — inputs → preview → conflicts → save draft/submit
  - `TimetableGrid` — drag-drop (dnd-kit) with swap/edit period modal
  - Version panel, template picker, print/export (uses `src/lib/pdf.ts`)
  - `/admin/exams/schedule` — exam wizard + invigilation planner
- **Teacher** (`/teacher/timetable`)
  - Class-scoped editor for assigned classes only, quick extra-class scheduler
  - Dashboard widgets: Today's Classes, Next Class, Upcoming Exams
- **Student / Parent** — read-only Today, Weekly, Exams, Holidays views (mobile-first)
- **Views**: Daily / Weekly / Monthly / Teacher / Class / Room / Exam / Print — all derived from same dataset via selectors

## Delivery slices

**Slice A — Core engine + academic timetable (this turn)**
- types, generator, validators, templates, versioning, api
- Admin timetable page: wizard, weekly grid (drag-drop swap), conflicts panel, versions, publish via workflow, print/PDF/CSV
- Seed: classes 1–10, sections A/B, subjects, teachers, working days, sample published weekly timetable
- Permissions + roleMenus + workflowApply integration + notifications + audit
- Student/Parent/Teacher read-only "Today/Weekly" widgets

**Slice B — Exam scheduler + invigilation**
- Exam generator, invigilation planner, admin exam page, exam view + print
- Seed: Quarterly / Half-Yearly / Annual / Monthly Test schedules
- Notifications on exam publish

**Slice C — Polish**
- Teacher class-scoped editor with extra/revision class scheduling
- Version compare/restore UI, custom template save
- Monthly + Room + Calendar views, full mobile pass

## Technical notes

- Generator uses weighted constraint satisfaction: hard constraints (teacher/room conflicts, timing) reject; soft constraints (difficulty spread, no back-to-back same subject) score candidates.
- Extensible timetable types via a registry in `types.ts` (no code change to add a new type — just register key + label).
- All writes go through workflow `submit()` when `requireApproval` flag set; else direct publish with audit entry.
- Drag-drop uses `@dnd-kit/core` (need to add).

## Confirm before I start

1. OK to ship **Slice A first** this turn, then B and C in follow-ups? (Doing all three in one turn risks a huge diff and shallow QA.)
2. OK to add `@dnd-kit/core` + `@dnd-kit/sortable` dependencies?
3. Should timetable publish **require approval** by default (workflow → pending) or publish directly with audit?
