// Printable report-card HTML built from the generated result (single source of truth).
// Used by the Download Center for print queues and ZIP exports.

import { getConfig } from './config';
import { REPORT_TEMPLATES, type ResultSet, type StudentResult } from './types';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));

export function reportCardHtml(set: ResultSet, st: StudentResult, schoolName = 'School'): string {
  const cfg = getConfig(set.configId);
  const meta = REPORT_TEMPLATES.find(t => t.id === set.templateId) ?? REPORT_TEMPLATES[2];
  const showGpa = cfg.mode !== 'percentage';
  const rows = st.subjects.map(s => `<tr>
      <td>${esc(s.subjectName)}</td><td class="c">${s.max}</td>
      <td class="c">${s.attendance === 'present' ? s.obtained : s.attendance.toUpperCase()}</td>
      <td class="c">${s.percentage.toFixed(1)}</td><td class="c">${esc(s.grade)}</td>
      ${showGpa ? `<td class="c">${s.gradePoint}</td>` : ''}
      <td class="c">${s.passed ? 'Pass' : 'Fail'}</td></tr>`).join('');

  return `<section class="card">
    <header>
      <div><h1>${esc(schoolName)}</h1><p class="muted">${esc(meta.label)} Report Card · ${esc(set.academicYear)}</p></div>
      <div class="right"><b>${esc(set.examName)}</b><p class="muted">Card No: ${esc(st.reportCardNo)}</p></div>
    </header>
    <div class="meta">
      <span><b>Name:</b> ${esc(st.name)}</span><span><b>Admission No:</b> ${esc(st.admissionNo)}</span>
      <span><b>Roll:</b> ${esc(st.roll)}</span><span><b>Class:</b> ${esc(set.classId)}-${esc(set.section)}</span>
      <span><b>Attendance:</b> ${st.attendancePct}%</span><span><b>Report:</b> ${st.passed ? 'PASS' : 'FAIL'}</span>
    </div>
    <table><thead><tr><th>Subject</th><th>Max</th><th>Obtained</th><th>%</th><th>Grade</th>${showGpa ? '<th>GP</th>' : ''}<th>Result</th></tr></thead>
      <tbody>${rows}</tbody></table>
    <div class="grid4">
      <div class="box"><b>${st.total} / ${st.outOf}</b><p class="muted">Total</p></div>
      <div class="box"><b>${st.percentage.toFixed(2)}%</b><p class="muted">Percentage</p></div>
      <div class="box"><b>${esc(st.grade)}${showGpa ? ` · ${st.gpa.toFixed(2)}` : ''}</b><p class="muted">Grade${showGpa ? ' / GPA' : ''}</p></div>
      <div class="box"><b>#${st.classRank}</b><p class="muted">Class Rank · ${esc(st.division)}</p></div>
    </div>
    <p class="rem"><b>Teacher's Remarks:</b> ${esc(st.teacherRemarks ?? '—')}</p>
    <p class="rem"><b>Principal's Remarks:</b> ${esc(st.principalRemarks ?? '—')}</p>
    <p class="rem"><b>Promotion:</b> ${esc(st.promotion.toUpperCase())}</p>
    <div class="sign"><div>Class Teacher</div><div>Principal</div><div>Parent</div></div>
  </section>`;
}

export const REPORT_CSS = `
  @page { size: A4 portrait; margin: 12mm; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; color:#0f172a; margin:0; }
  .card { page-break-after: always; padding: 8px 0; }
  header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #0f172a; padding-bottom:8px; }
  h1 { font-size:18px; margin:0; }
  p { margin:2px 0; }
  .muted { color:#64748b; font-size:11px; }
  .right { text-align:right; font-size:12px; }
  .meta { display:grid; grid-template-columns:repeat(3,1fr); gap:4px 12px; font-size:12px; margin:10px 0; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th,td { border:1px solid #cbd5e1; padding:5px 7px; text-align:left; }
  th { background:#f1f5f9; }
  td.c { text-align:center; }
  .grid4 { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin:10px 0; }
  .box { border:1px solid #cbd5e1; border-radius:6px; padding:8px; text-align:center; font-size:13px; }
  .rem { font-size:12px; margin-top:4px; }
  .sign { margin-top:36px; display:flex; justify-content:space-between; }
  .sign div { width:150px; text-align:center; border-top:1px solid #475569; padding-top:4px; font-size:11px; }
`;

export const reportDocument = (title: string, body: string) =>
  `<!doctype html><html><head><meta charset="utf-8"/><title>${esc(title)}</title><style>${REPORT_CSS}</style></head><body>${body}</body></html>`;
