// Coverage of the owner's symbol set (DESIGN_BASIS.md §63, SW-COV-1/2): counts every symbol class in a plant's piping
// model and reports the classes below the floor of 20 instances, 4 lines and 2 sizes.
//   vite-node tools/coverage.ts public/plants/P2/plant-piping.json [--json out.json]
import { readFileSync, writeFileSync } from 'node:fs';
import type { PipingModel, Comp, LineRun } from '../src/generator/piping';

export const SYMBOL_CLASSES = [
  'gate_valve', 'forged_gate_valve', 'forged_gate_valve_th', 'globe_valve', 'forged_globe_valve_th', 'check_valve', 'forged_check_valve_th',
  'ball_valve', 'ball_valve_3pc', 'butterfly_valve', 'plug_valve', 'control_valve', 'needle_valve', 'three_way_valve', 'four_way_valve', 'relief_valve', 'rotary_valve',
  'gate_valve_th_plugged', 'flange', 'slip_on_flange', 'sw_flange', 'nozzle_flange', 'blind_flange', 'spade', 'spectacle',
  'elbow_90', 'elbow_45', 'tee', 'reducer', 'eccentric_reducer', 'cap', 'sw_elbow_90', 'sw_elbow_45', 'sw_tee', 'socket_weld',
  'coupling_sw', 'coupling_th', 'branch_outlet', 'branch_outlet_sw', 'branch_outlet_th', 'swage', 'swage_sw', 'swage_th', 'nipple', 'plug',
  'weld', 'weld_field', 'pipe_support', 'dummy_leg', 'anchor', 'floor_penetration', 'wall_penetration',
] as const;
export type SymbolClass = typeof SYMBOL_CLASSES[number];

/** SW-COV-1: the symbol classes of a component (a plugged threaded gate valve counts twice: as the valve and as the plugged form) */
export function classesOf(c: Comp, line: LineRun): SymbolClass[] {
  const k = c.key.split('|');
  switch (c.kind) {
    case 'valve': {
      const type = k[1], ends = k[4] ?? 'RF';
      if (type === 'GATE') { if (ends === 'SW') return ['forged_gate_valve']; if (ends === 'TH') return ['forged_gate_valve_th', ...(nextIsPlug(c, line) ? ['gate_valve_th_plugged' as const] : [])]; return ['gate_valve']; }
      if (type === 'GLOBE' || type === 'YGLOBE' || type === 'AGLOBE') return ends === 'TH' ? ['forged_globe_valve_th'] : ['globe_valve'];
      if (type === 'CHECK' || type === 'LCHECK') return ends === 'TH' ? ['forged_check_valve_th'] : ['check_valve'];
      if (type === 'BALL') return ends === 'SW' ? ['ball_valve_3pc'] : ['ball_valve'];
      if (type === 'BFLY' || type === 'LBFLY' || type === 'DBFLY') return ['butterfly_valve'];
      if (type === 'PLUG') return ['plug_valve'];
      if (type === 'CONTROL') return ['control_valve'];
      if (type === 'NEEDLE') return ['needle_valve'];
      if (type === 'TWAY') return ['three_way_valve'];
      if (type === 'FWAY') return ['four_way_valve'];
      if (type === 'PSV') return ['relief_valve'];
      if (type === 'ROTARY') return ['rotary_valve'];
      return [];
    }
    case 'flange': return k[0] === 'SOF' ? ['slip_on_flange'] : k[0] === 'SWF' ? ['sw_flange'] : ['flange'];
    case 'blind': return ['blind_flange'];
    case 'spade': return ['spade'];
    case 'spectacle': return ['spectacle'];
    case 'elbow': return k[0] === 'SWEL' ? [k[3] === '45' ? 'sw_elbow_45' : 'sw_elbow_90'] : [k[3] === '45' ? 'elbow_45' : 'elbow_90'];
    case 'tee': return k[0] === 'SWTEE' ? ['sw_tee'] : ['tee'];
    case 'reducer': return k[0] === 'REDE' ? ['eccentric_reducer'] : ['reducer'];
    case 'cap': return ['cap'];
    case 'coupling': return k[3] === 'SW' ? ['coupling_sw'] : ['coupling_th'];
    case 'olet': return k[4] === 'SW' ? ['branch_outlet_sw'] : k[4] === 'TH' ? ['branch_outlet_th'] : ['branch_outlet'];
    case 'swage': return k[4] === 'SW' ? ['swage_sw'] : k[4] === 'TH' ? ['swage_th'] : ['swage'];   // by the larger end (SW-COV-1)
    case 'nipple': return ['nipple'];
    case 'plug': return ['plug'];
    case 'penetration': return k[0] === 'FSLV' ? ['floor_penetration'] : ['wall_penetration'];
    default: return [];
  }
}
const nextIsPlug = (c: Comp, line: LineRun) => { const i = line.comps.indexOf(c); return line.comps.slice(i + 1, i + 3).some(x => x.kind === 'plug'); };

