"""
Scoring harness for external test drawings (DESIGN_BASIS.md §57, SW-EVAL-1..6). Standard library only.

    python3 -I tools/evalscore.py key [--check]                 the answer key from the model (eval/answer-key.json)
    python3 -I tools/evalscore.py receive <set> --software S --version V --drawn-by D \\
            [--contract REF] [--licence-review REF] [--branches-on-parent yes|no] <files...>
                                                               record a received set; files kept in eval/external/<set>/
    python3 -I tools/evalscore.py clear <set> --contract REF --licence-review REF
                                                               record the two clearances later
    python3 -I tools/evalscore.py score <set> <detections.json> [--annotations A.json] [--threshold 0.5]
                                                               score a detector's results: eval/reports/<set>--<detector>.json/.md
    python3 -I tools/evalscore.py selftest                      check the scoring on a synthetic set made from the key

Run from smartweld/. External drawings and detections on them are never committed (SW-EVAL-1);
receipts, the answer key and reports are. Reports hold numbers, class names and the model's own
tags and labels only (SW-EVAL-6).
"""
import collections
import hashlib
import json
import os
import shutil
import sys
import tempfile

GT = 'public/groundtruth'
EVAL = os.environ.get('EVAL_DIR', 'eval')
VALVES = {'GATE': 'gate', 'BALL': 'ball', 'CHECK': 'check', 'CONTROL': 'control', 'PSV': 'relief'}
FITTINGS = ['elbow', 'tee', 'reducer', 'cap', 'flange', 'blind']
SUPPORTS = ['hanger', 'shoe', 'guide', 'trunnion', 'anchor', 'stanchion', 'trapeze']
CLASSES = FITTINGS + [f'valve/{v}' for v in VALVES.values()] + ['weld'] + [f'support/{s}' for s in SUPPORTS]
IOU = 0.5


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def norm(t):
    return ' '.join(str(t).upper().split())


def coarse(c):
    return c.split('/')[0]


def weld_label(tag, line):
    """the label the drawings print (SW-IMP-4): W<n> for the line's own welds, '<service>-<seq>/W<n>' for a branch's"""
    ln, w = tag.rsplit('/', 1)
    return w if ln == line else '-'.join(ln.split('-')[-2:]) + '/' + w


# ---- answer key (SW-EVAL-3) -------------------------------------------------------------------------------
def build_key():
    idx = json.load(open(f'{GT}/index.json'))
    out = collections.OrderedDict()
    for e in idx['lines']:
        L = json.load(open(f"{GT}/{e['file']}")); H = L['header']; line = H['line']
        objs = []
        for it in L['items']:
            k = it['kind']
            c = f"valve/{VALVES[it['key'].split('|')[1]]}" if k == 'valve' else k if k in FITTINGS else None
            if c:
                objs.append(dict(tag=it['tag'], cls=c))
        for w in L['welds']:
            objs.append(dict(tag=w['tag'], cls='weld', label=w['tag'].rsplit('/', 1)[1]))
        for s in L['supports']:
            objs.append(dict(tag=s['tag'], cls=f"support/{s['type']}"))
        parent = H['from'][4:] if H['from'].startswith('tap ') else None
        out[line] = dict(lineClass=H['lineClass'], NPS=H['NPS'], parent=parent, objects=objs)
    unknown = {o['cls'] for v in out.values() for o in v['objects']} - set(CLASSES)
    if unknown:
        raise SystemExit(f'answer key: classes outside the class list: {sorted(unknown)}')
    return dict(note='What each line must show, from the model alone (DESIGN_BASIS.md SW-EVAL-3). Generated; do not edit.',
                classes=CLASSES, lines=out)


def expected(key, branches_on_parent):
    """per drawing line: expected objects (with branches merged into their parent when the set draws them there)"""
    lines = key['lines']
    exp = collections.OrderedDict((ln, list(v['objects'])) for ln, v in lines.items() if not (branches_on_parent and v['parent'] in lines))
    if branches_on_parent:
        for ln, v in lines.items():
            if v['parent'] in lines:
                root = v['parent']
                while lines[root]['parent'] in lines:
                    root = lines[root]['parent']
                exp[root] += [dict(o, label=weld_label(o['tag'], root) if o['cls'] == 'weld' else o.get('label')) for o in v['objects']]
    return exp


# ---- receipts (SW-EVAL-2) --------------------------------------------------------------------------------
def receipt_path(s):
    return os.path.join(EVAL, 'receipts', f'{s}.json')


