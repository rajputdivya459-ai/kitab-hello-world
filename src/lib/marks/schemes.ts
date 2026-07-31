// Configurable marking schemes. No hardcoded calculation anywhere else —
// totals are always derived from the sheet's ComponentConfig[].

import type { AssessmentComponentId, ComponentConfig } from './types';

export interface MarkingScheme {
  id: string;
  label: string;
  description: string;
  parts: Array<{ id: AssessmentComponentId; max: number; required?: boolean; decimals?: number }>;
}

export const MARKING_SCHEMES: MarkingScheme[] = [
  { id: 'full_100',      label: '100 Marks (Theory)', description: 'Theory 100',              parts: [{ id: 'theory', max: 100, required: true }] },
  { id: 'split_80_20',   label: '80 + 20',            description: 'Theory 80 · Internal 20', parts: [{ id: 'theory', max: 80, required: true }, { id: 'internal', max: 20, required: true }] },
  { id: 'split_70_30',   label: '70 + 30',            description: 'Theory 70 · Practical 30',parts: [{ id: 'theory', max: 70, required: true }, { id: 'practical', max: 30, required: true }] },
  { id: 'split_50_50',   label: '50 + 50',            description: 'Theory 50 · Practical 50',parts: [{ id: 'theory', max: 50, required: true }, { id: 'practical', max: 50, required: true }] },
  { id: 'practical_only',label: 'Practical Only',     description: 'Practical 100',           parts: [{ id: 'practical', max: 100, required: true }] },
  { id: 'theory_only',   label: 'Theory Only',        description: 'Theory 50',               parts: [{ id: 'theory', max: 50, required: true }] },
  { id: 'internal_only', label: 'Internal Only',      description: 'Internal 25',             parts: [{ id: 'internal', max: 25, required: true }] },
  {
    id: 'comprehensive', label: 'Comprehensive', description: 'Theory 50 · Practical 20 · Internal 10 · Project 10 · Viva 10',
    parts: [
      { id: 'theory', max: 50, required: true }, { id: 'practical', max: 20, required: true },
      { id: 'internal', max: 10, required: true }, { id: 'project', max: 10 }, { id: 'viva', max: 10 },
    ],
  },
  { id: 'custom', label: 'Custom', description: 'Admin-defined components', parts: [{ id: 'theory', max: 100, required: true }] },
];

export const getScheme = (id: string) => MARKING_SCHEMES.find(s => s.id === id) ?? MARKING_SCHEMES[0];

const LABELS: Record<AssessmentComponentId, string> = {
  theory: 'Theory', practical: 'Practical', viva: 'Viva', internal: 'Internal',
  project: 'Project', assignment: 'Assignment', oral: 'Oral',
};

export function componentsFromScheme(schemeId: string): ComponentConfig[] {
  return getScheme(schemeId).parts.map(p => ({
    id: p.id,
    label: LABELS[p.id],
    max: p.max,
    required: p.required ?? false,
    decimals: p.decimals ?? 0,
    enabled: true,
  }));
}

export const schemeMaxTotal = (components: ComponentConfig[]) =>
  components.filter(c => c.enabled).reduce((s, c) => s + c.max, 0);
