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
import type { PipingModel, LineRun } from '../src/generator/piping';
import { plantById } from '../src/generator/plants';
import type { WorkOrder } from '../src/generator/workorders';
import { partDrawables, pipingDrawables, keyDrawables, byLineClass, HIGHLIGHT, ISOLATION, type Drawable } from '../src/render/scene';
import { render3d, frameBox, bounds, type Camera } from '../src/render/view3d';
import { renderPhoto, type PhotoOpts } from '../src/render/photo';
import { standUp } from '../src/geometry/transform';
import { contactSheet } from '../src/render/sheet';
import { parseFont } from '../src/pdf/ttf';
import { pagePng } from '../src/render/page';
import { packDoc } from '../src/pdf/wopdf';
import { buildWorkOrders, DEMO_NOTICE } from '../src/generator/workorders';
import { linkImported } from '../src/generator/woexport';
import { woSections } from '../src/generator/wopack';
import type { GTLine, GTEquipment, GroundTruth } from '../src/generator/groundtruth';
import type { ImportedIndex } from '../src/generator/imported';

const out = process.argv[2] ?? 'screenshots', filter = process.argv[3];
type View = { stage: string; name: string; caption: string; make: () => { ds: Drawable[]; cam: Camera; cut?: { n: [number, number, number]; d: number }; photo?: PhotoOpts } };
const views: View[] = [];
const part = (stage: string, name: string, caption: string, build: () => Parameters<typeof partDrawables>[0][0]['part'], dir?: [number, number, number], section = false) =>
  views.push({ stage, name, caption, make: () => { const ds = partDrawables([{ part: build(), transform: identity() }]); const cut = section ? { n: [1, 0, 0] as [number, number, number], d: 0 } : undefined; const [mn, mx] = bounds(ds); return { ds, cam: frameBox(mn, mx, dir), cut, photo: { groundY: mn[1], cut } }; } });   // photo style (SW-REN-4..10)

// stage 1: catalogue entries and the column-base assembly
const CAT10 = new Set(['Civil', 'Vessel parts', 'Equipment', 'Exchangers', 'Towers', 'Boiler', 'Tanks', 'Piping specials', 'Structural assemblies', 'Process equipment']);   // stage 10: the civil and equipment catalogues (§65, §66)
const slug = (l: string) => l.replace(/[^A-Za-z0-9.]+/g, '-').replace(/-+$/, '');
for (const e of ENTRIES) {
  if (!CAT10.has(e.group)) { part('stage1', `entry-${slug(e.label)}`, `Catalogue entry ${e.label}`, e.build); continue; }
  // photo style (SW-REN-4..10): the item the way up it stands, on a ground plane; a civil part cut to show its bars
  const civil = e.group === 'Civil' || !!e.cut, n: [number, number, number] = e.cut ?? [0.5547, 0, 0.8321];
  const shot = (cutaway: boolean) => () => {
    const ds = partDrawables([{ part: e.build(), transform: e.up === 'y' ? identity() : standUp() }]), [mn, mx] = bounds(ds);
    return { ds, cam: frameBox(mn, mx, [0.9, 0.5, 1]), photo: { groundY: mn[1], cut: cutaway ? { n, d: (n[0] * (mn[0] + mx[0])) / 2 + (n[2] * (mn[2] + mx[2])) / 2 } : undefined } };
  };
  views.push({ stage: 'stage10', name: `cat10-${slug(e.label)}`, caption: `Catalogue entry ${e.label} (${e.group})${civil ? (e.cut ? ', cut to show the inside' : ', cut to show the bars') : ''}`, make: shot(civil) });
  if (civil) views.push({ stage: 'stage10', name: `cat10-${slug(e.label)}-whole`, caption: `Catalogue entry ${e.label} (${e.group}), ${e.cut ? 'whole' : 'as cast'}`, make: shot(false) });
}
views.push({ stage: 'stage1', name: 'assembly-column-base', caption: 'Column base assembly', make: () => { const a = columnBaseAssembly(); const ds = partDrawables(a.instances); const [mn, mx] = bounds(ds); return { ds, cam: frameBox(mn, mx), photo: { groundY: mn[1] } }; } });

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

