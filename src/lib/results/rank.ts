// Rank generation & merit lists. Tie resolution is configurable.

import type { ResultConfig, StudentResult, ResultSet, TieBreaker } from './types';

function compare(a: StudentResult, b: StudentResult, cfg: ResultConfig): number {
  for (const rule of cfg.tieBreakers) {
    const d = applyRule(rule, a, b, cfg);
    if (d !== 0) return d;
  }
  return 0;
}

function applyRule(rule: TieBreaker, a: StudentResult, b: StudentResult, cfg: ResultConfig): number {
  switch (rule) {
    case 'higher_total': return b.total - a.total;
    case 'higher_subject_marks': {
      for (const sub of cfg.prioritySubjects) {
        const av = a.subjects.find(s => s.subjectName === sub)?.obtained ?? 0;
        const bv = b.subjects.find(s => s.subjectName === sub)?.obtained ?? 0;
        if (bv !== av) return bv - av;
      }
      return 0;
    }
    case 'better_attendance': return b.attendancePct - a.attendancePct;
    case 'alphabetical': return a.name.localeCompare(b.name);
    case 'same_rank': return 0;
    default: return 0;
  }
}

/** Assigns 1..n ranks; equal percentage + unresolved ties share a rank. */
export function assignRanks(
  students: StudentResult[],
  cfg: ResultConfig,
  field: 'sectionRank' | 'classRank' | 'schoolRank',
) {
  const sorted = [...students].sort((a, b) => (b.percentage - a.percentage) || compare(a, b, cfg));
  let rank = 0, prev: StudentResult | null = null;
  sorted.forEach((s, i) => {
    const tied = prev && prev.percentage === s.percentage && compare(prev, s, cfg) === 0;
    rank = tied ? rank : i + 1;
    s[field] = rank;
    prev = s;
  });
}

/** Recomputes section / class / school ranks across all sets of one exam. */
export function recomputeRanks(sets: ResultSet[], cfg: ResultConfig): ResultSet[] {
  sets.forEach(set => assignRanks(set.students, cfg, 'sectionRank'));

  const byClass = new Map<string, StudentResult[]>();
  sets.forEach(set => {
    const arr = byClass.get(set.classId) ?? [];
    arr.push(...set.students);
    byClass.set(set.classId, arr);
  });
  byClass.forEach(arr => assignRanks(arr, cfg, 'classRank'));

  assignRanks(sets.flatMap(s => s.students), cfg, 'schoolRank');
  return sets;
}

export interface MeritEntry {
  rank: number; studentId: string; name: string; roll: string; admissionNo: string;
  classId: string; section: string; percentage: number; gpa: number; grade: string; total: number; outOf: number;
}

export function meritList(sets: ResultSet[], topN: number): MeritEntry[] {
  const rows = sets.flatMap(set => set.students.map(s => ({
    rank: s.schoolRank, studentId: s.studentId, name: s.name, roll: s.roll, admissionNo: s.admissionNo,
    classId: set.classId, section: set.section, percentage: s.percentage, gpa: s.gpa, grade: s.grade,
    total: s.total, outOf: s.outOf,
  })));
  return rows.sort((a, b) => a.rank - b.rank || b.percentage - a.percentage).slice(0, topN);
}

export interface SubjectTopper {
  subject: string; name: string; classId: string; section: string; marks: number; max: number; percentage: number;
}

export function subjectToppers(sets: ResultSet[]): SubjectTopper[] {
  const map = new Map<string, SubjectTopper>();
  sets.forEach(set => set.students.forEach(st => st.subjects.forEach(sub => {
    const cur = map.get(sub.subjectName);
    if (!cur || sub.percentage > cur.percentage) {
      map.set(sub.subjectName, {
        subject: sub.subjectName, name: st.name, classId: set.classId, section: set.section,
        marks: sub.obtained, max: sub.max, percentage: sub.percentage,
      });
    }
  })));
  return [...map.values()].sort((a, b) => a.subject.localeCompare(b.subject));
}

export function classToppers(sets: ResultSet[]): MeritEntry[] {
  const byClass = new Map<string, MeritEntry[]>();
  meritList(sets, Number.MAX_SAFE_INTEGER).forEach(e => {
    const arr = byClass.get(e.classId) ?? [];
    arr.push(e); byClass.set(e.classId, arr);
  });
  return [...byClass.values()].map(arr => arr.sort((a, b) => b.percentage - a.percentage)[0]).filter(Boolean);
}

export function sectionToppers(sets: ResultSet[]): MeritEntry[] {
  return sets.map(set => {
    const top = [...set.students].sort((a, b) => b.percentage - a.percentage)[0];
    if (!top) return null;
    return {
      rank: 1, studentId: top.studentId, name: top.name, roll: top.roll, admissionNo: top.admissionNo,
      classId: set.classId, section: set.section, percentage: top.percentage, gpa: top.gpa,
      grade: top.grade, total: top.total, outOf: top.outOf,
    } as MeritEntry;
  }).filter(Boolean) as MeritEntry[];
}
