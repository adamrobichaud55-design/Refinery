/**
 * Plant piping in the viewer: loads the committed plant data (public/plant-piping.json, written by
 * `npm run gen:piping`), rebuilds every part from its key, and draws repeated parts as GPU instances.
 * Level of detail in these whole-plant views (dimensions are the same; only the faceting changes):
 *  - valves within 40 ft of the eye are tessellated on a 40-cell marching grid, farther ones on 18 cells;
 *  - tees are drawn as their run and branch pipes meeting at a sharp crotch (the catalogue view shows the
 *    blended casting, whose thin wall needs a very fine grid).
 */
import { importedFor, type ImportedIndex } from '../generator/imported';
import * as THREE from 'three';
import { partFromKey, solidBoxes, type PipingModel, type Comp, type LineRun } from '../generator/piping';
import { buildGeometry, type Role } from '../geometry/partGeometry';
import { setMaxCells } from '../geometry/sdf';
import { transformMesh, mergeMeshes, type MeshData, type Mat4 } from '../geometry/mesh';
import { pipeDims, teeC, makeValve, type ValveType, type PipeClass } from '../catalogue';
import { translate } from '../geometry/transform';
import { formatLength } from '../core/units';
import { lineFileName, plantText, type GTLine, type GTItem, type PlantPt, type GTEquipment } from '../generator/groundtruth';
import type { WorkOrder } from '../generator/workorders';
import type { PartSpec } from '../catalogue';
import { FLUID_GROUPS, classColour, type FluidGroup } from '../generator/lineclass';

let cached: Promise<PipingModel> | null = null;
export const loadPiping = (): Promise<PipingModel> => (cached ??= fetch('plant-piping.json').then((r): Promise<PipingModel> => { if (!r.ok) throw new Error('plant-piping.json not found: run npm run gen:piping'); return r.json(); }));

type Placed = { key: string; T: Mat4; scaleZ?: number; tag: string; line: string };
const NEAR_CELLS = 40, FAR_CELLS = 18, NEAR_DIST = 480;
/** every drawn item of the model as (part key, transform); pipe lengths share one unit-length template per size */
function placedItems(m: PipingModel, only?: (l: LineRun) => boolean, nozzles = !only): Placed[] {
  const out: Placed[] = [];
  const comp = (c: Comp, line: string) => {
    if (c.kind === 'pipe') { const [, n, k] = c.key.split('|'); out.push({ key: `PIPE|${n}|${k}|1.000`, T: c.T, scaleZ: Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1], c.b[2] - c.a[2]), tag: c.tag, line }); }
    else out.push({ key: c.key, T: c.T, tag: c.tag, line });
  };
  for (const l of m.lines) { if (only && !only(l)) continue; l.comps.forEach(c => comp(c, l.no)); for (const w of l.welds) out.push({ key: w.key, T: w.T, tag: w.id, line: l.no }); for (const s of l.supports) out.push({ key: s.key, T: s.T, tag: s.id, line: l.no }); }
  if (nozzles) for (const n of m.nozzles) { n.comps.forEach(c => comp(c, `nozzle:${n.id}`)); for (const w of n.welds) out.push({ key: w.key, T: w.T, tag: w.id, line: `nozzle:${n.id}` }); }
  return out;
}
const geoCache = new Map<string, { role: Role; mesh: MeshData }[]>();
function solidsOf(key: string, cells?: number) {
  const ck = cells ? `${key}@${cells}` : key;
  let g = geoCache.get(ck);
  if (!g) {
    if (key.startsWith('TEE')) g = teeLOD(key);
    else if (cells) { setMaxCells(cells); try { g = buildGeometry(makeValve(ck, ...(key.split('|').slice(1) as [ValveType, string, PipeClass]).map((v, i) => (i === 1 ? Number(v) : v)) as [ValveType, number, PipeClass])).solids.map(s => ({ role: s.role, mesh: s.mesh })); } finally { setMaxCells(110); } }
    else g = buildGeometry(partFromKey(key)).solids.map(s => ({ role: s.role, mesh: s.mesh }));
    geoCache.set(ck, g);
  }
  return g;
}
/** plant-view tee: the run pipe (2 C long) and the branch pipe (from the run axis to C) of the tee's sizes (SW-FIT-2) */
function teeLOD(key: string) {
  const [, n, k, b] = key.split('|'), NPS = Number(n), cls = k as PipeClass, C = teeC(pipeDims(NPS, cls).OD);
  const run = buildGeometry(partFromKey(`PIPE|${NPS}|${cls}|${(2 * C).toFixed(3)}`)).solids[0].mesh, br = buildGeometry(partFromKey(`PIPE|${b}|${cls}|${C.toFixed(3)}`)).solids[0].mesh;
  return [{ role: 'pipe' as Role, mesh: mergeMeshes([transformMesh(run, translate(0, 0, -C)), transformMesh(br, [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1])]) }];
}
const m4 = (T: Mat4, sz = 1) => { const M = new THREE.Matrix4().fromArray(T as number[]); if (sz !== 1) M.multiply(new THREE.Matrix4().makeScale(1, 1, sz)); return M; };

