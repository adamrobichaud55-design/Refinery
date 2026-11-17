// The camera script. Coordinates are the plant's own, in inches: x along the plant (east is +x), y up, z across.
// The film is one unbroken camera move with no cuts: the pipe rack builds ahead of the camera, the camera leaves by the
// east end and turns back while the equipment drops in, comes down to the column and tracks along a control station as it assembles
// part by part, pulls back along the plant's south face to the finished unit, and rises while the building's frame and cladding
// close over it. The keys are joined by a spline and then smoothed in time (film.ts), so speed and direction never jump.
export type V3 = [number, number, number];
export interface Key { t: number; eye: V3; tgt: V3; fov: number }
export const FPS = 30;   // divides evenly into a phone's 60 Hz, so playback does not judder
export const KEYS: Key[] = [
  // through the rack, in the clear lane between the crossovers and the top tier
  { t: 0.0, eye: [-560, 350, 330], tgt: [260, 285, 0], fov: 62 },
  { t: 0.9, eye: [-300, 326, 190], tgt: [420, 292, 40], fov: 62 },
  { t: 1.6, eye: [60, 315, 100], tgt: [760, 302, 72], fov: 62 },
  { t: 2.5, eye: [700, 314, 86], tgt: [1500, 302, 72], fov: 62 },
  { t: 3.4, eye: [1500, 314, 86], tgt: [2300, 302, 72], fov: 62 },
  { t: 4.3, eye: [2300, 314, 86], tgt: [3100, 295, 62], fov: 62 },
  { t: 5.0, eye: [2900, 312, 70], tgt: [3700, 270, 60], fov: 62 },
  // out of the east end, a wide turn back over the tanks
  { t: 5.9, eye: [3230, 400, 300], tgt: [3600, 200, 150], fov: 56 },
  { t: 6.9, eye: [3480, 540, 720], tgt: [3560, 130, 200], fov: 50 },
  { t: 8.0, eye: [3500, 740, 1200], tgt: [2900, 140, 0], fov: 47 },
  { t: 8.9, eye: [3150, 860, 1560], tgt: [2300, 130, 0], fov: 46 },
  { t: 9.8, eye: [2500, 860, 1750], tgt: [1700, 120, 0], fov: 46 },
  // down across the rack to the open (west) side of the column's control station
  { t: 10.9, eye: [1700, 640, 800], tgt: [1000, 230, -200], fov: 46 },
  { t: 11.9, eye: [1000, 520, 250], tgt: [850, 290, -250], fov: 46 },
  { t: 12.9, eye: [670, 430, -60], tgt: [840, 300, -255], fov: 44 },
  { t: 13.9, eye: [722, 335, -238], tgt: [840, 302, -262], fov: 42 },
  // along the station as it assembles
  { t: 15.0, eye: [758, 312, -262], tgt: [840, 300, -262], fov: 40 },
  { t: 16.1, eye: [764, 308, -240], tgt: [840, 300, -236], fov: 40 },
  { t: 17.2, eye: [764, 308, -218], tgt: [840, 300, -214], fov: 40 },
  // back and up over the rack, then along the plant's south face to the east end
  { t: 18.2, eye: [690, 400, -120], tgt: [860, 295, -240], fov: 40 },
  { t: 19.2, eye: [800, 470, 420], tgt: [1000, 250, -150], fov: 39 },
  { t: 20.2, eye: [1500, 410, 930], tgt: [1800, 200, -50], fov: 38 },
  { t: 21.2, eye: [2600, 300, 1300], tgt: [2400, 180, 0], fov: 36 },
  { t: 22.0, eye: [3400, 190, 1450], tgt: [2380, 175, 0], fov: 34 },
  { t: 22.8, eye: [3900, 125, 1500], tgt: [2350, 175, 0], fov: 34 },
  // the finished unit, then up and back as the building closes
  { t: 25.0, eye: [4020, 140, 1600], tgt: [2350, 175, 0], fov: 34 },
  { t: 27.8, eye: [4350, 380, 1850], tgt: [2200, 170, 60], fov: 34 },
  { t: 30.6, eye: [4450, 580, 2000], tgt: [2100, 150, 120], fov: 34 },
];
export const TOTAL = KEYS[KEYS.length - 1].t;
/** when things happen along the move (seconds) */
export const AT = {
  rackEnd: 5.0,                  // the rack has built itself to the east end
  drop: 5.5,                     // the equipment starts to land
  station: 13.9,                 // the control station starts to assemble
  wide: 22.1,                    // from here the camera is far off and slow
  building: [25.0, 30.6] as const,
  tags: [{ a: 5.2, b: 10.6, n: 6, reach: 2600 }, { a: 11.9, b: 14.2, n: 2, reach: 700 }],
  labels: [13.9, 17.8] as const, // the station's part labels
};
