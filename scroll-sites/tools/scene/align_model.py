# Fits a model of a place that was made separately (an architect's model, a CAD export, something built in Blender)
# onto the scan of that place, so the two can be used together.
#
#   python3 -I tools/scene/align_model.py <site-folder>/scene <model.obj|.ply|.stl|.glb> <out-folder> [--merge 0.06] [--tries 6]
#
# The model may be anywhere, turned any way and in any unit (metres, millimetres, feet): the fit finds where it
# goes, which way round, and how big. It expects a place with a floor and upright surfaces (a home, a shop, a plant):
# it matches the two as plans seen from above, then refines the fit in 3D.
#
# Written to the out folder:
#   fit.json     the placement (a 4x4 matrix taking the model into the scene), its scale, and how well it fits
#   model.ply    the model in the scene's place
#   mesh.glb     with --merge: the scene's model rebuilt from both. The outside model is used wherever the scan agrees
#                with it to within that many metres (walls, floor and ceiling become its clean flat surfaces), and the
#                scan is kept for everything the model does not have (furniture). Put it in the scene folder in place
#                of the builder's mesh.glb and the site draws the photographs on it.
#
# It can only fit what matches. Where the place was built differently from the model, or the model has things the
# scan never saw, the two will disagree there; fit.json says how much of the model found the scan.
import sys, os, json, struct
import numpy as np
import open3d as o3d
o3d.utility.set_verbosity_level(o3d.utility.VerbosityLevel.Error)
reg = o3d.pipelines.registration

args = sys.argv[1:]; opt = {}
for k in ('--merge', '--tries', '--seed'):
    if k in args: i = args.index(k); opt[k[2:]] = float(args[i + 1]); del args[i:i + 2]
if len(args) != 3: sys.exit('usage: align_model.py <scene-folder> <model file> <out-folder> [--merge 0.06] [--tries 10]')
scene, model_file, out = args; os.makedirs(out, exist_ok=True); TRIES = int(opt.get('tries', 6)); rng = np.random.default_rng(int(opt.get('seed', 1)))

def read_glb(path):
    buf = open(path, 'rb').read(); jl = struct.unpack('<I', buf[12:16])[0]; gl = json.loads(buf[20:20 + jl]); b0 = 20 + jl + 8
    def view(i, dt, per): a = gl['accessors'][i]; v = gl['bufferViews'][a['bufferView']]; return np.frombuffer(buf, dt, a['count'] * per, b0 + v.get('byteOffset', 0))
    p = gl['meshes'][0]['primitives'][0]; return view(p['attributes']['POSITION'], np.float32, 3).reshape(-1, 3).astype(np.float64), view(p['attributes']['COLOR_0'], np.uint8, 4).reshape(-1, 4)[:, :3].copy(), view(p['indices'], np.uint32, 1).reshape(-1, 3).astype(np.int32)
SV, SC, ST = read_glb(os.path.join(scene, 'mesh.glb'))
scan = o3d.geometry.TriangleMesh(o3d.utility.Vector3dVector(SV), o3d.utility.Vector3iVector(ST)); model = o3d.io.read_triangle_mesh(model_file)
if not len(model.triangles): sys.exit('no surfaces were found in ' + model_file)
MV = np.asarray(model.vertices).copy(); MT = np.asarray(model.triangles).copy()

# ---- the fit ----
# A building has a floor, and seen from above its walls draw a plan. So: for each way the model could be standing
# (its three main surface directions, each way up), and a range of sizes around a first guess, the model's plan is
# turned through a full circle over the scan's plan and slid to where the walls coincide best. The best few of those
# placements are then refined in 3D until the surfaces lie on each other, and the one that lays most of the model
# on the scan is kept.
def spread(X):
    X = X - np.median(X, 0); w, v = np.linalg.eigh(np.cov(X.T)); pr = X @ v; return np.sort(np.percentile(pr, 97, axis=0) - np.percentile(pr, 3, axis=0))
def tri_normals(V, T): n = np.cross(V[T[:, 1]] - V[T[:, 0]], V[T[:, 2]] - V[T[:, 0]]); ar = np.linalg.norm(n, axis=1); return n / np.maximum(ar, 1e-12)[:, None], ar / 2
def sample(V, T, count):
    n, ar = tri_normals(V, T); pick = rng.choice(len(T), count, p=ar / ar.sum()); u, v = rng.random(count), rng.random(count); flip = u + v > 1; u[flip], v[flip] = 1 - u[flip], 1 - v[flip]
    return V[T[pick, 0]] + u[:, None] * (V[T[pick, 1]] - V[T[pick, 0]]) + v[:, None] * (V[T[pick, 2]] - V[T[pick, 0]]), n[pick]
