// Renders the film frame by frame in a headless browser and writes PNG frames.
//   node capture.mjs stills            24 frames spread over the film (out/stills/)
//   node capture.mjs frames [a] [b]    frames a..b-1 (default: all) to out/frames/, skipping those already there; --mod=3 --rem=0|1|2 splits them over three workers
// Options: --plant=P3  --pr=1.5 (pixel ratio of the 1280x720 stage)
import { createRequire } from 'node:module';
import { mkdirSync, existsSync } from 'node:fs';
const require = createRequire('/opt/node-tools/node_modules/');
const { chromium } = require('playwright');
const args = process.argv.slice(2), opt = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('='))), pos = args.filter(a => !a.startsWith('--'));
const mode = pos[0] ?? 'stills', plant = opt.plant ?? 'P3', pr = Number(opt.pr ?? 1.5), aa = opt.aa ?? '0';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: pr });
page.on('pageerror', e => console.error('PAGE ERROR', e.message)); page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.goto(`http://127.0.0.1:5199/?plant=${plant}&pr=${pr}&aa=${aa}${opt.sub ? '&sub=' + opt.sub : ''}`);
const t0 = Date.now();
await page.waitForFunction(() => window.film, null, { timeout: 120000 });
await page.evaluate(() => window.film.ready);
const info = await page.evaluate(() => ({ frames: window.film.frames, fps: window.film.fps, profile: window.film.profile() }));
console.log('scene ready in', ((Date.now() - t0) / 1000).toFixed(1), 's;', info.frames, 'frames at', info.fps, 'fps');
const stage = page.locator('#stage');
const shoot = async (i, path) => { const n = await page.evaluate(n => window.film.setFrame(n), i); await page.screenshot({ path, type: 'png', timeout: 400000 }); return n; };
if (mode === 'profile') {   // the camera's speed (in/s) and turn rate (deg/s), twice a second
  for (let i = 0; i < info.frames; i += 12) console.log((i / info.fps).toFixed(1).padStart(5), 's', String(info.profile[i][0]).padStart(6), 'in/s', String(info.profile[i][1]).padStart(5), 'deg/s');
  const d = info.profile.slice(1).map((p, i) => [Math.abs(p[0] - info.profile[i][0]), Math.abs(p[1] - info.profile[i][1])]);
  console.log('peak speed', Math.max(...info.profile.map(p => p[0])), 'in/s; peak turn', Math.max(...info.profile.map(p => p[1])), 'deg/s; largest change between frames', Math.max(...d.map(x => x[0])), 'in/s,', Math.max(...d.map(x => x[1])), 'deg/s');
} else if (mode === 'stills') {
  mkdirSync('out/stills', { recursive: true });
  const picks = pos.length > 1 ? pos.slice(1).map(Number) : Array.from({ length: 24 }, (_, k) => Math.round(((k + 0.5) * info.frames) / 24));
  for (const i of picks) { const t = Date.now(); const n = await shoot(i, `out/stills/f${String(i).padStart(4, '0')}.png`); console.log('frame', i, ((Date.now() - t) / 1000).toFixed(2), 's', n, 'sub-frames'); }
} else {
  mkdirSync('out/frames', { recursive: true });
  const a = Number(pos[1] ?? 0), b = Number(pos[2] ?? info.frames), t = Date.now();
  const mod = Number(opt.mod ?? 1), rem = Number(opt.rem ?? 0);
  for (let i = a; i < b; i++) { if (i % mod !== rem) continue; const f = `out/frames/f${String(i).padStart(4, '0')}.png`; if (existsSync(f)) continue; await shoot(i, f); if ((i - a) % 30 === 29) console.log('frame', i + 1, '/', b, ((Date.now() - t) / (i - a + 1) / 1000).toFixed(2), 's per frame'); }
}
await browser.close();
