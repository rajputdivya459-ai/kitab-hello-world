# DATABASE

Two persistence layers exist today.

- **Postgres (Supabase / Lovable Cloud)** — real domain + CMS data. Schema lives in
  `supabase/migrations/*.sql`. All tables are in `public`, RLS enabled, explicit GRANTs.
- **LocalStorage runtime DB** — governance/demo data only (mock users, workflows,
  audit log, finance ledger). See `MOCK_RUNTIME.md`.

Conventions: every table has `id uuid primary key default gen_random_uuid()` and
`created_at timestamptz default now()`; mutable tables add `updated_at`.
Field lists below name the **primary** columns, not every column.

---

## Identity & Access

### `profiles`
- **Purpose** — human-readable profile attached to a Supabase auth user.
- **Fields** — `user_id`, `full_name`, `email`, `created_at`, `updated_at`.
- **FKs** — `user_id → auth.users(id)` cascade.
- **Relationships** — 1:1 with an auth user; loosely linked to `staff.auth_user_id`.

### `user_roles`
- **Purpose** — authoritative role assignment. Roles are deliberately **not** on
  `profiles` (privilege-escalation prevention).
- **Fields** — `user_id`, `role app_role` (`admin` | `member`), unique `(user_id, role)`.
- **FKs** — `user_id → auth.users(id)` cascade.
- **Dependencies** — read by `public.has_role(uid, role)` (security definer), which
  every RLS policy uses.

### Mock identity (`erp.mock.users`, LocalStorage)
- **Purpose** — dev/demo accounts for all 7 roles.
- **Fields** — `id`, `name`, `username`, `password`, `email`, `mobile`, `role`,
  `status`, `profileType`, `profileId`, `prefs`, `context`, `lastLogin`, `createdAt`.
- **Relationships** — `profileId` points at a mock student/parent/teacher/staff id.

---

## Academic structure

### `courses`
- **Purpose** — top-level programme (college side).
- **Fields** — `name`, `description`, `is_active`.
- **Children** — `years`, `classes`.

### `years`
- **Fields** — `name`, `course_id`, `is_active`. **FK** `course_id → courses` cascade.

### `semesters`
- **Fields** — `name`, `year_id`, `is_active`. **FK** `year_id → years` cascade.

### `classes`
- **Purpose** — school-side class (e.g. "Class 10").
- **Fields** — `name`, `course_id`, `is_active`. **FK** `course_id → courses`.
- **Referenced by** — `sections`, `subjects`, `exams`, `homework`, `notices`,
  `notifications`, `calendar_events`, `teacher_assignments`.

### `sections`
- **Fields** — `name`, `class_id`, `is_active`. **FK** `class_id → classes` cascade.
- **Referenced by** — `exams`, `homework`, `notices`, `teacher_assignments`.

---

## People

### `students`
- **Purpose** — enrolled student master record and fee position.
- **Fields** — `name`, `course`, `year`, `semester`, `admission_date`,
  `total_fees`, `paid_fees`.
- **Referenced by** — `attendance`, `marks`, `student_transport`, `certificates`,
  `student_leaves`, `visitors`, `discounts`.
- **Notes** — class/section association is carried through `course/year/semester`
  plus the structure tables; portal queries scope on the student id.

### Parents
- **No dedicated Postgres table yet.** Parent identity exists only in the mock runtime
  (`mockParents` with `children: string[]`), consumed by `ParentContext` /
  `ChildSwitcher`. A `parents` + `student_parents` table is Phase 7.5 work.

### `staff`
- **Purpose** — all employees (teaching and non-teaching), incl. principal/accountant.
- **Fields** — `full_name`, `staff_code` (unique), `staff_type` (`teaching`…),
  `role` (`teacher`…), `qualification`, `experience_years`, `email`, `phone`,
  `address`, `joining_date`, `status`, `photo_url`, `auth_user_id`.
- **FKs** — `auth_user_id → auth.users(id)` set null.
- **Referenced by** — `teacher_assignments`, `staff_attendance`, `salary_structures`,
  `staff_leaves`.

### `teacher_assignments`
- **Purpose** — which teacher teaches which subject in which class/section; drives
  the Teacher portal's data scope.
