// Plant 3 diagnostic (read-only; writes nothing in the repository). See docs/REFINERY-HANDOFF.md. Run from smartweld/: npx vite-node tools/refinery-diag/audit-ends.ts
// audit of a unit's plan before it is routed: for each end of each line that runs the rack, the bodies that stand between that end and the rack at the end's own station (read-only)
import { unitPiping } from '../../src/refinery/unitPiping';
import { pipeDims } from '../../src/catalogue';
const U = Number(process.env.UNIT ?? 17), up = unitPiping(U), c = up.cell, hw = c.rack.halfWidth;
let n = 0;
for (const r of up.runs) {
  if (r.kind !== 'rack' || !r.lane) continue;
  for (const no of r.lines.slice(0, 1)) {
    const l = up.lines.find(q => q.def.no === no)!, R = pipeDims(l.def.NPS, l.def.cls).OD / 2 + 3;
    for (const e of [l.def.from, l.def.to]) {
      if (e.k !== 'nozzle' || /^(BL|RS|CS)-/.test(e.id)) continue;
      const nz = up.nozzles.get(e.id)!, x = nz.face[0], z = nz.face[2], side = Math.sign(z) || 1, own = c.spots.find(s => s.tag === nz.equip);
      const between = c.spots.filter(s => s.tag !== nz.equip && s.item !== own?.item && s.lane !== 'air' && s.lx > 0 && Math.abs(s.x - x) < s.lx / 2 + R && Math.sign(s.z) === side && Math.abs(s.z) + s.lz / 2 > hw && Math.abs(s.z) - s.lz / 2 < Math.abs(z) && Math.abs(s.z) < Math.abs(own?.z ?? z));
      if (!between.length) continue; n++;
      console.log(`${no.padEnd(20)} t${r.lane.t + 1}  ${e.id.padEnd(12)} on ${nz.equip.padEnd(8)} station ${Math.round(x)} at y ${Math.round(nz.face[1])} z ${Math.round(z)} u ${nz.u.map(v => Math.round(v)).join(',')}: before the rack ${between.map(s => `${s.tag} (${s.kind}, x ${Math.round(s.x - s.lx / 2)}–${Math.round(s.x + s.lx / 2)}, top ${Math.round(s.h)})`).join('; ')}`);
    }
  }
}
console.log(`${n} ends with a body before the rack`);
