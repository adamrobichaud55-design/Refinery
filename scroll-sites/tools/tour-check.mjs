// Checks a photo walk before it goes to a client, and can trim the parts that would look broken.
//
// At every camera position of the tour it asks the viewer two things: how much of the picture the two nearest
// photographs do not really show (that part is patched in from photographs further away, which is where torn edges
// and smears come from: typically a door frame or a piece of furniture passing very close to the camera), and how
// much no photograph shows at all (the viewer fills that with the colours around it). A few per cent of patching is
// normal at every edge in a room; a position is called broken above --limit patched or --hole unseen.
//
//   node tools/tour-check.mjs <site> [--limit 0.10] [--hole 0.03] [--min 14] [--fix] [--report file.json] [--from file.json]
//
// --report saves the measurements; --from reuses saved ones instead of measuring again (the measuring takes minutes).
//
// Serve the scroll-sites folder first (python3 -m http.server 5197). Without --fix it only reports. With --fix every
// stretch is cut down to its clean runs of at least --min camera positions: walk.json keeps the first run, further
// runs become walk-2.json, walk-3.json ... beside it, and walk/tour.json lists them in order. Run it again afterwards
// to see the result; a clean tour reports nothing to trim.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire('/opt/node-tools/node_modules/');
const { chromium } = require('playwright');
const [site, ...rest] = process.argv.slice(2), opt = {};
for (let i = 0; i < rest.length; i++) if (rest[i] === '--fix') opt.fix = true; else opt[rest[i].slice(2)] = rest[++i];
if (!site) { console.error('usage: node tools/tour-check.mjs <site> [--limit 0.10] [--hole 0.03] [--min 14] [--fix] [--report file.json] [--from file.json]'); process.exit(1); }
const LIMIT = Number(opt.limit ?? 0.10), HOLE = Number(opt.hole ?? 0.03), MIN = Number(opt.min ?? 14);
const walkDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', site, 'walk'), tourFile = resolve(walkDir, 'tour.json');
const tour = JSON.parse(readFileSync(tourFile, 'utf8'));

let bare, hole;
if (opt.from) { const saved = JSON.parse(readFileSync(opt.from, 'utf8')); bare = saved.patched; hole = saved.hole; if (bare.length !== tour.length || bare.some((b, k) => !tour[k])) { console.error('the saved measurements are for a different tour'); process.exit(1); } }
else {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const page = await browser.newPage({ viewport: { width: 270, height: 480 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  await page.goto(`http://127.0.0.1:5197/${site}/tour-src/walk-dev.html`); await page.waitForFunction(() => window.ready, null, { timeout: 240000 });
  const plan = await page.evaluate(() => window.tour.plan); bare = plan.map(n => new Array(n).fill(0)); hole = plan.map(n => new Array(n).fill(0));
  // a phone held upright and a wide screen see different parts of each photograph, so both are checked
  for (const [w, h] of [[270, 480], [480, 300]]) {
    await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(600);
    for (let k = 0; k < plan.length; k++) {
      for (let j = 0; j < plan[k]; j++) { const a = await page.evaluate(([k, j]) => window.tour.audit(k, j), [k, j]); bare[k][j] = Math.max(bare[k][j], a.patched); hole[k][j] = Math.max(hole[k][j], a.hole); }
      console.log(`${w}x${h}  ${tour[k].dir}/${tour[k].file || 'walk.json'}: worst ${(Math.max(...bare[k]) * 100).toFixed(1)}% patched, ${(Math.max(...hole[k]) * 100).toFixed(1)}% shown by no photograph`);
    }
  }
  await browser.close();
}
if (opt.report) writeFileSync(opt.report, JSON.stringify({ tour, patched: bare, hole }));

// the clean runs of each stretch: a position is clean when it and its neighbours stay under the limit
const out = []; let trimmed = 0;
for (const [k, t] of tour.entries()) {
  const n = bare[k].length, bad = bare[k].map((v, j) => v > LIMIT || hole[k][j] > HOLE), ok = bad.map((v, j) => !(bad[Math.max(0, j - 1)] || v || bad[Math.min(n - 1, j + 1)])), runs = [];
  for (let j = 0; j < n; j++) if (ok[j]) { let e = j; while (e + 1 < n && ok[e + 1]) e++; if (e - j + 1 >= MIN) runs.push([j, e]); j = e; }
  const kept = runs.reduce((s, r) => s + r[1] - r[0] + 1, 0); trimmed += n - kept;
  console.log(`${t.dir}/${t.file || 'walk.json'}: ${n} positions, ${kept} clean` + (kept < n ? `, keeping ${runs.map(r => r.join('-')).join(', ') || 'nothing'}` : ''));
  if (!opt.fix) continue;
  const src = resolve(walkDir, t.dir, t.file || 'walk.json'), walk = JSON.parse(readFileSync(src, 'utf8'));
  if (!walk.cams) { out.push(t); continue; }                       // a room walked from photograph to photograph has no planned path to trim
  for (const [i, [a, e]] of runs.entries()) {
    const file = i === 0 ? (t.file || 'walk.json') : (t.file || 'walk.json').replace(/\.json$/, '') + `-${i + 1}.json`;
    const chapters = (walk.chapters || []).filter(c => c.to >= a && c.from <= e).map(c => ({ ...c, from: Math.max(c.from, a) - a, to: Math.min(c.to, e) - a }));
    for (let c = chapters.length - 1; c >= 0 && chapters.length > 1; c--) if (chapters[c].to - chapters[c].from < 4) { if (c > 0) chapters[c - 1].to = chapters[c].to; else chapters[1].from = chapters[0].from; chapters.splice(c, 1); }   // a room name left with only a moment on screen joins its neighbour
    writeFileSync(resolve(walkDir, t.dir, file), JSON.stringify({ ...walk, cams: walk.cams.slice(a, e + 1), chapters }));
    out.push({ ...t, ...(file === 'walk.json' ? {} : { file }) });
  }
}
if (opt.fix) { writeFileSync(tourFile, JSON.stringify(out)); console.log(trimmed ? `trimmed ${trimmed} positions; ${out.length} stretches remain. Run the check again to confirm.` : 'nothing to trim'); }
else console.log(trimmed ? `${trimmed} positions would be trimmed with --fix` : 'the tour is clean');
