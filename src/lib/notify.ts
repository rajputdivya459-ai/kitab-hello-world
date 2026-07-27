import { supabase } from '@/integrations/supabase/client';

export type NotifyTargetType = 'all' | 'class' | 'section' | 'student';
export type NotifyCategory =
  | 'general' | 'fee' | 'result' | 'attendance' | 'homework'
  | 'notice' | 'event' | 'leave' | 'inquiry' | 'transport';

export interface NotifyInput {
  title: string;
  message: string;
  target_type?: NotifyTargetType;
  class_id?: string | null;
  section_id?: string | null;
  student_id?: string | null;
  category?: NotifyCategory;
}

/**
 * Single entry point for outbound notifications. Inserts one row into
 * `notifications` — downstream readers filter by target_type/scope.
 * Errors are swallowed so secondary failures don't break the primary action.
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    const title = input.category && input.category !== 'general'
      ? `[${input.category.toUpperCase()}] ${input.title}`
      : input.title;
    const payload = {
      title,
      message: input.message,
      target_type: input.target_type ?? 'all',
      class_id: input.class_id ?? null,
      section_id: input.section_id ?? null,
      student_id: input.student_id ?? null,
    };
    await (supabase as any).from('notifications').insert([payload]);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('notify() failed', e);
  }
}

// ---------- Audience helpers ----------

export const notifyAll = (i: Omit<NotifyInput, 'target_type'>) =>
  notify({ ...i, target_type: 'all' });

export const notifyClass = (class_id: string, i: Omit<NotifyInput, 'target_type' | 'class_id'>) =>
  notify({ ...i, target_type: 'class', class_id });

export const notifySection = (section_id: string, i: Omit<NotifyInput, 'target_type' | 'section_id'>) =>
  notify({ ...i, target_type: 'section', section_id });

export const notifyStudent = (student_id: string, i: Omit<NotifyInput, 'target_type' | 'student_id'>) =>
  notify({ ...i, target_type: 'student', student_id });

// ---------- Domain event shortcuts ----------

export const notifyAttendanceMarked = (section_id: string, date: string) =>
  notifySection(section_id, {
    title: 'Attendance marked',
    message: `Attendance has been marked for ${date}.`,
    category: 'attendance',
  });

export const notifyStudentAbsent = (student_id: string, date: string) =>
  notifyStudent(student_id, {
    title: 'Marked absent',
    message: `Your child was marked absent on ${date}.`,
    category: 'attendance',
  });

export const notifyFeePaid = (student_id: string, amount: number, receipt?: string) =>
  notifyStudent(student_id, {
    title: 'Fee payment received',
    message: `Payment of ₹${amount.toLocaleString('en-IN')} recorded${receipt ? ` (Receipt ${receipt})` : ''}.`,
    category: 'fee',
  });

export const notifyResultPublished = (class_id: string, examName: string) =>
  notifyClass(class_id, {
    title: 'Results published',
    message: `Results for ${examName} are now available.`,
    category: 'result',
  });

export const notifyHomeworkAdded = (section_id: string, subject: string, due?: string) =>
  notifySection(section_id, {
    title: `New homework: ${subject}`,
    message: due ? `Due on ${due}.` : 'Please check the portal.',
    category: 'homework',
  });

export const notifyLeaveDecision = (student_id: string | null, status: 'approved' | 'rejected', fromDate: string, toDate: string) => {
  if (!student_id) return Promise.resolve();
  return notifyStudent(student_id, {
    title: `Leave ${status}`,
    message: `Your leave request from ${fromDate} to ${toDate} was ${status}.`,
    category: 'leave',
  });
};

export const notifyNewInquiry = (name: string) =>
  notifyAll({
    title: 'New admission inquiry',
    message: `${name} has submitted an admission inquiry.`,
    category: 'inquiry',
  });

export const notifyTransportAssigned = (student_id: string, routeName: string) =>
  notifyStudent(student_id, {
    title: 'Transport route assigned',
    message: `You have been assigned to route: ${routeName}.`,
    category: 'transport',
  });
