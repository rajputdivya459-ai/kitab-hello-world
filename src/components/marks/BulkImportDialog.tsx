import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { parseBulkText } from '@/lib/marks/api';
import type { MarksSheet, MarksRow } from '@/lib/marks/types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sheet: MarksSheet;
  onApply: (rows: MarksRow[], summary: string) => void;
}

/** Bulk paste / CSV import: Roll, [Name], component columns… or A / M / E flags. */
export function BulkImportDialog({ open, onOpenChange, sheet, onApply }: Props) {
  const [text, setText] = useState('');
  const active = sheet.components.filter(c => c.enabled);

  const apply = () => {
    const { updated, matched, skipped } = parseBulkText(text, sheet.components, sheet.rows);
    onApply(updated, `${matched} row(s) imported${skipped.length ? `, ${skipped.length} unmatched` : ''}`);
    setText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Import / Paste Marks</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">
          One row per student. First column = Roll No or Admission No, then{' '}
          <strong>{active.map(c => c.label).join(', ')}</strong>. Use <code>A</code>, <code>M</code> or <code>E</code>{' '}
          for Absent / Medical / Exempt. Tab, comma or semicolon separated — paste straight from Excel.
        </p>
        <pre className="text-[11px] bg-muted rounded p-2 overflow-x-auto">01{'\t'}{active.map(c => Math.round(c.max * 0.8)).join('\t')}{'\n'}02{'\t'}A</pre>
        <Textarea rows={10} value={text} onChange={e => setText(e.target.value)} placeholder="Paste rows here…" className="font-mono text-xs" />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={apply} disabled={!text.trim()}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
