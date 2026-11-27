// Plant 3, SW-RPI-26: lines at connections that rose, carried up with them. For each connection of the named items whose face now stands Δ higher than
// the line's end on disk, the line's pieces from that end up to the first vertical pipe that can take the change rise by Δ, and that pipe is cut shorter or
// longer by Δ; a take-off on a piece that rose rises with it and its branch is walked the same way; supports on pieces that rose are taken off (the
// supports tool sets them again, SW-RPI-17); the welds at the joints that rose rise with them. The unit's checks are made after, and the tool stops if
// any of §40's or SW-RPI-22's grows.
//   vite-node tools/refinery-rise.ts <unit> <item pattern>      e.g. 11 '^P-110[134][AB]$'
import { readFileSync, writeFileSync } from 'node:fs';
import { serializePiping, type PipingModel, type LineRun, type Comp } from '../src/generator/piping';
import type { V3 } from '../src/generator/router';
import { pipeDims, elbowRadius, type PipeClass } from '../src/catalogue';
import { unitPiping } from '../src/refinery/unitPiping';
import { unitChecks, type PipedUnit } from '../src/refinery/pipingReport';

const dir = process.env.PIPING_DIR ?? 'public/refinery/piping', u = Number(process.argv[2]), items = new RegExp(process.argv[3] ?? '^$');
const m = JSON.parse(readFileSync(`${dir}/unit-${u}.json`, 'utf8')) as PipingModel, r = JSON.parse(readFileSync(`${dir}/unit-${u}.report.json`, 'utf8')) as PipedUnit, up = unitPiping(u);
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const same = (p: V3, q: V3, e = 0.02) => len(sub(p, q)) < e;
const segDist = (p: V3, a: V3, b: V3) => { const d = sub(b, a), L2 = d[0] ** 2 + d[1] ** 2 + d[2] ** 2, t = L2 < 1e-12 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1] + (p[2] - a[2]) * d[2]) / L2)); return len(sub(p, [a[0] + d[0] * t, a[1] + d[1] * t, a[2] + d[2] * t])); };
const corner = (c: Comp): V3 => { const R = elbowRadius(pipeDims(c.NPS, c.cls as PipeClass).OD); return [c.a[0] + c.T[8] * R, c.a[1] + c.T[9] * R, c.a[2] + c.T[10] * R]; };

