// Renders the film frame by frame in a headless browser and writes PNG frames.
//   node capture.mjs stills            one frame from the middle of every shot (out/stills/)
//   node capture.mjs frames [a] [b]    frames a..b-1 (default: all) to out/frames/; --mod=3 --rem=0|1|2 splits them over three workers
// Options: --plant=P3  --pr=1.5 (pixel ratio of the 1280x720 stage)
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
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
const info = await page.evaluate(() => ({ frames: window.film.frames, fps: window.film.fps, starts: window.film.shotStarts }));
console.log('scene ready in', ((Date.now() - t0) / 1000).toFixed(1), 's;', info.frames, 'frames at', info.fps, 'fps');
const stage = page.locator('#stage');
const shoot = async (i, path) => { const n = await page.evaluate(n => window.film.setFrame(n), i); await page.screenshot({ path, type: 'png', timeout: 120000 }); return n; };
if (mode === 'stills') {
  mkdirSync('out/stills', { recursive: true });
  const ends = [...info.starts.slice(1), info.frames];
  const picks = pos.length > 1 ? pos.slice(1).map(Number) : info.starts.flatMap((s, k) => [s + 5, Math.round(s + (ends[k] - s) * 0.33), Math.round(s + (ends[k] - s) * 0.66), ends[k] - 4]);
  for (const i of picks) { const t = Date.now(); const n = await shoot(i, `out/stills/f${String(i).padStart(4, '0')}.png`); console.log('frame', i, ((Date.now() - t) / 1000).toFixed(2), 's', n, 'sub-frames'); }
} else {
  mkdirSync('out/frames', { recursive: true });
  const a = Number(pos[1] ?? 0), b = Number(pos[2] ?? info.frames), t = Date.now();
  const mod = Number(opt.mod ?? 1), rem = Number(opt.rem ?? 0);
  for (let i = a; i < b; i++) { if (i % mod !== rem) continue; await shoot(i, `out/frames/f${String(i).padStart(4, '0')}.png`); if ((i - a) % 30 === 29) console.log('frame', i + 1, '/', b, ((Date.now() - t) / (i - a + 1) / 1000).toFixed(2), 's per frame'); }
}
await browser.close();
