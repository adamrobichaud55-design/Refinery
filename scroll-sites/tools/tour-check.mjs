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
// Serve the scroll-sites folder first (python3 -m http.server 5197). Without --fix it only reports. With --fix the
// broken parts in the middle of a stretch are marked as bridges, which the site crosses at speed with the picture
// streaked by the motion, and broken parts at either end are cut off. Run it again afterwards to see the result.
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
// positions already marked as bridges are not measured: they are crossed at speed whatever they show
const bridge = tour.map(t => (JSON.parse(readFileSync(resolve(walkDir, t.dir, t.file || 'walk.json'), 'utf8')).cams || []).map(c => (c.r || 0) >= 0.5));
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
      for (let j = 0; j < plan[k]; j++) { if (bridge[k][j]) continue; const a = await page.evaluate(([k, j]) => window.tour.audit(k, j), [k, j]); bare[k][j] = Math.max(bare[k][j], a.patched); hole[k][j] = Math.max(hole[k][j], a.hole); }
      console.log(`${w}x${h}  ${tour[k].dir}/${tour[k].file || 'walk.json'}: worst ${(Math.max(...bare[k]) * 100).toFixed(1)}% patched, ${(Math.max(...hole[k]) * 100).toFixed(1)}% shown by no photograph`);
    }
  }
  await browser.close();
}
if (opt.report) writeFileSync(opt.report, JSON.stringify({ tour, patched: bare, hole }));

// Each stretch is sorted into parts to walk and parts to cross quickly. A position is broken when it or a neighbour is
// over a limit; a clean run shorter than --min positions is not worth slowing down for. Broken parts in the middle
// become bridges (the site crosses them at speed, streaked by the motion); broken parts at either end are cut off.
const out = []; let changed = 0;
for (const [k, t] of tour.entries()) {
  const src = resolve(walkDir, t.dir, t.file || 'walk.json'), walk = JSON.parse(readFileSync(src, 'utf8')), n = bare[k].length;
  if (!walk.cams) { out.push(t); continue; }                       // a room walked from photograph to photograph has no planned path
  const was = walk.cams.map(c => (c.r || 0) >= 0.5), bad = bare[k].map((v, j) => !was[j] && (v > LIMIT || hole[k][j] > HOLE));
  const fast = was.map((v, j) => v || bad[Math.max(0, j - 1)] || bad[j] || bad[Math.min(n - 1, j + 1)]);
  for (let j = 0; j < n; j++) if (!fast[j]) { let e = j; while (e + 1 < n && !fast[e + 1]) e++; if (e - j + 1 < MIN) for (let i = j; i <= e; i++) fast[i] = true; j = e; }
  const a = fast.indexOf(false), e = fast.lastIndexOf(false), added = fast.filter((v, j) => v && !was[j]).length; changed += added;
  console.log(`${t.dir}/${t.file || 'walk.json'}: ${n} positions, ${bad.filter(Boolean).length} newly broken` + (a < 0 ? ', nothing left to walk' : `; walking ${fast.filter(v => !v).length}, crossing ${fast.slice(a, e + 1).filter(Boolean).length} at speed, cutting ${a + n - 1 - e} from the ends`));
  if (!opt.fix || a < 0) { if (a >= 0 || !opt.fix) out.push(t); continue; }
  const soft = fast.map((v, j) => [-2, -1, 0, 1, 2].reduce((sum, d, i) => sum + [1, 2, 3, 2, 1][i] * (fast[Math.min(n - 1, Math.max(0, j + d))] ? 1 : 0), 0) / 9);      // the pace changes gradually
  const cams = walk.cams.slice(a, e + 1).map((c, i) => { const { r, ...rest } = c, v = Math.round(Math.max(r || 0, soft[a + i]) * 100) / 100; return v > 0.005 ? { ...rest, r: v } : rest; });
  const chapters = (walk.chapters || []).filter(c => c.to >= a && c.from <= e).map(c => ({ ...c, from: Math.max(c.from, a) - a, to: Math.min(c.to, e) - a }));
  for (let c = chapters.length - 1; c >= 0 && chapters.length > 1; c--) if (chapters[c].to - chapters[c].from < 4) { if (c > 0) chapters[c - 1].to = chapters[c].to; else chapters[1].from = chapters[0].from; chapters.splice(c, 1); }   // a room name left with only a moment on screen joins its neighbour
  writeFileSync(src, JSON.stringify({ ...walk, cams, chapters })); out.push(t);
}
if (opt.fix) { writeFileSync(tourFile, JSON.stringify(out)); console.log(changed ? `${changed} more positions are now crossed at speed or cut. Run the check again to confirm.` : 'nothing to change'); }
else console.log(changed ? `${changed} positions would be changed with --fix` : 'the tour is clean');