// stage 11: the piping catalogue in the photo style: one part of every family plant 2 uses (pipe, fittings, small bore, flanges, valves, supports, sleeves)
{
  const p2 = JSON.parse(readFileSync('public/plants/P2/plant-piping.json', 'utf8')) as { lines: { comps: { key: string }[]; supports: { key: string }[]; pens?: { key: string }[] }[] };
  const famOf = (key: string) => { const t = key.split('|'); return [t[0], ...t.slice(1).filter(x => !/^P\d+$/.test(x) && (!/^[\d.]+$/.test(x) || ((t[0] === 'EL' || t[0] === 'SWEL') && (x === '45' || x === '90'))))].join('|'); };
  const fams = new Map<string, Set<string>>();
  for (const l of p2.lines) for (const c of [...l.comps, ...l.supports, ...(l.pens ?? [])]) { const f = famOf(c.key); (fams.get(f) ?? fams.set(f, new Set()).get(f)!).add(c.key); }
  const nums = (key: string) => key.split('|').filter(x => /^[\d.]+$/.test(x)).map(Number);
  for (const f of [...fams.keys()].sort()) {
    // the family's representative: the size nearest 4 in (1 in for small bore), then the length nearest 3 ft
    const key = [...fams.get(f)!].sort((a, b) => { const na = nums(a), nb = nums(b); return Math.abs(Math.log(na[0] / 4)) - Math.abs(Math.log(nb[0] / 4)) || Math.abs((na[na.length - 1] ?? 0) - 36) - Math.abs((nb[nb.length - 1] ?? 0) - 36) || a.localeCompare(b); })[0];
    views.push({ stage: 'stage11', name: `cat11-${slug(f)}`, caption: `Piping catalogue: ${f.replace(/\|/g, ' ')} (${key})`, make: () => { const ds = keyDrawables(key, identity()), [mn, mx] = bounds(ds); return { ds, cam: frameBox(mn, mx, [0.9, 0.5, 1]), photo: { groundY: mn[1] } }; } });
  }
}

