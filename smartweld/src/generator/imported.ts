/**
 * Imported isometric drawings (stage 8, DESIGN_BASIS.md §53): the index written by tools/isomatch.py and the
 * links from lines, welds and work orders to the owner's drawings (SW-IMP-6). The drawings never change the model.
 */
export interface ImportedFinding { level: 'error' | 'warning' | 'info'; code: string; sheet?: number; message: string }
export interface ImportedIndex {
  note: string;
  summary: { drawings: number; sheets: number; linesInModel: number; linesCovered: number; matching: number; findings: Record<string, number>; byCode: Record<string, number> };
  drawings: Record<string, { line: string; file: string; sheets: number; branches: string[]; sha256: string; findings: ImportedFinding[] }>;
  /** model line -> drawing that shows it (its own, or its parent's for a small branch) */
  lines: Record<string, string>;
  /** weld tag -> its label on the drawing and the sheet that holds it */
  welds: Record<string, { drawing: string; label: string; sheet: number | null; labelled: number[] }>;
}
export interface ImportedRef { line: string; drawing: string; file: string; sheets: number; branchOf?: string; errors: number; warnings: number }

/** the imported drawing that shows a line (SW-IMP-2) */
export function importedFor(idx: ImportedIndex, line: string): ImportedRef | null {
  const dn = idx.lines[line]; if (!dn) return null;
  const d = idx.drawings[dn];
  return { line, drawing: dn, file: d.file, sheets: d.sheets, ...(d.line !== line ? { branchOf: d.line } : {}),
    errors: d.findings.filter(f => f.level === 'error').length, warnings: d.findings.filter(f => f.level === 'warning').length };
}

/** "ISO-P-1001 sh 4 W12" — where a weld is found on the imported drawing; '(no label)' when the drawing shows none */
export function weldRef(idx: ImportedIndex, tag: string): string | null {
  const w = idx.welds[tag]; if (!w) return null;
  return `${w.drawing}${w.sheet ? ` sh ${w.sheet}` : ''} ${w.labelled.length ? w.label : `(no label; ${w.label} by numbering)`}`;
}
