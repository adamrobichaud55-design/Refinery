// The camera script. Coordinates are the plant's own, in inches: x along the building (east is +x), y up, z across.
export type V3 = [number, number, number];
export interface Shot { dur: number; eye: V3[]; tgt: V3[]; cap: string; sub: string; fov?: number; ease?: number; reach?: number; maxTags?: number }
export const FPS = 24, TITLE_SECONDS = 3.0;
export const SHOTS: Shot[] = [
  { dur: 4.6, cap: 'Crude topping unit', sub: 'Plant 3 · built from the SmartWeld catalogue', reach: 2600, maxTags: 6, fov: 38,
    eye: [[4900, 1250, 1900], [4450, 820, 1500], [4050, 470, 1150]], tgt: [[2100, 60, 0], [2700, 110, 30], [3150, 140, 80]] },
  { dur: 3.4, cap: 'Tank farm', sub: 'Crude · naphtha · residue · distillate', reach: 1300, maxTags: 5,
    eye: [[4020, 95, 900], [3960, 130, 420], [3900, 190, -120], [3830, 250, -520]], tgt: [[3420, 150, 420], [3380, 140, 150], [3330, 130, -140], [3300, 120, -420]] },
  { dur: 4.6, cap: 'Pipe rack', sub: 'Nine utility headers over three tiers', reach: 900, maxTags: 4, fov: 50, ease: 0.2,
    eye: [[2820, 302, 30], [2300, 298, 22], [1750, 296, 26], [1250, 300, 30]], tgt: [[2250, 262, 0], [1730, 258, 0], [1180, 258, 0], [680, 262, 0]] },
  { dur: 4.2, cap: 'Crude column C-301', sub: 'Feed · overhead · side draw · bottoms', reach: 800, maxTags: 3,
    eye: [[1130, 60, -205], [1120, 170, -185], [1075, 280, -180], [1010, 350, -190]], tgt: [[840, 110, -330], [840, 180, -330], [840, 250, -330], [840, 300, -330]] },
  { dur: 3.6, cap: 'Pump row', sub: 'Check · gate · control stations', reach: 520, maxTags: 4, fov: 46, ease: 0.2,
    eye: [[1860, 58, 168], [2060, 56, 166], [2260, 58, 168], [2450, 62, 170]], tgt: [[2110, 44, 246], [2310, 44, 246], [2510, 46, 246], [2690, 50, 248]] },
  { dur: 3.8, cap: 'Preheat and desalting', sub: 'E-301 / E-302 · V-301 / V-302', reach: 900, maxTags: 4,
    eye: [[1820, 110, 175], [1380, 135, 180], [960, 190, 185], [760, 250, 150]], tgt: [[1560, 80, 330], [1100, 110, 330], [600, 190, 330], [480, 230, 330]] },
];
