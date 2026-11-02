// Renders the review images with SmartWeld's own renderer (DESIGN_BASIS.md §56, SW-REN-1..3) — no browser.
//   vite-node tools/render-views.ts [out-dir=screenshots] [name-filter]
// Writes <out>/<stage>/<view>.png and <out>/INDEX.md (each image's view and the renderer that made it).
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { ENTRIES } from '../src/scene/catalogueList';
import { columnBaseAssembly } from '../src/scene/assemblies';
import { makeValve, type ValveType, type PipeClass } from '../src/catalogue';
import { identity } from '../src/geometry/transform';
import { generateBuilding } from '../src/generator/building';
import { generateInterior } from '../src/generator/interior';
import type { PipingModel } from '../src/generator/piping';
import type { WorkOrder } from '../src/generator/workorders';
import { partDrawables, pipingDrawables, byLineClass, HIGHLIGHT, ISOLATION, type Drawable } from '../src/render/scene';
import { render3d, frameBox, bounds, type Camera } from '../src/render/view3d';
import { contactSheet } from '../src/render/sheet';
import { parseFont } from '../src/pdf/ttf';
import { pagePng } from '../src/render/page';
import { packDoc } from '../src/pdf/wopdf';
import { buildWorkOrders, DEMO_NOTICE } from '../src/generator/workorders';
import { linkImported } from '../src/generator/woexport';
import { woIsometrics, woSections } from '../src/generator/wopack';
import type { GTLine, GTEquipment, GroundTruth } from '../src/generator/groundtruth';
import type { ImportedIndex } from '../src/generator/imported';

const out = process.argv[2] ?? 'screenshots', filter = process.argv[3];
type View = { stage: string; name: string; caption: string; make: () => { ds: Drawable[]; cam: Camera; cut?: { n: [number, number, number]; d: number } } };
const views: View[] = [];
const part = (stage: string, name: string, caption: string, build: () => Parameters<typeof partDrawables>[0][0]['part'], dir?: [number, number, number], section = false) =>
  views.push({ stage, name, caption, make: () => { const ds = partDrawables([{ part: build(), transform: identity() }]); const cut = section ? { n: [1, 0, 0] as [number, number, number], d: 0 } : undefined; const [mn, mx] = bounds(ds); return { ds, cam: frameBox(mn, mx, dir), cut }; } });

// stage 1: catalogue entries and the column-base assembly
for (const e of ENTRIES) part('stage1', `entry-${e.label.replace(/[^A-Za-z0-9.]+/g, '-').replace(/-+$/, '')}`, `Catalogue entry ${e.label}`, e.build);
views.push({ stage: 'stage1', name: 'assembly-column-base', caption: 'Column base assembly', make: () => { const a = columnBaseAssembly(); const ds = partDrawables(a.instances); const [mn, mx] = bounds(ds); return { ds, cam: frameBox(mn, mx) }; } });