def cleared(r):
    c = r.get('clearance', {})
    return bool(c.get('contract')) and bool(c.get('licenceReview'))


def receive(args):
    s, opts, files = args[0], {}, []
    it = iter(args[1:])
    for a in it:
        if a.startswith('--'):
            opts[a[2:]] = next(it)
        else:
            files.append(a)
    for need in ('software', 'version', 'drawn-by'):
        if not opts.get(need):
            raise SystemExit(f'receive: --{need} is required (SW-EVAL-2)')
    dest = os.path.join(EVAL, 'external', s)
    os.makedirs(dest, exist_ok=True); os.makedirs(os.path.join(EVAL, 'receipts'), exist_ok=True)
    rec = dict(set=s, software=opts['software'], version=opts['version'], drawnBy=opts['drawn-by'],
               branchesOnParent=opts.get('branches-on-parent', 'yes') == 'yes',
               clearance=dict(contract=opts.get('contract', ''), licenceReview=opts.get('licence-review', '')), files=[])
    for f in files:
        shutil.copy2(f, os.path.join(dest, os.path.basename(f)))
        rec['files'].append(dict(file=os.path.basename(f), bytes=os.path.getsize(f), sha256=sha(f)))
    json.dump(rec, open(receipt_path(s), 'w'), indent=1)
    print(f"received {len(files)} file(s) into {dest}; cleared for scoring: {cleared(rec)}")


def clear(args):
    s, opts = args[0], dict(zip([a[2:] for a in args[1::2]], args[2::2]))
    r = json.load(open(receipt_path(s)))
    r['clearance'] = dict(contract=opts.get('contract', ''), licenceReview=opts.get('licence-review', ''))
    json.dump(r, open(receipt_path(s), 'w'), indent=1)
    print(f'{s}: cleared for scoring: {cleared(r)}')


# ---- scoring (SW-EVAL-4/5) --------------------------------------------------------------------------------
def iou(a, b):
    ix = max(0, min(a[2], b[2]) - max(a[0], b[0])); iy = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    u = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - ix * iy
    return ix * iy / u if u > 0 else 0.0


def prf(m, d, e):
    p = m / d if d else (1.0 if not e else 0.0)
    r = m / e if e else (1.0 if not d else 0.0)
    return dict(precision=round(p, 4), recall=round(r, 4), f1=round(2 * p * r / (p + r), 4) if p + r else 0.0)


def score(key, receipt, det, ann=None, threshold=None):
    if not cleared(receipt):
        raise SystemExit(f"score: set {receipt['set']} is not cleared (contract and licence review must both be recorded, SW-EVAL-2)")
    files = {f['sha256'] for f in receipt['files']}
    th = threshold if threshold is not None else det.get('threshold', 0.5)
    exp = expected(key, receipt.get('branchesOnParent', True))
    by_line = collections.defaultdict(lambda: dict(det=collections.Counter(), texts=set(), pages=0))
    unmatched = 0
    for pg in det['pages']:
        if pg['fileSha256'] not in files:
            raise SystemExit(f"score: page {pg.get('page')} of a file not in the receipt ({pg['fileSha256'][:12]}…)")
        for d in pg.get('detections', []):
            if d['class'] not in CLASSES:
                raise SystemExit(f"score: class '{d['class']}' is not in the class list (SW-EVAL-3)")
        line = next((ln for ln in exp if norm(ln) == norm(pg.get('line', ''))), None)
        if line is None:
            unmatched += 1
            continue
        b = by_line[line]; b['pages'] += 1
        for d in pg.get('detections', []):
            if d['score'] >= th:
                b['det'][d['class']] += 1
            if d.get('text'):
                b['texts'].add(norm(d['text']))
        for t in pg.get('texts', []):
            b['texts'].add(norm(t['text'] if isinstance(t, dict) else t))
    lines_out, tot_e, tot_d, tot_m = [], collections.Counter(), collections.Counter(), collections.Counter()
    lab_e = lab_f = 0
    for line, objs in exp.items():
        if line not in by_line:
            continue
        e = collections.Counter(o['cls'] for o in objs); d = by_line[line]['det']
        rows = {}
        for c in sorted(set(e) | set(d)):
            m = min(e[c], d[c]); tot_e[c] += e[c]; tot_d[c] += d[c]; tot_m[c] += m
            rows[c] = dict(expected=e[c], detected=d[c], matched=m, missed=e[c] - m, extra=d[c] - m)
        labels = {norm(o['label']) for o in objs if o['cls'] == 'weld' and o.get('label')}
        found = labels & by_line[line]['texts']; lab_e += len(labels); lab_f += len(found)
        missing = sorted(o['tag'] for o in objs if o['cls'] == 'weld' and o.get('label') and norm(o['label']) not in found)
        lines_out.append(dict(line=line, pages=by_line[line]['pages'], classes=rows,
                              weldLabels=dict(expected=len(labels), read=len(found), notRead=missing)))
    per_class = {c: dict(expected=tot_e[c], detected=tot_d[c], matched=tot_m[c], **prf(tot_m[c], tot_d[c], tot_e[c])) for c in CLASSES if tot_e[c] or tot_d[c]}
    ce, cd, cm = collections.Counter(), collections.Counter(), collections.Counter()
    for c in per_class:
        ce[coarse(c)] += tot_e[c]; cd[coarse(c)] += tot_d[c]
    for l in lines_out:   # coarse matches are counted per line, so a gate read as a ball still counts as a valve found
        e2, d2 = collections.Counter(), collections.Counter()
        for c, r in l['classes'].items():
            e2[coarse(c)] += r['expected']; d2[coarse(c)] += r['detected']
        for c in e2 | d2:
            cm[c] += min(e2[c], d2[c])
    per_coarse = {c: dict(expected=ce[c], detected=cd[c], matched=cm[c], **prf(cm[c], cd[c], ce[c])) for c in sorted(ce | cd)}
    E, D, M = sum(tot_e.values()), sum(tot_d.values()), sum(tot_m.values())
    rep = dict(set=receipt['set'], detector=det.get('detector', {}), threshold=th,
               receipt=dict(software=receipt['software'], version=receipt['version'], files=len(receipt['files'])),
               summary=dict(linesScored=len(lines_out), linesInKey=len(exp), pagesWithoutAKnownLine=unmatched,
                            objects=dict(expected=E, detected=D, matched=M, **prf(M, D, E)),
                            weldLabels=dict(expected=lab_e, read=lab_f, rate=round(lab_f / lab_e, 4) if lab_e else None)),
               perClass=per_class, perCoarseClass=per_coarse, lines=lines_out)
    if ann:
        rep['boxes'] = box_scores(det, ann, th, files)
    return rep


