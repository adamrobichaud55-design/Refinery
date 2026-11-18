# Turns a walkthrough VIDEO, or a dense set of photographs of a whole home, into one smooth walk through it.
#
#   python3 -I tools/recon/build_walk.py <video-file | photos-folder> <work-folder> <site-folder>/walk --model <depth.onnx>
#           [--sparse <existing reconstruction>] [--clip <folder with the room-naming model>] [--fps 3]
#
# Use this when the client hands over a video of someone walking through the home (a phone is fine: walk slowly, hold
# it level and steady, keep moving forward, go through every room once), or hundreds of overlapping photographs.
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
import sys, os, json, shutil, subprocess, re, pickle
import numpy as np
from PIL import Image

args = sys.argv[1:]; opt = {}
for k in ('--model', '--sparse', '--clip', '--fps', '--pitch', '--step', '--name'):
    if k in args: i = args.index(k); opt[k[2:]] = args[i + 1]; del args[i:i + 2]
if len(args) != 3 or 'model' not in opt: sys.exit('usage: build_walk.py <video | photos-folder> <work> <site>/walk --model depth.onnx [--sparse dir] [--clip dir]')
src, work, out = args; os.makedirs(work, exist_ok=True)
PITCH = np.radians(float(opt.get('pitch', 12)))          # how far below level the walk looks: a little, as a person does
STEP = float(opt.get('step', 0.16))                       # spacing of the planned path's points, where a typical distance in the scene is 3
TURN = 1.2                                                # how much walking one radian of turning counts for (as in the viewer)
ROOMS = ['living room', 'kitchen', 'dining room', 'bedroom', 'bathroom', 'home office', 'hallway', 'staircase', 'balcony', 'garden']

# ---- 1. frames, and where each was taken ---------------------------------------------------------------------------
if os.path.isdir(src): photos = src
else:
    photos = os.path.join(work, 'frames')
    if not os.path.isdir(photos):
        os.makedirs(photos); print('cutting the video into frames', flush=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f"fps={opt.get('fps', 3)},scale='min(1600,iw)':-2", '-q:v', '2', os.path.join(photos, 'f%05d.jpg')], check=True)
poses_file = os.path.join(work, 'poses.pkl')
if not os.path.exists(poses_file):
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
        T = im.cam_from_world() if callable(im.cam_from_world) else im.cam_from_world; R, t = np.asarray(T.rotation.matrix()), np.asarray(T.translation); cam = r.cameras[im.camera_id]; xy, z = [], []
        for p in im.points2D:
            if p.has_point3D():
                zc = (R @ r.points3D[p.point3D_id].xyz + t)[2]
                if zc > 0: xy.append(p.xy); z.append(zc)
        if len(z) < 30: continue
        fx = float(cam.params[0]); pin = cam.model.name == 'PINHOLE'; cx, cy = (float(cam.params[2]), float(cam.params[3])) if pin else (float(cam.params[1]), float(cam.params[2]))
        V.append({'name': im.name, 'R': R, 't': t, 'xy': np.array(xy, np.float32), 'z': np.array(z, np.float32), 'f': fx, 'cx': cx, 'cy': cy, 'w': cam.width, 'h': cam.height})
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
segments = []
for a, b in runs:
    S = gauss(P[a:b], 6.0)                                               # the route, with the camera's wandering ironed out
    S = S - np.outer((S - np.median(S, 0)) @ down, down) * 0.85          # and held near one height
    L = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(S, axis=0), axis=1))])
    if L[-1] < 2.0: continue
    s = np.arange(0, L[-1], STEP); Q = np.stack([np.interp(s, L, S[:, k]) for k in range(3)], 1)
    T = gauss(np.gradient(gauss(Q, 0.5 / STEP), axis=0), 1.1 / STEP); T = T - np.outer(T @ down, down); nrm = np.linalg.norm(T, axis=1, keepdims=True)
    T = np.where(nrm > 1e-6, T / np.maximum(nrm, 1e-6), 0)               # the direction of travel
    # The walk looks where the frames near it really look, so there is always a real picture behind the view: at each
    # point, the frame that is close by and faces most nearly the way the walk is going sets the direction, and the
    # directions are then smoothed into slow, even turns of the head.
    pool = np.arange(max(0, a - 40), min(n, b + 40)); lv = np.degrees(np.arcsin(np.clip(FW[pool] @ down, -1, 1))); pool = pool[(lv > -8) & (lv < 38)]
    K = 8; cand, unary = [], []
    for q, t in zip(Q, T):
        c = np.linalg.norm(P[pool] - q, axis=1) + 0.55 * np.arccos(np.clip(FW[pool] @ t, -1, 1)); o = np.argsort(c)[:K]; cand.append(pool[o]); unary.append(c[o])
    # among the nearest few at each point, the chain of frames whose directions change least from one point to the next
    cost = unary[0].copy(); back = []
    for i in range(1, len(Q)):
        tr = 0.9 * np.arccos(np.clip(FW[cand[i - 1]] @ FW[cand[i]].T, -1, 1)); tot = cost[:, None] + tr; back.append(np.argmin(tot, 0)); cost = tot.min(0) + unary[i]
    j = int(np.argmin(cost)); pick = [j]
    for bk in reversed(back): j = int(bk[j]); pick.append(j)
    pick.reverse(); look = np.stack([FW[cand[i][pick[i]]] for i in range(len(Q))])
    F = gauss(look, 1.2 / STEP); F /= np.maximum(np.linalg.norm(F, axis=1, keepdims=True), 1e-6)
    # never staring at the floor or the ceiling: between level and 22 degrees down
    hz = F - np.outer(F @ down, down); hz /= np.maximum(np.linalg.norm(hz, axis=1, keepdims=True), 1e-6); pt = np.clip(np.arcsin(np.clip(F @ down, -1, 1)), np.radians(2), np.radians(22)); F = hz * np.cos(pt)[:, None] + np.outer(np.sin(pt), down)
    # where no frame is close to what the walk would see, the walk is cut: better a change of scene than a view with holes in it
    sc = np.array([np.min(np.linalg.norm(P[pool] - q, axis=1) + TURN * np.arccos(np.clip(FW[pool] @ f, -1, 1))) for q, f in zip(Q, F)]); good = gauss(sc[:, None], 0.3 / STEP)[:, 0] < 0.95
    i = 0
    while i < len(Q):
        if not good[i]: i += 1; continue
        j = i
        while j < len(Q) and good[j]: j += 1
        if (j - i) * STEP >= 3.0: segments.append({'pos': Q[i:j], 'fwd': F[i:j], 'frames': (a, b)})
        i = j