export interface Coverage { counts: Record<SymbolClass, number>; lines: Record<SymbolClass, number>; sizes: Record<SymbolClass, number>; short: { cls: SymbolClass; count: number; lines: number; sizes: number }[] }
export function coverage(m: PipingModel): Coverage {
  const counts = Object.fromEntries(SYMBOL_CLASSES.map(c => [c, 0])) as Record<SymbolClass, number>;
  const lines = Object.fromEntries(SYMBOL_CLASSES.map(c => [c, new Set<string>()])) as Record<SymbolClass, Set<string>>;
  const sizes = Object.fromEntries(SYMBOL_CLASSES.map(c => [c, new Set<number>()])) as Record<SymbolClass, Set<number>>;
  const hit = (cls: SymbolClass, line: string, NPS: number) => { counts[cls]++; lines[cls].add(line); sizes[cls].add(NPS); };
  for (const l of m.lines) {
    for (const c of [...l.comps, ...(l.pens ?? []), ...(l.side ?? [])]) for (const cls of classesOf(c, l)) hit(cls, l.no, c.NPS);
    for (const w of l.welds) hit(w.type === 'SW' ? 'socket_weld' : w.field ? 'weld_field' : 'weld', l.no, w.NPS);
    for (const s of l.supports) hit(s.type === 'trunnion' ? 'dummy_leg' : s.type === 'anchor' ? 'anchor' : 'pipe_support', l.no, l.NPS);
  }
  for (const n of m.nozzles) for (const c of n.comps) if (c.kind === 'flange') hit('nozzle_flange', n.id, c.NPS);
  const sized = new Set<SymbolClass>(['weld', 'weld_field', 'socket_weld', 'pipe_support', 'dummy_leg', 'anchor', 'floor_penetration', 'wall_penetration']);
  const short = SYMBOL_CLASSES.filter(c => counts[c] < 20 || lines[c].size < 4 || (!sized.has(c) && sizes[c].size < 2)).map(c => ({ cls: c, count: counts[c], lines: lines[c].size, sizes: sizes[c].size }));
  return { counts, lines: Object.fromEntries(SYMBOL_CLASSES.map(c => [c, lines[c].size])) as Record<SymbolClass, number>, sizes: Object.fromEntries(SYMBOL_CLASSES.map(c => [c, sizes[c].size])) as Record<SymbolClass, number>, short };
}

if (process.argv[1]?.endsWith('coverage.ts')) {
  const m = JSON.parse(readFileSync(process.argv[2] ?? 'public/plants/P2/plant-piping.json', 'utf8')) as PipingModel, cov = coverage(m);
  for (const c of SYMBOL_CLASSES) console.log(`${c.padEnd(24)} ${String(cov.counts[c]).padStart(5)}  lines ${String(cov.lines[c]).padStart(3)}  sizes ${cov.sizes[c]}${cov.short.some(s => s.cls === c) ? '   << below the floor' : ''}`);
  console.log(`\n${cov.short.length} classes below the floor (SW-COV-2)`);
  const i = process.argv.indexOf('--json'); if (i > 0) writeFileSync(process.argv[i + 1], JSON.stringify(cov, null, 1));
}
