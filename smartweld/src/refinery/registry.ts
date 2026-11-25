/**
 * Plant 3: the code layer (DESIGN_BASIS.md §76, SW-REG-0..8). Pressure equipment records, line records with their
 * fluid service and line class, and demonstration registration numbers.
 *
 * Everything marked `source: 'recalled'` is the assistant's recollection of general industry practice, applied at the
 * owner's instruction and flagged for the owner to verify (SW-REG-0). It shapes no geometry: every size, thickness,
 * weight and design condition here is the model's own (`source: 'model'`), read from the sized item and from the body
 * placed in the 3D model. Every registration number is invented by a rule from the item's tag (`source: 'invented'`);
 * none was issued by a regulator. These are demonstration records, not manufacturer's data reports and not
 * registrations.
 */
import { makeVerticalVessel, makeShellTubeExchanger, type PartSpec } from '../catalogue';
import { processModel } from './process';
import { sizing, allowable, designPressure, designTemperature, tubeCount, fireTubeCount, stationed, headerDesign, type EquipSize, type Side } from './sizing';
import { connection } from './headers';
import { FLUIDS } from './fluids';
import type { Equip, End, UnitSheet } from './flowsheet';
import { cells, siteParts } from './assemble';

export type Source = 'model' | 'recalled' | 'invented';
export interface Field<T> { value: T; source: Source }
const model = <T>(value: T): Field<T> => ({ value, source: 'model' }), recalled = <T>(value: T): Field<T> => ({ value, source: 'recalled' }), invented = <T>(value: T): Field<T> => ({ value, source: 'invented' });
/** a number from a tag, the same every time (FNV-1a) */
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const LETTERS = 'ABCDEFGHJKLMNPRSTUVWXY';
/** SW-REG-6: an invented design registration number, New Brunswick first (.7) */
export const designCrn = (tag: string) => `${LETTERS[hash(`crn:${tag}`) % LETTERS.length]}${1000 + (hash(`n:${tag}`) % 9000)}.7`;
export const FITTING_CATEGORIES = { A: 'pipe fittings', B: 'flanges', C: 'line valves', D: 'expansion joints and flexible connections', E: 'strainers, filters, separators and steam traps', F: 'measuring devices', G: 'relief devices', H: 'other pressure-retaining components' } as const;
export type FittingCategory = keyof typeof FITTING_CATEGORIES;
/** SW-REG-6: an invented fitting registration number for a category, class and fictional maker */
export const fittingCrn = (category: FittingCategory, cls: string, maker: string) => `0${category}${String(10000 + (hash(`fit:${category}:${cls}:${maker}`) % 90000))}.7`;
export const MAKERS = ['Demonstration Maker 1', 'Demonstration Maker 2', 'Demonstration Maker 3'], FABRICATORS = ['A', 'B', 'C', 'D', 'E', 'F'].map(l => `Demonstration Fabricator ${l}`);
/** the fictional maker of a component, by a rule from its identity */
export const makerOf = (id: string) => MAKERS[hash(`maker:${id}`) % MAKERS.length];
export const NOTICE = 'DEMONSTRATION DATA: not a manufacturer\'s data report, not a registration, not certified, not signed. Code names, report designations, test factors, examination and material labels are recalled from general knowledge and are for the owner to verify (SW-REG-0); every registration number is invented.';
const SUFFIX = 'ABCDEFGH', STEEL = 0.2836 /* lb/in³, K-1 */, HOT_HYDROGEN = new Set([13, 14, 15, 16]);
/** SW-EQC-30: the steel section of a tube of outside diameter d and wall d / 9, in² */
const tubeSection = (d: number) => Math.PI * (d - d / 9) * (d / 9);

// ───────────────────────── pressure equipment (SW-REG-1 to SW-REG-3) ─────────────────────────
const SECTION_VIII = 'ASME Boiler and Pressure Vessel Code, Section VIII, Division 1', SECTION_I = 'ASME Boiler and Pressure Vessel Code, Section I';
export interface Chamber {
  name: string; mawp: Field<number>; temperature: Field<number>; fullVacuum: Field<boolean>; testPressure: Field<number>; contents: string[];
  /** where a chamber's shell differs from the record's (a waste heat boiler behind its furnace, a boiler's drums) */ insideDiameter?: Field<number>; thickness?: Field<number>;
}
export interface EquipmentRecord {
  demonstration: true; notice: string; tag: string; item: string; unit: number; service: string; kind: string; shape: 'cylinder' | 'sphere' | 'tube bundle' | 'boiler';
  code: Field<string>; report: Field<string>; registration: Field<string>; fabricator: Field<string>; serial: Field<string>; yearBuilt: Field<number>;
  chambers: Chamber[]; mdmt: Field<number>; corrosionAllowance: Field<number>;
  shell: { material: Field<string>; insideDiameter?: Field<number>; length?: Field<number>; thickness?: Field<number>; heads?: Field<string> };
  tubes?: { material: Field<string>; count: Field<number>; outsideDiameter: Field<number>; length: Field<number>; surfaceFt2: Field<number> };
  parts?: { tag: string; description: string; /** a part with a report of its own (a boiler's drums) */ report?: Field<string>; insideDiameter?: Field<number>; thickness?: Field<number>; /** where it differs from the first chamber's */ mawp?: Field<number>; temperature?: Field<number> }[];
  radiography: Field<string>; jointEfficiency: Field<number>; heatTreatment: Field<string>; lethalService: Field<boolean>;
  nozzles: { mark: string; service: string; size: Field<number>; pipeClass: Field<string>; fluid: string }[];
  supports: Field<string>; relief: { tag: Field<string>; setPressure: Field<number> }[];
  emptyWeightLb?: Field<number>; weightBasis?: string; volumeFt3?: Field<number>; signatures: string;
}

