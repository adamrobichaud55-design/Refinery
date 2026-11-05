import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ENTRIES } from '../scene/catalogueList';
import { columnBaseAssembly, type Assembly } from '../scene/assemblies';
import { makePart, makeValve, VALVE_TYPES, SIZE_SERIES, CLASS_SERIES, isOffered, type PartSpec, type ValveType, type PipeClass } from '../catalogue';
import { buildGeometry, profileOf, type Role, type PartGeometry } from '../geometry/partGeometry';
import { transformMesh, mergeMeshes, signedVolume as signedVol, type MeshData, type Mat4 } from '../geometry/mesh';
import { identity } from '../geometry/transform';
import { basisText } from '../core/basis';
import { formatLength } from '../core/units';
import { generateBuilding, billOfMaterials, type BuildingModel } from '../generator/building';
import { generateInterior, type InteriorModel } from '../generator/interior';
import { loadPiping, buildPipingObject, lineReport, plantSummary, pickedItem, itemRecord, itemReport, itemHighlight, classLegend, equipmentPickGroup, loadEquipment, equipmentReport, loadWOIndex, loadWO, loadCompletion, saveCompletion, woReport, loadImported, importedBlock } from './pipingView';
import type { WorkOrder } from '../generator/workorders';
import { classColour } from '../generator/lineclass';
import { PLANTS, plantById } from '../generator/plants';
import { setPlantBase } from './pipingView';

// --- the plant shown (SW-PLANT-1/2): plant 1 or plant 2, remembered on this device ---
let plantId = 'P1'; try { plantId = localStorage.getItem('sw-plant') ?? 'P1'; } catch { /* storage may be unavailable */ }
if (!PLANTS.some(p => p.id === plantId)) plantId = 'P1';
setPlantBase(plantId);
const plantDef = () => plantById(plantId);

const viewEl = document.getElementById('view')!, infoEl = document.getElementById('info')!, errEl = document.getElementById('err')!, entriesEl = document.getElementById('entries')!;

// --- three.js scene ---------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
viewEl.appendChild(renderer.domElement);
const scene = new THREE.Scene();
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85;
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;   // soft studio reflections
scene.background = new THREE.Color(0xdfe6ee);
const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 20000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
scene.add(new THREE.HemisphereLight(0xffffff, 0x7f8a99, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.1); sun.position.set(600, 1000, 400); scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(-600, 300, -800); scene.add(fill);
const grid = new THREE.GridHelper(240, 20, 0x9aa3ad, 0xc9d0d8);
scene.add(grid);
const axes = new THREE.AxesHelper(12); scene.add(axes);
const group = new THREE.Group(); scene.add(group);
let needsRender = true;
const _add = group.add.bind(group), _clear = group.clear.bind(group);
group.add = (...o: THREE.Object3D[]) => { needsRender = true; return _add(...o); };
group.clear = () => { needsRender = true; return _clear(); };
const sectionPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0); // keeps the x < 0 half; the cut face looks toward the default camera at +x
let sectionOn = false;
function setSection(on: boolean) {
  sectionOn = on; renderer.localClippingEnabled = on; needsRender = true;
  for (const m of Object.values(MATERIALS)) { (m as THREE.Material).clippingPlanes = on ? [sectionPlane] : []; m.needsUpdate = true; }
}

const MATERIALS: Record<Role, THREE.Material> = {
  steel: new THREE.MeshStandardMaterial({ color: 0x6f7b8a, metalness: 0.35, roughness: 0.55 }),
  hardware: new THREE.MeshStandardMaterial({ color: 0x2e3238, metalness: 0.6, roughness: 0.4 }),
  weld: new THREE.MeshStandardMaterial({ color: 0xc8a24a, metalness: 0.3, roughness: 0.6 }),
  sheet: new THREE.MeshStandardMaterial({ color: 0xb8c4cf, metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide }),
  concrete: new THREE.MeshStandardMaterial({ color: 0xb9b4a8, roughness: 0.95 }),
  door: new THREE.MeshStandardMaterial({ color: 0x8a4b3c, roughness: 0.8 }),
  equipment: new THREE.MeshStandardMaterial({ color: 0x9aa7a0, metalness: 0.2, roughness: 0.6 }),
  casting: new THREE.MeshStandardMaterial({ color: 0x56606a, metalness: 0.2, roughness: 0.6, side: THREE.DoubleSide }),   // F-10 grey paint
  closure: new THREE.MeshStandardMaterial({ color: 0xa9adb2, metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide }),
  stem: new THREE.MeshStandardMaterial({ color: 0xb8bcc1, metalness: 0.9, roughness: 0.25, side: THREE.DoubleSide }),
  polymer: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9, side: THREE.DoubleSide }),
  pipe: new THREE.MeshStandardMaterial({ color: 0x6e7781, metalness: 0.35, roughness: 0.5, side: THREE.DoubleSide }),
  operator: new THREE.MeshStandardMaterial({ color: 0xb3261e, metalness: 0.1, roughness: 0.45, side: THREE.DoubleSide }),   // F-10 red handwheels and levers
};

