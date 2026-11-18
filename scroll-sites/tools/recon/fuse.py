# Puts dense depth on each photograph the reconstruction placed, in the reconstruction's own scale, and writes what the
# web viewer needs: for every view its photograph, depth map, lens and position, plus an order to walk them in.
#   python3 -I fuse.py <sparse-model-folder> <images-folder> <depth-model.onnx> <out-folder> [name-prefix]
import sys, os, json, numpy as np, pycolmap, onnxruntime as ort
from PIL import Image
model, imgs, onnx, out = sys.argv[1:5]; prefix = sys.argv[5] if len(sys.argv) > 5 else 'v'
os.makedirs(out, exist_ok=True); ort.set_default_logger_severity(3)
sess = ort.InferenceSession(onnx, providers=['CPUExecutionProvider']); inp = sess.get_inputs()[0].name
mean, std = np.array([0.485, 0.456, 0.406], np.float32), np.array([0.229, 0.224, 0.225], np.float32)
def disparity(im):
    k = 770 / max(im.size); w, h = round(im.size[0] * k / 14) * 14, round(im.size[1] * k / 14) * 14
    a = (np.asarray(im.resize((w, h), Image.BICUBIC), np.float32) / 255.0 - mean) / std
    return sess.run(None, {inp: np.ascontiguousarray(a.transpose(2, 0, 1)[None])})[0].squeeze().astype(np.float32)
rec = pycolmap.Reconstruction(model); views = []; alld = []
for im in sorted(rec.images.values(), key=lambda i: i.name):
    cam = rec.cameras[im.camera_id]; T = im.cam_from_world() if callable(im.cam_from_world) else im.cam_from_world
    R, t = np.asarray(T.rotation.matrix()), np.asarray(T.translation); f, cx, cy, k1 = cam.params[:4]
    xy, z = [], []
    for p in im.points2D:
        if p.has_point3D():
            X = rec.points3D[p.point3D_id].xyz; zc = (R @ X + t)[2]
            if zc > 0: xy.append(p.xy); z.append(zc)
    xy, z = np.array(xy), np.array(z); photo = Image.open(os.path.join(imgs, im.name)).convert('RGB'); d = disparity(photo); W, H = photo.size
    u = np.clip(xy[:, 0] / W * (d.shape[1] - 1), 0, d.shape[1] - 1); v = np.clip(xy[:, 1] / H * (d.shape[0] - 1), 0, d.shape[0] - 1); ds = d[np.round(v).astype(int), np.round(u).astype(int)]
    # the depth model gives nearness up to a scale and an offset: fit those to the reconstruction's own points, ignoring outliers
    A = np.stack([ds, np.ones_like(ds)], 1); w = np.ones(len(z)); inv = 1 / z
    for _ in range(12): ab, *_ = np.linalg.lstsq(A * w[:, None], inv * w, rcond=None); r = np.abs(A @ ab - inv) / inv; w = 1 / (1 + (r / 0.08) ** 2)
    err = float(np.median(np.abs(1 / np.maximum(A @ ab, 1e-6) - z) / z)); alld.append(np.median(z))
    views.append({'name': im.name, 'W': W, 'H': H, 'f': float(f), 'cx': float(cx), 'cy': float(cy), 'k1': float(k1), 'R': R, 't': t, 'd': d, 'ab': ab, 'n': len(z), 'err': err})
    print(f"{im.name}: {len(z)} points, lens f={f:.0f} k={k1:+.3f}, depth fits to {100 * err:.1f}%", flush=True)
s = 3.0 / float(np.median(alld))                       # rescale the whole scene so a typical distance is 3 units
meta = []
for i, V in enumerate(views):
    d = V['d']; lo, hi = float(d.min()), float(d.max()); dn = (d - lo) / (hi - lo + 1e-9)
    a, b = V['ab']; A2, B2 = a * (hi - lo) / s, (a * lo + b) / s          # 1/z (scene units) = A2 * dn + B2
    dw = 384 if d.shape[1] >= d.shape[0] else 288; img = Image.fromarray(dn, mode='F').resize((dw, round(dw * d.shape[0] / d.shape[1])), Image.BILINEAR)
    v16 = np.clip(np.asarray(img) * 65535, 0, 65535).astype(np.uint16); rgb = np.zeros(v16.shape + (3,), np.uint8); rgb[..., 0] = v16 >> 8; rgb[..., 1] = v16 & 255
    base = f"{prefix}{i:02d}"; Image.fromarray(rgb).save(os.path.join(out, base + '-depth.png'), optimize=True)
    Image.open(os.path.join(imgs, V['name'])).convert('RGB').save(os.path.join(out, base + '.webp'), quality=84, method=6)
    Rw, C = V['R'].T, -V['R'].T @ V['t'] * s              # camera to world; then into the viewer's axes (y up, looking down -z)
    F = np.diag([1.0, -1.0, -1.0]); M = np.eye(4); M[:3, :3] = F @ Rw @ F; M[:3, 3] = F @ C
    meta.append({'src': base + '.webp', 'depth': base + '-depth.png', 'w': V['W'], 'h': V['H'], 'f': V['f'], 'cx': V['cx'], 'cy': V['cy'], 'A': float(A2), 'B': float(B2), 'm': [round(float(x), 5) for x in M.T.flatten()], 'from': V['name'], 'fit': round(V['err'], 3)})
# an order to walk the views in: start at one end, then always the nearest unvisited view (by position and by direction of gaze)
P = np.array([m['m'][12:15] for m in meta]); Dv = np.array([[-m['m'][8], -m['m'][9], -m['m'][10]] for m in meta])
cost = lambda i, j: np.linalg.norm(P[i] - P[j]) + 1.5 * np.arccos(np.clip(Dv[i] @ Dv[j], -1, 1))
start = int(np.argmax(np.linalg.norm(P - P.mean(0), axis=1))); order = [start]
while len(order) < len(meta): j = min((k for k in range(len(meta)) if k not in order), key=lambda k: cost(order[-1], k)); order.append(j)
json.dump({'views': meta, 'path': order}, open(os.path.join(out, 'walk.json'), 'w'))
print('walk order:', [meta[i]['from'] for i in order])
