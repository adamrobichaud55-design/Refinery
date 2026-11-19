# Builds ONE 3D scene of a home from a phone scan, for the scroll site, the tour video and the free-roam / VR page.
#
#   python3 -I tools/scene/build_scene.py <scan-folder> <work-folder> <site-folder>/scene [--voxel 0.02] [--triangles 350000]
#           [--keys 320] [--clip <folder with the room-naming model>]
#
# The scan folder is what the Stray Scanner app records on an iPhone or iPad Pro: rgb.mp4, odometry.csv,
# camera_matrix.csv, depth/ and (optionally) confidence/.
#
# What it does (each stage keeps its results in the work folder, so a second run is quick):
#   1. Every depth picture of the scan is fused into one solid model of the home: its real shape, to about 2 cm.
#   2. The sharpest photographs, spread over every place and direction the camera went, are kept to colour that model.
#      The site projects them onto it, so the picture has the photographs' own detail while the shape stays solid
#      from any angle (which is what lets a visitor look around freely, or stand inside it in a headset).
#   3. A walking route is planned that visits each part of the home once, at eye height, looking where it is going.
#   4. The scene folder is written: mesh.glb (the model), k00.webp ... (the photographs, sixteen to a file) and
#      scene.json (where each photograph was taken, the route, and the room names along it).
#
# Needs: pip install open3d numpy pillow (and onnxruntime tokenizers for --clip); ffmpeg.
import sys, os, io, json, struct, subprocess, heapq
import numpy as np
from PIL import Image

args = sys.argv[1:]; opt = {}
for k in ('--voxel', '--triangles', '--keys', '--clip', '--cell'):
    if k in args: i = args.index(k); opt[k[2:]] = args[i + 1]; del args[i:i + 2]
if len(args) != 3: sys.exit('usage: build_scene.py <scan-folder> <work> <site>/scene [--voxel 0.02] [--triangles 350000] [--keys 320] [--clip dir]')
src, work, out = args; os.makedirs(work, exist_ok=True)
VOXEL = float(opt.get('voxel', 0.02)); TRIS = int(opt.get('triangles', 350000)); NKEYS = int(opt.get('keys', 320))
ROOMS = ['living room', 'kitchen', 'dining room', 'bedroom', 'bathroom', 'home office', 'hallway', 'staircase', 'balcony']

# ---- the scan: where the camera was for every frame ------------------------------------------------------------------
odo = np.loadtxt(os.path.join(src, 'odometry.csv'), delimiter=',', skiprows=1); K = np.loadtxt(os.path.join(src, 'camera_matrix.csv'), delimiter=','); N = len(odo)
rate = 1 / float(np.median(np.diff(odo[:, 0]))); W0, H0 = round(2 * K[0, 2] / 2) * 2, round(2 * K[1, 2] / 2) * 2
probe_ = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', os.path.join(src, 'rgb.mp4')], capture_output=True, text=True).stdout.strip().split(',')
if len(probe_) == 2: W0, H0 = int(probe_[0]), int(probe_[1])
def turn(q): qx, qy, qz, qw = q; return np.array([[1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - qz * qw), 2 * (qx * qz + qy * qw)], [2 * (qx * qy + qz * qw), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - qx * qw)], [2 * (qx * qz - qy * qw), 2 * (qy * qz + qx * qw), 1 - 2 * (qx * qx + qy * qy)]])
def depth_m(i): return np.asarray(Image.open(os.path.join(src, 'depth', f'{i:06d}.png')), np.float32) / 1000.0
# Scanning apps differ in which way the camera's own axes point (y up and z backwards, or y down and z forwards).
# The right one is the one under which two frames taken a moment apart agree about how far away things are.
def disagree(F, i, j):
    Ri, Rj = turn(odo[i, 5:9]) @ F, turn(odo[j, 5:9]) @ F; di, dj = depth_m(i), depth_m(j); hh, ww = di.shape; gy, gx = np.mgrid[2:hh:4, 2:ww:4]; z = di[gy, gx].ravel(); ok = (z > 0.3) & (z < 3.5); kx = W0 / ww
    X = np.stack([((gx.ravel() + 0.5) * kx - K[0, 2]) / K[0, 0] * z, ((gy.ravel() + 0.5) * kx - K[1, 2]) / K[1, 1] * z, z], 1)[ok] @ Ri.T + odo[i, 2:5]; Xc = (X - odo[j, 2:5]) @ Rj; m = Xc[:, 2] > 0.3
    u = (Xc[m, 0] / Xc[m, 2] * K[0, 0] + K[0, 2]) / kx; v = (Xc[m, 1] / Xc[m, 2] * K[1, 1] + K[1, 2]) / kx; inb = (u >= 1) & (u < ww - 1) & (v >= 1) & (v < hh - 1)
    if inb.sum() < 100: return 9.0
    dd = dj[v[inb].astype(int), u[inb].astype(int)]; g = (dd > 0.3) & (dd < 3.5); return float(np.median(np.abs(dd[g] - Xc[m, 2][inb][g]))) if g.sum() > 50 else 9.0
