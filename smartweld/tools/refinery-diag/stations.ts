// Plant 3 diagnostic (read-only; writes nothing in the repository). See docs/REFINERY-HANDOFF.md. Run from smartweld/: npx vite-node tools/refinery-diag/stations.ts
import { unitPiping } from '../../src/refinery/unitPiping';
const up = unitPiping(17);
for (const s of [...up.stations].sort((a, b) => a.at[0] - b.at[0])) { const l = up.lines.find(q => q.def.no === s.line)!, a = up.lines.find(q => q.def.no === s.after)!, to = a.def.to.k === 'nozzle' ? up.nozzles.get(a.def.to.id)! : undefined; console.log(`${s.tag} x ${s.at[0]} z ${s.at[2]} ${l.def.NPS}" ${a.def.service} → ${to?.equip} x ${to ? Math.round(to.face[0]) : '?'} (${to ? Math.round(Math.abs(to.face[0] - s.at[0])) : ''})`); }
