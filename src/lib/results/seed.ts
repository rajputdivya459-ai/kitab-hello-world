// Demo data bootstrap — generates result sets from the seeded approved marks
// using the real engine, then walks them through the workflow so every portal
// has meaningful draft / submitted / approved / published / archived data.

import { getCollection } from '@/mock/db';
import * as api from '@/lib/results/api';
import { listSheets } from '@/lib/marks/api';
import type { ResultSet } from './types';

const FLAG = 'erp.mock.results_seeded';

export function ensureDemoResults(force = false) {
  try {
    if (!force && localStorage.getItem(FLAG) === '1') return;
    if (!getCollection('marks_roster').length || !listSheets().length) return;
    if (!force && api.listSets().length) { localStorage.setItem(FLAG, '1'); return; }

    const targets = api.generatableTargets();
    if (!targets.length) return;
    targets.forEach(t => api.generateResults(t));

    // Spread lifecycle states across the generated sets.
    const sets = api.listSets();
    const remarkPool = ['Consistent performer.', 'Needs focus in weaker subjects.', 'Excellent improvement this term.', 'Regular practice recommended.'];
    sets.forEach((s: ResultSet, i: number) => {
      s.students.forEach((st, j) => {
        st.teacherRemarks = st.teacherRemarks || remarkPool[(i + j) % remarkPool.length];
        st.principalRemarks = st.principalRemarks || (st.passed ? 'Promoted to the next class.' : 'Requires remedial support.');
      });
      api.saveSet(s);

      const mode = i % 4;
      if (mode === 0) { api.submitSet(s.id); api.approveSet(s.id, 'Verified against approved marks.'); api.publishSet(s.id); }
      else if (mode === 1) { api.submitSet(s.id); api.approveSet(s.id, 'Approved by principal.'); }
      else if (mode === 2) { api.submitSet(s.id); }
    });

    localStorage.setItem(FLAG, '1');
  } catch {
    // demo bootstrap is best-effort
  }
}

export function resetDemoResults() {
  localStorage.removeItem(FLAG);
  ensureDemoResults(true);
}
