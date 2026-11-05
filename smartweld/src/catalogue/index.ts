/** Catalogue entry point: a designation string (plus length) → PartSpec. */
import { parseDesignation } from './designation';
import { makeWideFlange } from './parts/wideFlange';
import { makeChannel } from './parts/channel';
import { makeAngle } from './parts/angle';
import { makeHssRect, makeHssRound } from './parts/hss';
import { makePlate } from './parts/plates';
import { makeBolt } from './parts/hardware';
import { makeFilletWeld, makeGrooveWeld } from './parts/welds';
import { makeZ, makeCS } from './parts/coldFormed';
import { makeRod } from './parts/rod';
import { makePanel } from './parts/cladding';
import type { PartSpec } from './part';

export * from './part';
export * from './designation';
export * from './parts/wideFlange';
export * from './parts/channel';
export * from './parts/angle';
export * from './parts/hss';
export * from './parts/plates';
export * from './parts/hardware';
export * from './parts/welds';
export * from './parts/coldFormed';
export * from './parts/cladding';
export * from './parts/rod';
export * from './parts/access';
export * from './parts/equipment';
export * from './parts/pipe';
export * from './parts/valves';
export * from './parts/fittings';
export * from './parts/smallbore';

/** Build a part from drawing text. `length` is the member/weld length in inches where the designation has none. */
export function makePart(id: string, designation: string, length = 120): PartSpec {
  const d = parseDesignation(designation);
  switch (d.kind) {
    case 'W': return makeWideFlange(id, d.D, d.w, length);
    case 'C': return makeChannel(id, d.D, d.w, length);
    case 'L': return makeAngle(id, d.a, d.b, d.t, length);
    case 'HSS_RECT': return makeHssRect(id, d.H, d.B, d.t, length);
    case 'HSS_ROUND': return makeHssRound(id, d.OD, d.t, length);
    case 'PL': return makePlate(id, d.t, d.w, d.L ?? length);
    case 'B': return makeBolt(id, d.d, d.L);
    case 'FW': return makeFilletWeld(id, length, { leg: d.leg });
    case 'GW': return makeGrooveWeld(id, d.t, length);
    case 'Z': return makeZ(id, d.D, d.B, d.t, length);
    case 'CS': return makeCS(id, d.D, d.B, d.t, length);
    case 'RD': return makeRod(id, d.d, length);
    case 'PNL': return makePanel(id, length, undefined, d.cover);
    case 'AR': throw new Error('Anchor rods are built from a base plate (makeAnchorRod), not from text alone');
  }
}