probe = [(i, min(N - 1, i + round(rate * 0.7))) for i in np.linspace(0, N - 1 - round(rate), 14).astype(int)[1:-1]]
AX = min((np.eye(3), np.diag([1.0, -1.0, -1.0])), key=lambda F: np.median([disagree(F, i, j) for i, j in probe]))
RC = np.stack([turn(q) @ AX for q in odo[:, 5:9]]); C = odo[:, 2:5].copy()                 # each frame's camera: its axes in the world (x right, y down, z forward), and where it stood
# Which way is down: people hold a camera without rolling it, so every frame's "right" lies flat.
RT = RC[:, :, 0]; w_, e_ = np.linalg.eigh(RT.T @ RT); down = e_[:, 0]; down = down if down @ RC[:, :, 1].mean(0) > 0 else -down
ax = int(np.argmax(np.abs(down)));
if abs(down[ax]) > 0.996: down = np.eye(3)[ax] * np.sign(down[ax])                              # the scan's own "down", when it has one
yy = -down; xx = np.eye(3)[(ax + 1) % 3] - (np.eye(3)[(ax + 1) % 3] @ yy) * yy; xx /= np.linalg.norm(xx); zz = np.cross(xx, yy); WORLD = np.stack([xx, yy, zz])     # the scan's world turned so that y is up, as the site wants it
print(f'{N} frames at {rate:.0f} a second; the camera travelled {float(np.sum(np.linalg.norm(np.diff(C, axis=0), axis=1))):.0f} m', flush=True)

