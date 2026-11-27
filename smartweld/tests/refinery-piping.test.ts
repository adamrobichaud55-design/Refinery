/** Plant 3, the coastal refinery: a unit piped (DESIGN_BASIS.md §79). What the generator of plants 1 and 2 is given for a
 *  unit — nozzles, lines, battery limit spools — follows the flowsheet and the rules; and the piped units on disk are whole:
 *  every line routed, continuous, jointed by its class, clear of every other and of the steel. Generating a unit takes
 *  minutes, so the saved model is checked rather than made again here (tools/refinery-piping.ts makes it). */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { unitPiping, gateReach, gateWidth, laneSpacing, heldAs, BIG, TIER_ROOM, TIER_SHARE, type UnitLine } from '../src/refinery/unitPiping';
import { processModel } from '../src/refinery/process';
import { sizing, headerDesign, stationed } from '../src/refinery/sizing';
import { unitHeaders, connection } from '../src/refinery/headers';
import { serviceOf, lineNumber, routedFree } from '../src/refinery/registry';
import { FLUIDS } from '../src/refinery/fluids';
import { framePlaced } from '../src/refinery/supports';
import { RACK, PAD, valveDrop, bodySolids } from '../src/refinery/cell';
import { pipingDocument, cutLongPipes, lengthenShortPieces, removeValves, joinHeaders, measuredAgain, elbowGap, valveBoxFn, runSolids, PIPING_IMAGES, type PipedUnit } from '../src/refinery/pipingReport';
import * as K from '../src/generator/pipingCheck';
import { makeValve, gateFaceToFace, globeFaceToFace, designFlange, pipeDims, elbowRadius } from '../src/catalogue';
import { worldBox, type PipingModel } from '../src/generator/piping';
import { buildGeometry } from '../src/geometry/partGeometry';

const M = processModel(), Z = sizing(), U = 15, up = unitPiping(U), sh = M.sheet(U), z = Z.get(U)!;
const basisDoc = readFileSync(new URL('../DESIGN_BASIS.md', import.meta.url), 'utf8');
const dir = new URL('../public/refinery/piping/', import.meta.url);
const reports = readdirSync(dir).filter(f => /^unit-\d+\.report\.json$/.test(f)).map(f => JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as PipedUnit).sort((a, b) => a.unit - b.unit);

