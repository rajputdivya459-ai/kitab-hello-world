import jsPDF from 'jspdf';

export interface ExportColumn<T = any> {
  key: string;
  label: string;
  /** Optional value extractor; falls back to row[key]. */
  get?: (row: T) => any;
}

function val<T>(row: T, col: ExportColumn<T>): string {
  const raw = col.get ? col.get(row) : (row as any)[col.key];
  if (raw === null || raw === undefined) return '';
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  return String(raw);
}

function csvEscape(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Download `rows` as a CSV file. Excel opens CSV natively. */
export function exportCSV<T>(filename: string, rows: T[], columns: ExportColumn<T>[]) {
  const header = columns.map(c => csvEscape(c.label)).join(',');
  const body = rows.map(r => columns.map(c => csvEscape(val(r, c))).join(',')).join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/** Download `rows` as a simple tabular PDF. */
export function exportPDF<T>(filename: string, title: string, rows: T[], columns: ExportColumn<T>[]) {
  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32;
  doc.setFontSize(14); doc.text(title, margin, margin);
  doc.setFontSize(9); doc.setTextColor(120); doc.text(new Date().toLocaleString(), pageW - margin, margin, { align: 'right' });
  doc.setTextColor(0);

  const colW = (pageW - margin * 2) / columns.length;
  let y = margin + 24;
  doc.setFont(undefined, 'bold');
  columns.forEach((c, i) => doc.text(c.label.slice(0, 24), margin + i * colW, y));
  doc.setFont(undefined, 'normal');
  y += 14;
  doc.setDrawColor(220); doc.line(margin, y - 8, pageW - margin, y - 8);

  rows.forEach(r => {
    if (y > pageH - margin) { doc.addPage(); y = margin; }
    columns.forEach((c, i) => doc.text(val(r, c).slice(0, 28), margin + i * colW, y));
    y += 14;
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