/** the bodies placed in the model, by tag */
function bodies(): Map<string, PartSpec> {
  const m = new Map<string, PartSpec>();
  for (const { cell } of cells()) for (const q of cell.interior.equipment) m.set(q.tag, q.part);
  for (const p of siteParts()) if (p.tags.includes('equipment') && !m.has(p.tags[0])) m.set(p.tags[0], p.part);
  return m;
}
/** SW-EQC-38: the wall the catalogue gives a boiler's drum */
const drumWall = (ID: number) => Math.max(1, Math.ceil((ID / 48) * 8) / 8);

interface Plan { tag: string; report: 'U-1' | 'U-1A' | 'P-3'; shape: EquipmentRecord['shape']; service?: string; chambers: (Omit<Side, 'cls'> & { name: string; contents: string[]; ID?: number; t?: number })[]; ID?: number; L?: number; t?: number; material?: string; ca?: number; mdmt?: number; tubes?: { n: number; d: number; L: number }; parts?: EquipmentRecord['parts']; supports: string; weight?: number; weightBasis?: string; volume?: boolean }

/** SW-REG-1, SW-REG-2: the records an item gives, or none where it is outside this layer */
function plans(sh: UnitSheet, e: Equip, z: EquipSize, body: Map<string, PartSpec>): Plan[] {
  const d = z.d, names = (f: (port: string) => boolean) => [...new Set(z.nozzles.filter(q => f(q.port)).map(q => FLUIDS[q.fluid]?.name ?? q.fluid))], all = names(() => true);
  const proc = z.sides.process ?? Object.values(z.sides)[0], one = (name = 'vessel') => [{ name, ...proc, designP: z.designP, designT: z.designT, vacuum: z.vacuum, contents: all }];
  const w = (tag: string) => body.get(tag)?.weight.value, tags = (n: number) => (n > 1 ? Array.from({ length: n }, (_, k) => `${e.tag}${SUFFIX[k]}`) : [e.tag]);
  const tubesLb = (n: number, dia: number, L: number) => n * L * tubeSection(dia) * STEEL;
  switch (e.kind) {
    case 'column': return [{ tag: e.tag, report: 'U-1', shape: 'cylinder', chambers: one(), ID: d.D, L: d.TT, t: d.t, supports: 'skirt', weight: w(e.tag), weightBasis: 'shell, heads, skirt, platforms and ladders as drawn; trays not included', volume: !d.Dtop }];
    case 'reactor': return [{ tag: e.tag, report: 'U-1', shape: 'cylinder', chambers: one(), ID: d.D, L: d.TT ?? d.L, t: d.t, supports: d.TT ? 'skirt' : 'two saddles', weight: w(e.tag), weightBasis: 'shell, heads and supports as drawn; catalyst and internals not included', volume: true }];
    case 'drum': case 'desalter': case 'bullet': return [{ tag: e.tag, report: 'U-1A', shape: 'cylinder', chambers: one(), ID: d.D, L: d.L, t: d.t, supports: d.vertical ? 'skirt' : 'two saddles', weight: w(e.tag), weightBasis: 'shell, heads and supports as drawn', volume: true, ...(e.kind === 'bullet' && /^Three-carbon/.test(e.service) ? { mdmt: -50 } : {}) }];
    case 'deaerator': return [{ tag: e.tag, report: 'U-1A', shape: 'cylinder', chambers: one(), ID: d.D, L: d.L, t: d.t, supports: 'two saddles', weight: w(e.tag), weightBasis: 'storage vessel, heater section and saddles as drawn', volume: true }];
    case 'filter': case 'vessel': return tags(z.count).map(tag => ({ tag, report: 'U-1A' as const, shape: 'cylinder' as const, chambers: one(), ID: d.D, L: d.L, t: d.t, supports: 'skirt', weight: w(tag), weightBasis: 'shell, heads and skirt as drawn', volume: true }));
    case 'tank': return e.p.vertical ? [{ tag: e.tag, report: 'U-1A', shape: 'cylinder', chambers: one('inner vessel'), ID: d.D, L: d.H, t: d.t, material: 'SA-240-304', ca: 0, mdmt: -320, supports: 'skirt', weight: w(e.tag), weightBasis: 'inner vessel and skirt as drawn; the vacuum jacket is not drawn', volume: true }] : [];
    case 'sphere': return [{ tag: e.tag, report: 'U-1', shape: 'sphere', chambers: one(), ID: d.Dft * 12, t: d.t, supports: 'columns at the equator', weight: w(e.tag), weightBasis: 'shell, columns, bracing, stair and platform as drawn', volume: true, ...(/^Three-carbon/.test(e.service) ? { mdmt: -50 } : {}) }];
    case 'psa': { const bed = makeVerticalVessel({ tag: 'bed', ID: d.D, t: d.t, TT: d.TT, skirtH: 60 }).weight.value;
      return Array.from({ length: d.beds }, (_, k) => ({ tag: `${e.tag}${SUFFIX[k]}`, report: 'U-1A' as const, shape: 'cylinder' as const, service: `${e.service}: adsorber ${k + 1}`, chambers: one(), ID: d.D, L: d.TT, t: d.t, supports: 'skirt', weight: bed, weightBasis: 'the adsorber alone, shell, heads and skirt; the unit\'s valve headers are piping', volume: true })); }
    case 'hx': case 'condenser': {
      const sulfur = e.kind === 'condenser', sS = sulfur ? z.sides['steam side'] : z.sides.shell, sT = sulfur ? z.sides.process : z.sides.tube;
      const shellC = sulfur ? ['boiler feed water', 'low-pressure steam'] : names(p => p.startsWith('shell')), tubeC = sulfur ? names(p => !/feed water|steam/.test(p)) : names(p => p.startsWith('tube'));
      return tags(d.shells).map(tag => ({ tag, report: 'U-1' as const, shape: 'cylinder' as const, chambers: [{ name: 'shell side', ...sS, contents: shellC }, { name: 'tube side', ...sT, contents: tubeC }], ID: d.ID, L: d.tubeLength, t: d.tShell, tubes: { n: d.tubes, d: d.tubeOD, L: d.tubeLength }, supports: 'two saddles',
        weight: w(tag) !== undefined ? w(tag)! + tubesLb(d.tubes, d.tubeOD, d.tubeLength) : undefined, weightBasis: 'shell, channel, covers and saddles as drawn, with the tubes added by count (SW-EQC-30); tubesheets and baffles not included' }));
    }
    case 'furnace': { const steam = z.sides.utility ?? proc, nT = fireTubeCount(d.D);
      return [{ tag: e.tag, report: 'U-1', shape: 'cylinder', chambers: [{ name: 'furnace chamber and boiler tubes', ...proc, contents: names(p => !/feed water|steam/.test(p)), ID: d.D, t: d.t }, { name: 'waste heat boiler shell', ...steam, contents: ['boiler feed water', 'high-pressure steam'], ID: d.D, t: d.boilerT }], ID: d.D, L: d.furnaceL + d.boilerL, t: d.t, tubes: { n: nT, d: 2, L: d.boilerL }, supports: 'two saddles',
        weight: w(e.tag) !== undefined ? w(e.tag)! + tubesLb(nT, 2, d.boilerL) : undefined, weightBasis: 'furnace, boiler shell, steam drum and saddles as drawn, with the boiler\'s tubes added by count (SW-EQC-37); refractory not included',
        parts: [{ tag: `${e.tag}-SD`, description: 'steam drum of the waste heat boiler', insideDiameter: model(0.6 * d.D), thickness: model(d.drumT), mawp: model(steam.designP), temperature: model(steam.designT) }] }]; }
    case 'cracker': { const b = body.get(e.tag), v = (k: string) => Number(b?.dims[k]?.value);
      return [['RX', 'reactor vessel and stripper', 'reactorD', 'reactorTT'], ['RG', 'regenerator', 'regenD', 'regenTT']].map(([s, name, kd, kl]) => ({ tag: `${e.tag}-${s}`, report: 'U-1' as const, shape: 'cylinder' as const, service: `${e.service}: ${name}`, chambers: one(), ID: v(kd), L: v(kl), t: 1, supports: 'skirt and structure', weightBasis: `not split between the two vessels; the catalogue's weight of the whole cracker as drawn, both vessels, riser, standpipes and steel, is ${Math.round(b?.weight.value ?? 0).toLocaleString('en-US')} lb; refractory not included`, volume: true })); }
    case 'aircooler': { const tubes = d.tubesPerBay, L = d.tubeLength, lb = tubesLb(tubes, 1, L) + 2 * 2 * (12 * 24 + 12 * d.bayWidth + 24 * d.bayWidth) * 1 * STEEL;
      return tags(d.bays).map(tag => ({ tag, report: 'U-1A' as const, shape: 'tube bundle' as const, chambers: one('headers and tubes'), tubes: { n: tubes, d: 1, L }, supports: 'structure', weight: lb, weightBasis: 'pressure parts only: the tubes and two header boxes weighed as 1 in plate (SW-REG-3); fins, fans and structure not included' })); }
    case 'ejector': {   // SW-PRC-18, SW-EQC-68: one condenser a stage; the shell under the stage's vacuum and at its own design temperature, the tubes on cooling water
      const fluidOf = (port: string) => { const q = z.nozzles.find(v => v.port === port); return q ? [FLUIDS[q.fluid]?.name ?? q.fluid] : []; };
      return Array.from({ length: d.stages }, (_, i) => { const k = i + 1, tag = `${e.tag}-C${k}`, ID = d[`c${k}ID`], t = d[`c${k}Shell`], n = d[`c${k}Tubes`], L = d.tubeLength;
        return { tag, report: 'U-1' as const, shape: 'cylinder' as const, service: `${e.service}: condenser ${k}`, chambers: [{ name: 'shell side', ...proc, designT: d[`c${k}DesignT`], contents: [...new Set([...fluidOf('inlet'), ...fluidOf(k < d.stages ? `condensate ${k}` : 'outlet'), 'steam condensing'])] }, { name: 'tube side', ...z.sides.water, contents: ['cooling water supply', 'cooling water return'] }], ID, L, t, tubes: { n, d: 0.75, L }, supports: 'two saddles',
          weight: makeShellTubeExchanger({ tag, ID, t, TT: L, centreline: ID }).weight.value + tubesLb(n, 0.75, L), weightBasis: 'shell, channel, covers and saddles as the catalogue draws them (SW-DET-11), with the tubes added by count (SW-EQC-30); its connections and boot not included' }; }); }
    case 'boiler': { const sd = d.steamID, md = 0.65 * sd, Ts = model(d.drumDesignT);
      return [{ tag: e.tag, report: 'P-3', shape: 'boiler', chambers: [{ name: 'steam and water side', ...proc, contents: ['boiler feed water', 'high-pressure steam'] }], supports: 'structure', weight: w(e.tag), weightBasis: 'the boiler as drawn: drums, tubes, casing, burners and stack',
        parts: [{ tag: `${e.tag}-SD`, description: 'steam drum', report: recalled('P-4'), insideDiameter: model(sd), thickness: model(d.drumT), temperature: Ts }, { tag: `${e.tag}-MD`, description: 'mud drum', report: recalled('P-4'), insideDiameter: model(md), thickness: model(drumWall(md)), temperature: Ts },
          { tag: `${e.tag}-EC`, description: 'economizer', report: recalled('P-4') }, { tag: `${e.tag}-BEP`, description: 'boiler external piping to the first stop valves', report: recalled('P-4A') }] }]; }
    case 'fluegascooler': { const steam = z.sides['steam side'] ?? proc, dd = 0.6 * d.ID;
      return [{ tag: e.tag, report: 'P-3', shape: 'boiler', chambers: [{ name: 'steam and water side (shell and steam drum)', ...steam, contents: ['boiler feed water', 'high-pressure steam'], ID: d.ID, t: d.tShell }, { name: 'gas side (tubes and channels)', ...proc, contents: names(p => !/feed water|steam/.test(p)) }], ID: d.ID, L: d.tubeLength, t: d.tShell, tubes: { n: d.tubes, d: d.tubeOD, L: d.tubeLength }, supports: 'two saddles', weight: w(e.tag), weightBasis: 'shell, tubes, channels, steam drum and saddles as drawn; refractory not included',
        parts: [{ tag: `${e.tag}-SD`, description: 'steam drum', report: recalled('P-4'), insideDiameter: model(dd), thickness: model(d.drumT) }, { tag: `${e.tag}-BEP`, description: 'boiler external piping to the first stop valves', report: recalled('P-4A') }] }]; }
    default: return [];
  }
}

