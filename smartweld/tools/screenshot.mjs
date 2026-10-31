// Headless-browser verification: loads the viewer, opens each catalogue entry, and saves a screenshot.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('/opt/node-tools/node_modules/playwright'); // pre-installed in the session; not a project dependency
import { mkdirSync } from 'node:fs';
const base = process.env.VIEWER_URL ?? 'http://127.0.0.1:5173/';
const out = process.argv[2] ?? 'screenshots/stage1';
mkdirSync(out, { recursive: true });
const targets = [
  ['assembly-column-base', '#assembly:column-base'],
  ['W12x26', '#entry:W12x26'], ['W14x90', '#entry:W14x90'], ['C10x15.3', '#entry:C10x15.3'],
  ['L6x4x1-2', '#entry:' + encodeURIComponent('L6x4x1/2')], ['HSS6x4x1-4', '#entry:' + encodeURIComponent('HSS6x4x1/4')],
  ['HSS6x1-4-round', '#entry:' + encodeURIComponent('HSS6x1/4 (round)')],
  ['base-plate', '#entry:' + encodeURIComponent('Base plate for W10x49')], ['stiffener', '#entry:' + encodeURIComponent('Stiffener for W10x49')],
  ['bolt', '#entry:' + encodeURIComponent('B3/4x2-1/2 (grip 1-1/2)')], ['anchor-rod', '#entry:' + encodeURIComponent('Anchor rod (for the W10x49 base)')],
  ['fillet-weld', '#entry:' + encodeURIComponent('FW1/4 × 12 in')], ['groove-weld', '#entry:' + encodeURIComponent('GW1/2 × 12 in')],
  ['typed-W18x50', '#des:W18x50'],
  ['building-exterior', '#building:exterior'], ['building-corner', '#building:corner'], ['building-interior', '#building:interior'], ['building-knee', '#building:knee'], ['building-door', '#building:door'],
  ['plant-walk', '#plant:walk'], ['plant-rack', '#plant:rack'], ['plant-vessels', '#plant:vessels'], ['plant-stair', '#plant:stair'], ['plant-column', '#plant:column'], ['plant-tanks', '#plant:tanks'], ['plant-pumps', '#plant:pumps'], ['plant-overview', '#plant:overview'],
  ['Z-purlin', '#entry:' + encodeURIComponent('Z10x2.5x5/64 (purlin)')], ['panel', '#entry:' + encodeURIComponent('Wall/roof panel PNL1.25x36')], ['ridge-cap', '#entry:' + encodeURIComponent('Ridge cap 12x12 (1:12)')], ['weld-around', '#entry:' + encodeURIComponent('Fillet all around W10x49')],
];
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 860 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
for (const [name, hash] of targets) {
  await page.goto(base + hash, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__smartweldReady === true, null, { timeout: 120000 });
  await page.waitForTimeout(name.startsWith('building') || name.startsWith('plant') ? 5000 : 600);
  const visibleErr = await page.$eval('#err', el => getComputedStyle(el).display !== 'none' ? el.textContent : '');
  if (visibleErr) errors.push(`${name}: ${visibleErr}`);
  const title = await page.$eval('#info h2', el => el.textContent);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(`ok ${name} -> ${title}`);
}
await browser.close();
if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exit(1); }
console.log('no browser errors');