// stage 12: structural steel and piping as built in plant 2, in the photo style: assemblies taken from the plant by tag or line
{
  const p2 = plantById('P2'), steel = () => [...p2.building().instances, ...p2.interior().instances];
  let m2: PipingModel | null = null; const M2 = () => (m2 ??= JSON.parse(readFileSync('public/plants/P2/plant-piping.json', 'utf8')) as PipingModel);
  // `focus` (a centre and half-size) frames a part of the assembly and keeps what stands near it
  const shoot = (name: string, caption: string, ds: () => Drawable[], dir?: [number, number, number], focus?: () => { c: [number, number, number]; r: number }, onSlab = true) => views.push({ stage: 'stage12', name: `built-${name}`, caption: `Plant 2 as built: ${caption}`, make: () => {
    let d = ds(); const f = focus?.();
    if (f) d = d.filter(q => [0, 1, 2].every(k => Math.abs(q.T[12 + k] - f.c[k]) < 4 * f.r));
    const [mn, mx] = bounds(d), lo: [number, number, number] = f ? [f.c[0] - f.r, f.c[1] - f.r, f.c[2] - f.r] : mn, hi: [number, number, number] = f ? [f.c[0] + f.r, f.c[1] + f.r, f.c[2] + f.r] : mx;
    return { ds: d, cam: frameBox(lo, hi, dir ?? [0.8, 0.5, 1]), photo: { groundY: onSlab ? Math.min(mn[1], 0) : mn[1], radius: f ? f.r * 1.8 : undefined } };
  } });
  const at = (line: string, keyPrefix: string) => () => { const c = M2().lines.find(l => l.no === line)!.comps.find(q => q.key.startsWith(keyPrefix))!; return [c.T[12], c.T[13], c.T[14]] as [number, number, number]; };
  const byTag = (pick: (t: string) => boolean) => () => partDrawables(steel().filter(i => pick(i.tags[0])));
  const first = (prefix: string) => { const t = steel().map(i => i.tags[0]).filter(x => x.startsWith(prefix)).sort()[0]; return (x: string) => x === t; };
  shoot('rack-bent', 'a pipe rack bent with its base plates, anchor rods and pedestals', () => byTag(first('rack-bent:'))());
  shoot('portal-frame', 'a portal frame of the building with its knee and ridge plates and bolts', () => byTag(first('frame:'))());
  shoot('stair-tower', 'the stair tower with its landings, treads and guardrail', byTag(t => t === 'stair' || t.startsWith('stair-landing')));
  shoot('exchanger-platform', 'an exchanger platform with grating, guardrail and posts', byTag(t => t.startsWith('E-201-platform')));
  shoot('vessel-platforms', 'the adsorbers\' platforms and bridge with their brackets and guardrail', byTag(t => t.startsWith('platform-V') || t === 'platform-bridge'));
  const lines = (pick: (l: LineRun) => boolean) => () => pipingDrawables(M2(), { only: pick, valveCells: 60 });
  shoot('control-station', 'a control valve station between block valves (line 4"-P150-CWS-3201)', lines(l => l.no === '4"-P150-CWS-3201'), [1, 0.25, 0.7], () => ({ c: at('4"-P150-CWS-3201', 'VLV|CONTROL')(), r: 55 }), false);
  shoot('pump-piping', 'pump P-201A with its suction and discharge valves', () => [...byTag(t => t === 'P-201A')(), ...lines(l => `${l.from} ${l.to}`.includes('P-201A'))()], [0.9, 0.45, 1], () => { const i = steel().find(q => q.tags[0] === 'P-201A' && q.part.kind === 'PUMP')!; return { c: [i.transform[12], i.transform[13] + 40, i.transform[14]], r: 75 }; });
  shoot('instrument-manifold', 'a socket-weld instrument stub with its four-way manifold (line 1"-P300-I-6234)', lines(l => l.no === '1"-P300-I-6234'), [1, 0.4, 0.5], undefined, false);
  shoot('hose-station', 'a threaded hose station: gate valve, plug and swage (line 1"-P150-HS-5202)', lines(l => l.no === '1"-P150-HS-5202'), [1, 0.3, 0.6], () => ({ c: at('1"-P150-HS-5202', 'VLV|GATE')(), r: 22 }), false);
  shoot('relief-valve', 'a relief valve on its nozzle with its outlet line', lines(l => l.service === 'RV' && l.no === M2().lines.find(x => x.service === 'RV')!.no), undefined, undefined, false);
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
  const eq = I().equipment.filter(e => wo.items.includes(e.tag)), eqParts = new Set(eq.map(e => e.part));
  // the equipment worked on is drawn once, in the highlight colour (not over its own grey copy)
  const ds = [...partDrawables(cutaway([...B().instances, ...I().instances]).filter(i => !eqParts.has(i.part))), ...pipingDrawables(P(), { mark }), ...partDrawables(eq, () => HIGHLIGHT)];
  const hit = [...pipingDrawables(P(), { only: l => wo.lines.includes(l.no) }).filter((_, i) => true)];
  const eqBox = eq.length ? bounds(partDrawables(eq)) : null;
  const pts = [...wo.items.flatMap(t => { const it = P().lines.flatMap(l => [...l.comps.map(c => ({ t: c.tag, p: c.a })), ...l.welds.map(w => ({ t: w.id, p: [w.T[12], w.T[13], w.T[14]] }))]).find(x => x.t === t); return it ? [it.p] : []; }), ...(eqBox ? [eqBox[0], eqBox[1]] : [])];
  const [mn, mx] = pts.length ? [[0, 1, 2].map(k => Math.min(...pts.map(p => p[k]))), [0, 1, 2].map(k => Math.max(...pts.map(p => p[k])))] as [number[], number[]] : bounds(hit);
  const c = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2] as [number, number, number], r = Math.max(150, Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) * 0.9);
  return { ds, cam: { eye: [c[0] + r * 0.6, Math.min(c[1] + r * 0.5, 340), c[2] + r * 0.75], target: c } };
} });

