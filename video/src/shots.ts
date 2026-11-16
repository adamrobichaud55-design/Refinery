// The camera script. Coordinates are the plant's own, in inches: x along the plant (east is +x), y up, z across.
// The film is an assembly: a black void where the pipe rack builds
// ahead of the camera, the equipment drops in, a control station assembles part by part, the finished unit stands
// on a reflecting floor, and the building's frame and cladding close over it.
export type V3 = [number, number, number];
export type Mode = 'editor' | 'void';
export interface Shot {
  id: string; dur: number; mode: Mode; eye: V3[]; tgt: V3[]; fov: number;
  ease?: number;        // 0 = linear travel, 1 = full ease in and out
  cut?: boolean;        // false: the camera carries on from the previous shot without a cut
  mirror?: boolean;     // the reflecting floor
  tags?: number;        // how many equipment items the overlay may frame
  reach?: number;
}
export const FPS = 24;
export const SHOTS: Shot[] = [
  { id: 'rack', dur: 5.0, mode: 'void', fov: 62, ease: 0.0, tags: 0,
    eye: [[-560, 350, 330], [-300, 322, 150], [60, 302, 40], [700, 298, 26], [1500, 298, 24], [2300, 298, 26], [2900, 304, 30]],
    tgt: [[260, 285, 0], [420, 288, 0], [760, 290, 0], [1500, 292, 0], [2300, 292, 0], [3100, 290, 10], [3700, 270, 60]] },
  { id: 'rise', dur: 3.8, mode: 'void', fov: 46, ease: 0.25, cut: false, tags: 6, reach: 2600,
    eye: [[2900, 304, 30], [3500, 520, 520], [3500, 900, 1350], [2500, 860, 1750]], tgt: [[3700, 270, 60], [2900, 170, 60], [2300, 130, 0], [1700, 120, 0]] },
  { id: 'column', dur: 3.2, mode: 'void', fov: 58, ease: 0.3, tags: 2, reach: 700,
    eye: [[1105, 30, -150], [1150, 120, -235], [1085, 260, -200], [985, 345, -170]], tgt: [[840, 70, -330], [840, 150, -330], [840, 250, -330], [840, 305, -300]] },
  { id: 'station', dur: 3.4, mode: 'void', fov: 40, ease: 0.5, cut: false, tags: 0,
    eye: [[985, 345, -170], [950, 322, -205], [925, 310, -245], [915, 306, -275]], tgt: [[840, 305, -300], [840, 301, -255], [840, 300, -240], [840, 300, -246]] },
  { id: 'hero', dur: 3.8, mode: 'void', fov: 34, ease: 0.4, mirror: true, tags: 0,
    eye: [[4350, 105, 1250], [4180, 115, 1400], [3980, 125, 1540]], tgt: [[2450, 175, 0], [2400, 175, 0], [2350, 175, 0]] },
  { id: 'building', dur: 5.6, mode: 'void', fov: 34, ease: 0.6, cut: false, mirror: true, tags: 0,
    eye: [[3980, 125, 1540], [4350, 380, 1850], [4450, 580, 2000]], tgt: [[2350, 175, 0], [2200, 170, 60], [2100, 150, 120]] },
];
