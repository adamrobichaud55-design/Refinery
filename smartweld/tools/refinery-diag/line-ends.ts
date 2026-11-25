// Plant 3 diagnostic (read-only; writes nothing in the repository). See docs/REFINERY-HANDOFF.md. Run from smartweld/: npx vite-node tools/refinery-diag/line-ends.ts
// the ends of given lines of a unit's plan (read-only):  LINES=17048,17074 vite-node u17line.ts
import { unitPiping } from '../../src/refinery/unitPiping';
const U = Number(process.env.UNIT ?? 17), up = unitPiping(U), want = (process.env.LINES ?? '').split(',').filter(Boolean);
const r = (v: number[]) => v.map(x => Math.round(x * 10) / 10).join(',');
for (const l of up.lines) {
  if (!want.some(w => l.def.no.endsWith(w))) continue;
  const end = (e: typeof l.def.from) => { if (e.k === 'nozzle') { const n = up.nozzles.get(e.id)!; return `${e.id} on ${n.equip} A ${r(n.A as number[])} u ${r(n.u as number[])} S ${n.S} ${n.NPS}" ${n.cls} ${n.service ?? ''}`; } return JSON.stringify(e); };
  const run = up.runs.findIndex(q => q.lines.includes(l.def.no));
  console.log(`${l.def.no} [${l.origin} seq ${l.seq} flow ${l.flow} ${l.fluid}] service ${l.def.service} kind ${l.def.kind} run ${run} ${up.runs[run]?.kind} ${up.runs[run]?.lane ? JSON.stringify(up.runs[run].lane) : ''}\n   from ${end(l.def.from)}\n   to   ${end(l.def.to)}${l.bare ? `\n   bare ${l.bare}` : ''}`);
}
