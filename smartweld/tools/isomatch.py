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
  FIXLIST.md, fixlist.json   the instructions for the drawings' author: one per finding, the rules for
                  the corrected revision and its acceptance checks (SW-IMP-7)
--check compares these files with a fresh run instead of writing them.
Standard library and pypdf (BSD-3-Clause), for the split and, in tools/isoparse.py, to read the words and their
positions. No copyleft program or library is used (PROVENANCE P-57).
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
    """the drawing's FROM / TO wording for a model end (SW-IMP-2): an equipment nozzle 'T-101-N1' -> 'T-101 NOZ. N1',
    'PSV on D-101-N3' -> 'PSV ON D-101 NOZ. N3', 'hose station' -> 'HOSE STATION'"""
    return re.sub(r'\b([A-Z]-\d+[A-Z]?)-(N\d+|[A-Z])\b', r'\1 NOZ. \2', s).upper()


def branch_label(tag):
    """the model's form of a branch weld label (SW-IMP-4): '3/4"-P300-I-7001/W1' -> 'I-7001/W1'"""
    line, w = tag.rsplit('/', 1)
    return '-'.join(line.split('-')[-2:]) + '/' + w


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

    findings, fixes = [], collections.defaultdict(list)

    def find(level, code, drawing, msg, fix=None, **kw):
        findings.append(dict(level=level, code=code, drawing=drawing, message=msg, **kw))
        if fix is not None:  # SW-IMP-7: every finding is also an instruction to the drawings' author
            fixes[drawing].append(dict(fix, finding=code, level=level))

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

    def target(dn, line, c):
        """how far a continuation point is from where it belongs, and what that place is (SW-IMP-3)"""
        if c['drawing'] == dn:
            return (lambda q: paths[line].project(q)[0]), "the line's centreline", None
        o_line = next(iter(dwg_line(dwgs, c['drawing'])), None)
        if o_line not in lines:
            return None
        t = meeting(lines[line], lines[o_line])
        return (lambda q: math.dist(q, P(t))), f"where {line} meets {o_line} ({coord(t)})", t

    # the set's sign convention for negative values that are not whole feet, from the points only one reading fits
    decisive = collections.Counter()
    for dn, sh in dwgs.items():
        line = sh[0]['title']['line']
        if line not in lines:
            continue
        for s in sh:
            for c in s['continuations']:
                t = target(dn, line, c) if c['dir'] else None
                if not t or c['alt'] == {k: c[k] for k in ('E', 'N', 'EL')}:
                    continue
                pt, alt = (c['E'], c['N'], c['EL']), (c['alt']['E'], c['alt']['N'], c['alt']['EL'])
                on_std, on_alt = t[0](pt) <= TOL_POS, t[0](alt) <= TOL_POS
                if on_std != on_alt:
                    decisive['conventional' if on_std else 'feet-only'] += 1
    convention = ('mixed' if len(decisive) == 2 else next(iter(decisive)) if decisive else 'conventional')

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
                t = target(dn, line, c)
                if not t:
                    find('error', 'continuation-target', dn, f"sheet {k}: {label} names a drawing that is not in the set", sheet=k,
                         fix=dict(kind='continuation-target', sheet=k, block=label, instruction=f"Name the drawing that shows the line continued here."))
                    continue
                dist, what, _ = t
                # the set's sign convention decides how a negative value that is not whole feet is read (SW-IMP-3)
                if alt != pt and (convention == 'feet-only' or (convention == 'mixed' and dist(alt) <= TOL_POS < dist(pt))):
                    right = {a: fmt(c['alt'][a]) for a in ('E', 'N', 'EL') if c['alt'][a] != c[a]}
                    find('error', 'coordinate-sign', dn,
                         f"sheet {k}: {label} prints {printed} for {coord(dict(E=alt[0], N=alt[1], EL=alt[2]))}: the minus sign applies "
                         f"to the feet only; read as written the point is {math.dist(pt, alt):.2f} in away"
                         + (f" and {dist(pt):.2f} in off {what}" if dist(pt) > TOL_POS else ' (still on the centreline, at the wrong place along it)'),
                         sheet=k, printedAt=c['printed'], at=dict(E=alt[0], N=alt[1], EL=alt[2]),
                         fix=dict(kind='coordinate-text', sheet=k, block=label, at=dict(E=alt[0], N=alt[1], EL=alt[2]),
                                  replace=[dict(field=a, printed=c['printed'][a], correct=v) for a, v in right.items()],
                                  instruction=' and '.join(f"print {a} {v} (not {c['printed'][a]})" for a, v in right.items())
                                  + ': the minus sign applies to the whole value.'))
                    pt = alt
                d = dist(pt)
                if d > TOL_POS:
                    find('error', 'continuation-off-line', dn, f"sheet {k}: {label} at {printed} is {d:.2f} in off {what}", sheet=k,
                         fix=dict(kind='continuation-point', sheet=k, block=label, instruction=f"Move the point onto {what}."))
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

        # welds (SW-IMP-4): the drawing's labels against the model's welds, sheet by sheet, keyed by the model's tag.
        # Own welds carry the model's numbers; a branch weld is labelled in the model's form ('I-7001/W1') or, as in
        # Rev 0 of the owner's set, by numbers continued from the parent's in order along the line (W11, W12, ...)
        nw = len(L['welds'])
        branch_welds = sorted([w for x in stubs[line] for w in lines[x]['welds']], key=lambda w: (path.project(P(w['at']))[1], w['tag']))
        recs = {w['tag']: w for w in L['welds'] + branch_welds}
        want_label = {w['tag']: w['tag'].rsplit('/', 1)[1] for w in L['welds']}
        want_label.update({w['tag']: branch_label(w['tag']) for w in branch_welds})
        resolve = {v: k for k, v in want_label.items()}
        resolve.update({f'W{nw + 1 + i}': w['tag'] for i, w in enumerate(branch_welds)})
        by_tag, printed_as = collections.defaultdict(list), collections.defaultdict(set)
        for s in sh:
            k = s['title']['sheetNo']
            for w in s['welds']:
                t = resolve.get(w)
                if t is None:
                    find('error', 'weld-extra', dn, f"label {w} (sheet {k}) is not a weld of {line} or of a branch drawn on it", weld=w, sheet=k,
                         fix=dict(kind='weld-label-remove', sheet=k, label=w, instruction=f"Remove label {w}: no weld of the line or its branches has it."))
                    continue
                by_tag[t].append(k)
                printed_as[t].add(w)
        breaks_st = [v[0] for _, v in sorted(breaks.items())]
        station = {t: path.project(P(r['at']))[1] for t, r in recs.items()}
        exp_sheet = {t: sheet_of(P(r['at'])) for t, r in recs.items()}

        def from_break(t):
            return min((abs(station[t] - b) for b in breaks_st), default=math.inf)

        def neighbours(t):
            """the nearest welds labelled on the same sheet before and after this one, along the line"""
            same = sorted([u for u in recs if exp_sheet[u] == exp_sheet[t] and exp_sheet[t] in by_tag.get(u, [])], key=lambda u: station[u])
            before = [u for u in same if station[u] < station[t]]
            after = [u for u in same if station[u] > station[t]]
            return dict(before=(sorted(printed_as[before[-1]])[0] if before else None), after=(sorted(printed_as[after[0]])[0] if after else None))
        weld_index = []
        for t in sorted(recs, key=lambda u: (u not in want_label or '/' in want_label[u], station[u])):
            rec, exp, lab = recs[t], exp_sheet[t], want_label[t]
            branch = t.rsplit('/', 1)[0] != line
            shown = sorted(printed_as[t], key=isoparse.weld_key)
            weld_index.append(dict(label=shown[0] if shown else lab, tag=t, sheets=sorted(set(by_tag.get(t, []))), expected=exp))
            if not by_tag.get(t):
                nb = neighbours(t)
                find('warning', 'weld-unlabelled', dn, f"{'branch ' if branch else ''}weld {t} ({coord(rec['at'])}{', sheet ' + str(exp) if exp else ''}) has no label",
                     weld=t, label=lab, sheet=exp,
                     fix=dict(kind='weld-label-add', sheet=exp, tag=t, label=lab, at=rec['at'], between=nb,
                              instruction=f"Label the weld dot {lab}" + (f", between {nb['before']} and {nb['after']}" if nb['before'] and nb['after'] else
                                                                       f", after {nb['before']}" if nb['before'] else f", before {nb['after']}" if nb['after'] else '') + '.'))
                continue
            if exp and exp not in by_tag[t]:
                find('error', 'weld-sheet', dn, f"{lab} ({t}) is labelled on sheet {', '.join(map(str, by_tag[t]))} but is on sheet {exp}, "
                     f"{from_break(t):.1f} in from the break", weld=t, label=lab, sheet=exp,
                     fix=dict(kind='weld-label-move', sheet=exp, fromSheets=sorted(set(by_tag[t])), tag=t, label=lab, printed=sorted(printed_as[t]), at=rec['at'],
                              instruction=f"Show and label {lab} on sheet {exp}, which holds its position; remove it from sheet {', '.join(map(str, sorted(set(by_tag[t]))))}."))
            elif len(by_tag[t]) > 1:
                others = sorted(set(k for k in by_tag[t] if k != exp))
                find('warning', 'weld-repeated', dn, f"{lab} ({t}, sheet {exp}) is labelled again on sheet {', '.join(map(str, others))}; "
                     f"it is {from_break(t):.1f} in from the nearest break", weld=t, label=lab, sheet=exp,
                     fix=dict(kind='weld-label-remove', sheet=others[0] if len(others) == 1 else others, tag=t, label=lab, printed=sorted(printed_as[t])[0], keepOn=exp,
                              instruction=f"Remove label {sorted(printed_as[t])[0]} from sheet {', '.join(map(str, others))}; it stays on sheet {exp}, which holds the weld."))
            if branch and lab not in printed_as[t]:   # labelled, but by continued numbering: ask for the model's form (SW-IMP-4)
                fixes[dn].append(dict(kind='weld-relabel', sheet=exp, tag=t, label=lab, printed=sorted(printed_as[t])[0], finding=None, level='conform',
                                      instruction=f"Relabel {sorted(printed_as[t])[0]} as {lab}, the model's tag of this branch weld."))

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
                k, at = (1, L['nodes'][0]['at']) if d_ == 'from' else (n, L['nodes'][-1]['at'])
                find('warning', 'end-label', dn, f"{d_.upper()} label '{want}' is not on the drawing" + (f" (reads {got})" if got else ''), sheet=k,
                     fix=dict(kind='end-label-add', sheet=k, text=f'{d_.upper()} {want}', at=at,
                              instruction=f"Print '{d_.upper()} {want}' at the line's {'start' if d_ == 'from' else 'end'} ({coord(at)})"
                              + (f", replacing '{got[0]}'" if got else '') + '.'))

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
                   coordinateSign=convention,
                   findings=dict(collections.Counter(f['level'] for f in findings)),
                   byCode=dict(collections.Counter(f['code'] for f in findings)))
    return out_dwgs, hosts, findings, summary, fixes


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


