# Turns a folder of listing photographs into the 3D house tour a site plays.
#
#   python3 -I tools/recon/build_tour.py <photos-folder> <work-folder> <site-folder>/walk --model <depth-model.onnx>
#
# What it does, in three stages (each keeps its results in the work folder, so a second run is quick):
#   1. Matches the photographs against one another to find the ones that show the same room from different spots,
#      and works out where each of those was taken ("structure from motion").
#   2. Writes <work>/plan.json: the rooms of the tour, in the order of the photographs' file names. A room rebuilt
#      from several photographs lists them in walking order; a photograph that matched nothing becomes a room of its
#      own (the camera walks forward into it). EDIT THIS FILE to rename rooms, reorder them, drop one, or change the
#      photographs and their order, then run the same command again. <work>/sheets/ has a picture of each room's
#      photographs to help.
#   3. Estimates depth for every photograph used, fits it to the room's scale, and writes one folder per room into
#      the site's walk/ folder, plus walk/tour.json (the list of rooms) for the site to load.
#
# Photographs: name them in tour order (01-front.jpg, 02-hall.jpg ...). Several overlapping wide shots of a room,
# taken a few steps apart, give a real walk through it; a single shot gives a short walk into the picture.
# Needs: pip install pycolmap onnxruntime numpy pillow; and the Depth Anything V2 (small) model file, onnx/model.onnx
# from onnx-community/depth-anything-v2-small on Hugging Face (Apache-2.0).
import sys, os, json, shutil, collections, re
import numpy as np
from PIL import Image, ExifTags

args = sys.argv[1:]; opt = {}
while '--model' in args or '--meta' in args or '--f35' in args:
    for k in ('--model', '--meta', '--f35'):
        if k in args: i = args.index(k); opt[k[2:]] = args[i + 1]; del args[i:i + 2]
if len(args) != 3 or 'model' not in opt: sys.exit(__doc__ or 'usage: build_tour.py <photos> <work> <site>/walk --model model.onnx [--meta meta.json] [--f35 22]')
photos, work, out = args; os.makedirs(work, exist_ok=True)
names = sorted(n for n in os.listdir(photos) if re.search(r'\.(jpe?g|png|webp)$', n, re.I))
DEFAULT_F35 = float(opt.get('f35', 22))                  # what to assume for a lone photograph with no lens data: a typical wide listing lens
meta = json.load(open(opt['meta'])) if 'meta' in opt else {}

def f35_of(name):
    """the photograph's 35 mm-equivalent focal length, from --meta or its own EXIF; None when unknown"""
    if (meta.get(name) or {}).get('f35'): return float(meta[name]['f35'])
    try:
        ex = Image.open(os.path.join(photos, name)).getexif(); sub = ex.get_ifd(0x8769)
        v = sub.get(0xA405) or 0                                # FocalLengthIn35mmFilm
        return float(v) or None
    except Exception: return None
slug = lambda s: re.sub(r'[^a-z0-9]+', '-', os.path.splitext(s)[0].lower()).strip('-')

# ---- stage 1: where was each photograph taken? ----------------------------------------------------------------------
sparse = os.path.join(work, 'sparse')
if not os.path.isdir(sparse):
    import pycolmap
    db = os.path.join(work, 'database.db')
    if os.path.exists(db): os.remove(db)
    groups = collections.defaultdict(list)
    for n in names: w, h = Image.open(os.path.join(photos, n)).size; groups[(w, h, f35_of(n))].append(n)
    ex = pycolmap.FeatureExtractionOptions(); ex.sift.max_num_features = 6000; ex.max_image_size = 1707; ex.use_gpu = False
    for (w, h, f35), ns in groups.items():
        ro = pycolmap.ImageReaderOptions(); ro.camera_model = 'SIMPLE_RADIAL'
        if f35: ro.camera_params = f'{max(w, h) * f35 / 36:.2f},{w / 2},{h / 2},0'
        print(f'reading {len(ns)} photographs, {w} x {h}, lens {f35 or "unknown"}', flush=True)
        pycolmap.extract_features(db, photos, image_names=ns, camera_mode=pycolmap.CameraMode.PER_IMAGE, reader_options=ro, extraction_options=ex, device=pycolmap.Device.cpu)
    print('matching every photograph against every other', flush=True)
    mo = pycolmap.FeatureMatchingOptions(); mo.use_gpu = False
    pycolmap.match_exhaustive(db, matching_options=mo, device=pycolmap.Device.cpu)
    print('working out where each was taken', flush=True)
    os.makedirs(sparse); io = pycolmap.IncrementalPipelineOptions(); io.min_model_size = 3; io.multiple_models = True
    pycolmap.incremental_mapping(db, photos, sparse, options=io)