const index: string[] = ['# Review images', '', 'Rendered by SmartWeld\'s own renderer (`tools/render-views.ts`, DESIGN_BASIS.md §56, SW-REN-1..3) from the model\'s mesh data; no browser or third-party renderer was used. 3D model only (the viewer\'s side panels are not drawn).', '', '| Image | View |', '|---|---|'];
for (const v of views) {
  if (filter && !v.name.includes(filter)) continue;
  index.push(`| \`${v.stage}/${v.name}.png\` | ${v.caption} |`);
  if (process.env.RENDER_SKIP_EXISTING && existsSync(`${out}/${v.stage}/${v.name}.png`)) continue;
  const t0 = Date.now(), { ds, cam, cut, photo } = v.make(), big = ds.length > 2000;
  mkdirSync(`${out}/${v.stage}`, { recursive: true });
  writeFileSync(`${out}/${v.stage}/${v.name}.png`, photo ? renderPhoto(ds, cam, 1000, 700, 2, photo) : render3d(ds, cam, big ? 1400 : 1000, big ? 900 : 700, big ? 2 : 3, cut));
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
  const doc = packDoc(font, w.number, woSections(w, imp), { demo: DEMO_NOTICE, font: readFileSync('assets/fonts/DejaVuSans-LICENSE.txt', 'utf8') }, f => new Uint8Array(readFileSync(`public/isometrics-imported/${f}`)));
  mkdirSync(`${out}/stage8`, { recursive: true });
  const pageWith = (t: string) => doc.pages.findIndex(p => p.recs.some(r => r.k === 'text' && r.str.startsWith(t))) + 1;
  for (const [k, what] of [[1, 'cover, with the owner\'s drawings and their findings'], [pageWith('Inspection and test plan'), 'inspection and test plan'], [pageWith('Where the work is'), 'where the work is on the owner\'s drawings; their sheets follow, attached unchanged']] as const) {
    writeFileSync(`${out}/stage8/pack-WO-400-05-page${k}.png`, pagePng(font, doc.pages[k - 1], doc.W, doc.H, 110));
    index.push(`| \`stage8/pack-WO-400-05-page${k}.png\` | Work-order pack WO-400-05, page ${k}: ${what} (page preview of the PDF, SW-REN-2) |`);
  }
}
// contact sheets: the renders of a group, tiled and labelled; written when every tile exists and the run touched the group
{
  const font = parseFont(new Uint8Array(readFileSync('assets/fonts/DejaVuSans.ttf')));
  const sheet = (stage: string, name: string, caption: string, vs: View[], label: (v: View) => string) => {
    if (!vs.length || !vs.every(v => existsSync(`${out}/${v.stage}/${v.name}.png`)) || (filter && !vs.some(v => v.name.includes(filter)))) return;
    writeFileSync(`${out}/${stage}/${name}.png`, contactSheet(font, vs.map(v => ({ label: label(v), png: new Uint8Array(readFileSync(`${out}/${v.stage}/${v.name}.png`)) }))));
    index.push(`| \`${stage}/${name}.png\` | ${caption} (the renders above, tiled and labelled with DejaVu Sans) |`);
  };
  const entry = (v: View) => v.caption.replace(/^Catalogue entry /, '').replace(new RegExp(` \\((${[...CAT10].join('|')})\\).*$`), '');
  sheet('stage1', 'sheet-catalogue', 'Catalogue list contact sheet: structural sections, plates, hardware, welds, sheet and the first piping entries', views.filter(v => v.stage === 'stage1' && v.name.startsWith('entry-')), entry);
  const valves = views.filter(v => v.stage === 'stage4' && v.name.startsWith('valve-')), half = Math.ceil(valves.length / 2);
  [valves.slice(0, half), valves.slice(half)].forEach((vs, i) => sheet('stage4', `sheet-${i + 1}`, `Valve contact sheet ${i + 1} of 2`, vs, v => v.caption.replace(/^Valve /, '')));
  for (const g of CAT10) sheet('stage10', `sheet-${g.toLowerCase().replace(/\s+/g, '-')}`, `${g} catalogue contact sheet`, views.filter(v => v.stage === 'stage10' && ENTRIES.find(e => `cat10-${slug(e.label)}` === v.name)?.group === g), entry);
  sheet('stage12', 'sheet-as-built', 'Plant 2 as built, contact sheet', views.filter(v => v.stage === 'stage12'), v => v.caption.replace(/^Plant 2 as built: /, ''));
  const pip = views.filter(v => v.stage === 'stage11');
  for (let i = 0; i * 20 < pip.length; i++) sheet('stage11', `sheet-piping-${i + 1}`, `Piping catalogue contact sheet ${i + 1} of ${Math.ceil(pip.length / 20)}`, pip.slice(i * 20, i * 20 + 20), v => v.caption.replace(/^Piping catalogue: /, '').replace(/ \(.*\)$/, ''));
}
if (!filter) writeFileSync(`${out}/INDEX.md`, index.join('\n') + '\n');
else {   // a filtered run keeps INDEX.md complete: its rows replace or join the ones there
  const cur = existsSync(`${out}/INDEX.md`) ? readFileSync(`${out}/INDEX.md`, 'utf8').replace(/\n*$/, '').split('\n') : [];
  const idOf = (r: string) => r.slice(0, r.indexOf('|', 2));
  for (const r of index.filter(r => r.startsWith('| `'))) { const k = cur.findIndex(c => idOf(c) === idOf(r)); if (k >= 0) cur[k] = r; else cur.push(r); }
  writeFileSync(`${out}/INDEX.md`, cur.join('\n') + '\n');
}