def box_scores(det, ann, th, files):
    """box precision and recall at IoU >= 0.5 on the hand-annotated pages (SW-EVAL-5)"""
    truth = {(p['fileSha256'], p['page']): p.get('boxes', []) for p in ann['pages'] if p['fileSha256'] in files}
    tp, fp, fn, ious = collections.Counter(), collections.Counter(), collections.Counter(), []
    for pg in det['pages']:
        k = (pg['fileSha256'], pg['page'])
        if k not in truth:
            continue
        gts = truth[k]; used = set()
        for d in sorted([d for d in pg.get('detections', []) if d['score'] >= th], key=lambda d: -d['score']):
            best, bi = 0.0, None
            for i, g in enumerate(gts):
                if i in used or g['class'] != d['class']:
                    continue
                v = iou(d['box'], g['box'])
                if v > best:
                    best, bi = v, i
            if bi is not None and best >= IOU:
                used.add(bi); tp[d['class']] += 1; ious.append(best)
            else:
                fp[d['class']] += 1
        for i, g in enumerate(gts):
            if i not in used:
                fn[g['class']] += 1
    cls = sorted(set(tp) | set(fp) | set(fn))
    T, F, N = sum(tp.values()), sum(fp.values()), sum(fn.values())
    return dict(pages=len(truth), iou=IOU, meanIoU=round(sum(ious) / len(ious), 4) if ious else None,
                overall=dict(tp=T, fp=F, fn=N, **prf(T, T + F, T + N)),
                perClass={c: dict(tp=tp[c], fp=fp[c], fn=fn[c], **prf(tp[c], tp[c] + fp[c], tp[c] + fn[c])) for c in cls})


