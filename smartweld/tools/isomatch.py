"""
Match imported isometric drawings to the plant model (stage 8, DESIGN_BASIS.md §53, SW-IMP-1..6).

    python3 -I tools/isomatch.py import <part1.pdf> <part2.pdf> ...   receive the parts (run from smartweld/)
    python3 -I tools/isomatch.py [--check]                              re-match the committed drawings

`import` writes public/isometrics-imported/:
  ISO-*.pdf       each drawing's own sheets, copied from the parts without other change (SW-IMP-5)
  RECEIPT.json    the received files with their SHA-256 and cover statement, and each drawing's file,
                  SHA-256 and the part and page of every sheet (SW-IMP-1)
then, like a plain run, reads the per-drawing files with tools/isoparse.py, matches them to the ground
truth in public/groundtruth/ and writes:
  match.json      every drawing, its sheets, the lines it covers, its welds and every finding (SW-IMP-6)
  report.md       the same as a readable report
  index.json      the slim index for the viewer, work orders and demo: drawing per line, label and sheet
                  per weld, findings per drawing
--check compares these three files with a fresh run instead of writing them.
Standard library, pypdf (BSD-3-Clause) for the split, and pdftotext (poppler-utils) run as an external program
by tools/isoparse.py to read the words and their positions.
"""
import collections
import hashlib
import json
import math
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import isoparse  # noqa: E402

GT = 'public/groundtruth'
OUT = 'public/isometrics-imported'
TOL_POS = 0.5        # in: a continuation point is on the centreline (SW-IMP-3)
TOL_LEN = 1 / 16     # in: printed lengths are to 1/16 in (SW-IMP-4)


def P(a):
    return (a['E'], a['N'], a['EL'])