def load_models():
    import pycolmap
    models = {}
    for k in sorted(os.listdir(sparse), key=lambda s: int(s) if s.isdigit() else 0):
        try: rec = pycolmap.Reconstruction(os.path.join(sparse, k))
        except Exception: continue
        views = {}
        for im in rec.images.values():
            T = im.cam_from_world() if callable(im.cam_from_world) else im.cam_from_world
            R, t = np.asarray(T.rotation.matrix()), np.asarray(T.translation); cam = rec.cameras[im.camera_id]; xy, z = [], []
            for p in im.points2D:
                if p.has_point3D():
                    zc = (R @ rec.points3D[p.point3D_id].xyz + t)[2]
                    if zc > 0: xy.append(p.xy); z.append(zc)
            if len(z) >= 30: views[im.name] = {'R': R, 't': t, 'f': float(cam.params[0]), 'cx': float(cam.params[1]), 'cy': float(cam.params[2]), 'xy': np.array(xy), 'z': np.array(z)}
        if len(views) >= 2: models[k] = views
    return models
models = load_models()

def chain(views):
    """the walking order for a room's photographs: wide, level shots only, one per viewpoint, never leaping far"""
    ns = list(views); P = np.array([-views[n]['R'].T @ views[n]['t'] for n in ns]); D = np.array([views[n]['R'].T @ np.array([0, 0, 1.0]) for n in ns])
    zs = np.array([np.median(views[n]['z']) for n in ns]); unit = np.median(zs); P = P / unit * 3
    ang = lambda i, j: float(np.degrees(np.arccos(np.clip(D[i] @ D[j], -1, 1))))
    ok = [i for i in range(len(ns)) if zs[i] >= 0.62 * unit and len(views[ns[i]]['z']) >= 120 and abs(np.degrees(np.arcsin(np.clip(D[i][1], -1, 1)))) < 22]
    keep = []
    for i in sorted(ok, key=lambda i: -len(views[ns[i]]['z'])):
        if all(np.linalg.norm(P[i] - P[j]) > 0.25 or ang(i, j) > 12 for j in keep): keep.append(i)
    if len(keep) < 2: return [[ns[i] for i in keep]] if keep else []
    cost = lambda i, j: np.linalg.norm(P[i] - P[j]) + ang(i, j) / 40; best = None
    for s in keep:
        o = [s]
        while len(o) < len(keep): o.append(min((k for k in keep if k not in o), key=lambda k: cost(o[-1], k)))
        c = sum(cost(a, b) for a, b in zip(o, o[1:]))
        if best is None or c < best[0]: best = (c, o)
    o = best[1]; far = lambda a, b: np.linalg.norm(P[a] - P[b]) > 2.6 or ang(a, b) > 75
    while len(o) > 2 and far(o[-1], o[-2]): o.pop()
    while len(o) > 2 and far(o[0], o[1]): o.pop(0)
    if names.index(ns[o[0]]) > names.index(ns[o[-1]]): o.reverse()          # start from the photograph that comes first in the folder
    # where two neighbours are too far apart for the camera to travel between them with a photograph always in view,
    # the walk is cut there: each stretch becomes a room of its own
    parts = [[o[0]]]
    for a, b in zip(o, o[1:]): (parts.append([b]) if np.linalg.norm(P[a] - P[b]) > 1.6 or ang(a, b) > 42 else parts[-1].append(b))
    return [[ns[i] for i in part] for part in parts]

