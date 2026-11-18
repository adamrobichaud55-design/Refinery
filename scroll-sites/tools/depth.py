# Estimates depth for photographs with Depth Anything V2 (small). python3 -I depth.py <model.onnx> <out-dir> photo...
# Writes <name>.npy: "nearness" per pixel, 0 (far) to 1 (near), at the photo's own shape (longest side about 770).
import sys, os, numpy as np, onnxruntime as ort
from PIL import Image
ort.set_default_logger_severity(3)
s = ort.InferenceSession(sys.argv[1], providers=['CPUExecutionProvider']); name = s.get_inputs()[0].name
mean, std = np.array([0.485, 0.456, 0.406], np.float32), np.array([0.229, 0.224, 0.225], np.float32)
for f in sys.argv[3:]:
    im = Image.open(f).convert('RGB'); k = 770 / max(im.size); w, h = (max(14, round(im.size[0] * k / 14) * 14), max(14, round(im.size[1] * k / 14) * 14))
    a = (np.asarray(im.resize((w, h), Image.BICUBIC), np.float32) / 255.0 - mean) / std
    d = s.run(None, {name: np.ascontiguousarray(a.transpose(2, 0, 1)[None])})[0].squeeze().astype(np.float32)
    d = (d - d.min()) / (d.max() - d.min() + 1e-9)
    np.save(os.path.join(sys.argv[2], os.path.splitext(os.path.basename(f))[0] + '.npy'), d); print(os.path.basename(f), d.shape)
