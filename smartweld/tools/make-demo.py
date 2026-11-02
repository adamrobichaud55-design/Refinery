"""Assemble the SmartWeld AI demo folder (downloads/smartweld-demo/) and its zip from the committed project:
viewer (static build), data, docs, screenshots, source, README and a MANIFEST with SHA-256 per file.
Run after `npm run build`. Uses only the Python standard library."""
import hashlib, json, os, shutil, subprocess, sys, zipfile
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(root, 'downloads', 'smartweld-demo')
shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
cp = lambda a, b: shutil.copytree(os.path.join(root, a), os.path.join(out, b)) if os.path.isdir(os.path.join(root, a)) else (os.makedirs(os.path.dirname(os.path.join(out, b)), exist_ok=True), shutil.copy2(os.path.join(root, a), os.path.join(out, b)))
cp('dist', 'viewer')
cp('public/plant-piping.json', 'data/plant-piping.json')
for d in ['groundtruth', 'isometrics', 'isometrics-imported', 'workorders']: cp(f'public/{d}', f'data/{d}')
for f in ['DESIGN_BASIS.md', 'PROVENANCE.md', 'IP_REVIEW.md', 'THIRD_PARTY_NOTICES.md']: cp(f, f'docs/{f}')
cp('README.md', 'docs/PROJECT_README.md')
cp('screenshots', 'screenshots')
# source: the committed project without generated data, screenshots or downloads (they are in data/ and screenshots/)
src = os.path.join(out, 'source'); os.makedirs(src)
arch = subprocess.run(['git', 'archive', '--format=tar', 'HEAD', '.'], cwd=root, capture_output=True, check=True).stdout
import io, tarfile
with tarfile.open(fileobj=io.BytesIO(arch)) as t:
    t.extractall(src, members=[m for m in t.getmembers() if not m.name.startswith(('public/', 'screenshots/', 'downloads/'))], filter='data')
commit = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=root, capture_output=True, text=True, check=True).stdout.strip()
shutil.copy2(os.path.join(root, 'tools', 'demo-README.md'), os.path.join(out, 'README.md'))
# manifest
files = []
for base, _, names in os.walk(out):
    for n in sorted(names):
        p = os.path.join(base, n); rel = os.path.relpath(p, out).replace(os.sep, '/')
        files.append({'path': rel, 'bytes': os.path.getsize(p), 'sha256': hashlib.sha256(open(p, 'rb').read()).hexdigest()})
files.sort(key=lambda f: f['path'])
count = lambda prefix: sum(1 for f in files if f['path'].startswith(prefix))
manifest = {'name': 'SmartWeld AI demonstration plant', 'sourceCommit': commit, 'files': len(files), 'bytes': sum(f['bytes'] for f in files),
  'contents': {'viewer': count('viewer/'), 'data/groundtruth/lines': count('data/groundtruth/lines/'), 'data/isometrics': count('data/isometrics/'), 'data/isometrics-imported': count('data/isometrics-imported/'), 'data/workorders (json+html+pdf)': count('data/workorders/'), 'docs': count('docs/'), 'screenshots': count('screenshots/'), 'source': count('source/')},
  'notice': 'Welding, NDE and test content is DEMONSTRATION ONLY - NOT A QUALIFIED PROCEDURE; the facility owner\'s qualified procedures and applicable codes govern.', 'list': files}
json.dump(manifest, open(os.path.join(out, 'MANIFEST.json'), 'w'), indent=1)
zp = os.path.join(root, 'downloads', 'smartweld-demo.zip')
if os.path.exists(zp): os.remove(zp)
with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
    for base, _, names in os.walk(out):
        for n in names: p = os.path.join(base, n); z.write(p, os.path.join('smartweld-demo', os.path.relpath(p, out)))
print(json.dumps({k: v for k, v in manifest.items() if k != 'list'}, indent=1)); print('zip', zp, os.path.getsize(zp))
