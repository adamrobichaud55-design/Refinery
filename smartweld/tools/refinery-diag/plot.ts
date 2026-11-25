// Plant 3 diagnostic (read-only; writes nothing in the repository). See docs/REFINERY-HANDOFF.md. Run from smartweld/: npx vite-node tools/refinery-diag/plot.ts
// the cracking unit's plot: every spot, and every rack line's ends against the rack's beam lines and the bodies between its end and the rack (read-only)
import { buildCell, RACK } from '../../src/refinery/cell';
import { unitPiping } from '../../src/refinery/unitPiping';
const U = Number(process.env.UNIT ?? 17), up = unitPiping(U), c = up.cell;
console.log(`rack x ${c.rack.x0}–${c.rack.x1} half ${c.rack.halfWidth} bent ${RACK.bent}`);
for (const s of [...c.spots].sort((a, b) => a.z - b.z || a.x - b.x)) console.log(`${s.tag.padEnd(9)} ${s.kind.padEnd(13)} ${s.lane.padEnd(8)} x ${String(s.x).padStart(5)} z ${String(s.z).padStart(6)} lx ${String(Math.round(s.lx)).padStart(4)} lz ${String(Math.round(s.lz)).padStart(4)} h ${Math.round(s.h)}  x-range ${Math.round(s.x - s.lx / 2)}–${Math.round(s.x + s.lx / 2)}`);
console.log('--- rack lines');
for (const r of up.runs) { if (r.kind !== 'rack' || !r.lane) continue; const l = up.lines.find(q => q.def.no === r.lines[0])!;
  const end = (e: typeof l.def.from) => { if (e.k !== 'nozzle') return '?'; const n = up.nozzles.get(e.id)!; const beam = Math.min(...[0, 0.5].map(o => { const d = ((n.A[0] - c.rack.x0) / RACK.bent - o); return Math.abs(d - Math.round(d)) * RACK.bent; })); return `${n.equip} x ${Math.round(n.A[0])} y ${Math.round(n.face[1])} z ${Math.round(n.A[2])} u ${n.u.map(v => Math.round(v)).join('')} (beam ${Math.round(beam)})`; };
  console.log(`${l.def.no.padEnd(20)} t${r.lane.t + 1} z ${String(r.lane.z).padStart(4)} x ${r.lane.x0}–${r.lane.x1} | ${end(l.def.from)} → ${end(l.def.to)}`); }
