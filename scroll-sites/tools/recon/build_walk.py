# Turns a walkthrough VIDEO, or a dense set of photographs of a whole home, into one smooth walk through it.
#
#   python3 -I tools/recon/build_walk.py <video-file | photos-folder> <work-folder> <site-folder>/walk --model <depth.onnx>
#           [--sparse <existing reconstruction>] [--clip <folder with the room-naming model>] [--fps 3] [--once]
#
# --once plans a new route that visits each part of the home once, instead of following the footage where it wanders
# and doubles back. Use it for scans and for any footage that was not shot as a single tidy walk.
#
# Use this when the client hands over a video of someone walking through the home (a phone is fine: walk slowly, hold
# it level and steady, keep moving forward, go through every room once), or hundreds of overlapping photographs.
# Best of all is a scan from an iPhone or iPad Pro made with the Stray Scanner app: give its folder (rgb.mp4,
# odometry.csv, camera_matrix.csv, depth/) in place of the video. The phone has already tracked where it was and
# measured depth, so the slow matching step is skipped and nothing depends on the rooms having enough texture.
# For an ordinary set of listing photographs (a few per room) use build_tour.py instead.
#
# What it does (each stage keeps its results in the work folder, so a second run is quick):
#   1. A video is cut into still frames. The frames are matched to work out where each was taken.
#   2. A new, smooth walking path is planned along the route the camera took: its wobbles and pauses are ironed out,
#      it keeps a steady height and pace, and it looks where the frames around it look, turning slowly and evenly.
#   3. Along that path the nearest frames are chosen, and depth is estimated for each and fitted to the scene.
#   4. The rooms are named by a vision model (kitchen, bedroom, living room ...), so the site can caption them.
#   5. The site's walk/ folder is written: the frames, the path, the room names, and walk/tour.json.
#
# Needs: pip install pycolmap onnxruntime numpy pillow tokenizers; ffmpeg for video; the Depth Anything V2 (small) model
# (onnx/model.onnx from onnx-community/depth-anything-v2-small on Hugging Face) and, for room names, a folder holding
# vision_model_quantized.onnx, text_model_quantized.onnx and tokenizer.json from Xenova/clip-vit-base-patch32.
import sys, os, io, json, shutil, subprocess, re, pickle
import numpy as np
from PIL import Image

args = sys.argv[1:]; opt = {}; once = '--once' in args; args = [a for a in args if a != '--once']
for k in ('--model', '--sparse', '--clip', '--fps', '--pitch', '--step', '--name', '--cell', '--view'):
    if k in args: i = args.index(k); opt[k[2:]] = args[i + 1]; del args[i:i + 2]
if len(args) != 3 or 'model' not in opt: sys.exit('usage: build_walk.py <video | photos-folder> <work> <site>/walk --model depth.onnx [--sparse dir] [--clip dir] [--fps 3] [--once]')
src, work, out = args; os.makedirs(work, exist_ok=True)
PITCH = np.radians(float(opt.get('pitch', 12)))          # how far below level the walk looks: a little, as a person does
STEP = float(opt.get('step', 0.16))                       # spacing of the planned path's points, where a typical distance in the scene is 3
VIEW = [float(x) for x in opt.get('view', '0.62,0.8').split(',')]   # how much of a frame's width and height the walk's view may take: more is a wider view, but leans harder on neighbouring frames lining up (video and scans do; loose photographs less so)
TURN = 1.2                                                # how much walking one radian of turning counts for (as in the viewer)
ROOMS = ['living room', 'kitchen', 'dining room', 'bedroom', 'bathroom', 'home office', 'hallway', 'staircase', 'balcony', 'garden']