let eqCache: EquipmentRecord[] | undefined;
export function equipmentRecords(): EquipmentRecord[] {
  if (eqCache) return eqCache;
  const M = processModel(), Z = sizing(), body = bodies(), out: EquipmentRecord[] = [];
  for (const sh of M.sheets) for (const e of sh.equip.values()) {
    const z = Z.get(sh.no)!.equip.get(e.tag)!, fluids = [...new Set(e.ports.map(p => p.s.fluid))], section1 = e.kind === 'boiler' || e.kind === 'fluegascooler';
    const lethal = fluids.includes('AG'), sour = fluids.some(f => ['AM', 'CA', 'SW', 'AG'].includes(f)), hotH2 = HOT_HYDROGEN.has(sh.no) && fluids.some(f => f === 'RX' || f === 'HY') && z.designT > 500;
    for (const p of plans(sh, e, z, body)) {
      const thick = Math.max(p.t ?? 0, ...p.chambers.map(c => c.t ?? 0)) > 1.25, hydrogen = fluids.some(f => f === 'HY' || f === 'RX') && Math.max(...p.chambers.map(c => c.designP)) > 600, full = thick || hydrogen || lethal;
      const material = p.material ?? (hotH2 ? 'SA-387-11' : 'SA-516-70'), stainless = material === 'SA-240-304';
      out.push({
        demonstration: true, notice: NOTICE, tag: p.tag, item: e.tag, unit: sh.no, service: p.service ?? e.service, kind: e.kind, shape: p.shape,
        code: recalled(section1 ? SECTION_I : SECTION_VIII), report: recalled(p.report), registration: invented(designCrn(p.tag)), fabricator: invented(FABRICATORS[hash(`fab:${e.tag}`) % FABRICATORS.length]), serial: invented(`DF-${String(10000 + (hash(`sn:${p.tag}`) % 90000))}`), yearBuilt: invented(2025),
        chambers: p.chambers.map(c => ({ name: c.name, mawp: model(c.designP), temperature: model(c.designT), fullVacuum: model(c.vacuum), testPressure: recalled(Math.ceil((section1 ? 1.5 : 1.3) * c.designP)), contents: c.contents, ...(c.ID ? { insideDiameter: model(c.ID) } : {}), ...(c.t ? { thickness: model(c.t) } : {}) })),
        mdmt: recalled(p.mdmt ?? -20), corrosionAllowance: model(p.ca ?? 0.125),
        shell: { material: recalled(material), ...(p.ID ? { insideDiameter: model(p.ID) } : {}), ...(p.L ? { length: model(p.L) } : {}), ...(p.t ? { thickness: model(p.t) } : {}), ...(p.shape === 'cylinder' ? { heads: model('2:1 ellipsoidal, of the shell\'s thickness') } : {}) },
        ...(p.tubes ? { tubes: { material: recalled('SA-179'), count: model(p.tubes.n), outsideDiameter: model(p.tubes.d), length: model(p.tubes.L), surfaceFt2: model(Math.round((p.tubes.n * Math.PI * p.tubes.d * p.tubes.L) / 144)) } } : {}),
        ...(p.parts ? { parts: p.parts } : {}),
        radiography: recalled(full ? 'full' : 'spot'), jointEfficiency: recalled(full ? 1 : 0.85), heatTreatment: recalled(!stainless && (thick || sour) ? 'post-weld heat treated' : 'none'), lethalService: recalled(lethal),
        nozzles: z.nozzles.map((q, i) => ({ mark: `N${i + 1}`, service: q.port, size: model(q.NPS), pipeClass: model(q.cls), fluid: FLUIDS[q.fluid]?.name ?? q.fluid })),
        supports: model(p.supports), relief: p.chambers.map(c => ({ tag: invented(`PSV-${p.tag.replace(/^[A-Z]-/, '')}${p.chambers.length > 1 ? (/tube|gas side|furnace/.test(c.name) ? 'T' : 'S') : ''}`), setPressure: model(c.designP) })),
        ...(p.weight !== undefined ? { emptyWeightLb: model(Math.round(p.weight)) } : {}), ...(p.weightBasis ? { weightBasis: p.weightBasis } : {}),
        ...(p.volume && p.ID ? { volumeFt3: model(Math.round((p.shape === 'sphere' ? (Math.PI * p.ID ** 3) / 6 : (Math.PI / 4) * p.ID * p.ID * (p.L ?? 0) + (Math.PI * p.ID ** 3) / 12) / 1728)) } : {}),
        signatures: 'demonstration record: not certified, not signed',
      });
    }
  }
  eqCache = out; return out;
}
/** SW-REG-3: what a record's shell is stressed to at its working pressure, and what SW-PRC-14 allows, psi; by chamber where they differ */
export function stressCheck(r: EquipmentRecord): { chamber: string; stress: number; allowed: number }[] {
  const out: { chamber: string; stress: number; allowed: number }[] = [];
  for (const c of r.chambers) {
    const ID = c.insideDiameter?.value ?? r.shell.insideDiameter?.value, t = c.thickness?.value ?? r.shell.thickness?.value; if (!ID || !t) continue;
    out.push({ chamber: c.name, stress: (c.mawp.value * ID) / 2 / (t - r.corrosionAllowance.value) / (r.shape === 'sphere' ? 2 : 1), allowed: allowable(c.temperature.value) });
  }
  for (const p of r.parts ?? []) if (p.insideDiameter && p.thickness) out.push({ chamber: p.description, stress: ((p.mawp ?? r.chambers[0].mawp).value * p.insideDiameter.value) / 2 / (p.thickness.value - r.corrosionAllowance.value), allowed: allowable((p.temperature ?? r.chambers[0].temperature).value) });
  return out;
}

