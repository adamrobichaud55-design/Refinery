/** Triangle meshes as plain arrays. Extrusion of profiles along +Z. */
import { earClip, ensureCCW, signedArea, type Polygon } from './polygon';

export interface MeshData {
  positions: number[]; // xyz triples
  indices: number[];   // triangle index triples, CCW outward
}

/** A profile is an outer polygon and optionally an inner polygon with the same vertex count (a ring). */
export interface Profile { outer: Polygon; inner?: Polygon }

export function profileArea(p: Profile): number {
  return Math.abs(signedArea(p.outer)) - (p.inner ? Math.abs(signedArea(p.inner)) : 0);
}

/** Extrude a profile in the xy plane from z=z0 to z=z0+length. Outward-facing CCW triangles. */
export function extrude(profile: Profile, length: number, z0 = 0): MeshData {
  const outer = ensureCCW(profile.outer);
  const inner = profile.inner ? ensureCCW(profile.inner) : undefined;
  if (inner && inner.length !== outer.length) throw new Error('ring profile needs equal vertex counts');
  const positions: number[] = [];
  const indices: number[] = [];
  const z1 = z0 + length;
  const push = (x: number, y: number, z: number) => { positions.push(x, y, z); return positions.length / 3 - 1; };
  const n = outer.length;
  const ob = outer.map(p => push(p.x, p.y, z0));
  const ot = outer.map(p => push(p.x, p.y, z1));
  // outer side walls: for CCW outer, outward normal needs (b0, b1, t1), (b0, t1, t0)
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    indices.push(ob[i], ob[j], ot[j], ob[i], ot[j], ot[i]);
  }
  if (inner) {
    const ib = inner.map(p => push(p.x, p.y, z0));
    const it = inner.map(p => push(p.x, p.y, z1));
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      indices.push(ib[j], ib[i], it[i], ib[j], it[i], it[j]); // reversed: faces inward to the hole
    }
    // caps as strips between rings
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      // bottom cap faces -z: clockwise when seen from +z
      indices.push(ob[i], ib[i], ib[j], ob[i], ib[j], ob[j]);
      // top cap faces +z
      indices.push(ot[i], it[j], it[i], ot[i], ot[j], it[j]);
    }
  } else {
    const tris = earClip(outer);
    for (let k = 0; k < tris.length; k += 3) {
      indices.push(ob[tris[k]], ob[tris[k + 2]], ob[tris[k + 1]]); // bottom, reversed
      indices.push(ot[tris[k]], ot[tris[k + 1]], ot[tris[k + 2]]); // top
    }
  }
  return { positions, indices };
}

/** Signed volume by the divergence theorem (positive for outward-facing triangles). */
export function signedVolume(m: MeshData): number {
  let v = 0;
  const p = m.positions;
  for (let k = 0; k < m.indices.length; k += 3) {
    const a = m.indices[k] * 3, b = m.indices[k + 1] * 3, c = m.indices[k + 2] * 3;
    v += (p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1])
        - p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c])
        + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c])) / 6;
  }
  return v;
}

/** True if every directed edge has exactly one opposite directed edge (closed, consistently oriented). */
export function isClosed(m: MeshData): boolean {
  const edges = new Map<string, number>();
  for (let k = 0; k < m.indices.length; k += 3) {
    const t = [m.indices[k], m.indices[k + 1], m.indices[k + 2]];
    for (let e = 0; e < 3; e++) { const key = `${t[e]}>${t[(e + 1) % 3]}`; edges.set(key, (edges.get(key) ?? 0) + 1); }
  }
  for (const [key, count] of edges) {
    if (count !== 1) return false;
    const [a, b] = key.split('>');
    if (edges.get(`${b}>${a}`) !== 1) return false;
  }
  return true;
}

/** 4x4 column-major transform applied to a mesh (returns a new mesh). */
export type Mat4 = number[];
export function transformMesh(m: MeshData, t: Mat4): MeshData {
  const positions: number[] = [];
  for (let i = 0; i < m.positions.length; i += 3) {
    const x = m.positions[i], y = m.positions[i + 1], z = m.positions[i + 2];
    positions.push(
      t[0] * x + t[4] * y + t[8] * z + t[12],
      t[1] * x + t[5] * y + t[9] * z + t[13],
      t[2] * x + t[6] * y + t[10] * z + t[14],
    );
  }
  return { positions, indices: m.indices.slice() };
}
export const translation = (x: number, y: number, z: number): Mat4 => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
export function mergeMeshes(list: MeshData[]): MeshData {
  const positions: number[] = [], indices: number[] = [];
  for (const m of list) { const off = positions.length / 3; positions.push(...m.positions); for (const i of m.indices) indices.push(i + off); }
  return { positions, indices };
}
