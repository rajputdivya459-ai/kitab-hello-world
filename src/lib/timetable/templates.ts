import type { GeneratorInput, Weekday } from './types';

export interface TimetableTemplate {
  key: string;
  label: string;
  description: string;
  defaults: Partial<GeneratorInput> & { workingDays: Weekday[] };
}

export const TEMPLATES: TimetableTemplate[] = [
  {
    key: 'primary_5day',
    label: 'Primary · 5-day',
    description: 'Classes 1–5, Mon–Fri, 8 periods, 2 breaks',
    defaults: {
      workingDays: ['Mon','Tue','Wed','Thu','Fri'],
      startTime: '08:30', endTime: '14:30',
      periodDuration: 40, breakDuration: 15, breakCount: 2,
    },
  },
  {
    key: 'middle_6day',
    label: 'Middle · 6-day',
    description: 'Classes 6–8, Mon–Sat, 8 periods',
    defaults: {
      workingDays: ['Mon','Tue','Wed','Thu','Fri','Sat'],
      startTime: '08:00', endTime: '14:30',
      periodDuration: 45, breakDuration: 15, breakCount: 2,
    },
  },
  {
    key: 'high_6day',
    label: 'High School · 6-day',
    description: 'Classes 9–10, Mon–Sat, 9 periods',
    defaults: {
      workingDays: ['Mon','Tue','Wed','Thu','Fri','Sat'],
      startTime: '07:45', endTime: '14:45',
      periodDuration: 45, breakDuration: 15, breakCount: 2,
    },
  },
  {
    key: 'exam_daily',
    label: 'Examination · Daily',
    description: 'Single exam per day, 3-hour slot',
    defaults: {
      workingDays: ['Mon','Tue','Wed','Thu','Fri','Sat'],
      startTime: '09:30', endTime: '12:30',
      periodDuration: 180, breakDuration: 0, breakCount: 0,
    },
  },
];

export function getTemplate(key?: string) {
  return TEMPLATES.find(t => t.key === key);
}