- **Fields** — `staff_id`, `class_id`, `section_id`, `subject_id`, `is_class_teacher`.
- **FKs** — all four cascade to `staff`, `classes`, `sections`, `subjects`.

### `faculty` / `members`
- **Purpose** — *website* content (public faculty listing, management team). Distinct
  from `staff`, which is the ERP record.
- **faculty fields** — `name`, `designation`, `department_id`, `email`, `phone`, `bio`,
  `qualifications[]`, `photo_url`, `is_active`, `order_index`.
- **members fields** — `name`, `designation`, `role_type`
  (`principal|director|management|staff`), `photo_url`, `bio`, `email`, `phone`.

---

## Attendance

### `attendance` (students)
- **Fields** — `student_id`, `date`, `status`
  (`present|absent|leave|half_day`), `remarks`. Unique `(student_id, date)`.
- **Dependencies** — written by `/admin/attendance` and `/teacher/attendance`; read by
  parent/student portals and analytics.

### `staff_attendance`
- **Fields** — `staff_id`, `date`, `status`, `remarks`, `marked_by`.
  Unique `(staff_id, date)`. **FK** `staff_id → staff` cascade.

---

## Exams & Results

### `exams`
- **Fields** — `name`, `exam_type` (default `unit_test`), `class_id`, `section_id`,
  `start_date`, `end_date`, `academic_year`, `is_published`.
- **Notes** — `is_published` gates parent/student visibility.

### `subjects`
- **Fields** — `name`, `class_id`. Unique `(class_id, name)`.

### `exam_subjects`
- **Purpose** — subject paper within an exam.
- **Fields** — `exam_id`, `subject_id`, `max_marks`, `passing_marks`.
  Unique `(exam_id, subject_id)`; both FKs cascade.

### `marks`
- **Fields** — `exam_id`, `subject_id`, `student_id`, `marks_obtained`, `remarks`.
  Unique `(exam_id, subject_id, student_id)`.
- **Dependencies** — consumed by `lib/grading.ts` to derive grade/GPA, rendered by
  `ReportCard` / `ResultsView`.

---

## Finance

### `fees_collection`
- **Purpose** — recorded fee receipts.
- **Fields** — `amount`, `date`, `student_name`, `course`.

### `expenses`
- **Fields** — `title`, `amount`, `date`, `category`.

### `salaries`
- **Purpose** — salary payment records.
- **Fields** — `staff_name`, `designation`, `salary_amount`, `payment_date`,
  `status` (`paid|unpaid`).

### `salary_structures`
- **Purpose** — current compensation definition per employee.
- **Fields** — `staff_id`, `basic`, `hra`, `allowances`, `deductions`,
  `effective_from`. **FK** `staff_id → staff` cascade.

### `discounts`
- **Fields** — `student_id`, `amount`, `reason`.

### Receipts
- **No dedicated table.** Receipts are derived views over `fees_collection`
  (`ReceiptCard`, `ParentReceipts`) and PDF-rendered via `lib/pdf.ts`. Approved
  `finance.fee` workflows generate a receipt number into the mock `finance_ledger`.

### `finance_ledger` (LocalStorage)
- **Purpose** — side-effect ledger written by `workflowApply.ts` on approval.
- **Fields** — `id`, `ts`, `type` (`fee|expense|salary`), `amount`, `refId`, `meta`.
  Capped at 500 rows.

---

## Communication

### `notifications`
- **Fields** — `title`, `message`, `target_type` (`all|class|section|student`),
  `class_id`, `section_id`, `student_id`, `created_by`.
- **Written by** — `lib/notify.ts` only.

### `notification_reads`
- **Fields** — `notification_id`, `user_id`, `read_at`.
  Unique `(notification_id, user_id)`; FK cascades to `notifications`.

### `notices`
- **Fields** — `title`, `message`, `attachment_url`, `target_type`, `class_id`,
  `section_id`, `student_id`, `publish_date`, `is_important`, `created_by`.

### `announcements`
- **Fields** — `title`, `message`, `banner_image_url`, `publish_date`, `created_by`.

### `homework`
- **Fields** — `title`, `description`, `subject`, `class_id`, `section_id`,
  `attachment_url`, `due_date`, `created_by`.