# ---- 1. one solid model from all the depth pictures -------------------------------------------------------------------
import open3d as o3d
o3d.utility.set_verbosity_level(o3d.utility.VerbosityLevel.Error)
raw = os.path.join(work, 'fused.ply'); STEP = 3
if not os.path.exists(raw):
    small = os.path.join(work, 'small')
    if not os.path.isdir(small):
        os.makedirs(small); print('reading the video', flush=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(src, 'rgb.mp4'), '-vf', f"select='not(mod(n\\,{STEP}))',scale=256:192", '-vsync', 'vfr', '-q:v', '3', '-start_number', '0', os.path.join(small, '%06d.jpg')], check=True)
    import open3d.core as o3c
    d0 = depth_m(0); dh, dw = d0.shape; dev = o3c.Device('CPU:0'); Kt = o3c.Tensor(np.array([[K[0, 0] * dw / W0, 0, K[0, 2] * dw / W0], [0, K[1, 1] * dh / H0, K[1, 2] * dh / H0], [0, 0, 1.0]]), o3c.float64)
    vol = o3d.t.geometry.VoxelBlockGrid(attr_names=('tsdf', 'weight', 'color'), attr_dtypes=(o3c.float32, o3c.float32, o3c.float32), attr_channels=((1), (1), (3)), voxel_size=VOXEL, block_resolution=8, block_count=150000, device=dev)      # about 1.5 GB of working memory
    for n_, i in enumerate(range(0, N, STEP)):
        cf = os.path.join(small, f'{n_:06d}.jpg')
        if not os.path.exists(cf): break
        d = np.asarray(Image.open(os.path.join(src, 'depth', f'{i:06d}.png'))).astype(np.uint16).copy(); conf = os.path.join(src, 'confidence', f'{i:06d}.png')
        if os.path.exists(conf): d[np.asarray(Image.open(conf)) < 1] = 0                       # the sensor's own doubts are left out
        col = np.ascontiguousarray(np.asarray(Image.open(cf).convert('RGB').resize((dw, dh))))
        E = np.eye(4); E[:3, :3] = RC[i].T; E[:3, 3] = -RC[i].T @ C[i]; Et = o3c.Tensor(E, o3c.float64)
        dt_ = o3d.t.geometry.Image(o3c.Tensor(np.ascontiguousarray(d))).to(dev); ct_ = o3d.t.geometry.Image(o3c.Tensor(col)).to(dev)
        vol.integrate(vol.compute_unique_block_coordinates(dt_, Kt, Et, 1000.0, 4.2), dt_, ct_, Kt, Et, 1000.0, 4.2)
        if n_ % 1000 == 999: print(f'  fused {n_ + 1} of {N // STEP} depth pictures', flush=True)
    o3d.io.write_triangle_mesh(raw, vol.extract_triangle_mesh(weight_threshold=3.0).to_legacy()); del vol      # a surface counts once at least three depth pictures agree on it
mesh_file = os.path.join(work, 'model.ply')
if not os.path.exists(mesh_file):
    m = o3d.io.read_triangle_mesh(raw); print(f'the fused model has {len(m.triangles)} triangles; tidying and thinning it', flush=True)
    ids, counts, _ = m.cluster_connected_triangles(); ids = np.asarray(ids); counts = np.asarray(counts); m.remove_triangles_by_mask(counts[ids] < max(200, 0.002 * counts.max())); m.remove_unreferenced_vertices()      # specks floating in the air
    m = m.simplify_quadric_decimation(TRIS); m.remove_degenerate_triangles(); m.remove_unreferenced_vertices(); o3d.io.write_triangle_mesh(mesh_file, m)
m = o3d.io.read_triangle_mesh(mesh_file); VX = np.asarray(m.vertices) @ WORLD.T; TR = np.asarray(m.triangles).astype(np.uint32); COL = np.asarray(m.vertex_colors)
floor = float(np.percentile(VX[:, 1], 1.5)); VX[:, 1] -= floor; Cw = C @ WORLD.T; Cw[:, 1] -= floor; Rw = np.einsum('ab,nbc->nac', WORLD, RC)       # everything in the site's world: y up, the floor at 0
print(f'model: {len(TR)} triangles, {VX[:, 0].max() - VX[:, 0].min():.1f} x {VX[:, 2].max() - VX[:, 2].min():.1f} m, ceiling at about {np.percentile(VX[:, 1], 98.5):.2f} m; the camera was carried at about {np.median(Cw[:, 1]):.2f} m', flush=True)

# ---- 2. the photographs that colour it ------------------------------------------------------------------------------------
every = max(1, round(rate / 3)); cand = np.arange(0, N - 5, every); small = os.path.join(work, 'small')
def sharpness(i):
    f = os.path.join(small, f'{i // STEP:06d}.jpg')
    if not os.path.exists(f): return 0.0
    g = np.asarray(Image.open(f).convert('L'), np.float32); return float(np.var(g[1:-1, 1:-1] * 4 - g[:-2, 1:-1] - g[2:, 1:-1] - g[1:-1, :-2] - g[1:-1, 2:]))
