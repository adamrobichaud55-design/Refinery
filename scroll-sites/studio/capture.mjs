// Renders a scene's frames with a headless browser.
//   node capture.mjs stills house land 0 60 120      chosen frames to out/stills/
//   node capture.mjs frames house land               every frame to out/<scene>-<set>/f0000.png, and anchors.json beside them
// Sets: land = 1440x810, port = 810x1440, card = 720x450 (stock photos), photo = 1620x1080 (listing photographs). Start the studio first: node ../../smartweld/node_modules/vite/bin/vite.js --config vite.config.mjs
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
const require = createRequire('/opt/node-tools/node_modules/');
const { chromium } = require('playwright');
const [mode = 'stills', scene = 'house', set = 'land', ...rest] = process.argv.slice(2);
const [W, H] = set === 'port' ? [810, 1440] : set === 'card' ? [720, 450] : set === 'photo' ? [1620, 1080] : [1440, 810];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('PAGE ERROR', e.message)); page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.goto(`http://127.0.0.1:5198/?scene=${scene}&w=${W}&h=${H}${process.env.SAMPLES ? '&s=' + process.env.SAMPLES : ''}`);   // SAMPLES=5 node capture.mjs ... renders faster, a little less smooth
await page.waitForFunction(() => window.studio, null, { timeout: 120000 });
const n = await page.evaluate(() => window.studio.frames);
const shoot = async (i, path) => { const a = await page.evaluate(k => window.studio.setFrame(k), i); await page.screenshot({ path, type: 'png', timeout: 300000 }); return a; };
if (mode === 'stills') {
  mkdirSync('out/stills', { recursive: true });
  for (const i of rest.map(Number)) { const t = Date.now(); await shoot(i, `out/stills/${scene}-${set}-${String(i).padStart(4, '0')}.png`); console.log('frame', i, ((Date.now() - t) / 1000).toFixed(1), 's'); }
} else {
  const dir = `out/${scene}-${set}`; mkdirSync(dir, { recursive: true }); const anchors = [], t = Date.now();
  for (let i = 0; i < n; i++) { const f = `${dir}/f${String(i).padStart(4, '0')}.png`; anchors.push(existsSync(f) ? await page.evaluate(k => window.studio.anchorsAt(k), i) : await shoot(i, f)); if (i % 40 === 39) console.log(i + 1, '/', n, ((Date.now() - t) / (i + 1) / 1000).toFixed(2), 's per frame'); }
  writeFileSync(`${dir}/anchors.json`, JSON.stringify(anchors));
}
await browser.close();