export interface PipingObject { group: THREE.Group; update: (eye: THREE.Vector3) => void }
/** the piping as a group: keys used four times or more are instanced, the rest merged by finish; valves carry a near
 *  and a far tessellation and `update(eye)` moves each valve instance to the one its distance calls for */
export function buildPipingObject(m: PipingModel, materials: Record<Role, THREE.Material>, toGeo: (m: MeshData) => THREE.BufferGeometry, only?: (l: LineRun) => boolean, material?: THREE.Material, nozzles?: boolean): PipingObject {
  const grp = new THREE.Group(), byKey = new Map<string, Placed[]>();
  for (const p of placedItems(m, only, nozzles)) { const a = byKey.get(p.key) ?? []; a.push(p); byKey.set(p.key, a); }
  const lods: { list: Placed[]; centres: THREE.Vector3[]; near: THREE.InstancedMesh[]; far: THREE.InstancedMesh[] }[] = [];
  for (const [key, list] of byKey) {
    if (key.startsWith('VLV')) {
      const mk = (cells: number) => solidsOf(key, cells).map(s => { const im = new THREE.InstancedMesh(toGeo(s.mesh), material ?? materials[s.role], list.length); im.frustumCulled = false; im.count = 0; im.name = `${key}@${cells}`; im.userData = { tags: [], lines: [] }; grp.add(im); return im; });
      lods.push({ list, centres: list.map(p => new THREE.Vector3(p.T[12], p.T[13], p.T[14])), near: mk(NEAR_CELLS), far: mk(FAR_CELLS) });
      continue;
    }
    const solids = solidsOf(key);
    for (const s of solids) {                                                       // every item is an instance, so a click can name it
      const im = new THREE.InstancedMesh(toGeo(s.mesh), material ?? materials[s.role], list.length);
      list.forEach((p, i) => im.setMatrixAt(i, m4(p.T, p.scaleZ)));
      im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.name = key; im.userData = { tags: list.map(p => p.tag), lines: list.map(p => p.line) }; grp.add(im);
    }
  }
  const mats = lods.map(L => L.list.map(p => m4(p.T)));
  const update = (eye: THREE.Vector3) => lods.forEach((L, li) => {
    let nN = 0, nF = 0;
    const tn: string[] = [], ln: string[] = [], tf: string[] = [], lf: string[] = [];
    L.list.forEach((p, i) => { const near = L.centres[i].distanceTo(eye) < NEAR_DIST; for (const im of near ? L.near : L.far) im.setMatrixAt(near ? nN : nF, mats[li][i]); if (near) { nN++; tn.push(p.tag); ln.push(p.line); } else { nF++; tf.push(p.tag); lf.push(p.line); } });
    for (const im of L.near) { im.userData = { tags: tn, lines: ln }; im.boundingSphere = null; }
    for (const im of L.far) { im.userData = { tags: tf, lines: lf }; im.boundingSphere = null; }
    for (const im of L.near) { im.count = nN; im.instanceMatrix.needsUpdate = true; }
    for (const im of L.far) { im.count = nF; im.instanceMatrix.needsUpdate = true; }
  });
  return { group: grp, update };
}

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const fmtKey = (k: string) => {
  const a = k.split('|');
  switch (a[0]) {
    case 'PIPE': return `Pipe ${a[1]}" ${a[2]}`; case 'EL': return `Elbow 90° R = 5/3 OD ${a[1]}" ${a[2]}`; case 'TEE': return `Tee ${a[1]}" × ${a[3]}" ${a[2]}`;
    case 'RED': return `Reducer ${a[1]}" × ${a[2]}" ${a[3]}`; case 'CAP': return `Cap ${a[1]}" ${a[2]}`; case 'WNF': return `Weld-neck flange ${a[1]}" ${a[2]}`;
    case 'BLIND': return `Blind flange ${a[1]}" ${a[2]}`; case 'GSK': return `Gasket ${a[1]}" ${a[2]}`; case 'STUDS': return `Stud set ${a[1]}" ${a[2]}`;
    case 'VLV': return `${a[1][0]}${a[1].slice(1).toLowerCase()} valve ${a[2]}" ${a[3]}`;
    default: return k;
  }
};
/** line inspector: a line's components (bill of materials), welds and supports — the stage-6 ground truth in table form */
export function lineReport(l: LineRun): string {
  const bom = new Map<string, { n: number; len: number }>();
  for (const c of l.comps) {
    const k = c.kind === 'pipe' ? c.key.split('|').slice(0, 3).join('|') : c.key, e = bom.get(k) ?? { n: 0, len: 0 };
    e.n++; if (c.kind === 'pipe') e.len += Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1], c.b[2] - c.a[2]); bom.set(k, e);
  }
  const pipeLen = [...bom.entries()].filter(([k]) => k.startsWith('PIPE')).reduce((s, [, e]) => s + e.len, 0);
  const shop = l.welds.filter(w => !w.field).length, field = l.welds.length - shop;
  return `<h2>${esc(l.no)}</h2>
    <div class="cat">class ${l.lineClass ?? ''} · ${l.service} · ${l.NPS}" ${l.cls} · ${l.kind} · from ${esc(l.from)} to ${esc(l.to)}${l.cv ? ' · control valve' : ''}. OD ${pipeDims(l.NPS, l.cls).OD.toFixed(3)} in, pipe ${formatLength(pipeLen)}; ${l.welds.length} butt welds (${shop} shop, ${field} field); ${l.supports.length} supports.</div>
    <h3>Bill of materials</h3><table><tr><th>Item</th><th>Qty</th><th>Length</th></tr>
    ${[...bom.entries()].map(([k, e]) => `<tr><td>${esc(fmtKey(k))}</td><td class="v">${e.n}</td><td class="v">${e.len ? formatLength(e.len) : ''}</td></tr>`).join('')}</table>
    <h3>Welds (SW-PW-3)</h3><table><tr><th>Id</th><th>Size</th><th>Joins</th><th></th></tr>
    ${l.welds.map(w => `<tr><td>${esc(w.id.split('/').pop()!)}</td><td class="v">${w.size.toFixed(3)}</td><td>${esc(w.joins.map(j => j.replace(l.no + '/', '')).join(' + '))}</td><td>${w.field ? 'field' : 'shop'}</td></tr>`).join('')}</table>
    <h3>Supports</h3><table><tr><th>Id</th><th>Type</th><th>At (in)</th></tr>
    ${l.supports.map(s => `<tr><td>${esc(s.id.split('/').pop()!)}</td><td>${s.type}</td><td class="v">${s.at.map(v => v.toFixed(0)).join(', ')}</td></tr>`).join('')}</table>`;
}
export function plantSummary(m: PipingModel): string {
  const lines = m.lines, by = new Map<string, number>(); for (const l of lines) by.set(l.service, (by.get(l.service) ?? 0) + 1);
  const comps = lines.flatMap(l => l.comps), valves = comps.filter(c => c.kind === 'valve'), vt = new Map<string, number>(); for (const v of valves) { const t = v.key.split('|')[1]; vt.set(t, (vt.get(t) ?? 0) + 1); }
  const pipeLen = comps.filter(c => c.kind === 'pipe').reduce((s, c) => s + Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1], c.b[2] - c.a[2]), 0);
  const welds = lines.flatMap(l => l.welds), sup = lines.flatMap(l => l.supports), st = new Map<string, number>(); for (const s of sup) st.set(s.type, (st.get(s.type) ?? 0) + 1);
  return `<p class="notes"><b>Piping (stage 5):</b> ${lines.length} lines (${lines.filter(l => l.kind === 'routed').length} routed, ${lines.filter(l => l.kind === 'header').length} rack headers, ${lines.filter(l => l.kind === 'stub').length} stubs), ${formatLength(pipeLen)} of pipe, ${comps.filter(c => c.kind === 'elbow').length} elbows, ${comps.filter(c => c.kind === 'tee').length} tees, ${valves.length} valves (${[...vt.entries()].map(([t, n]) => `${t.toLowerCase()} ${n}`).join(', ')}), ${welds.length} butt welds (${welds.filter(w => w.field).length} field), ${sup.length} supports (${[...st.entries()].map(([t, n]) => `${t} ${n}`).join(', ')}). Routing failures: ${m.failures.length}.</p>
    <p class="notes">By service: ${[...by.entries()].map(([s, n]) => `${s} ${n}`).join(' · ')}</p>`;
}