FWD = Rw[:, :, 2]; yaw = np.degrees(np.arctan2(FWD[:, 0], FWD[:, 2])); pitch = np.degrees(np.arcsin(np.clip(FWD[:, 1], -1, 1)))
# one photograph for each place the camera stood and each way it faced there: the sharpest; then thinned evenly if there are too many
def pick(cell, turn_):
    best = {}
    for i in cand:
        key = (int(Cw[i, 0] // cell), int(Cw[i, 2] // cell), int(Cw[i, 1] // 0.5), int((yaw[i] + 180) // turn_), int((pitch[i] + 90) // 35)); s = sharpness(int(i))
        if key not in best or s > best[key][0]: best[key] = (s, int(i))
    return sorted(v[1] for v in best.values())
cell, turn_ = 0.3, 40.0; keys = pick(cell, turn_)
while len(keys) > NKEYS: cell *= 1.12; turn_ = min(60.0, turn_ * 1.05); keys = pick(cell, turn_)
kdir = os.path.join(work, 'keys'); want = os.path.join(kdir, 'frames.json')
if not os.path.exists(want) or json.load(open(want)) != keys:
    import shutil; shutil.rmtree(kdir, ignore_errors=True); os.makedirs(kdir); print(f'taking {len(keys)} photographs from the video', flush=True)
    for a in range(0, len(keys), 80):
        part = keys[a:a + 80]; sel = '+'.join(f'eq(n\\,{i})' for i in part)
        subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(src, 'rgb.mp4'), '-vf', f"select='{sel}',scale=1024:-2", '-vsync', 'vfr', '-q:v', '2', '-start_number', str(a), os.path.join(kdir, 'k%04d.jpg')], check=True)
    json.dump(keys, open(want, 'w'))

# ---- 3. a route that visits each part of the home once, at eye height, looking where it is going -------------------------
def gauss(a, sigma):
    k = int(3 * sigma) + 1; w = np.exp(-np.arange(-k, k + 1) ** 2 / (2 * sigma * sigma)); w /= w.sum(); p = np.pad(a, [(k, k)] + [(0, 0)] * (a.ndim - 1), mode='edge')
    return np.stack([np.tensordot(w, p[i:i + 2 * k + 1], axes=(0, 0)) for i in range(len(a))])
def resample(S, step):
    L = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(S, axis=0), axis=1))]); s = np.arange(0, L[-1], step); return np.stack([np.interp(s, L, S[:, k]) for k in range(S.shape[1])], 1)
P = Cw[cand]; n = len(P); D2 = np.linalg.norm(P[:, None, [0, 2]] - P[None][:, :, [0, 2]], axis=2); nb = [[] for _ in range(n)]
for i in range(n - 1): nb[i].append((i + 1, D2[i, i + 1])); nb[i + 1].append((i, D2[i, i + 1]))
for i in range(n):
    for j in np.nonzero(D2[i, i + 6:] < 0.28)[0] + i + 6: nb[i].append((int(j), D2[i, j] * 1.5 + 0.03)); nb[int(j)].append((i, D2[i, j] * 1.5 + 0.03))      # a short step between two places the camera stood: never through a wall
def reach(s0):
    dist = np.full(n, np.inf); prev = np.full(n, -1); dist[s0] = 0; heap = [(0.0, s0)]
    while heap:
        c, i = heapq.heappop(heap)
        if c > dist[i]: continue
        for j, w in nb[i]:
            if c + w < dist[j]: dist[j] = c + w; prev[j] = i; heapq.heappush(heap, (c + w, j))
    return dist, prev
CELL = float(opt.get('cell', 0.9)); cellof = [tuple(c) for c in np.floor(P[:, [0, 2]] / CELL).astype(int)]; members = {}
for i, c in enumerate(cellof): members.setdefault(c, []).append(i)
goal = {c: mm[int(np.argmin(np.linalg.norm(P[mm] - np.median(P[mm], 0), axis=1)))] for c, mm in members.items() if len(mm) >= 4}
cur = 0; order = [cur]; goal.pop(cellof[cur], None)
while goal:
    dist, prev = reach(cur); c = min(goal, key=lambda c: dist[goal[c]]); tgt = goal.pop(c)
    if not np.isfinite(dist[tgt]): continue
    path = [tgt]
    while path[-1] != cur: path.append(int(prev[path[-1]]))
    order += path[::-1][1:]; cur = tgt
    for i in path: goal.pop(cellof[i], None)