print('path:', [f"{len(s['pos']) * STEP:.0f} units from frames {s['frames'][0]}-{s['frames'][1]}" for s in segments], flush=True)

# ---- 3. the frames along the path, and their depth --------------------------------------------------------------------
level = np.degrees(np.arcsin(np.clip(FW @ down, -1, 1)))
def nearest(p, f, pool):
    sc = np.linalg.norm(P[pool] - p, axis=1) + TURN * np.arccos(np.clip(FW[pool] @ f, -1, 1)); return pool[np.argsort(sc)[:3]], np.sort(sc)[:3]
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
for seg in segments:
    a, b = seg['frames']; pool = np.arange(max(0, a - 40), min(n, b + 40)); pool = pool[(level[pool] > -12) & (level[pool] < 42)]      # frames from this stretch, leaving out shots of the floor and the ceiling
    chosen, near3, cur = [], [], None
    for p, f in zip(seg['pos'], seg['fwd']):
        best, sc = nearest(p, f, pool)
        if cur is None or (np.linalg.norm(P[cur] - p) + TURN * np.arccos(np.clip(FW[cur] @ f, -1, 1))) > 1.4 * sc[0] + 0.12: cur = int(best[0])       # stay with a frame until another is clearly nearer
        trio = [cur] + [int(x) for x in best[:2]]
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
        gy, gx = np.mgrid[0:dn.shape[0]:14, 0:dn.shape[1]:14]; z = 1 / np.maximum(float(ab[0]) * dn[gy, gx] + float(ab[1]), 1e-4)
        xc = (gx / (dn.shape[1] - 1) * v['w'] - v['cx']) / v['f'] * z; yc = (gy / (dn.shape[0] - 1) * v['h'] - v['cy']) / v['f'] * z
        info[c] = {'ab': ab, 'dn': dn, 'W': W, 'H': H, 'sx': sx, 'sy': sy, 'cloud': np.stack([xc.ravel(), yc.ravel(), z.ravel()], 1) @ v['R'] + P[c]}
        if i % 25 == 24: print(f'  depth: {i + 1} of {len(chosen)} frames', flush=True)
    # how much of the walk's view the nearby frames really fill, at each point: the view is cut into a grid, and a square counts if a frame shows something there
    v0 = V[chosen[0]]; hw, hh_ = (v0['w'] / 2 / v0['f']) * 0.62, (v0['h'] / 2 / v0['f']) * 0.8; cover = []
    for p, f, trio in zip(seg['pos'], seg['fwd'], near3):
        x = np.cross(down, f); x /= np.linalg.norm(x); y = np.cross(f, x); cells = np.zeros((9, 12), bool)
        for c in trio:
            d_ = info[c]['cloud'] - p; zc = d_ @ f; ok = zc > 0.05; cx_ = (d_[ok] @ x) / zc[ok]; cy_ = (d_[ok] @ y) / zc[ok]; m = (np.abs(cx_) < hw) & (np.abs(cy_) < hh_)
            cells[np.clip(((cy_[m] / hh_ + 1) * 4.5).astype(int), 0, 8), np.clip(((cx_[m] / hw + 1) * 6).astype(int), 0, 11)] = True
        cover.append(cells.mean())
    good = gauss(np.array(cover)[:, None], 0.25 / STEP)[:, 0] > 0.94; i = 0
    while i < len(good):
        if not good[i]: i += 1; continue
        j = i
        while j < len(good) and good[j]: j += 1
        if (j - i) * STEP >= 3.0:                                           # a stretch worth walking: write it out
            used = []
            for trio in near3[i:j]:
                for c in trio:
                    if c not in used: used.append(c)
            folder = f"{len(tour) + 1:02d}-{opt.get('name', 'walk')}"; os.makedirs(os.path.join(out, folder)); metas, logit = [], {}
            for vi, c in enumerate(used):
                v, I = V[c], info[c]; im = Image.open(os.path.join(photos, v['name'])).convert('RGB'); W, H, dn, ab = I['W'], I['H'], I['dn'], I['ab']
                M = np.eye(4); M[:3, :3] = FM @ v['R'].T @ FM; M[:3, 3] = FM @ P[c]
                hh, ww = dn.shape; dw = 448 if ww >= hh else 336; small = blur(np.asarray(Image.fromarray(dn, mode='F').resize((dw, round(dw * hh / ww)), Image.BILINEAR), np.float32))
                v16 = np.clip(small * 65535, 0, 65535).astype(np.uint16); rgb = np.zeros(v16.shape + (3,), np.uint8); rgb[..., 0] = v16 >> 8; rgb[..., 1] = v16 & 255
                base = f'v{vi:03d}'; Image.fromarray(rgb).save(os.path.join(out, folder, base + '-depth.png'), optimize=True)
                kk = min(1.0, 1152 / max(W, H)); im.resize((round(W * kk), round(H * kk)), Image.LANCZOS).save(os.path.join(out, folder, base + '.webp'), quality=76, method=6)
                z = 1 / np.maximum(float(ab[0]) * dn + float(ab[1]), 1e-4)
                metas.append({'src': base + '.webp', 'depth': base + '-depth.png', 'w': W, 'h': H, 'f': round(v['f'] * I['sx'], 2), 'cx': round(v['cx'] * I['sx'], 2), 'cy': round(v['cy'] * I['sy'], 2), 'A': float(ab[0]), 'B': float(ab[1]),
                              'm': [round(float(x), 5) for x in M.T.flatten()], 'zmed': round(float(np.median(z)), 2), 'znear': round(float(np.percentile(z, 4)), 2), 'from': v['name']})
                if namer: logit[c] = namer(v['name'])
            cams = []
            for p, f, trio in zip(seg['pos'][i:j], seg['fwd'][i:j], near3[i:j]):
                x = np.cross(down, f); x /= np.linalg.norm(x); y = np.cross(f, x); M = np.eye(4); M[:3, :3] = FM @ np.stack([x, y, f], 1) @ FM; M[:3, 3] = FM @ p
                cams.append({'m': [round(float(x), 5) for x in M.T.flatten()], 'v': used.index(trio[0])})
            chapters = room_names([logit[trio[0]] for trio in near3[i:j]]) if namer else []
            json.dump({'views': metas, 'cams': cams, 'chapters': chapters}, open(os.path.join(out, folder, 'walk.json'), 'w'))
            tour.append({'dir': folder, 'name': opt.get('name', 'walk'), 'photos': len(metas)}); print(f"{folder}: {len(cams) * STEP:.0f} units of walk, {len(metas)} frames, rooms: {[c['label'] for c in chapters]}", flush=True)
        i = j
json.dump(tour, open(os.path.join(out, 'tour.json'), 'w'), indent=1)
if not tour: print('\nNo stretch of the footage gave a clean walk, so nothing was written. See the note above about the footage.')
else: print(f'\nwritten to {out}. Room names found along the walk are captioned by the site; give them words under "rooms" in site.config.js.')
