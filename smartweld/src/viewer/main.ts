import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ENTRIES } from '../scene/catalogueList';
import { columnBaseAssembly, type Assembly } from '../scene/assemblies';
import { makePart, type PartSpec } from '../catalogue';
import { buildGeometry, profileOf } from '../geometry/partGeometry';
import { transformMesh, type MeshData } from '../geometry/mesh';
import { identity } from '../geometry/transform';
import { basisText } from '../core/basis';
import { formatLength } from '../core/units';

const viewEl = document.getElementById('view')!;
const infoEl = document.getElementById('info')!;
const errEl = document.getElementById('err')!;
const entriesEl = document.getElementById('entries')!;

// --- three.js scene ---------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
viewEl.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe9edf2);
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 5000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(60, 100, 40); scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.4); fill.position.set(-60, 30, -80); scene.add(fill);
const grid = new THREE.GridHelper(240, 20, 0x9aa3ad, 0xc9d0d8); // 240 in square, 12 in cells (SW-U-1)
scene.add(grid);
scene.add(new THREE.AxesHelper(12));
const group = new THREE.Group();
scene.add(group);

const MATERIALS = {
  steel: new THREE.MeshStandardMaterial({ color: 0x6f7b8a, metalness: 0.35, roughness: 0.55 }),
  hardware: new THREE.MeshStandardMaterial({ color: 0x3b4450, metalness: 0.5, roughness: 0.45 }),
  weld: new THREE.MeshStandardMaterial({ color: 0xc8a24a, metalness: 0.3, roughness: 0.6 }),
  grout: new THREE.MeshStandardMaterial({ color: 0xb9b4a8, roughness: 0.95 }),
};

function toBufferGeometry(m: MeshData): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(m.positions, 3));
  g.setIndex(m.indices);
  const flat = g.toNonIndexed(); // hard edges: no normal smoothing across faces
  flat.computeVertexNormals();
  return flat;
}

function resize() {
  const w = viewEl.clientWidth, h = viewEl.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

function frame(box: THREE.Box3) {
  const size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3());
  const radius = Math.max(size.length() / 2, 1);
  const dist = radius / Math.sin((camera.fov * Math.PI) / 360) * 1.1;
  camera.position.copy(centre).add(new THREE.Vector3(0.8, 0.55, 1).normalize().multiplyScalar(dist));
  camera.near = dist / 100; camera.far = dist * 20; camera.updateProjectionMatrix();
  controls.target.copy(centre); controls.update();
  grid.position.y = box.min.y - 0.01;
}
function gridAt(y: number) { grid.position.y = y; }

function showAssembly(asm: Assembly) {
  group.clear();
  const box = new THREE.Box3();
  for (const inst of asm.instances) {
    const geo = buildGeometry(inst.part);
    for (const s of geo.solids) {
      const mat = inst.part.designation === 'grout bed' ? MATERIALS.grout : MATERIALS[s.role];
      const mesh = new THREE.Mesh(toBufferGeometry(transformMesh(s.mesh, inst.transform)), mat);
      mesh.name = `${inst.part.id}:${s.name}`;
      group.add(mesh);
      box.expandByObject(mesh);
    }
  }
  frame(box);
  gridAt(0); // concrete surface
  const totals = new Map<string, { n: number; weight: number; part: PartSpec }>();
  for (const i of asm.instances) {
    const k = i.part.id; const t = totals.get(k) ?? { n: 0, weight: 0, part: i.part };
    t.n++; t.weight += i.part.weight.value; totals.set(k, t);
  }
  infoEl.innerHTML = `<h2>${asm.name}</h2><div class="cat">${asm.description}</div>
    <table><tr><th>Mark</th><th>Part</th><th>Qty</th><th>Weight</th><th>Basis of size</th></tr>
    ${[...totals.values()].map(t => `<tr><td>${t.part.id}</td><td>${t.part.designation}</td><td class="v">${t.n}</td><td class="v">${t.weight.toFixed(1)} lb</td><td>${summariseBasis(t.part)}</td></tr>`).join('')}
    </table><div class="legend">Bill of materials from the same part list that drives the 3D view.</div>`;
}

function summariseBasis(p: PartSpec): string {
  const ids = new Set<string>();
  for (const d of Object.values(p.dims)) if (d.basis.kind === 'rule') ids.add(d.basis.id);
  return ids.size ? `rules ${[...ids].join(', ')}` : 'all stated on drawing';
}

