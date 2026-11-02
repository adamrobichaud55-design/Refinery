"""
Parse imported isometric drawing PDFs (stage 8, DESIGN_BASIS.md §53) into sheet records.

Each sheet's words and their positions come from `pdftotext -bbox` (poppler, run as an external program).
From the words this reads:
  - the title block: line number, piping class, design pressure, insulation, fluid, drawing number,
    sheet n of m and revision;
  - the bill of materials: PT, QTY, NPS, description (wrapped lines are joined);
  - the drawing area: weld labels (W<n>), continuation blocks (CONT'D ON / FROM, sheet and E/N/EL point),
    and the FROM / TO end labels.
Standard library only; pdftotext (poppler-utils 24.02) is run as a separate program, not linked or shipped.
"""
import html
import re
import subprocess
import sys

WORD = re.compile(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>')
LINE_NO = re.compile(r'^\d[0-9/-]*"-[A-Z]\d+-[A-Z]+-\d+$')
DWG_NO = re.compile(r'^ISO-[A-Z]+-\d+$')
FT_IN = re.compile(r'''^(-?)(?:(\d+)'-?)?(?:(\d+)?(?:[- ]?(\d+)/(\d+))?")?$''')


def ft_in(s):
    """feet-inches text such as 52'-2", 0", 3/4", 29'-3/4", 6'-1/2" or -3'-6" to inches; None if not one"""
    s = s.strip()
    m = FT_IN.match(s)
    if not m or s in ('', '-', '"'):
        return None
    sign, ft, inch, num, den = m.groups()
    v = (int(ft) if ft else 0) * 12 + (int(inch) if inch else 0) + (int(num) / int(den) if num else 0)
    return -v if sign else v


def coord(s, feet_only_sign=False):
    """a coordinate value; a dimension word that happens to touch the block on the same row is dropped.
    feet_only_sign: read '-12'-6"' as -12 ft + 6 in (the minus applying to the feet only) instead of -(12 ft 6 in)"""
    t = s.split(' ')
    for k in (len(t), 2, 1):
        txt = ' '.join(t[:k])
        v = ft_in(txt)
        if v is not None:
            if feet_only_sign and v < 0 and "'" in txt:
                ft = int(txt.split("'")[0])
                v = 12 * ft + (abs(v) - 12 * abs(ft))
            return v
    return None


def pages(pdf):
    out = subprocess.run(['pdftotext', '-bbox', pdf, '-'], check=True, capture_output=True, text=True).stdout
    for chunk in out.split('<page ')[1:]:
        yield [dict(x0=float(a), y0=float(b), x1=float(c), y1=float(d), t=html.unescape(t)) for a, b, c, d, t in WORD.findall(chunk)]


def rows(words, tol=2.5):
    """group words into text rows by their top edge, each row left to right"""
    out = []
    for w in sorted(words, key=lambda w: (w['y0'], w['x0'])):
        if out and abs(out[-1][0]['y0'] - w['y0']) <= tol:
            out[-1].append(w)
        else:
            out.append([w])
    return [sorted(r, key=lambda w: w['x0']) for r in out]


def find(words, text, **cond):
    return [w for w in words if w['t'] == text and all(f(w) for f in cond.values())]


def below(words, head, dy=(4, 30), dx=6):
    """the words of the first row under a title-block heading that starts at the heading's left edge"""
    first = [w for w in words if head['y1'] + dy[0] <= w['y0'] <= head['y1'] + dy[1] and abs(w['x0'] - head['x0']) <= dx]
    if not first:
        return []
    f = min(first, key=lambda w: w['y0'])
    r = sorted([w for w in words if abs(w['y0'] - f['y0']) < 2.5 and w['x0'] >= f['x0']], key=lambda w: w['x0'])
    out = [f]
    for w in r[1:]:
        if w['x0'] - out[-1]['x1'] > 14:  # the next column: a gap wider than about three spaces
            break
        out.append(w)
    return out


def title_block(words):
    tb = {}
    def val(label_words, key):
        heads = [w for w in words if w['t'] == label_words[0] and w['y0'] > 560]
        for h in heads:
            if len(label_words) > 1:
                nxt = [w for w in words if w['t'] == label_words[1] and abs(w['y0'] - h['y0']) < 2 and 0 < w['x0'] - h['x1'] < 10]
                if not nxt:
                    continue
            v = below(words, h)
            if v:
                tb[key] = ' '.join(w['t'] for w in v)
                return
    val(['LINE', 'NO.'], 'line')
    if 'line' in tb:
        tb['line'] = tb['line'].split(' ')[0]
    val(['PIPING', 'CLASS'], 'pipingClass')
    val(['DESIGN', 'PRESS.'], 'designPress')
    val(['DESIGN', 'TEMP.'], 'designTemp')
    val(['TEST', 'PRESS.'], 'testPress')
    val(['INSULATION'], 'insulation')
    val(['PAINT'], 'paint')
    val(['PWHT'], 'pwht')
    val(['NDE'], 'nde')
    val(['FLUID'], 'fluid')
    val(['DRAWING', 'NO.'], 'drawing')
    val(['SHEET'], 'sheet')
    val(['DATE'], 'date')
    title = [w for w in words if w['t'] == 'TITLE' and w['y0'] > 560]
    if title:
        tb['title'] = ' '.join(w['t'] for w in below(words, title[0], dy=(4, 40)))
    # strip neighbouring REV column from the SHEET value ('1 OF 5')
    m = re.match(r'^(\d+) OF (\d+)', tb.get('sheet', ''))
    if m:
        tb['sheetNo'], tb['sheets'] = int(m.group(1)), int(m.group(2))
    revh = [w for w in words if w['t'] == 'REV' and w['y0'] > 560 and 'SHEET' in [x['t'] for x in words if abs(x['y0'] - w['y0']) < 2]]
    if revh:
        v = below(words, revh[0])
        tb['rev'] = v[0]['t'] if v else None
    return tb


def bom(words):
    pt = [w for w in words if w['t'] == 'PT' and w['y0'] < 120]
    if not pt:
        return [], None
    pt = pt[0]
    hdr = {w['t']: w['x0'] for w in words if abs(w['y0'] - pt['y0']) < 2}
    x_qty, x_nps, x_desc = hdr['QTY'], hdr['NPS'], hdr['DESCRIPTION']
    rev = [w for w in words if w['t'] == 'REV' and w['x0'] >= pt['x0'] - 4]
    y_end = min(w['y0'] for w in rev) if rev else 1e9
    area = [w for w in words if w['x0'] >= pt['x0'] - 4 and pt['y1'] + 1 < w['y0'] < y_end]
    items = []
    for r in rows(area):
        first = r[0]
        if abs(first['x0'] - pt['x0']) < 4 and first['t'].isdigit():
            qty = ' '.join(w['t'] for w in r if x_qty - 4 <= w['x0'] < x_nps - 4)
            nps = ' '.join(w['t'] for w in r if x_nps - 4 <= w['x0'] < x_desc - 4)
            desc = ' '.join(w['t'] for w in r if w['x0'] >= x_desc - 4)
            items.append(dict(pt=int(first['t']), qty=qty, nps=nps, description=desc))
        elif items and all(w['x0'] >= x_desc - 4 for w in r):
            items[-1]['description'] += ' ' + ' '.join(w['t'] for w in r)
    for it in items:
        q = it['qty']
        it['length'] = ft_in(q) if ("'" in q or '"' in q) else None
        it['count'] = int(q) if q.isdigit() else None
    return items, pt['x0']


def drawing_area(words, x_bom):
    tb_top = min([w['y0'] for w in words if w['t'] in ('NOTES:', 'TEST', 'INSULATION') and w['y0'] > 500] or [1e9])
    area = [w for w in words if w['x1'] < (x_bom or 1e9) - 6 and w['y1'] < tb_top - 2]
    welds = sorted({w['t'] for w in area if re.fullmatch(r'W\d+', w['t'])}, key=lambda s: int(s[1:]))
    # continuation blocks: CONT'D <ON|FROM> / ISO-x SH n / E .. / N .. / EL ..
    conts = []
    for c in [w for w in area if w['t'] == "CONT'D"]:
        col = sorted([w for w in area if abs(w['x0'] - c['x0']) < 3 and 0 <= w['y0'] - c['y0'] < 70], key=lambda w: w['y0'])
        lines_ = []
        for w in col:
            row, seg = sorted([x for x in area if abs(x['y0'] - w['y0']) < 2 and x['x0'] >= w['x0'] - 1], key=lambda x: x['x0']), []
            for x in row:  # the block's own words: a run with word gaps, cut at the first wider gap
                if seg and x['x0'] - seg[-1]['x1'] > 8:
                    break
                seg.append(x)
            lines_.append(' '.join(x['t'] for x in seg))
        txt = ' | '.join(lines_)
        m = re.search(r"CONT'D (ON|FROM)\b.*?\| (ISO-[A-Z]+-\d+)(?: SH (\d+))? \| E ([^|]+?) \| N ([^|]+?) \| EL ([^|]+?)(?: \||$)", txt)
        if m:
            d, dwg, sh, e, n, el = m.groups()
            conts.append(dict(dir=d.lower(), drawing=dwg, sheet=int(sh) if sh else None, E=coord(e), N=coord(n), EL=coord(el),
                              printed=dict(E=e, N=n, EL=el), alt=dict(E=coord(e, True), N=coord(n, True), EL=coord(el, True)), text=txt))
        else:
            conts.append(dict(dir=None, text=txt))
    # end labels: rows starting with FROM / TO
    ends = []
    for r in rows(area):
        for i, w in enumerate(r):
            if w['t'] in ('FROM', 'TO') and (i == 0 or w['x0'] - r[i - 1]['x1'] > 14) and not (i > 0 and r[i - 1]['t'] == "CONT'D"):
                seg = [w]
                for x in r[i + 1:]:
                    if x['x0'] - seg[-1]['x1'] > 14:
                        break
                    seg.append(x)
                if len(seg) > 1:
                    ends.append(dict(dir=w['t'].lower(), text=' '.join(x['t'] for x in seg[1:])))
    labels = sorted({w['t'] for w in area if not re.fullmatch(r"W\d+|\d+|[\d/'\"-]+|CONT'D|ON|FROM|TO|SH|E|N|EL", w['t'])})
    return dict(welds=welds, continuations=conts, ends=ends, otherText=labels)


def parse(pdf):
    out = []
    for i, words in enumerate(pages(pdf)):
        tb = title_block(words)
        if not tb.get('drawing'):
            out.append(dict(page=i + 1, kind='cover', text=' '.join(w['t'] for w in words)))
            continue
        items, xb = bom(words)
        out.append(dict(page=i + 1, kind='sheet', title=tb, bom=items, **drawing_area(words, xb)))
    return out


if __name__ == '__main__':
    import json
    print(json.dumps([dict(file=p, pages=parse(p)) for p in sys.argv[1:]], indent=1))
