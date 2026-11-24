/** Plant 3, the coastal refinery: its equipment model (DESIGN_BASIS.md §78). Every item of the process model has its
 *  body at its sized dimensions; a unit's bodies stand on the 6 in grid in rows that do not overlap, within the unit's
 *  plot; and the units are set on the site inside their plots at their bench's elevation. No piping yet. */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { buildCell, bare, bodySolids, RACK, TOWER_TAGS, PUMP_PAD, DECK, YARD, PAD } from '../src/refinery/cell';
import { cells, cellToSite, plotLength, siteParts } from '../src/refinery/assemble';
import { processModel } from '../src/refinery/process';
import { sizing } from '../src/refinery/sizing';
import { bench, DIKES } from '../src/refinery/site';
import { MODEL_IMAGES } from '../src/refinery/modelReport';
import { makeHorizontalDrum } from '../src/catalogue';

const M = processModel(), Z = sizing(), all = cells();
const basisDoc = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');

describe('plant 3: a unit in its own frame (SW-CELL-1 to SW-CELL-4)', () => {
  it('every item of every process unit has its bodies, as many as are installed', () => {
    for (const { plot: p, cell: c } of all) {
      const sh = M.sheet(p.unit), z = Z.get(p.unit)!;
      for (const e of sh.equip.values()) {
        if (e.kind === 'loading' || (p.id === 'CT') !== TOWER_TAGS.includes(e.tag)) continue;
        const bodies = c.spots.filter(s => s.item === e.tag), n = z.equip.get(e.tag)!;
        expect(bodies.length, e.tag).toBeGreaterThan(0);
        if (e.kind === 'pump' || e.kind === 'compressor' || e.kind === 'blower') expect(bodies.length, e.tag).toBe(n.count);
        if (e.kind === 'hx') expect(bodies.length, e.tag).toBe(n.d.shells);
        if (e.kind === 'aircooler') expect(bodies.length, e.tag).toBe(n.d.bays);
      }
      expect(c.interior.equipment.length).toBeGreaterThanOrEqual(c.spots.length);
    }
  });
  it('bodies stand on the 6 in grid, in rows that do not overlap, each side of the rack', () => {
    for (const { cell: c } of all) {
      for (const s of c.spots) { expect(Math.abs(s.x % 6), s.tag).toBe(0); expect(Math.abs(s.z % 6), s.tag).toBe(0); expect(s.x, s.tag).toBeGreaterThan(RACK.start); if (s.lane !== 'heater' && s.lane !== 'air') expect(Math.abs(s.z), s.tag).toBeGreaterThan(c.rack.halfWidth); if (s.lane === 'air') { expect(s.z, s.tag).toBe(0); expect(s.yt!, s.tag).toBe(DECK + 134); expect(s.x + s.lx / 2, s.tag).toBeLessThanOrEqual(c.rack.x1); } }
      for (let i = 0; i < c.spots.length; i++) for (let j = i + 1; j < c.spots.length; j++) { const a = c.spots[i], b = c.spots[j]; if (!a.lx || !b.lx || (a.lane === 'air') !== (b.lane === 'air')) continue; /* the air coolers stand over the rack, above the rest */ expect(Math.abs(a.x - b.x) - (a.lx + b.lx) / 2 >= -1 || Math.abs(a.z - b.z) - (a.lz + b.lz) / 2 >= -1, `${a.tag} and ${b.tag}`).toBe(true); }
      expect(c.rack.x0).toBe(RACK.start); expect((c.rack.x1 - c.rack.x0) % RACK.bent).toBe(0); expect(c.rack.tiers).toEqual([192, 264, 336]);
    }
  });
  it('every body lies within its own footprint and on its pad, measured from its solids (SW-CELL-7)', () => {
    for (const { cell: c } of all) {
      for (const s of c.spots) {
        const bs = bodySolids(c, s.tag); expect(bs.length, s.tag).toBeGreaterThan(0);
        const mn = [0, 1, 2].map(a => Math.min(...bs.map(b => b.mn[a]))), mx = [0, 1, 2].map(a => Math.max(...bs.map(b => b.mx[a])));
        if (s.lx > 0) { expect(mn[0], s.tag).toBeGreaterThanOrEqual(s.x - s.lx / 2 - 6.01); expect(mx[0], s.tag).toBeLessThanOrEqual(s.x + s.lx / 2 + 6.01); }
        if (s.lx > 0) { expect(mn[2], s.tag).toBeGreaterThanOrEqual(s.z - s.lz / 2 - 6.01); expect(mx[2], s.tag).toBeLessThanOrEqual(s.z + s.lz / 2 + 6.01); }
        expect(mx[1], s.tag).toBeLessThanOrEqual(s.h + 0.01);
        // nothing that carries a body is below the top of its pad, save what stands in the ground
        if (s.shape === 'box' && !['pit', 'basin', 'coolingtower'].includes(s.kind) && s.lane !== 'air') { const low = Math.min(...bs.filter(b => !/anchor|holding-down|bolts|studs and nuts/i.test(b.name)).map(b => b.mn[1])); expect(low, s.tag).toBeGreaterThanOrEqual(PAD - 1e-3); expect(low, s.tag).toBeLessThan(PAD + 6); }   /* on its pad, which is up to 6 in thicker where the body's axis is brought onto the grid */
      }
    }
  });
  it('a pit stands in the ground, its roof slab\'s top 1 ft above grade, beyond the outer ends of the condensers that drain into it (SW-CELL-3, SW-CELL-4)', () => {
    let pits = 0;
    for (const { cell: c } of all) for (const s of c.spots.filter(q => q.kind === 'pit')) { pits++;
      const cond = c.spots.filter(q => q.kind === 'condenser'); if (cond.length) { expect(s.side).toBe(cond[0].side); expect(Math.abs(s.x - cond.reduce((a, q) => a + q.x, 0) / cond.length)).toBeLessThanOrEqual(3); expect(s.z - s.lz / 2 - Math.max(...cond.map(q => q.z + q.lz / 2))).toBeGreaterThanOrEqual(96 - 6); expect(s.z - s.lz / 2 - Math.max(...cond.map(q => q.z + q.lz / 2))).toBeLessThan(160); }   /* beyond the outer ends of the condensers that drain into it, across an 8 ft way, its middle at theirs */ const bs = bodySolids(c, s.tag), roof = bs.filter(b => /^roof slab/.test(b.name)); expect(roof.length).toBeGreaterThan(0); expect(Math.max(...roof.map(b => b.mx[1]))).toBeCloseTo(12, 6); expect(Math.min(...bs.map(b => b.mn[1]))).toBeLessThan(-60); }
    expect(pits).toBeGreaterThan(0);
  });
  it('pumps face the rack with their suction ends on one line; exchangers are square to it, channel end outward; heaters stand 50 ft beyond it', () => {
    for (const { cell: c } of all) {
      for (const side of [1, -1]) { const row = c.spots.filter(q => q.lane === 'pump' && q.side === side), off = row.length ? Math.abs(row[0].z) - row[0].lz / 2 - c.rack.halfWidth : 60; expect(off).toBeGreaterThanOrEqual(60); for (const s of row) expect(Math.abs(s.z) - s.lz / 2, s.tag).toBeCloseTo(c.rack.halfWidth + off, 0); }   /* one line for the row, 5 ft from the columns or as far as its largest suction valve set needs */
      for (const s of c.spots.filter(q => q.lane === 'pump')) { expect(s.shape).toBe('pump'); expect(s.yc!).toBeGreaterThan(PUMP_PAD); }
      // SW-CELL-3: a reboiler stands on the vessels' side, next after the column it boils for and in its row, near enough for its two lines to be laid direct (SW-RT-1)
      const sheet = M.sheet(c.unit), boils = new Map(sheet.lines.filter(l => l.from.k === 'eq' && l.to.k === 'eq' && l.to.port === 'reboiler return' && sheet.equip.get(l.from.tag)?.kind === 'hx').map(l => [(l.from as { tag: string }).tag, (l.to as { tag: string }).tag]));
      for (const s of c.spots.filter(q => q.shape === 'hx')) {
        const col = boils.has(s.item) ? c.spots.find(q => q.item === boils.get(s.item)) : undefined;
        expect(s.side, s.tag).toBe(col ? -1 : 1); expect(s.axis).toBe('z'); expect(s.side * s.o![2], s.tag).toBeGreaterThan(c.rack.halfWidth + 240);
        if (col) { expect(s.z, s.tag).toBe(col.z); expect(s.x - col.x, s.tag).toBeGreaterThan(col.R! + 54 + 36 + s.R! - 6.01); expect(s.x - col.x, s.tag).toBeLessThanOrEqual(240); expect(c.spots.filter(q => q.side === -1 && q.z === col.z && q.x > col.x && q.x < s.x).length, s.tag).toBe(0); }
      }
      const last = Math.max(...c.spots.filter(q => q.lane !== 'heater').map(q => q.x + q.lx / 2));
      for (const s of c.spots.filter(q => q.lane === 'heater')) { expect(s.x - s.lx / 2, s.tag).toBeGreaterThanOrEqual(last + 600 - 6); expect(s.x - s.lx / 2 - c.rack.x1, s.tag).toBeGreaterThanOrEqual(114); expect(s.x - s.lx / 2 - c.rack.x1, s.tag).toBeLessThan(360); }
    }
  });
  it('carries its crossing lines: a valve bay ahead of the lanes, a deck for the air coolers, support beams along the yard (SW-CELL-2, -4, -6)', () => {
    for (const { cell: c, plot: p } of all) {
      const tags = (t: string) => c.interior.instances.filter(i => i.tags.includes(t));
      if (c.spots.some(s => s.lane === 'air')) { expect(tags('cooler-deck').length, `unit ${p.unit}`).toBeGreaterThan(6); expect(DECK).toBe(RACK.tiers[2] + 108); }
      for (const z of [c.yard.neg, c.yard.pos]) if (z !== undefined) { expect(Math.abs(z)).toBeGreaterThanOrEqual(c.rack.halfWidth + 78); for (const s of c.spots.filter(q => q.lane === 'pump' && Math.sign(q.z) === Math.sign(z))) expect(Math.abs(z), s.tag).toBeGreaterThanOrEqual(Math.abs(s.z) + s.lz / 2 + 12); }
      if (c.yard.neg !== undefined || c.yard.pos !== undefined) expect(tags('yard-support').length).toBeGreaterThan(4);
      expect(YARD).toBeGreaterThan(RACK.tiers[2]);
    }
  });
  it('sizes are those the process gave: the crude column, a pump, a stacked exchanger', () => {
    const c11 = buildCell(11, plotLength(all[0].plot)), col = c11.spots.find(s => s.tag === 'C-1101')!, d = Z.get(11)!.equip.get('C-1101')!.d;
    expect(col.R).toBe(d.D / 2 + d.t); expect(col.yt! - col.yb!).toBe(d.TT); expect(col.side).toBe(-1);
    const sh = c11.spots.filter(s => s.item === 'E-1109'); expect(sh.length).toBe(Z.get(11)!.equip.get('E-1109')!.d.shells);
    expect(c11.spots.filter(s => s.item === 'P-1101').map(s => s.tag)).toEqual(['P-1101A', 'P-1101B']);
    expect(buildCell(11, plotLength(all[0].plot))).toBe(c11);                                           // built once
  });
  it('a catalogue item is made bare of its own nozzles, and keeps its manway', () => {
    const full = makeHorizontalDrum({ tag: 'D-TEST', ID: 72, L: 216 }), names = (p: typeof full) => (p.extra!.solids as { name: string }[]).map(s => s.name);
    expect(names(full).some(n => /nozzle/.test(n))).toBe(true); expect(names(bare(full)).some(n => /nozzle/.test(n) && !/manway/.test(n))).toBe(false); expect(names(bare(full)).some(n => /manway/.test(n))).toBe(true);
  });
});