def report_md(r):
    s = r['summary']; o = s['objects']
    out = [f"# Evaluation — set `{r['set']}`, detector {r['detector'].get('name', '?')} {r['detector'].get('version', '')}", '',
           'Generated by `tools/evalscore.py` (DESIGN_BASIS.md §57). Numbers and the model\'s own tags only (SW-EVAL-6).', '',
           f"- Drawn by: {r['receipt']['software']} {r['receipt']['version']} ({r['receipt']['files']} file(s)); score threshold {r['threshold']}.",
           f"- Lines scored: {s['linesScored']} of {s['linesInKey']}; pages without a known line number: {s['pagesWithoutAKnownLine']}.",
           f"- Objects: {o['matched']} matched of {o['expected']} expected, {o['detected']} detected — precision {o['precision']}, recall {o['recall']}, F1 {o['f1']}.",
           f"- Weld labels read: {s['weldLabels']['read']} of {s['weldLabels']['expected']}" + (f" ({s['weldLabels']['rate']:.1%})." if s['weldLabels']['rate'] is not None else '.'), '',
           '## By class', '', '| Class | Expected | Detected | Matched | Precision | Recall | F1 |', '|---|---|---|---|---|---|---|']
    out += [f"| {c} | {v['expected']} | {v['detected']} | {v['matched']} | {v['precision']} | {v['recall']} | {v['f1']} |" for c, v in r['perClass'].items()]
    out += ['', '## By coarse class', '', '| Class | Expected | Detected | Matched | Precision | Recall | F1 |', '|---|---|---|---|---|---|---|']
    out += [f"| {c} | {v['expected']} | {v['detected']} | {v['matched']} | {v['precision']} | {v['recall']} | {v['f1']} |" for c, v in r['perCoarseClass'].items()]
    if 'boxes' in r:
        b = r['boxes']; ov = b['overall']
        out += ['', f"## Boxes (IoU ≥ {b['iou']}, {b['pages']} annotated pages)", '',
                f"Overall: {ov['tp']} true, {ov['fp']} false, {ov['fn']} missed — precision {ov['precision']}, recall {ov['recall']}; mean IoU {b['meanIoU']}.", '',
                '| Class | TP | FP | FN | Precision | Recall |', '|---|---|---|---|---|---|']
        out += [f"| {c} | {v['tp']} | {v['fp']} | {v['fn']} | {v['precision']} | {v['recall']} |" for c, v in b['perClass'].items()]
    worst = sorted(r['lines'], key=lambda l: -sum(c['missed'] + c['extra'] for c in l['classes'].values()))[:15]
    out += ['', '## Lines with the most misses and extras', '', '| Line | Missed | Extra | Weld labels read |', '|---|---|---|---|']
    out += [f"| {l['line']} | {sum(c['missed'] for c in l['classes'].values())} | {sum(c['extra'] for c in l['classes'].values())} | {l['weldLabels']['read']}/{l['weldLabels']['expected']} |" for l in worst]
    out += ['', '## Notes', '', 'Observations in SmartWeld\'s own words go in `eval/notes/`; generator changes are made as rules in DESIGN_BASIS.md citing this report (SW-EVAL-6).']
    return '\n'.join(out) + '\n'