describe('plant 3: what the generator is given for a unit (SW-RPI-1 to SW-RPI-5)', () => {
  it('every connection of every body is a nozzle of its line\'s size and class, its axis on the 6 in grid', () => {
    for (const e of sh.equip.values()) for (const [k, s] of up.cell.spots.filter(q => q.item === e.tag).entries()) for (const q of z.equip.get(e.tag)!.nozzles) {
      const id = `${s.tag}-${q.port === 'S' || q.port === 'D' ? q.port : `N${z.equip.get(e.tag)!.nozzles.indexOf(q) + 1}`}`, n = up.nozzles.get(id)!;
      expect(n, `${id} (body ${k})`).toBeDefined(); expect(n.NPS).toBe(q.NPS); expect(Number(n.cls.slice(1))).toBeLessThanOrEqual(Number(q.cls.slice(1))); if (q.dir === 'out' || !sh.lines[q.line ?? -1]?.cv) expect(n.cls).toBe(q.cls); expect(n.equip).toBe(s.tag);   /* a destination past a control station may be of a lower class (SW-RPI-9) */
    }
    for (const n of up.nozzles.values()) {
      const axis = n.u.map(Math.abs).indexOf(1); expect(axis, n.id).toBeGreaterThanOrEqual(0);
      for (let a = 0; a < 3; a++) if (a !== axis) expect(Math.abs(n.face[a] / 6 - Math.round(n.face[a] / 6)), `${n.id} axis ${a} at ${n.face[a]}`).toBeLessThan(1e-9);
      expect(n.S).toBeGreaterThan(0);
    }
    expect(up.notes.filter(s => /stand .* apart/.test(s))).toEqual([]);                                // no two nozzles' valve stacks in each other's way
  });
  it('places nozzles by the kind of body', () => {
    const N = (id: string) => up.nozzles.get(id)!;
    for (const s of up.cell.spots.filter(q => q.shape === 'pump')) { const su = N(`${s.tag}-S`), di = N(`${s.tag}-D`); expect(su.u).toEqual([0, 0, -s.side]); expect(su.face[1]).toBe(s.yc); expect(di.u).toEqual([0, 1, 0]); expect(di.face[2]).toBe(s.zc); expect(su.service).toBe('suction'); expect(di.service).toBe('discharge'); }
    for (const s of up.cell.spots.filter(q => q.shape === 'hx')) { const ns = [...up.nozzles.values()].filter(n => n.equip === s.tag); expect(ns.length).toBe(4); expect(ns.filter(n => n.u[1] > 0).length).toBe(2); expect(ns.filter(n => n.u[1] < 0).length).toBe(2);
      const tube = ns.filter(n => /tube/.test(n.service)); for (const n of tube) expect(n.face[2]).toBe(s.zc); }
    const col = up.cell.spots.find(q => q.tag === 'C-1501')!, cn = [...up.nozzles.values()].filter(n => n.equip === 'C-1501');
    expect(cn.find(n => n.service === 'overhead')!.u).toEqual([0, 1, 0]); expect(cn.find(n => n.service === 'overhead')!.face[1]).toBeGreaterThanOrEqual(col.floors![col.floors!.length - 1] + 54);
    for (const n of cn.filter(q => q.u[1] === 0)) expect(n.u).toEqual([0, 0, 1]);                         // every shell connection faces the rack
    const shellEl = cn.filter(q => q.u[1] === 0).map(q => q.face[1]).sort((a, b) => a - b); for (let i = 1; i < shellEl.length; i++) expect(shellEl[i] - shellEl[i - 1]).toBeGreaterThanOrEqual(36);
    // the platforms, ladders and davit of a column stand on the half away from the rack (SW-CELL-4): none of their solids reaches the rack side of the shell's axis by more than the ladders' depth
    const access = bodySolids(up.cell, 'C-1501').filter(b => /^(platform|ladder|davit)/.test(b.name)); expect(access.length).toBeGreaterThan(10);
    for (const b of access) expect(b.mx[2], b.name).toBeLessThan(/^platform/.test(b.name) ? col.z + 6 : col.z + col.R! + 12);   /* the platforms end at the axis; a ladder's cage at their ends comes about level with the shell's face */
    for (const b of access.filter(q => /davit arm/.test(q.name))) expect(b.mx[2]).toBeLessThan(col.z - 6);             // the arm swung away from the top nozzle
    for (const s of up.cell.spots.filter(q => q.kind === 'aircooler')) {   // in on top of the header, out through its outer face, 3 ft either side of the bay's centre
      const ns = [...up.nozzles.values()].filter(q => q.equip === s.tag), i = ns.find(q => q.service === 'inlet')!, o = ns.find(q => q.service === 'outlet')!;
      expect(i.u).toEqual([0, 1, 0]); expect(Math.abs(i.A[2])).toBe(198); expect(i.A[1]).toBe(s.yt); expect(i.A[0]).toBe(s.x - 36);
      expect(o.u[0]).toBe(0); expect(o.u[1]).toBe(0); expect(Math.abs(o.u[2])).toBe(1); expect(Math.abs(o.A[2])).toBe(204); expect(Math.sign(o.A[2])).toBe(Math.sign(i.A[2])); expect(o.A[0]).toBe(s.x + 36); expect(o.A[1]).toBeLessThan(s.yt!); expect(o.A[1]).toBeGreaterThan(RACK.tiers[2] + 108);
    }
  });
  it('the vacuum unit: an ejector set\'s connections where its item has them, a hotwell\'s under the boots, and the ends where no valve is built (SW-RPI-2, SW-RPI-14)', () => {
    const u12 = unitPiping(12), by = (equip: string, service: string) => { const n = [...u12.nozzles.values()].find(q => q.equip === equip && q.service === service); expect(n, `${equip} ${service}`).toBeDefined(); return n!; };
    const J = u12.cell.spots.find(q => q.item === 'J-1201')!, lineAt = (id: string) => u12.lines.find(l => [l.def.from, l.def.to].some(en => en.k === 'nozzle' && en.id === id))!;
    // the overhead runs from the column's top to the first suction at one station along the rack, so the generator lays it direct and not along the rack
    const top = by('C-1201', 'overhead'), inlet = by('J-1201', 'inlet'); expect(inlet.u).toEqual([0, 1, 0]); expect(inlet.face[0]).toBe(top.face[0]); expect(inlet.NPS).toBe(top.NPS); expect(inlet.face[1]).toBeGreaterThan(J.yt!);
    expect(lineAt(inlet.id).tier).toBeUndefined(); expect(u12.runs[u12.runOf.get(lineAt(inlet.id).def.no)!].kind).toBe('chase');
    // each tail pipe, and the last condenser's outlet, falls straight from its boot to the hotwell's top
    for (const [a, b] of [['condensate 1', 'tail pipe 1'], ['condensate 2', 'tail pipe 2'], ['outlet', 'inlet']]) {
      const p = by('J-1201', a), q = by('D-1201', b); expect(p.u).toEqual([0, -1, 0]); expect(q.u).toEqual([0, 1, 0]); expect(p.face[0]).toBe(q.face[0]); expect(p.face[2]).toBe(q.face[2]); expect(p.face[1] - q.face[1]).toBeGreaterThan(360);
      expect(lineAt(p.id)).toBe(lineAt(q.id)); expect(lineAt(p.id).tier).toBeUndefined();
    }
    // the hotwell's gas leaves on top between the last two inlets, the end toward the rack; water underneath midway between the first two tail pipes, oil below the second
    const t1 = by('D-1201', 'tail pipe 1'), t2 = by('D-1201', 'tail pipe 2'), t3 = by('D-1201', 'inlet'), gas = by('D-1201', 'gas'), water = by('D-1201', 'water'), oil = by('D-1201', 'oil');
    expect(gas.u).toEqual([0, 1, 0]); expect(Math.abs(gas.face[2] - (t2.face[2] + t3.face[2]) / 2)).toBeLessThanOrEqual(3); expect(Math.abs(gas.face[2])).toBeLessThan(Math.abs(t2.face[2])); expect(Math.abs(gas.face[2] - t2.face[2])).toBeGreaterThanOrEqual(18); expect(Math.abs(gas.face[2] - t3.face[2])).toBeGreaterThanOrEqual(18);
    expect(water.u).toEqual([0, -1, 0]); expect(water.face[2]).toBe((t1.face[2] + t2.face[2]) / 2); expect(oil.u).toEqual([0, -1, 0]); expect(oil.face[2]).toBe(t2.face[2]);
    // steam and water are met under the deck
    for (const sv of ['motive steam', 'cooling water in', 'cooling water out']) { const n = by('J-1201', sv); expect(n.u).toEqual([0, -1, 0]); expect(n.face[1]).toBeLessThan(J.yt! - 24); expect(n.face[1]).toBeGreaterThan(J.yt! - 48); }
    // SW-RPI-14: the transfer line, the overhead and the set's drains at both ends; the set's end of its steam and water
    const bare = Object.fromEntries(u12.lines.filter(l => l.bare).map(l => [l.def.no.split('-').pop(), `${l.origin}: ${l.bare!.join('+')}`]));
    expect(bare).toEqual({ 12002: 'process: from+to', 12003: 'process: from+to', 12004: 'process: from+to', 12005: 'process: from+to', 12006: 'process: from+to', 12501: 'utility: to', 12502: 'utility: to', 12503: 'utility: from' });
    for (const l of u12.lines.filter(q => q.bare)) for (const side of l.bare!) { const en = l.def[side]; expect(en.k).toBe('nozzle'); expect(/^(BL|CS|RS)-/.test((en as { id: string }).id)).toBe(false); }
    // in the pilot unit: the heater's outlet to the reactor and each column's top, and nothing else
    const b15 = up.lines.filter(l => l.bare); expect(b15.length).toBeGreaterThanOrEqual(2);
    for (const l of b15) { const f = sh.lines[l.flow!].from as { tag: string; port: string }, k = sh.equip.get(f.tag)!.kind; expect(['heater', 'column']).toContain(k); if (k === 'heater') expect(f.port).toBe('outlet'); else { const n = up.nozzles.get((l.def.from as { id: string }).id) ?? [...up.nozzles.values()].find(q => q.equip === f.tag && q.service === f.port)!; expect(n.u).toEqual([0, 1, 0]); } }
    for (const t of ['SW-RPI-14', 'Valves not built', 'a shut drain floods its condenser']) expect(basisDoc).toContain(t);
  }, 300_000);
  it('the cracking unit: the cracker between its fractionator and its flue gas train, each connection where its stream enters or leaves, the ducts and the vapour line routed free (SW-CELL-3, SW-CELL-4, SW-RPI-2, SW-RPI-3, SW-RPI-14)', () => {
    const u17 = unitPiping(17), c = u17.cell, sp = (tag: string) => c.spots.find(q => q.tag === tag)!, N = (tag: string, service: string) => { const n = [...u17.nozzles.values()].find(q => q.equip === tag && q.service === service); if (!n) throw new Error(`${tag} has no "${service}"`); return n; };
    const sol = (tag: string, name: RegExp) => { const b = bodySolids(c, tag).filter(q => name.test(q.name)); if (!b.length) throw new Error(`${tag} has no solid ${name}`); return { mn: [0, 1, 2].map(k => Math.min(...b.map(q => q.mn[k]))), mx: [0, 1, 2].map(k => Math.max(...b.map(q => q.mx[k]))) }; };
    const mid = (b: { mn: number[]; mx: number[] }, k: number) => (b.mn[k] + b.mx[k]) / 2, onGrid = (v: number) => Math.abs(v / 6 - Math.round(v / 6)) < 1e-6, rf = (n: { NPS: number; cls: string }) => designFlange(n.NPS, n.cls as never).OD / 2;
    // SW-CELL-3: the row next the rack in the order stated, on one centre line, the hoppers and the slurry filter at its end; behind the three drums the head of the gas plant, which ends before the side stripper
    const row = ['D-1701', 'D-1703', 'D-1702', 'C-1702', 'C-1701', 'R-1701', 'E-1703', 'C-1705', 'V-1701', 'V-1702', 'F-1701'], back = ['D-1704', 'C-1703', 'C-1704', 'C-1706'];
    for (const line of [row, back]) for (let i = 0; i < line.length; i++) { expect(sp(line[i]).side, line[i]).toBe(-1); expect(sp(line[i]).z, line[i]).toBe(sp(line[0]).z); if (i) expect(sp(line[i]).x, line[i]).toBeGreaterThan(sp(line[i - 1]).x); }
    expect(sp(back[0]).z).toBeLessThan(sp(row[0]).z); expect(sp('C-1706').x).toBeLessThan(sp('C-1702').x - sp('C-1702').lx / 2);
    // nothing else stands on that side but the pumps: behind the side stripper, the fractionator and the converter there is no way to the rack
    expect(c.spots.filter(q => q.side === -1 && q.lane === 'vessel' && q.lx > 0).map(q => q.tag).sort()).toEqual([...row, ...back].sort());
    for (const q of c.spots.filter(v => v.side === -1 && v.lane === 'vessel' && back.includes(v.tag))) for (const f of ['C-1702', 'C-1701', 'R-1701', 'E-1703', 'C-1705']) expect(Math.abs(q.x - sp(f).x), `${q.tag} behind ${f}`).toBeGreaterThanOrEqual(sp(f).lx / 2);
    // the rest of the gas plant across the rack (`across`): one row on one centre line in the order declared, each reboiler next after its column; beyond the exchangers' and machines' row, and 4 ft and more beyond the regenerator's station
    const over = ['D-1706', 'C-1707', 'E-1707', 'C-1708', 'E-1715', 'D-1705', 'C-1709', 'V-1703', 'C-1710', 'E-1714', 'D-1707', 'V-1704'], shx = c.spots.filter(q => q.side === 1 && q.lane === 'exchanger' && q.lx > 0);
    for (let i = 0; i < over.length; i++) { const q = sp(over[i]); expect(q.side, q.tag).toBe(1); expect(q.lane, q.tag).toBe('vessel'); expect(q.z, q.tag).toBe(sp(over[0]).z); if (i) expect(q.x - q.lx / 2, q.tag).toBeGreaterThanOrEqual(sp(over[i - 1]).x + sp(over[i - 1]).lx / 2); expect(M.sheet(17).equip.get(q.item)!.p.across ?? (q.kind === 'hx' ? 1 : undefined), q.tag).toBe(1); }
    expect(c.spots.filter(q => q.side === 1 && q.lane === 'vessel').map(q => q.tag).sort()).toEqual([...over].sort());
    const lead = sp(over[0]), regenX = N('R-1701', 'regenerator air').face[0];
    expect(lead.x - lead.lx / 2).toBeGreaterThanOrEqual(regenX + 48); expect(lead.x - lead.lx / 2).toBeLessThan(regenX + 48 + 12); for (const q of shx) expect(q.x + q.lx / 2, q.tag).toBeLessThan(lead.x - lead.lx / 2);
    expect(Math.abs(Math.min(...over.map(tag => sp(tag).z - sp(tag).lz / 2)) - Math.min(...shx.map(q => q.z - q.lz / 2)))).toBeLessThanOrEqual(6);   // 8 ft beyond the pumps' row, as the exchangers are
    // a pump that draws from a vessel across the rack stands there, opposite its vessel; the pumps of the vessels' side as before
    for (const [pump, drum] of [['P-1712', 'D-1705'], ['P-1713', 'D-1707']]) { const ps = c.spots.filter(q => q.item === pump); expect(ps.length).toBe(2); for (const q of ps) { expect(q.side, q.tag).toBe(1); expect(q.lane).toBe('pump'); expect(Math.abs(q.x - sp(drum).x), q.tag).toBeLessThan(sp(drum).lx / 2); expect(q.z, q.tag).toBeLessThan(sp(drum).z - sp(drum).lz / 2); } }
    for (const q of c.spots.filter(v => v.lane === 'pump' && !['P-1712', 'P-1713', 'P-1714'].includes(v.item))) expect(q.side, q.tag).toBe(-1);
    // the blower across the rack from the regenerator, after the last exchanger of its row
    expect(sp('K-1701').side).toBe(1); expect(sp('K-1701').x).toBeGreaterThan(sp('E-1716').x); expect(Math.abs(sp('K-1701').x - regenX)).toBeLessThan(480);
    // the cracker turned: its reactor toward the fractionator, its riser toward the rack; the two vessels and the riser on the grid
    const regen = sol('R-1701', /^regenerator shell$/), react = sol('R-1701', /^reactor shell$/), riser = sol('R-1701', /^riser$/), tower = sol('R-1701', /^reactor tower/), cone = sol('R-1701', /^regenerator top cone$/), head = sol('R-1701', /^reactor top head$/);
    expect(mid(react, 0)).toBeLessThan(mid(regen, 0)); expect(mid(react, 0)).toBeGreaterThan(sp('C-1701').x); expect(mid(riser, 2)).toBeGreaterThan(mid(react, 2)); expect(sp('R-1701').side).toBe(-1);
    for (const b of [regen, react, riser]) for (const k of [0, 2]) expect(onGrid(mid(b, k)), `${mid(b, k)}`).toBe(true);
    expect(bodySolids(c, 'R-1701').filter(q => /flange$/.test(q.name) && /^(flue gas outlet|air inlet|vapour outlet)/.test(q.name))).toEqual([]);   // the plant's own connections stand there
    // SW-CELL-7: one axis for the scrubber, the cooler and the regenerator; SW-CELL-4: the cooler on piers at the height of the scrubber's inlet duct
    const cool = sol('E-1703', /^shell$/), scr = sol('C-1705', /^shell$/), duct = sol('C-1705', /^gas inlet duct$/);
    for (const b of [cool, scr, duct]) expect(mid(b, 2)).toBeCloseTo(mid(regen, 2), 6);
    expect(mid(duct, 1)).toBeCloseTo(mid(cool, 1), 6); expect(duct.mx[1] - duct.mn[1]).toBeCloseTo(pipeDims(36, 'P150').OD, 1);
    const piers = c.interior.instances.filter(i => i.tags.includes('E-1703') && i.tags.includes('pier')); expect(piers.length).toBe(2);
    // SW-RPI-2: the cracker's connections
    const fg = N('R-1701', 'flue gas'), air = N('R-1701', 'regenerator air'), vap = N('R-1701', 'reactor vapour'), feed = N('R-1701', 'feed'), stm = N('R-1701', 'riser and stripping steam'), cat = [N('R-1701', 'catalyst withdrawal'), N('R-1701', 'fresh catalyst')];
    expect(fg.u).toEqual([0, 1, 0]); expect(fg.A[0]).toBeCloseTo(mid(regen, 0), 6); expect(fg.A[2]).toBeCloseTo(mid(regen, 2), 6); expect(fg.A[1]).toBeCloseTo(cone.mx[1], 0); expect(cone.mx[0] - cone.mn[0]).toBeGreaterThan(2 * 21);
    expect(air.u).toEqual([0, 0, 1]); expect(air.A[0]).toBe(mid(regen, 0)); expect(onGrid(air.A[1])).toBe(true); expect(air.A[2]).toBeCloseTo(sol('R-1701', /^air inlet line$/).mx[2], 0);
    // SW-CELL-4: the air inlet line runs out 3 ft under the rack's lowest tier, the height its line from the blower crosses under the rack at: under that tier's beams with the pipe's radius and 3 in to spare
    { const od = pipeDims(air.NPS, air.cls as never).OD, under = Math.min(...c.interior.instances.filter(i => i.tags.some(g => /^rack-(bent|bay):/.test(g)) && (i.tags.includes('beam') || i.tags.includes('intermediate-beam'))).map(i => i.transform[13]).filter(y => y > RACK.tiers[0] - 40 && y <= RACK.tiers[0]));
      expect(air.A[1]).toBe(RACK.tiers[0] - 36); expect(air.A[1] + od / 2 + 3).toBeLessThan(under - 9); }
    expect(vap.u).toEqual([0, 1, 0]); expect(vap.A[0]).toBeCloseTo(mid(react, 0), 6); expect(vap.A[2]).toBeCloseTo(mid(react, 2), 6); expect(vap.A[1]).toBeCloseTo(head.mx[1], 0);
    expect(vap.face[1]).toBeGreaterThanOrEqual(Math.max(...bodySolids(c, 'R-1701').filter(q => /^reactor platform \d+: platform grating/.test(q.name)).map(q => q.mx[1])) + 54 - 1e-6);
    for (const n of [feed, stm]) { expect(n.u).toEqual([0, 0, 1]); expect(n.A[0]).toBe(mid(riser, 0)); expect(n.A[2]).toBeCloseTo(riser.mx[2], 0); expect(n.face[2]).toBeGreaterThan(tower.mx[2] + 5.9); }
    expect(feed.A[1]).toBeGreaterThan(stm.A[1] + 36);
    { // each passes out through the tower's face 3 in clear of its girts and bracing: panels 2.4 half-widths high from the tower's foot to the reactor's bottom tangent, both diagonals in each (SW-EQC-29)
      const b = (react.mx[0] - react.mn[0]) / 2 + 18, top = react.mn[1], levels = [tower.mn[1]]; for (let y = tower.mn[1]; y < top - 1;) { y = Math.min(top, y + 2.4 * b); if (top - y < 0.6 * b) y = top; levels.push(y); }
      for (const n of [feed, stm]) { const dx = n.A[0] - mid(react, 0), r = rf(n); expect(Math.abs(dx)).toBeLessThan(b);
        for (let k = 0; k + 1 < levels.length; k++) { const L = levels[k], L1 = levels[k + 1], m = (L1 - L) / (2 * b); if (k) expect(Math.abs(n.A[1] - L), `${n.service} at a girt`).toBeGreaterThan(r + 3); if (n.A[1] < L || n.A[1] > L1) continue;
          for (const yl of [L + (dx + b) * m, L + (b - dx) * m]) expect(Math.abs(n.A[1] - yl) / Math.hypot(1, m), `${n.service} at a diagonal`).toBeGreaterThan(r + 3); } }
    }
    for (const n of cat) { expect(n.u).toEqual([0, 0, 1]); expect(n.A[0]).toBe(mid(regen, 0)); expect(n.A[2]).toBeCloseTo(regen.mx[2], 0); expect(n.A[1]).toBeGreaterThan(regen.mn[1]); expect(n.A[1]).toBeLessThan(regen.mx[1]);
      for (const q of bodySolids(c, 'R-1701').filter(v => /^regenerator platform \d+: /.test(v.name))) expect(q.mx[1] <= n.A[1] - rf(n) - 3 + 1e-6 || q.mn[1] >= n.A[1] + gateReach(n.NPS) + 3 - 1e-6, `${n.service} and ${q.name}`).toBe(true); }
    expect(cat[1].A[1]).toBeGreaterThan(cat[0].A[1] + 60);
    // the hoppers: out through the skirt's opening side by side, in through the roof over the handrail
    { const frame = sol('V-1701', /^skirt opening frame$/), out = N('V-1701', 'catalyst out'), ca = N('V-1701', 'conveying air'), inn = N('V-1702', 'catalyst in'), roof = sol('V-1702', /^top plate$/);
      for (const n of [out, ca]) { expect(n.u).toEqual([1, 0, 0]); expect(n.A[1]).toBeGreaterThan(frame.mn[1] + rf(n)); expect(n.A[1]).toBeLessThan(frame.mx[1] - rf(n)); expect(n.A[2]).toBeGreaterThan(frame.mn[2]); expect(n.A[2]).toBeLessThan(frame.mx[2]); }
      expect(out.A[2] - ca.A[2]).toBe(24); expect(inn.u).toEqual([0, 1, 0]); expect(inn.face[1]).toBeGreaterThanOrEqual(roof.mx[1] + 54 - 1e-6); expect(inn.A[0]).toBeCloseTo(mid(sol('V-1702', /^shell$/), 0), 6); expect(inn.A[2]).toBeCloseTo(mid(sol('V-1702', /^shell$/), 2), 6); }
    // the flue gas train's connections face one another on the one axis; the scrubber's sump connections under its lowest platform; the cooler's steam and water on its drum
    { const ci = N('E-1703', 'inlet'), co = N('E-1703', 'outlet'), si = N('C-1705', 'flue gas in'), drum = sol('E-1703', /^steam drum shell$/), low = Math.min(...bodySolids(c, 'C-1705').filter(q => /^platform \d+: /.test(q.name)).map(q => q.mn[1]));
      expect(ci.u).toEqual([-1, 0, 0]); expect(co.u).toEqual([1, 0, 0]); expect(si.u).toEqual([-1, 0, 0]); for (const n of [ci, co, si]) { expect(n.A[1]).toBeCloseTo(mid(cool, 1), 6); expect(n.A[2]).toBeCloseTo(mid(cool, 2), 6); }
      expect(ci.face[0]).toBeGreaterThan(regen.mx[0] + 36 + 24 + elbowRadius(42)); expect(si.face[0] - co.face[0]).toBeGreaterThan(2 * gateFaceToFace(36, 'P150'));
      for (const n of [N('C-1705', 'make-up water'), N('C-1705', 'caustic')]) { expect(n.u).toEqual([0, 0, 1]); expect(n.A[0]).toBe(mid(scr, 0)); expect(n.A[1] + gateReach(n.NPS) + 3).toBeLessThanOrEqual(low); }
      for (const n of [N('E-1703', 'steam out'), N('E-1703', 'feed water in')]) { expect(n.u).toEqual([0, 1, 0]); expect(n.A[1]).toBeCloseTo(drum.mx[1], 0); expect(n.A[2]).toBeCloseTo(mid(drum, 2), 6); }
      expect(N('E-1703', 'steam out').A[0]).toBeCloseTo(mid(drum, 0), 6); expect(N('E-1703', 'feed water in').A[0]).toBe(N('E-1703', 'steam out').A[0] - 36); }   // 3 ft toward the gas inlet
    // SW-RPI-3: the five lines routed free are numbered and built with V, each in a run of its own before every other line, the largest first; none has a lane on the rack
    const free = u17.lines.filter(l => l.def.service === 'V' && l.origin === 'process'); expect(free.map(l => l.seq)).toEqual([8, 11, 12, 13, 37]); expect(free.map(l => l.def.NPS)).toEqual([20, 42, 36, 24, 24]);
    for (const l of free) { expect(routedFree(17, l.seq)).toBe(true); expect(l.def.no).toBe(lineNumber(17, l.seq, l.def.NPS, l.def.cls, l.fluid)); expect(l.def.no).toContain('-V-'); }
    for (const l of free.filter(q => q.seq !== 8)) expect(l.bare, l.def.no).toEqual(['from', 'to']);                                          // SW-RPI-14: the ducts, the vapour line, the fractionator's overhead
    expect(free.find(l => l.seq === 8)!.bare).toEqual(['to']);                                                                               // the air line: its one valve at the blower
    const first = [...free].sort((a, b) => b.def.NPS - a.def.NPS || a.seq - b.seq); expect(u17.runs.slice(0, 5).map(r => r.lines[0])).toEqual(first.map(l => l.def.no)); for (const r of u17.runs.slice(0, 5)) expect(r.kind).toBe('overhead');
    expect(u17.runs.filter(r => r.kind === 'rack').some(r => free.some(l => r.lines.includes(l.def.no)))).toBe(false);
    for (let s = 1; s <= M.sheet(15).lines.length; s++) expect(routedFree(15, s)).toBe(false); expect(lineNumber(17, 7, 8, 'P600', 'GO')).toContain('-P-');
    // the fractionator's overhead: its condenser stands last of the air coolers, next the fractionator; each of the condenser's lines runs to the bay nearest its other end, and the bays' branches go with their line
    const ov = free.find(l => l.seq === 37)!, to = u17.nozzles.get((ov.def.to as { id: string }).id)!, bays = c.spots.filter(q => q.item === 'A-1701');
    expect(bays.map(q => q.tag)).toEqual(['A-1701A', 'A-1701B', 'A-1701C']); expect(Math.min(...bays.map(q => q.x))).toBeGreaterThan(Math.max(...c.spots.filter(q => q.lane === 'air' && q.item !== 'A-1701').map(q => q.x)));
    expect(to.equip).toBe('A-1701C'); expect(sp('A-1701C').x).toBeLessThan(sp('C-1701').x); expect(sp('C-1701').x - sp('A-1701C').x).toBeLessThan(sp('C-1701').x - sp('A-1701A').x);
    const kids = u17.lines.filter(l => l.origin === 'spare' && l.flow === 36); expect(kids.length).toBe(2); for (const k of kids) { expect(k.def.service).toBe('V'); expect(k.def.no).toContain('-V-'); expect(k.def.from).toEqual({ k: 'tap', line: ov.def.no, valve: false }); }
    expect(kids.map(k => u17.nozzles.get((k.def.to as { id: string }).id)!.equip)).toEqual(['A-1701B', 'A-1701A']); expect(u17.runs.find(r => r.lines[0] === ov.def.no)!.lines).toEqual([ov.def.no, ...kids.map(k => k.def.no)]);
    const outlet = u17.lines.find(l => l.origin === 'process' && l.seq === 38)!; expect(u17.nozzles.get((outlet.def.from as { id: string }).id)!.equip).toBe('A-1701A');   // toward the trim condenser, which stands that way
    // SW-RPI-7: the wet gas line, 14 in, whose riser would foul an intermediate beam, and the debutaniser's 12 in overhead, both of whose ends stand above the lowest tier, run the top tier
    const lane = (seq: number) => u17.runs.find(r => r.lines[0] === u17.lines.find(l => l.origin === 'process' && l.seq === seq)!.def.no)!.lane!, top = RACK.tiers.length - 1;
    const wet = u17.lines.find(l => l.origin === 'process' && l.seq === 48)!, wn = u17.nozzles.get((wet.def.from as { id: string }).id)!;
    expect(wet.def.NPS).toBe(14); expect(wn.equip).toBe('D-1702'); expect(wn.u).toEqual([0, 1, 0]); expect(lane(48).t).toBe(top);
    { const mids = c.interior.instances.filter(i => i.tags.includes('intermediate-beam')).map(i => i.transform[12]); expect(Math.min(...mids.map(x => Math.abs(x - wn.A[0])))).toBeLessThan(18); }
    const deb = u17.lines.find(l => l.origin === 'process' && l.seq === 74)!; expect(deb.def.NPS).toBe(12); for (const e of [deb.def.from, deb.def.to]) expect(u17.nozzles.get((e as { id: string }).id)!.face[1]).toBeGreaterThan(RACK.tiers[0]); expect(lane(74).t).toBe(top);
    // no line of 12 in or more on a middle tier; none on the lowest whose own connection, square to the rack, stands within the beam's hold of a bent or of the middle of a bay
    for (const r of u17.runs.filter(q => q.kind === 'rack' && q.lane)) { const l = u17.lines.find(q => q.def.no === r.lines[0])!; if (l.def.NPS >= 12) expect([0, top], l.def.no).toContain(r.lane!.t); }
    // SW-RPI-7: a lane no nearer the columns than the generator lays that pipe: 2 ft inside the rack's edge only to 6 in on a tier the columns pass through, to 10 in on the top tier
    for (const r of u17.runs.filter(q => q.kind === 'rack' && q.lane)) { const l = u17.lines.find(q => q.def.no === r.lines[0])!, L = r.lane!; expect(Math.abs(L.z), l.def.no).toBeLessThanOrEqual(c.rack.halfWidth - 24); if (Math.abs(L.z) === c.rack.halfWidth - 24) expect(l.def.NPS, l.def.no).toBeLessThanOrEqual(L.t === top ? 10 : 6); }
    expect(u17.runs.some(r => r.kind === 'rack' && r.lane && Math.abs(r.lane.z) === c.rack.halfWidth - 24)).toBe(true);
    // SW-RPI-9: the reflux's station, whose onward line climbs the fractionator: not between 20 ft and 20 ft and its outlet's length short of the column along the rack
    { const st = u17.stations.find(q => q.after === u17.lines.find(l => l.def.no.endsWith('17715'))!.def.no)!, col = sp('C-1701').x, d = Math.abs(st.at[0] - col); expect(d > 240 + gateFaceToFace(4, 'P150') + 2 * 4 + 48 || d <= 240, `${d}`).toBe(true); expect(u17.runs.find(r => r.lines.includes(st.after))!.kind).toBe(d > 240 ? 'rack' : 'chase'); }
    // SW-RPI-3: a water connection over 12 in is built as a process line (no throttling valve is offered at that size); the water headers keep their letter
    { const big = u17.lines.filter(l => l.origin === 'utility' && FLUIDS[l.fluid].svc.startsWith('CW') && l.def.NPS > 12); expect(big.length).toBeGreaterThan(0); for (const l of big) { expect(l.def.service, l.def.no).toBe('P'); expect(l.def.no).toContain('-P-'); }
      for (const l of u17.lines.filter(q => q.origin === 'utility' && FLUIDS[q.fluid].svc.startsWith('CW') && q.def.NPS <= 12)) expect(l.def.service, l.def.no).toBe(FLUIDS[l.fluid].svc);
      for (const h of u17.lines.filter(q => q.origin === 'header' && FLUIDS[q.fluid].svc.startsWith('CW'))) { expect(h.def.NPS).toBeGreaterThan(12); expect(h.def.service).toBe(FLUIDS[h.fluid].svc); } }
    // SW-CELL-2: its rack is 30 ft wide, for its ten headers; no other unit's rack is changed by counting them
    expect(c.rack.halfWidth).toBe(180); expect(u17.notes.filter(s => /stand .* apart/.test(s))).toEqual([]);
  }, 600_000);
  it('lists every line of the flowsheet with its size, class, service and ends, and a tee for every spare', () => {
    const proc = up.lines.filter(l => l.origin === 'process'); expect(proc.length).toBe(sh.lines.length);
    proc.forEach((l, i) => { const s = z.lines[i], f = sh.lines[i]; expect(l.def.NPS).toBe(s.NPS); expect(l.def.cls).toBe(s.cls); expect(l.def.service).toBe('P'); expect(serviceOf(f.s.fluid, s.cls, false)).toBe('P');   /* a line of the flowsheet is built as a process line whatever it carries (SW-RPI-3) */ expect(l.def.no).toMatch(new RegExp(`-${U * 1000 + i + 1}$`)); expect(l.def.NPS).toBeGreaterThanOrEqual(3); expect(l.designP).toBe(s.designP);
      if (f.cv) expect(!!l.def.cv || !!l.cvOmitted, l.def.no).toBe(true); else expect(!!l.def.cv).toBe(false);
      if (l.def.cv) { const to = l.def.to; expect(to.k).toBe('nozzle'); const n = up.nozzles.get((to as { id: string }).id)!; expect(n.u[1], `${l.def.no} station at ${n.id}`).toBeGreaterThanOrEqual(0); expect(n.service).not.toBe('discharge'); } });
    const spares = up.lines.filter(l => l.origin === 'spare'); let want = 0;
    for (const f of sh.lines) for (const en of [f.from, f.to]) if (en.k === 'eq') want += up.cell.spots.filter(q => q.item === en.tag).length - 1;
    expect(spares.length).toBe(want); for (const l of spares) { expect([l.def.from.k, l.def.to.k].sort()).toEqual(['nozzle', 'tap']); expect(Number(l.def.no.slice(-5)) - U * 1000).toBeGreaterThan(300); }
    expect(new Set(up.lines.map(l => l.def.no)).size).toBe(up.lines.length);
  });
  it('gives each utility a header on the rack and each connection a valved take-off', () => {
    const fluids = new Set(z.utils.map(u => u.fluid)), headers = up.lines.filter(l => l.origin === 'header'); expect(headers.length).toBe(fluids.size);
    for (const h of headers) { expect(h.def.kind).toBe('header'); const taps = up.lines.filter(l => l.origin === 'utility' && l.fluid === h.fluid); expect(taps.length).toBeGreaterThan(0); for (const t of taps) { expect(h.def.NPS).toBeGreaterThanOrEqual(t.def.NPS); const tap = t.def.from.k === 'tap' ? t.def.from : t.def.to; expect(tap.k === 'tap' && tap.line === h.def.no && tap.valve).toBe(true); } }
    expect(up.lines.filter(l => l.origin === 'utility').length).toBe(z.utils.length);
  });
  it('a header is of its plant header\'s class and conditions, sized for the larger of what is taken and made; a connection fed or drained under control is divided at a station (SW-PRC-19, SW-RPI-5, SW-RPI-9)', () => {
    expect(stationed({ fluid: 'BW', dir: 'to' })).toBe(true); expect(stationed({ fluid: 'CO', dir: 'from' })).toBe(true); expect(stationed({ fluid: 'CA', dir: 'to' })).toBe(true);
    for (const f of ['HS', 'MS', 'LS', 'CWS', 'FG']) expect(stationed({ fluid: f, dir: 'to' }), f).toBe(false); expect(stationed({ fluid: 'CWR', dir: 'from' })).toBe(false); expect(stationed({ fluid: 'LS', dir: 'from' })).toBe(false);
    // the system's conditions: no lower than unit 19's line or any connection without a station; a connection without a station has them, and its item's side with it
    const s19 = M.sheet(19), z19 = Z.get(19)!;
    for (const h of M.headers) {
      const hd = headerDesign(h.fluid), i = s19.lines.findIndex(l => [l.from, l.to].some(e => e.k === 'bl' && e.name === h.key)); expect(i, h.key).toBeGreaterThanOrEqual(0);
      expect(z19.lines[i].designP, h.key).toBe(hd.designP); expect(z19.lines[i].designT, h.key).toBe(hd.designT); expect(z19.lines[i].cls).toBe(hd.cls);
      for (const sheet of M.sheets) for (const u of Z.get(sheet.no)!.utils.filter(q => q.fluid === h.fluid)) {
        if (stationed(u)) continue;
        expect(u.designP, `${u.tag} ${u.port}`).toBe(hd.designP); expect(u.designT).toBe(hd.designT); expect(u.cls).toBe(hd.cls);
        const side = Z.get(sheet.no)!.equip.get(u.tag)!.sides; if (Object.keys(side).length) expect(Math.max(...Object.values(side).map(q => q.designP)), `${u.tag} side`).toBeGreaterThanOrEqual(hd.designP);
      }
    }
    expect(headerDesign('BW').cls).toBe('P1200'); expect(headerDesign('CO').cls).toBe('P150'); expect(headerDesign('HS').designP).toBeGreaterThan(headerDesign('MS').designP);
    let stations = 0;
    for (const u of [11, 12, 13, 14, 15, 16, 17, 18, 19]) {
      const q = u === U ? up : unitPiping(u), zu = Z.get(u)!, hs = unitHeaders(u, tag => q.cell.spots.some(sp => sp.item === tag));
      expect(q.lines.filter(l => l.origin === 'header').map(l => l.def.no)).toEqual(q.headers.map(h => h.line)); expect(hs.length).toBe(q.headers.length);
      // SW-RPI-5: the headers are those of the unit's utilities, in the order given to the generator (a header of 12 in and more may be given earlier, to keep its spool clear of the main rack's columns)
      const fluidOf = (x: { line: string }) => q.lines.find(v => v.def.no === x.line)!.fluid;
      expect(q.headers.map(fluidOf).sort()).toEqual(hs.map(x => x.fluid).sort());
      for (const h of hs) {
        const k = q.headers.findIndex(x => fluidOf(x) === h.fluid), l = q.lines.find(x => x.def.no === q.headers[k].line)!, hd = headerDesign(h.fluid), us = h.utils.map(i => zu.utils[i]);
        expect(l.fluid).toBe(h.fluid); expect(l.def.cls, `unit ${u} ${h.fluid}`).toBe(hd.cls); expect(l.designP).toBe(hd.designP); expect(l.designT).toBe(hd.designT); expect(l.def.NPS).toBe(h.NPS);
        expect(h.takes).toBeCloseTo(us.filter(x => x.dir === 'to').reduce((a, x) => a + x.w, 0), 6); expect(h.makes).toBeCloseTo(us.filter(x => x.dir === 'from').reduce((a, x) => a + x.w, 0), 6);
        for (const x of us) expect(h.NPS, `unit ${u} ${h.fluid}`).toBeGreaterThanOrEqual(connection(x).NPS);
        // each connection taps the header through a valve in the header's class: itself, or the part of it on the header's side of its station
        for (const i of h.utils) {
          const x = zu.utils[i], parts = q.lines.filter(v => v.util === i), big = x.NPS > 12 && FLUIDS[x.fluid].svc.startsWith('CW'), tapped = parts.filter(v => [v.def.from, v.def.to].some(e => e.k === 'tap' && e.line === l.def.no && e.valve === !big));   // SW-RPI-3: a water connection over 12 in has its one valve at the item, none at its take-off
          expect(tapped.length, `unit ${u} ${x.tag} ${x.port}`).toBe(1); expect(tapped[0].def.cls).toBe(hd.cls); expect(tapped[0].designP).toBe(hd.designP);
          if (!stationed(x)) { expect(parts.length).toBe(1); expect(parts[0].station).toBeUndefined(); continue; }
          stations++; expect(parts.length).toBe(2); const ahead = parts.find(v => v.origin === 'utility')!, after = parts.find(v => v.origin === 'control')!, st = q.stations.find(v => v.tag === ahead.station)!;
          expect(ahead.def.cv).toBe(true); expect(ahead.def.to).toEqual({ k: 'nozzle', id: `${st.tag}-A` }); expect(after.def.from).toEqual({ k: 'nozzle', id: `${st.tag}-B` }); expect(st.line).toBe(ahead.def.no); expect(st.after).toBe(after.def.no);
          expect(after.def.NPS).toBe(ahead.def.NPS); expect(q.nozzles.get(`${st.tag}-A`)!.cls).toBe(ahead.def.cls); expect(q.nozzles.get(`${st.tag}-B`)!.cls).toBe(after.def.cls);
          const item = x.dir === 'to' ? after : ahead, own = x.dir === 'to' ? ahead : after; expect(item.def.cls).toBe(x.cls); expect(item.designP).toBe(x.designP); expect(own).toBe(tapped[0]);
          expect(Number(ahead.def.no.slice(-5)) - u * 1000).toBe(500 + i + 1); const n = Number(after.def.no.slice(-5)) - u * 1000; expect(n).toBeGreaterThan(550); expect(n).toBeLessThanOrEqual(600);
          expect(st.at[1]).toBe(36);
        }
      }
    }
    expect(stations).toBe(24);   /* with the cracking unit's eight: */   // eight feed water connections to steam generators and eight condensate connections from steam heaters, in the units piped
  }, 240_000);
  it('ends each header at the limit in a spool on the top tier, in its own lane, the top tier\'s spools taken in turn into two rows (SW-RPI-4, SW-RPI-15)', () => {
    const top = RACK.tiers.length - 1, od = (q: { NPS: number; cls: never }) => pipeDims(q.NPS, q.cls).OD, f = (q: { NPS: number; cls: never }) => designFlange(q.NPS, q.cls).OD, w = (q: { NPS: number; cls: never }) => gateWidth(q.NPS, q.cls);
    for (const u of [11, 12, 13, 14, 15, 16, 17, 18, 19]) {
      const q = u === U ? up : unitPiping(u), row = q.spools.filter(s => s.tier === top).sort((a, b) => a.at[2] - b.at[2]) as (typeof q.spools[number] & { cls: never })[], heads = row.filter(s => s.header);
      expect(heads.length, `unit ${u}`).toBe(q.headers.length); expect(q.feeds.length).toBe(heads.length); expect(q.spools.filter(s => s.header && s.tier !== top).length).toBe(0);
      for (const [i, s] of row.entries()) {
        expect(s.at[0], `unit ${u} ${s.tag}`).toBe(i % 2 ? RACK.start - RACK.bent / 2 : RACK.start - RACK.bent + 30); expect(s.at[1]).toBe(Math.ceil((RACK.tiers[top] + 4 + od(s) / 2) / 6 - 1e-9) * 6);
        if (s.lane !== undefined) expect(s.at[2], s.tag).toBe(s.lane);                                                                          // on its lane, not moved
        if (i) expect(s.at[2] - row[i - 1].at[2], `unit ${u} ${s.tag} past its neighbour`).toBeGreaterThanOrEqual(Math.max(od(s) + f(row[i - 1]), f(s) + od(row[i - 1])) / 2 + 4 - 1e-9);
        if (i > 1) expect(s.at[2] - row[i - 2].at[2], `unit ${u} ${s.tag} beside the next of its row`).toBeGreaterThanOrEqual(Math.max((f(s) + f(row[i - 2])) / 2 + 6, (w(s) + w(row[i - 2])) / 2 + 3) - 1e-9);
        expect(Math.abs(s.at[2]) + f(s) / 2).toBeLessThanOrEqual(q.cell.rack.halfWidth - 12);
        const inner = q.nozzles.get(`${s.tag}-U`)!, outer = q.nozzles.get(`${s.tag}-P`)!; expect(inner.u).toEqual([1, 0, 0]); expect(outer.u).toEqual([-1, 0, 0]); expect(inner.face[0] - outer.face[0]).toBe(24);
      }
      for (const s of heads) {
        const h = q.headers.find(x => x.line === s.line)!, l = q.lines.find(x => x.def.no === s.line)!, fd = q.feeds.find(x => x.tag === s.tag)!, hz = unitHeaders(u, tag => q.cell.spots.some(sp => sp.item === tag)).find(x => x.fluid === l.fluid)!;
        expect(s.at[2]).toBe(h.z); expect(s.lane).toBe(h.z); expect(s.NPS).toBe(l.def.NPS); expect(s.cls).toBe(l.def.cls); expect(s.stream).toBe(hz.key); expect(s.dir).toBe(hz.takes >= hz.makes ? 'in' : 'out');
        expect(Number(s.tag.slice(-2))).toBeGreaterThan(q.spools.filter(x => !x.header).length);                                               // tagged after the unit's other spools
        // its valve: a stub on the spool's inner face, of the header's size and class, in the last run; not a line of the unit's list
        expect(fd.header).toBe(l.def.no); expect(fd.stub).toMatchObject({ kind: 'stub', NPS: l.def.NPS, cls: l.def.cls, service: l.def.service, from: { k: 'nozzle', id: `${s.tag}-U` }, to: { k: 'blind' } });
        expect(q.lines.some(x => x.def.no === fd.stub.no)).toBe(false); expect(q.plant.lines().some(x => x.no === fd.stub.no)).toBe(true); expect(q.runs[q.runOf.get(fd.stub.no)!].kind).toBe('rest');
        const n = Number(fd.stub.no.slice(-5)) - u * 1000; expect(n).toBeGreaterThan(450); expect(n).toBeLessThan(500);
      }
      // a line of the top tier that passes the valve bay keeps a pipe's width and 4 in from a header's flange there
      for (const L of q.foreseen.filter(x => x.t === top && x.no !== undefined && x.x0 <= q.cell.rack.x0 + 12)) for (const s of heads) expect(Math.abs(L.z - s.at[2]), `unit ${u} ${L.no} past ${s.tag}`).toBeGreaterThanOrEqual((L.OD + f(s)) / 2 + 4 - 1e-9);
    }
  }, 240_000);
  it('ends every stream at the battery limit in a spool in the valve bay, on its line\'s lane, a flange apart, at its line\'s elevation (SW-RPI-4)', () => {
    const bl = sh.lines.filter(l => l.from.k === 'bl' || l.to.k === 'bl').length; expect(up.spools.filter(s => !s.header).length).toBe(bl);
    for (const t of [...RACK.tiers.keys()].slice(0, -1)) {   // the top tier, where the headers' spools stand too, has a test of its own (SW-RPI-15)
      const row = up.spools.filter(s => s.tier === t).sort((a, b) => a.at[2] - b.at[2]);
      for (const [i, s] of row.entries()) {
        expect(s.at[0]).toBeGreaterThan(RACK.start - RACK.bent); expect(s.at[0]).toBeLessThan(RACK.start - 60); expect(s.at[1]).toBe(Math.ceil((RACK.tiers[t] + 4 + pipeDims(s.NPS, s.cls).OD / 2) / 6 - 1e-9) * 6);
        const inner = up.nozzles.get(`${s.tag}-U`)!, outer = up.nozzles.get(`${s.tag}-P`)!; expect(inner.u).toEqual([1, 0, 0]); expect(outer.u).toEqual([-1, 0, 0]); expect(inner.face[0] - outer.face[0]).toBe(24);
        if (i) expect(s.at[2] - row[i - 1].at[2]).toBeGreaterThanOrEqual((designFlange(s.NPS, s.cls).OD + designFlange(row[i - 1].NPS, row[i - 1].cls).OD) / 2 + 6 - 1e-9);
        if (i) expect(s.at[2] - row[i - 1].at[2], `${s.tag} handwheels`).toBeGreaterThanOrEqual((gateWidth(s.NPS, s.cls) + gateWidth(row[i - 1].NPS, row[i - 1].cls)) / 2 + 3 - 1e-9);   // their valves stand stem up side by side
        expect(Math.abs(s.at[2])).toBeLessThan(up.cell.rack.halfWidth);
        const tall = gateReach(s.NPS) > RACK.tiers[1] - RACK.tiers[0] - 12, highest = Math.max(0, ...up.lines.map(l => l.tier ?? 0));
        expect(s.tier).toBe(up.lines.find(l => l.def.no === s.line)!.tier ?? (tall ? highest : 0));         // at its line's tier; with no lane, on the lowest, or the highest in use where its valve is too tall to stand under another
      }
      // on their lanes, in order; spread only where flanges would be closer than 6 in, about the same middle; those with no lane beyond the row's ends
      const laned = row.filter(s => s.lane !== undefined); expect(laned.every((v, i) => !i || laned[i - 1].lane! <= v.lane!)).toBe(true);
      if (laned.length) { expect(Math.abs(laned.reduce((a, q) => a + q.at[2] - q.lane!, 0) / laned.length)).toBeLessThanOrEqual(6); for (const q of laned) expect(Math.abs(q.at[2] - q.lane!), q.tag).toBeLessThanOrEqual(48); }
      for (const [i, q] of laned.entries()) { const a = laned[i - 1], b = laned[i + 1], f = (x: typeof q) => designFlange(x.NPS, x.cls).OD, free = (x: typeof q | undefined) => !x || Math.abs(x.lane! - q.lane!) >= (f(x) + f(q)) / 2 + 6 + 12; if (free(a) && free(b) && laned.length < 3) expect(q.at[2], q.tag).toBe(q.lane); }
      for (const q of row.filter(s => s.lane === undefined)) if (laned.length) expect(q.at[2] < laned[0].at[2] || q.at[2] > laned[laned.length - 1].at[2], q.tag).toBe(true);
    }
  });
  it('sets the connections of the desalter, a horizontal reactor, a boiler, a deaerator and an air compressor where their rules say (SW-RPI-2)', () => {
    const nz = (q: ReturnType<typeof unitPiping>, tag: string, service: string) => { const n = [...q.nozzles.values()].find(x => x.equip === tag && x.service === service); expect(n, `${tag} ${service}`).toBeDefined(); return n!; };
    // the desalter: fed and drained from underneath, its oil from the top at the far end; its shell high enough for the valve under its inlet
    const u11 = unitPiping(11), des = u11.cell.spots.find(q => q.tag === 'D-1101')!, dIn = nz(u11, 'D-1101', 'inlet'), dOil = nz(u11, 'D-1101', 'oil'), dBr = nz(u11, 'D-1101', 'brine');
    expect(dIn.u).toEqual([0, -1, 0]); expect(dBr.u).toEqual([0, -1, 0]); expect(dOil.u).toEqual([0, 1, 0]); expect(dIn.A[0]).toBeLessThan(des.x); expect(dOil.A[0]).toBeGreaterThan(des.x); expect(dBr.A[0]).toBeGreaterThan(des.x);
    expect(des.yc! - des.R! - PAD).toBeGreaterThanOrEqual(valveDrop(dIn.NPS, dIn.cls) - 1e-6);
    // a horizontal reactor: its outlet underneath, with room for its valve
    const u18 = unitPiping(18), rx = u18.cell.spots.find(q => q.tag === 'R-1801')!, rOut = nz(u18, 'R-1801', 'outlet'); expect(rx.shape).toBe('hv'); expect(rOut.u).toEqual([0, -1, 0]); expect(rx.yc! - rx.R! - PAD).toBeGreaterThanOrEqual(valveDrop(rOut.NPS, rOut.cls) - 1e-6);
    // the sulfur unit's tanks stand after its other vessels
    const row = u18.cell.spots.filter(q => q.side === -1 && q.lane === 'vessel'), firstTank = row.findIndex(q => q.shape === 'tank'); expect(firstTank).toBeGreaterThan(0); expect(row.slice(firstTank).every(q => q.shape === 'tank')).toBe(true);
    // a boiler: steam from the superheater's header on top, feed water at the economizer away from the burners, blowdown from the mud drum toward the rack, fuel gas at a burner's windbox
    const u19 = unitPiping(19), box = (tag: string, re: RegExp) => { const bs = bodySolids(u19.cell, tag).filter(b => re.test(b.name)); expect(bs.length, `${tag} ${re}`).toBeGreaterThan(0); return { mn: [0, 1, 2].map(k => Math.min(...bs.map(b => b.mn[k]))), mx: [0, 1, 2].map(k => Math.max(...bs.map(b => b.mx[k]))) }; };
    for (const b of ['B-1901', 'B-1902']) {
      const st = nz(u19, b, 'steam'), fw = nz(u19, b, 'feed water'), bd = nz(u19, b, 'blowdown'), fg = nz(u19, b, 'fuel gas'), sh = box(b, /^superheater headers/), ec = box(b, /^economizer water headers/), mud = box(b, /^mud drum/), wb = box(b, /^burner 1: windbox/), sp = u19.cell.spots.find(q => q.tag === b)!;
      expect(st.u).toEqual([0, 1, 0]); expect(st.A[1]).toBeCloseTo(sh.mx[1], 6); expect(st.A[0]).toBeGreaterThan(sh.mn[0]); expect(st.A[0]).toBeLessThan(sh.mx[0]);
      expect(fw.A[0]).toBeGreaterThan(ec.mn[0] - 6); expect(fw.A[0]).toBeLessThan(ec.mx[0] + 6); expect(Math.abs(fw.u[2])).toBe(1); expect(Math.sign(fw.u[2])).toBe(-Math.sign((wb.mn[2] + wb.mx[2]) / 2 - sp.z));
      expect(bd.u).toEqual([0, 0, -sp.side]); expect(bd.A[1]).toBeGreaterThan(mud.mn[1]); expect(bd.A[1]).toBeLessThan(mud.mx[1]); expect(Math.abs(fg.u[0])).toBe(1); expect(fg.A[1]).toBeGreaterThan(wb.mn[1]); expect(fg.A[1]).toBeLessThan(wb.mx[1]);
      expect(bodySolids(u19.cell, b).some(q => /^superheated steam outlet: /.test(q.name))).toBe(false);           // the catalogue's drawn outlet gives way to the plant's own connection
    }
    // the deaerator: water and steam on its dome, the deaerated water from under the storage shell
    const dome = box('V-1904', /^dome shell$/), da = u19.cell.spots.find(q => q.tag === 'V-1904')!;
    for (const p of ['make-up', 'condensate', 'steam', 'flash steam']) { const n = nz(u19, 'V-1904', p); expect(n.A[1], p).toBeGreaterThan(dome.mn[1]); expect(n.A[0]).toBeGreaterThanOrEqual(dome.mn[0] - 1e-6); expect(n.A[0]).toBeLessThanOrEqual(dome.mx[0] + 1e-6); }
    expect(nz(u19, 'V-1904', 'make-up').u).toEqual([0, 1, 0]); expect(nz(u19, 'V-1904', 'steam').u).toEqual([-1, 0, 0]); expect(nz(u19, 'V-1904', 'outlet').u).toEqual([0, -1, 0]); expect(nz(u19, 'V-1904', 'outlet').A[1]).toBeCloseTo(da.yc! - da.R!, 6);
    // an air compressor drawing from the atmosphere: its discharge on top of the casing
    expect(nz(u19, 'K-1903A', 'discharge').u).toEqual([0, 1, 0]);
    // items on another plot (the cooling tower's group) are reached through spools at the limit; lines wholly of that plot are not in this list
    const sh19 = M.sheet(19), tower = new Set(['X-1903', 'P-1905', 'P-1906', 'F-1902']), touches = (l: typeof sh19.lines[number]) => [l.from, l.to].some(e => e.k === 'eq' && tower.has(e.tag));
    for (const t of tower) expect([...u19.nozzles.values()].some(n => n.equip.startsWith(t))).toBe(false);
    // the make-up to the tower comes from this plot's raw water line: it ends at a spool named after the tower's connection; the tower's own lines are not in this list
    const toTower = u19.spools.filter(q => [...tower].some(t => q.stream.startsWith(t))); expect(toTower.map(q => q.stream)).toEqual(['X-1903 make-up']); expect(u19.lines.some(l => l.def.no === toTower[0].line)).toBe(true);
    const own = sh19.lines.filter(l => touches(l) && ![l.from, l.to].some(e => e.k === 'tap' && !touches(sh19.lines[e.line]))); expect(own.length).toBeGreaterThan(3);
    expect(u19.lines.filter(l => l.origin === 'process').length).toBe(sh19.lines.length - own.length);
  }, 240_000);
  it('a connection passes clear of its own body\'s buckstays, pedestals and drawn nozzles (SW-CELL-4; SW-EQC-50, -51, -53 amended 2026-11-27)', () => {
    // each connection a solid cylinder of its flange's radius from its root to its face; a triangle of a solid, clipped to that length along the axis, enters it where it comes nearer the axis than that
    const least = (a: number[], u: number[], L: number, P: ArrayLike<number>, I: ArrayLike<number>) => {
      const t0 = Math.abs(u[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], e1n = [t0[1] * u[2] - t0[2] * u[1], t0[2] * u[0] - t0[0] * u[2], t0[0] * u[1] - t0[1] * u[0]], l1 = Math.hypot(...e1n), e1 = e1n.map(v => v / l1), e2 = [u[1] * e1[2] - u[2] * e1[1], u[2] * e1[0] - u[0] * e1[2], u[0] * e1[1] - u[1] * e1[0]];
      const loc = (k: number) => { const r = [P[3 * k] - a[0], P[3 * k + 1] - a[1], P[3 * k + 2] - a[2]], d = (v: number[]) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]; return [d(e1), d(e2), d(u)]; };
      const clip = (p: number[][], t: number, above: boolean) => { const o: number[][] = []; p.forEach((q, i) => { const n = p[(i + 1) % p.length], iq = above ? q[2] >= t : q[2] <= t, inn = above ? n[2] >= t : n[2] <= t; if (iq) o.push(q); if (iq !== inn) { const s = (t - q[2]) / (n[2] - q[2]); o.push([q[0] + s * (n[0] - q[0]), q[1] + s * (n[1] - q[1]), t]); } }); return o; };
      let best = Infinity;
      for (let t = 0; t < I.length; t += 3) {
        const p = clip(clip([loc(I[t]), loc(I[t + 1]), loc(I[t + 2])], 0, true), L, false); if (p.length < 2) continue;
        let pos = 0, neg = 0; p.forEach((q, i) => { const n = p[(i + 1) % p.length], dx = n[0] - q[0], dy = n[1] - q[1], l2 = dx * dx + dy * dy, s = l2 > 0 ? Math.max(0, Math.min(1, -(q[0] * dx + q[1] * dy) / l2)) : 0; best = Math.min(best, Math.hypot(q[0] + s * dx, q[1] + s * dy)); const c = q[0] * n[1] - q[1] * n[0]; if (c > 1e-12) pos++; else if (c < -1e-12) neg++; });
        if (p.length >= 3 && pos + neg > 0 && (pos === 0 || neg === 0)) best = 0;
      }
      return best;
    };
    const kinds = /^buckstays|^turbine: pedestals$|^vent: |steam drum steam outlet: /, seen = new Set<string>();
    for (const u of [11, 12, 14, 17, 18, 19]) {
      const q = unitPiping(u), parts = new Map(q.cell.interior.equipment.map(e => [e.tag, e]));
      const solidsAt = new Map<string, { name: string; P: Float64Array; I: ArrayLike<number> }[]>();
      for (const n of q.nozzles.values()) {
        const b = parts.get(n.equip); if (!b) continue;
        let ss = solidsAt.get(n.equip); if (!ss) { const T = b.transform; ss = buildGeometry(b.part).solids.filter(s => kinds.test(s.name)).map(s => { const P = s.mesh.positions, W = new Float64Array(P.length); for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) W[i + k] = T[k] * P[i] + T[4 + k] * P[i + 1] + T[8 + k] * P[i + 2] + T[12 + k]; return { name: s.name, P: W, I: s.mesh.indices }; }); solidsAt.set(n.equip, ss); }
        for (const s of ss) { seen.add(`${n.equip} ${s.name.replace(/: .*$/, '')}`); expect(least(n.A, n.u, n.S, s.P, s.I) - designFlange(n.NPS, n.cls).OD / 2, `${n.id} against ${n.equip} ${s.name}`).toBeGreaterThan(0); }
      }
    }
    for (const w of ['H-1101 buckstays W6', 'H-1201 buckstays W6', 'K-1401 turbine', 'K-1702 turbine', 'V-1904 vent']) expect(seen.has(w), w).toBe(true);
    expect(bodySolids(unitPiping(18).cell, 'H-1801').some(b => /steam drum steam outlet: /.test(b.name))).toBe(false);   // the furnace's drawn steam outlet gives way to the plant's own, as the flue gas cooler's does
  }, 240_000);
  it('a valve at the limit too tall to stand under another tier stands on the top tier, in every unit (SW-RPI-4)', () => {
    for (const u of [11, 13, 14, 16, 18]) {
      const q = unitPiping(u), highest = Math.max(0, ...q.lines.map(l => l.tier ?? 0));
      for (const s of q.spools) if (gateReach(s.NPS) > RACK.tiers[1] - RACK.tiers[0] - 12) { const l = q.lines.find(x => x.def.no === s.line)!; expect(s.tier, `unit ${u} ${s.tag}`).toBe(l.tier !== undefined ? RACK.tiers.length - 1 : highest); expect(q.spools.filter(x => x.tier > s.tier).length).toBe(0); }
      // a column's overhead line that does not run the rack has a run of its own, before any line of the rack (SW-RPI-7)
      const firstRack = q.runs.findIndex(r => r.kind === 'rack');
      for (const sp of q.cell.spots.filter(x => x.shape === 'vv' && x.floors)) { const top = [...q.nozzles.values()].find(n => n.equip === sp.tag && n.u[1] > 0); if (!top) continue; const l = q.lines.find(x => [x.def.from, x.def.to].some(e => e.k === 'nozzle' && e.id === top.id))!;
        if (l.tier === undefined && l.def.from.k === 'nozzle' && l.def.to.k === 'nozzle' && !q.spools.some(x => x.line === l.def.no)) { const k = q.runOf.get(l.def.no)!; expect(q.runs[k].kind, `unit ${u} ${l.def.no}`).toBe('overhead'); expect(q.runs[k].lines[0]).toBe(l.def.no); if (firstRack >= 0) expect(k).toBeLessThan(firstRack); } }
    }
  }, 240_000);
  it('gives each line that runs the rack a tier and a lane, and runs the generator once for each such line (SW-RPI-7)', () => {
    const xOf = (id: string) => up.nozzles.get(id)!.face[0], onRack = up.lines.filter(l => l.tier !== undefined), top = RACK.tiers.length - 1, most = (hw: number) => TIER_SHARE * (2 * hw - 48);
    expect(onRack.length).toBeGreaterThan(8); expect(up.tierRoom).toBeGreaterThanOrEqual(TIER_ROOM); expect(up.tierRoom).toBeLessThanOrEqual(most(up.cell.rack.halfWidth));
    for (const l of onRack) { expect(l.def.service).toBe('P'); expect(l.def.from.k).toBe('nozzle'); expect(l.def.to.k).toBe('nozzle'); }
    for (const l of up.lines.filter(q => q.def.service === 'P' && q.def.from.k === 'nozzle' && q.def.to.k === 'nozzle' && !q.def.from.id.startsWith('BL-') && !q.def.to.id.startsWith('BL-') && !/^RS-/.test(q.def.from.id + q.def.to.id)))
      expect(l.tier !== undefined, l.def.no).toBe(Math.abs(xOf((l.def.from as { id: string }).id) - xOf((l.def.to as { id: string }).id)) > 240);
    // the spacing: 4 in and smaller 12 in apart; 6 to 12 in 18 in from any line of 12 in or smaller; 14 and 16 in 24 in from one of 6 to 16 in; 18 to 24 in 24 in from one of 12 in or smaller, 30 in from a larger; never less than the generator's own
    const od = (n: number) => pipeDims(n, 'P150').OD; expect(heldAs(2)).toBe(3); expect(heldAs(2.9)).toBe(3); expect(heldAs(3)).toBe(9); expect(heldAs(8.9)).toBe(9); expect(heldAs(9)).toBe(15);
    expect(laneSpacing(od(4), od(4))).toBe(12); expect(laneSpacing(od(3), od(2))).toBe(12); expect(laneSpacing(od(6), od(4))).toBe(18); expect(laneSpacing(od(8), od(8))).toBe(18); expect(laneSpacing(od(10), od(2))).toBe(18); expect(laneSpacing(od(12), od(12))).toBe(18);
    expect(laneSpacing(od(14), od(4))).toBe(18); expect(laneSpacing(od(14), od(6))).toBe(24); expect(laneSpacing(od(16), od(16))).toBe(24); expect(laneSpacing(od(24), od(12))).toBe(24); expect(laneSpacing(od(18), od(14))).toBe(30); expect(laneSpacing(od(24), od(24))).toBe(30);
    for (const a of [2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24]) for (const b of [2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24]) { expect(laneSpacing(od(a), od(b))).toBe(laneSpacing(od(b), od(a))); expect(laneSpacing(od(a), od(b))).toBeGreaterThanOrEqual((od(a) + od(b)) / 2 + 3); }
    for (const u of [11, 13, 14, 16, 18, 19]) {
      const q = u === U ? up : unitPiping(u), hw = q.cell.rack.halfWidth, lanes = q.foreseen, isHeader = (L: typeof lanes[number]) => L.no === undefined && L.x0 === q.cell.rack.x0 && L.x1 === q.cell.rack.x1, rack = q.lines.filter(x => x.tier !== undefined);
      expect(lanes.filter(isHeader).length, `unit ${u}`).toBe(q.headers.length);
      // every line that runs the rack has its lane: on the 6 in grid within the tier's lanes, as wide as its pipe, over the stretch between its ends
      for (const l of rack) { const L = lanes.filter(x => x.no === l.def.no); expect(L.length, `unit ${u} ${l.def.no}`).toBe(1); expect(L[0].t).toBe(l.tier); expect(Math.abs(L[0].z)).toBeLessThanOrEqual(hw - 24); expect(Math.abs(L[0].z % 6)).toBe(0); expect(L[0].OD).toBe(pipeDims(l.def.NPS, l.def.cls).OD); expect(L[0].x1 - L[0].x0).toBeGreaterThan(36);
        // one of 14 in and larger on the lowest tier or the top
        if (l.def.NPS >= BIG) expect([0, top], `unit ${u} ${l.def.no}`).toContain(l.tier); }
      // no two lanes of a tier nearer over the same stretch than lets a pipe in either pass the other held as a box; headers among themselves by the generator's spacing; a root spool's place is in its branch's own lane
      for (let i = 0; i < lanes.length; i++) for (let j = i + 1; j < lanes.length; j++) { const a = lanes[i], b = lanes[j]; if (a.t !== b.t || a.x1 < b.x0 - 24 || a.x0 > b.x1 + 24) continue;
        const spool = (L: typeof a, M: typeof a) => L.no === undefined && !isHeader(L) && M.no !== undefined && q.roots.some(r => r.line === M.no && r.at[2] === L.z && Math.abs(r.at[0] - (L.x0 + L.x1) / 2) < 1); if (spool(a, b) || spool(b, a)) { expect(a.z).toBe(b.z); continue; }
        // SW-RPI-15: a header's stretch in the valve bay, as wide as its flange there: it is its own header's lane carried on, and beside another header's it is a matter of the spools' two rows, which the spools' test checks
        const inBay = (L: typeof a) => L.no === undefined && L.x0 === RACK.start - RACK.bent && L.x1 === q.cell.rack.x0; if ((inBay(a) || inBay(b)) && a.no === undefined && b.no === undefined) continue;
        expect(Math.abs(a.z - b.z), `unit ${u} tier ${a.t + 1}: ${a.no ?? 'header or spool'} at ${a.z}, ${b.no ?? 'header or spool'} at ${b.z}`).toBeGreaterThanOrEqual(isHeader(a) && isHeader(b) ? (a.OD + b.OD) / 2 + 3 : laneSpacing(a.OD, b.OD)); }
      // each root spool of a branch that runs the rack stands in that branch's lane (SW-RPI-8)
      for (const r of q.roots) { const L = lanes.find(x => x.no === r.line); if (L) { expect(r.at[2], `unit ${u} ${r.tag}`).toBe(L.z); expect(r.tier).toBe(L.t); } }
      // no tier loaded beyond the unit's room at any section, a pipe's width and 3 in for each lane over it; the top tier, whose count starts with the headers, to 85 % of its lanes by the lines that go there first
      for (const t of [0, 1, 2]) for (let x = q.cell.rack.x0 + 24; x <= q.cell.rack.x1 - 24; x += 24) { const over = lanes.filter(L => L.t === t && (L.no !== undefined || isHeader(L)) && L.x0 <= x && L.x1 >= x), w = over.reduce((a, L) => a + L.OD + 3, 0);
        expect(w, `unit ${u} tier ${t + 1} at x ${x}`).toBeLessThanOrEqual((t === top ? Math.max(q.tierRoom, most(hw)) : q.tierRoom) + 1e-9); }
      // a line of 14 in and larger with a connection above the rack's top tier runs on the top tier
      for (const l of rack) if (l.def.NPS >= BIG && !q.spools.some(x => x.line === l.def.no) && [l.def.from, l.def.to].some(e => e.k === 'nozzle' && !/^(BL|RS)-/.test(e.id) && q.nozzles.get(e.id)!.face[1] > RACK.tiers[top])) expect(l.tier, `unit ${u} ${l.def.no}`).toBe(top);
      // a line with both its ends on one side of the rack lies on that half, nearly always (where that half has a lane for it)
      const zEnd = (e: { k: string; id?: string }) => (e.k === 'nozzle' && !e.id!.startsWith('BL-') ? q.nozzles.get(e.id!)!.face[2] : undefined); let one = 0, own = 0;
      for (const L of lanes.filter(x => x.no !== undefined)) { const d = q.lines.find(x => x.def.no === L.no)!.def, zs = [zEnd(d.from), zEnd(d.to)].filter((v): v is number => v !== undefined), sd = zs.length && zs.every(v => v > 0) ? 1 : zs.length && zs.every(v => v < 0) ? -1 : 0; if (sd) { one++; if (L.z * sd >= 0) own++; } }
      expect(one, `unit ${u}`).toBeGreaterThan(8); expect(own / one, `unit ${u}`).toBeGreaterThan(0.85);
    }
    // the runs: every line in one; first the overheads, then each line of the rack with the branches that tap it, the largest first, then the rest
    expect(up.tiers).toEqual([...new Set(onRack.map(l => l.tier!))].sort((a, b) => a - b));
    const kinds = up.runs.map(r => r.kind); expect(kinds.join(',')).toMatch(/^(overhead,)*((rack|chase),)+rest$/); expect(up.runs.flatMap(r => r.lines).sort()).toEqual([...up.lines.map(l => l.def.no), ...up.feeds.map(f => f.stub.no)].sort());   // with the stubs of the headers' valves at the limit (SW-RPI-15)
    for (const [k, r] of up.runs.entries()) for (const no of r.lines) expect(up.runOf.get(no)).toBe(k);
    const rackRuns = up.runs.filter(r => r.kind === 'rack'), size = (no: string) => up.lines.find(l => l.def.no === no)!.def.NPS; expect(rackRuns.length).toBe(onRack.length);
    for (const [i, r] of rackRuns.entries()) { const l = up.lines.find(x => x.def.no === r.lines[0])!; expect(l.tier).toBe(r.lane!.t); expect(r.lane!.no).toBe(l.def.no); expect(r.lane).toBe(up.foreseen.find(L => L.no === l.def.no)); if (i) expect(size(r.lines[0])).toBeLessThanOrEqual(size(rackRuns[i - 1].lines[0])); }
    // a line that rises to a connection high on a column without running the rack has a run of its own too, in every unit prepared, taken in with the rack's lines by size
    for (const u of [11, 13, 14, 16, 18]) { const q = u === U ? up : unitPiping(u), single = q.runs.filter(r => r.kind === 'rack' || r.kind === 'chase'), sz = (no: string) => q.lines.find(l => l.def.no === no)!.def.NPS;
      for (let i = 1; i < single.length; i++) expect(sz(single[i].lines[0]), `unit ${u}`).toBeLessThanOrEqual(sz(single[i - 1].lines[0]));
      for (const r of q.runs.filter(x => x.kind === 'chase')) { const l = q.lines.find(x => x.def.no === r.lines[0])!; expect(l.tier).toBeUndefined(); expect(r.lane).toBeUndefined(); expect([l.def.from, l.def.to].some(e => e.k === 'nozzle' && q.nozzles.get(e.id)!.face[1] > RACK.tiers[top] + 48), `unit ${u} ${l.def.no}`).toBe(true); } }
    for (const l of up.lines) {
      const tap = [l.def.from, l.def.to].find(e => e.k === 'tap') as { line: string } | undefined; if (tap) expect(up.runOf.get(l.def.no), l.def.no).toBe(up.runOf.get(tap.line));
      if (l.origin === 'header' || l.origin === 'utility') expect(up.runs[up.runOf.get(l.def.no)!].kind).toBe('rest');
    }
    // what a run is given: the rack from its tier upward, the room later lines' first valves will need, the headers' lanes until the last run, the lanes kept for the lines not yet routed, its own gate, and a grid cut to it
    const base = up.plant.interior().instances.length, full = up.plant.grid, cells = (g: typeof full) => ((g.x1 - g.x0) / 6 + 1) * (g.y1 / 6 + 1) * ((g.z1 - g.z0) / 6 + 1);
    for (const [k, r] of up.runs.entries()) {
      const pl = up.runPlant(k, []), later = up.lines.filter(l => up.runOf.get(l.def.no)! > k).flatMap(l => [l.def.from, l.def.to].filter(e => e.k === 'nozzle')).reduce((a, e) => a + (/^(BL|RS|CS)-/.test((e as { id: string }).id) ? 2 : 1), 0), rest = r.kind === 'rest';   // a room at each nozzle of a later line, and at a spool a second, as wide as the valve's handwheel and as high as its stem
      const keptLanes = up.foreseen.filter(L => L.no !== undefined && up.runOf.get(L.no)! > k).length, fN = up.feeds.length, extra = pl.interior().instances.length - base - later - (rest ? 1 : 3) * fN;   // SW-RPI-15: until the last run the room of each header's valve at the limit, two boxes, and always where the header's first piece will lie
      expect(pl.rack.tiers).toEqual(RACK.tiers.slice(r.lane ? r.lane.t : rest ? top : 0));
      const gates = extra - (rest ? 2 : 1) * up.headers.filter(h => h.z !== undefined).length - keptLanes;                                     // in the last run a block about each header's two caps instead (SW-RPI-12)
      if (!r.lane) expect(gates, `run ${k + 1}`).toBe(0); else expect(gates).toBeGreaterThanOrEqual(2);                                              // the fence: the tier closed either side of the lane's slot, in more pieces where a root spool's opening cuts it
      const g = pl.grid; expect(g.x0 % 6).toBe(0); expect(g.z0 % 6 === 0).toBe(true); expect(g.x0).toBeGreaterThanOrEqual(full.x0); expect(g.x1).toBeLessThanOrEqual(full.x1); expect(g.y1).toBeLessThanOrEqual(full.y1); expect(g.z0).toBeGreaterThanOrEqual(full.z0); expect(g.z1).toBeLessThanOrEqual(full.z1);
      for (const no of r.lines) for (const e of (d => [d.from, d.to])(up.lines.find(l => l.def.no === no)?.def ?? up.feeds.find(f => f.stub.no === no)!.stub)) if (e.k === 'nozzle') { const n = up.nozzles.get(e.id)!; expect(n.face[0]).toBeGreaterThanOrEqual(g.x0); expect(n.face[0]).toBeLessThanOrEqual(g.x1); expect(n.face[1]).toBeLessThan(g.y1); expect(n.face[2]).toBeGreaterThanOrEqual(g.z0); expect(n.face[2]).toBeLessThanOrEqual(g.z1); }
      if (r.lane) { expect(g.z0).toBeLessThan(r.lane.z); expect(g.z1).toBeGreaterThan(r.lane.z); expect(cells(g)).toBeLessThan(cells(full)); }
      expect(up.runPlant(k, [], true).grid).toEqual(full);
    }
    // the fence of a rack line's run: its tier closed from end to end at the height its pipes lie at, but for a slot along its lane, wide enough for its pipe and 3 in clear of each side as the grid holds it, and shutting the lanes 6 in either side
    for (const r of rackRuns.slice(0, 8)) { const L = r.lane!, k = up.runs.indexOf(r), mineN = up.lines.filter(l => up.runOf.get(l.def.no)! > k).flatMap(l => [l.def.from, l.def.to].filter(e => e.k === 'nozzle')).reduce((a, e) => a + (/^(BL|RS|CS)-/.test((e as { id: string }).id) ? 2 : 1), 0), hN = up.headers.filter(h => h.z !== undefined).length + 3 * up.feeds.length, kN = up.foreseen.filter(x => x.no !== undefined && up.runOf.get(x.no)! > k).length;
      const walls = up.runPlant(k, []).interior().instances.slice(base + mineN + hN + kN).map(q => worldBox(q.part, q.transform)!); expect(walls.length).toBeGreaterThanOrEqual(2);
      for (const b of walls) { expect(b[0][1]).toBeCloseTo(RACK.tiers[L.t] + 4, 6); expect(b[1][1]).toBeGreaterThanOrEqual(RACK.tiers[L.t] + 4 + L.OD - 1e-6); }
      const lo = Math.max(...walls.filter(b => b[1][2] <= L.z).map(b => b[1][2])), hi = Math.min(...walls.filter(b => b[0][2] >= L.z).map(b => b[0][2])), grid = (v: number, dir: 1 | -1) => (dir > 0 ? Math.ceil(v / 6 - 1e-9) : Math.floor(v / 6 + 1e-9)) * 6;
      // the cells the grid marks for a wall are those within 3 in of it: the nearest to the lane on either hand leaves the lane's own cell clear by the pipe's radius, 3 in, and the 3 in a marked cell is taken to reach; the cell 6 in from the lane is not clear of it
      for (const edge of [L.z - grid(lo + 3, -1), grid(hi - 3, 1) - L.z]) { expect(edge - 3).toBeGreaterThanOrEqual(L.OD / 2 + 3); expect(edge - 6 - 3).toBeLessThan(L.OD / 2 + 3); }
      // from end to end of the rack
      expect(Math.min(...walls.map(b => b[0][0]))).toBeLessThanOrEqual(up.cell.rack.x0 + 6); expect(Math.max(...walls.map(b => b[1][0]))).toBeGreaterThanOrEqual(up.cell.rack.x1 - 6); }
  }, 240_000);
  it('stands every control valve station at grade under the rack, on a spool that divides its line (SW-RPI-9)', () => {
    const asked = sh.lines.map((f, i) => ({ f, i })).filter(q => q.f.cv); expect(up.stations.length + up.lines.filter(l => l.cvOmitted).length).toBe(asked.length); expect(up.stations.length).toBeGreaterThan(4);
    for (const st of up.stations) {
      const ahead = up.lines.find(l => l.def.no === st.line)!, after = up.lines.find(l => l.def.no === st.after)!, A = up.nozzles.get(`${st.tag}-A`)!, B = up.nozzles.get(`${st.tag}-B`)!;
      expect(ahead.origin).toBe('process'); expect(ahead.def.cv).toBe(true); expect(ahead.def.to).toEqual({ k: 'nozzle', id: `${st.tag}-A` }); expect(after.origin).toBe('control'); expect(!!after.def.cv).toBe(false); expect(after.def.from).toEqual({ k: 'nozzle', id: `${st.tag}-B` });
      expect(after.def.NPS).toBe(ahead.def.NPS); expect(Number(after.def.cls.slice(1))).toBeLessThanOrEqual(Number(ahead.def.cls.slice(1))); expect(B.cls).toBe(after.def.cls); expect(A.cls).toBe(ahead.def.cls); expect(after.flow).toBe(ahead.flow);
      if (after.def.to.k === 'nozzle') expect(up.nozzles.get(after.def.to.id)!.cls, after.def.no).toBe(after.def.cls);   /* the station is the specification break (SW-RPI-9) */ expect(Number(after.def.no.slice(-5)) - U * 1000).toBeGreaterThan(700);
      expect(st.at[1]).toBe(36); expect([0, 36, 72, 108]).toContain(Math.abs(st.at[2])); expect(st.at[0]).toBeGreaterThan(up.cell.rack.x0); expect(st.at[0]).toBeLessThan(up.cell.rack.x1);
      expect(A.u[1]).toBe(0); expect(A.u[2]).toBe(0); expect(B.u).toEqual(A.u.map(v => -v || 0)); expect(Math.abs(B.face[0] - A.face[0])).toBe(24);
      // the flowsheet's destination is where the part after the station ends, and its source where the line starts
      const f = sh.lines[ahead.flow!]; if (f.to.k === 'eq') expect((after.def.to as { id: string }).id.startsWith(up.cell.spots.find(q => q.item === (f.to as { tag: string }).tag)!.tag)).toBe(true);
    }
    // no two stations on one file overlap along the rack
    for (const a of up.stations) for (const b of up.stations) if (a !== b && a.at[2] === b.at[2]) expect(Math.abs(a.at[0] - b.at[0]), `${a.tag} and ${b.tag}`).toBeGreaterThan(60);
    // nearness comes first: each stands within 45 ft along the rack of the connection it feeds, in every unit prepared; in the crude unit, which has 16 of them, the largest valves and four braced bays, within 80 ft
    for (const u of [11, 13, 14, 16, 18, 19]) { const q = u === U ? up : unitPiping(u);
      for (const st of q.stations) { const after = q.lines.find(l => l.def.no === st.after)!, to = after.def.to; if (to.k !== 'nozzle' || to.id.startsWith('BL-')) continue; const x = q.nozzles.get(to.id)!.face[0], lo = q.cell.rack.x0 + 60, hi = q.cell.rack.x1 - 60; expect(Math.abs(st.at[0] - Math.min(hi, Math.max(lo, x))), `unit ${u} ${st.tag}`).toBeLessThanOrEqual(u === 11 ? 960 : 540); } }
  }, 240_000);
  it('starts a branch that must travel the rack at a root spool, a block valve on each face (SW-RPI-8)', () => {
    expect(up.roots.length).toBeGreaterThan(0);
    for (const r of up.roots) {
      const main = up.lines.find(l => l.def.no === r.line)!, conn = up.lines.find(l => l.def.no === r.connection)!; expect(conn.origin).toBe('root'); expect(conn.def.NPS).toBe(main.def.NPS); expect(conn.def.cls).toBe(main.def.cls);
      expect(Number(conn.def.no.slice(-5)) - U * 1000).toBeGreaterThan(600);
      expect([main.def.from.k, main.def.to.k]).toEqual(['nozzle', 'nozzle']); expect([conn.def.from.k, conn.def.to.k].sort()).toEqual(['nozzle', 'tap']);
      const tap = [conn.def.from, conn.def.to].find(e => e.k === 'tap') as { line: string }; expect(tap.line).toBe(r.parent);
      const A = up.nozzles.get(`${r.tag}-A`)!, B = up.nozzles.get(`${r.tag}-B`)!; expect(A.u.map(v => -v || 0)).toEqual(B.u); expect(Math.abs(B.face[0] - A.face[0])).toBe(24); expect(Math.abs(r.at[2])).toBeLessThan(up.cell.rack.halfWidth); expect(r.at[0]).toBeGreaterThan(RACK.start);
      expect(r.at[1]).toBe(Math.ceil((RACK.tiers[r.tier] + 4 + pipeDims(main.def.NPS, main.def.cls).OD / 2) / 6 - 1e-9) * 6);
    }
    // no other line that ends at a tee has its far end more than 20 ft along the rack beyond what it taps
    expect(up.lines.filter(l => l.origin === 'root').length).toBe(up.roots.length);
  });
  it('the generator sees the unit and where lines may travel, and no more of the model than is there', () => {
    const shown = up.plant.interior().instances, real = up.cell.interior.instances, extra = shown.filter(i => !real.includes(i));
    expect(extra.length).toBeGreaterThan(0); for (const k of extra) { expect(k.tags).toContain('keep-out'); expect(k.tags).toContain('cladding'); }
    expect(real.some(i => i.tags.includes('keep-out'))).toBe(false);
    expect(up.plant.rack.x0).toBe(RACK.start); expect(up.plant.id).toBe(`R${U}`); expect(up.plant.verticalThroughPlatforms).toBe(true);
  });
  it('the bounds the rules lean on hold for the catalogue\'s valves', () => {
    for (const [n, c] of [[3, 'P150'], [8, 'P600']] as const) {
      const v = makeValve('x', 'GATE', n, c), b = worldBox(v, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])!;
      expect(gateFaceToFace(n, c)).toBeCloseTo(Number(v.dims.F2F.value), 9); expect(Math.max(...b[1], ...b[0].map(x => -x))).toBeLessThanOrEqual(gateReach(n));
      expect(valveDrop(n, c)).toBeGreaterThan(gateFaceToFace(n, c) + designFlange(n, c).OD / 2); expect(valveDrop(n, c, true)).toBeGreaterThan(valveDrop(n, c) + globeFaceToFace(n, c));
    }
    expect(globeFaceToFace(4, 'P150')).toBeCloseTo(Number(makeValve('g', 'GLOBE', 4, 'P150').dims.F2F.value), 9);
  }, 120_000);
});