function toBufferGeometry(m: MeshData): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(m.positions, 3));
  g.setIndex(m.indices);
  if (m.normals) { g.setAttribute('normal', new THREE.Float32BufferAttribute(m.normals, 3)); return g; }   // cast parts: exact surface normals
  if (m.indices.length / 3 > 600000) { const flat = g.toNonIndexed(); flat.computeVertexNormals(); return flat; }   // whole-plant views: flat shading for speed
  return toCreasedNormals(g.toNonIndexed(), (35 * Math.PI) / 180);   // parts: smooth curved surfaces, hard edges kept
}
let lastSize = '';
function resize() {   // only when the view's box really changed size, so a resize can never feed itself
  const w = Math.max(1, viewEl.clientWidth), h = Math.max(1, viewEl.clientHeight), k = `${w}x${h}`;
  if (k === lastSize) return; lastSize = k;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); needsRender = true;
}
window.addEventListener('resize', resize);
if ('ResizeObserver' in window) new ResizeObserver(resize).observe(viewEl);   // the phone layout changes the view's size without a window resize
function frame(box: THREE.Box3, dir = new THREE.Vector3(0.8, 0.55, 1)) {
  const size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3());
  const radius = Math.max(size.length() / 2, 1);
  const dist = radius / Math.sin((camera.fov * Math.PI) / 360) * 1.05;
  camera.position.copy(centre).add(dir.normalize().multiplyScalar(dist));
  camera.near = Math.max(0.05, dist / 500); camera.far = dist * 50; camera.updateProjectionMatrix();
  controls.target.copy(centre); controls.update();
  grid.position.y = box.min.y - 0.01;
}

// --- geometry cache & merged rendering ----------------------------------------
const geoCache = new Map<PartSpec, PartGeometry>();
const geomOf = (p: PartSpec) => { let g = geoCache.get(p); if (!g) { g = buildGeometry(p); geoCache.set(p, g); } return g; };

function renderInstances(list: { part: PartSpec; transform: Mat4 }[]): THREE.Box3 {
  group.clear(); pipingLOD = []; pipingRoot = null; pickObj = null;
  const byRole = new Map<string, MeshData[]>();                       // grouped by finish and by whether exact normals are carried
  for (const inst of list) {
    for (const s of geomOf(inst.part).solids) {
      const key = `${s.role}|${s.mesh.normals ? 'n' : 'f'}`;
      const arr = byRole.get(key) ?? []; arr.push(transformMesh(s.mesh, inst.transform)); byRole.set(key, arr);
    }
  }
  const box = new THREE.Box3();
  for (const [key, meshes] of byRole) {
    const role = key.split('|')[0] as Role;
    const mesh = new THREE.Mesh(toBufferGeometry(mergeMeshes(meshes)), MATERIALS[role]);
    mesh.name = role; group.add(mesh); box.expandByObject(mesh);
  }
  return box;
}

function summariseBasis(p: PartSpec): string {
  const ids = new Set<string>();
  for (const d of Object.values(p.dims)) if (d.basis.kind === 'rule') ids.add(d.basis.id);
  return ids.size ? `rules ${[...ids].join(', ')}` : 'all stated on drawing';
}

function showAssembly(asm: Assembly) {
  frame(renderInstances(asm.instances)); grid.position.y = 0;
  const totals = new Map<string, { n: number; weight: number; part: PartSpec }>();
  for (const i of asm.instances) { const t = totals.get(i.part.id) ?? { n: 0, weight: 0, part: i.part }; t.n++; t.weight += i.part.weight.value; totals.set(i.part.id, t); }
  infoEl.innerHTML = `<h2>${asm.name}</h2><div class="cat">${asm.description}</div>
    <table><tr><th>Mark</th><th>Part</th><th>Qty</th><th>Weight</th><th>Basis of size</th></tr>
    ${[...totals.values()].map(t => `<tr><td>${t.part.id}</td><td>${t.part.designation}</td><td class="v">${t.n}</td><td class="v">${t.weight.toFixed(1)} lb</td><td>${summariseBasis(t.part)}</td></tr>`).join('')}
    </table><div class="legend">Bill of materials from the same part list that drives the 3D view.</div>`;
}