EYE = float(np.clip(np.median(Cw[:, 1]), 1.25, 1.6)); G = gauss(resample(P[order][:, [0, 2]], 0.08), 0.45 / 0.08); G = resample(G, 0.1)
ahead = np.stack([G[min(len(G) - 1, i + 12)] - G[i] for i in range(len(G))]); ahead = gauss(ahead, 9.0); ahead /= np.maximum(np.linalg.norm(ahead, axis=1, keepdims=True), 1e-6)      # looking a good step ahead, turning slowly
cams = [{'p': [round(float(g[0]), 3), round(EYE, 3), round(float(g[1]), 3)], 'd': [round(float(a[0]), 4), -0.1, round(float(a[1]), 4)]} for g, a in zip(G, ahead)]
print(f'route: {len(G) * 0.1:.0f} m through the home (the scan itself wandered for {float(np.sum(np.linalg.norm(np.diff(Cw, axis=0), axis=1))):.0f} m)', flush=True)

# ---- room names along the route (optional) --------------------------------------------------------------------------------
chapters = []
if opt.get('clip'):
    import onnxruntime as ort
    from tokenizers import Tokenizer
    ort.set_default_logger_severity(3); Cdir = opt['clip']; vs = ort.InferenceSession(os.path.join(Cdir, 'vision_model_quantized.onnx'), providers=['CPUExecutionProvider']); ts = ort.InferenceSession(os.path.join(Cdir, 'text_model_quantized.onnx'), providers=['CPUExecutionProvider'])
    tok = Tokenizer.from_file(os.path.join(Cdir, 'tokenizer.json')); ids = np.full((len(ROOMS), 77), 49407, np.int64); mask = np.zeros((len(ROOMS), 77), np.int64)
    for i, r in enumerate(ROOMS): e = tok.encode(f'a photo of a {r} in a home').ids[:77]; ids[i, :len(e)] = e; mask[i, :len(e)] = 1
    tx = ts.run(None, {i.name: (ids if 'input_ids' in i.name else mask) for i in ts.get_inputs()}); tx = next(o for o in tx if o.ndim == 2 and o.shape[0] == len(ROOMS)); tx = tx / np.linalg.norm(tx, axis=1, keepdims=True)
    CM, CS = np.array([0.4815, 0.4578, 0.4082], np.float32), np.array([0.2686, 0.2613, 0.2758], np.float32); logit = []
    for k in range(len(keys)):
        im = Image.open(os.path.join(kdir, f'k{k:04d}.jpg')).convert('RGB').resize((224, 224), Image.BICUBIC); a = (np.asarray(im, np.float32) / 255.0 - CM) / CS
        o = vs.run(None, {vs.get_inputs()[0].name: a.transpose(2, 0, 1)[None]}); e = next(x for x in o if x.ndim == 2)[0]; logit.append(100 * (tx @ (e / np.linalg.norm(e))))
    logit = np.array(logit); KP = Cw[keys]; KF = FWD[keys]; lab = []
    for g, a in zip(G, ahead):                                              # at each point of the route: what the photographs taken near it, facing its way, look like
        w = np.exp(-(np.linalg.norm(KP[:, [0, 2]] - g, axis=1) / 0.8) ** 2) * np.maximum(0, KF[:, [0, 2]] @ a) ** 2; lab.append((w[:, None] * logit).sum(0) / max(w.sum(), 1e-6))
    lab = list(np.argmax(gauss(np.array(lab), 12.0), 1)); MIN = 30; changed = True
    while changed:
        changed = False; runs = []
        for i, l in enumerate(lab):
            if runs and runs[-1][0] == l: runs[-1][2] = i + 1
            else: runs.append([l, i, i + 1])
        for j, (l, i0, i1) in enumerate(runs):
            if i1 - i0 < MIN and len(runs) > 1: lab[i0:i1] = [runs[j - 1][0] if j > 0 else runs[j + 1][0]] * (i1 - i0); changed = True; break
    chapters = [{'label': ROOMS[l], 'from': i0, 'to': i1 - 1} for l, i0, i1 in runs]