// ---- picking and item metadata (stage 6) --------------------------------------------------------------------
/** the item under a ray hit: its tag and line (from the instance it hit) */
export function pickedItem(hit: THREE.Intersection): { tag: string; line: string } | null {
  const o = hit.object as THREE.InstancedMesh, ud = o.userData as { tags?: string[]; lines?: string[] };
  if (!ud?.tags || hit.instanceId === undefined || !ud.tags[hit.instanceId]) return null;
  return { tag: ud.tags[hit.instanceId], line: ud.lines![hit.instanceId] };
}
const gtCache = new Map<string, Promise<GTLine | GTItem[]>>();
const loadGT = (path: string) => { let p = gtCache.get(path); if (!p) { p = fetch(`groundtruth/${path}`).then(r => { if (!r.ok) throw new Error(`ground truth ${path} not found: run npm run export:gt`); return r.json(); }); gtCache.set(path, p); } return p; };
/** the metadata record of a picked item, from the committed ground-truth export (SW-GT-1) */
export async function itemRecord(sel: { tag: string; line: string }): Promise<{ rec: Record<string, unknown>; header?: GTLine['header'] } | null> {
  if (sel.line.startsWith('nozzle:')) { const all = await loadGT('nozzles.json') as GTItem[]; const r = all.find(x => x.tag === sel.tag); return r ? { rec: r as unknown as Record<string, unknown> } : null; }
  const l = await loadGT(`lines/${lineFileName(sel.line)}`) as GTLine;
  const r = [...l.items, ...l.welds, ...l.supports].find(x => x.tag === sel.tag);
  return r ? { rec: r as unknown as Record<string, unknown>, header: l.header } : null;
}
const pt = (q: unknown) => { const p = q as PlantPt; return plantText(p); };
export function itemReport(rec: Record<string, unknown>, header?: GTLine['header']): string {
  const rows: [string, string][] = [];
  const add = (k: string, v: unknown) => { if (v === undefined || v === null || v === '') return; rows.push([k, typeof v === 'number' ? String(Math.round(v * 1000) / 1000) : Array.isArray(v) ? v.join(', ') : String(v)]); };
  add('Tag', rec.tag); add('Line', rec.line); add('Line class', rec.lineClass); add('Kind', rec.kind ?? rec.type); add('Item no.', rec.itemNo); add('Description', rec.description); add('Designation', rec.designation);
  add('Size', rec.NPS !== undefined ? `${rec.NPS}"${rec.NPS2 !== undefined ? ` × ${rec.NPS2}"` : ''}` : undefined); add('Pressure class', rec.cls); add('Material', rec.material); add('Ends', rec.ends);
  if (rec.cutLength !== undefined) add('Cut length', formatLength(rec.cutLength as number));
  add('Weight (lb)', rec.weight); add('Spool', rec.spool); if (rec.shopField) { add('Shop / field', rec.shopField); add('Weld size (in)', rec.size); add('Joins', (rec.joins as string[]).map(j => j.replace(`${rec.line}/`, ''))); add('Spools joined', rec.spools); }
  if (rec.a) { add('End A', pt(rec.a)); add('End B', pt(rec.b)); add('Centre', pt(rec.centre)); } if (rec.at) add('At', pt(rec.at));
  add('Part key', rec.key); add('Rules', rec.rules);
  const head = header ? `<div class="cat">${esc(header.line)} · class ${header.lineClass} (${esc(header.fluid)}${header.insulated ? ', insulated' : ''}) · ${esc(header.flow)}</div>` : '';
  return `<h2>${esc(String(rec.description ?? rec.tag))}</h2>${head}<table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>`;
}
/** the picked item drawn on top in the highlight finish */
export function itemHighlight(m: PipingModel, tag: string, mat: THREE.Material, toGeo: (m: MeshData) => THREE.BufferGeometry): THREE.Object3D | null {
  for (const l of m.lines) for (const it of [...l.comps.map(c => ({ key: c.kind === 'pipe' ? c.key.split('|').slice(0, 3).join('|') + '|1.000' : c.key, T: c.T, tag: c.tag, sz: c.kind === 'pipe' ? Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1], c.b[2] - c.a[2]) : 1 })), ...l.welds.map(w => ({ key: w.key, T: w.T, tag: w.id, sz: 1 })), ...l.supports.map(s => ({ key: s.key, T: s.T, tag: s.id, sz: 1 }))])
    if (it.tag === tag) { const g = new THREE.Group(); for (const s of solidsOf(it.key, it.key.startsWith('VLV') ? NEAR_CELLS : undefined)) { const mesh = new THREE.Mesh(toGeo(s.mesh), mat); mesh.matrixAutoUpdate = false; mesh.matrix.copy(m4(it.T, it.sz)); g.add(mesh); } return g; }
  return null;
}
/** line-class legend (SW-LC-1; colours are display only) */
export function classLegend(m: PipingModel): string {
  const by = new Map<string, number>(); for (const l of m.lines) by.set(l.lineClass!, (by.get(l.lineClass!) ?? 0) + 1);
  return `<h3>Line classes</h3><table>${[...by.entries()].sort().map(([c, n]) => { const g = FLUID_GROUPS[c[0] as FluidGroup]; return `<tr><td><label><input type="checkbox" class="lcbox" data-class="${c}" checked> <span style="display:inline-block;width:12px;height:12px;background:#${classColour(c).toString(16).padStart(6, '0')};vertical-align:middle"></span> <b>${c}</b></label></td><td>${esc(g.name)}, ${c.slice(1)} psi${g.insulated ? ', insulated' : ''}</td><td class="v">${n} lines</td></tr>`; }).join('')}</table>`;
}

