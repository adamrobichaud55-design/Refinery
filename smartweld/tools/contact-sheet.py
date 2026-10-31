"""Compose valve contact sheets from the viewer screenshots (crops the 3D view, tiles 4 across, labels each)."""
import sys
from PIL import Image, ImageDraw
src = sys.argv[1] if len(sys.argv) > 1 else 'screenshots/stage4'
SHEETS = {
    'sheet-1.png': ['v-GATE', 'v-GLOBE', 'v-YGLOBE', 'v-AGLOBE', 'v-CHECK', 'v-LCHECK-section', 'v-DCHECK', 'v-BALL', 'v-TBALL', 'v-BFLY', 'v-LBFLY', 'v-DBFLY'],
    'sheet-2.png': ['v-PLUG', 'v-DIAPH', 'v-NEEDLE', 'v-PSV', 'v-CONTROL', 'v-KNIFE', 'v-GATE-gear', 'v-GATE-section'],
}
W, H = 395, 380
for out, names in SHEETS.items():
    rows = (len(names) + 3) // 4
    sheet = Image.new('RGB', (4 * W, rows * H), (223, 230, 238))
    for i, n in enumerate(names):
        im = Image.open(f'{src}/{n}.png').convert('RGB').crop((230, 0, 1020, 860))
        im.thumbnail((W, H)); x, y = (i % 4) * W, (i // 4) * H
        sheet.paste(im, (x + (W - im.width) // 2, y + (H - im.height) // 2))
        d = ImageDraw.Draw(sheet); d.rectangle([x, y, x + 200, y + 18], fill='white'); d.text((x + 4, y + 3), n, fill='black')
    sheet.save(f'{src}/{out}'); print('wrote', f'{src}/{out}')