# ---- 4. the scene folder ---------------------------------------------------------------------------------------------------
os.makedirs(out, exist_ok=True)
for f in os.listdir(out):
    if f.endswith(('.webp', '.glb', '.json')): os.remove(os.path.join(out, f))
# the model, as a standard .glb file: positions, colours, triangles
pos = VX.astype(np.float32); col = np.concatenate([np.clip(COL * 255, 0, 255), np.full((len(COL), 1), 255)], 1).astype(np.uint8); idx = TR.reshape(-1).astype(np.uint32); blob = pos.tobytes() + col.tobytes() + idx.tobytes()
gl = {'asset': {'version': '2.0'}, 'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0}], 'meshes': [{'primitives': [{'attributes': {'POSITION': 0, 'COLOR_0': 1}, 'indices': 2}]}],
      'buffers': [{'byteLength': len(blob)}], 'bufferViews': [{'buffer': 0, 'byteOffset': 0, 'byteLength': pos.nbytes, 'target': 34962}, {'buffer': 0, 'byteOffset': pos.nbytes, 'byteLength': col.nbytes, 'target': 34962}, {'buffer': 0, 'byteOffset': pos.nbytes + col.nbytes, 'byteLength': idx.nbytes, 'target': 34963}],
      'accessors': [{'bufferView': 0, 'componentType': 5126, 'count': len(pos), 'type': 'VEC3', 'min': [float(x) for x in pos.min(0)], 'max': [float(x) for x in pos.max(0)]}, {'bufferView': 1, 'componentType': 5121, 'normalized': True, 'count': len(col), 'type': 'VEC4'}, {'bufferView': 2, 'componentType': 5125, 'count': len(idx), 'type': 'SCALAR'}]}
js = json.dumps(gl, separators=(',', ':')).encode(); js += b' ' * (-len(js) % 4); blob += b'\0' * (-len(blob) % 4)
open(os.path.join(out, 'mesh.glb'), 'wb').write(struct.pack('<III', 0x46546C67, 2, 28 + len(js) + len(blob)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(blob), 0x004E4942) + blob)
metas = []
for k, i in enumerate(keys):
    im = Image.open(os.path.join(kdir, f'k{k:04d}.jpg')).convert('RGB'); buf = io.BytesIO(); im.save(buf, 'WEBP', quality=78, method=6); pack = f'k{k // 16:02d}.webp'; f = os.path.join(out, pack)
    at = [os.path.getsize(f) if k % 16 else 0, buf.tell()]; open(f, 'ab' if k % 16 else 'wb').write(buf.getvalue())
    metas.append({'pack': pack, 'at': at, 'w': im.size[0], 'h': im.size[1], 'f': [round(float(K[0, 0] / W0), 5), round(float(K[1, 1] / H0), 5)], 'c': [round(float(K[0, 2] / W0), 5), round(float(K[1, 2] / H0), 5)],
                  'p': [round(float(x), 4) for x in Cw[i]], 'r': [round(float(x), 5) for x in Rw[i].T.reshape(-1)]})      # r: the world seen from this camera (rows: its right, its down, its forward)
json.dump({'mesh': 'mesh.glb', 'eye': round(EYE, 3), 'size': [round(float(x), 2) for x in (VX.max(0) - VX.min(0))], 'keys': metas, 'path': cams, 'chapters': chapters}, open(os.path.join(out, 'scene.json'), 'w'), separators=(',', ':'))
print(f'\nwritten to {out}: mesh.glb ({os.path.getsize(os.path.join(out, "mesh.glb")) / 1e6:.1f} MB), {len(keys)} photographs in {(len(keys) + 15) // 16} files, a route of {len(cams)} steps' + (f", rooms: {[c['label'] for c in chapters]}" if chapters else ''))