// stages 2-3: building shell and plant interior, at the viewer's cameras
let bld: ReturnType<typeof generateBuilding> | null = null, intr: ReturnType<typeof generateInterior> | null = null;
const B = () => (bld ??= generateBuilding()), I = () => (intr ??= generateInterior());
const L = () => B().drawing.bays * B().drawing.bayFt * 12, W = () => B().drawing.widthFt * 12;
const cutaway = (xs: { tags: string[] }[]) => xs.filter(i => !i.tags.includes('cladding') && !i.tags.includes('trim') && !i.tags.includes('roof-sheet'));
const cams: Record<string, () => Camera> = {
  exterior: () => ({ eye: [L() * 1.25, 900, W() * 1.6], target: [L() * 0.45, 60, 0] }), interior: () => ({ eye: [L() * 0.75, 66, W() * 0.3], target: [L() * 0.1, 200, -W() * 0.2] }),
  knee: () => ({ eye: [L() * 0.5 + 420, 250, W() / 2 - 420], target: [L() * 0.5, 340, W() / 2 - 30] }), door: () => ({ eye: [L() * 0.1875 + 200, 70, W() / 2 + 260], target: [L() * 0.1875, 60, W() / 2] }),
  corner: () => ({ eye: [-240, 200, -W() / 2 - 240], target: [L() * 0.3, 150, 0] }), rack: () => ({ eye: [120, 90, 260], target: [900, 200, 0] }),
  vessels: () => ({ eye: [1060, 150, 180], target: [520, 200, 300] }), stair: () => ({ eye: [1180, 90, 430], target: [820, 150, 310] }),
  column: () => ({ eye: [1180, 130, -150], target: [820, 180, -300] }), tanks: () => ({ eye: [880, 110, -170], target: [420, 150, -320] }),
  pumps: () => ({ eye: [1680, 72, 140], target: [2000, 30, 220] }), walk: () => ({ eye: [L() * 0.55, 66, 170], target: [L() * 0.2, 120, 300] }),
  overview: () => ({ eye: [L() * 1.25, 900, W() * 1.6], target: [L() * 0.45, 60, 0] }),
  'piping-rack': () => ({ eye: [300, 150, 230], target: [1100, 230, 0] }), 'piping-pumps': () => ({ eye: [1700, 120, 40], target: [1990, 60, 200] }),
  'piping-column': () => ({ eye: [990, 330, -90], target: [822, 220, -300] }), 'piping-exchangers': () => ({ eye: [1250, 140, 90], target: [1550, 80, 300] }),
  'piping-tanks': () => ({ eye: [110, 150, -170], target: [300, 90, -330] }), 'piping-above': () => ({ eye: [L() * 0.5, 2300, 40], target: [L() * 0.5, 0, 0] }),
  'line-classes': () => ({ eye: [L() * 0.62, 820, 760], target: [L() * 0.45, 120, 0] }),
};
for (const v of ['exterior', 'corner', 'interior', 'knee', 'door']) views.push({ stage: 'stage2', name: `building-${v}`, caption: `Building shell, ${v} view`, make: () => ({ ds: partDrawables(B().instances), cam: cams[v]() }) });
for (const v of ['walk', 'rack', 'vessels', 'stair', 'column', 'tanks', 'pumps', 'overview']) views.push({ stage: 'stage3', name: `plant-${v}`, caption: `Plant (building and interior), ${v} view`, make: () => ({ ds: partDrawables(v === 'overview' ? cutaway([...B().instances, ...I().instances]) : [...B().instances, ...I().instances]), cam: cams[v]() }) });

// stage 4: flange and every valve type
const VALVES: [ValveType, number, PipeClass][] = [['GATE', 6, 'P300'], ['GATE', 16, 'P600'], ['KNIFE', 8, 'P150'], ['GLOBE', 4, 'P300'], ['YGLOBE', 4, 'P300'], ['AGLOBE', 4, 'P300'], ['CHECK', 6, 'P300'], ['LCHECK', 2, 'P600'],
  ['BALL', 4, 'P600'], ['BFLY', 8, 'P150'], ['LBFLY', 8, 'P150'], ['DBFLY', 12, 'P300'], ['PLUG', 4, 'P300'], ['DIAPH', 3, 'P150'], ['NEEDLE', 0.5, 'P2400'], ['PSV', 3, 'P300'], ['CONTROL', 4, 'P300']];
const flange = ENTRIES.find(e => /^FLG/.test(e.label) || /flange/i.test(e.label));
if (flange) part('stage4', 'flange', `Catalogue entry ${flange.label}`, flange.build);
for (const [t, n, c] of VALVES) {
  part('stage4', `valve-${t}-${n}-${c}`, `Valve ${t} ${n}" ${c}`, () => makeValve(`${t}${n}-${c}`, t, n, c), [1, 0.45, 0.9]);
  if (['GATE', 'GLOBE', 'CHECK', 'LCHECK', 'BALL', 'PLUG', 'DIAPH', 'PSV', 'CONTROL'].includes(t) && !(t === 'GATE' && n === 16)) part('stage4', `valve-${t}-${n}-${c}-section`, `Valve ${t} ${n}" ${c}, cut on the stem plane`, () => makeValve(`${t}${n}-${c}`, t, n, c), [1, 0.45, 0.9], true);
}

