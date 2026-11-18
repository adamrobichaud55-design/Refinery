# Turns the .npy depth files from depth.py into the 16-bit PNGs the photo walk-through reads (red = high byte, green = low).
#   python3 -I tools/depth-to-png.py <npy-folder> <out-folder> <prefix>      e.g.  ... depth-out property-listing/depth land
import sys, os, glob, numpy as np
from PIL import Image
def blur(a):
    for _ in range(2):
        p = np.pad(a, 1, mode='edge'); a = (p[:-2, 1:-1] + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:] + 4 * p[1:-1, 1:-1]) / 8
    return a
for f in sorted(glob.glob(os.path.join(sys.argv[1], '*.npy'))):
    d = np.load(f); dw = 384 if d.shape[1] >= d.shape[0] else 288
    a = blur(np.asarray(Image.fromarray(d, mode='F').resize((dw, round(dw * d.shape[0] / d.shape[1])), Image.BILINEAR), np.float32))
    v = np.clip(a * 65535, 0, 65535).astype(np.uint16); rgb = np.zeros(v.shape + (3,), np.uint8); rgb[..., 0] = v >> 8; rgb[..., 1] = v & 255
    Image.fromarray(rgb).save(os.path.join(sys.argv[2], f"{sys.argv[3]}-{os.path.basename(f)[:-4]}.png"), optimize=True)
