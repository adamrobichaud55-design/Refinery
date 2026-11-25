// Plant 3 diagnostic (read-only; writes nothing in the repository). See docs/REFINERY-HANDOFF.md. Run from smartweld/: npx vite-node tools/refinery-diag/few-lines.ts
// a few lines of a unit routed by themselves in its whole plant (read-only): LINES=17067,17325,...
import { generatePiping } from '../../src/generator/piping';
import { unitPiping, gateReach, gateWidth } from '../../src/refinery/unitPiping';
const up = unitPiping(Number(process.env.UNIT ?? 17)), want = (process.env.LINES ?? '').split(',');
const m = generatePiping({ plant: up.plant, only: l => want.some(w => l.no.endsWith(w)) });
console.log('failures', m.failures, 'reach10', gateReach(10), 'width10', gateWidth(10, 'P300' as never));
for (const l of m.lines) { console.log(l.no, l.ok, JSON.stringify(l.path.map(p => p.map(v => Math.round(v))))); for (const c of l.comps) if (c.kind === 'valve') console.log('   ', c.tag, c.key, c.a.map(v => Math.round(v)), c.b.map(v => Math.round(v)), JSON.stringify((c as { stem?: number[] }).stem ?? (c as { up?: number[] }).up ?? '')); }
