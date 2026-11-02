/**
 * Exchange package for a piping designer (DESIGN_BASIS.md §58, SW-XCH-1..5): rebuilt fresh, then checked.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = new URL('../', import.meta.url), dir = new URL('downloads/designer-package/', root);
const parse = (t: string) => { const rows: string[][] = []; let row: string[] = [], cell = '', q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === '"' && t[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; } else cell += c; }
  const [h, ...rs] = rows; return rs.map(r => Object.fromEntries(h.map((k, i) => [k, r[i]]))); };
const read = (f: string) => parse(readFileSync(new URL(f, dir), 'utf8'));

describe('exchange package for a piping designer (SW-XCH-1..5)', () => {
  it('builds from the model', () => {
    const r = spawnSync('npx', ['vite-node', 'tools/designer-package.ts'], { cwd: root, encoding: 'utf8' });
    expect(r.status, r.stderr).toBe(0);
    expect(existsSync(new URL('downloads/designer-package.zip', root))).toBe(true);
  }, 300000);
  it('holds every line, component, weld and support of the model (SW-XCH-1)', () => {
    const idx = JSON.parse(readFileSync(new URL('public/groundtruth/index.json', root), 'utf8'));
    expect(read('lines.csv').length).toBe(idx.lines.length);
    const items = idx.lines.reduce((n: number, l: { items: number }) => n + l.items, 0), nozzles = JSON.parse(readFileSync(new URL('public/groundtruth/nozzles.json', root), 'utf8')).length;
    expect(read('components.csv').length).toBe(items + nozzles);
    expect(read('welds.csv').length).toBe(idx.lines.reduce((n: number, l: { welds: number }) => n + l.welds, 0));
    expect(read('supports.csv').length).toBe(idx.lines.reduce((n: number, l: { supports: number }) => n + l.supports, 0));
  });
  it('every component end meets another, except blind faces, caps and nozzle necks at the shell; every tee has its branch point (SW-XCH-2)', () => {
    const rows = read('components.csv'), k = (r: Record<string, string>, p: string) => [r[`${p}E_in`], r[`${p}N_in`], r[`${p}EL_in`]].map(v => Math.round(Number(v) * 32));
    const at = new Map<string, string[]>();
    for (const r of rows) for (const p of ['end1', 'end2', 'branch']) if (r[`${p}E_in`]) { const s = k(r, p).join(); at.set(s, [...(at.get(s) ?? []), r.tag]); }
    const meets = (r: Record<string, string>, p: string) => { const [x, y, z] = k(r, p); for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) for (const dz of [-1, 0, 1]) if ((at.get([x + dx, y + dy, z + dz].join()) ?? []).some(t => t !== r.tag)) return true; return false; };
    for (const r of rows) {
      if (r.type === 'studs') continue;
      for (const p of ['end1', 'end2']) if (!meets(r, p)) expect(r.type === 'blind' || r.type === 'cap' || (r.type === 'pipe' && r.line.includes(' nozzle ')), `${r.tag} ${p}`).toBe(true);
      if (r.type === 'tee') { expect(r.branchE_in, r.tag).not.toBe(''); expect(meets(r, 'branch'), `${r.tag} branch`).toBe(true); }
    }
  });
  it('the spec request covers every part code used, each with its dimensions (SW-XCH-3)', () => {
    const spec = read('spec-request.csv'), codes = new Set(spec.map(s => `${s.lineClass}|${s.partCode}`));
    for (const s of spec) expect(s['dimensions (label=value unit (rule))'].length, s.partCode).toBeGreaterThan(5);
    const classOf = new Map(read('lines.csv').map(l => [l.line, l.lineClass] as const));
    for (const r of read('components.csv')) { const lc = classOf.get(r.line) ?? 'equipment nozzles', code = r.type === 'pipe' ? r.partCode.split('|').slice(0, 3).join('|') : r.partCode; expect(codes.has(`${lc}|${code}`), `${r.tag} ${code}`).toBe(true); }
  });
  it('the pilot holds the three lines and their branches (SW-XCH-4)', () => {
    const lines = read('pilot/lines.csv').map(l => l.line);
    for (const l of ['6"-P150-P-1001', '1"-P150-HS-5002', '3"-P150-SC-2004']) expect(lines).toContain(l);
    const three = ['6"-P150-P-1001', '1"-P150-HS-5002', '3"-P150-SC-2004'];
    for (const l of read('pilot/lines.csv')) if (!three.includes(l.line)) expect(l.tapsLine.split(' ').some(x => lines.includes(x)), l.line).toBe(true);
    // every tee branch in the pilot leads to a pilot line
    for (const r of read('pilot/components.csv')) if (r.type === 'tee') expect(lines, r.tag).toContain(r.branchLine);
    expect(readFileSync(new URL('README.md', dir), 'utf8')).toContain('which is not in the pilot');
  });
  it('the README is complete and confidential, the manifest is right, and no drawing or outside material is included (SW-XCH-5)', () => {
    const readme = readFileSync(new URL('README.md', dir), 'utf8');
    expect(readme).not.toContain('{{'); expect(readme).toContain('Confidential'); expect(readme).toContain('Keep our tag');
    const files: string[] = []; const walk = (d: string) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else files.push(p); } }; walk(dir.pathname);
    for (const f of files) expect(/\.(csv|json|md|txt)$/.test(f), f).toBe(true);
    for (const line of readFileSync(new URL('MANIFEST.txt', dir), 'utf8').split('\n').filter(l => /^[0-9a-f]{64}  /.test(l))) {
      const [h, p] = [line.slice(0, 64), line.slice(66)];
      expect(createHash('sha256').update(readFileSync(new URL(p, dir))).digest('hex'), p).toBe(h);
    }
  });
  it('every SW-XCH rule ID used in code is written in DESIGN_BASIS.md', () => {
    const basis = readFileSync(new URL('DESIGN_BASIS.md', root), 'utf8');
    for (const f of ['tools/designer-package.ts', 'tests/xch.test.ts']) for (const id of new Set(readFileSync(new URL(f, root), 'utf8').match(/SW-XCH-\d+/g) ?? [])) expect(basis.includes('`' + id + '`'), `${id} in ${f}`).toBe(true);
  });
});
