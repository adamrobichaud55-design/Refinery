# Draws a plain, clean model of a scanned home: flat walls standing on the lines of its floor plan, a flat floor and a
# flat ceiling, and nothing else. No furniture, no doors, no detail.
#
#   python3 -I tools/scene/shell_from_scan.py <site-folder>/scene <out.obj>
#
# It is made from the room layout the scene builder writes (rooms.png). It serves two purposes: as a stand-in for an
# architect's model when trying out align_model.py, and as a tidy shell for a home nobody has drawn. The walls run from
# the floor to the ceiling everywhere, so a doorway is an opening the full height of the room.
import sys, os, json
import numpy as np
from PIL import Image

if len(sys.argv) != 3: sys.exit('usage: shell_from_scan.py <scene-folder> <out.obj>')
scene, out = sys.argv[1], sys.argv[2]
S = json.load(open(os.path.join(scene, 'scene.json'))); P = S['plan']; G = P['grid']; cell = G['cell']; H = float(P.get('ceiling', 2.6)); a0, b0 = P['origin']; ca, sa = np.cos(P['turn']), np.sin(P['turn'])
free = np.asarray(Image.open(os.path.join(scene, G['img']))) > 0
def count(m, r):
    p = np.pad(m.astype(np.int32), r); h, w = m.shape; return sum(p[r + dy:r + dy + h, r + dx:r + dx + w] for dy in range(-r, r + 1) for dx in range(-r, r + 1))
lone = free & (count(free, 1) <= 2); free = (free & ~lone) | (~free & (count(free, 1) >= 8))      # single stray squares are tidied; walls, however thin, are left standing
free = np.pad(free, 1); a0 -= cell; b0 -= cell                          # a margin, so every room has an outside
world = lambda a, b, y: (ca * a - sa * b, y, sa * a + ca * b)          # plan (a, b) and height -> the scene's world (y up)
V, F = [], []
def quad(p0, p1, p2, p3):
    n = len(V); V.extend([p0, p1, p2, p3]); F.extend([(n, n + 1, n + 2), (n, n + 2, n + 3)])
hh, ww = free.shape
# walls: wherever floor meets not-floor, a wall stands on that line, facing the room. Lines are followed for as long as they run straight.
for y in range(1, hh):
    for side in (0, 1):                                                 # the room is below the line (0) or above it (1)
        on = (free[y] & ~free[y - 1]) if side == 0 else (free[y - 1] & ~free[y]); x = 0
        while x < ww:
            if not on[x]: x += 1; continue
            e = x
            while e + 1 < ww and on[e + 1]: e += 1
            A, B, b = a0 + x * cell, a0 + (e + 1) * cell, b0 + y * cell
            quad(world(A, b, 0), world(B, b, 0), world(B, b, H), world(A, b, H)) if side == 0 else quad(world(B, b, 0), world(A, b, 0), world(A, b, H), world(B, b, H)); x = e + 1
for x in range(1, ww):
    for side in (0, 1):
        on = (free[:, x] & ~free[:, x - 1]) if side == 0 else (free[:, x - 1] & ~free[:, x]); y = 0
        while y < hh:
            if not on[y]: y += 1; continue
            e = y
            while e + 1 < hh and on[e + 1]: e += 1
            A, B, a = b0 + y * cell, b0 + (e + 1) * cell, a0 + x * cell
            quad(world(a, B, 0), world(a, A, 0), world(a, A, H), world(a, B, H)) if side == 0 else quad(world(a, A, 0), world(a, B, 0), world(a, B, H), world(a, A, H)); y = e + 1
# floor and ceiling: each row of floor squares in runs, and runs that repeat row after row joined into one rectangle
open_ = {}
def close(key, y1):
    x0, x1, y0 = key[0], key[1], open_.pop(key); A, B, C, D = a0 + x0 * cell, a0 + x1 * cell, b0 + y0 * cell, b0 + y1 * cell
    quad(world(A, C, 0), world(A, D, 0), world(B, D, 0), world(B, C, 0)); quad(world(A, C, H), world(B, C, H), world(B, D, H), world(A, D, H))
for y in range(hh + 1):
    runs = set()
    if y < hh:
        x = 0
        while x < ww:
            if not free[y, x]: x += 1; continue
            e = x
            while e + 1 < ww and free[y, e + 1]: e += 1
            runs.add((x, e + 1)); x = e + 1
    for key in [k for k in open_ if k not in runs]: close(key, y)
    for key in runs: open_.setdefault(key, y)
with open(out, 'w') as f:
    f.write('# a plain shell of the home: walls, floor, ceiling. Metres, y up.\n')
    for v in V: f.write(f'v {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n')
    for t in F: f.write(f'f {t[0] + 1} {t[1] + 1} {t[2] + 1}\n')
print(f'{out}: {len(F)} triangles, {free.sum() * cell * cell:.1f} m2 of floor, ceiling at {H:.2f} m')