describe('plant 3: the units on the site (SW-CELL-1, SW-CELL-5, SW-SITE-1)', () => {
  it('each unit lies within its plot, its battery limit on the pipeway side, at its bench\'s elevation', () => {
    for (const { plot: p, cell: c } of all) {
      expect(c.x1, p.id).toBeLessThanOrEqual(plotLength(p)); expect(c.z1 - c.z0, p.id).toBeLessThanOrEqual((p.x1 - p.x0) * 12);
      const T = cellToSite(p, c), at = (x: number, y: number, z: number) => [T[0] * x + T[4] * y + T[8] * z + T[12], T[1] * x + T[5] * y + T[9] * z + T[13], T[2] * x + T[6] * y + T[10] * z + T[14]];
      for (const [x, z] of [[0, c.z0], [c.x1, c.z0], [c.x1, c.z1], [0, c.z1]]) { const q = at(x, 0, z); expect(q[0] / 12, p.id).toBeGreaterThanOrEqual(p.x0 - 0.01); expect(q[0] / 12, p.id).toBeLessThanOrEqual(p.x1 + 0.01); expect(q[2] / 12, p.id).toBeGreaterThanOrEqual(p.z0 - 0.01); expect(q[2] / 12, p.id).toBeLessThanOrEqual(p.z1 + 0.01); expect(q[1]).toBeCloseTo(bench(p.bench).el * 12, 6); }
      expect(at(0, 0, 0)[2] / 12, p.id).toBeCloseTo(p.faces === 'N' ? p.z0 : p.z1, 6);                    // the battery limit on the pipeway edge
    }
  });
  it('the whole plant: every unit, every tank in its dike, the spheres and the flare', () => {
    const parts = siteParts(), tags = new Set(parts.flatMap(p => p.tags));
    expect(parts.length).toBeGreaterThan(15000);
    for (const d of DIKES()) { expect(tags.has(`dike-${d.id}`)).toBe(true); for (const t of d.tanks) expect(tags.has(t.tag), t.tag).toBe(true); }
    for (const t of ['S-2101', 'S-2102', 'S-2103', 'S-2104', 'S-2105', 'X-2501', 'C-1101', 'R-1701', 'X-1903']) expect(tags.has(t), t).toBe(true);
    for (const p of parts) for (const v of p.transform) expect(Number.isFinite(v)).toBe(true);
  });
  it('every image of the model exists and is listed in the image index', () => {
    const index = readFileSync(new URL('../screenshots/INDEX.md', import.meta.url), 'utf8');
    for (const n of Object.keys(MODEL_IMAGES)) { expect(existsSync(new URL(`../screenshots/refinery/${n}.png`, import.meta.url)), n).toBe(true); expect(index.includes('`refinery/' + n + '.png`'), n).toBe(true); }
  });
  it('every rule the model code cites is written in the design basis', () => {
    const defined = new Set([...basisDoc.matchAll(/`(SW-[A-Z]+-\d+[a-z]?)`/g)].map(m => m[1]));
    for (const f of ['src/refinery/cell.ts', 'src/refinery/assemble.ts', 'src/refinery/modelReport.ts', 'tools/refinery-model.ts']) for (const m of readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').matchAll(/SW-[A-Z]+-\d+[a-z]?/g)) expect(defined.has(m[0]), `${f} cites ${m[0]}`).toBe(true);
  });
});