### `contact_submissions`
- **Purpose** — public contact-form inbox (`/admin/messages`).
- **Fields** — `name`, `email`, `phone`, `subject`, `message`, `is_read`.

---

## Operations

### `transport_routes`
- **Fields** — `route_name`, `route_number` (unique), `pickup_points jsonb`,
  `monthly_fee`, `is_active`.

### `transport_vehicles`
- **Fields** — `vehicle_number` (unique), `vehicle_type`, `capacity`, `route_id`,
  `is_active`. **FK** `route_id → transport_routes`.

### `transport_drivers`
- **Fields** — `name`, `phone`, `license_number`, `vehicle_id`, `is_active`.
  **FK** `vehicle_id → transport_vehicles`.

### `student_transport`
- **Purpose** — student ↔ route allocation.
- **Fields** — `student_id` (unique), `route_id`, `pickup_point`, `transport_fee`,
  `is_active`. **FKs** → `students`, `transport_routes`.

### `certificates`
- **Fields** — `certificate_type` (enum: bonafide / leaving / character …),
  `student_id`, `certificate_number` (unique), `data jsonb`, `issued_on`,
  `issued_by`, `remarks`. **FKs** → `students`, `auth.users`.

### `student_leaves`
- **Fields** — `student_id`, `from_date`, `to_date`, `reason`,
  `status` (`pending|approved|rejected`), `reviewed_by`, `reviewed_at`.

### `staff_leaves`
- **Fields** — `staff_id`, `leave_type` (`casual`…), `from_date`, `to_date`,
  `reason`, `status`, `reviewed_by`, `reviewed_at`.

### `calendar_events`
- **Fields** — `title`, `description`, `event_type` (holiday / exam / event),
  `start_date`, `end_date`, `class_id`, `is_public`.

### `admission_inquiries`
- **Fields** — `student_name`, `parent_name`, `phone`, `email`, `interested_class`,
  `source`, `notes`, `status` (`new`…), `next_follow_up_date`.

### `visitors`
- **Fields** — `visitor_name`, `phone`, `purpose`, `student_id`, `entry_time`,
  `exit_time`, `remarks`.

### `reminders`
- **Fields** — `title`, `description`, `category`, `due_date`, `priority`,
  `status`, `created_by`.

---

## Website CMS

| Table | Primary fields |
|---|---|
| `homepage_content` | `section_key` (unique), `title`, `subtitle`, `content`, `image_url`, `cta_text`, `cta_link`, `order_index`, `is_active` |
| `about_section` | `section_key` (unique), `title`, `content`, `image_url`, `order_index` |
| `departments` | `name`, `description`, `icon`, `courses[]`, `head_of_department`, `image_url`, `is_active`, `order_index` |
| `events` | `title`, `description`, `event_date`, `end_date`, `location`, `image_url`, `is_featured`, `is_active` |
| `gallery` | `title`, `caption`, `image_url`, `category`, `is_featured`, `order_index` |
| `stats` | `label`, `value`, `icon`, `order_index`, `is_active` |
| `site_settings` | `setting_key` (unique), `setting_value`, `setting_type`, `category`, `label` |
| `social_links` | `platform_name`, `url`, `icon`, `order_index`, `is_active` |
| `explore_videos` | `title`, `youtube_url`, `is_active`, `order_index` |
| `programs_activities` | `title`, `description`, `icon`, `is_active`, `order_index` |

---

## Governance (LocalStorage)

### `workflows` (`erp.mock.workflows`)
- **Fields** — `id`, `module`, `recordId`, `title`, `status`, `createdBy`,
  `submittedBy`, `approvedBy`, `rejectedBy`, `createdAt`, `submittedAt`,
  `decidedAt`, `remarks`, `before`, `after`, `meta`.
- **Modules** — `finance.fee`, `finance.expense`, `finance.salary`,
  `student.change`, `staff.change`, `result`, `homework`, `leave`, `other`.

### `audit_log` (`erp.mock.audit_log`)
- **Fields** — `id`, `userId`, `userName`, `role`, `module`, `action`, `recordId`,
  `before`, `after`, `meta`, `ip` (mocked `127.0.0.1`), `status`, `ts`.
- **Cap** — most recent 500 entries.

Both are targeted for migration to Postgres in Phase 7.4.