FIX_ID, FIX_DATE = 'FL-1', '2026-11-02'
FIX_RULES = [
    ('R1', 'Coordinates', "A negative value's minus sign applies to the whole value: format the size of the value in feet and inches, "
     "then put '-' in front. -138 in prints -11'-6\" (Rev 0 printed -12'-6\", which a reader takes as -150 in); -6 in prints -6\". "
     "This applies wherever a coordinate is printed (continuation blocks and end points)."),
    ('R2', 'Weld labels', "Label every weld exactly once, on the sheet that holds its position: the sheet whose two breaks "
     "(CONT'D ON / FROM points) bracket the weld's distance along the line. Never leave a weld dot without its label because of crowding; "
     "move the label or lengthen its leader instead. A weld close to a break is labelled only on its own sheet."),
    ('R3', 'Branch welds', "A weld of a vent, drain, instrument or sample tap drawn on its parent line's sheets is labelled with its model "
     "tag's form {service}-{sequence}/W{n}: I-7001/W1 for the weld 3/4\"-P300-I-7001/W1. Rev 0 continued the parent's numbering "
     "(W29, W30, ...), and those numbers do not exist in the model."),
    ('R4', 'FROM / TO labels', "Print a FROM label at the start and a TO label at the end of every line whose end is an equipment "
     "nozzle ('TO P-101A NOZ. S'), a relief valve ('TO PSV', 'FROM PSV ON D-101 NOZ. N3') or a hose station ('TO HOSE STATION'). "
     "A tap end is shown by its CONT'D block, and a cap or blind by its symbol."),
    ('R5', 'Revision', f"Issue the corrected set as revision 1 of the same drawing numbers and sheet split: REV 1 in every title block "
     f"and a revision row '1 <date> REVISED TO MATCH THE MODEL ({FIX_ID})'. Change nothing else: the bills, pipe lengths, sheet breaks, "
     "title blocks and coverage already agree with the model."),
    ('R6', 'Licences', "Make the revision with permissively licensed software and fonts only (for example MIT, BSD, Apache-2.0, ISC; "
     "fonts under a permissive font licence such as the Bitstream Vera licence of DejaVu Sans). No GPL, LGPL, AGPL, MPL or other "
     "copyleft program, library or font may be used to draw, render, combine or check the sheets. State the tools, versions and "
     "licences used on the cover page, as Rev 0 did. Use no published standard, table, catalogue or third-party drawing."),
]
FIX_ACCEPT = ['A re-import here (python3 -I tools/isomatch.py import <parts>) reports 0 errors and 0 warnings.',
              'The cover page names only permissively licensed tools and fonts (R6).',
              'All 203 lines are covered; every bill, pipe length, title block and sheet break still agrees with the model.',
              'The set reads with the usual sign convention (summary coordinateSign: conventional).',
              'Every weld of every line and branch carries its model label once, on its own sheet.']
