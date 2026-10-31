/** Stage-1 demonstration assembly built from catalogue parts and placement transforms (plain data). */
import { makeWideFlange, makeBasePlate, makeAnchorRod, makeStiffener, makeFilletWeld, makePlate, proportionW, type PartSpec } from '../catalogue';
import type { Mat4 } from '../geometry/mesh';
import { multiply, translate, rotateY, standUp } from '../geometry/transform';

export interface Instance { part: PartSpec; transform: Mat4; }
export interface Assembly { name: string; description: string; instances: Instance[] }

/**
 * Column base: W column stub standing on a base plate on grout, 4 anchor rods, a transverse
 * stiffener pair at mid-height, and fillet welds along the outside of each flange.
 * Frames: parts are built with their profile in local xy and extruded along local +z;
 * standUp() maps local z → world +y and local y → world −z.
 */
export function columnBaseAssembly(D = 10, w = 49, stubLength = 48): Assembly {
  const col = proportionW(D, w);
  const column = makeWideFlange('COL-1', D, w, stubLength);
  const bp = makeBasePlate('BP-1', { column: col });
  const tbp = bp.dims.t.value, grout = bp.dims.grout.value, N = bp.dims.N.value, B = bp.dims.B.value;
  const rod = makeAnchorRod('AR-1', { basePlateT: tbp, groutT: grout, plateWasherT: bp.dims.washerT.value });
  const st = makeStiffener('ST-1', col);
  const inst: Instance[] = [];

  // Grout bed (SW-BP-5): plate profile has width along x and thickness along y, extruded along z → no rotation needed.
  const groutPad: PartSpec = { ...makePlate('GROUT-1', grout, B, N), designation: 'grout bed', notes: ['Grout bed, SW-BP-5. Non-steel; shown for the rod stack.'] };
  groutPad.weight = { ...groutPad.weight, value: 0, label: 'Not steel; weight not counted' };
  inst.push({ part: groutPad, transform: translate(0, grout / 2, -N / 2) });

  // Base plate: outline B along x, N along y, extruded by t along z → stand up so t is vertical and N runs along world z.
  inst.push({ part: bp, transform: multiply(translate(0, grout, 0), standUp()) });

  // Column: bf along x, d along y, axis z → stand up.
  const z0 = grout + tbp;
  inst.push({ part: column, transform: multiply(translate(0, z0, 0), standUp()) });

  // Anchor rods: local z = 0 at the concrete surface; hole (hx, hy) in the plate maps to world (hx, ·, −hy).
  for (const h of bp.extra!.holes as { x: number; y: number }[])
    inst.push({ part: rod, transform: multiply(translate(h.x, 0, -h.y), standUp()) });

  // Stiffener pair (SW-ST-*): outline x = outstand from the web face, y = along T, thickness along z = member axis.
  const yMid = z0 + stubLength / 2 - st.dims.ts.value / 2;
  inst.push({ part: st, transform: multiply(translate(col.tw / 2, yMid, col.T / 2), standUp()) });
  inst.push({ part: st, transform: multiply(translate(-col.tw / 2, yMid, -col.T / 2), multiply(rotateY(Math.PI), standUp())) });

  // Fillet welds column-to-plate along the outside of each flange (SW-WD-1, t_thin = min(tf, t_plate)).
  const fw = makeFilletWeld('FW-1', col.bf, { tThin: Math.min(col.tf, tbp) });
  inst.push({ part: fw, transform: multiply(translate(col.bf / 2, z0, col.d / 2), rotateY(-Math.PI / 2)) });
  inst.push({ part: fw, transform: multiply(translate(-col.bf / 2, z0, -col.d / 2), rotateY(Math.PI / 2)) });

  return {
    name: 'Column base',
    description: `W${D}x${w} stub on ${bp.designation}, 4 anchor rods ${rod.designation}, stiffener pair ${st.designation}, flange-toe fillet welds ${fw.designation}. Inside-flange and web welds not shown in this demo.`,
    instances: inst,
  };
}
