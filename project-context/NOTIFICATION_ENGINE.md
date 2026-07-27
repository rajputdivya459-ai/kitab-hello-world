# NOTIFICATION ENGINE

File: `src/lib/notify.ts` · Storage: Postgres `notifications` + `notification_reads`

One outbound path for every in-app message. Modules never insert into `notifications`
directly — they call a helper.

## Core

```ts
notify({ title, message, target_type, class_id?, section_id?, student_id? })
```

- `target_type`: `all` | `class` | `section` | `student`
- Inserts one row into `public.notifications` with `created_by` = current user.
- **Fire-and-forget**: all errors are caught and logged, never thrown. A failed
  notification must not break the business action that triggered it.

## Audience helpers

| Helper | Target |
|---|---|
| `notifyAll(title, message)` | whole institution |
| `notifyClass(classId, title, message)` | one class |
| `notifySection(sectionId, title, message)` | one section |
| `notifyStudent(studentId, title, message)` | one student (and their parent) |

## Domain helpers

| Helper | Fired from | Audience |
|---|---|---|
| `notifyFeePaid` | `AdminFinance`, approved `finance.fee` workflow | student |
| `notifyAttendanceMarked` | `AdminAttendance`, `TeacherAttendance` | section |
| `notifyStudentAbsent` | attendance marking | student |
| `notifyResultPublished` | `AdminExams` / `AdminResults` publish | class or section |
| `notifyHomeworkAssigned` | `AdminHomework`, `TeacherHomework` | class or section |
| `notifyNoticePublished` | `AdminNotices` | per notice target |
| `notifyTransportAssigned` | `AdminTransport` | student |
| `notifyLeaveDecision` | `AdminLeaves`, approved `leave` workflow | student / staff |
| `notifyInquiryCreated` | `AdminInquiries` | admin audience |
| `notifyWorkflowDecision` | Approval Center | requester |

## Trigger map

```text
Finance      fee recorded / fee workflow approved   → notifyFeePaid
Attendance   day marked                             → notifyAttendanceMarked
             student marked absent                  → notifyStudentAbsent
Exams        results published                      → notifyResultPublished
Homework     assignment created                     → notifyHomeworkAssigned
Notices      notice published                       → notifyNoticePublished
Transport    route assigned                         → notifyTransportAssigned
Leaves       approved / rejected                    → notifyLeaveDecision
Admissions   new inquiry                            → notifyInquiryCreated
Workflow     approved / rejected                    → notifyWorkflowDecision
```

## Consumption

- **Admin** — `/admin/notifications` (Notification Centre) lists and composes.
- **Portals** — `NotificationsList`, `NoticesFeed`, `AnnouncementsFeed`,
  `HomeworkFeed` render the feeds; parent/student dashboards show the latest items.
- **Read state** — `notification_reads` (unique per `notification_id` + `user_id`)
  drives unread badges.

## Rules

1. Never call `supabase.from('notifications').insert(...)` from a page — use `notify()`.
2. Notifications are side effects: never `await` them in a way that can block or fail
   the primary mutation.
3. Message text is user-facing — plain language, no ERP jargon, since parents and
   students read the same rows.
4. Prefer the narrowest audience that is correct (`student` over `class` over `all`).

## Not implemented yet

Email, SMS and WhatsApp delivery, scheduling/digests, per-user channel preferences
(the `prefs` field on mock users is UI-only), and push notifications. Planned for
Phase 9/10 — see `ROADMAP.md`.
