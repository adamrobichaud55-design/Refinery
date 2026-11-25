// Plant 3 diagnostic (read-only; writes nothing in the repository). See docs/REFINERY-HANDOFF.md. Run from smartweld/: npx vite-node tools/refinery-diag/plan-digest.ts
// a digest of each routed unit's cell and piping plan, for showing that a change leaves them as they were (read-only)
//   ROOT=<repo smartweld dir> OUT=<dir> [UNITS=11,12,...] vite-node digest.ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = process.env.ROOT!, out = process.env.OUT!; mkdirSync(out, { recursive: true });
const { unitPiping } = await import(`${root}/src/refinery/unitPiping`);
const units = (process.env.UNITS ?? '11,12,13,14,15,16,18,19').split(',').map(Number);
const rnd = (_k: string, v: unknown) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v instanceof Map ? [...v.entries()] : v);
for (const u of units) {
  const t0 = Date.now(), up = unitPiping(u);
  const plan = { cell: { rack: up.cell.rack, x1: up.cell.x1, z0: up.cell.z0, z1: up.cell.z1, y1: up.cell.y1, yard: up.cell.yard, spots: up.cell.spots, instances: up.cell.interior.instances.length, equipment: up.cell.interior.equipment.map((q: { tag: string; transform: number[] }) => [q.tag, q.transform]) },
    lines: up.lines, nozzles: [...up.nozzles.entries()], runs: up.runs, spools: up.spools, feeds: up.feeds, tierRoom: up.tierRoom, notes: up.notes };
  const text = JSON.stringify(plan, rnd, 1), h = createHash('sha1').update(text).digest('hex');
  writeFileSync(`${out}/unit-${u}.plan.json`, text); console.log(`unit ${u}: ${h} (${up.lines.length} lines, ${up.runs.length} runs, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
