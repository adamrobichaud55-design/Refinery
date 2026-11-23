import { ENTRIES } from '../src/scene/catalogueList';
import { buildGeometry } from '../src/geometry/partGeometry';
import { isClosed, signedVolume } from '../src/geometry/mesh';
for (const e of ENTRIES.filter(e => e.group === process.argv[2])) { const t = Date.now(), p = e.build(), g = buildGeometry(p); const bad = g.solids.filter(s => !isClosed(s.mesh) || signedVolume(s.mesh) <= 0).map(s => `${s.name}(${isClosed(s.mesh) ? '' : 'open '}${signedVolume(s.mesh).toFixed(1)})`); const tris = g.solids.reduce((a, s) => a + s.mesh.indices.length / 3, 0); console.log(p.designation, '|', g.solids.length, 'solids', tris, 'tris', p.weight.value.toFixed(0), 'lb', Date.now() - t, 'ms', bad.length ? 'BAD: ' + bad.join('; ') : 'ok'); }
