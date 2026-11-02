/**
 * Stage-8 tests (DESIGN_BASIS.md §54): the owner's imported isometric drawings, matched to the plant model.
 * Reads the committed match (public/isometrics-imported/) and the committed ground truth.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import type { GTLine } from '../src/generator/groundtruth';
import type { ImportedIndex } from '../src/generator/imported';
import type { WorkOrder } from '../src/generator/workorders';

const pub = new URL('../public/', import.meta.url), dir = new URL('isometrics-imported/', pub);
const idx = JSON.parse(readFileSync(new URL('index.json', dir), 'utf8')) as ImportedIndex;
const match = JSON.parse(readFileSync(new URL('match.json', dir), 'utf8')) as { drawings: { drawing: string; line: string; branches: string[]; sheets: { sheet: number; welds: string[]; bom: { description: string; count: number | null; length: number | null }[] }[]; welds: { label: string; tag: string }[] }[]; findings: { level: string; code: string }[] };
const receipt = JSON.parse(readFileSync(new URL('RECEIPT.json', dir), 'utf8')) as { received: { file: string; sha256: string }[]; drawings: Record<string, { file: string; sha256: string; line: string }> };
const lines = new Map(readdirSync(new URL('groundtruth/lines/', pub)).map(f => { const L = JSON.parse(readFileSync(new URL(`groundtruth/lines/${f}`, pub), 'utf8')) as GTLine; return [L.header.line, L] as const; }));

describe('stage 8 — imported isometrics cover the plant (SW-IMP-1/2)', () => {
  it('the receipt records three parts with their SHA-256, and every per-drawing file matches its SHA-256', () => {
    expect(receipt.received.length).toBe(3);
    for (const r of receipt.received) expect(r.sha256).toMatch(/^[0-9a-f]{64}$/);
    for (const d of Object.values(receipt.drawings)) {
      const sha = createHash('sha256').update(readFileSync(new URL(d.file, dir))).digest('hex');
      expect(sha, d.file).toBe(d.sha256);
    }
  });
  it('every model line maps to one drawing, and every drawing to one model line', () => {
    expect(Object.keys(idx.lines).sort()).toEqual([...lines.keys()].sort());
    for (const [dn, d] of Object.entries(idx.drawings)) { expect(lines.has(d.line), dn).toBe(true); expect(idx.lines[d.line]).toBe(dn); }
    for (const [ln, dn] of Object.entries(idx.lines)) {
      const d = idx.drawings[dn]; expect(d, ln).toBeTruthy();
      if (d.line !== ln) { expect(d.branches, ln).toContain(ln); expect(lines.get(ln)!.header.from).toBe(`tap ${d.line}`); }
    }
    expect(idx.summary.linesCovered).toBe(lines.size);
  });
});

describe('stage 8 — the drawings agree with the model (SW-IMP-3/4)', () => {
  const allowed = new Set(['coordinate-sign', 'weld-sheet', 'weld-unlabelled', 'weld-repeated', 'end-label']);
  it('no finding contradicts the model beyond the drafting points listed in the report', () => {
    for (const f of match.findings) expect(allowed.has(f.code), `${f.code}`).toBe(true);
  });
  it('every drawing\'s bill totals equal the model\'s items and supports of the line and its branches (re-checked here)', () => {
    for (const d of match.drawings) {
      const want = new Map<string, number>(); let pipe = 0;
      for (const ln of [d.line, ...d.branches]) {
        const L = lines.get(ln)!;
        for (const it of L.items) if (it.kind === 'pipe') pipe += it.cutLength ?? 0; else want.set(it.description, (want.get(it.description) ?? 0) + 1);
        for (const s of L.supports) want.set(s.description, (want.get(s.description) ?? 0) + 1);
      }
      const got = new Map<string, number>(); let glen = 0, rows = 0;
      for (const s of d.sheets) for (const b of s.bom) { if (b.length !== null) { glen += b.length; rows++; } else got.set(b.description, (got.get(b.description) ?? 0) + (b.count ?? 0)); }
      expect(Object.fromEntries([...got].sort()), d.drawing).toEqual(Object.fromEntries([...want].sort()));
      expect(Math.abs(glen - pipe), d.drawing).toBeLessThanOrEqual(rows / 16 + 1e-6);
    }
  });
  it('every weld label on a drawing is a weld of its line or of a branch drawn on it', () => {
    for (const d of match.drawings) {
      const known = new Map(d.welds.map(w => [w.label, w.tag] as const));
      for (const s of d.sheets) for (const w of s.welds) expect(known.has(w), `${d.drawing} sheet ${s.sheet} ${w}`).toBe(true);
      const tags = new Set([d.line, ...d.branches].flatMap(ln => lines.get(ln)!.welds.map(w => w.tag)));
      expect(new Set(d.welds.map(w => w.tag))).toEqual(tags);
    }
  });
  it('the committed match equals a fresh run over the committed drawings (needs python3 with pypdf)', () => {
    const tools = spawnSync('python3', ['-I', '-c', 'import pypdf'], { encoding: 'utf8' });
    if (tools.status !== 0) return;   // python3 or pypdf absent: the SHA-256 and re-check tests above still hold
    const r = spawnSync('python3', ['-I', 'tools/isomatch.py', '--check'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
    expect(r.stdout + r.stderr).toContain('equal a fresh run');
    expect(r.status).toBe(0);
  }, 60000);
});

describe('stage 8 — fix list for the drawings\' author (SW-IMP-7)', () => {
  const fl = JSON.parse(readFileSync(new URL('fixlist.json', dir), 'utf8')) as { rules: { id: string }[]; acceptance: string[]; drawings: Record<string, { line: string; changes: { id: string; kind: string; finding: string | null; sheet: number | number[]; tag?: string; rule: string; instruction: string }[] }> };
  const changes = Object.entries(fl.drawings).flatMap(([dn, d]) => d.changes.map(c => ({ dn, ...c })));
  const weldTags = new Set([...lines.values()].flatMap(L => L.welds.map(w => w.tag)));
  it('holds one instruction for every finding', () => {
    const byCode = (xs: { code?: string; finding?: string | null }[], k: 'code' | 'finding') => xs.reduce((m, x) => m.set(x[k]!, (m.get(x[k]!) ?? 0) + 1), new Map<string, number>());
    const fromFindings = byCode(match.findings.filter(f => f.level !== 'info'), 'code');
    expect(Object.fromEntries(byCode(changes.filter(c => c.finding), 'finding'))).toEqual(Object.fromEntries(fromFindings));
  });
  it('every instruction names a drawing of the set, a sheet of it, a rule, and the weld by its model tag', () => {
    for (const c of changes) {
      const d = match.drawings.find(x => x.drawing === c.dn)!; expect(d, c.id).toBeTruthy();
      for (const k of Array.isArray(c.sheet) ? c.sheet : [c.sheet]) expect(d.sheets.some(s => s.sheet === k), c.id).toBe(true);
      expect(fl.rules.map(r => r.id), c.id).toContain(c.rule);
      if (c.kind.startsWith('weld')) expect(weldTags.has(c.tag!), c.id).toBe(true);
      expect(c.instruction.length, c.id).toBeGreaterThan(10);
    }
  });
  it('a set corrected by the fix list re-matches with no finding (self-test; needs python3 with pypdf)', () => {
    const tools = spawnSync('python3', ['-I', '-c', 'import pypdf'], { encoding: 'utf8' });
    if (tools.status !== 0) return;
    const r = spawnSync('python3', ['-I', 'tools/isomatch.py', '--selftest'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
    expect(r.stdout + r.stderr).toContain('corrected set: 0 findings, 0 changes left, coordinate sign conventional');
    expect(r.status).toBe(0);
    const p = spawnSync('python3', ['-I', '-c', "import sys; sys.path.insert(0, 'tools'); import isoparse as p; print(bool(p.WELD_LABEL.fullmatch('I-7001/W1')), bool(p.WELD_LABEL.fullmatch('W12')), p.coord('-11\\'-6\"'))"], { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
    expect(p.stdout.trim()).toBe('True True -138');
  }, 60000);
});

describe('stage 8 — links (SW-IMP-6)', () => {
  it('every work order lists the imported drawing of each of its lines, and each replaced butt weld\'s place on it', () => {
    const wos = readdirSync(new URL('workorders/', pub)).filter(f => /^WO-.*\.json$/.test(f)).map(f => JSON.parse(readFileSync(new URL(`workorders/${f}`, pub), 'utf8')) as WorkOrder);
    expect(wos.length).toBeGreaterThan(0);
    for (const w of wos) {
      const have = new Set((w.importedIsometrics ?? []).map(r => r.drawing));
      for (const ln of w.lines) expect(have.has(idx.lines[ln]), `${w.number} ${ln}`).toBe(true);
      for (const n of w.newWelds) if (n.ws !== 'WS-03') expect(n.drawingRef, `${w.number} ${n.replaces}`).toMatch(/^ISO-[A-Z]+-\d+ /);
    }
  });
  it('every stage-8 rule ID used in code is written in DESIGN_BASIS.md', () => {
    const basis = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');
    for (const f of ['src/generator/imported.ts', 'tests/stage8.test.ts', 'src/generator/woexport.ts', 'src/generator/wopack.ts', 'src/viewer/pipingView.ts', 'tools/isomatch.py', 'tools/isoparse.py']) {
      const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
      for (const id of new Set(src.match(/SW-IMP-\d+/g) ?? [])) expect(basis.includes('`' + id + '`'), `${id} in ${f}`).toBe(true);
      expect(existsSync(new URL(`../${f}`, import.meta.url))).toBe(true);
    }
  });
});