A, NA = sample(MV, MT, 150000); B, NB = sample(SV, ST, 250000); s0 = float(np.median(spread(B) / spread(A)))
CELL = max(0.05, float(np.linalg.norm(spread(B))) / 180); floor_s = float(np.percentile(B[:, 1], 2)); tall_s = float(np.percentile(B[:, 1], 98) - floor_s)
wb = B[(np.abs(NB[:, 1]) < 0.3) & (B[:, 1] > floor_s + 0.25) & (B[:, 1] < floor_s + tall_s - 0.25)][:, [0, 2]]; bmin = wb.min(0)
def plan(P2, n):
    ij = np.floor(P2 / CELL).astype(int); ok = (ij >= 0).all(1) & (ij < n).all(1); g = np.bincount(ij[ok, 1] * n + ij[ok, 0], minlength=n * n).reshape(n, n).astype(np.float32); return np.minimum(g, 2.0) / 2.0
nmn, arn = tri_normals(MV, MT); w_, v_ = np.linalg.eigh((arn[:, None, None] * nmn[:, :, None] * nmn[:, None, :]).sum(0)); ups = [sg * v_[:, i] for i in range(3) for sg in (1, -1)]
print(f'model: {len(MT)} triangles; scan: {len(ST)} triangles; first guess at the size: x{s0:.4g}', flush=True)
found = []
for u in ups:
    x = np.cross(u, [1.0, 0, 0]); x = x if np.linalg.norm(x) > 0.3 else np.cross(u, [0, 0, 1.0]); x /= np.linalg.norm(x); z = np.cross(x, u); Ru = np.stack([x, u, z])           # turns the model so that u is up
    P1 = A @ Ru.T; N1 = NA @ Ru.T; floor_m = float(np.percentile(P1[:, 1], 2)); tall_m = float(np.percentile(P1[:, 1], 98) - floor_m)
    by_height = tall_s / max(tall_m, 1e-9)
    if not 0.7 < by_height / s0 < 1.45: continue                           # stood this way up, the model would be the wrong height for its footprint: not the way it stands
    sizes = sorted({round(s * f, 6) for s in (s0, by_height) for f in (0.93, 1.0, 1.07)})
    for s in sizes:
        wm = P1[(np.abs(N1[:, 1]) < 0.3)][:40000, [0, 2]] * s
        if len(wm) < 500: continue
        reach = float(np.linalg.norm(wm.max(0) - wm.min(0))); across = float(np.linalg.norm(np.ptp(wb, axis=0)))
        if not 0.6 * across < reach < 1.7 * across: continue                # a model much smaller or larger than the place is not a model of it
        n = int(2 ** np.ceil(np.log2((np.ptp(wb, axis=0).max() + reach) / CELL + 8)))
        gs = plan(wb - bmin + reach, n); pd = np.pad(gs, 1); gs = sum(pd[1 + dy:1 + dy + n, 1 + dx:1 + dx + n] for dy in (-1, 0, 1) for dx in (-1, 0, 1)) / 9; Fs = np.fft.rfft2(gs); tot_s = float(gs.sum())       # the scan's walls from above, a little softened
        for th in np.radians(np.arange(0, 360, 2.0)):
            c, sn = np.cos(th), np.sin(th); q = wm @ np.array([[c, -sn], [sn, c]]); qmin = q.min(0); gm = plan(q - qmin, n); tot = float(gm.sum())
            if tot < 50: continue
            corr = np.fft.irfft2(Fs * np.conj(np.fft.rfft2(gm)), s=(n, n)); k = int(np.argmax(corr)); iy, ix = divmod(k, n); both = float(corr[iy, ix]); found.append((both / (tot + tot_s - both), u, Ru, s, th, np.array([ix, iy]) * CELL + bmin - reach - qmin, floor_m))
found.sort(key=lambda e: -e[0]); cA = np.zeros(3); T0 = np.eye(4); pm0 = o3d.geometry.PointCloud(o3d.utility.Vector3dVector(A)); ps_n = o3d.geometry.PointCloud(o3d.utility.Vector3dVector(B)); vox = CELL
def refine(T, s_first):
    """Lays the model on the scan from a starting placement: moved and turned freely, but resized only a little at a
    time and never far from the size the plans agreed on. (Left free, a fit can cheat by shrinking the whole model
    onto one patch of wall, where every point of it is 'on the scan'.)"""
    for d in (0.35, 0.18, 0.09, 0.05):
        for _ in range(3):
            T = np.array(reg.registration_icp(pm0, ps_n, d, T, reg.TransformationEstimationPointToPoint(False), reg.ICPConvergenceCriteria(max_iteration=40)).transformation)
            cs = np.asarray(reg.evaluate_registration(pm0, ps_n, d, T).correspondence_set)
            if len(cs) < 500: break
            X = A[cs[:, 0]] @ T[:3, :3].T + T[:3, 3]; Y = B[cs[:, 1]]; mx = X.mean(0); dx = X - mx; k = float(np.clip((dx * (Y - Y.mean(0))).sum() / max((dx * dx).sum(), 1e-12), 0.985, 1.015))
            now = float(np.cbrt(np.linalg.det(T[:3, :3]))); k = float(np.clip(now * k, s_first * 0.85, s_first * 1.15) / now); G = np.eye(4); G[:3, :3] *= k; G[:3, 3] = mx - k * mx; T = G @ T
    return T