# ---- 1. frames, and where each was taken ---------------------------------------------------------------------------
scan = os.path.isdir(src) and os.path.exists(os.path.join(src, 'odometry.csv'))     # a phone scan that tracked itself (see the top of this file)
if scan:
    photos = os.path.join(work, 'frames'); odo = np.loadtxt(os.path.join(src, 'odometry.csv'), delimiter=',', skiprows=1); rate = 1 / float(np.median(np.diff(odo[:, 0]))); every = max(1, round(rate / float(opt.get('fps', 3))))
    if not os.path.isdir(photos):
        os.makedirs(photos); print('cutting the video into frames', flush=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(src, 'rgb.mp4'), '-vf', f"select='not(mod(n\\,{every}))',scale='min(1600,iw)':-2", '-vsync', 'vfr', '-q:v', '2', '-start_number', '0', os.path.join(photos, 'f%05d.jpg')], check=True)
    poses_file = os.path.join(work, 'poses.pkl')
    if not os.path.exists(poses_file):
        K = np.loadtxt(os.path.join(src, 'camera_matrix.csv'), delimiter=','); names = sorted(f for f in os.listdir(photos) if f.endswith('.jpg')); w, h = Image.open(os.path.join(photos, names[0])).size; k = w / (2 * K[0, 2]); V = []
        def turn(q): qx, qy, qz, qw = q; return np.array([[1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - qz * qw), 2 * (qx * qz + qy * qw)], [2 * (qx * qy + qz * qw), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - qx * qw)], [2 * (qx * qz - qy * qw), 2 * (qy * qz + qx * qw), 1 - 2 * (qx * qx + qy * qy)]])
        # Scanning apps differ in which way the camera's own axes point (y up and z backwards, or y down and z forwards).
        # The right one is the one under which two frames taken a moment apart agree about how far away things are.
        def disagree(F, i, j):
            Ri, Rj = turn(odo[i, 5:9]) @ F, turn(odo[j, 5:9]) @ F; di = np.asarray(Image.open(os.path.join(src, 'depth', f'{i:06d}.png')), np.float32) / 1000.0; dj = np.asarray(Image.open(os.path.join(src, 'depth', f'{j:06d}.png')), np.float32) / 1000.0
            hh, ww = di.shape; gy, gx = np.mgrid[2:hh:4, 2:ww:4]; z = di[gy, gx].ravel(); ok = (z > 0.3) & (z < 3.5); kx = 2 * K[0, 2] / ww
            X = np.stack([((gx.ravel() + 0.5) * kx - K[0, 2]) / K[0, 0] * z, ((gy.ravel() + 0.5) * kx - K[1, 2]) / K[1, 1] * z, z], 1)[ok] @ Ri.T + odo[i, 2:5]; Xc = (X - odo[j, 2:5]) @ Rj; m = Xc[:, 2] > 0.3
            u = (Xc[m, 0] / Xc[m, 2] * K[0, 0] + K[0, 2]) / kx; vv = (Xc[m, 1] / Xc[m, 2] * K[1, 1] + K[1, 2]) / kx; inb = (u >= 1) & (u < ww - 1) & (vv >= 1) & (vv < hh - 1)
            if inb.sum() < 100: return 9.0
            dd = dj[vv[inb].astype(int), u[inb].astype(int)]; g = (dd > 0.3) & (dd < 3.5); return float(np.median(np.abs(dd[g] - Xc[m, 2][inb][g]))) if g.sum() > 50 else 9.0
        probe = [(i, min(len(odo) - 1, i + round(rate * 0.7))) for i in np.linspace(0, len(odo) - 1 - round(rate), 14).astype(int)[1:-1]]
        AX = min((np.eye(3), np.diag([1.0, -1.0, -1.0])), key=lambda F: np.median([disagree(F, i, j) for i, j in probe]))
        for i, name in enumerate(names):
            if i * every >= len(odo): break
            x, y, z = odo[i * every, 2:5]; Rc = turn(odo[i * every, 5:9]) @ AX
            R = Rc.T; t = -R @ np.array([x, y, z]); dfile = os.path.join(src, 'depth', f'{i * every:06d}.png')
            if not os.path.exists(dfile): continue
            dm = np.asarray(Image.open(dfile), np.float32) / 1000.0; gy, gx = np.mgrid[4:dm.shape[0]:8, 4:dm.shape[1]:8]; zz = dm[gy, gx].ravel(); ok = (zz > 0.25) & (zz < 4.5)      # the phone's own depth sensor, in metres; it is only good to a few metres
            cfile = os.path.join(src, 'confidence', f'{i * every:06d}.png')
            if os.path.exists(cfile): ok &= np.asarray(Image.open(cfile))[gy, gx].ravel() >= 1
            if ok.sum() < 30: continue
            xy = np.stack([(gx.ravel() + 0.5) / dm.shape[1] * w, (gy.ravel() + 0.5) / dm.shape[0] * h], 1)[ok]
            V.append({'name': name, 'R': R, 't': t, 'xy': xy.astype(np.float32), 'z': zz[ok].astype(np.float32), 'ids': np.zeros(0, np.int64), 'f': float(K[0, 0]) * k, 'cx': float(K[0, 2]) * k, 'cy': float(K[1, 2]) * k, 'w': w, 'h': h})
        pickle.dump(V, open(poses_file, 'wb'))
elif os.path.isdir(src): photos = src
else:
    photos = os.path.join(work, 'frames')
    if not os.path.isdir(photos):
        os.makedirs(photos); print('cutting the video into frames', flush=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f"fps={opt.get('fps', 3)},scale='min(1600,iw)':-2", '-q:v', '2', os.path.join(photos, 'f%05d.jpg')], check=True)
