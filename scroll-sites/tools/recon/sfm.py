# Structure from motion: works out where each photograph was taken and a sparse 3D model of what they show.
#   python3 -I sfm.py <images-folder> <meta.json> <work-folder>
# meta.json gives each photograph's 35 mm-equivalent focal length (from its EXIF), which fixes the lens up front.
import sys, os, json, shutil, collections, pycolmap
from PIL import Image
imgs, meta, work = sys.argv[1], json.load(open(sys.argv[2])), sys.argv[3]
os.makedirs(work, exist_ok=True); db = os.path.join(work, 'database.db')
if os.path.exists(db): os.remove(db)
groups = collections.defaultdict(list)
for n in sorted(os.listdir(imgs)):
    w, h = Image.open(os.path.join(imgs, n)).size; f35 = (meta.get(n) or {}).get('f35') or 24
    groups[(w, h, f35)].append(n)
ex = pycolmap.FeatureExtractionOptions(); ex.sift.max_num_features = 6000; ex.max_image_size = 1707; ex.use_gpu = False; ex.num_threads = 4
for (w, h, f35), names in groups.items():
    ro = pycolmap.ImageReaderOptions(); ro.camera_model = 'SIMPLE_RADIAL'; ro.camera_params = f'{max(w, h) * f35 / 36:.2f},{w / 2},{h / 2},0'
    print('extracting', len(names), 'photos', w, 'x', h, f35, 'mm', flush=True)
    pycolmap.extract_features(db, imgs, image_names=names, camera_mode=pycolmap.CameraMode.PER_IMAGE, reader_options=ro, extraction_options=ex, device=pycolmap.Device.cpu)
print('matching', flush=True)
mo = pycolmap.FeatureMatchingOptions(); mo.use_gpu = False; mo.num_threads = 4
pycolmap.match_exhaustive(db, matching_options=mo, device=pycolmap.Device.cpu)
print('mapping', flush=True)
sparse = os.path.join(work, 'sparse'); shutil.rmtree(sparse, ignore_errors=True); os.makedirs(sparse)
io = pycolmap.IncrementalPipelineOptions(); io.min_model_size = 5; io.multiple_models = True; io.num_threads = 4
recs = pycolmap.incremental_mapping(db, imgs, sparse, options=io)
for k, r in recs.items():
    names = sorted(im.name for im in r.images.values() if im.has_pose) if hasattr(next(iter(r.images.values())), 'has_pose') else sorted(im.name for im in r.images.values())
    print(f'model {k}: {len(names)} photos, {len(r.points3D)} points, mean error {r.compute_mean_reprojection_error():.2f} px')
    print('  ', collections.Counter(n[4:-4] for n in names).most_common(12))
