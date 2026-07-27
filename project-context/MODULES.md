# MODULES

Each module below lists: purpose, pages, key components, data sources, and the
roles that can reach it.

---

## 1. Website CMS

- **Purpose** — let non-technical staff edit every public page.
- **Admin pages** — `AdminHomepage`, `AdminAbout`, `AdminStats`, `AdminDepartments`,
  `AdminMembers`, `AdminFaculty`, `AdminEvents`, `AdminGallery`, `AdminSocialLinks`,
  `AdminExploreVideos`, `AdminPrograms`, `AdminSettings`.
- **Public pages** — `Index`, `Departments`, `Faculty`, `Events`, `Gallery`, `Contact`.
- **Components** — `src/components/public/*` (HeroSection, AboutSection, StatsSection,
  ProgramsSection, ExploreCampusSection, EventsCarousel, MembersCarousel,
  GalleryGrid, DepartmentCard, FacultyCard, Header, Footer, FloatingWhatsApp).
- **Data** — `homepage_content`, `about_section`, `stats`, `departments`, `members`,
  `faculty`, `events`, `gallery`, `social_links`, `explore_videos`,
  `programs_activities`, `site_settings`.
- **Roles** — admin only (`website.write`, `settings.write`).
- **Notes** — all media is referenced by **external URL**; no local assets, no Storage.

## 2. Course Structure

- **Purpose** — define Course → Year → Semester (college) and Class → Section (school).
- **Page** — `AdminCourseStructure`. **Hook** — `useCourseStructure`.
- **Data** — `courses`, `years`, `semesters`, `classes`, `sections`.
- **Roles** — admin (`settings.write`).
- **Dependency** — nearly every academic module scopes on `class_id` / `section_id`.

## 3. Student Management

- **Purpose** — student master, enrolment and fee position.
- **Pages** — `AdminStudents` (CRUD + toolbar/table/pagination/export),
  `AdminStudentRequests` (workflow-gated changes to sensitive fields).
- **Data** — `students`, `discounts`; workflow module `student.change`.
- **Roles** — admin (write), principal/accountant/teacher (read).
- **Workflow** — sensitive edits go draft → pending → approved, then
  `workflowApply.ts` writes the new values and fires a notification.

## 4. Attendance

- **Purpose** — daily student attendance plus history and analytics.
- **Pages** — `AdminAttendance` (bulk mark by class/section, statuses
  present/absent/leave/half-day), `TeacherAttendance` (own sections only),
  `ParentAttendance`, `StudentAttendance`.
- **Components** — `AttendanceCalendar`, `AttendanceSummary`, `AttendanceList`,
  `AttendanceFilterBar` (month/year), `AttendanceAnalytics`.
- **Data** — `attendance` (unique per student+date).
- **Roles** — admin/teacher write; principal read; parent/student read own.
- **Notifications** — `notifyAttendanceMarked`, absent-student alerts.

## 5. Exams & Results

- **Purpose** — exam scheduling, marks entry, grading, report cards.
- **Pages** — `AdminExams`, `AdminResults`, `TeacherMarks`, `ParentResults`,
  `StudentResults`.
- **Components** — `ReportCard`, `ResultsView`. **Logic** — `lib/grading.ts`.
- **Data** — `exams`, `subjects`, `exam_subjects`, `marks`.
- **Roles** — admin/teacher write; principal read; parent/student read own.
- **Gate** — results are invisible to portals until `exams.is_published` is true;
  publishing fires `notifyResultPublished`.

## 6. Finance

- **Purpose** — fee collection, expenses, salaries, receipts, defaulters.
- **Pages** — `AdminFinance` (5-tab dashboard), `AdminFinanceRequests`
  (workflow submission for fee/expense/salary), `AdminDefaulters`,
  `AccountantDashboard`, `ParentFees`, `ParentReceipts`, `StudentFees`.
- **Components** — `FeeSummaryCards`, `ReceiptCard`. **Utils** — `lib/pdf.ts`,
  `lib/export.ts`.
- **Data** — `fees_collection`, `expenses`, `salaries`, `salary_structures`,
  `discounts`, `students.total_fees/paid_fees`; mock `finance_ledger`.
- **Roles** — admin + accountant write; principal has no finance access;
  parent/student read own position only, in plain language (no ERP terms).
- **Workflow** — every finance entry posts only after approval.

## 7. Staff Management

- **Purpose** — employee directory, assignments, attendance, compensation.
- **Pages** — `AdminStaff`, `AdminTeacherAssignments`, `AdminStaffAttendance`.
- **Data** — `staff`, `teacher_assignments`, `staff_attendance`, `salary_structures`,
  `staff_leaves`.
