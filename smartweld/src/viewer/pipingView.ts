/**
 * Plant piping in the viewer: loads the committed plant data (public/plant-piping.json, written by
 * `npm run gen:piping`), rebuilds every part from its key, and draws repeated parts as GPU instances.
 * Level of detail in these whole-plant views (dimensions are the same; only the faceting changes):
 *  - valves within 40 ft of the eye are tessellated on a 40-cell marching grid, farther ones on 18 cells;
 *  - tees are drawn as their run and branch pipes meeting at a sharp crotch (the catalogue view shows the
 *    blended casting, whose thin wall needs a very fine grid).
 */
import * as THREE from 'three';
import { partFromKey, type PipingModel, type Comp, type LineRun } from '../generator/piping';
import { buildGeometry, type Role } from '../geometry/partGeometry';
import { setMaxCells } from '../geometry/sdf';
import { transformMesh, mergeMeshes, type MeshData, type Mat4 } from '../geometry/mesh';
import { pipeDims, teeC, makeValve, type ValveType, type PipeClass } from '../catalogue';
import { translate } from '../geometry/transform';
import { formatLength } from '../core/units';

let cached: Promise<PipingModel> | null = null;
export const loadPiping = (): Promise<PipingModel> => (cached ??= fetch('/plant-piping.json').then((r): Promise<PipingModel> => { if (!r.ok) throw new Error('plant-piping.json not found: run npm run gen:piping'); return r.json(); }));

type Placed = { key: string; T: Mat4; scaleZ?: number };
const NEAR_CELLS = 40, FAR_CELLS = 18, NEAR_DIST = 480;
/** every drawn item of the model as (part key, transform); pipe lengths share one unit-length template per size */
function placedItems(m: PipingModel, only?: (l: LineRun) => boolean): Placed[] {
  const out: Placed[] = [];
  const comp = (c: Comp) => {
    if (c.kind === 'pipe') { const [, n, k] = c.key.split('|'); out.push({ key: `PIPE|${n}|${k}|1.000`, T: c.T, scaleZ: Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1], c.b[2] - c.a[2]) }); }
    else out.push({ key: c.key, T: c.T });
  };
  for (const l of m.lines) { if (only && !only(l)) continue; l.comps.forEach(comp); for (const w of l.welds) out.push({ key: w.key, T: w.T }); for (const s of l.supports) out.push({ key: s.key, T: s.T }); }
  if (!only) for (const n of m.nozzles) { n.comps.forEach(comp); for (const w of n.welds) out.push({ key: w.key, T: w.T }); }
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
export function buildPipingObject(m: PipingModel, materials: Record<Role, THREE.Material>, toGeo: (m: MeshData) => THREE.BufferGeometry, only?: (l: LineRun) => boolean, material?: THREE.Material): PipingObject {
  const grp = new THREE.Group(), byKey = new Map<string, Placed[]>();
  for (const p of placedItems(m, only)) { const a = byKey.get(p.key) ?? []; a.push(p); byKey.set(p.key, a); }
  const merged = new Map<Role, MeshData[]>();
  const lods: { list: Placed[]; centres: THREE.Vector3[]; near: THREE.InstancedMesh[]; far: THREE.InstancedMesh[] }[] = [];
  for (const [key, list] of byKey) {
    if (key.startsWith('VLV')) {
      const mk = (cells: number) => solidsOf(key, cells).map(s => { const im = new THREE.InstancedMesh(toGeo(s.mesh), material ?? materials[s.role], list.length); im.frustumCulled = false; im.count = 0; im.name = `${key}@${cells}`; grp.add(im); return im; });
      lods.push({ list, centres: list.map(p => new THREE.Vector3(p.T[12], p.T[13], p.T[14])), near: mk(NEAR_CELLS), far: mk(FAR_CELLS) });
      continue;
    }
    const solids = solidsOf(key);
    if (list.length >= 4 || list[0].scaleZ !== undefined) {
      for (const s of solids) {
        const im = new THREE.InstancedMesh(toGeo(s.mesh), material ?? materials[s.role], list.length);
        list.forEach((p, i) => im.setMatrixAt(i, m4(p.T, p.scaleZ)));
        im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.name = key; grp.add(im);
      }
    } else for (const p of list) for (const s of solids) { const a = merged.get(s.role) ?? []; a.push(transformMesh(s.mesh, p.T)); merged.set(s.role, a); }
  }
  for (const [role, meshes] of merged) { const mesh = new THREE.Mesh(toGeo(mergeMeshes(meshes)), material ?? materials[role]); mesh.name = role; grp.add(mesh); }
  const mats = lods.map(L => L.list.map(p => m4(p.T)));
  const update = (eye: THREE.Vector3) => lods.forEach((L, li) => {
    let nN = 0, nF = 0;
    L.list.forEach((_, i) => { const near = L.centres[i].distanceTo(eye) < NEAR_DIST; for (const im of near ? L.near : L.far) im.setMatrixAt(near ? nN : nF, mats[li][i]); if (near) nN++; else nF++; });
    for (const im of L.near) { im.count = nN; im.instanceMatrix.needsUpdate = true; }
    for (const im of L.far) { im.count = nF; im.instanceMatrix.needsUpdate = true; }
  });
  return { group: grp, update };
}

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const fmtKey = (k: string) => {
  const a = k.split('|');
  switch (a[0]) {
    case 'PIPE': return `Pipe ${a[1]}" ${a[2]}`; case 'EL': return `Elbow 90° LR ${a[1]}" ${a[2]}`; case 'TEE': return `Tee ${a[1]}" × ${a[3]}" ${a[2]}`;
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
    <div class="cat">${l.service} · ${l.NPS}" ${l.cls} · ${l.kind} · from ${esc(l.from)} to ${esc(l.to)}${l.cv ? ' · control valve' : ''}. OD ${pipeDims(l.NPS, l.cls).OD.toFixed(3)} in, pipe ${formatLength(pipeLen)}; ${l.welds.length} butt welds (${shop} shop, ${field} field); ${l.supports.length} supports.</div>
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
