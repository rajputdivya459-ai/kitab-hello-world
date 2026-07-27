import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function nodeToPdf(node: HTMLElement, filename: string, orientation: 'p' | 'l' = 'p') {
  const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  pdf.addImage(imgData, 'PNG', (pageW - w) / 2, (pageH - h) / 2, w, h);
  pdf.save(filename);
}

export async function nodesToMultiPagePdf(nodes: HTMLElement[], filename: string) {
  const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  for (let i = 0; i < nodes.length; i++) {
    const canvas = await html2canvas(nodes[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', (pageW - w) / 2, 24, w, h);
  }
  pdf.save(filename);
}

export function printNode(node: HTMLElement) {
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) return;
  const styles = Array.from(document.querySelectorAll('style,link[rel="stylesheet"]'))
    .map((el) => el.outerHTML).join('\n');
  w.document.write(`<!doctype html><html><head>${styles}<title>Print</title></head><body>${node.outerHTML}</body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); w.close(); }, 400);
}