// ───────────────────────── lines (SW-REG-4, SW-REG-5, SW-REG-8) ─────────────────────────
export type Category = 'D' | 'Normal' | 'M';
const BENIGN = new Set(['CWS', 'CWR', 'RW', 'PW', 'FW', 'DM', 'IA', 'PA', 'AIR', 'NI', 'LS', 'MS', 'HS', 'CO']);
/** SW-REG-4: the fluid service of a line, SmartWeld standing in for the owner */
export function fluidService(fluid: string, designP: number, designT: number): Category {
  if (fluid === 'AG') return 'M';
  if (BENIGN.has(fluid) && designP <= 150 && designT >= -20 && designT <= 366) return 'D';
  return 'Normal';
}
const EXAMINATION: Record<Category, string> = { D: 'visual', Normal: 'visual, and 5 % random radiography of girth butt welds', M: 'visual, 20 % random radiography of girth butt welds, and a sensitive leak test' };
const GROUP: Record<string, string> = { P: 'H', RV: 'H', CWS: 'W', CWR: 'W', W: 'W', LS: 'S', SC: 'C', IA: 'G', PA: 'G', N: 'G', FL: 'F' };
const fmt = (n: number) => (n === 0.75 ? '3/4' : n === 0.5 ? '1/2' : String(n));   // as SW-LL-1 writes a size: a number's parts are split at its hyphens, so a size carries none
/** SW-REF-3: a line's number: size, class, the generator's service letter, and unit × 1000 + a running number */
/** SW-RPI-3: the service a line is numbered and built as: a line of the flowsheet as a process line whatever it carries; a utility header or a connection that taps one by its fluid's letter, but water and plant gases above class P300, steam and condensate over 12 in, and a water connection (`connection`: to or from the item it serves, not a header) over 12 in, as process lines (the valves the generator gives them are not offered there, SW-VLV-11) */
export const serviceOf = (fluid: string, cls: string, utility: boolean, NPS = 0, connection = false): string => { if (!utility) return 'P'; const sv = FLUIDS[fluid].svc, g = GROUP[sv]; return ((g === 'W' || g === 'G') && Number(cls.slice(1)) > 300) || ((g === 'S' || g === 'C') && NPS > 12) || (g === 'W' && connection && NPS > 12) ? 'P' : sv; };
/** SW-REF-3: the running numbers 401 to 600 of a unit are its utility headers and the connections that tap them (the connections from 501) */
export const utilitySeq = (seq: number) => seq > 400 && seq <= 600, connectionSeq = (seq: number) => seq > 500 && seq <= 600;
/** SW-RPI-3: a line of the flowsheet the generator must route free, not along the rack: a cracker's flue gas and its reactor's vapour, the cooled flue gas to its scrubber, the regenerator's air from its blower, and a line into an item the flowsheet states is met direct. By its place in its unit's flowsheet, from 1 */
export function routedFree(unit: number, seq: number): boolean {
  const sh = processModel().sheets.find(x => x.no === unit), l = sh?.lines[seq - 1]; if (!sh || !l || l.from.k !== 'eq') return false;   // an area with no flowsheet (the main pipeway's) has none
  const fe = sh.equip.get(l.from.tag)!, te = l.to.k === 'eq' ? sh.equip.get(l.to.tag) : undefined;
  return (fe.kind === 'cracker' && ['flue gas', 'reactor vapour'].includes(l.from.port)) || (fe.kind === 'fluegascooler' && l.from.port === 'outlet' && te?.kind === 'scrubber')
    || (fe.kind === 'blower' && te?.kind === 'cracker') || (!!te && te.p.direct !== undefined && l.to.k === 'eq' && l.to.port === 'inlet');
}
/** `free`: the line is routed free (SW-RPI-3); a flowsheet line's own number says so by itself, a branch made in piping (a spare's, a further body's) is told by the line it joins */
export const lineNumber = (unit: number, seq: number, NPS: number, cls: string, fluid: string, free = routedFree(unit, seq)) => `${fmt(NPS)}"-${cls}-${free ? 'V' : serviceOf(fluid, cls, utilitySeq(seq), NPS, connectionSeq(seq))}-${unit * 1000 + seq}`;
export type MaterialCode = 'CS' | 'C1' | 'C5' | 'SS';
export const MATERIALS: Record<MaterialCode, { name: string; pipe: string; fittings: string; flanges: string }> = {
  CS: { name: 'carbon steel', pipe: 'A106-B', fittings: 'A234-WPB', flanges: 'A105' }, C1: { name: '1-1/4 Cr alloy steel', pipe: 'A335-P11', fittings: 'A234-WP11', flanges: 'A182-F11' },
  C5: { name: '5 Cr alloy steel', pipe: 'A335-P5', fittings: 'A234-WP5', flanges: 'A182-F5' }, SS: { name: 'stainless steel', pipe: 'A312-TP316L', fittings: 'A403-WP316L', flanges: 'A182-F316L' },
};
/** SW-REG-5: the material label of a line */
export function pipeMaterial(unit: number, fluid: string, designT: number, overhead: boolean): MaterialCode {
  if (overhead) return 'SS';
  if (HOT_HYDROGEN.has(unit) && (fluid === 'RX' || fluid === 'HY') && designT > 500) return 'C1';
  if ([11, 12, 17].includes(unit) && FLUIDS[fluid].hazard === 'flammable' && designT > 600) return 'C5';
  return 'CS';
}
const PRESSURE_RANK: Record<string, number> = { P150: 1, P300: 2, P600: 3, P1200: 4 };
/** SW-REG-8: severity of a line class: the larger of its pressure rank and its medium's rank */
export function severity(cls: string, fluid: string, phase: string, cat: Category): { level: number; pressure: number; medium: number } {
  const pressure = PRESSURE_RANK[cls] ?? 5, flammable = FLUIDS[fluid].hazard === 'flammable';
  const medium = cat === 'M' ? 5 : cat === 'D' ? 1 : flammable ? (phase !== 'liquid' || ['LP', 'HY', 'RX', 'FL'].includes(fluid) ? 4 : 3) : 2;
  return { level: Math.max(pressure, medium), pressure, medium };
}
export const BOLTING = 'A193-B7 studs, A194-2H nuts';
/** SW-REG-4, SW-REG-6, SW-REG-8: what follows from a line's fluid, phase, pipe class, design conditions and material: its fluid service, severity, line class, examination, leak test and piping system number */
export function classify(unit: number, fluid: string, phase: string, pipeClass: string, designP: number, designT: number, mat: MaterialCode, utility: boolean, NPS = 0) {
  const cat = fluidService(fluid, designP, designT), sv = severity(pipeClass, fluid, phase, cat), lineClass = `${GROUP[serviceOf(fluid, pipeClass, utility, NPS)] ?? 'H'}${pipeClass.slice(1)}-${mat}-${cat === 'Normal' ? 'N' : cat}${sv.medium}`;
  return { fluidService: cat, severity: sv, lineClass, examination: EXAMINATION[cat], leakTest: cat === 'D' ? `hydrostatic at ${Math.ceil(1.5 * designP)} psi, or an initial service test` : `hydrostatic at ${Math.ceil(1.5 * designP)} psi`, registration: designCrn(`piping:${unit}:${lineClass}`) };
}
export interface LineRecord {
  demonstration: true; number: string; unit: number; kind: 'process' | 'utility connection'; from: string; to: string; fluid: string; fluidName: string; hazard: string; phase: string;
  lbh: number; operating: { T: number; P: number }; design: Field<{ T: number; P: number; fullVacuum: boolean }>; size: Field<number>; pipeClass: Field<string>;
  /** SW-REG-8 */ lineClass: Field<string>; severity: Field<{ level: number; pressure: number; medium: number }>;
  code: Field<string>; fluidService: Field<Category>; examination: Field<string>; leakTest: Field<string>; threadedJoints: Field<boolean>;
  materials: Field<{ code: MaterialCode; pipe: string; fittings: string; flanges: string; bolting: string }>; pipingSystemRegistration: Field<string>;
  boilerExternalPiping?: Field<string>; elevatedTemperature?: Field<string>;
}
const endText = (e: End, numbers: string[]): string => (e.k === 'eq' ? `${e.tag} ${e.port}` : e.k === 'bl' ? `battery limit (${e.name})` : `line ${numbers[e.line]}`);
let lnCache: LineRecord[] | undefined;
export function lineRecords(): LineRecord[] {
  if (lnCache) return lnCache;
  const M = processModel(), Z = sizing(), out: LineRecord[] = [];
  const rec = (sh: UnitSheet, seq: number, kind: LineRecord['kind'], from: string, to: string, fluid: string, phase: string, lbh: number, T: number, P: number, z: { NPS: number; cls: string; designP: number; designT: number; vacuum?: boolean }, overhead: boolean, boilerTag?: string): LineRecord => {
    const unit = sh.no, mat = pipeMaterial(unit, fluid, z.designT, overhead), m = MATERIALS[mat], c = classify(unit, fluid, phase, z.cls, z.designP, z.designT, mat, utilitySeq(seq), z.NPS), cat = c.fluidService, sv = c.severity, cls = c.lineClass;
    return {
      demonstration: true, number: lineNumber(unit, seq, z.NPS, z.cls, fluid), unit, kind, from, to, fluid, fluidName: FLUIDS[fluid].name, hazard: FLUIDS[fluid].hazard, phase, lbh: Math.round(lbh), operating: { T: Math.round(T), P: Math.round(P) },
      design: model({ T: z.designT, P: z.designP, fullVacuum: !!z.vacuum }), size: model(z.NPS), pipeClass: model(z.cls), lineClass: model(cls), severity: model(sv), code: recalled('ASME B31.3 Process Piping'),
      fluidService: recalled(cat), examination: recalled(c.examination), leakTest: recalled(c.leakTest), threadedJoints: recalled(cat !== 'M'),
      materials: recalled({ code: mat, pipe: m.pipe, fittings: m.fittings, flanges: m.flanges, bolting: BOLTING }), pipingSystemRegistration: invented(c.registration),
      ...(boilerTag ? { boilerExternalPiping: recalled(`from ${boilerTag} to its first stop valve: ASME Section I / B31.1, report P-4A; B31.3 beyond`) } : {}),
      ...(z.designT >= 800 ? { elevatedTemperature: recalled('elevated-temperature provisions may apply: for the owner to decide') } : {}),
    };
  };
  for (const sh of M.sheets) {
    const z = Z.get(sh.no)!, steamGen = (tag: string) => ['boiler', 'fluegascooler'].includes(sh.equip.get(tag)?.kind ?? ''), numbers = sh.lines.map((l, i) => lineNumber(sh.no, i + 1, z.lines[i].NPS, z.lines[i].cls, l.s.fluid));
    sh.lines.forEach((l, i) => {
      const overhead = sh.no === 18 && [l.from, l.to].some(e => e.k === 'eq' && ['C-1801', 'C-1802', 'A-1801', 'D-1802', 'D-1803', 'D-1805'].includes(e.tag) && /overhead|inlet|acid gas|gas|reflux/.test(e.port)) && (l.s.fluid === 'AG' || l.s.fluid === 'SW');
      const bep = [l.from, l.to].find(e => e.k === 'eq' && steamGen(e.tag) && /steam|feed water|blowdown/.test(e.port));
      out.push(rec(sh, i + 1, 'process', endText(l.from, numbers), endText(l.to, numbers), l.s.fluid, l.s.ph === 'L' ? 'liquid' : l.s.ph === 'V' ? 'vapour' : 'two-phase', l.s.w, l.s.T, l.s.P, z.lines[i], overhead, bep && bep.k === 'eq' ? bep.tag : undefined));
    });
    z.utils.forEach((u, i) => {
      const header = `${FLUIDS[u.fluid].name} header`, item = `${u.tag} ${u.port}`, phase = ['HS', 'MS', 'LS', 'FG', 'IA', 'PA', 'NI'].includes(u.fluid) ? 'vapour' : 'liquid', bep = steamGen(u.tag) && /steam|feed water|blowdown/.test(u.port) ? u.tag : undefined;
      if (!stationed(u)) { out.push(rec(sh, 500 + i + 1, 'utility connection', u.dir === 'to' ? header : item, u.dir === 'to' ? item : header, u.fluid, phase, u.w, u.T, u.P, u, false, bep)); return; }
      // SW-PRC-19, SW-RPI-9: a connection with a control valve station is two lines, as it is piped: the part on the header's side of the header's class and conditions, the part on the item's side of the item's own
      const c = connection(u), hd = headerDesign(u.fluid), own = { NPS: c.NPS, cls: u.cls, designP: u.designP, designT: u.designT }, hdr = { NPS: c.NPS, cls: hd.cls, designP: hd.designP, designT: hd.designT }, station = `control station of ${item}`;
      const after = 551 + z.utils.slice(0, i).filter(stationed).length;
      if (u.dir === 'to') out.push(rec(sh, 500 + i + 1, 'utility connection', header, station, u.fluid, phase, u.w, u.T, u.P, hdr, false), rec(sh, after, 'utility connection', station, item, u.fluid, phase, u.w, u.T, u.P, own, false, bep));
      else out.push(rec(sh, 500 + i + 1, 'utility connection', item, station, u.fluid, phase, u.w, u.T, u.P, own, false, bep), rec(sh, after, 'utility connection', station, header, u.fluid, phase, u.w, u.T, u.P, hdr, false));
    });
  }
  lnCache = out; return out;
}
export interface LineClass { lineClass: string; group: string; pipeClass: string; material: MaterialCode; materialName: string; fluidService: Category; severity: number; pressureRank: number; mediumRank: number; lines: number; units: number[]; fluids: string[]; sizes: [number, number]; maxDesignP: number; maxDesignT: number }
/** SW-REG-8: the line classes in use, each with its severity */
export function lineClasses(): LineClass[] {
  const m = new Map<string, LineClass>();
  for (const l of lineRecords()) {
    const k = l.lineClass.value, sv = l.severity.value; let c = m.get(k);
    if (!c) { c = { lineClass: k, group: k[0], pipeClass: l.pipeClass.value, material: l.materials.value.code, materialName: MATERIALS[l.materials.value.code].name, fluidService: l.fluidService.value, severity: 0, pressureRank: sv.pressure, mediumRank: 0, lines: 0, units: [], fluids: [], sizes: [l.size.value, l.size.value], maxDesignP: 0, maxDesignT: 0 }; m.set(k, c); }
    c.lines++; c.severity = Math.max(c.severity, sv.level); c.mediumRank = Math.max(c.mediumRank, sv.medium); if (!c.units.includes(l.unit)) c.units.push(l.unit); if (!c.fluids.includes(l.fluidName)) c.fluids.push(l.fluidName);
    c.sizes = [Math.min(c.sizes[0], l.size.value), Math.max(c.sizes[1], l.size.value)]; c.maxDesignP = Math.max(c.maxDesignP, l.design.value.P); c.maxDesignT = Math.max(c.maxDesignT, l.design.value.T);
  }
  return [...m.values()].sort((a, b) => b.severity - a.severity || a.lineClass.localeCompare(b.lineClass));
}