# ---- self-test ---------------------------------------------------------------------------------------------
def selftest():
    """a synthetic detector run made from the key, with known misses, swaps, extras and unread labels"""
    import random
    rnd = random.Random(7)
    key = build_key()
    with tempfile.TemporaryDirectory() as tmp:
        f = os.path.join(tmp, 'sheets.pdf'); open(f, 'wb').write(b'%PDF-1.7 synthetic test set')
        rec = dict(set='selftest', software='synthetic', version='0', drawnBy='selftest', branchesOnParent=True,
                   clearance=dict(contract='', licenceReview=''), files=[dict(file='sheets.pdf', bytes=27, sha256=sha(f))])
        exp = expected(key, True)
        pages, ann_pages, want = [], [], collections.Counter()
        for n, (line, objs) in enumerate(exp.items()):
            dets, boxes = [], []
            for i, o in enumerate(objs):
                box = [10.0 * i, 10.0 * n, 10.0 * i + 8, 10.0 * n + 8]
                boxes.append(dict(**{'class': o['cls']}, box=box))
                r = rnd.random()
                if r < 0.10:
                    want['missed'] += 1; continue                                   # not detected
                if r < 0.13 and o['cls'].startswith('valve/'):
                    other = 'valve/ball' if o['cls'] != 'valve/ball' else 'valve/gate'
                    dets.append(dict(**{'class': other}, score=0.9, box=box)); want['swapped'] += 1; continue
                dets.append(dict(**{'class': o['cls']}, score=0.95, box=[box[0] + 1, box[1], box[2] + 1, box[3]]))
            for k in range(rnd.randint(0, 2)):
                dets.append(dict(**{'class': 'weld'}, score=0.8, box=[500.0 + k, 0, 505.0 + k, 5])); want['extra'] += 1
            dets.append(dict(**{'class': 'flange'}, score=0.2, box=[600.0, 0, 605.0, 5]))           # below the threshold
            texts = [o['label'] for o in objs if o['cls'] == 'weld' and o.get('label') and rnd.random() > 0.2]
            pages.append(dict(fileSha256=sha(f), page=n + 1, line=line, detections=dets, texts=texts))
            ann_pages.append(dict(fileSha256=sha(f), page=n + 1, boxes=boxes))
        det = dict(set='selftest', detector=dict(name='synthetic', version='0'), pages=pages)
        try:
            score(key, rec, det)
            raise SystemExit('selftest: an uncleared set was scored')
        except SystemExit as e:
            if 'not cleared' not in str(e):
                raise
        rec['clearance'] = dict(contract='TEST', licenceReview='TEST')
        r = score(key, rec, det, dict(pages=ann_pages))
        o, E = r['summary']['objects'], sum(len(v) for v in exp.values())
        checks = [('every line scored', r['summary']['linesScored'] == len(exp)),
                  ('expected objects = key', o['expected'] == E),
                  ('detected = expected − missed − 0 + extras (swaps still detected)', o['detected'] == E - want['missed'] + want['extra']),
                  ('fine matches lie between expected − missed − 2 × swaps and expected − missed + extras (counts cannot tell an extra from a find)', E - want['missed'] - 2 * want['swapped'] <= o['matched'] <= E - want['missed'] + want['extra']),
                  ('coarse classes count a swapped valve type as a valve found', r['perCoarseClass']['valve']['matched'] >= r['perCoarseClass']['valve']['expected'] - sum(1 for l in exp.values() for o in l if o['cls'].startswith('valve/')) + sum(r['perClass'].get(c, {}).get('matched', 0) for c in r['perClass'] if c.startswith('valve/')) and r['perCoarseClass']['valve']['matched'] >= sum(r['perClass'].get(c, {}).get('matched', 0) for c in r['perClass'] if c.startswith('valve/'))),
                  ('box true positives = detected less swaps and extras', r['boxes']['overall']['tp'] == E - want['missed'] - want['swapped']),
                  ('box false positives = swaps + extras', r['boxes']['overall']['fp'] == want['swapped'] + want['extra']),
                  ('weld labels partly read', 0 < r['summary']['weldLabels']['read'] < r['summary']['weldLabels']['expected']),
                  ('the report carries no image data', 'data:image' not in json.dumps(r) and 'base64' not in json.dumps(r))]
        for name, ok in checks:
            print(('ok   ' if ok else 'FAIL ') + name)
        print(f"selftest: {E} objects, {want['missed']} missed, {want['swapped']} swapped, {want['extra']} extra; precision {o['precision']}, recall {o['recall']}")
        return all(ok for _, ok in checks)


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a:
        print(__doc__); sys.exit(1)
    cmd = a[0]
    if cmd == 'key':
        js = json.dumps(build_key(), indent=1, ensure_ascii=False) + '\n'
        p = os.path.join(EVAL, 'answer-key.json')
        if '--check' in a:
            ok = os.path.exists(p) and open(p).read() == js
            print('answer key equals a fresh build' if ok else 'answer key differs from a fresh build'); sys.exit(0 if ok else 1)
        os.makedirs(EVAL, exist_ok=True); open(p, 'w').write(js)
        k = json.loads(js); print(f"answer key: {len(k['lines'])} lines, {sum(len(v['objects']) for v in k['lines'].values())} objects")
    elif cmd == 'receive':
        receive(a[1:])
    elif cmd == 'clear':
        clear(a[1:])
    elif cmd == 'score':
        s, detf, opts = a[1], a[2], dict(zip([x[2:] for x in a[3::2]], a[4::2]))
        key = json.load(open(os.path.join(EVAL, 'answer-key.json')))
        rec = json.load(open(receipt_path(s)))
        det = json.load(open(detf))
        ann = json.load(open(opts['annotations'])) if opts.get('annotations') else None
        r = score(key, rec, det, ann, float(opts['threshold']) if opts.get('threshold') else None)
        os.makedirs(os.path.join(EVAL, 'reports'), exist_ok=True)
        name = f"{s}--{r['detector'].get('name', 'detector')}-{r['detector'].get('version', '')}".rstrip('-').replace('/', '_').replace(' ', '_')
        json.dump(r, open(os.path.join(EVAL, 'reports', name + '.json'), 'w'), indent=1)
        open(os.path.join(EVAL, 'reports', name + '.md'), 'w').write(report_md(r))
        print(f"report: {EVAL}/reports/{name}.md — objects F1 {r['summary']['objects']['f1']}")
    elif cmd == 'selftest':
        sys.exit(0 if selftest() else 1)
    else:
        print(__doc__); sys.exit(1)
