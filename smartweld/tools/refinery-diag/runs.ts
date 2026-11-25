// Plant 3 diagnostic (read-only; writes nothing in the repository). See docs/REFINERY-HANDOFF.md. Run from smartweld/: npx vite-node tools/refinery-diag/runs.ts
// the cracking unit's runs in order (read-only)
import { unitPiping } from '../../src/refinery/unitPiping';
const up = unitPiping(Number(process.env.UNIT ?? 17));
up.runs.forEach((r, k) => console.log(`${k}: ${r.kind} ${r.lines.join(', ')}${r.lane ? ` | tier ${r.lane.t + 1} z ${r.lane.z} x ${r.lane.x0}–${r.lane.x1}` : ''}`));