- **Roles** — admin write; principal read.
- **Dependency** — `teacher_assignments` defines the Teacher portal's data scope.

## 8. Communication

- **Purpose** — notices, announcements, homework, notifications, contact inbox.
- **Pages** — `AdminNotices`, `AdminAnnouncements`, `AdminHomework`,
  `AdminNotifications`, `AdminMessages`, `TeacherHomework`, `TeacherNotices`,
  `ParentNotices`, `StudentNotices`.
- **Components** — `NoticesFeed`, `AnnouncementsFeed`, `HomeworkFeed`,
  `NotificationsList`.
- **Data** — `notices`, `announcements`, `homework`, `notifications`,
  `notification_reads`, `contact_submissions`.
- **Targeting** — `all | class | section | student`.

## 9. Transport

- **Purpose** — routes, vehicles, drivers, student allocation.
- **Pages** — `AdminTransport` (tabbed), `ParentTransport`.
- **Data** — `transport_routes`, `transport_vehicles`, `transport_drivers`,
  `student_transport`.
- **Roles** — admin + front-desk staff; parent reads own child's route.

## 10. ID Cards & Certificates

- **Purpose** — printable student/staff IDs and official certificates.
- **Pages** — `AdminIdCards` (bulk), `AdminCertificates` (live preview + history).
- **Components** — `StudentIdCard`, `StaffIdCard`, `CertificateTemplate`.
- **Libraries** — `jspdf`, `html2canvas`, `qrcode.react` via `lib/pdf.ts`.
- **Data** — `certificates` (+ `students`, `staff`).

## 11. Operations & Automation

- **Purpose** — leaves, calendar, admissions CRM, visitors, reminders.
- **Pages** — `AdminLeaves`, `AdminCalendar`, `AdminInquiries`, `AdminVisitors`,
  `AdminReminders`.
- **Data** — `student_leaves`, `staff_leaves`, `calendar_events`,
  `admission_inquiries`, `visitors`, `reminders`.
- **Roles** — admin, principal (approvals), staff (front desk).
- **Widgets** — surfaced on the admin dashboard by `DashboardWidgets`.

## 12. Analytics & Dashboards

- **Purpose** — executive KPIs and operational insight (admin family only).
- **Pages** — `Dashboard` (admin), `PrincipalDashboard`, `AccountantDashboard`,
  `StaffDashboard`, `AdminAnalytics`.
- **Components** — `ExecutiveKPIs` (9 tiles), `DashboardWidgets`.
- **Notes** — charts (`recharts`) are **admin-side only**; portals never render charts.

## 13. Identity & Access

- **Purpose** — manage demo/dev accounts and role assignment.
- **Page** — `AdminIdentity` (CRUD, status, password reset, profile linking).
- **Runtime** — `mock/users.ts`, `auth/mockAuth.ts`, `SessionProvider`, `RoleSwitcher`.
- **Postgres** — `profiles`, `user_roles`, `has_role()`.
- **Roles** — admin only (`identity.read` / `identity.write`).

## 14. Workflow & Approvals

- **Purpose** — draft → submit → approve/reject lifecycle for sensitive changes.
- **Pages** — `AdminApprovals` (Approval Center with JSON diffs), plus module
  submission pages (`AdminStudentRequests`, `AdminFinanceRequests`).
- **Engine** — `lib/workflow.ts`; side effects in `lib/workflowApply.ts`.
- **Roles** — admin, principal, accountant (`approvals.read/write`).
- Detail: `WORKFLOW_ENGINE.md`.

## 15. Audit Trail

- **Purpose** — immutable-ish record of who changed what.
- **Page** — `AdminAuditLog` (search + CSV export).
- **Component** — `ActivityTimeline` (per-record history embedded in modules).
- **Engine** — `lib/audit.ts` (500-entry cap).
- **Roles** — admin, principal, accountant (`audit.read`).

## 16. Portals

- **Teacher** — `TeacherShell`; dashboard, classes, attendance, marks, homework,
  notices, profile. Scoped by `teacher_assignments`.
- **Parent** — `ParentShell`; dashboard, fees, receipts, attendance, results, notices,
  transport, profile. `ChildSwitcher` + `ParentContext` for multi-child families.
- **Student** — `StudentShell`; dashboard, attendance, fees, results, notices, profile.
- **UX contract** — card-based, mobile-first, plain language, no admin components,
  no charts, no dense tables, no complex filters.
