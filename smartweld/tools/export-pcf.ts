// Piping component files, one per line, from a plant's committed ground truth (DESIGN_BASIS.md SW-PCF-1..4).
//   vite-node tools/export-pcf.ts [P1|P2]      writes <groundtruth>/../pcf/<line>.pcf and an index
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pcfFor, chained, pcfDir, pcfName } from '../src/exchange/pcf';
import type { GTLine } from '../src/generator/groundtruth';
import { plantById } from '../src/generator/plants';

function exportPcf(groundtruth: string): { files: number; bytes: number; unchained: string[] } {
  const dir = groundtruth, out = pcfDir(groundtruth);
  const lines = readdirSync(join(dir, 'lines')).sort().map(f => JSON.parse(readFileSync(join(dir, 'lines', f), 'utf8')) as GTLine);
  rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
  let bytes = 0; const unchained: string[] = [], index: string[] = ['line,file,records'];
  for (const L of lines) {
    const text = pcfFor(L, lines), name = pcfName(L.header.line);
    writeFileSync(join(out, name), text); bytes += text.length;
    if (!chained(L)) unchained.push(L.header.line);
    index.push(`"${L.header.line.replace(/"/g, '""')}",${name},${L.items.length + L.welds.length + L.supports.length}`);   // the inch mark doubled inside the quotes (valid CSV)
  }
  writeFileSync(join(out, 'INDEX.csv'), index.join('\n') + '\n');
  return { files: lines.length, bytes, unchained };
}

{
  const plant = plantById(process.argv[2] ?? 'P1'), t0 = Date.now();
  const r = exportPcf(plant.paths.groundtruth);
  console.log(`${plant.id}: ${r.files} PCF files, ${(r.bytes / 1e6).toFixed(1)} MB → ${pcfDir(plant.paths.groundtruth)} in ${((Date.now() - t0) / 1000).toFixed(1)} s${r.unchained.length ? `; NOT CHAINED: ${r.unchained.join(', ')}` : ''}`);
}