def sub(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


class Path:
    """a line's centreline through its nodes (elbow work points included), with stations along it"""

    def __init__(self, nodes):
        pts = []
        for n in nodes:
            p = P(n['at'])
            if not pts or math.dist(pts[-1], p) > 1e-6:
                pts.append(p)
        self.pts = pts
        self.st = [0.0]
        for a, b in zip(pts, pts[1:]):
            self.st.append(self.st[-1] + math.dist(a, b))

    def project(self, p):
        """(distance from the centreline, station) of the nearest point"""
        best = (math.inf, 0.0)
        if len(self.pts) == 1:
            return (math.dist(p, self.pts[0]), 0.0)
        for i, (a, b) in enumerate(zip(self.pts, self.pts[1:])):
            ab = sub(b, a)
            L2 = dot(ab, ab)
            t = 0 if L2 == 0 else max(0.0, min(1.0, dot(sub(p, a), ab) / L2))
            q = (a[0] + t * ab[0], a[1] + t * ab[1], a[2] + t * ab[2])
            d = math.dist(p, q)
            if d < best[0] - 1e-9:
                best = (d, self.st[i] + t * math.sqrt(L2))
        return best


def fmt(v):
    """inches as feet-inches to 1/16 in, for the report"""
    if v is None:
        return '—'
    s = '-' if v < 0 else ''
    v = round(abs(v) * 16) / 16
    ft, inch = int(v // 12), v - 12 * int(v // 12)
    whole, frac = int(inch), inch - int(inch)
    f = ''
    if frac:
        n, d = round(frac * 16), 16
        while n % 2 == 0:
            n, d = n // 2, d // 2
        f = f' {n}/{d}' if whole else f'{n}/{d}'
    body = (str(whole) if whole or not f else '') + f
    return f"{s}{ft}'-{body}\"" if ft else f'{s}{body}"'


def coord(c):
    return f"E {fmt(c['E'])} N {fmt(c['N'])} EL {fmt(c['EL'])}"


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def end_text(s):
    """the drawing's FROM / TO wording for a model end (equipment nozzle 'T-101-N1' -> 'T-101 NOZ. N1')"""
    m = re.fullmatch(r'([A-Z]-\d+[A-Z]?)-(\w+)', s)
    if m:
        return f'{m.group(1)} NOZ. {m.group(2)}'
    return s.upper()


def read_parts(parts):
    """the received part files: receipt records and their sheets"""
    receipt, sheets = [], []
    for f in parts:
        pages = isoparse.parse(f)
        cover = next((p['text'] for p in pages if p['kind'] == 'cover'), '')
        receipt.append(dict(file=os.path.basename(f), bytes=os.path.getsize(f), sha256=sha(f), pages=len(pages),
                            sheets=sum(p['kind'] == 'sheet' for p in pages), cover=cover))
        sheets += [dict(p, source=os.path.basename(f)) for p in pages if p['kind'] == 'sheet']
    return receipt, sheets


def read_drawings(rec):
    """the committed per-drawing files listed in RECEIPT.json, checked against their SHA-256"""
    sheets = []
    for dn, d in rec['drawings'].items():
        f = os.path.join(OUT, d['file'])
        if sha(f) != d['sha256']:
            raise SystemExit(f'{f}: SHA-256 differs from RECEIPT.json')
        for p in isoparse.parse(f):
            if p['kind'] == 'sheet':
                o = d['sheets'][p['page'] - 1]
                sheets.append(dict(p, source=d['file'], origin=dict(part=o['part'], page=o['page'])))
    return sheets


def main(parsed):
    idx = json.load(open(f'{GT}/index.json'))
    lines = {l['line']: json.load(open(f"{GT}/{l['file']}")) for l in idx['lines']}
    paths = {k: Path(L['nodes']) for k, L in lines.items()}
    classes = {c['code']: c for c in json.load(open(f'{GT}/line-classes.json'))}

    findings = []

    def find(level, code, drawing, msg, **kw):
        findings.append(dict(level=level, code=code, drawing=drawing, message=msg, **kw))

    # --- drawings and the lines they cover (SW-IMP-2) ---
    dwgs = collections.OrderedDict()
    for p in parsed:
        dwgs.setdefault(p['title']['drawing'], []).append(p)
    hosts = {}  # line -> drawing
    for dn, sh in dwgs.items():
        ln = {s['title']['line'] for s in sh}
        if len(ln) != 1:
            find('error', 'title-line', dn, f'sheets carry different line numbers: {sorted(ln)}')
        line = sh[0]['title']['line']
        if line not in lines:
            find('error', 'unknown-line', dn, f'line {line} is not in the plant model')
            continue
        hosts[line] = dn
        H = lines[line]['header']
        want = f"ISO-{H['service']}-{line.rsplit('-', 1)[1]}"
        if dn != want:
            find('warning', 'drawing-number', dn, f'drawing number expected {want} from the line number')
    stubs = collections.defaultdict(list)  # host line -> stub lines drawn on its sheets
    for line, L in lines.items():
        if line in hosts:
            continue
        m = re.fullmatch(r'tap (.+)', L['header']['from'])
        parent = m.group(1) if m else None
        if parent in hosts:
            hosts[line] = hosts[parent]
            stubs[parent].append(line)
        else:
            find('error', 'no-drawing', None, f'line {line} has no drawing and is not a branch of a drawn line', line=line)

    out_dwgs = []
    for dn, sh in dwgs.items():
        line = sh[0]['title']['line']
        if line not in lines:
            continue
        L, H, path = lines[line], lines[line]['header'], paths[line]
        sh = sorted(sh, key=lambda s: s['title']['sheetNo'])
        n = sh[0]['title']['sheets']
        nos = [s['title']['sheetNo'] for s in sh]
        if nos != list(range(1, n + 1)) or any(s['title']['sheets'] != n for s in sh):
            find('error', 'sheets', dn, f'sheets {nos} of {n}')

        # title block (SW-IMP-2)
        cls = classes.get(H['lineClass'], {})
        expect = {'pipingClass': H['lineClass'], 'designPress': f"{H['designPressure']} PSIG",
                  'insulation': 'YES' if H['insulated'] else 'NONE', 'fluid': H['service'],
                  'title': (cls.get('fluid') or H['fluid']).upper()}
        for s in sh:
            for k, v in expect.items():
                got = s['title'].get(k)
                if got != v and not (k == 'title' and got and got.replace(' ', '') == v.replace(' ', '')):
                    find('error' if k != 'title' else 'warning', 'title-block', dn,
                         f"sheet {s['title']['sheetNo']}: {k} reads '{got}', model has '{v}'", sheet=s['title']['sheetNo'])

        # sheet breaks along the line (SW-IMP-3)
        breaks = {}
        for s in sh:
            k = s['title']['sheetNo']
            for c in s['continuations']:
                if c['dir'] is None:
                    find('warning', 'continuation-unread', dn, f"sheet {k}: continuation block not read: {c['text']}", sheet=k)
                    continue
                pt, alt = (c['E'], c['N'], c['EL']), (c['alt']['E'], c['alt']['N'], c['alt']['EL'])
                label = f"CONT'D {c['dir'].upper()} {c['drawing']}" + (f" SH {c['sheet']}" if c['sheet'] else '')
                printed = f"E {c['printed']['E']} N {c['printed']['N']} EL {c['printed']['EL']}"
                if c['drawing'] == dn:
                    target, what = None, "the line's centreline"
                    dist = lambda q: path.project(q)[0]
                else:
                    o_line = next(iter(dwg_line(dwgs, c['drawing'])), None)
                    if o_line not in lines:
                        find('error', 'continuation-target', dn, f"sheet {k}: {label} names a drawing that is not in the set", sheet=k)
                        continue
                    target = meeting(lines[line], lines[o_line])
                    what = f"where {line} meets {o_line} ({coord(target)})"
                    dist = lambda q: math.dist(q, P(target))
                # the drawings print a negative value that is not whole feet as the feet rounded down plus positive
                # inches ('-12'-6"' for -138 in); every continuation point in the set fits that reading (SW-IMP-3)
                if alt != pt:
                    find('error', 'coordinate-sign', dn,
                         f"sheet {k}: {label} prints {printed} for {coord(dict(E=alt[0], N=alt[1], EL=alt[2]))}: the minus sign applies "
                         f"to the feet only; read as written the point is {math.dist(pt, alt):.2f} in away"
                         + (f" and {dist(pt):.2f} in off {what}" if dist(pt) > TOL_POS else ' (still on the centreline, at the wrong place along it)'),
                         sheet=k, printedAt=c['printed'], at=dict(E=alt[0], N=alt[1], EL=alt[2]))
                    pt = alt
                d = dist(pt)
                if d > TOL_POS:
                    find('error', 'continuation-off-line', dn, f"sheet {k}: {label} at {printed} is {d:.2f} in off {what}", sheet=k)
                if c['drawing'] == dn and c['dir'] == 'on':
                    if c['sheet'] != k + 1:
                        find('error', 'continuation-sheet', dn, f"sheet {k}: CONT'D ON names sheet {c['sheet']}", sheet=k)
                    breaks[k] = (path.project(pt)[1], pt)
            for c in s['continuations']:
                if c['dir'] == 'from' and c['drawing'] == dn:
                    prev = next((x for x in sh if x['title']['sheetNo'] == c['sheet']), None)
                    on = [y for y in (prev or {}).get('continuations', []) if y['dir'] == 'on' and y['drawing'] == dn and y['sheet'] == k]
                    if not on or any(abs(on[0][a] - c[a]) > 1e-6 for a in ('E', 'N', 'EL')):
                        find('error', 'continuation-pair', dn, f"sheet {k}: CONT'D FROM SH {c['sheet']} at {coord(c)} does not match that sheet's CONT'D ON", sheet=k)
        cuts = [0.0] + [breaks[k][0] for k in sorted(breaks)] + [path.st[-1]]
        if len(cuts) != n + 1:
            find('error', 'breaks', dn, f'{len(breaks)} sheet breaks found for {n} sheets')
            cuts = None

        def sheet_of(p):
            if not cuts:
                return None
            st = path.project(p)[1]
            for i in range(n):
                if st <= cuts[i + 1] + 1e-6:
                    return i + 1
            return n

        # welds (SW-IMP-4): the drawing's labels against the model's welds, sheet by sheet. The line's own welds
        # carry their numbers; the welds of branch lines drawn on the sheets continue the numbering in order
        # along the line (as the drawings do, e.g. ISO-P-1002 W11 and W12)
        nw = len(L['welds'])
        branch_welds = sorted([w for x in stubs[line] for w in lines[x]['welds']], key=lambda w: (path.project(P(w['at']))[1], w['tag']))
        weld_map = {w['tag'].rsplit('/', 1)[1]: w for w in L['welds']}
        weld_map.update({f'W{nw + 1 + i}': w for i, w in enumerate(branch_welds)})
        labels = collections.defaultdict(list)
        for s in sh:
            for w in s['welds']:
                labels[w].append(s['title']['sheetNo'])
        breaks_st = [v[0] for _, v in sorted(breaks.items())]

        def from_break(rec):
            st = path.project(P(rec['at']))[1]
            return min((abs(st - b) for b in breaks_st), default=math.inf)
        for w, ks in sorted(labels.items(), key=lambda x: int(x[0][1:])):
            if w not in weld_map:
                find('error', 'weld-extra', dn, f"label {w} (sheet {', '.join(map(str, ks))}) is not a weld of {line} or of a branch drawn on it", weld=w)
        weld_index = []
        for w, rec in weld_map.items():
            exp = sheet_of(P(rec['at']))
            branch = rec['line'] != line if 'line' in rec else not rec['tag'].startswith(line + '/')
            weld_index.append(dict(label=w, tag=rec['tag'], sheets=labels.get(w, []), expected=exp))
            if w not in labels:
                find('warning', 'weld-unlabelled', dn, f"{'branch ' if branch else ''}weld {rec['tag']} ({coord(rec['at'])}{', sheet ' + str(exp) if exp else ''}) "
                     f"has no {w} label", weld=rec['tag'], label=w, sheet=exp)
            elif exp and exp not in labels[w]:
                find('error', 'weld-sheet', dn, f"{w} ({rec['tag']}) is labelled on sheet {', '.join(map(str, labels[w]))} but is on sheet {exp}, "
                     f"{from_break(rec):.1f} in from the break", weld=rec['tag'], label=w, sheet=exp)
            elif len(labels[w]) > 1:
                find('warning', 'weld-repeated', dn, f"{w} ({rec['tag']}, sheet {exp}) is labelled again on sheet "
                     f"{', '.join(str(k) for k in labels[w] if k != exp)}; it is {from_break(rec):.1f} in from the nearest break",
                     weld=rec['tag'], label=w, sheet=exp)

        # bill of materials, sheet by sheet (SW-IMP-4)
        expected = [collections.Counter() for _ in range(n + 1)]
        pipe = [0.0] * (n + 1)
        for x in [line] + stubs[line]:
            X = lines[x]
            for it in X['items']:
                if it['kind'] == 'pipe' and x == line and cuts:
                    s0, s1 = sorted([path.project(P(it['a']))[1], path.project(P(it['b']))[1]])
                    for i in range(n):
                        pipe[i + 1] += max(0.0, min(s1, cuts[i + 1]) - max(s0, cuts[i]))
                elif it['kind'] == 'pipe':
                    pipe[sheet_of(P(it['centre'])) or 0] += it.get('cutLength', 0)
                else:
                    expected[sheet_of(P(it['centre'])) or 0][it['description']] += 1
            for sp in X['supports']:
                expected[sheet_of(P(sp['at'])) or 0][sp['description']] += 1
        pipe_desc = {it['description'] for x in [line] + stubs[line] for it in lines[x]['items'] if it['kind'] == 'pipe'}
        tot_d, tot_e = collections.Counter(), collections.Counter()
        len_d, len_e = 0.0, sum(pipe)
        for s in sh:
            k = s['title']['sheetNo']
            got, glen = collections.Counter(), 0.0
            for b in s['bom']:
                if b['length'] is not None:
                    glen += b['length']
                    if b['description'] not in pipe_desc:
                        find('error', 'bom-row', dn, f"sheet {k}: pipe row '{b['description']}' is not a pipe of the line", sheet=k)
                else:
                    got[b['description']] += b['count'] or 0
            tot_d += got
            len_d += glen
            if cuts:
                for desc in sorted(set(got) | set(expected[k])):
                    if got[desc] != expected[k][desc]:
                        find('warning', 'bom-sheet', dn, f"sheet {k}: {desc}: bill {got[desc]}, model {expected[k][desc]} on this sheet", sheet=k)
                if abs(glen - pipe[k]) > TOL_LEN * max(1, sum(1 for b in s['bom'] if b['length'] is not None)):
                    find('warning', 'pipe-sheet', dn, f"sheet {k}: pipe {fmt(glen)} on the bill, model {fmt(pipe[k])} on this sheet", sheet=k)
        for e in expected:
            tot_e += e
        for desc in sorted(set(tot_d) | set(tot_e)):
            if tot_d[desc] != tot_e[desc]:
                find('error', 'bom-total', dn, f"{desc}: bill total {tot_d[desc]}, model {tot_e[desc]}")
        if abs(len_d - len_e) > TOL_LEN * len(sh):
            find('error', 'pipe-total', dn, f"pipe: bill total {fmt(len_d)}, model {fmt(len_e)} (difference {len_d - len_e:+.3f} in)")

        # ends (SW-IMP-2)
        ends = [(e['dir'], e['text'], s['title']['sheetNo']) for s in sh for e in s['ends']]
        for d_, key in (('from', 'from'), ('to', 'to')):
            mv = H[key]
            if mv.startswith('tap ') or mv in ('cap', 'blind'):
                continue  # a tap is shown by its CONT'D block; caps and blinds by their symbol
            want = end_text(mv)
            if not any(e[0] == d_ and e[1] == want for e in ends):
                got = [e[1] for e in ends if e[0] == d_]
                find('warning', 'end-label', dn, f"{d_.upper()} label '{want}' is not on the drawing" + (f" (reads {got})" if got else ''))

        out_dwgs.append(dict(drawing=dn, line=line, lineClass=H['lineClass'], branches=sorted(stubs[line]),
                             sheets=[dict(sheet=s['title']['sheetNo'], page=s['page'], origin=s.get('origin'),
                                          welds=s['welds'], bom=s['bom'], continuations=s['continuations'], ends=s['ends'])
                                     for s in sh],
                             welds=weld_index, file=f'{dn}.pdf', breaks=[dict(after=k, station=round(v[0], 4), at=dict(E=v[1][0], N=v[1][1], EL=v[1][2])) for k, v in sorted(breaks.items())]))

    for f in findings:
        f['line'] = f.get('line') or next((d['line'] for d in out_dwgs if d['drawing'] == f['drawing']), None)
    covered = {l for l in lines if l in hosts}
    summary = dict(drawings=len(out_dwgs), sheets=sum(len(d['sheets']) for d in out_dwgs), linesInModel=len(lines),
                   linesCovered=len(covered), ownDrawing=len([d for d in out_dwgs]),
                   branchesOnParent=sum(len(d['branches']) for d in out_dwgs),
                   findings=dict(collections.Counter(f['level'] for f in findings)),
                   byCode=dict(collections.Counter(f['code'] for f in findings)))
    return out_dwgs, hosts, findings, summary


def dwg_line(dwgs, dn):
    return {s['title']['line'] for s in dwgs.get(dn, [])}


def meeting(A, B):
    """where two lines meet: B's end nearest A's centreline (or A's end nearest B's)"""
    pa, pb = Path(A['nodes']), Path(B['nodes'])
    cand = []
    for n in (B['nodes'][0], B['nodes'][-1]):
        cand.append((pa.project(P(n['at']))[0], n['at']))
    for n in (A['nodes'][0], A['nodes'][-1]):
        cand.append((pb.project(P(n['at']))[0], n['at']))
    return min(cand, key=lambda c: c[0])[1]


def report(receipt, dwgs, hosts, findings, summary):
    receipt = receipt['received']
    o = ['# Imported isometrics — match to the plant model', '',
         'Generated by `tools/isomatch.py` (DESIGN_BASIS.md §53, SW-IMP-1..6). Do not edit by hand.', '',
         '## Received files (SW-IMP-1)', '', '| File | Pages | Sheets | Bytes | SHA-256 |', '|---|---|---|---|---|']
    for r in receipt:
        o.append(f"| {r['file']} | {r['pages']} | {r['sheets']} | {r['bytes']:,} | `{r['sha256']}` |")
    s = summary
    o += ['', '## Summary', '',
          f"- {s['drawings']} drawings on {s['sheets']} sheets.",
          f"- {s['linesCovered']} of the model's {s['linesInModel']} lines are covered: {s['ownDrawing']} on their own drawing, {s['branchesOnParent']} small branches drawn on their parent line's sheets.",
          f"- {sum(1 for d in dwgs if not [f for f in findings if f['drawing'] == d['drawing'] and f['level'] != 'info'])} drawings agree with the model with no finding.",
          f"- Findings: " + ', '.join(f'{v} {k}' for k, v in sorted(s['findings'].items())) + '.',
          '', '| Check | Findings |', '|---|---|']
    for k, v in sorted(s['byCode'].items()):
        o.append(f'| {k} | {v} |')
    o += ['', '## Findings by drawing', '']
    by = collections.defaultdict(list)
    for f in findings:
        by[f['drawing']].append(f)
    for d in dwgs:
        fs = by.get(d['drawing'], [])
        mark = 'matches' if not [f for f in fs if f['level'] != 'info'] else f"{len([f for f in fs if f['level'] != 'info'])} finding(s)"
        o.append(f"### {d['drawing']} — {d['line']} ({len(d['sheets'])} sheet{'s' if len(d['sheets']) > 1 else ''}) — {mark}")
        if d['branches']:
            o.append(f"Branches drawn here: {', '.join(d['branches'])}.")
        for f in fs:
            o.append(f"- **{f['level']}** `{f['code']}` {f['message']}")
        o.append('')
    if by.get(None):
        o += ['### Lines without a drawing', ''] + [f"- **{f['level']}** {f['message']}" for f in by[None]]
    return '\n'.join(o) + '\n'


def do_import(parts):
    """split the received parts into one PDF per drawing (SW-IMP-5) and write RECEIPT.json (SW-IMP-1)"""
    from pypdf import PdfReader, PdfWriter
    received, sheets = read_parts(parts)
    readers = {os.path.basename(f): PdfReader(f) for f in parts}
    by = collections.OrderedDict()
    for p in sheets:
        by.setdefault(p['title']['drawing'], []).append(p)
    os.makedirs(OUT, exist_ok=True)
    drawings = collections.OrderedDict()
    for dn, sh in by.items():
        sh = sorted(sh, key=lambda p: p['title']['sheetNo'])
        w = PdfWriter()
        for p in sh:
            w.add_page(readers[p['source']].pages[p['page'] - 1])
        w.add_metadata({'/Title': f"{dn} {sh[0]['title']['line']}", '/Subject': 'Imported isometric (SW-IMP-5)', '/Producer': 'SmartWeld import'})
        f = os.path.join(OUT, f'{dn}.pdf')
        with open(f, 'wb') as fh:
            w.write(fh)
        drawings[dn] = dict(file=f'{dn}.pdf', line=sh[0]['title']['line'], sha256=sha(f),
                            sheets=[dict(sheet=p['title']['sheetNo'], part=p['source'], page=p['page']) for p in sh])
    rec = dict(note='Received documents (SW-IMP-1). Only the documents were imported; see PROVENANCE.md.',
               received=received, drawings=drawings)
    json.dump(rec, open(f'{OUT}/RECEIPT.json', 'w'), indent=1, ensure_ascii=False)
    return rec


def outputs(rec):
    dwgs, hosts, findings, summary = main(read_drawings(rec))
    for d in dwgs:
        d['sha256'] = rec['drawings'][d['drawing']]['sha256']
    mj = json.dumps(dict(summary=summary, drawings=dwgs, lineToDrawing=dict(sorted(hosts.items())), findings=findings),
                    indent=1, ensure_ascii=False) + '\n'
    # the slim index the viewer, the work orders and the demo read (SW-IMP-6)
    by = collections.defaultdict(list)
    for f in findings:
        by[f['drawing']].append({k: f[k] for k in ('level', 'code', 'sheet', 'message') if f.get(k) is not None})
    ix = dict(note='Imported isometric drawings matched to the plant model (DESIGN_BASIS.md §53). Generated by tools/isomatch.py.',
              summary=dict(summary, matching=sum(1 for d in dwgs if not [f for f in by[d['drawing']] if f['level'] != 'info'])),
              drawings={d['drawing']: dict(line=d['line'], file=d['file'], sheets=len(d['sheets']), branches=d['branches'],
                                           sha256=d['sha256'], findings=by[d['drawing']]) for d in dwgs},
              lines=dict(sorted(hosts.items())),
              welds={w['tag']: dict(drawing=d['drawing'], label=w['label'], sheet=w['expected'], labelled=w['sheets'])
                     for d in dwgs for w in d['welds']})
    files = {'match.json': mj, 'report.md': report(rec, dwgs, hosts, findings, summary),
             'index.json': json.dumps(ix, indent=1, ensure_ascii=False) + '\n'}
    return files, summary


if __name__ == '__main__':
    args = sys.argv[1:]
    if args[:1] == ['import']:
        rec = do_import(args[1:])
    else:
        rec = json.load(open(f'{OUT}/RECEIPT.json'))
    files, summary = outputs(rec)
    if '--check' in args:
        bad = [k for k, v in files.items() if open(os.path.join(OUT, k)).read() != v]
        print('differs: ' + ', '.join(bad) if bad else ', '.join(files) + ' equal a fresh run')
        sys.exit(1 if bad else 0)
    for k, v in files.items():
        open(os.path.join(OUT, k), 'w').write(v)
    print(json.dumps(summary, indent=1))