// ---- equipment picking and metadata (SW-GT-7) --------------------------------------------------------------------
/** invisible boxes over each equipment solid, so a click on a pump, tank or vessel can name it */
export function equipmentPickGroup(equipment: { tag: string; part: PartSpec; transform: Mat4 }[]): THREE.Group {
  const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ visible: false });
  for (const e of equipment) for (const b of solidBoxes(e.part)) {
    const size = new THREE.Vector3(b[1][0] - b[0][0], b[1][1] - b[0][1], b[1][2] - b[0][2]), ctr = new THREE.Vector3((b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2, (b[0][2] + b[1][2]) / 2);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(Math.max(size.x, 0.5), Math.max(size.y, 0.5), Math.max(size.z, 0.5)), mat);
    mesh.matrixAutoUpdate = false; mesh.matrix.copy(new THREE.Matrix4().fromArray(e.transform as number[]).multiply(new THREE.Matrix4().makeTranslation(ctr.x, ctr.y, ctr.z)));
    mesh.userData = { equipment: e.tag }; g.add(mesh);
  }
  return g;
}
let eqCache: Promise<GTEquipment[]> | null = null;
export const loadEquipment = (): Promise<GTEquipment[]> => (eqCache ??= fetch('groundtruth/equipment.json').then(r => r.json()));
export function equipmentReport(e: GTEquipment): string {
  return `<h2>${esc(e.tag)} — ${esc(e.type)}</h2><div class="cat">${esc(e.description)} · area ${esc(e.area)} ${esc(e.areaName)} · ${esc(e.material)} · ${Math.round(e.weight).toLocaleString('en-US')} lb empty · origin ${esc(plantText(e.origin))}</div>
    <table>${e.dims.map(d => `<tr><td>${esc(d.label)}</td><td class="v">${esc(d.unit === 'in' ? formatLength(d.value) : `${Math.round(d.value * 1000) / 1000} ${d.unit}`)}</td><td>${esc(d.basis)}</td></tr>`).join('')}</table>
    <h3>Nozzles</h3><table><tr><th>Nozzle</th><th>Service</th><th>Size</th><th>Line</th><th>Class</th></tr>${e.nozzles.map(n => `<tr><td>${esc(n.id)}</td><td>${esc(n.service)}</td><td>${n.NPS}" ${n.cls}</td><td>${esc(n.line ?? '—')}</td><td>${esc(n.lineClass ?? '')}</td></tr>`).join('')}</table>`;
}