function showPart(part: PartSpec) {
  const geo = geomOf(part);
  frame(renderInstances([{ part, transform: identity() }]), part.kind === 'VALVE' ? new THREE.Vector3(1, 0.45, 0.9) : undefined);
  (document.getElementById('section') as HTMLInputElement).checked = sectionOn;
  const rows = Object.values(part.dims).map(d => {
    const val = d.unit === 'in' ? formatLength(d.value) : `${Number(d.value.toFixed(3))} ${d.unit === 'in2' ? 'in²' : d.unit}`;
    return `<tr><td>${d.label}</td><td class="v">${val}</td><td class="b-${d.basis.kind}">${basisText(d.basis)}</td></tr>`;
  }).join('');
  const lengthRow = part.length ? `<tr><td>${part.length.label}</td><td class="v">${formatLength(part.length.value)}</td><td class="b-${part.length.basis.kind}">${basisText(part.length.basis)}</td></tr>` : '';
  const prof = profileOf(part);
  infoEl.innerHTML = `<h2>${part.designation}</h2><div class="cat">${part.kind} · ${part.category} · ${part.material.grade}</div>
    ${prof ? `<svg id="profile" viewBox="0 0 100 100"></svg>` : ''}
    <table><tr><th>Dimension</th><th>Value</th><th>Basis</th></tr>${rows}${lengthRow}
    <tr><td>${part.weight.label}</td><td class="v">${part.weight.value.toFixed(2)} lb</td><td class="b-${part.weight.basis.kind}">${basisText(part.weight.basis)}</td></tr></table>
    <p class="notes">${part.notes.join(' ')}</p>
    ${part.kind === 'VALVE' ? `<h3>Parts list (ground truth)</h3><table><tr><th>Part</th><th>Material</th><th>Volume</th></tr>${geo.solids.map(s => `<tr><td>${s.name}</td><td>${(part.extra!.solids as { name: string; material: string }[]).find(x => x.name === s.name)?.material ?? ''}</td><td class="v">${signedVol(s.mesh).toFixed(2)} in³</td></tr>`).join('')}</table>` : ''}
    <div class="legend">Model volume ${geo.volume.toFixed(2)} in³ (${(geo.volume * 490 / 1728).toFixed(2)} lb at 490 lb/ft³).</div>`;
  if (prof) drawProfile(prof.outer, prof.inner);
}
function drawProfile(outer: { x: number; y: number }[], inner?: { x: number; y: number }[]) {
  const svg = document.getElementById('profile') as unknown as SVGSVGElement;
  const xs = outer.map(p => p.x), ys = outer.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY) * 1.1, cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const sx = (x: number) => 50 + ((x - cx) / span) * 100, sy = (y: number) => 50 - ((y - cy) / span) * 100;
  const path = (poly: { x: number; y: number }[]) => poly.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`).join(' ') + ' Z';
  svg.innerHTML = `<path d="${path(outer)}${inner ? ' ' + path(inner) : ''}" fill="#9fb0c4" fill-rule="evenodd" stroke="#1b1f24" stroke-width="0.4"/>
    <text x="2" y="97" font-size="4" fill="#666">section, ${(maxX - minX).toFixed(2)} × ${(maxY - minY).toFixed(2)} in</text>`;
}

// --- building ------------------------------------------------------------------
let building: BuildingModel | null = null, interior: InteriorModel | null = null;
function showBuilding(view: string, withInterior = false, piping?: { line?: string; item?: string; wo?: string }) {
  const P = plantDef(), P2 = plantId !== 'P1';
  if (!building) building = P.building();
  if (withInterior && !interior) {
    if (!P2) interior = generateInterior();
    else { loadPiping().then(m => { if (!interior) interior = P.interior(m.cuts); showBuilding(view, withInterior, piping); }).catch(showError); return; }   // plant 2's gratings are cut where its lines pass (SW-PEN-1)
  }
  const t0 = performance.now();
  const all = withInterior ? [...building.instances, ...interior!.instances] : building.instances;
  const shown = view === 'overview' || view === 'line-classes' || view === 'wo' || (piping && view !== 'walk') ? all.filter(i => !i.tags.includes('cladding') && !i.tags.includes('trim') && !i.tags.includes('roof-sheet')) : all; // cutaway: sheets and trim hidden
  const box = renderInstances(shown);
  const dr = building.drawing, L = dr.bays * dr.bayFt * 12, W = dr.widthFt * 12;
  grid.position.y = -dr.slabIn - 0.5;
  if (P2 && camP2(view, L, W)) { /* plant 2's own view points */ }
  else if (view === 'interior') lookFrom([L * 0.75, 66, W * 0.3], [L * 0.1, 200, -W * 0.2]);
  else if (view === 'knee') lookFrom([L * 0.5 + 420, 250, W / 2 - 420], [L * 0.5, 340, W / 2 - 30]);
  else if (view === 'door') lookFrom([L * 0.1875 + 200, 70, W / 2 + 260], [L * 0.1875, 60, W / 2]);
  else if (view === 'corner') lookFrom([-240, 200, -W / 2 - 240], [L * 0.3, 150, 0]);
  else if (view === 'rack') lookFrom([120, 90, 260], [900, 200, 0]);
  else if (view === 'vessels') lookFrom([1060, 150, 180], [520, 200, 300]);
  else if (view === 'stair') lookFrom([1180, 90, 430], [820, 150, 310]);
  else if (view === 'column') lookFrom([1180, 130, -150], [820, 180, -300]);
  else if (view === 'tanks') lookFrom([880, 110, -170], [420, 150, -320]);
  else if (view === 'pumps') lookFrom([1680, 72, 140], [2000, 30, 220]);
  else if (view === 'walk') lookFrom([L * 0.55, 66, 170], [L * 0.2, 120, 300]);
  else if (view === 'piping-rack') lookFrom([300, 150, 230], [1100, 230, 0]);
  else if (view === 'piping-pumps') lookFrom([1700, 120, 40], [1990, 60, 200]);
  else if (view === 'piping-column') lookFrom([990, 330, -90], [822, 220, -300]);
  else if (view === 'piping-exchangers') lookFrom([1250, 140, 90], [1550, 80, 300]);
  else if (view === 'piping-tanks') lookFrom([110, 150, -170], [300, 90, -330]);
  else if (view === 'piping-above') lookFrom([L * 0.5, 2300, 40], [L * 0.5, 0, 0]);
  else if (view === 'line-classes') lookFrom([L * 0.62, 820, 760], [L * 0.45, 120, 0]);
  else lookFrom([L * 1.25, 900, W * 1.6], [L * 0.45, 60, 0]);
  const bom = billOfMaterials({ ...building, instances: all });
  const total = bom.reduce((s, e) => s + e.weight, 0);
  const steelCount = all.filter(i => i.part.category !== 'non-steel').length;
  const equip = interior && withInterior ? interior.equipment.map(e => `${e.tag}: ${e.part.designation} (${e.part.weight.value.toFixed(0)} lb empty)`).join('; ') : '';
  const derivedAll = withInterior ? { ...building.derived, ...interior!.derived } : building.derived;
  const notesAll = withInterior ? [...building.notes, ...interior!.notes] : building.notes;
  infoEl.innerHTML = `<h2>${P.name} — ${withInterior ? 'building and interior' : 'building shell'}</h2>
    <div class="cat">${dr.widthFt} ft × ${dr.bays * dr.bayFt} ft, eave ${dr.eaveFt} ft, slope ${dr.slopeRisePer12}:12 (drawing, SW-BLD-1). ${steelCount.toLocaleString()} steel parts, ${(total / 2000).toFixed(1)} tons. Built in ${((performance.now() - t0) / 1000).toFixed(1)} s.</div>
    <p class="notes">${notesAll.join(' ')}</p>
    ${equip ? `<p class="notes"><b>Equipment:</b> ${equip}</p>` : ''}
    <div class="legend">${piping ? 'Click any pipe, fitting, flange, valve, weld or support to see its metadata. ' : ''}Walk: double-click the 3D view, then W A S D to move, mouse to look, Esc to release.</div>
    <h3>Derived by rule</h3><table>${Object.values(derivedAll).map(d => `<tr><td>${d.label}</td><td class="v">${Number(d.value.toFixed(3))} ${d.unit}</td><td class="b-${d.basis.kind}">${basisText(d.basis)}</td></tr>`).join('')}</table>
    <h3>Bill of materials (steel, by designation × length)</h3>
    <table><tr><th>Part</th><th>Qty</th><th>Weight</th><th>Rules</th></tr>
    ${bom.map(e => `<tr><td>${e.designation}</td><td class="v">${e.qty}</td><td class="v">${e.weight.toFixed(0)} lb</td><td>${e.rules.join(', ')}</td></tr>`).join('')}
    <tr><td><b>Total</b></td><td></td><td class="v"><b>${total.toFixed(0)} lb</b></td><td></td></tr></table>`;
  if (piping) showPiping(t0, piping.line, view === 'line-classes', piping.item, piping.wo);
}
function lookFrom(eye: number[], target: number[]) {
  camera.position.set(eye[0], eye[1], eye[2]); controls.target.set(target[0], target[1], target[2]);
  camera.near = 1; camera.far = 20000; camera.updateProjectionMatrix(); controls.update(); needsRender = true;
}

/** plant 2's view points (its building is 250 × 100 ft with an outdoor area to the east) */
function camP2(view: string, L: number, W: number): boolean {
  const v: Record<string, [[number, number, number], [number, number, number]]> = {
    interior: [[L * 0.75, 66, W * 0.3], [L * 0.1, 200, -W * 0.2]], knee: [[L * 0.5 + 420, 250, W / 2 - 420], [L * 0.5, 380, W / 2 - 30]], door: [[L * 0.1875 + 200, 70, W / 2 + 260], [L * 0.1875, 60, W / 2]],
    corner: [[-240, 200, -W / 2 - 240], [L * 0.3, 150, 0]], rack: [[120, 90, 330], [900, 260, 0]], vessels: [[1100, 150, 220], [540, 200, 330]], stair: [[1200, 90, 500], [840, 150, 350]],
    column: [[1200, 130, -150], [840, 180, -330]], tanks: [[3950, 220, 760], [3380, 120, 0]], pumps: [[1720, 72, 150], [2250, 30, 246]], bins: [[1500, 220, -260], [2300, 150, -510]], walk: [[L * 0.55, 66, 180], [L * 0.2, 120, 330]],
    'piping-rack': [[300, 150, 260], [1100, 260, 0]], 'piping-pumps': [[1750, 120, 40], [2250, 60, 230]], 'piping-column': [[1010, 330, -90], [840, 220, -330]], 'piping-exchangers': [[1250, 140, 90], [1550, 80, 330]],
    'piping-tanks': [[3950, 220, 760], [3380, 120, 0]], 'piping-bins': [[1500, 260, -240], [2300, 200, -510]], 'piping-above': [[L * 0.55, 2600, 40], [L * 0.55, 0, 0]], 'line-classes': [[L * 0.7, 900, 900], [L * 0.5, 120, 0]],
    overview: [[L * 1.2, 900, W * 1.5], [L * 0.5, 60, 0]], wo: [[L * 1.2, 900, W * 1.5], [L * 0.5, 60, 0]],
  };
  const c = v[view]; if (!c) return false; lookFrom(c[0], c[1]); return true;
}

// --- plant piping (stage 5) ---------------------------------------------------------
const HIGHLIGHT = new THREE.MeshStandardMaterial({ color: 0xff8c1a, emissive: 0x7a3a00, metalness: 0.2, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide });
let pipingSeq = 0, pipingLOD: { update: (eye: THREE.Vector3) => void }[] = [];
function showPiping(t0: number, line?: string, byClass = false, item?: string, woNumber?: string) {
  const seq = ++pipingSeq;
  const note = document.createElement('p'); note.className = 'notes'; note.textContent = 'Loading plant piping…'; infoEl.prepend(note);
  loadPiping().then(m => {
    if (seq !== pipingSeq) return;
    pipingRoot = new THREE.Group(); group.add(pipingRoot); pipingLOD = [];
    if (byClass) {                                                   // SW-LC-1: each line class in its own colour (display only)
      for (const code of [...new Set(m.lines.map(l => l.lineClass!))].sort()) {
        const mat = new THREE.MeshStandardMaterial({ color: classColour(code), metalness: 0.25, roughness: 0.5, side: THREE.DoubleSide });
        const po = buildPipingObject(m, MATERIALS, toBufferGeometry, l => l.lineClass === code, mat, false); po.group.name = 'class:' + code; pipingRoot.add(po.group); pipingLOD.push(po);
      }
      const nz = buildPipingObject(m, MATERIALS, toBufferGeometry, () => false, undefined, true); pipingRoot.add(nz.group); pipingLOD.push(nz);
    } else { const po = buildPipingObject(m, MATERIALS, toBufferGeometry); pipingRoot.add(po.group); pipingLOD.push(po); }
    const sel = m.lines.find(l => l.no === line);
    if (sel) { const hl = buildPipingObject(m, MATERIALS, toBufferGeometry, l => l.no === sel.no, HIGHLIGHT); pipingRoot.add(hl.group); pipingLOD.push(hl); }
    for (const p of pipingLOD) p.update(camera.position);
    const view = decodeURIComponent(location.hash.slice(1)).split(';')[0];
    const pick = `<div class="cfg"><label>Line inspector: <select id="linesel"><option value="">— choose a line —</option>${m.lines.map(l => `<option${l.no === line ? ' selected' : ''}>${l.no}</option>`).join('')}</select></label></div>`;
    note.outerHTML = `<div id="pickinfo"></div><div id="pipinginfo">${pick}${byClass ? classLegend(m) : ''}${sel ? lineReport(sel) : ''}${plantSummary(m)}<p class="notes">Plant and piping built in ${((performance.now() - t0) / 1000).toFixed(1)} s. Valves in plant views use a coarser marching grid (same dimensions).</p></div>`;
    if (sel) loadImported().then(imp => { const el = document.querySelector('#pipinginfo h2 + .cat') ?? document.querySelector('#pipinginfo h2'); if (imp && el) el.insertAdjacentHTML('afterend', importedBlock(imp, sel.no)); });   // SW-IMP-6
    document.getElementById('linesel')!.addEventListener('change', ev => { const v = (ev.target as HTMLSelectElement).value; location.hash = `${view}${v ? ';line=' + v : ''}`; });
    for (const box of Array.from(document.querySelectorAll<HTMLInputElement>('.lcbox'))) box.addEventListener('change', () => { const o = pipingRoot?.getObjectByName('class:' + box.dataset.class); if (o) { o.visible = box.checked; needsRender = true; } });
    pipingModel = m;
    if (interior) { eqRoot = equipmentPickGroup(interior.equipment); group.add(eqRoot); }
    if (woNumber) { showWorkOrder(m, woNumber); return; }
    if (pendingEquip) { showEquipment(pendingEquip); pendingEquip = null; }
    if (item) { const l = m.lines.find(x => [...x.comps.map(c => c.tag), ...x.welds.map(w => w.id), ...x.supports.map(s2 => s2.id)].includes(item)); if (l) showItem({ tag: item, line: l.no }, true); }
    if (sel) { const b = new THREE.Box3(); for (const c of sel.comps) { b.expandByPoint(new THREE.Vector3(...c.a)); b.expandByPoint(new THREE.Vector3(...c.b)); } const ctr = b.getCenter(new THREE.Vector3()), r = Math.max(120, b.getSize(new THREE.Vector3()).length() * 0.6); lookFrom([ctr.x + r * 0.6, Math.min(ctr.y + r * 0.45, 330), ctr.z + r * 0.7], [ctr.x, ctr.y, ctr.z]); }
    if (!item) (window as any).__pipingReady = true;
  }).catch(e => { note.textContent = String(e); showError(e); });
}
// --- click a piping item to see its metadata (stage 6, SW-GT-1) -----------------------------------------------
let pendingEquip: string | null = null, eqRoot: THREE.Group | null = null, pipingRoot: THREE.Group | null = null, pipingModel: Awaited<ReturnType<typeof loadPiping>> | null = null, pickObj: THREE.Object3D | null = null;
const raycaster = new THREE.Raycaster();
function showItem(sel: { tag: string; line: string }, frameIt = false) {
  if (pickObj) { pickObj.parent?.remove(pickObj); pickObj = null; }
  if (pipingModel && pipingRoot) { pickObj = itemHighlight(pipingModel, sel.tag, HIGHLIGHT, toBufferGeometry); if (pickObj) pipingRoot.add(pickObj); needsRender = true; }
  if (frameIt && pickObj) { const b = new THREE.Box3().setFromObject(pickObj), c = b.getCenter(new THREE.Vector3()), r = Math.max(48, b.getSize(new THREE.Vector3()).length() * 2.5); lookFrom([c.x + r * 0.7, c.y + r * 0.5, c.z + r * 0.8], [c.x, c.y, c.z]); }
  Promise.all([itemRecord(sel), loadImported()]).then(([res, imp]) => {
    const el = document.getElementById('pickinfo'); if (el) el.innerHTML = res ? itemReport(res.rec, res.header) + (imp ? importedBlock(imp, sel.line, sel.tag) : '') + '<hr>' : `<p class="notes">No record for ${sel.tag}</p>`;
    (window as any).__pipingReady = true;
  }).catch(showError);
}
function showEquipment(tag: string) {
  if (pickObj) { pickObj.parent?.remove(pickObj); pickObj = null; }
  const e = interior?.equipment.find(x => x.tag === tag); if (e && pipingRoot) { pickObj = equipmentHighlight([e], HIGHLIGHT); pipingRoot.add(pickObj); needsRender = true; }
  loadEquipment().then(all => { const r = all.find(x => x.tag === tag); const el = document.getElementById('pickinfo'); if (el && r) el.innerHTML = equipmentReport(r) + '<hr>'; }).catch(showError);
}
function equipmentHighlight(list: { part: PartSpec; transform: Mat4 }[], mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  for (const e of list) for (const s of geomOf(e.part).solids) { const mesh = new THREE.Mesh(toBufferGeometry(s.mesh), mat); mesh.matrixAutoUpdate = false; mesh.matrix.fromArray(e.transform as number[]); g.add(mesh); }
  return g;
}
// --- work orders (stage 7) ------------------------------------------------------------------------------------------
const ISOLATION = new THREE.MeshStandardMaterial({ color: 0x1f6fd1, emissive: 0x0a2a55, metalness: 0.2, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide });
let woGroup: THREE.Group | null = null;
async function showWorkOrder(m: NonNullable<typeof pipingModel>, number: string) {
  const wo: WorkOrder = await loadWO(number);
  woGroup = new THREE.Group(); pipingRoot!.add(woGroup);
  const box = new THREE.Box3();
  const mark = (tag: string, mat: THREE.Material, frame = true) => { const o = itemHighlight(m, tag, mat, toBufferGeometry); if (o) { woGroup!.add(o); o.updateMatrixWorld(true); if (frame) box.expandByObject(o); } };
  for (const t of new Set(wo.items)) { const e = interior?.equipment.find(x => x.tag === t); if (e) { const o = equipmentHighlight([e], HIGHLIGHT); woGroup.add(o); o.updateMatrixWorld(true); box.expandByObject(o); } else mark(t, HIGHLIGHT); }
  for (const i of wo.isolations) if (i.kind === 'valve' || i.kind === 'blind' || i.kind === 'removal') mark(i.tag, ISOLATION, false);   // isolations can be far apart; frame the work itself
  for (const t of wo.tmls) box.expandByPoint(new THREE.Vector3(t.at.E, t.at.EL - 1200, -t.at.N));
  needsRender = true;
  if (!box.isEmpty()) { const c = box.getCenter(new THREE.Vector3()), r = Math.max(150, box.getSize(new THREE.Vector3()).length() * 0.9); lookFrom([c.x + r * 0.6, Math.min(c.y + r * 0.5, 340), c.z + r * 0.75], [c.x, c.y, c.z]); }
  const comp = loadCompletion(wo);
  const render = () => {
    let el = document.getElementById('woinfo');
    if (!el) { const pi = document.getElementById('pickinfo'); if (!pi) return; el = document.createElement('div'); el.id = 'woinfo'; pi.after(el); }   // clicked items show above the work order
    el.innerHTML = woReport(wo, comp) + '<hr>';
    el.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-i]').forEach(inp => inp.addEventListener('change', () => {
      const a = comp.activities[Number(inp.dataset.i)] as unknown as Record<string, string>; a[inp.dataset.f!] = inp.value; saveCompletion(comp); render();
    }));
    el.querySelectorAll<HTMLAnchorElement>('a.asset').forEach(link => link.addEventListener('click', ev => {   // SW-WO-7: find the asset in the 3D model
      ev.preventDefault(); const { tag, kind, line } = link.dataset as { tag: string; kind: string; line: string };
      if (kind === 'equipment' || kind === 'motor') { showEquipment(tag.replace(/-M$/, '')); return; }
      if (kind === 'nozzle') { showEquipment(tag.split('-').slice(0, 2).join('-')); return; }
      if (kind === 'structure') { const n = Number(tag.split(':')[1]); lookFrom([n + 160, 300, 260], [n, 230, 0]); return; }
      showItem({ tag, line }, true);
    }));
    document.getElementById('wo-download')!.addEventListener('click', () => {
      const json = JSON.stringify({ ...comp, title: wo.title, notice: wo.notice, itp: wo.itp.map((x, i) => ({ ...x, ...comp.activities[i] })) }, null, 1);
      try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = `${wo.number}-completion.json`; a.click(); } catch { /* downloads blocked: the record is shown below */ }
      // where downloads are blocked (a phone app or an embedded page), the record is shown to copy
      const box = document.getElementById('wo-record') as HTMLTextAreaElement; box.value = json; box.hidden = false;
      const copy = document.getElementById('wo-copy')!; copy.hidden = false;
    });
    document.getElementById('wo-copy')!.addEventListener('click', async ev => {
      const box = document.getElementById('wo-record') as HTMLTextAreaElement, btn = ev.currentTarget as HTMLButtonElement;
      try { await navigator.clipboard.writeText(box.value); btn.textContent = 'Copied'; } catch { box.select(); btn.textContent = 'Selected: copy it'; }
    });
    let armed = 0;   // clearing sign-offs takes two taps (no browser dialog: some viewers block them)
    document.getElementById('wo-reset')!.addEventListener('click', ev => {
      const btn = ev.currentTarget as HTMLButtonElement;
      if (Date.now() - armed > 4000) { armed = Date.now(); btn.textContent = 'Tap again to clear all sign-offs'; return; }
      try { localStorage.removeItem(`smartweld-wo-completion:${wo.number}`); } catch { /* storage unavailable */ }
      Object.assign(comp, loadCompletion(wo)); render();
    });
  };
  render();
  (window as any).__pipingReady = true;
}
let downXY: [number, number] | null = null;
renderer.domElement.addEventListener('pointerdown', e => { downXY = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!downXY || walking || !pipingRoot) return; const moved = Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]); downXY = null; if (moved > 4) return;
  const r = renderer.domElement.getBoundingClientRect(); raycaster.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  const hits = [...raycaster.intersectObject(pipingRoot, true), ...(eqRoot ? raycaster.intersectObject(eqRoot, true) : [])].sort((a, b) => a.distance - b.distance);
  for (const hit of hits) {
    if (hit.object.userData?.equipment) { showEquipment(hit.object.userData.equipment as string); return; }
    if (!hit.object.visible || !hit.object.parent?.visible) continue; const sel = pickedItem(hit); if (sel) { showItem(sel); return; }
  }
});

// --- first-person walk (pointer lock) --------------------------------------------
const keys = new Set<string>();
let walking = false, yaw = 0, pitch = 0;
const EYE = 66; // 5 ft 6 in eye height
renderer.domElement.addEventListener('dblclick', () => {   // walk mode needs pointer lock, which phones and some app views refuse
  if (!(building && group.children.length)) return;
  try { const p = renderer.domElement.requestPointerLock() as unknown as Promise<void> | undefined; p?.catch?.(() => {}); } catch { /* not available here */ }
});
document.addEventListener('pointerlockchange', () => {
  walking = document.pointerLockElement === renderer.domElement;
  controls.enabled = !walking;
  if (walking) { const dir = new THREE.Vector3(); camera.getWorldDirection(dir); yaw = Math.atan2(-dir.x, -dir.z); pitch = Math.asin(dir.y); camera.position.y = EYE; }
});
document.addEventListener('mousemove', e => { if (!walking) return; yaw -= e.movementX * 0.002; pitch = Math.max(-1.4, Math.min(1.4, pitch - e.movementY * 0.002)); });
document.addEventListener('keydown', e => keys.add(e.code)); document.addEventListener('keyup', e => keys.delete(e.code));
let last = performance.now();
function stepWalk() {
  const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!walking) return;
  const speed = (keys.has('ShiftLeft') ? 240 : 96) * dt; // in/s: 8 ft/s walk, 20 ft/s run
  const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)), right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  if (keys.has('KeyW')) camera.position.addScaledVector(fwd, speed); if (keys.has('KeyS')) camera.position.addScaledVector(fwd, -speed);
  if (keys.has('KeyD')) camera.position.addScaledVector(right, speed); if (keys.has('KeyA')) camera.position.addScaledVector(right, -speed);
  camera.position.y = EYE;
  camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
}

// --- list -------------------------------------------------------------------
let activeBtn: HTMLButtonElement | null = null;
function setActive(b: HTMLButtonElement | null) { activeBtn?.classList.remove('active'); activeBtn = b; b?.classList.add('active'); }
function addButton(container: HTMLElement, label: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button'); b.textContent = label;
  b.addEventListener('click', () => { setActive(b); errEl.style.display = 'none'; try { onClick(); } catch (e) { showError(e); } });
  container.appendChild(b); return b;
}
function showError(e: unknown) { errEl.textContent = String((e as Error).message ?? e); errEl.style.display = 'block'; console.error(e); }
const h = document.createElement('h2'); h.textContent = 'Building'; entriesEl.appendChild(h);
const buildingBtns: Record<string, HTMLButtonElement> = {};
for (const [label, view] of [['Shell — exterior', 'exterior'], ['Shell — corner', 'corner'], ['Shell — interior', 'interior'], ['Shell — knee close-up', 'knee'], ['Shell — personnel door', 'door']])
  buildingBtns[view] = addButton(entriesEl, label, () => { location.hash = 'building:' + view; showBuilding(view); });
// plant selector (SW-PLANT-1): switching plants reloads the data files from the plant's folder and rebuilds its steel
const plantSel = document.getElementById('plant') as HTMLSelectElement | null;
if (plantSel) {
  for (const p of PLANTS) { const o = document.createElement('option'); o.value = p.id; o.textContent = p.name; plantSel.appendChild(o); }
  plantSel.value = plantId;
  plantSel.addEventListener('change', () => { plantId = plantSel.value; try { localStorage.setItem('sw-plant', plantId); } catch { /* ignore */ } setPlantBase(plantId); building = null; interior = null; pipingModel = null; errEl.style.display = 'none'; try { openFromHash(); } catch (e) { showError(e); } });
}
const hp = document.createElement('h2'); hp.textContent = 'Plant (building + interior)'; entriesEl.appendChild(hp);
for (const [label, view] of [['Plant — walk (start)', 'walk'], ['Plant — pipe rack', 'rack'], ['Plant — vessel platforms', 'vessels'], ['Plant — stair tower', 'stair'], ['Plant — column & ladders', 'column'], ['Plant — bins & walkway (plant 2)', 'bins'], ['Plant — tanks', 'tanks'], ['Plant — pumps', 'pumps'], ['Plant — cutaway overview', 'overview']])
  buildingBtns['plant:' + view] = addButton(entriesEl, label, () => { location.hash = 'plant:' + view; showBuilding(view, true); });
const hpp = document.createElement('h2'); hpp.textContent = 'Plant piping (stage 5)'; entriesEl.appendChild(hpp);
for (const [label, view] of [['Piping — by line class', 'line-classes'], ['Piping — overview', 'overview'], ['Piping — pipe rack', 'piping-rack'], ['Piping — pumps', 'piping-pumps'], ['Piping — column', 'piping-column'], ['Piping — bins (plant 2)', 'piping-bins'], ['Piping — exchangers', 'piping-exchangers'], ['Piping — tanks', 'piping-tanks'], ['Piping — plan from above', 'piping-above'], ['Piping — walk (start)', 'walk']])
  buildingBtns['piping:' + view] = addButton(entriesEl, label, () => { location.hash = 'piping:' + view; showBuilding(view, true, {}); });
const hwo = document.createElement('h2'); hwo.textContent = 'Shutdown work orders (stage 7)'; entriesEl.appendChild(hwo);
const woList = document.createElement('div'); entriesEl.appendChild(woList);
const woBtns: Record<string, HTMLButtonElement> = {};
loadWOIndex().then(idx => {
  let area = '';
  for (const w of idx.workOrders) {
    if (w.area !== area) { area = w.area; const h = document.createElement('div'); h.className = 'sub'; h.style.marginTop = '6px'; h.textContent = `${w.area} ${w.areaName}`; woList.appendChild(h); }
    woBtns[w.number] = addButton(woList, `${w.number} ${w.title}`, () => { location.hash = 'wo:' + w.number; });
  }
  const cur = decodeURIComponent(location.hash.slice(1)); if (cur.startsWith('wo:')) setActive(woBtns[cur.slice(3)] ?? null);
}).catch(() => { woList.textContent = 'Work orders not exported (npm run export:wo).'; });
const h1 = document.createElement('h2'); h1.textContent = 'Assemblies'; entriesEl.appendChild(h1);
const asmBtn = addButton(entriesEl, 'Column base (W10x49)', () => { location.hash = 'assembly:column-base'; showAssembly(columnBaseAssembly()); });
const byGroup = new Map<string, HTMLElement>();
for (const e of ENTRIES) {
  if (!byGroup.has(e.group)) { const h2 = document.createElement('h2'); h2.textContent = e.group; entriesEl.appendChild(h2); const div = document.createElement('div'); entriesEl.appendChild(div); byGroup.set(e.group, div); }
  addButton(byGroup.get(e.group)!, e.label, () => { location.hash = 'entry:' + encodeURIComponent(e.label); showPart(e.build()); });
}
// valve configurator (SW-VLV-11 offering)
const selType = document.getElementById('vtype') as HTMLSelectElement, selSize = document.getElementById('vsize') as HTMLSelectElement, selCls = document.getElementById('vcls') as HTMLSelectElement;
for (const t of VALVE_TYPES) { const o = document.createElement('option'); o.value = t.id; o.textContent = t.name; selType.appendChild(o); }
function refreshValveSelects() {
  const t = selType.value as ValveType, size = Number(selSize.value), cls = selCls.value as PipeClass;
  selSize.innerHTML = ''; for (const n of SIZE_SERIES) if (CLASS_SERIES.some(c => isOffered(t, n, c))) { const o = document.createElement('option'); o.value = String(n); o.textContent = `${n} in`; selSize.appendChild(o); }
  if (Array.from(selSize.options).some(o => Number(o.value) === size)) selSize.value = String(size);
  selCls.innerHTML = ''; for (const c of CLASS_SERIES) if (isOffered(t, Number(selSize.value), c)) { const o = document.createElement('option'); o.value = c; o.textContent = c; selCls.appendChild(o); }
  if (Array.from(selCls.options).some(o => o.value === cls)) selCls.value = cls;
}
selType.addEventListener('change', refreshValveSelects); selSize.addEventListener('change', refreshValveSelects);
refreshValveSelects();
document.getElementById('vbuild')!.addEventListener('click', () => { const t = selType.value as ValveType, n = Number(selSize.value), c = selCls.value as PipeClass; location.hash = `valve:${t}:${n}:${c}${sectionOn ? ';section' : ''}`; try { setActive(null); showPart(makeValve(`${t}${n}-${c}`, t, n, c)); } catch (e) { showError(e); } });
document.getElementById('typed')!.addEventListener('submit', ev => {
  ev.preventDefault();
  const text = (document.getElementById('des') as HTMLInputElement).value;
  errEl.style.display = 'none';
  try { setActive(null); location.hash = 'des:' + encodeURIComponent(text); showPart(makePart(text, text, 120)); } catch (e) { showError(e); }
});
document.getElementById('section')!.addEventListener('change', ev => { setSection((ev.target as HTMLInputElement).checked); });
function openFromHash() {
  let hsh = decodeURIComponent(location.hash.slice(1));
  if (hsh.endsWith(';section')) { hsh = hsh.slice(0, -8); setSection(true); } else setSection(false);
  if (hsh.startsWith('entry:')) { const e = ENTRIES.find(x => x.label === hsh.slice(6)); if (e) { showPart(e.build()); return; } }
  if (hsh.startsWith('valve:')) { const [, t, n, c] = hsh.split(':'); selType.value = t; refreshValveSelects(); selSize.value = n; refreshValveSelects(); selCls.value = c; try { showPart(makeValve(`${t}${n}-${c}`, t as ValveType, Number(n), c as PipeClass)); return; } catch (e) { showError(e); } }
  if (hsh.startsWith('des:')) { try { showPart(makePart(hsh.slice(4), hsh.slice(4), 120)); return; } catch (e) { showError(e); } }
  if (hsh.startsWith('assembly:')) { setActive(asmBtn); showAssembly(columnBaseAssembly()); return; }
  if (hsh.startsWith('building:')) { const v = hsh.slice(9); setActive(buildingBtns[v] ?? null); showBuilding(v); return; }
  if (hsh.startsWith('wo:')) { const n = hsh.slice(3); setActive(woBtns[n] ?? null); showBuilding('wo', true, { wo: n }); return; }
  if (hsh.startsWith('piping:')) { const [v, ...opts] = hsh.slice(7).split(';'); const line = opts.find(o => o.startsWith('line='))?.slice(5), item = opts.find(o => o.startsWith('item='))?.slice(5), equip = opts.find(o => o.startsWith('equip='))?.slice(6); pendingEquip = equip ?? null; setActive(buildingBtns['piping:' + v] ?? null); showBuilding(v, true, { line, item }); return; }
  if (hsh.startsWith('plant:')) { const v = hsh.slice(6); setActive(buildingBtns['plant:' + v] ?? null); showBuilding(v, true); return; }
  showPart(ENTRIES[1].build());
}
resize();
openFromHash();
window.addEventListener('hashchange', () => { errEl.style.display = 'none'; try { openFromHash(); } catch (e) { showError(e); } });
(window as any).__smartweldReady = true;
// draw on demand: only when the view, the scene or the camera changed (whole-plant frames are heavy)
let lastEye = new THREE.Vector3(Infinity, 0, 0);
renderer.setAnimationLoop(() => {
  stepWalk(); if (!walking && controls.update()) needsRender = true;
  if (walking) needsRender = true;
  if (pipingLOD.length && camera.position.distanceTo(lastEye) > 24) { lastEye = camera.position.clone(); for (const p of pipingLOD) p.update(camera.position); needsRender = true; }   // valve detail by distance
  if (needsRender) { renderer.render(scene, camera); needsRender = false; (window as any).__frames = ((window as any).__frames ?? 0) + 1; }
});