// ───────────────────────── fired heater coils, packaged components, the index (SW-REG-1, SW-REG-6) ─────────────────────────
export interface CoilRecord { demonstration: true; tag: string; heater: string; unit: number; service: string; coil: string; code: Field<string>; registration: Field<string>; design: Field<{ P: number; T: number }>; material: Field<string>; fluidService: Field<Category> }
export function coilRecords(): CoilRecord[] {
  const M = processModel(), Z = sizing(), out: CoilRecord[] = [];
  for (const sh of M.sheets) for (const e of sh.equip.values()) if (e.kind === 'heater') {
    const z = Z.get(sh.no)!.equip.get(e.tag)!;
    for (const [side, q] of Object.entries(z.sides)) if (side !== 'fuel') {
      const steam = side === 'steam coil', tag = `${e.tag}-${steam ? 'SC' : 'PC'}`;
      out.push({ demonstration: true, tag, heater: e.tag, unit: sh.no, service: e.service, coil: steam ? 'steam coil' : 'process coil', code: recalled('ASME B31.3 Process Piping (fired heater pressure coil)'), registration: invented(designCrn(tag)), design: model({ P: q.designP, T: q.designT }),
        material: recalled(steam ? 'A106-B' : [11, 12].includes(sh.no) ? 'A335-P5' : HOT_HYDROGEN.has(sh.no) ? 'A335-P11' : 'A106-B'), fluidService: recalled('Normal') });
    }
  }
  return out;
}
export interface ComponentRecord { demonstration: true; tag: string; unit: number; service: string; category: FittingCategory; maker: Field<string>; registration: Field<string>; pipeClass: Field<string> }
/** SW-REG-1: packaged items counted with the fittings, in category H */
export function componentRecords(): ComponentRecord[] {
  const M = processModel(), Z = sizing(), out: ComponentRecord[] = [];
  for (const sh of M.sheets) for (const e of sh.equip.values()) {
    const z = Z.get(sh.no)!.equip.get(e.tag)!; if (!(e.kind === 'ejector' || (e.kind === 'package' && /let-down|vaporiser/i.test(e.service)))) continue;
    for (const tag of e.kind === 'ejector' ? Array.from({ length: z.d.stages }, (_, k) => `${e.tag}-J${k + 1}`) : [e.tag]) { const maker = makerOf(tag); out.push({ demonstration: true, tag, unit: sh.no, service: e.service, category: 'H', maker: invented(maker), registration: invented(fittingCrn('H', z.cls, maker)), pipeClass: model(z.cls) }); }
  }
  return out;
}
/** SW-REG-6: the registration index: vessel designs, piping systems, heater coils, components, and fitting categories by class and maker */
export function registrationIndex() {
  const eq = equipmentRecords(), ln = lineRecords(), systems = new Map<string, { registration: string; unit: number; lineClass: string; lines: number }>();
  for (const l of ln) { const k = l.pipingSystemRegistration.value, s = systems.get(k); if (s) s.lines++; else systems.set(k, { registration: k, unit: l.unit, lineClass: l.lineClass.value, lines: 1 }); }
  const classes = [...new Set(ln.map(l => l.pipeClass.value))].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  return {
    demonstration: true as const, notice: NOTICE, jurisdiction: recalled('New Brunswick: the digit after the decimal point is 7'),
    vessels: eq.map(r => ({ tag: r.tag, unit: r.unit, registration: r.registration.value, report: r.report.value })), pipingSystems: [...systems.values()],
    heaterCoils: coilRecords().map(c => ({ tag: c.tag, unit: c.unit, registration: c.registration.value })), components: componentRecords().map(c => ({ tag: c.tag, unit: c.unit, registration: c.registration.value, maker: c.maker.value })),
    fittings: (Object.keys(FITTING_CATEGORIES) as FittingCategory[]).flatMap(c => classes.flatMap(cls => MAKERS.map(m => ({ category: c, kind: FITTING_CATEGORIES[c], pipeClass: cls, maker: m, registration: fittingCrn(c, cls, m) })))),
  };
}