poses_file = os.path.join(work, 'poses.pkl')
if not os.path.exists(poses_file) or 'ids' not in pickle.load(open(poses_file, 'rb'))[0]:
    import pycolmap
    sparse = opt.get('sparse')
    if not sparse:
        sparse_root = os.path.join(work, 'sparse'); db = os.path.join(work, 'database.db')
        if not os.path.isdir(sparse_root):
            if os.path.exists(db): os.remove(db)
            ex = pycolmap.FeatureExtractionOptions(); ex.sift.max_num_features = 5000; ex.max_image_size = 1600; ex.use_gpu = False
            ro = pycolmap.ImageReaderOptions(); ro.camera_model = 'SIMPLE_RADIAL'
            print('reading the frames', flush=True); pycolmap.extract_features(db, photos, camera_mode=pycolmap.CameraMode.SINGLE, reader_options=ro, extraction_options=ex, device=pycolmap.Device.cpu)
            print('matching each frame against the ones around it', flush=True); mo = pycolmap.FeatureMatchingOptions(); mo.use_gpu = False
            po = pycolmap.SequentialPairingOptions(); po.overlap = 12; po.quadratic_overlap = True; po.loop_detection = False
            pycolmap.match_sequential(db, matching_options=mo, pairing_options=po, device=pycolmap.Device.cpu)
            print('working out where each frame was taken', flush=True); os.makedirs(sparse_root); io = pycolmap.IncrementalPipelineOptions(); io.min_model_size = 10
            pycolmap.incremental_mapping(db, photos, sparse_root, options=io)
        # the largest connected piece is the walk
        sparse = max((os.path.join(sparse_root, k) for k in os.listdir(sparse_root)), key=lambda p: len(pycolmap.Reconstruction(p).images))
    r = pycolmap.Reconstruction(sparse); V = []
    for im in sorted(r.images.values(), key=lambda i: i.name):
        T = im.cam_from_world() if callable(im.cam_from_world) else im.cam_from_world; R, t = np.asarray(T.rotation.matrix()), np.asarray(T.translation); cam = r.cameras[im.camera_id]; xy, z, ids = [], [], []
        for p in im.points2D:
            if p.has_point3D():
                zc = (R @ r.points3D[p.point3D_id].xyz + t)[2]
                if zc > 0: xy.append(p.xy); z.append(zc); ids.append(p.point3D_id)
        if len(z) < 30: continue
        fx = float(cam.params[0]); pin = cam.model.name == 'PINHOLE'; cx, cy = (float(cam.params[2]), float(cam.params[3])) if pin else (float(cam.params[1]), float(cam.params[2]))
        V.append({'name': im.name, 'R': R, 't': t, 'xy': np.array(xy, np.float32), 'z': np.array(z, np.float32), 'ids': np.array(ids, np.int64), 'f': fx, 'cx': cx, 'cy': cy, 'w': cam.width, 'h': cam.height})
    pickle.dump(V, open(poses_file, 'wb'))
V = pickle.load(open(poses_file, 'rb')); n = len(V); total_frames = len([f for f in os.listdir(photos) if re.search(r'\.(jpe?g|png|webp)$', f, re.I)])
print(f'{n} of {total_frames} frames placed', flush=True)
if n < 0.6 * total_frames: print('  Fewer than two thirds of the frames could be placed. The footage probably moves too fast, is blurred, or shows blank walls for too long.\n  Ask for a slower, steadier walk: about one step a second, the camera level, no quick turns.', flush=True)
scale = 3.0 / float(np.median([np.median(v['z']) for v in V]))          # a typical distance in the scene becomes 3 units
P = np.array([-v['R'].T @ v['t'] for v in V]) * scale; FW = np.array([v['R'].T @ np.array([0, 0, 1.0]) for v in V])
# Which way is down: people hold a camera without rolling it, so every frame's "right" lies flat. Down is the one
# direction square to all of them (tilting the camera up or down does not disturb this, as averaging the cameras' own "down" would).
RT = np.array([v['R'].T @ np.array([1.0, 0, 0]) for v in V]); w_, e_ = np.linalg.eigh(RT.T @ RT); down = e_[:, 0]
if down @ np.mean([v['R'].T @ np.array([0, 1.0, 0]) for v in V], 0) < 0: down = -down

# ---- 2. the walking path ----------------------------------------------------------------------------------------------
def gauss(a, sigma):
    k = int(3 * sigma) + 1; w = np.exp(-np.arange(-k, k + 1) ** 2 / (2 * sigma * sigma)); w /= w.sum(); p = np.pad(a, [(k, k)] + [(0, 0)] * (a.ndim - 1), mode='edge')
    return np.stack([np.tensordot(w, p[i:i + 2 * k + 1], axes=(0, 0)) for i in range(len(a))])
d = np.linalg.norm(np.diff(P, axis=0), axis=1); cuts = [i + 1 for i in range(n - 1) if d[i] > max(8 * np.median(d), 1.5)]; runs = [(a, b) for a, b in zip([0] + cuts, cuts + [n]) if b - a >= 12]
level = np.degrees(np.arcsin(np.clip(FW @ down, -1, 1))); openv = np.array([float(np.median(v['z'])) for v in V]) * scale       # how far each frame sees, typically
def resample(S):
    """the same line, as points one step apart"""
    L = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(S, axis=0), axis=1))])
    if L[-1] < 4 * STEP: return None
    s = np.arange(0, L[-1], STEP); return np.stack([np.interp(s, L, S[:, k]) for k in range(3)], 1)
