# Plant 3 clash audit

Five independent clash detectors, and a sixth check of nozzles against their own items, that check the whole of plant 3 (the nine routed units, the main
pipeway and the cooling water mains, with every unit's steel, equipment, concrete and pipe
frames) for pieces that intersect. Each was written by a different method, calibrated on known
clashes and on clashes it planted itself, then reviewed for blind spots by a second author, who
fixed what they found (PROVENANCE P-95). None trusts the generator's own checks, which compare
only pieces of two different lines of one model.

| Detector | Method |
|---|---|
| `analytic.ts` | exact shapes from catalogue dimensions; true penetration depth by support functions; spatial hash broad phase |
| `mesh.ts` | the catalogue's own triangle meshes; exact triangle–triangle tests and ray-parity containment |
| `voxel.ts` | every solid rasterised at 0.5 in into a sparse cell table with signed distances |
| `routes.ts` | per line: continuity, self-crossing, U-turns, needless hops, supports' seats, plus pairwise overlaps |
| `interfaces.ts` | where two models meet (battery-limit spools, the pipeway's and the mains' limit spools), then the corridor between the units |
| `necks.ts` | each nozzle against its own item, the one contact the others excuse: rays through each neck's wall to the item's drawn body; a neck short of its body, into it, to nothing, or on a weld seam (added 2026-11-27, SW-NOZ-1 and SW-DET-6 as amended) |

The analytic detector holds a non-convex component (a curved rail, a lattice, an I-section) by
its convex hull, which fills its hollows; a finding of that detector alone is measured again
exactly, by the mesh or voxel detector or on the parts' own meshes, before anything is done
about it (23 of its first findings, at handrails and a lattice, were hulls and nothing more).

Contacts that are meant to touch (pieces joined end to end, a stud set through its flanges, a
branch's fitting on its run, a support on its line and on the member it bears on, a nozzle on
its own equipment) are excused only by a named relationship, never by a depth threshold;
overlaps under 0.02 in are taken as numerical noise.

What those relationships hide is checked on its own: a nozzle on its own item by `necks.ts`
(a neck can stand short of its body in the air, or run into it, and no detector excusing the
pair sees it: necks 15 to 66 in off a column's narrower shells and the heaters' gas
connections under their floors were found so); and a stud set through its own flanges by
measuring the nuts' room against the drawn hubs (SW-FLG-6 as amended: the nuts stood up to
0.12 in in the hubs of five class 1200 sizes).

Run each from `smartweld/` on a folder of model files (`unit-11.json` … `unit-19.json`,
`pipeway.json`, `cooling-water.json` and their reports):

```
MODELS=public/refinery/piping LABEL=now npx vite-node tools/refinery-audit/analytic.ts
```

Findings go to `$AUDIT_OUT/<detector>/findings-<LABEL>.json` (`AUDIT_OUT` defaults to
`audit-out/`, which is not committed), each `{a, b, depthIn, at, note}` with `a` and `b` naming
model, line, tag and kind, and `at` in the pipeway's frame. `PLANT=1` adds planted clashes in
memory, for proving a detector still sees them. Each run takes 4 to 20 minutes and up to 2 GB.