const before = unitChecks(JSON.parse(JSON.stringify(m)) as PipingModel, up, []);   // the checks as the model stands, to compare with after
const equipOf = new Map([...up.nozzles.entries()].map(([id, n]) => [id, n as { equip: string; face: V3 }] as const));
const endOf = (l: LineRun, end: 'a' | 'b') => (l as unknown as Record<string, string>)[end === 'a' ? 'from' : 'to'];
/** the face-side point of a line's end: the end piece's point not shared with the piece beside it */
const endPoint = (l: LineRun, end: 'a' | 'b'): V3 => { const cs = l.comps.filter(c => c.kind !== 'studs'), c = end === 'a' ? cs[0] : cs[cs.length - 1], nb = end === 'a' ? cs[1] : cs[cs.length - 2]; if (!nb) return c.a as V3; const shared = (p: V3) => same(p, nb.a as V3, 0.05) || same(p, nb.b as V3, 0.05); return (shared(c.a as V3) ? c.b : c.a) as V3; };
interface Walk { line: LineRun; from: 'a' | 'b'; d: V3; moved?: Comp[]; absorb?: Comp }   // walk a line from its first comp ('a') or its last ('b'), raising by d
const walks: Walk[] = [];
for (const l of m.lines) for (const end of ['a', 'b'] as const) {
  const e = endOf(l, end), n = equipOf.get(e ?? ''); if (!n || !items.test(n.equip)) continue;
  const d = sub(n.face, endPoint(l, end)); if (len(d) < 0.01) continue;
  if (Math.abs(d[0]) > 0.01 || Math.abs(d[2]) > 0.01) throw new Error(`${l.no}: its connection ${e} moved other than up or down (${d.map(v => v.toFixed(2))}); SW-RPI-26 carries a line up only`);
  walks.push({ line: l, from: end, d });
}
// each walk planned: the pieces that rise, up to the vertical pipe that takes the change; a take-off among them gives its branch a walk from its tap end
for (let i = 0; i < walks.length; i++) {
  const w = walks[i], seq = w.from === 'a' ? w.line.comps : [...w.line.comps].reverse(), moved: Comp[] = [];
  for (const c of seq) {
    if (c.kind === 'pipe') {
      const dir = sub(c.b as V3, c.a as V3), L = len(dir);
      if (L > 1e-6 && Math.abs(dir[1]) > 0.999 * L) { const near = (w.from === 'a' ? c.a : c.b) as V3, far = (w.from === 'a' ? c.b : c.a) as V3, ny = near[1] + w.d[1]; if (Math.abs(far[1] - ny) >= 2 - 1e-9 && Math.sign(far[1] - ny) === Math.sign(far[1] - near[1])) { w.absorb = c; break; } }
    }
    moved.push(c);
    if (c.kind === 'tee' || c.kind === 'olet') for (const b of m.lines) for (const end of ['a', 'b'] as const) if (endOf(b, end) === `tap ${w.line.no}` && c.tag.endsWith(`/T:${b.no}`) && !walks.some(x => x.line === b && x.from === end)) walks.push({ line: b, from: end, d: w.d });
  }
  w.moved = moved;
}
// a walk that finds no such pipe: the whole line rises, where its other end rises by the same (its own connection, or a take-off that rose)
const whole = new Set<LineRun>();
for (const w of walks) if (!w.absorb) {
  if (!walks.some(x => x.line === w.line && x.from !== w.from && same(x.d, w.d))) throw new Error(`${w.line.no}: no vertical pipe on it takes the rise of ${w.d[1].toFixed(1)} in, and its other end does not rise (SW-RPI-26); route the unit again`);
  whole.add(w.line);
}
const notes: string[] = [], absorbed: string[] = [];
for (const line of new Set(walks.map(w => w.line))) {
  const mine = walks.filter(w => w.line === line), d = mine[0].d, set = new Set<Comp>(whole.has(line) ? line.comps : mine.flatMap(w => w.moved!));
  if (!whole.has(line)) for (const w of mine) {   // the pipe that takes the change, cut at its end nearer the connection
    const c = w.absorb!, near = w.from === 'a' ? 'a' : 'b';
    if (near === 'a') { c.a = add(c.a as V3, w.d); c.T = [...c.T.slice(0, 12), c.T[12] + w.d[0], c.T[13] + w.d[1], c.T[14] + w.d[2], 1] as never; } else c.b = add(c.b as V3, w.d);
    const newL = len(sub(c.b as V3, c.a as V3)); c.key = `${c.key.split('|').slice(0, 3).join('|')}|${newL.toFixed(3)}`; absorbed.push(`${c.tag} now ${newL.toFixed(1)} in`);
  }
  for (const c of set) { c.a = add(c.a as V3, d); c.b = add(c.b as V3, d); c.T = [...c.T.slice(0, 12), c.T[12] + d[0], c.T[13] + d[1], c.T[14] + d[2], 1] as never; }
  // its welds at the joints that rose, its path's points on what rose, and its supports on what rose (set again by SW-RPI-17)
  const was = [...set].map(c => ({ c, a: sub(c.a as V3, d), b: sub(c.b as V3, d) }));
  for (const w of line.welds) if (whole.has(line) || was.some(q => same(w.at as V3, q.a) || same(w.at as V3, q.b))) { w.at = add(w.at as V3, d); w.T = [...w.T.slice(0, 12), w.T[12] + d[0], w.T[13] + d[1], w.T[14] + d[2], 1] as never; }
  line.path = line.path.map(p => (whole.has(line) || was.some(q => segDist(p as V3, q.a, q.b) < 0.5 || (q.c.kind === 'elbow' && same(p as V3, sub(corner(q.c), d), 0.5))) ? add(p as V3, d) : p));
  const rad = pipeDims(line.NPS, line.cls as PipeClass).OD / 2, off = line.supports.length;
  line.supports = line.supports.filter(sp => !was.some(q => segDist(sp.at as V3, q.a, q.b) < rad + 12));
  notes.push(`${line.no}: ${whole.has(line) ? 'the whole line' : `${set.size} pieces from its connection${mine.length > 1 ? 's' : ''}`} carried ${d[1] > 0 ? 'up' : 'down'} ${Math.abs(d[1]).toFixed(1)} in${off > line.supports.length ? `, ${off - line.supports.length} supports on them taken off` : ''}`);
}
// the nozzles' own pieces at the connections that rose
for (const n of m.nozzles ?? []) {
  const w = walks.find(x => endOf(x.line, x.from) === n.id); if (!w) continue; const d = w.d;   // by as much as the line at it
  for (const c of n.comps ?? []) { c.a = add(c.a as V3, d); c.b = add(c.b as V3, d); c.T = [...c.T.slice(0, 12), c.T[12] + d[0], c.T[13] + d[1], c.T[14] + d[2], 1] as never; }
  const nn = n as unknown as { face?: V3; welds?: { at: V3; T: number[] }[] }; if (nn.face) nn.face = add(nn.face, d); for (const x of nn.welds ?? []) { x.at = add(x.at, d); x.T = [...x.T.slice(0, 12), x.T[12] + d[0], x.T[13] + d[1], x.T[14] + d[2], 1]; }
}
const aside: string[] = [], checks = unitChecks(m, up, aside);
for (const k of ['continuity', 'joints', 'elbows', 'valves', 'lineClearance', 'staticClearance', 'ownClearance'] as const) { const n0 = before[k]?.length ?? 0; if (checks[k].length > n0) throw new Error(`unit ${u}: ${k} ${n0} → ${checks[k].length} after SW-RPI-26: ${checks[k].filter(v => !(before[k] ?? []).includes(v)).slice(0, 4).join('; ')}`); }
r.checks = checks; r.notes.push(`${walks.length} line ends at the connections of ${items.source}, which rose with their pumps (SW-EQ-4 as amended), carried up with them, the unit not routed again (SW-RPI-26): ${notes.join('; ')}; vertical pipes cut: ${absorbed.join(', ')}`);
writeFileSync(`${dir}/unit-${u}.json`, serializePiping(m) + '\n'); writeFileSync(`${dir}/unit-${u}.report.json`, JSON.stringify(r, null, 1) + '\n');
console.log(`unit ${u}: ${walks.length} line ends carried up (SW-RPI-26); checks ${Object.entries(checks).map(([k, v]) => `${k} ${(v as string[]).length}`).join(', ')}`);
for (const n of [...notes, ...absorbed]) console.log(`   ${n}`);