// ---- the owner's imported isometric drawings (stage 8, SW-IMP-6) ------------------------------------------------------
let impIdx: Promise<ImportedIndex | null> | null = null;
export const loadImported = () => (impIdx ??= fetch('isometrics-imported/index.json').then(r => (r.ok ? r.json() : null)).catch(() => null));
/** the drawing that shows a line, the weld's label and sheet on it, and what matching it to the model found */
export function importedBlock(idx: ImportedIndex, line: string, tag?: string): string {
  const r = importedFor(idx, line); if (!r) return '';
  const d = idx.drawings[r.drawing], w = tag ? idx.welds[tag] : undefined;
  const fs = d.findings.filter(f => f.level !== 'info'), mine = tag ? fs.filter(f => f.message.includes(tag)) : fs;
  return `<h3>Owner's isometric drawing</h3><p class="notes"><a href="isometrics-imported/${esc(d.file)}" target="_blank"><b>${esc(r.drawing)}</b></a> — ${d.sheets} sheet${d.sheets > 1 ? 's' : ''}${r.branchOf ? `, drawn on the sheets of ${esc(r.branchOf)}` : ''}.
    ${w ? `This weld: <b>${esc(w.label)}</b>${w.sheet ? ` on sheet ${w.sheet}` : ''}${w.labelled.length ? '' : ' (not labelled on the drawing)'}.` : ''}
    Match to the model: ${fs.length ? `${r.errors} error(s), ${r.warnings} warning(s)` : 'agrees'}.</p>
    ${mine.length ? `<details${tag ? ' open' : ''}><summary>${tag ? 'Findings for this item' : 'Findings'} (${mine.length})</summary><ul class="notes">${mine.map(f => `<li><b>${f.level}</b> ${esc(f.message)}</li>`).join('')}</ul></details>` : ''}`;
}