def looks(Q, pool):
    """The walk looks where the frames near it really look, so there is always a real picture behind the view: at each
    point, the frame that is close by and faces most nearly the way the walk is going sets the direction; among the
    nearest few at each point, the chain of frames whose directions change least from one point to the next is taken."""
    T = gauss(np.gradient(gauss(Q, 0.5 / STEP), axis=0), 1.1 / STEP); T = T - np.outer(T @ down, down); nrm = np.linalg.norm(T, axis=1, keepdims=True)
    T = np.where(nrm > 1e-6, T / np.maximum(nrm, 1e-6), 0)               # the direction of travel
    lv = pool[(level[pool] > -8) & (level[pool] < 38)]; pool = lv if len(lv) else pool; K = min(16, len(pool)); cand, unary = [], []
    for q, t in zip(Q, T):
        c = np.linalg.norm(P[pool] - q, axis=1) + 0.55 * np.arccos(np.clip(FW[pool] @ t, -1, 1)) - 0.2 * np.minimum(openv[pool], 5.0); o = np.argsort(c)[:K]; cand.append(pool[o]); unary.append(c[o])     # ... and, other things equal, one that looks down the room and not at the wall beside it
    cost = unary[0].copy(); back = []
    for i in range(1, len(Q)):
        tr = 0.9 * np.arccos(np.clip(FW[cand[i - 1]] @ FW[cand[i]].T, -1, 1)); tot = cost[:, None] + tr; back.append(np.argmin(tot, 0)); cost = tot.min(0) + unary[i]
    j = int(np.argmin(cost)); pick = [j]
    for bk in reversed(back): j = int(bk[j]); pick.append(j)
    pick.reverse(); return np.stack([FW[cand[i][pick[i]]] for i in range(len(Q))])
# each unbroken run of the footage gives a piece of path: the route the camera took, with its wandering ironed out and held near one height
pieces = []
if once:
    # --once: the walk does not retrace the footage, which wanders and doubles back as someone films or scans a home.
    # It takes a new route that goes to each part of the home once, nearest part first, moving only along ground the
    # camera really covered: from a frame to the next one, or to another frame taken within a short step of it.
    import heapq
    e1 = np.cross(down, [1.0, 0, 0]); e1 = e1 if np.linalg.norm(e1) > 0.3 else np.cross(down, [0, 1.0, 0]); e1 /= np.linalg.norm(e1); e2 = np.cross(down, e1)
    D2 = np.linalg.norm(P[:, None] - P[None], axis=2); nb = [[] for _ in range(n)]
    for a, b in runs:
        for i in range(a, b - 1): nb[i].append((i + 1, D2[i, i + 1])); nb[i + 1].append((i, D2[i, i + 1]))
    for i in range(n):
        for j in np.nonzero(D2[i, i + 6:] < 0.45)[0] + i + 6: nb[i].append((int(j), D2[i, j] * 1.5 + 0.05)); nb[int(j)].append((i, D2[i, j] * 1.5 + 0.05))
    def reach(src):
        dist = np.full(n, np.inf); prev = np.full(n, -1); dist[src] = 0; heap = [(0.0, src)]
        while heap:
            c, i = heapq.heappop(heap)
            if c > dist[i]: continue
            for j, w in nb[i]:
                if c + w < dist[j]: dist[j] = c + w; prev[j] = i; heapq.heappush(heap, (c + w, j))
        return dist, prev
    CELL = float(opt.get('cell', 1.5)); cell = [tuple(c) for c in np.floor(np.stack([P @ e1, P @ e2], 1) / CELL).astype(int)]; members = {}
    for i, c in enumerate(cell): members.setdefault(c, []).append(i)
    # each square of floor the camera spent some time in is a place to go: to the frame nearest the middle of where it stood there
    goal = {c: m[int(np.argmin(np.linalg.norm(P[m] - np.median(P[m], 0), axis=1)))] for c, m in members.items() if len(m) >= 4}
    cur = runs[0][0]; order = [cur]; goal.pop(cell[cur], None)
    while goal:
        dist, prev = reach(cur); c = min(goal, key=lambda c: dist[goal[c]]); tgt = goal.pop(c)
        if not np.isfinite(dist[tgt]): continue
        path = [tgt]
        while path[-1] != cur: path.append(int(prev[path[-1]]))
        order += path[::-1][1:]; cur = tgt
        for i in path: goal.pop(cell[i], None)                            # squares crossed on the way are done too
    Q0 = resample(P[order])
    if Q0 is not None:
        S = gauss(Q0, 0.8 / STEP); S = S - np.outer((S - np.median(S, 0)) @ down, down) * 0.85; Q = resample(S)
        pool = np.unique(np.concatenate([np.arange(max(0, i - 20), min(n, i + 21)) for i in order])); pieces.append({'Q': Q, 'look': looks(Q, pool), 'pool': pool, 'ends': (order[0], order[-1])})
        print(f'a route that visits each part of the home once: {len(Q) * STEP:.0f} units (the footage itself covers {float(np.sum(d)):.0f})', flush=True)
for a, b in ([] if once else runs):
    S = gauss(P[a:b], 6.0); S = S - np.outer((S - np.median(S, 0)) @ down, down) * 0.85; Q = resample(S)
    if Q is None or len(Q) * STEP < 2.0: continue
    pool = np.arange(max(0, a - 40), min(n, b + 40)); pieces.append({'Q': Q, 'look': looks(Q, pool), 'pool': pool, 'ends': (a, b - 1)})
