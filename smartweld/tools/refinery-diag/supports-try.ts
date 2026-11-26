// Plant 3 diagnostic (read-only): SW-RPI-17 applied to a unit's model on disk, and the spans the check still lists.  UNITS=17 vite-node tools/refinery-diag/supports-try.ts
import { readFileSync } from 'node:fs';
import type { PipingModel } from '../../src/generator/piping';
import * as K from '../../src/generator/pipingCheck';
import { unitPiping } from '../../src/refinery/unitPiping';
import { valveBoxFn } from '../../src/refinery/pipingReport';
import { supportsAlongSpans } from '../../src/refinery/supports';
const vb = valveBoxFn();
for (const u of (process.env.UNITS ?? '17').split(',').map(Number)) {
  const up = unitPiping(u), m = JSON.parse(readFileSync(`public/refinery/piping/unit-${u}.json`, 'utf8')) as PipingModel, before = K.checkSupports(m, up.plant.rack).length, t0 = Date.now();
  const s = supportsAlongSpans(m, up.plant, vb), left = K.checkSupports(m, up.plant.rack);
  console.log(`unit ${u}: spans ${before} → ${left.length}; hangers ${s.hangers}, stanchions ${s.stanchions}, posts ${s.posts}, on steel ${s.onSteel}, frames ${s.frames.length}; ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  for (const x of left.slice(0, Number(process.env.SHOW ?? 0))) console.log('   ', x);
}