def score(T): r = reg.evaluate_registration(pm0, ps_n, 0.05, T); return r.fitness, r.inlier_rmse
best = None; seen = []
for sc_, u, Ru, s, th, t2, floor_m in found:
    if len(seen) >= TRIES: break
    c, sn = np.cos(th), np.sin(th); Ry = np.array([[c, 0, sn], [0, 1, 0], [-sn, 0, c]]); T = np.eye(4); T[:3, :3] = s * Ry @ Ru; T[:3, 3] = [t2[0], floor_s - s * floor_m, t2[1]]
    if any(np.abs(T - T_).max() < 0.25 for T_ in seen): continue           # much the same placement as one already tried
    seen.append(T); T = refine(T, s); fit, rmse = score(T)
    print(f'  placement {len(seen)}: plans agree {sc_ * 100:.0f}%; refined, {fit * 100:.0f}% of the model lies on the scan', flush=True)
    if best is None or fit > best[0]: best = (fit, rmse, T)
fit, rmse, T = best; M = T @ T0; sc = float(np.cbrt(np.linalg.det(M[:3, :3])))
print(f'fitted: {fit * 100:.0f}% of the model lies within 5 cm of the scan (typical gap {rmse * 100:.1f} cm); scale x{sc:.5g}')
placed = MV @ M[:3, :3].T + M[:3, 3]
json.dump({'matrix': [[float(x) for x in row] for row in M], 'scale': sc, 'on_scan': round(float(fit), 4), 'gap_m': round(float(rmse), 4), 'within_m': 0.05}, open(os.path.join(out, 'fit.json'), 'w'), indent=1)
pl = o3d.geometry.TriangleMesh(o3d.utility.Vector3dVector(placed), o3d.utility.Vector3iVector(MT)); o3d.io.write_triangle_mesh(os.path.join(out, 'model.ply'), pl)

# ---- with --merge: one model from both ----
if 'merge' in opt:
    near = opt['merge']; rc = o3d.t.geometry.RaycastingScene(); rc.add_triangles(o3d.t.geometry.TriangleMesh.from_legacy(pl))
    d = rc.compute_distance(o3d.core.Tensor(SV.astype(np.float32))).numpy(); keep = ~(d[ST] < near).all(1)            # a piece of the scan lying on the outside model is replaced by it
    used = np.unique(ST[keep]); remap = np.full(len(SV), -1, np.int64); remap[used] = np.arange(len(used)); kv, kc, kt = SV[used], SC[used], remap[ST[keep]]
    # the outside model's own soft colour (shown only where no photograph reaches): borrowed from the scan nearest each corner
    tree = o3d.geometry.KDTreeFlann(o3d.geometry.PointCloud(o3d.utility.Vector3dVector(SV))); mc = np.array([SC[tree.search_knn_vector_3d(p, 1)[1][0]] for p in placed], np.uint8)
    # the model's triangles both ways round, so a wall drawn facing outwards still shows from inside the room
    pos = np.vstack([kv, placed]).astype(np.float32); col = np.concatenate([np.vstack([kc, mc]), np.full((len(pos), 1), 255, np.uint8)], 1).astype(np.uint8); idx = np.vstack([kt, MT + len(kv)]).reshape(-1).astype(np.uint32); blob = pos.tobytes() + col.tobytes() + idx.tobytes()
    gl = {'asset': {'version': '2.0'}, 'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0}], 'meshes': [{'primitives': [{'attributes': {'POSITION': 0, 'COLOR_0': 1}, 'indices': 2}]}], 'buffers': [{'byteLength': len(blob)}],
          'bufferViews': [{'buffer': 0, 'byteOffset': 0, 'byteLength': pos.nbytes, 'target': 34962}, {'buffer': 0, 'byteOffset': pos.nbytes, 'byteLength': col.nbytes, 'target': 34962}, {'buffer': 0, 'byteOffset': pos.nbytes + col.nbytes, 'byteLength': idx.nbytes, 'target': 34963}],
          'accessors': [{'bufferView': 0, 'componentType': 5126, 'count': len(pos), 'type': 'VEC3', 'min': [float(x) for x in pos.min(0)], 'max': [float(x) for x in pos.max(0)]}, {'bufferView': 1, 'componentType': 5121, 'normalized': True, 'count': len(col), 'type': 'VEC4'}, {'bufferView': 2, 'componentType': 5125, 'count': len(idx), 'type': 'SCALAR'}]}
    js = json.dumps(gl, separators=(',', ':')).encode(); js += b' ' * (-len(js) % 4); blob += b'\0' * (-len(blob) % 4)
    open(os.path.join(out, 'mesh.glb'), 'wb').write(struct.pack('<III', 0x46546C67, 2, 28 + len(js) + len(blob)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(blob), 0x004E4942) + blob)
    print(f'merged: {(~keep).sum()} of the scan\'s {len(ST)} triangles lay on the model and were replaced by its {len(MT)}; mesh.glb written')