if not pieces: sys.exit('The footage gave no usable route. See the note above about the footage.')
# Where the footage jumps (the camera was carried to another room between shots, or the recording was paused), the
# pieces are joined by a way through the home that the camera really went at some other moment: from frame to frame,
# only between frames that are close together and show some of the same things, so never through a wall.
import heapq
ids = [np.unique(v['ids']) for v in V]; adj = [[] for _ in range(n)]; DD = np.linalg.norm(P[:, None] - P[None], axis=2) if len(pieces) > 1 else None
for i in range(n if len(pieces) > 1 else 0):
    for j in np.nonzero(DD[i, i + 1:] < 2.5)[0] + i + 1:
        if j - i <= 2 or len(np.intersect1d(ids[i], ids[j], assume_unique=True)) >= 40:
            c = DD[i, j] * (1 + DD[i, j]) + 0.4 * float(np.arccos(np.clip(FW[i] @ FW[j], -1, 1))) + 0.05; adj[i].append((int(j), c)); adj[j].append((i, c))
def way(src, dst):
    best = {src: 0.0}; prev = {}; heap = [(0.0, src)]
    while heap:
        c, i = heapq.heappop(heap)
        if i == dst: break
        if c > best.get(i, 1e18): continue
        for j, w in adj[i]:
            if c + w < best.get(j, 1e18): best[j] = c + w; prev[j] = i; heapq.heappush(heap, (c + w, j))
    if dst not in best: return None
    r = [dst]
    while r[-1] != src: r.append(prev[r[-1]])
    return r[::-1]
chains = [[pieces[0]]]
for prev_, pc in zip(pieces, pieces[1:]):
    route = way(prev_['ends'][1], pc['ends'][0]); bridge = None
    if route is not None:
        poly = np.vstack([prev_['Q'][-1:], P[route[1:-1]].reshape(-1, 3), pc['Q'][:1]]); Lp = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(poly, axis=0), axis=1))]); t = Lp / max(Lp[-1], 1e-9)
        h0, h1 = prev_['Q'][-1] @ down, pc['Q'][0] @ down; poly = poly + np.outer(h0 + (h1 - h0) * t - poly @ down, down)       # level, from one piece's height to the next's
        Qb = resample(poly)
        if Qb is not None and len(Qb) > 2:
            Sm = gauss(Qb, 0.5 / STEP); tt = np.linspace(0, 1, len(Sm))[:, None]; Sm = Sm + (1 - tt) * (Qb[0] - Sm[0]) + tt * (Qb[-1] - Sm[-1]); Sm = Sm[1:]
            pool = np.unique(np.concatenate([np.arange(max(0, r - 12), min(n, r + 13)) for r in route])); bridge = {'Q': Sm, 'look': looks(Sm, pool), 'pool': pool, 'bridge': True}
        if Lp[-1] > 30: route = None                                    # too far to cross in one go: a change of scene instead
    if route is None: chains.append([pc])
    else: chains[-1].extend([bridge, pc] if bridge else [pc])
stretches = []
for ch in chains:
    Q = gauss(np.vstack([p['Q'] for p in ch]), 0.3 / STEP); look = np.vstack([p['look'] for p in ch]); pid = np.concatenate([[i] * len(p['Q']) for i, p in enumerate(ch)])
    F = gauss(look, 1.2 / STEP); F /= np.maximum(np.linalg.norm(F, axis=1, keepdims=True), 1e-6)                                # the directions, smoothed into slow, even turns of the head
    # never staring at the floor or the ceiling: between level and 22 degrees down
    hz = F - np.outer(F @ down, down); hz /= np.maximum(np.linalg.norm(hz, axis=1, keepdims=True), 1e-6); pt = np.clip(np.arcsin(np.clip(F @ down, -1, 1)), np.radians(2), np.radians(22)); F = hz * np.cos(pt)[:, None] + np.outer(np.sin(pt), down)
    pools = []
    for p in ch: lv = p['pool'][(level[p['pool']] > -12) & (level[p['pool']] < 42)]; pools.append(lv if len(lv) else p['pool'])  # leaving out shots of the floor and the ceiling
    # where no frame is close to what the walk would see, the walk does not linger: it crosses that part at speed (see below)
    sc = np.array([np.min(np.linalg.norm(P[pools[k]] - q, axis=1) + TURN * np.arccos(np.clip(FW[pools[k]] @ f, -1, 1))) for q, f, k in zip(Q, F, pid)])
    stretches.append({'pos': Q, 'fwd': F, 'pid': pid, 'pools': pools, 'near': gauss(sc[:, None], 0.3 / STEP)[:, 0] < 0.95, 'bridges': sum(1 for p in ch if p.get('bridge'))})
print('path:', [f"{len(s['pos']) * STEP:.0f} units, {s['bridges']} joins" for s in stretches], flush=True)