KIND_TEXT = {'coordinate-text': 'Coordinate text', 'weld-label-add': 'Add weld label', 'weld-label-remove': 'Remove repeated label',
             'weld-label-move': 'Move weld label', 'weld-relabel': 'Relabel branch weld', 'end-label-add': 'Add end label'}
RULE_OF = {'coordinate-text': 'R1', 'weld-label-add': 'R2', 'weld-label-remove': 'R2', 'weld-label-move': 'R2', 'weld-relabel': 'R3', 'end-label-add': 'R4'}


def fixlist(rec, dwgs, fixes):
    """SW-IMP-7: the instructions for the drawings' author, one per finding plus the branch relabels of R3"""
    order = {d['drawing']: i for i, d in enumerate(dwgs)}
    drawings = collections.OrderedDict()
    for dn in sorted(fixes, key=lambda x: order.get(x, 1e9)):
        d = next(x for x in dwgs if x['drawing'] == dn)
        ch = sorted(fixes[dn], key=lambda f: (f['sheet'] if isinstance(f.get('sheet'), int) else 0, list(KIND_TEXT).index(f['kind']) if f['kind'] in KIND_TEXT else 9, f.get('tag', '')))
        for i, f in enumerate(ch, 1):
            f['id'] = f'{FIX_ID}/{dn}/{i:02d}'
            f['rule'] = RULE_OF.get(f['kind'])
        drawings[dn] = dict(line=d['line'], sheets=len(d['sheets']), branches=d['branches'], revision=1, changes=ch)
    counts = collections.Counter(f['kind'] for d in drawings.values() for f in d['changes'])
    js = dict(id=FIX_ID, issued=FIX_DATE,
              forWhom="The isometric generator that drew SmartWeld-plant-isometrics-27bc863.pdf (Rev 0).",
              basis=dict(groundTruth='smartweld/public/groundtruth at commit c35ea3396121 (unchanged)', designBasis='DESIGN_BASIS.md §53 SW-IMP-1..7',
                         received=[dict(file=r['file'], sha256=r['sha256']) for r in rec['received']]),
              rules=[dict(id=a, title=b, rule=c) for a, b, c in FIX_RULES], acceptance=FIX_ACCEPT,
              counts=dict(drawings=len(drawings), changes=sum(counts.values()), byKind=dict(sorted(counts.items()))), drawings=drawings)
    esc = lambda v: str(v).replace('|', '\\|')
    o = [f'# Fix list {FIX_ID}: owner\'s isometric drawings, Rev 0 to Rev 1', '',
         f'Issued {FIX_DATE} by the SmartWeld plant model (`tools/isomatch.py`, DESIGN_BASIS.md §53, SW-IMP-7). Generated; do not edit by hand.', '',
         f'**For:** {js["forWhom"]}  ',
         '**Source data (unchanged):** the plant model\'s ground truth, `smartweld/public/groundtruth` at commit `c35ea3396121`, the export the set was drawn from.  ',
         '**Received Rev 0:** ' + '; '.join(f"`{r['file']}` (SHA-256 `{r['sha256'][:16]}…`)" for r in rec['received']) + '.', '',
         'Everything else on the drawings agrees with the model: the title blocks, every bill of materials and pipe length, every sheet break, '
         'and the coverage of all 203 lines. Change only what is listed here. Fix the generator by the rules below, then regenerate, '
         'rather than editing sheets one by one. The changes by drawing are what the rules must produce, and they are the check.', '',
         '## Rules for Rev 1', '']
    o += [f'- **{a} {b}.** {c}' for a, b, c in FIX_RULES]
    o += ['', '## Acceptance', ''] + [f'- {a}' for a in FIX_ACCEPT]
    o += ['', '## Summary', '', f"{len(drawings)} drawings, {sum(counts.values())} changes.", '', '| Change | Rule | Count |', '|---|---|---|']
    o += [f'| {KIND_TEXT.get(k, k)} | {RULE_OF.get(k, "")} | {v} |' for k, v in sorted(counts.items(), key=lambda x: list(KIND_TEXT).index(x[0]) if x[0] in KIND_TEXT else 9)]
    o += ['', '| Drawing | Line | Sheets | Changes |', '|---|---|---|---|']
    o += [f"| {dn} | {esc(d['line'])} | {d['sheets']} | {len(d['changes'])} |" for dn, d in drawings.items()]
    o += ['', '## Changes by drawing', '',
          'Positions are the model\'s plant coordinates (E = east, N = north, EL = elevation; the floor is EL 100\'-0"). '
          'Tags are the model\'s; the tool that drew the set links every weld to its tag.', '']
    for dn, d in drawings.items():
        o += [f"### {dn}: {esc(d['line'])} ({d['sheets']} sheet{'s' if d['sheets'] > 1 else ''})", '',
              '| Id | Sheet | Change | Tag | Text to print | Model position | Instruction |', '|---|---|---|---|---|---|---|']
        for f in d['changes']:
            text = f.get('text') or f.get('label') or '; '.join(f"{r['field']} {r['correct']}" for r in f.get('replace', []))
            sheet = f['sheet'] if not isinstance(f.get('sheet'), list) else ', '.join(map(str, f['sheet']))
            o.append(f"| {f['id'].split('/')[-1]} | {sheet} | {KIND_TEXT.get(f['kind'], f['kind'])} | {esc(f.get('tag', f.get('block', '')))} | "
                     f"{esc(text)} | {coord(f['at']) if f.get('at') else ''} | {esc(f['instruction'])} |")
        o.append('')
    return json.dumps(js, indent=1, ensure_ascii=False) + '\n', '\n'.join(o) + '\n'


