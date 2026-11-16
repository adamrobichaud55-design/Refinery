// The camera script. Coordinates are the plant's own, in inches: x along the plant (east is +x), y up, z across.
// The film is one unbroken camera move with no cuts: the pipe rack builds ahead of the camera, the camera leaves by the
// east end and turns back while the equipment drops in, comes down to the column where a control station assembles part
// by part, pulls back to the finished unit on a reflecting floor, and rises while the building's frame and cladding
// close over it. The keys are joined by a spline and then smoothed in time (film.ts), so speed and direction never jump.
export type V3 = [number, number, number];
export interface Key { t: number; eye: V3; tgt: V3; fov: number }
export const FPS = 24;
export const KEYS: Key[] = [
  // through the rack
  { t: 0.0, eye: [-560, 350, 330], tgt: [260, 285, 0], fov: 62 },
  { t: 0.9, eye: [-300, 322, 150], tgt: [420, 288, 0], fov: 62 },
  { t: 1.6, eye: [60, 302, 40], tgt: [760, 290, 0], fov: 62 },
  { t: 2.5, eye: [700, 298, 26], tgt: [1500, 292, 0], fov: 62 },
  { t: 3.4, eye: [1500, 298, 24], tgt: [2300, 292, 0], fov: 62 },
  { t: 4.3, eye: [2300, 298, 26], tgt: [3100, 290, 10], fov: 62 },
  { t: 5.0, eye: [2900, 304, 30], tgt: [3700, 270, 60], fov: 62 },
  // out of the east end, a wide turn back over the tanks
  { t: 5.9, eye: [3230, 400, 300], tgt: [3600, 200, 150], fov: 56 },
  { t: 6.9, eye: [3480, 540, 720], tgt: [3560, 130, 200], fov: 50 },
  { t: 8.0, eye: [3500, 740, 1200], tgt: [2900, 140, 0], fov: 47 },
  { t: 8.9, eye: [3150, 860, 1560], tgt: [2300, 130, 0], fov: 46 },
  { t: 9.8, eye: [2500, 860, 1750], tgt: [1700, 120, 0], fov: 46 },
  // down across the rack to the column
  { t: 10.9, eye: [2050, 600, 650], tgt: [1200, 200, -150], fov: 46 },
  { t: 11.8, eye: [1650, 500, -60], tgt: [900, 270, -300], fov: 47 },
  { t: 12.7, eye: [1250, 410, -195], tgt: [840, 295, -300], fov: 45 },
  { t: 13.6, eye: [985, 345, -170], tgt: [840, 303, -262], fov: 42 },
  // in on the control station
  { t: 14.8, eye: [952, 322, -200], tgt: [840, 300, -248], fov: 40 },
  { t: 15.9, eye: [932, 312, -230], tgt: [840, 300, -248], fov: 40 },
  { t: 17.0, eye: [920, 307, -250], tgt: [840, 300, -248], fov: 40 },
  // a long pull back over the rack to the east end
  { t: 18.0, eye: [1090, 420, -150], tgt: [850, 295, -240], fov: 40 },
  { t: 19.0, eye: [1700, 560, 300], tgt: [1300, 230, -100], fov: 38 },
  { t: 20.0, eye: [2700, 470, 900], tgt: [1900, 190, 0], fov: 36 },
  { t: 21.0, eye: [3500, 250, 1320], tgt: [2300, 175, 0], fov: 34 },
  { t: 21.9, eye: [3900, 125, 1500], tgt: [2350, 175, 0], fov: 34 },
  // the finished unit, then up and back as the building closes
  { t: 24.1, eye: [4020, 140, 1600], tgt: [2350, 175, 0], fov: 34 },
  { t: 26.9, eye: [4350, 380, 1850], tgt: [2200, 170, 60], fov: 34 },
  { t: 29.7, eye: [4450, 580, 2000], tgt: [2100, 150, 120], fov: 34 },
];
export const TOTAL = KEYS[KEYS.length - 1].t;
/** when things happen along the move (seconds) */
export const AT = {
  rackEnd: 5.0,                  // the rack has built itself to the east end
  drop: 5.5,                     // the equipment starts to land
  station: 13.6,                 // the control station starts to assemble
  mirror: [21.2, 22.1] as const, // the floor turns from matt to reflecting
  building: [24.1, 29.7] as const,
  tags: [{ a: 5.2, b: 10.6, n: 6, reach: 2600 }, { a: 11.8, b: 14.1, n: 2, reach: 700 }],
  labels: [13.6, 17.5] as const, // the station's part labels
};