# ---- 3. the frames along the path, and their depth --------------------------------------------------------------------
NEARN = 5 if scan else 3            # how many frames stand behind each point of the walk: a scan's frames line up exactly, so more of them can share a view
def nearest(p, f, pool):
    sc = np.linalg.norm(P[pool] - p, axis=1) + TURN * np.arccos(np.clip(FW[pool] @ f, -1, 1)); return pool[np.argsort(sc)[:NEARN]], np.sort(sc)[:NEARN]
import onnxruntime as ort
ort.set_default_logger_severity(3); dsess = ort.InferenceSession(opt['model'], providers=['CPUExecutionProvider']); dinp = dsess.get_inputs()[0].name
MEAN, STD = np.array([0.485, 0.456, 0.406], np.float32), np.array([0.229, 0.224, 0.225], np.float32); dcache = os.path.join(work, 'depth'); os.makedirs(dcache, exist_ok=True)
def nearness(name):
    f = os.path.join(dcache, name + '.npy')
    if os.path.exists(f): return np.load(f)
    im = Image.open(os.path.join(photos, name)).convert('RGB'); k = 770 / max(im.size); w, h = round(im.size[0] * k / 14) * 14, round(im.size[1] * k / 14) * 14
    a = (np.asarray(im.resize((w, h), Image.BICUBIC), np.float32) / 255.0 - MEAN) / STD
    dd = dsess.run(None, {dinp: np.ascontiguousarray(a.transpose(2, 0, 1)[None])})[0].squeeze().astype(np.float32); np.save(f, dd); return dd
def blur(a, k=1):
    for _ in range(k): p = np.pad(a, 1, mode='edge'); a = (p[:-2, 1:-1] + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:] + 4 * p[1:-1, 1:-1]) / 8
    return a
# room names
namer = None
if opt.get('clip'):
    from tokenizers import Tokenizer
    C = opt['clip']; vs = ort.InferenceSession(os.path.join(C, 'vision_model_quantized.onnx'), providers=['CPUExecutionProvider']); ts = ort.InferenceSession(os.path.join(C, 'text_model_quantized.onnx'), providers=['CPUExecutionProvider'])
    tok = Tokenizer.from_file(os.path.join(C, 'tokenizer.json')); ids = np.full((len(ROOMS), 77), 49407, np.int64); mask = np.zeros((len(ROOMS), 77), np.int64)
    for i, rname in enumerate(ROOMS): e = tok.encode(f'a photo of a {rname} in a home').ids[:77]; ids[i, :len(e)] = e; mask[i, :len(e)] = 1
    feed = {i.name: (ids if 'input_ids' in i.name else mask) for i in ts.get_inputs()}; tx = ts.run(None, feed); tx = next(o for o in tx if o.ndim == 2 and o.shape[0] == len(ROOMS)); tx = tx / np.linalg.norm(tx, axis=1, keepdims=True)
    CM, CS = np.array([0.4815, 0.4578, 0.4082], np.float32), np.array([0.2686, 0.2613, 0.2758], np.float32)
    def namer(name):
        im = Image.open(os.path.join(photos, name)).convert('RGB'); k = 224 / min(im.size); im = im.resize((round(im.size[0] * k), round(im.size[1] * k)), Image.BICUBIC); x0, y0 = (im.size[0] - 224) // 2, (im.size[1] - 224) // 2
        a = (np.asarray(im.crop((x0, y0, x0 + 224, y0 + 224)), np.float32) / 255.0 - CM) / CS; o = vs.run(None, {vs.get_inputs()[0].name: a.transpose(2, 0, 1)[None]}); e = next(x for x in o if x.ndim == 2); e = e / np.linalg.norm(e); return 100 * (tx @ e[0])

shutil.rmtree(out, ignore_errors=True); os.makedirs(out); tour = []; FM = np.diag([1.0, -1.0, -1.0])
def room_names(logits):
    """the room at each point of a stretch: the best-scoring name, steadied along the walk, with short runs absorbed"""
    Lg = gauss(np.array(logits), 2.5 / STEP); lab = list(np.argmax(Lg, 1)); MIN = int(4.0 / STEP); changed = True
    while changed:
        changed = False; runs_ = []
        for i, l in enumerate(lab):
            if runs_ and runs_[-1][0] == l: runs_[-1][2] = i + 1
            else: runs_.append([l, i, i + 1])
        for j, (l, i0, i1) in enumerate(runs_):
            if i1 - i0 < MIN and len(runs_) > 1: nb = runs_[j - 1][0] if j > 0 else runs_[j + 1][0]; lab[i0:i1] = [nb] * (i1 - i0); changed = True; break
    return [{'label': ROOMS[l], 'from': i0, 'to': i1 - 1} for l, i0, i1 in runs_]