describe('plant 3: the piped units on disk', () => {
  it('unit 15, the pilot, is there with its model, report and images', () => {
    expect(reports.map(r => r.unit)).toContain(15);
    for (const r of reports) { expect(existsSync(new URL(`unit-${r.unit}.json`, dir))).toBe(true); for (const name of Object.keys(PIPING_IMAGES(r.unit, r.name))) expect(existsSync(new URL(`../screenshots/refinery/${name}.png`, import.meta.url)), name).toBe(true); }
  });
  it('every line is routed, and the generator\'s own checks of continuity, joints, elbows, valves and clearances are at zero', () => {
    for (const r of reports) {
      expect(r.demonstration).toBe(true); expect(r.lines.every(l => l.routed), `unit ${r.unit}`).toBe(true); expect(r.failures, `unit ${r.unit}`).toEqual([]);
      for (const k of ['continuity', 'joints', 'elbows', 'valves', 'lineClearance', 'staticClearance'] as const) expect(r.checks[k], `unit ${r.unit} ${k}`).toEqual([]);
      const m = JSON.parse(readFileSync(new URL(`unit-${r.unit}.json`, dir), 'utf8')) as PipingModel;
      expect(m.lines.length).toBe(r.lines.length); expect(m.lines.every(l => l.ok)).toBe(true); expect(m.lines.reduce((a, l) => a + l.welds.length, 0)).toBe(Object.values(r.counts.welds).reduce((a, b) => a + b, 0));
      for (const l of m.lines) expect(r.lines.some(q => q.no === l.no), l.no).toBe(true);
    }
  });
  it('the pilot is the unit the code describes', () => {
    const r = reports.find(q => q.unit === U)!; expect(r.lines.map(l => l.no)).toEqual(up.lines.map(l => l.def.no)); expect(r.spools.map(s => s.tag).sort()).toEqual(up.spools.map(s => s.tag).sort());
    for (const l of r.lines) { const d = up.lines.find(q => q.def.no === l.no)!; expect(l.NPS).toBe(d.def.NPS); expect(l.cls).toBe(d.def.cls); expect(l.fluid).toBe(d.fluid); }
    const cv = r.lines.filter(l => l.controlValve); expect(cv.length).toBe(sh.lines.filter(l => l.cv).length); expect(cv.filter(l => l.controlValve === 'piped').length).toBeGreaterThan(cv.length / 2);
    expect(r.counts.components.valve).toBeGreaterThan(100); expect(Object.values(r.counts.welds).reduce((a, b) => a + b, 0)).toBeGreaterThan(600);
  });
  it('each header runs in line from its spool at the limit through its block valve to its far cap, and the valve\'s stub is no longer a line (SW-RPI-15)', () => {
    const d3 = (p: number[], q: number[]) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    for (const r of reports) {
      const q = r.unit === U ? up : unitPiping(r.unit), m = JSON.parse(readFileSync(new URL(`unit-${r.unit}.json`, dir), 'utf8')) as PipingModel;
      expect(q.feeds.length, `unit ${r.unit}`).toBe(q.headers.length); expect(m.lines.some(l => q.feeds.some(f => f.stub.no === l.no))).toBe(false);
      for (const f of q.feeds) {
        const run = m.lines.find(l => l.no === f.header)!, n = q.nozzles.get(`${f.tag}-U`)!, kinds = run.comps.filter(c => c.kind !== 'studs').map(c => c.kind);
        expect(run.from, f.header).toBe(`${f.tag}-U`); expect(run.to).toBe('cap'); expect(kinds.slice(0, 5)).toEqual(['gasket', 'valve', 'gasket', 'flange', 'pipe']); expect(kinds[kinds.length - 1]).toBe('cap'); expect(kinds.filter(k => k === 'cap').length).toBe(1);
        expect(d3(run.comps[0].a, n.face)).toBeLessThan(0.01); expect(run.comps.filter(c => c.kind === 'studs').length).toBe(2);
        const fl = run.comps.find(c => c.kind === 'flange')!, pipe = run.comps.find(c => c.kind === 'pipe')!; expect(fl.key).toBe(`WNF|${n.NPS}|${n.cls}`); expect(d3(fl.b, pipe.a)).toBeLessThan(0.01);
        expect(d3(fl.a, fl.b)).toBeCloseTo((f2 => f2.rfH + f2.tf + f2.hubLen + f2.neckLen)(designFlange(n.NPS, n.cls)), 6);
        expect(run.welds.filter(w => w.joins.includes(fl.tag) && w.joins.includes(pipe.tag) && d3(w.at, fl.b) < 0.01).length).toBe(1);
        // every piece of pipe on the header's axis, none over 40 ft; a shoe on the tier beam of the rack's first full bent
        for (const c of run.comps.filter(c => c.kind === 'pipe')) { expect(c.a[2]).toBe(f.z); expect(c.a[1]).toBe(n.face[1]); expect(d3(c.a, c.b)).toBeLessThanOrEqual(480 + 1e-6); }
        expect(run.supports.filter(sp => sp.at[0] === q.cell.rack.x0 && sp.type === 'shoe' && sp.at[2] === f.z).length, `${f.header}: a shoe at the first full bent`).toBe(1);
        expect(new Set(run.comps.map(c => c.tag)).size).toBe(run.comps.length); expect(new Set(run.supports.map(sp => sp.id)).size).toBe(run.supports.length);
      }
      const note = r.notes.find(x => x.includes('(SW-RPI-15)')); expect(note, `unit ${r.unit}`).toBeDefined(); for (const f of q.feeds) expect(note, f.header).toContain(f.header);
    }
    void joinHeaders;
  }, 240_000);
  it('at every end SW-RPI-14 names, the saved model has the line\'s flange on the nozzle\'s gasket and no valve; each is named in the report', () => {
    let ends = 0;
    for (const r of reports) {
      const plan = r.unit === U ? up : unitPiping(r.unit), m = JSON.parse(readFileSync(new URL(`unit-${r.unit}.json`, dir), 'utf8')) as PipingModel, said = r.notes.filter(n => n.endsWith('(SW-RPI-14)'));
      const bare = plan.lines.filter(l => l.bare); expect(said.length, `unit ${r.unit}`).toBe(bare.reduce((a, l) => a + l.bare!.length, 0));
      for (const l of bare) for (const side of l.bare!) {
        const run = m.lines.find(q => q.no === l.def.no)!, cs = side === 'from' ? run.comps : [...run.comps].reverse(), id = (l.def[side] as { id: string }).id; ends++;
        expect(said.some(n => n.startsWith(`${l.def.no}: no valve at ${id};`)), `${l.def.no} ${side}`).toBe(true);
        // from the nozzle: its gasket, the flange (with the joint's studs before or after it), then pipe; no valve before the first turn
        const head = cs.slice(0, 4).map(c => c.kind); expect(head[0]).toBe('gasket'); expect(head.slice(1, 3).sort()).toEqual(['flange', 'studs']); expect(head[3]).toBe('pipe');
        const turn = cs.findIndex(c => c.kind === 'elbow' || c.kind === 'tee'); expect(cs.slice(0, turn < 0 ? cs.length : turn).some(c => c.kind === 'valve' && cs.indexOf(c) < 8)).toBe(false);
        const g = cs[0], fl = cs.slice(1, 3).find(c => c.kind === 'flange')!, pipe = cs[3]; expect(Math.hypot(g.b[0] - fl.a[0], g.b[1] - fl.a[1], g.b[2] - fl.a[2])).toBeLessThan(1e-3);
        const pe = side === 'from' ? pipe.a : pipe.b; expect(Math.hypot(pe[0] - fl.b[0], pe[1] - fl.b[1], pe[2] - fl.b[2])).toBeLessThan(1e-3);
        expect(run.welds.some(w => w.joins.includes(fl.tag) && w.joins.includes(pipe.tag) && Math.hypot(w.at[0] - fl.b[0], w.at[1] - fl.b[1], w.at[2] - fl.b[2]) < 1e-3)).toBe(true);
        for (const c of run.comps) if (c.kind === 'pipe') expect(Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1], c.b[2] - c.a[2]), c.tag).toBeLessThanOrEqual(480.001);   // and no piece made longer than 40 ft by it
      }
    }
    expect(ends).toBeGreaterThan(30);
  }, 900_000);
  it('the vacuum unit as piped: the overhead direct, the tail pipes straight down through sleeves in the deck where the deck is cut for them', () => {
    const r = reports.find(q => q.unit === 12); expect(r).toBeDefined(); if (!r) return;
    const m = JSON.parse(readFileSync(new URL('unit-12.json', dir), 'utf8')) as PipingModel, u12 = unitPiping(12), J = u12.cell.spots.find(q => q.item === 'J-1201')!;
    const run = (seq: number) => m.lines.find(l => l.no.endsWith(`-${seq}`))!, span = (l: typeof m.lines[number], a: number) => Math.max(...l.path.map(p => p[a])) - Math.min(...l.path.map(p => p[a]));
    // the overhead keeps to the column's station along the rack: it never runs the rack
    const ov = run(12003); expect(span(ov, 0)).toBeLessThan(1); expect(ov.comps.some(c => c.kind === 'valve')).toBe(false); expect(ov.NPS).toBe(48);
    // each tail pipe is one vertical line, with no valve and no turn, through one sleeve at the deck
    for (const seq of [12004, 12005, 12006]) { const t = run(seq); expect(span(t, 0)).toBeLessThan(1e-6); expect(span(t, 2)).toBeLessThan(1e-6); expect(span(t, 1)).toBeGreaterThan(400); expect(t.comps.some(c => c.kind === 'valve' || c.kind === 'elbow')).toBe(false); expect((t.pens ?? []).length).toBe(1); }
    // the deck's grating is cut where each sleeve stands, as wide as the sleeve asks
    expect((m.cuts ?? []).length).toBe(3); for (const c of m.cuts ?? []) { expect(Math.abs(c.y - J.yt!)).toBeLessThan(1e-6); expect(J.holes!.some(hh => Math.abs(hh.x - c.x) < 1e-6 && Math.abs(hh.z - c.z) < 1e-6 && Math.abs(hh.r - c.r) < 1e-6), JSON.stringify(c)).toBe(true); }
    expect(r.stats.penetrations).toBe(3);
  }, 300_000);
  it('a pipe frame carries its line on a shoe, its posts on the floor, its parts 1 in clear of every other line (SW-RPI-17)', () => {
    let n = 0; const vb = valveBoxFn();
    for (const r of reports) {
      const m = JSON.parse(readFileSync(new URL(`../public/refinery/piping/unit-${r.unit}.json`, import.meta.url), 'utf8')) as PipingModel, items = m.lines.flatMap(l => l.comps.filter(c => c.kind !== 'studs').flatMap(c => K.compShapes(c, vb).map(s => ({ line: l.no, s }))));
      for (const f of r.frames ?? []) {
        n++; const line = m.lines.find(l => l.no === f.line)!; expect(line, f.line).toBeDefined();
        expect(line.supports.some(s => s.type === 'shoe' && Math.hypot(s.at[0] - f.at[0], s.at[2] - f.at[2]) < 0.01 && Math.abs(s.at[1] - f.top) < 0.01), `${f.line}: a shoe on its frame`).toBe(true);
        const reach = (d: number) => (d > 0 ? d + 4 : (f.rad ?? 0) + 4); expect(reach(f.d[0]) + reach(f.d[1])).toBeLessThanOrEqual(368); expect(f.d.some(d => d > 0)).toBe(true); if (f.d.some(d => d <= 0)) expect(Math.max(...f.d)).toBeLessThanOrEqual(48);
        for (const q of framePlaced(f)) { const b = worldBox(q.part, q.transform as never)!; if (q.tags.includes('post')) expect(b[1][1] - b[0][1]).toBeLessThanOrEqual(600 + 1e-6);
          const sh: K.Shape = { kind: 'box', mn: b[0], mx: b[1] }; for (const it of items) if (it.line !== f.line) expect(K.gap(it.s, sh), `${f.line} frame ${q.tags.join('/')} beside ${it.line}`).toBeGreaterThanOrEqual(1 - 1e-6); }
      }
    }
    expect(n).toBeGreaterThan(0);
  }, 600_000);
  it('what is not at zero is said: support spans where no steel stands are listed in the report and the document', () => {
    const doc = readFileSync(new URL('../docs/REFINERY-PIPING.md', import.meta.url), 'utf8'); expect(doc).toBe(pipingDocument(reports) + '\n');
    for (const r of reports) for (const s of r.checks.supports) expect(doc).toContain(s);
  });
  it('a piece of pipe the generator leaves longer than 40 ft is cut again with a shop weld, clear of the supports (SW-RPI-10)', () => {
    const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0], T = (x: number) => [...I, x, 342, 0, 1], no = '3"-P150-P-99401';
    const pipe = (tag: string, x0: number, x1: number) => ({ tag: `${no}/${tag}`, kind: 'pipe', key: `PIPE|3|P150|${(x1 - x0).toFixed(3)}`, T: T(x0), a: [x0, 342, 0], b: [x1, 342, 0], NPS: 3, cls: 'P150', e1: 'BW', e2: 'BW' });
    const weld = (k: number, x: number, a: string, b: string) => ({ id: `${no}/W${k}`, line: no, type: 'BW', size: 0.1563, at: [x, 342, 0], dir: [1, 0, 0], joins: [`${no}/${a}`, `${no}/${b}`], field: false, NPS: 3, key: 'BW|3|P150', T: T(x) });
    const m = { lines: [{ no, service: 'P', NPS: 3, cls: 'P150', kind: 'header', from: 'cap', to: 'cap', comps: [pipe('p1', 0, 486), pipe('p2', 486, 930), pipe('p3', 930, 1400)], welds: [weld(1, 486, 'p1', 'p2'), weld(2, 930, 'p2', 'p3')], supports: [{ id: `${no}/S1`, line: no, type: 'shoe', at: [240, 336, 0], key: 'SHOE|3|P150|shoe|4.500', T: T(240) }], path: [], ok: true }], nozzles: [], failures: [], stats: { comps: 3, welds: 2 } } as unknown as PipingModel;
    const cut = cutLongPipes(m), l = m.lines[0]; expect(cut.length).toBe(1); expect(cut[0]).toContain(`${no}/p1`);
    expect(l.comps.map(c => c.tag.split('/')[1])).toEqual(['p1', 'p4', 'p2', 'p3']); expect(l.comps.every(c => Math.abs(c.b[0] - c.a[0]) <= 480)).toBe(true);
    const at = l.comps[0].b[0]; expect(l.comps[1].a[0]).toBe(at); expect(Math.abs(at - 240)).toBeGreaterThanOrEqual(14); expect(Math.abs(at - 243)).toBeLessThanOrEqual(12);   /* the middle is 3 in from the shoe: the cut moves off it by the least 6 in step that clears 14 in */
    expect(l.comps[0].key).toBe(`PIPE|3|P150|${at.toFixed(3)}`); expect(l.comps[1].key).toBe(`PIPE|3|P150|${(486 - at).toFixed(3)}`); expect(l.comps[1].T.slice(12, 15)).toEqual([at, 342, 0]);
    expect(l.welds.length).toBe(3); const w = l.welds[2]; expect(w.joins).toEqual([`${no}/p1`, `${no}/p4`]); expect(w.field).toBe(false); expect(w.at).toEqual([at, 342, 0]);
    expect(l.welds[0].joins).toEqual([`${no}/p4`, `${no}/p2`]);                                                // what was welded to the far end is welded to the second half
    expect(m.stats).toEqual({ comps: 4, welds: 3 }); expect(cutLongPipes(m)).toEqual([]);
  });
  it('at an end named for it, the generator\'s valve and what stands with it are left out and the line\'s flange meets the nozzle (SW-RPI-14)', () => {
    const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0], T = (p: number[]) => [...I, p[0], p[1], p[2], 1], no = '3"-P150-P-99002';
    // down from a nozzle face at y = 100: gasket, spade, gasket, valve, gasket, flange, pipe to y = 40; then along x and up into a second nozzle at y = 100 through a throttled stack
    let y = 100; const down = (tag: string, kind: string, key: string, len: number, e1 = 'RF', e2 = 'RF') => { const c = { tag: `${no}/${tag}`, kind, key, T: T([0, y, 0]), a: [0, y, 0], b: [0, y - len, 0], NPS: 3, cls: 'P150', e1, e2 }; y -= len; return c; };
    const A = [down('A1', 'gasket', 'GSK|3|P150', 0.125), down('A2', 'spade', 'SPADE|3|P150', 0.25), down('A3', 'gasket', 'GSK|3|P150', 0.125), down('A4', 'valve', 'VLV|GATE|3|P150', 8), down('A6', 'gasket', 'GSK|3|P150', 0.125), down('A7', 'flange', 'WNF|3|P150', 2.75, 'RF', 'BW'), down('p9', 'pipe', 'PIPE|3|P150|48.625', 48.625, 'BW', 'BW')];
    const studs = (tag: string, at: number, len: string) => ({ tag: `${no}/${tag}`, kind: 'studs', key: `STUDS|3|P150|${len}`, T: T([0, at + 2, 0]), a: [0, at + 2, 0], b: [0, at - 2, 0], NPS: 3, cls: 'P150', e1: 'X', e2: 'X' });
    A.splice(4, 0, studs('A5', 99.75, '4.000')); A.splice(7, 0, studs('A8', 91.44, '3.500'));
    expect(y).toBeCloseTo(40, 9);
    // the far end, up at x = 60: pipe, flange, gasket, globe, gasket, flange, stub, flange, gasket, butterfly, gasket (the nozzle's face at y = 100)
    // (the generator builds a stack from its nozzle outward: each of its pieces has its end `a` toward the nozzle, at either end of a line; a pipe runs with the flow)
    let yb = 40; const upc = (tag: string, kind: string, key: string, len: number, e1 = 'RF', e2 = 'RF') => { const lo = [60, yb, 0], hi = [60, yb + len, 0], c = kind === 'pipe' && len > 12 ? { tag: `${no}/${tag}`, kind, key, T: T(lo), a: lo, b: hi, NPS: 3, cls: 'P150', e1, e2 } : { tag: `${no}/${tag}`, kind, key, T: T(hi), a: hi, b: lo, NPS: 3, cls: 'P150', e1: e2, e2: e1 }; yb += len; return c; };
    const B = [upc('p20', 'pipe', 'PIPE|3|P150|22.000', 22, 'BW', 'BW'), upc('B1', 'flange', 'WNF|3|P150', 2.75, 'BW', 'RF'), upc('B2', 'gasket', 'GSK|3|P150', 0.125), upc('B3', 'valve', 'VLV|GLOBE|3|P150', 14), upc('B4', 'gasket', 'GSK|3|P150', 0.125), upc('B5', 'flange', 'WNF|3|P150', 2.75, 'RF', 'BW'), upc('B6', 'pipe', 'PIPE|3|P150|6.000', 6, 'BW', 'BW'), upc('B7', 'flange', 'WNF|3|P150', 2.75, 'BW', 'RF'), upc('B8', 'gasket', 'GSK|3|P150', 0.125), upc('B9', 'valve', 'VLV|BFLY|3|P150', 9.25), upc('B10', 'gasket', 'GSK|3|P150', 0.125)];
    expect(yb).toBeCloseTo(100, 9);
    const mid = { tag: `${no}/p15`, kind: 'pipe', key: 'PIPE|3|P150|60.000', T: T([0, 40, 0]), a: [0, 40, 0], b: [60, 40, 0], NPS: 3, cls: 'P150', e1: 'BW', e2: 'BW' };   // the turns are left out of this chain: only the ends matter here
    const weld = (k: number, at: number[], a: string, b: string, field = false) => ({ id: `${no}/W${k}`, line: no, type: 'BW', size: 0.2, at, dir: [0, 1, 0], joins: [`${no}/${a}`, `${no}/${b}`], field, NPS: 3, key: 'BW|3|P150', T: T(at) });
    const welds = [weld(1, [0, 88.625, 0], 'A7', 'p9', true), weld(2, [0, 40, 0], 'p9', 'p15'), weld(3, [60, 40, 0], 'p15', 'p20'), weld(4, [60, 62, 0], 'p20', 'B1', true), weld(5, [60, 81.75, 0], 'B5', 'B6'), weld(6, [60, 87.75, 0], 'B6', 'B7')];
    // the generator lists a joint's studs before the flange or valve nearer the far end: here before B1, B3 and B7
    B.splice(1, 0, studs('B11', 64.8, '3.500')); B.splice(4, 0, studs('B12', 79, '3.500')); B.splice(9, 0, studs('B13', 95, '4.000'));
    const comps = [...A, mid, ...B];
    const m = { lines: [{ no, service: 'P', NPS: 3, cls: 'P150', kind: 'routed', from: 'X-1-N1', to: 'X-2-N1', comps, welds, supports: [], path: [], ok: true }], nozzles: [], failures: [], stats: { comps: comps.length, welds: welds.length } } as unknown as PipingModel;
    const line = { def: { no, from: { k: 'nozzle', id: 'X-1-N1' }, to: { k: 'nozzle', id: 'X-2-N1' } }, bare: ['from', 'to'] } as unknown as UnitLine;
    const done = removeValves(m, { lines: [line] }), l = m.lines[0], tags = l.comps.map(c => c.tag.split('/')[1]);
    expect(done.length).toBe(2); expect(done[0]).toContain('X-1-N1'); expect(done[0]).toContain('GATE 3'); expect(done[1]).toContain('BFLY 3 and GLOBE 3');
    // what is left: at each nozzle its gasket, the line's flange and one set of studs; no valve, spade or stub
    expect(tags).toEqual(['A1', 'A7', 'A8', 'p9', 'p15', 'p20', 'B11', 'B1', 'B10']); expect(l.comps.some(c => c.kind === 'valve' || c.kind === 'spade')).toBe(false);
    const by = (t: string) => l.comps.find(c => c.tag === `${no}/${t}`)!;
    expect(by('A7').a[1]).toBeCloseTo(99.875, 9); expect(by('A7').b[1]).toBeCloseTo(97.125, 9); expect(by('A7').T[13]).toBeCloseTo(99.875, 9);            // the flange's face on the nozzle's gasket
    expect(by('p9').a[1]).toBeCloseTo(97.125, 9); expect(by('p9').b[1]).toBeCloseTo(40, 9); expect(by('p9').key).toBe('PIPE|3|P150|57.125'); expect(by('p9').T[13]).toBeCloseTo(97.125, 9);
    expect(by('A8').a[1] - by('A8').b[1]).toBeCloseTo(4, 9); expect((by('A8').a[1] + by('A8').b[1]) / 2).toBeCloseTo(91.44 + 8.5, 9);                     // the studs of the joint the flange made, moved with it
    expect(by('B1').a[1]).toBeCloseTo(99.875, 9); expect(by('B1').b[1]).toBeCloseTo(97.125, 9); expect(by('p20').b[1]).toBeCloseTo(97.125, 9); expect(by('p20').a[1]).toBeCloseTo(40, 9); expect(by('p20').key).toBe('PIPE|3|P150|57.125'); expect(by('p20').T[13]).toBeCloseTo(40, 9);
    // each end's field weld moves with its flange; the stub's two welds go with the stub
    expect(l.welds.map(w => w.id.split('/')[1])).toEqual(['W1', 'W2', 'W3', 'W4']); expect(l.welds[0].at[1]).toBeCloseTo(97.125, 9); expect(l.welds[3].at[1]).toBeCloseTo(97.125, 9); expect(l.welds[1].at).toEqual([0, 40, 0]);
    expect(m.stats).toEqual({ comps: 9, welds: 4 });
    // a line with no end named is left as it was, and an end with no valve is an error rather than a guess
    expect(removeValves(m, { lines: [{ ...line, bare: undefined } as unknown as UnitLine] })).toEqual([]); expect(() => removeValves(m, { lines: [line] })).toThrow(/SW-RPI-14/);
  });
  it('a make-up piece under 2 in between a tee and a 45° offset is made 2 in by moving the offset along the run (SW-RPI-11)', () => {
    const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0], T = (p: number[]) => [...I, p[0], p[1], p[2], 1], no = '3"-P150-P-99001', c = Math.SQRT1_2;
    const comp = (tag: string, kind: string, key: string, a: number[], b: number[]) => ({ tag: `${no}/${tag}`, kind, key, T: T(a), a, b, NPS: 3, cls: 'P150', e1: 'BW', e2: 'BW' });
    // along +z: a tee, 1.4 in of pipe, a 45° elbow, a diagonal piece, a 45° elbow, 20 in of pipe
    const e = 1.864, comps = [comp('T1', 'tee', 'TEE|3|P150|3', [0, 0, 0], [0, 0, 5]), comp('p2', 'pipe', 'PIPE|3|P150|1.400', [0, 0, 5], [0, 0, 6.4]), comp('el3', 'elbow', 'EL|3|P150|45', [0, 0, 6.4], [e * (1 - c), 0, 6.4 + e * (1 + c)]),
      comp('p4', 'pipe', 'PIPE|3|P150|12.000', [e * (1 - c), 0, 6.4 + e * (1 + c)], [e * (1 - c) + 12 * c, 0, 6.4 + e * (1 + c) + 12 * c]), comp('el5', 'elbow', 'EL|3|P150|45', [e * (1 - c) + 12 * c, 0, 6.4 + e * (1 + c) + 12 * c], [12, 0, 30]), comp('p6', 'pipe', 'PIPE|3|P150|20.000', [12, 0, 30], [12, 0, 50])];
    const weld = (k: number, at: number[], a: string, b: string) => ({ id: `${no}/W${k}`, line: no, type: 'BW', size: 0.2, at, dir: [0, 0, 1], joins: [`${no}/${a}`, `${no}/${b}`], field: false, NPS: 3, key: 'BW|3|P150', T: T(at) });
    const welds = [weld(1, [0, 0, 5], 'T1', 'p2'), weld(2, [0, 0, 6.4], 'p2', 'el3'), weld(3, comps[2].b, 'el3', 'p4'), weld(4, comps[3].b, 'p4', 'el5'), weld(5, [12, 0, 30], 'el5', 'p6')];
    const m = { lines: [{ no, service: 'P', NPS: 3, cls: 'P150', kind: 'routed', from: 'a', to: 'b', comps, welds, supports: [], path: [], ok: true }], nozzles: [], failures: [], stats: {} } as unknown as PipingModel;
    const made = lengthenShortPieces(m), l = m.lines[0]; expect(made.length).toBe(1); expect(made[0]).toContain(`${no}/p2`);
    expect(l.comps[1].b[2]).toBeCloseTo(7, 9); expect(l.comps[1].key).toBe('PIPE|3|P150|2.000'); expect(l.comps[2].a[2]).toBeCloseTo(7, 9); expect(l.comps[4].b).toEqual([12, 0, 30.6]); expect(l.comps[5].a).toEqual([12, 0, 30.6]); expect(l.comps[5].key).toBe('PIPE|3|P150|19.400'); expect(l.comps[5].b).toEqual([12, 0, 50]);
    expect(l.welds[0].at).toEqual([0, 0, 5]); expect(l.welds[1].at[2]).toBeCloseTo(7, 9); expect(l.welds[4].at[2]).toBeCloseTo(30.6, 9); expect(l.welds[2].at[2] - (6.4 + e * (1 + c))).toBeCloseTo(0.6, 9);
    for (let k = 1; k < l.comps.length; k++) expect(Math.hypot(...l.comps[k].a.map((v, a) => v - l.comps[k - 1].b[a]))).toBeLessThan(1e-9);   // still one chain
    expect(lengthenShortPieces(m)).toEqual([]);
  });
  it('a piece at 45° that the clearance check reports against a valve by its bounding box is measured again from its axis (SW-RPI-13)', () => {
    const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0], vb = valveBoxFn(), c = Math.SQRT1_2, OD = pipeDims(4, 'P150').OD;
    const valve = { tag: 'v', kind: 'valve', key: 'VLV|GATE|4|P150', T: [...I, 0, 0, 0, 1], a: [0, 0, 0], b: [0, 0, gateFaceToFace(4, 'P150')], NPS: 4, cls: 'P150' } as unknown as Parameters<typeof vb>[0], [mn, mx] = vb(valve), x = (mn[0] + mx[0]) / 2;
    // a piece in the plane across the valve, at 45°, its axis `off` in from the box's upper corner: its bounding box reaches into the valve's, the piece does not
    const piece = (off: number) => { const d = off / c, a = [x, mx[1] - 10, mx[2] + 10 + d], b = [x, mx[1] + 30, mx[2] - 30 + d]; return { tag: 'p', kind: 'pipe', key: 'PIPE|4|P150|56.569', T: [...I, ...a, 1], a, b, NPS: 4, cls: 'P150' } as unknown as Parameters<typeof vb>[0]; };
    for (const off of [14, 6, 4]) {
      const p = piece(off), g = measuredAgain(p, valve, vb)!; expect(K.gap(K.compShapes(p, vb)[0], K.compShapes(valve, vb)[0])).toBe(0);   // as the generator's check holds the pair
      expect(g).toBeCloseTo(off - OD / 2, 1); expect(measuredAgain(valve, p, vb)).toBeCloseTo(g, 9);
    }
    expect(measuredAgain(piece(4), valve, vb)!).toBeLessThan(3);                                               // nearer than 3 in: it stays in the report
    // a piece square to the axes, and two pieces of pipe, are the check's own to measure
    const square = { ...piece(14), a: [x, mx[1] + 20, mx[2] - 30], b: [x, mx[1] + 20, mx[2] + 30] } as unknown as Parameters<typeof vb>[0]; expect(measuredAgain(square, valve, vb)).toBeUndefined(); expect(measuredAgain(piece(14), piece(6), vb)).toBeUndefined();
    // a 45° elbow by its own legs: nearer its corner than a 90° elbow's legs would put it
    const el = { tag: 'e', kind: 'elbow', key: 'EL|4|P150|45', T: [...I, 0, 0, 0, 1], a: [0, 0, 0], b: [0, 0, 1], NPS: 4, cls: 'P150' } as unknown as Parameters<typeof vb>[0], far = { ...square, a: [40, 0, 0], b: [40, 0, 40] } as unknown as Parameters<typeof vb>[0];
    expect(measuredAgain(el, far, vb)).toBeGreaterThan(K.gap(K.compShapes(el, vb)[1], K.compShapes(far, vb)[0]) - 1e-9);
  });
  it('a 90° elbow that the clearance check reports against steel by its corner is measured again from its arc (SW-RPI-13)', () => {
    const vb = valveBoxFn(), OD = pipeDims(6, 'P150').OD, R = elbowRadius(OD);
    // from the origin along +x, turning to +z: its corner at (R, 0, 0), its arc about (0, 0, R)
    const el = { tag: 'e', kind: 'elbow', key: 'EL|6|P150|90', T: [0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1], a: [0, 0, 0], b: [R, 0, R], NPS: 6, cls: 'P150' } as unknown as Parameters<typeof vb>[0];
    // a post standing off the outside of the corner, d each way from it
    const post = (d: number) => ({ tag: 'post', kind: 'box' as const, mn: [R + d, -50, -d - 8] as [number, number, number], mx: [R + d + 8, 50, -d] as [number, number, number] });
    const legs = (d: number) => Math.min(...K.compShapes(el, vb).map(sh => K.gap(sh, { kind: 'box', mn: post(d).mn, mx: post(d).mx })));
    for (const d of [2, 3.776, 6]) { const byCorner = d * Math.SQRT2 - OD / 2, byArc = elbowGap(el, post(d)); expect(legs(d)).toBeLessThanOrEqual(Math.max(0, byCorner) + 1e-6); expect(byArc).toBeCloseTo(byCorner + R * (Math.SQRT2 - 1), 1); }
    expect(3.776 * Math.SQRT2 - OD / 2).toBeLessThan(3); expect(elbowGap(el, post(3.776))).toBeGreaterThan(3);                     // the utilities unit's case: 2.34 in from the corner, 6 in from the elbow
    // against a round member the same: a column 4 in in radius standing at the same place
    const col = { tag: 'col', kind: 'cap' as const, a: [R + 3.776 + 4, -50, -3.776 - 4] as [number, number, number], b: [R + 3.776 + 4, 50, -3.776 - 4] as [number, number, number], r: 4 };
    expect(elbowGap(el, col)).toBeGreaterThan(elbowGap(el, post(3.776)) - 1e-6);
    // an elbow well clear by its corner is clear by its arc too, and one that touches is still reported
    expect(elbowGap(el, post(-2))).toBeLessThan(3);
  });
  it('what a run leaves for the runs after it holds a shoe under a pipe on the rack no wider than its pipe (SW-RPI-7)', () => {
    const vb = valveBoxFn(), no = '3"-P600-P-99005', T = [0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 720, 268.5, -12, 1], I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
    const pipe = { tag: `${no}/p1`, kind: 'pipe', key: 'PIPE|3|P600|240.000', T: [...I, 600, 270, -12, 1], a: [600, 270, -12], b: [840, 270, -12], NPS: 3, cls: 'P600', e1: 'BW', e2: 'BW' };
    const sup = (type: string, x: number) => ({ id: `${no}/S${x}`, line: no, type, at: [x, 264, -12], key: `SHOE|3|P600|${type}|4.500`, T: [...T.slice(0, 12), x, 268.5, -12, 1] });
    const m = { lines: [{ no, service: 'P', NPS: 3, cls: 'P600', kind: 'routed', from: 'a', to: 'b', comps: [pipe], welds: [], supports: [sup('shoe', 720), sup('guide', 600), sup('anchor', 840)], path: [], ok: true }], nozzles: [], failures: [], stats: {} } as unknown as PipingModel;
    const raw = vb({ key: 'SHOE|3|P600|guide|4.500', T } as unknown as Parameters<typeof vb>[0]); expect(raw[1][2] - raw[0][2]).toBeGreaterThan(3);                     // as the catalogue draws it, wider than the 3 in pipe
    const boxes = runSolids(m, vb).map(q => worldBox(q.part, q.transform)!), under = boxes.filter(b => Math.abs(b[0][1] - 264) < 1e-6); expect(under.length).toBe(3);
    for (const b of under) { expect(b[0][2]).toBeGreaterThanOrEqual(-12 - 1.5 - 1e-6); expect(b[1][2]).toBeLessThanOrEqual(-12 + 1.5 + 1e-6); expect(b[1][0] - b[0][0]).toBeGreaterThan(3); }   // across the pipe no wider than it; along it as long as it is drawn
    // and so the lane 12 in off is clear of it as the grid holds it: no cell within 3 in of the shoe's box is nearer that lane's axis than the pipe's radius and 6 in
    for (const b of under) expect(Math.abs(-24 - Math.round((b[0][2] - 3) / 6 + 0.4999) * 6) - 3).toBeGreaterThanOrEqual(1.5 + 3);
  });
  it('every rule the piping code cites is written in the design basis', () => {
    const defined = new Set([...basisDoc.matchAll(/`(SW-[A-Z]+-\d+[a-z]?)`/g)].map(m => m[1]));
    for (const f of ['unitPiping', 'pipingReport', 'cell']) for (const m of readFileSync(new URL(`../src/refinery/${f}.ts`, import.meta.url), 'utf8').matchAll(/SW-[A-Z]+-\d+[a-z]?/g)) expect(defined.has(m[0]), `${f}: ${m[0]}`).toBe(true);
    for (const k of ['SW-RPI-1', 'SW-RPI-2', 'SW-RPI-3', 'SW-RPI-4', 'SW-RPI-5', 'SW-RPI-6', 'SW-RPI-7', 'SW-RPI-8', 'SW-RPI-9', 'SW-RPI-10', 'SW-RPI-11', 'SW-RPI-12', 'SW-RPI-13', 'SW-CELL-6', 'SW-CELL-7']) expect(defined.has(k), k).toBe(true);
  });
});