// stages 5-7: plant piping, line classes, a line, work orders
const M = () => JSON.parse(readFileSync('public/plant-piping.json', 'utf8')) as PipingModel;
let pm: PipingModel | null = null; const P = () => (pm ??= M());
const plantCut = () => partDrawables(cutaway([...B().instances, ...I().instances]));
for (const v of ['overview', 'piping-rack', 'piping-pumps', 'piping-column', 'piping-exchangers', 'piping-tanks', 'piping-above'])
  views.push({ stage: 'stage5', name: `piping-${v.replace('piping-', '')}`, caption: `Plant piping, ${v.replace('piping-', '')} view`, make: () => ({ ds: [...plantCut(), ...pipingDrawables(P())], cam: cams[v]() }) });
views.push({ stage: 'stage6', name: 'piping-line-classes', caption: 'Plant piping coloured by line class (SW-LC-1)', make: () => ({ ds: [...plantCut(), ...pipingDrawables(P(), { lineColour: byLineClass })], cam: cams['line-classes']() }) });
views.push({ stage: 'stage6', name: 'piping-line-3-P300-P-1015', caption: 'Line 3"-P300-P-1015 highlighted', make: () => {
  const l = P().lines.find(x => x.no === '3"-P300-P-1015')!, mark = new Map([...l.comps.map(c => c.tag), ...l.welds.map(w => w.id), ...l.supports.map(s => s.id)].map(t => [t, HIGHLIGHT] as const));
  const ds = [...plantCut(), ...pipingDrawables(P(), { mark })], [mn, mx] = bounds(pipingDrawables(P(), { only: x => x.no === l.no }));
  const c = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2] as [number, number, number], r = Math.max(120, Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) * 0.6);
  return { ds, cam: { eye: [c[0] + r * 0.6, Math.min(c[1] + r * 0.45, 330), c[2] + r * 0.7], target: c } };
} });
for (const num of ['WO-400-05', 'WO-200-01', 'WO-500-02']) views.push({ stage: 'stage7', name: `wo-${num}`, caption: `Work order ${num}: affected items orange, isolations blue`, make: () => {
  const wo = JSON.parse(readFileSync(`public/workorders/${num}.json`, 'utf8')) as WorkOrder;
  const mark = new Map<string, [number, number, number]>([...wo.isolations.filter(i => ['valve', 'blind', 'removal'].includes(i.kind)).map(i => [i.tag, ISOLATION] as const), ...wo.items.map(t => [t, HIGHLIGHT] as const)]);
  const eq = I().equipment.filter(e => wo.items.includes(e.tag));
  const ds = [...plantCut(), ...pipingDrawables(P(), { mark }), ...partDrawables(eq, () => HIGHLIGHT)];
  const hit = [...pipingDrawables(P(), { only: l => wo.lines.includes(l.no) }).filter((_, i) => true)];
  const pts = [...wo.items.flatMap(t => { const it = P().lines.flatMap(l => [...l.comps.map(c => ({ t: c.tag, p: c.a })), ...l.welds.map(w => ({ t: w.id, p: [w.T[12], w.T[13], w.T[14]] }))]).find(x => x.t === t); return it ? [it.p] : []; }), ...eq.map(e => [e.transform[12], e.transform[13], e.transform[14]])];
  const [mn, mx] = pts.length ? [[0, 1, 2].map(k => Math.min(...pts.map(p => p[k]))), [0, 1, 2].map(k => Math.max(...pts.map(p => p[k])))] as [number[], number[]] : bounds(hit);
  const c = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2] as [number, number, number], r = Math.max(150, Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) * 0.9);
  return { ds, cam: { eye: [c[0] + r * 0.6, Math.min(c[1] + r * 0.5, 340), c[2] + r * 0.75], target: c } };
} });