def outputs(rec):
    dwgs, hosts, findings, summary, fixes = main(read_drawings(rec))
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
    files['fixlist.json'], files['FIXLIST.md'] = fixlist(rec, dwgs, fixes)
    return files, summary


def apply_fixes(parsed, fl):
    """the sheets as they read once every instruction of the fix list is carried out (for the self-test)"""
    import copy
    parsed = copy.deepcopy(parsed)
    sheet = {(p['title']['drawing'], p['title']['sheetNo']): p for p in parsed}
    for dn, d in fl['drawings'].items():
        for f in d['changes']:
            ks = f['sheet'] if isinstance(f['sheet'], list) else [f['sheet']]
            if f['kind'] == 'coordinate-text':
                p = sheet[(dn, f['sheet'])]
                c = next(c for c in p['continuations'] if c.get('dir') and f"CONT'D {c['dir'].upper()} {c['drawing']}" + (f" SH {c['sheet']}" if c['sheet'] else '') == f['block'])
                for r in f['replace']:
                    c['printed'][r['field']] = r['correct']
                    c[r['field']] = isoparse.coord(r['correct'])
                    c['alt'][r['field']] = isoparse.coord(r['correct'], True)
            elif f['kind'] == 'weld-label-add':
                sheet[(dn, f['sheet'])]['welds'].append(f['label'])
            elif f['kind'] == 'weld-label-remove':
                for k in ks:
                    w = sheet[(dn, k)]['welds']
                    w.remove(f.get('printed', f['label']))
            elif f['kind'] == 'weld-label-move':
                for k in f['fromSheets']:
                    sheet[(dn, k)]['welds'] = [w for w in sheet[(dn, k)]['welds'] if w not in f['printed']]
                sheet[(dn, f['sheet'])]['welds'].append(f['label'])
            elif f['kind'] == 'weld-relabel':
                for p in parsed:
                    if p['title']['drawing'] == dn:
                        p['welds'] = [f['label'] if w == f['printed'] else w for w in p['welds']]
            elif f['kind'] == 'end-label-add':
                dir_, text = f['text'].split(' ', 1)
                sheet[(dn, f['sheet'])]['ends'].append(dict(dir=dir_.lower(), text=text))
            else:
                raise SystemExit(f"self-test: no way to apply {f['kind']}")
    return parsed


if __name__ == '__main__':
    args = sys.argv[1:]
    if args[:1] == ['import']:
        rec = do_import(args[1:])
    else:
        rec = json.load(open(f'{OUT}/RECEIPT.json'))
    if '--selftest' in args:   # SW-IMP-7: a set corrected by the fix list re-matches with no finding and no change left
        fl = json.load(open(f'{OUT}/fixlist.json'))
        _, _, findings, summary, fixes = main(apply_fixes(read_drawings(rec), fl))
        left = sum(len(v) for v in fixes.values())
        print(f"corrected set: {len(findings)} findings, {left} changes left, coordinate sign {summary['coordinateSign']}")
        for f in findings[:10]:
            print(' ', f['drawing'], f['code'], f['message'])
        sys.exit(0 if not findings and not left and summary['coordinateSign'] == 'conventional' else 1)
    files, summary = outputs(rec)
    if '--check' in args:
        bad = [k for k, v in files.items() if open(os.path.join(OUT, k)).read() != v]
        print('differs: ' + ', '.join(bad) if bad else ', '.join(files) + ' equal a fresh run')
        sys.exit(1 if bad else 0)
    for k, v in files.items():
        open(os.path.join(OUT, k), 'w').write(v)
    print(json.dumps(summary, indent=1))
