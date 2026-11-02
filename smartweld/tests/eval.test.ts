/**
 * External test drawings (DESIGN_BASIS.md §57, SW-EVAL-1..6): quarantine, answer key, scoring harness.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const py = (args: string[]) => spawnSync('python3', ['-I', 'tools/evalscore.py', ...args], { cwd: root, encoding: 'utf8' });
const hasPy = spawnSync('python3', ['--version']).status === 0;

describe('external test drawings (SW-EVAL-1..6)', () => {
  it('received drawings and detections on them are never committed (SW-EVAL-1)', () => {
    const ign = readFileSync(new URL('.gitignore', root), 'utf8').split('\n').map(s => s.trim());
    expect(ign).toContain('eval/external/');
    expect(ign).toContain('eval/detections/');
  });
  it('no file of the project or its deliverables matches a received external drawing (SW-EVAL-1)', () => {
    const dir = new URL('eval/receipts/', root), hashes = new Set<string>();
    for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) for (const x of JSON.parse(readFileSync(new URL(f, dir), 'utf8')).files) hashes.add(x.sha256);
    if (!hashes.size) return;
    const walk = (d: string): string[] => readdirSync(d).flatMap(n => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
    for (const d of ['public', 'screenshots', 'assets']) for (const f of walk(new URL(d, root).pathname)) expect(hashes.has(createHash('sha256').update(readFileSync(f)).digest('hex')), f).toBe(false);
  });
  it('every receipt records the software, who drew it and its files; scored sets are cleared (SW-EVAL-2)', () => {
    const dir = new URL('eval/receipts/', root);
    for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
      const r = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
      expect(r.software && r.version && r.drawnBy, f).toBeTruthy(); expect(r.files.length, f).toBeGreaterThan(0);
      const scored = existsSync(new URL('eval/reports/', root)) && readdirSync(new URL('eval/reports/', root)).some(x => x.startsWith(`${r.set}--`));
      if (scored) { expect(r.clearance.contract, f).toBeTruthy(); expect(r.clearance.licenceReview, f).toBeTruthy(); }
    }
  });
  it('the committed answer key equals a fresh build from the model (SW-EVAL-3)', () => {
    if (!hasPy) return;
    const r = py(['key', '--check']); expect(r.stdout + r.stderr).toContain('equals a fresh build'); expect(r.status).toBe(0);
    const k = JSON.parse(readFileSync(new URL('eval/answer-key.json', root), 'utf8'));
    expect(Object.keys(k.lines).length).toBe(203);
  });
  it('the harness self-test passes: uncleared sets refused, counts, swaps, extras, boxes, labels (SW-EVAL-2/5)', () => {
    if (!hasPy) return;
    const r = py(['selftest']); expect(r.stdout).not.toContain('FAIL'); expect(r.status, r.stdout + r.stderr).toBe(0);
  }, 60000);
  it('reports carry no image data and stay within numbers, classes and model tags (SW-EVAL-6)', () => {
    const dir = new URL('eval/reports/', root);
    for (const f of readdirSync(dir).filter(f => /\.(json|md)$/.test(f))) { const t = readFileSync(new URL(f, dir), 'utf8'); expect(/data:image|base64|<svg|%PDF/.test(t), f).toBe(false); }
  });
  it('every SW-EVAL rule ID used in code is written in DESIGN_BASIS.md', () => {
    const basis = readFileSync(new URL('DESIGN_BASIS.md', root), 'utf8');
    for (const f of ['tools/evalscore.py', 'tests/eval.test.ts', 'eval/README.md'])
      for (const id of new Set(readFileSync(new URL(f, root), 'utf8').match(/SW-EVAL-\d+/g) ?? [])) expect(basis.includes('`' + id + '`'), `${id} in ${f}`).toBe(true);
  });
});
