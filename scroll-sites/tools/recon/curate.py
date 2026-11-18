# Picks the walk through one reconstructed group: wide, level photographs only (no close-ups, no shots of the ceiling),
# one per viewpoint, in an order that never jumps far. Copies just those views into the site.
#   python3 -I curate.py <fused-folder> <site-walk-folder> [--path 3,0,7 to choose the views and order by hand]
import sys, os, json, shutil, numpy as np
src, dst = sys.argv[1], sys.argv[2]; hand = [int(x) for x in sys.argv[sys.argv.index('--path') + 1].split(',')] if '--path' in sys.argv else None
w = json.load(open(os.path.join(src, 'walk.json'))); V = w['views']
P = np.array([v['m'][12:15] for v in V]); D = np.array([[-v['m'][8], -v['m'][9], -v['m'][10]] for v in V]); ang = lambda i, j: float(np.degrees(np.arccos(np.clip(D[i] @ D[j], -1, 1))))
if hand: order = hand
else:
    zm = np.median([v['zmed'] for v in V]); ok = [i for i, v in enumerate(V) if v['zmed'] >= 0.62 * zm and v['n'] >= 120 and abs(np.degrees(np.arcsin(np.clip(D[i][1], -1, 1)))) < 22 and v['fit'] < 0.06]
    keep = []
    for i in sorted(ok, key=lambda i: -V[i]['n']):                      # one photograph per viewpoint: the best-matched
        if all(np.linalg.norm(P[i] - P[j]) > 0.25 or ang(i, j) > 12 for j in keep): keep.append(i)
    cost = lambda i, j: np.linalg.norm(P[i] - P[j]) + ang(i, j) / 40
    best = None
    for start in keep:                                                   # the shortest chain through them all
        o = [start]
        while len(o) < len(keep): o.append(min((k for k in keep if k not in o), key=lambda k: cost(o[-1], k)))
        c = sum(cost(a, b) for a, b in zip(o, o[1:]))
        if best is None or c < best[0]: best = (c, o)
    order = best[1]
    while len(order) > 2 and (np.linalg.norm(P[order[-1]] - P[order[-2]]) > 2.6 or ang(order[-1], order[-2]) > 75): order.pop()   # no long leap at the end
    while len(order) > 2 and (np.linalg.norm(P[order[0]] - P[order[1]]) > 2.6 or ang(order[0], order[1]) > 75): order.pop(0)
shutil.rmtree(dst, ignore_errors=True); os.makedirs(dst)
views = []
for i in order: v = V[i]; shutil.copy(os.path.join(src, v['src']), dst); shutil.copy(os.path.join(src, v['depth']), dst); views.append(v)
json.dump({'views': views, 'path': list(range(len(views)))}, open(os.path.join(dst, 'walk.json'), 'w'))
print(os.path.basename(dst), 'path', order, 'steps', [f"{np.linalg.norm(P[a] - P[b]):.1f}/{ang(a, b):.0f}deg" for a, b in zip(order, order[1:])])