function showPart(part: PartSpec) {
  group.clear();
  const geo = buildGeometry(part);
  const box = new THREE.Box3();
  for (const s of geo.solids) {
    const mesh = new THREE.Mesh(toBufferGeometry(transformMesh(s.mesh, identity())), MATERIALS[s.role]);
    mesh.name = s.name; group.add(mesh); box.expandByObject(mesh);
  }
  frame(box);
  const rows = Object.values(part.dims).map(d => {
    const val = d.unit === 'in' ? formatLength(d.value) : `${Number(d.value.toFixed(3))} ${d.unit}`;
    return `<tr><td>${d.label}</td><td class="v">${val}</td><td class="b-${d.basis.kind}">${basisText(d.basis)}</td></tr>`;
  }).join('');
  const lengthRow = part.length ? `<tr><td>${part.length.label}</td><td class="v">${formatLength(part.length.value)}</td><td class="b-${part.length.basis.kind}">${basisText(part.length.basis)}</td></tr>` : '';
  const prof = profileOf(part);
  infoEl.innerHTML = `<h2>${part.designation}</h2><div class="cat">${part.kind} · ${part.category} · ${part.material.grade}</div>
    ${prof ? `<svg id="profile" viewBox="0 0 100 100"></svg>` : ''}
    <table><tr><th>Dimension</th><th>Value</th><th>Basis</th></tr>${rows}${lengthRow}
    <tr><td>${part.weight.label}</td><td class="v">${part.weight.value.toFixed(2)} lb</td><td class="b-${part.weight.basis.kind}">${basisText(part.weight.basis)}</td></tr></table>
    <p class="notes">${part.notes.join(' ')}</p>
    <div class="legend">Model volume ${geo.volume.toFixed(2)} in³ (${(geo.volume * 490 / 1728).toFixed(2)} lb at 490 lb/ft³).</div>`;
  if (prof) drawProfile(prof.outer, prof.inner);
}

function drawProfile(outer: { x: number; y: number }[], inner?: { x: number; y: number }[]) {
  const svg = document.getElementById('profile') as unknown as SVGSVGElement;
  const xs = outer.map(p => p.x), ys = outer.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY) * 1.1;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const sx = (x: number) => 50 + ((x - cx) / span) * 100, sy = (y: number) => 50 - ((y - cy) / span) * 100;
  const path = (poly: { x: number; y: number }[]) => poly.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`).join(' ') + ' Z';
  svg.innerHTML = `<path d="${path(outer)}${inner ? ' ' + path(inner) : ''}" fill="#9fb0c4" fill-rule="evenodd" stroke="#1b1f24" stroke-width="0.4"/>
    <text x="2" y="97" font-size="4" fill="#666">section, ${(maxX - minX).toFixed(2)} × ${(maxY - minY).toFixed(2)} in</text>`;
}

// --- list -------------------------------------------------------------------
let activeBtn: HTMLButtonElement | null = null;
function setActive(b: HTMLButtonElement | null) { activeBtn?.classList.remove('active'); activeBtn = b; b?.classList.add('active'); }
function addButton(container: HTMLElement, label: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button'); b.textContent = label;
  b.addEventListener('click', () => { setActive(b); errEl.style.display = 'none'; try { onClick(); } catch (e) { showError(e); } });
  container.appendChild(b); return b;
}
function showError(e: unknown) { errEl.textContent = String((e as Error).message ?? e); errEl.style.display = 'block'; }

const byGroup = new Map<string, HTMLElement>();
const h = document.createElement('h2'); h.textContent = 'Assemblies'; entriesEl.appendChild(h);
const asmBtn = addButton(entriesEl, 'Column base (W10x49)', () => { location.hash = 'assembly:column-base'; showAssembly(columnBaseAssembly()); });
for (const e of ENTRIES) {
  if (!byGroup.has(e.group)) { const h2 = document.createElement('h2'); h2.textContent = e.group; entriesEl.appendChild(h2); const div = document.createElement('div'); entriesEl.appendChild(div); byGroup.set(e.group, div); }
  addButton(byGroup.get(e.group)!, e.label, () => { location.hash = 'entry:' + encodeURIComponent(e.label); showPart(e.build()); });
}
document.getElementById('typed')!.addEventListener('submit', ev => {
  ev.preventDefault();
  const text = (document.getElementById('des') as HTMLInputElement).value;
  errEl.style.display = 'none';
  try { setActive(null); location.hash = 'des:' + encodeURIComponent(text); showPart(makePart(text, text, 120)); } catch (e) { showError(e); }
});

function openFromHash() {
  const hsh = decodeURIComponent(location.hash.slice(1));
  if (hsh.startsWith('entry:')) { const e = ENTRIES.find(x => x.label === hsh.slice(6)); if (e) { showPart(e.build()); return; } }
  if (hsh.startsWith('des:')) { try { showPart(makePart(hsh.slice(4), hsh.slice(4), 120)); return; } catch (e) { showError(e); } }
  if (hsh.startsWith('assembly:')) { setActive(asmBtn); showAssembly(columnBaseAssembly()); return; }
  showPart(ENTRIES[1].build());
}
resize();
openFromHash();
window.addEventListener('hashchange', () => { errEl.style.display = 'none'; try { openFromHash(); } catch (e) { showError(e); } });
(window as any).__smartweldReady = true;
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