const index: string[] = ['# Review images', '', 'Rendered by SmartWeld\'s own renderer (`tools/render-views.ts`, DESIGN_BASIS.md §56, SW-REN-1..3) from the model\'s mesh data; no browser or third-party renderer was used. 3D model only (the viewer\'s side panels are not drawn).', '', '| Image | View |', '|---|---|'];
for (const v of views) {
  if (filter && !v.name.includes(filter)) continue;
  index.push(`| \`${v.stage}/${v.name}.png\` | ${v.caption} |`);
  if (process.env.RENDER_SKIP_EXISTING && existsSync(`${out}/${v.stage}/${v.name}.png`)) continue;
  const t0 = Date.now(), { ds, cam, cut } = v.make(), big = ds.length > 2000;
  mkdirSync(`${out}/${v.stage}`, { recursive: true });
  writeFileSync(`${out}/${v.stage}/${v.name}.png`, render3d(ds, cam, big ? 1400 : 1000, big ? 900 : 700, big ? 2 : 3, cut));
  console.log(`${v.stage}/${v.name} ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
if (!filter || 'pack'.includes(filter)) {
  // stage 8: pages of a work-order pack (SW-REN-2), with the owner's drawings and what matching them found
  const font = parseFont(new Uint8Array(readFileSync('assets/fonts/DejaVuSans.ttf')));
  const lines = readdirSync('public/groundtruth/lines').map(f => JSON.parse(readFileSync(`public/groundtruth/lines/${f}`, 'utf8')) as GTLine);
  const order = new Map(P().lines.map((l, i) => [l.no, i] as const)); lines.sort((a, b) => order.get(a.header.line)! - order.get(b.header.line)!);
  const gt = { lines, classes: JSON.parse(readFileSync('public/groundtruth/line-classes.json', 'utf8')), nozzles: [] } as GroundTruth;
  const eq = JSON.parse(readFileSync('public/groundtruth/equipment.json', 'utf8')) as GTEquipment[];
  const imp = JSON.parse(readFileSync('public/isometrics-imported/index.json', 'utf8')) as ImportedIndex;
  const wos = buildWorkOrders(P(), gt, eq); linkImported(wos, imp);
  const w = wos.find(x => x.number === 'WO-400-05')!;
  const doc = packDoc(font, w.number, woSections(w, woIsometrics(w, new Map(lines.map(l => [l.header.line, l] as const))), imp), { demo: DEMO_NOTICE, font: readFileSync('assets/fonts/DejaVuSans-LICENSE.txt', 'utf8') });
  mkdirSync(`${out}/stage8`, { recursive: true });
  for (const [k, what] of [[1, 'cover, with the owner\'s drawings and their findings'], [4, 'inspection and test plan'], [5, 'isometric with the work clouded']] as const) {
    writeFileSync(`${out}/stage8/pack-WO-400-05-page${k}.png`, pagePng(font, doc.pages[k - 1], doc.W, doc.H, 110));
    index.push(`| \`stage8/pack-WO-400-05-page${k}.png\` | Work-order pack WO-400-05, page ${k}: ${what} (page preview of the PDF, SW-REN-2) |`);
  }
}
if (!filter) {
  // the valve contact sheets for the IP review (IP_REVIEW.md §4), from the renders above
  const font = parseFont(new Uint8Array(readFileSync('assets/fonts/DejaVuSans.ttf')));
  const valves = views.filter(v => v.stage === 'stage4' && v.name.startsWith('valve-'));
  const half = Math.ceil(valves.length / 2);
  [valves.slice(0, half), valves.slice(half)].forEach((vs, i) => {
    writeFileSync(`${out}/stage4/sheet-${i + 1}.png`, contactSheet(font, vs.map(v => ({ label: v.caption.replace(/^Valve /, ''), png: new Uint8Array(readFileSync(`${out}/stage4/${v.name}.png`)) }))));
    index.push(`| \`stage4/sheet-${i + 1}.png\` | Valve contact sheet ${i + 1} of 2 (the renders above, tiled and labelled with DejaVu Sans) |`);
  });
  writeFileSync(`${out}/INDEX.md`, index.join('\n') + '\n');
}