for seg in stretches:
    chosen, near3, cur = [], [], None
    for p, f, k in zip(seg['pos'], seg['fwd'], seg['pid']):
        best, sc = nearest(p, f, seg['pools'][k])
        if cur is None or (np.linalg.norm(P[cur] - p) + TURN * np.arccos(np.clip(FW[cur] @ f, -1, 1))) > 1.4 * sc[0] + 0.12: cur = int(best[0])       # stay with a frame until another is clearly nearer
        trio = list(dict.fromkeys([cur] + [int(x) for x in best[:NEARN - 1]]))
        for c in trio:
            if c not in chosen: chosen.append(c)
        near3.append(trio)
    # depth for each chosen frame, fitted to the scene's own measured points; and a sparse cloud of what the frame shows, for checking the walk
    info = {}
    for i, c in enumerate(chosen):
        v = V[c]; W, H = Image.open(os.path.join(photos, v['name'])).size; dd = nearness(v['name']); lo, hi = float(dd.min()), float(dd.max()); dn = (dd - lo) / (hi - lo + 1e-9); sx, sy = W / v['w'], H / v['h']
        u = np.clip(v['xy'][:, 0] * sx / W * (dn.shape[1] - 1), 0, dn.shape[1] - 1); vv = np.clip(v['xy'][:, 1] * sy / H * (dn.shape[0] - 1), 0, dn.shape[0] - 1); ds = dn[np.round(vv).astype(int), np.round(u).astype(int)]
        A_ = np.stack([ds, np.ones_like(ds)], 1); wt = np.ones(len(ds)); inv = 1 / (v['z'] * scale)
        for _ in range(12): ab, *_ = np.linalg.lstsq(A_ * wt[:, None], inv * wt, rcond=None); res = np.abs(A_ @ ab - inv) / inv; wt = 1 / (1 + (res / 0.08) ** 2)
        if scan:
            # A scan brings the phone's own measured depth for every frame. It is used wherever it is trustworthy (it agrees
            # from one frame to the next, which estimates do not quite), and the estimate fills in beyond its reach.
            fi = int(v['name'][1:6]) * every; dm = np.asarray(Image.open(os.path.join(src, 'depth', f'{fi:06d}.png')).resize((dn.shape[1], dn.shape[0]), Image.BILINEAR), np.float32) / 1000.0
            raw = np.asarray(Image.open(os.path.join(src, 'depth', f'{fi:06d}.png')).resize((dn.shape[1], dn.shape[0]), Image.NEAREST), np.float32) / 1000.0; good_ = (raw > 0.25) & (raw < 4.5)
            cf = os.path.join(src, 'confidence', f'{fi:06d}.png')
            if os.path.exists(cf): good_ &= np.asarray(Image.open(cf).resize((dn.shape[1], dn.shape[0]), Image.NEAREST)) >= 1
            inv2 = np.where(good_, 1 / np.maximum(dm * scale, 1e-3), np.maximum(float(ab[0]) * dn + float(ab[1]), 1e-4)); lo2, hi2 = float(inv2.min()), float(inv2.max()); dn = ((inv2 - lo2) / (hi2 - lo2 + 1e-9)).astype(np.float32); ab = np.array([hi2 - lo2, lo2])
        gy, gx = np.mgrid[0:dn.shape[0]:14, 0:dn.shape[1]:14]; z = 1 / np.maximum(float(ab[0]) * dn[gy, gx] + float(ab[1]), 1e-4)
        xc = (gx / (dn.shape[1] - 1) * v['w'] - v['cx']) / v['f'] * z; yc = (gy / (dn.shape[0] - 1) * v['h'] - v['cy']) / v['f'] * z
        info[c] = {'ab': ab, 'dn': dn, 'W': W, 'H': H, 'sx': sx, 'sy': sy, 'cloud': np.stack([xc.ravel(), yc.ravel(), z.ravel()], 1) @ v['R'] + P[c]}
        if i % 25 == 24: print(f'  depth: {i + 1} of {len(chosen)} frames', flush=True)
    # how much of the walk's view the nearby frames really fill, at each point: the view is cut into a grid, and a square counts if a frame shows something there
    v0 = V[chosen[0]]; hw, hh_ = (v0['w'] / 2 / v0['f']) * VIEW[0], (v0['h'] / 2 / v0['f']) * VIEW[1]; cover = []
    for p, f, trio in zip(seg['pos'], seg['fwd'], near3):
        x = np.cross(down, f); x /= np.linalg.norm(x); y = np.cross(f, x); cells = np.zeros((9, 12), bool)
        for c in trio:
            d_ = info[c]['cloud'] - p; zc = d_ @ f; ok = zc > 0.05; cx_ = (d_[ok] @ x) / zc[ok]; cy_ = (d_[ok] @ y) / zc[ok]; m = (np.abs(cx_) < hw) & (np.abs(cy_) < hh_)
            cells[np.clip(((cy_[m] / hh_ + 1) * 4.5).astype(int), 0, 8), np.clip(((cx_[m] / hw + 1) * 6).astype(int), 0, 11)] = True
        cover.append(cells.mean())
    # The parts worth walking are where a frame is near and the view is filled, for at least three units together. What lies
    # between them is still travelled, along the real route, but quickly: the site passes it at speed with the picture
    # streaked by the motion, as a bridge from one room to the next. Anything before the first such part or after the last is dropped.
    good = seg['near'] & (gauss(np.array(cover)[:, None], 0.25 / STEP)[:, 0] > 0.94); walks = []; i = 0
    if opt.get('name') and os.environ.get('WALK_DEBUG'): cv = gauss(np.array(cover)[:, None], 0.25 / STEP)[:, 0]; print('  near', round(float(seg['near'].mean()), 2), 'filled>0.94', round(float((cv > 0.94).mean()), 2), '>0.9', round(float((cv > 0.9).mean()), 2), '>0.85', round(float((cv > 0.85).mean()), 2), 'both', round(float(good.mean()), 2), flush=True)
    while i < len(good):
        if not good[i]: i += 1; continue
        j = i
        while j < len(good) and good[j]: j += 1
        if (j - i) * STEP >= 3.0: walks.append((i, j))
        i = j
    if not walks: continue
    i0, j0 = walks[0][0], walks[-1][1]; rush = np.ones(len(good))
    for i, j in walks: rush[i:j] = 0
    rush = gauss(rush[:, None], 0.35 / STEP)[:, 0]
    used = []
    for trio in near3[i0:j0]:
        for c in trio:
            if c not in used: used.append(c)
    folder = f"{len(tour) + 1:02d}-{opt.get('name', 'walk')}"; os.makedirs(os.path.join(out, folder)); metas, logit = [], {}
    for vi, c in enumerate(used):
        v, I = V[c], info[c]; im = Image.open(os.path.join(photos, v['name'])).convert('RGB'); W, H, dn, ab = I['W'], I['H'], I['dn'], I['ab']
        M = np.eye(4); M[:3, :3] = FM @ v['R'].T @ FM; M[:3, 3] = FM @ P[c]
        hh, ww = dn.shape; dw = 320 if ww >= hh else 240; small = blur(np.asarray(Image.fromarray(dn, mode='F').resize((dw, round(dw * hh / ww)), Image.BILINEAR), np.float32))
        v16 = np.clip(small * 65535, 0, 65535).astype(np.uint16); rgb = np.zeros(v16.shape + (3,), np.uint8); rgb[..., 0] = v16 >> 8; rgb[..., 1] = v16 & 255
        base = f'v{vi:03d}'; buf = io.BytesIO(); Image.fromarray(rgb).save(buf, 'PNG', optimize=True); pack = f'depth-{vi // 12:02d}.png'; at = [os.path.getsize(os.path.join(out, folder, pack)) if vi % 12 else 0, buf.tell()]
        open(os.path.join(out, folder, pack), 'ab' if vi % 12 else 'wb').write(buf.getvalue())          # the depth pictures travel twelve to a file, one after another
        kk = min(1.0, 1152 / max(W, H)); im.resize((round(W * kk), round(H * kk)), Image.LANCZOS).save(os.path.join(out, folder, base + '.webp'), quality=76, method=6)
        z = 1 / np.maximum(float(ab[0]) * dn + float(ab[1]), 1e-4)
        metas.append({'src': base + '.webp', 'depth': pack, 'at': at, 'w': W, 'h': H, 'f': round(v['f'] * I['sx'], 2), 'cx': round(v['cx'] * I['sx'], 2), 'cy': round(v['cy'] * I['sy'], 2), 'A': float(ab[0]), 'B': float(ab[1]),
                      'm': [round(float(x), 5) for x in M.T.flatten()], 'zmed': round(float(np.median(z)), 2), 'znear': round(float(np.percentile(z, 4)), 2), 'from': v['name']})
        if namer: logit[c] = namer(v['name'])
    cams = []
    for p, f, trio, r_ in zip(seg['pos'][i0:j0], seg['fwd'][i0:j0], near3[i0:j0], rush[i0:j0]):
        x = np.cross(down, f); x /= np.linalg.norm(x); y = np.cross(f, x); M = np.eye(4); M[:3, :3] = FM @ np.stack([x, y, f], 1) @ FM; M[:3, 3] = FM @ p
        cams.append({'m': [round(float(x), 5) for x in M.T.flatten()], 'v': used.index(trio[0]), **({'r': round(float(r_), 2)} if r_ > 0.005 else {})})
    chapters = room_names([logit[trio[0]] for trio in near3[i0:j0]]) if namer else []
    json.dump({'views': metas, 'cams': cams, 'chapters': chapters, 'view': VIEW, 'backed': NEARN}, open(os.path.join(out, folder, 'walk.json'), 'w'))
    tour.append({'dir': folder, 'name': opt.get('name', 'walk'), 'photos': len(metas)}); print(f"{folder}: {len(cams) * STEP:.0f} units of path ({float(np.sum(rush[i0:j0] < 0.5)) * STEP:.0f} walked, the rest crossed at speed), {len(metas)} frames, rooms: {[c['label'] for c in chapters]}", flush=True)
json.dump(tour, open(os.path.join(out, 'tour.json'), 'w'), indent=1)
if not tour: print('\nNo stretch of the footage gave a clean walk, so nothing was written. See the note above about the footage.')
else: print(f'\nwritten to {out}. Room names found along the walk are captioned by the site; give them words under "rooms" in site.config.js.')
