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
  ['flange-6-P300', '#entry:' + encodeURIComponent('FLG6-P300 weld neck')],
  ['v-GATE', '#valve:GATE:6:P300'], ['v-GATE-section', '#valve:GATE:6:P300;section'], ['v-GATE-gear', '#valve:GATE:16:P600'], ['v-KNIFE', '#valve:KNIFE:8:P150'],
  ['v-GLOBE', '#valve:GLOBE:4:P300'], ['v-GLOBE-section', '#valve:GLOBE:4:P300;section'], ['v-YGLOBE', '#valve:YGLOBE:4:P300'], ['v-AGLOBE', '#valve:AGLOBE:4:P300'],
  ['v-CHECK', '#valve:CHECK:6:P300'], ['v-CHECK-section', '#valve:CHECK:6:P300;section'], ['v-LCHECK-section', '#valve:LCHECK:2:P600;section'],
  ['v-BALL', '#valve:BALL:4:P600'], ['v-BALL-section', '#valve:BALL:4:P600;section'],
  ['v-BFLY', '#valve:BFLY:8:P150'], ['v-LBFLY', '#valve:LBFLY:8:P150'], ['v-DBFLY', '#valve:DBFLY:12:P300'],
  ['v-PLUG', '#valve:PLUG:4:P300'], ['v-PLUG-section', '#valve:PLUG:4:P300;section'], ['v-DIAPH', '#valve:DIAPH:3:P150'], ['v-DIAPH-section', '#valve:DIAPH:3:P150;section'],
  ['v-NEEDLE', '#valve:NEEDLE:0.5:P2400'], ['v-PSV', '#valve:PSV:3:P300'], ['v-PSV-section', '#valve:PSV:3:P300;section'], ['v-CONTROL', '#valve:CONTROL:4:P300'], ['v-CONTROL-section', '#valve:CONTROL:4:P300;section'],
  ['piping-overview', '#piping:overview'], ['piping-rack', '#piping:piping-rack'], ['piping-pumps', '#piping:piping-pumps'], ['piping-column', '#piping:piping-column'],
  ['piping-exchangers', '#piping:piping-exchangers'], ['piping-tanks', '#piping:piping-tanks'], ['piping-above', '#piping:piping-above'], ['piping-walk', '#piping:walk'],
  ['piping-line-1015', '#piping:piping-column;line=' + encodeURIComponent('3"-P300-P-1015')], ['piping-line-3001', '#piping:piping-rack;line=' + encodeURIComponent('4"-P150-CWS-3001')],
  ['piping-classes', '#piping:line-classes'], ['piping-item-cv', '#piping:piping-column;item=' + encodeURIComponent('3"-P300-P-1015/B13')],
  ['wo-400-05', '#wo:WO-400-05'], ['wo-200-01', '#wo:WO-200-01'], ['wo-500-02', '#wo:WO-500-02'], ['equip-p101a', '#piping:piping-pumps;equip=P-101A'],
  ['Z-purlin', '#entry:' + encodeURIComponent('Z10x2.5x5/64 (purlin)')], ['panel', '#entry:' + encodeURIComponent('Wall/roof panel PNL1.25x36')], ['ridge-cap', '#entry:' + encodeURIComponent('Ridge cap 12x12 (1:12)')], ['weld-around', '#entry:' + encodeURIComponent('Fillet all around W10x49')],
];
const only = process.argv[3];   // optional name prefix filter
const run = only ? targets.filter(([n]) => n.startsWith(only)) : targets;
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 860 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
for (const [name, hash] of run) {
  await page.goto(base + hash, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__smartweldReady === true, null, { timeout: 120000 });
  if (name.startsWith('piping') || name.startsWith('wo-') || name.startsWith('equip')) await page.waitForFunction(() => window.__pipingReady === true, null, { timeout: 600000 });
  await page.waitForTimeout(name.startsWith('building') || name.startsWith('plant') || name.startsWith('piping') || name.startsWith('wo-') || name.startsWith('equip') ? 5000 : name.startsWith('v-') ? 2500 : 600);
  const visibleErr = await page.$eval('#err', el => getComputedStyle(el).display !== 'none' ? el.textContent : '');
  if (visibleErr) errors.push(`${name}: ${visibleErr}`);
  const title = await page.$eval('#info h2', el => el.textContent);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(`ok ${name} -> ${title}`);
}
await browser.close();
if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exit(1); }
console.log('no browser errors');
