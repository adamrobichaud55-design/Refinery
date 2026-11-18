// Draws the 3D walkthrough frame by frame with a headless browser, for a video or for stills.
//   node tools/tour-video.mjs video <out-folder> [--w 720 --h 1280 --frames 624 --mod 2 --rem 0]
//   node tools/tour-video.mjs stills <out-folder> [--w 1440 --h 900] 0 60 102 162 198 240      (tour frames, 0 to 240)
// Serve the scroll-sites folder first (python3 -m http.server 5197), then for a video:
//   ffmpeg -framerate 24 -i <out-folder>/f%04d.png -c:v libx264 -crf 20 -pix_fmt yuv420p tour.mp4
// In the video the afternoon turns to sunset as the camera moves through the apartment.
import { createRequire } from 'node:module';
import { mkdirSync, existsSync } from 'node:fs';
const require = createRequire('/opt/node-tools/node_modules/');
const { chromium } = require('playwright');
const [mode, out, ...rest] = process.argv.slice(2), opt = {}, pos = [];
for (let i = 0; i < rest.length; i++) rest[i].startsWith('--') ? (opt[rest[i].slice(2)] = rest[++i]) : pos.push(Number(rest[i]));
const W = Number(opt.w ?? (mode === 'video' ? 720 : 1440)), H = Number(opt.h ?? (mode === 'video' ? 1280 : 900)), N = Number(opt.frames ?? 624), mod = Number(opt.mod ?? 1), rem = Number(opt.rem ?? 0);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
await page.goto(`http://127.0.0.1:5197/holiday-rental/tour-src/dev.html?f=0&t=${opt.t ?? 0.42}`); await page.waitForFunction(() => window.ready, null, { timeout: 240000 });
const shoot = async (f, t, path) => { await page.evaluate(([f, t]) => window.tour.render(f, t), [f, t]); await page.screenshot({ path, timeout: 240000 }); };
const smooth = v => v * v * (3 - 2 * v), track = (pts, x) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * smooth((x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0])); return pts[pts.length - 1][1]; };
if (mode === 'stills') for (const f of pos) { await shoot(f, Number(opt.t ?? 0.42), `${out}/tour-${String(f).padStart(3, '0')}.png`); console.log('still', f); }
else for (let i = 0; i < N; i++) {
  if (i % mod !== rem) continue; const path = `${out}/f${String(i).padStart(4, '0')}.png`; if (existsSync(path)) continue;
  const u = i / (N - 1), f = 240 * track([[0, 0], [0.04, 0], [0.97, 1], [1, 1]], u);           // a short hold at each end
  await shoot(f, track([[0, 0.3], [100, 0.52], [160, 0.6], [200, 0.66], [240, 0.6]], f), path); if (i % 50 === 0) console.log(i, '/', N);
}
await browser.close();