// ---- work orders (stage 7) -------------------------------------------------------------------------------------------
export interface WOIndexEntry { number: string; title: string; area: string; areaName: string; type: string; typeName: string; priority: number; equipment: string | null; lines: string[]; pdf: string; pack: string }
let woIdx: Promise<{ notice: string; workOrders: WOIndexEntry[] }> | null = null;
export const loadWOIndex = () => (woIdx ??= fetch('workorders/index.json').then(r => r.json()));
export const loadWO = (n: string): Promise<WorkOrder> => fetch(`workorders/${n}.json`).then(r => r.json());
type Status = 'open' | 'accepted' | 'rejected' | 'n/a';
export interface Completion { workOrder: string; updated: string; activities: { step: number; status: Status; contractor: string; owner: string; thirdParty: string; date: string; remark: string }[] }
const key = (n: string) => `smartweld-wo-completion:${n}`;
export function loadCompletion(wo: WorkOrder): Completion {
  try { const c = JSON.parse(localStorage.getItem(key(wo.number)) ?? 'null') as Completion | null; if (c && c.activities.length === wo.itp.length) return c; } catch { /* fresh record */ }
  return { workOrder: wo.number, updated: '', activities: wo.itp.map(a => ({ step: a.step, status: 'open', contractor: '', owner: '', thirdParty: '', date: '', remark: '' })) };
}
export const saveCompletion = (c: Completion) => { c.updated = new Date().toISOString(); localStorage.setItem(key(c.workOrder), JSON.stringify(c)); };
/** SW-ITP-3: complete when every activity is accepted or not applicable */
export const progress = (c: Completion) => ({ done: c.activities.filter(a => a.status === 'accepted' || a.status === 'n/a').length, total: c.activities.length, rejected: c.activities.filter(a => a.status === 'rejected').length });
export function woReport(wo: WorkOrder, c: Completion): string {
  const p = progress(c), iso = (ln: string) => `isometrics/ISO-${lineFileName(ln).replace(/\.json$/, '.svg')}`;
  const opt = (v: Status, cur: Status) => `<option value="${v}"${v === cur ? ' selected' : ''}>${v}</option>`;
  return `<div class="demo-note">${esc(wo.notice)}</div><h2>${esc(wo.number)} — ${esc(wo.title)}</h2>
    <div class="cat">${esc(wo.area)} ${esc(wo.areaName)} · ${esc(wo.typeName)} · priority ${wo.priority} · ${esc(wo.issuedBy)}</div>
    <p><a href="workorders/${esc(wo.number)}.html" target="_blank">Work order pack (HTML)</a> · <a href="workorders/pdf/${esc(wo.number)}.pdf" target="_blank">PDF</a> · ${wo.lines.map(l => `<a href="${iso(l)}" target="_blank">ISO-${esc(l)}</a>`).join(' · ')}${wo.importedIsometrics?.length ? ` · owner's drawings: ${wo.importedIsometrics.map(r => `<a href="isometrics-imported/${esc(r.file)}" target="_blank">${esc(r.drawing)}</a>`).join(' · ')}` : ''}</p>
    <p class="notes"><b>Primary asset:</b> <a href="#" class="asset" data-tag="${esc(wo.primaryAsset.tag)}" data-kind="${wo.primaryAsset.kind}" data-line="${esc(wo.primaryAsset.line ?? '')}">${esc(wo.primaryAsset.tag)}</a> — ${esc(wo.primaryAsset.description)} — ${esc(plantText(wo.primaryAsset.at))}</p>
    <p class="notes"><b>Reason:</b> ${esc(wo.reason)}</p><ol class="notes">${wo.scope.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
    <p class="notes">Orange: affected items · blue: isolation valves and blinds. ${wo.isolations.length} isolations, ${wo.newWelds.length} new welds${wo.weldSpecs.length ? ` (${wo.weldSpecs.join(', ')})` : ''}, ${wo.tmls.length} TMLs${wo.test ? `, test: ${esc(wo.test.kind)}${wo.test.pressure ? ` at ${Math.round(wo.test.pressure)} psi` : ''}` : ''}.</p>
    <details><summary><b>Assets in the plant (${wo.assets.length})</b> — click a tag to find it in the 3D model</summary><table>${wo.assets.map(x => `<tr><td><a href="#" class="asset" data-tag="${esc(x.tag)}" data-kind="${x.kind}" data-line="${esc(x.line ?? '')}">${esc(x.tag)}</a></td><td>${esc(x.kind)}</td><td>${esc(x.description)}</td></tr>`).join('')}</table></details>
    <h3>ITP — completion ${p.done} of ${p.total}${p.rejected ? `, ${p.rejected} rejected` : ''}${p.done === p.total ? ' — COMPLETE' : ''}</h3>
    <div class="legend">H hold · W witness · R review · S surveillance. Enter status, initials and date as each activity is signed; saved in this browser.</div>
    <table class="itp"><tr><th>#</th><th>Activity</th><th>C/O/3P</th><th>Status</th><th>Contr.</th><th>Owner</th><th>3rd</th><th>Date</th><th>Remark</th></tr>
    ${wo.itp.map((a, i) => { const r = c.activities[i]; return `<tr><td>${a.step}</td><td title="${esc(a.reference)} — ${esc(a.acceptance)} — record: ${esc(a.record)}">${esc(a.activity)}</td><td>${a.contractor}/${a.owner}/${a.thirdParty}</td>
      <td><select data-i="${i}" data-f="status">${(['open', 'accepted', 'rejected', 'n/a'] as Status[]).map(v => opt(v, r.status)).join('')}</select></td>
      ${(['contractor', 'owner', 'thirdParty'] as const).map(f => `<td><input data-i="${i}" data-f="${f}" size="3" value="${esc(r[f])}"></td>`).join('')}
      <td><input type="date" data-i="${i}" data-f="date" value="${esc(r.date)}"></td><td><input data-i="${i}" data-f="remark" size="8" value="${esc(r.remark)}"></td></tr>`; }).join('')}</table>
    <p><button id="wo-download" type="button">Download completion record (JSON)</button> <button id="wo-reset" type="button">Clear sign-offs</button></p>`;
}