# ---- stage 2: the plan ------------------------------------------------------------------------------------------------
plan_path = os.path.join(work, 'plan.json')
if not os.path.exists(plan_path):
    rooms, used = [], set()
    for k, views in models.items():
        parts = chain(views); walks = [o for o in parts if len(o) >= 2]
        # a group whose photographs do not chain into a walk still gives one stop: its best-matched photograph
        if not walks and parts: walks = [max(parts, key=lambda o: len(views[o[0]]['z']))]
        for order in walks:
            rooms.append({'name': slug(order[0]), 'model': k, 'photos': order} if len(order) >= 2 else {'name': slug(order[0]), 'photos': order})
        used.update(views)                                                       # close-ups and repeats of a rebuilt room are left out, not shown as rooms of their own
    for n in names:
        if n not in used: rooms.append({'name': slug(n), 'photos': [n]})
    rooms.sort(key=lambda r: min(names.index(p) for p in r['photos']))
    json.dump(rooms, open(plan_path, 'w'), indent=1); print(f'wrote {plan_path}: {len(rooms)} rooms. Edit it to rename, reorder or drop rooms, then run again.')
plan = json.load(open(plan_path))
# a picture of each rebuilt group's photographs, to help with editing the plan
sheets = os.path.join(work, 'sheets'); os.makedirs(sheets, exist_ok=True)
for k, views in models.items():
    f = os.path.join(sheets, f'group-{k}.jpg')
    if os.path.exists(f): continue
    ns = sorted(views); cols = 6; sheet = Image.new('RGB', (cols * 260, ((len(ns) + cols - 1) // cols) * 284), (24, 24, 24))
    from PIL import ImageDraw
    d = ImageDraw.Draw(sheet)
    for i, n in enumerate(ns):
        im = Image.open(os.path.join(photos, n)).convert('RGB'); im.thumbnail((256, 256)); x, y = (i % cols) * 260, (i // cols) * 284; sheet.paste(im, (x + (260 - im.width) // 2, y + (260 - im.height) // 2)); d.text((x + 4, y + 264), n[:40], fill=(255, 255, 0))
    sheet.save(f, quality=80)

# ---- stage 3: depth, and the files the site loads ---------------------------------------------------------------------
import onnxruntime as ort
ort.set_default_logger_severity(3); sess = ort.InferenceSession(opt['model'], providers=['CPUExecutionProvider']); inp = sess.get_inputs()[0].name
MEAN, STD = np.array([0.485, 0.456, 0.406], np.float32), np.array([0.229, 0.224, 0.225], np.float32); dcache = os.path.join(work, 'depth'); os.makedirs(dcache, exist_ok=True)
def nearness(name):
    """how near each part of the photograph is (bigger = nearer), in the depth model's own units; kept between runs"""
    f = os.path.join(dcache, name + '.npy')
    if os.path.exists(f): return np.load(f)
    im = Image.open(os.path.join(photos, name)).convert('RGB'); k = 770 / max(im.size); w, h = round(im.size[0] * k / 14) * 14, round(im.size[1] * k / 14) * 14
    a = (np.asarray(im.resize((w, h), Image.BICUBIC), np.float32) / 255.0 - MEAN) / STD
    d = sess.run(None, {inp: np.ascontiguousarray(a.transpose(2, 0, 1)[None])})[0].squeeze().astype(np.float32); np.save(f, d); return d
def blur(a, n=3):
    for _ in range(n): p = np.pad(a, 1, mode='edge'); a = (p[:-2, 1:-1] + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:] + 4 * p[1:-1, 1:-1]) / 8
    return a

shutil.rmtree(out, ignore_errors=True); os.makedirs(out); tour = []
for n_room, room in enumerate(plan):
    views = models.get(str(room.get('model')), {}) if room.get('model') is not None else {}
    order = [p for p in room['photos'] if os.path.exists(os.path.join(photos, p))]
    rebuilt = len(order) >= 2 and all(p in views for p in order)
    if not rebuilt: order = order[:1]
    if not order: continue
    scale = 3.0 / float(np.median([np.median(views[p]['z']) for p in order])) if rebuilt else 1.0      # a typical distance in the room becomes 3 units
    folder = f"{n_room + 1:02d}-{room['name']}"; os.makedirs(os.path.join(out, folder)); metas = []
    for i, p in enumerate(order):
        im = Image.open(os.path.join(photos, p)).convert('RGB'); W, H = im.size; d = nearness(p); lo, hi = float(d.min()), float(d.max()); dn = (d - lo) / (hi - lo + 1e-9)
        if rebuilt:
            V = views[p]; u = np.clip(V['xy'][:, 0] / W * (d.shape[1] - 1), 0, d.shape[1] - 1); v = np.clip(V['xy'][:, 1] / H * (d.shape[0] - 1), 0, d.shape[0] - 1); ds = dn[np.round(v).astype(int), np.round(u).astype(int)]
            # the depth model gives nearness up to a scale and an offset: fit those to the room's own measured points, ignoring outliers
            A_ = np.stack([ds, np.ones_like(ds)], 1); wt = np.ones(len(ds)); inv = 1 / (V['z'] * scale)
            for _ in range(12): ab, *_ = np.linalg.lstsq(A_ * wt[:, None], inv * wt, rcond=None); r = np.abs(A_ @ ab - inv) / inv; wt = 1 / (1 + (r / 0.08) ** 2)
            A, B = float(ab[0]), float(ab[1]); f, cx, cy = V['f'], V['cx'], V['cy']
            Rw, C = V['R'].T, -V['R'].T @ V['t'] * scale; F = np.diag([1.0, -1.0, -1.0]); M = np.eye(4); M[:3, :3] = F @ Rw @ F; M[:3, 3] = F @ C      # into the viewer's axes: y up, looking down -z
        else:
            f35 = f35_of(p) or DEFAULT_F35; f, cx, cy = max(W, H) * f35 / 36, W / 2, H / 2; M = np.eye(4)
            A, B = 1 - 1 / 14, 1 / 14; s = 3.0 / float(np.median(1 / (A * dn + B))); A, B = A / s, B / s            # nearest thing 1, farthest 14, then scaled so a typical distance is 3
        z = 1 / np.maximum(A * dn + B, 1e-4); hh, ww = z.shape
        # where the walk heads at the end of this view: the far end of the room, looking roughly ahead
        zb = blur(z, 8); win = zb[int(hh * 0.22):int(hh * 0.7), int(ww * 0.2):int(ww * 0.8)]; fy, fx = np.unravel_index(int(np.argmax(win)), win.shape); far = [round((fx + ww * 0.2) / ww, 3), round((fy + hh * 0.22) / hh, 3)]
        zto = float(np.percentile(z[max(0, int(far[1] * hh) - 20):int(far[1] * hh) + 20, max(0, int(far[0] * ww) - 20):int(far[0] * ww) + 20], 15))
        dw = 576 if ww >= hh else 432; small = blur(np.asarray(Image.fromarray(dn, mode='F').resize((dw, round(dw * hh / ww)), Image.BILINEAR), np.float32), 1)
        v16 = np.clip(small * 65535, 0, 65535).astype(np.uint16); rgb = np.zeros(v16.shape + (3,), np.uint8); rgb[..., 0] = v16 >> 8; rgb[..., 1] = v16 & 255
        base = f'v{i:02d}'; Image.fromarray(rgb).save(os.path.join(out, folder, base + '-depth.png'), optimize=True)
        k = min(1.0, 1600 / max(W, H)); im.resize((round(W * k), round(H * k)), Image.LANCZOS).save(os.path.join(out, folder, base + '.webp'), quality=84, method=6)
        metas.append({'src': base + '.webp', 'depth': base + '-depth.png', 'w': W, 'h': H, 'f': round(float(f), 2), 'cx': round(float(cx), 2), 'cy': round(float(cy), 2), 'A': A, 'B': B, 'm': [round(float(x), 5) for x in M.T.flatten()],
                      'far': far, 'zto': round(zto, 2), 'zmed': round(float(np.median(z)), 2), 'znear': round(float(np.percentile(z, 4)), 2), 'from': p})
    json.dump({'views': metas}, open(os.path.join(out, folder, 'walk.json'), 'w'))
    tour.append({'dir': folder, 'name': room['name'], 'photos': len(metas), **({'push': room['push']} if 'push' in room else {})}); print(f"{folder}: {'rebuilt from ' + str(len(metas)) + ' photographs' if rebuilt else 'one photograph'}", flush=True)
json.dump(tour, open(os.path.join(out, 'tour.json'), 'w'), indent=1)
print(f'\n{len(tour)} rooms written to {out}. The site reads walk/tour.json; give each room its words under "tour" in site.config.js, in this order:')
for t in tour: print(f"    {{ label: '{t['name'].replace('-', ' ').title()}', title: '', body: '' }},")
