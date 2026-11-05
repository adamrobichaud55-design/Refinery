# SmartWeld 3D Catalogue — Design Basis

Status: Stage 1 (structural sections and connection hardware) — rules written before code.
Later stages append their own sections here before any code uses them.

This document is the only place a dimensioning rule may come from. Code may use a rule
only if it is written here first, with its reason. Each rule has an identifier
(`SW-xxx-n`) that the code carries on every dimension it produces, so the ground-truth
export and the audit record can trace every number back to this file.

## 0. Allowed sources for every number

Every dimension in the catalogue carries one of four bases:

| Basis tag     | Meaning                                                                       |
|---------------|-------------------------------------------------------------------------------|
| `drawing`     | Stated on the user's drawing (for the catalogue, carried by the designation). |
| `constant`    | A physical constant (listed in section 1).                                    |
| `rule:SW-…`   | Proportioned by a SmartWeld rule in this document, with its reason.           |
| `regulation`  | US federal regulation, cited by section and checked against the eCFR text.    |

Nothing else is allowed. No published dimension table, no standard, no catalogue, and
no number recalled from memory of one. Where a SmartWeld rule gives a result that may
coincide with common practice, the rule was written from the stated reasoning and was
not checked against any table (see PROVENANCE.md for the log).

Any dimension not fixed by the drawing is reported as "proportioned by SmartWeld rule
SW-…" in the viewer and in every export.

### 0.1 Licences: no copyleft of any kind (`SW-LIC-*`)

The user's instruction of 2026-11-02: nothing that involves the GPL or any other copyleft licence,
and no copyright infringement anywhere in the process (PROVENANCE P-57, P-58).

- `SW-LIC-1` Code and dependencies: SmartWeld's own code is the only code in the deliverables
  apart from libraries under permissive licences (MIT, BSD, ISC, Apache-2.0 or similar). No library
  under the GPL, LGPL, AGPL, MPL, EPL, CDDL, SSPL, EUPL, OSL or any other copyleft licence is used,
  in development or in what is shipped. Each library, version and licence is recorded in PROVENANCE.md.
- `SW-LIC-2` Tools: every program that reads, produces, converts, renders or checks SmartWeld's data,
  drawings, documents or images is SmartWeld's own code or permissively licensed. A program that
  contains copyleft parts is not used for these tasks, even when its own licence is permissive. This
  is why the headless browser is no longer used: it bundles an LGPL media library. PDFs are written by
  SmartWeld's own writer (SW-PDF-*); images by SmartWeld's own renderer (SW-REN-*); received PDFs
  are read by SmartWeld's own reader on pypdf (SW-IMP-*).
- `SW-LIC-3` Fonts: no font file is embedded in, or shipped with, a deliverable unless its licence is
  permissive and has no copyleft term. The work-order PDFs embed a subset of DejaVu Sans, under the
  Bitstream Vera licence: permissive, with a notice to carry and a renaming condition on modified
  copies. The subset keeps the name "DejaVuSans", which contains neither "Bitstream" nor "Vera",
  and each PDF carries the licence notice. Fonts under the SIL Open Font License are not used: it is
  a copyleft-style licence for the font itself.
- `SW-LIC-4` The operating environment is outside SW-LIC-1..3. That means the container's
  operating-system kernel, shell, version control (git) and the system C library that Node and
  Python load. Copyleft obligations attach to distributing or modifying the licensed software, not
  to running it, and they do not pass to what is made with it. These programs run the commands but
  are not linked into, modified for, or shipped with SmartWeld. Only programs from the
  environment's base system are allowed under this rule; no further copyleft program is added to
  it. To be confirmed by counsel (IP_REVIEW.md).
- `SW-LIC-5` Copyright: SmartWeld's deliverables contain only SmartWeld's own work, the user's own
  documents, and the permissively licensed parts recorded under SW-LIC-1 and SW-LIC-3 with their
  notices (THIRD_PARTY_NOTICES.md). Nothing from a published standard, table, catalogue, drawing or
  other third-party work is copied (section 0).

## 1. Physical constants

| ID       | Constant                         | Value                       | Reason / nature                                               |
|----------|----------------------------------|-----------------------------|---------------------------------------------------------------|
| `K-1`    | Density of carbon steel          | 490 lb/ft³ (0.28356 lb/in³) | Physical property of iron-carbon steel (≈7.85 g/cm³).         |
| `K-2`    | Elastic modulus of steel         | 29,000 ksi                  | Physical property of steel (≈200 GPa). Used by later stages.  |
| `K-3`    | Poisson's ratio of steel         | 0.30                        | Physical property. Used by later stages.                      |
| `K-4`    | Gravitational acceleration       | 32.174 ft/s²                | Physical constant. Used by later stages.                      |
| `K-5`    | Density of water                 | 62.4 lb/ft³                 | Physical property (at ordinary temperature). Later stages.    |
| `K-6`    | Geometry                         | π, √2, √3, cos 30° = √3/2   | Mathematics.                                                  |

## 2. Units, precision and frames

- `SW-U-1` Internal unit of length is the inch; weight in pounds; force in kips (1,000 lb);
  stress in ksi. Reason: imperial-only product; a single internal unit avoids conversion errors.
- `SW-U-2` Display: lengths over 24 in are shown as feet-inches with fractional inches to 1/16;
  thicknesses and small dimensions as decimal inches to 0.001 in. Reason: matches how a
  steel drawing is read.
- `SW-U-3` Rounding of rule-derived dimensions: thicknesses to the nearest 0.005 in; widths,
  depths and radii to the nearest 0.01 in; lengths of hardware to the nearest 1/4 in unless
  a rule says otherwise. Reason: mill and shop tolerances make finer precision meaningless;
  the bill of materials must not carry false precision.
- `SW-U-4` Coordinate frame: right-handed, +Y up, +X east, +Z south. Section profiles are
  drawn in the local (x, y) plane of the member with the member axis along local +Z;
  for horizontal members local +Y is up. Reason: the browser renderer and the ground-truth
  export share one frame so the same data drives both.
- `SW-U-5` True scale: no part is thickened, enlarged or simplified for appearance. A part
  that would be invisible at a given zoom simply is. Reason: product rule.

## 3. Designation grammar (what the drawing states)

Parts are identified as a drawing identifies them. The grammar below is the parser's
contract. Numbers may be decimals (`0.25`), fractions (`1/4`), or mixed (`3-1/2`).

| Kind                | Grammar                         | Example            | Dimensions stated by the designation                  |
|---------------------|----------------------------------|--------------------|-------------------------------------------------------|
| Wide-flange         | `W{D}x{w}`                       | `W12x26`           | nominal depth D (in), weight w (lb/ft)                |
| Channel             | `C{D}x{w}`                       | `C10x15.3`         | depth D (in), weight w (lb/ft)                        |
| Angle               | `L{a}x{b}x{t}`                   | `L4x3-1/2x1/4`     | leg a, leg b, thickness t (in)                        |
| Rectangular HSS     | `HSS{H}x{B}x{t}`                 | `HSS6x4x1/4`       | outside depth H, outside width B, wall t (in)         |
| Round HSS           | `HSS{OD}x{t}`                    | `HSS6x0.25`        | outside diameter OD, wall t (in)                      |
| Plate               | `PL{t}x{w}x{L}` or `PL{t}x{w}`   | `PL1/2x12x18`      | thickness t, width w, length L (in)                   |
| Structural bolt     | `B{d}x{L}`                       | `B3/4x2-1/2`       | nominal diameter d, length under head L (in)          |
| Anchor rod          | `AR{d}x{L}`                      | `AR3/4x18`         | nominal diameter d, overall length L (in)             |
| Fillet weld         | `FW{leg}`                        | `FW1/4`            | leg size (in)                                         |
| Groove weld         | `GW{t}`                          | `GW1/2`            | joint thickness (in) — complete penetration           |

Everything the designation states carries basis `drawing`. Everything else carries a rule.

## 4. Wide-flange sections (`W`)

A W designation fixes only nominal depth and weight. The cross-section is proportioned by
the rules below and is labelled as such.

- `SW-W-1` Area from weight: A = w · 144 / 490 in². Reason: definition of weight per foot
  with constant K-1; exact arithmetic, not a table.
- `SW-W-2` Flange width. Let r = A / D² (a dimensionless measure of how heavy the member is
  for its depth). Then bf / D = clamp(0.40 + 6 · (r − 0.05), 0.40, 1.00).
  Reason: a light member for its depth is a beam; bending efficiency wants the flange
  material as far from the neutral axis as possible with only enough width to keep the
  outstanding half-flange from buckling locally, which gives bf ≈ 0.4 D. A heavy member for
  its depth is a column; a column wants similar radii of gyration about both axes, which
  calls for a nearly square envelope, bf ≈ D. A linear blend between the two over
  0.05 ≤ r ≤ 0.15 gives a continuous family. The constants are SmartWeld choices by this
  reasoning, not fitted to any table.
- `SW-W-3` Flange-to-web thickness ratio: tf = 1.6 · tw. Reason: flanges carry bending and
  must be thick enough to stay compact as outstanding elements; the web carries shear at
  lower demand and is stiffened by both flanges, so it can be thinner. A ratio of 1.6 keeps
  both the half-flange slenderness (bf / 2tf) and web slenderness (T / tw) in a compact range
  for the widths given by SW-W-2.
- `SW-W-4` Fillet radius at the web-to-flange junction: R = tw. Reason: a hot-rolled
  junction needs a fillet to relieve the stress concentration and to let the rolls fill;
  tying it to the web thickness scales it sensibly across the family.
- `SW-W-5` Family depth. Within one nominal depth D the clear distance between flanges, T,
  is constant and the actual depth is d = T + 2 · tf. T is fixed by the family's reference
  member: the member with r₀ = 0.045 (the lightest practical member) has d = D exactly, so
  T = D − 2 · tf(reference). Reason: a mill rolls a whole family with the same web rolls and
  makes heavier members by opening the flange rolls outward, so heavier members of a family
  are deeper; the lightest member defines the nominal depth.
- `SW-W-6` Area balance. With bf from SW-W-2, T from SW-W-5, tf = 1.6 tw and four fillets of
  radius tw, the area is A = 2 bf tf + T tw + 4 (1 − π/4) tw², i.e.
  A = (3.2 bf + T) · tw + 0.8584 · tw². This quadratic has a single positive root, which is
  tw. Reason: the drawn cross-section must weigh what the designation says.
- `SW-W-7` Rounding per SW-U-3 after solving: tw is rounded first, then tf is re-solved from
  the area balance of SW-W-6 with the rounded tw and rounded itself. The bill of materials
  carries the designation weight (drawing basis); the modeled area is reported as a check and
  must agree within 2 % (tested). Reason: the area balance, not the 1.6 ratio, is the identity
  that must hold after rounding.
- `SW-W-8` Surface finish, camber, sweep: not modeled. Reason: true-scale visual reference
  of the nominal section; rolling tolerances are not part of the drawing.

## 5. Channels (`C`)

- `SW-C-1` Area from weight as SW-W-1.
- `SW-C-2` Actual depth d = D. Reason: channel families are rolled to the nominal overall
  depth; the mill varies web thickness and flange width, not depth.
- `SW-C-3` Flange width: with r = A / D², bf / D = clamp(0.25 + 2 · (r − 0.04), 0.25, 0.40).
  Reason: a channel flange is a single outstand supported only at the web, so it must be
  narrow relative to depth to stay compact; heavier members widen the flange modestly.
- `SW-C-4` Flange thickness and taper: the average flange thickness is tf = 1.5 · tw. The
  inside face of the flange is tapered with slope s = 1/6 (thickness grows toward the web),
  so the tip thickness is tf − s · (bf − tw) / 2 and the root thickness is
  tf + s · (bf − tw) / 2. Reason for 1.5: same reasoning as SW-W-3, slightly lower because
  the single-outstand flange is narrower. Reason for the taper: a tapered flange lets the
  rolled section release from the roll pass (a draft angle of about 9.5°, which is slope
  1/6) and thickens the flange where the bending stress and the fillet meet. The slope was
  chosen from draft-angle reasoning; it may coincide with common practice (logged).
- `SW-C-5` Fillet radius at the web-to-flange junction R = tw; toe radius = tip thickness / 2.
  Reason: as SW-W-4; the toe is rounded by the roll for the same reason.
- `SW-C-6` Area balance: A = 2 bf tf + (D − 2 tf) tw + 2 (1 − π/4) tw² with tf = 1.5 tw, so
  A = (3 bf + D) tw − 2.571 tw². The smaller positive root is tw (the larger root would make
  the web thicker than the flanges meet). Reason: as SW-W-6.
- `SW-C-7` Rounding and weight check as SW-W-7: tw is rounded, then the average flange
  thickness tf is re-solved from the exact drawn-area balance, which includes the toe rounding
  of SW-C-5: A = D tw + 2 (bf − tw) tf + 2 (1 − π/4) tw² − ½ (1 − π/4) t_tip², with
  t_tip = tf − s (bf − tw)/2. Reason: small channels lose a measurable share of area to the
  toe radii, so the balance must include them for the drawn section to weigh what the
  designation states.

## 6. Angles (`L`)

- `SW-L-1` Legs and thickness are stated by the designation (drawing basis).
- `SW-L-2` Root fillet radius R = t; toe radius = t / 2. Reason: as SW-W-4; the toe is
  rounded by the finishing roll.
- `SW-L-3` Weight is computed from the drawn area:
  A = t (a + b − t) + (1 − π/4) t² − 2 (1 − π/4)(t/2)², times K-1. Reason: an angle
  designation carries no weight, so the weight is a derived quantity and is reported as
  such.

## 7. Hollow structural sections (`HSS`)

- `SW-HSS-1` Outside dimensions and wall thickness are stated by the designation. The modeled
  wall is exactly the stated wall. No design-thickness reduction factor is applied: any such
  factor would come from a standard, which is outside the allowed sources. Reason: product
  rule (true scale, drawing governs).
- `SW-HSS-2` Rectangular corners: inside bend radius Rᵢ = 1.5 t, outside radius Rₒ = 2.5 t.
  Reason: the tube is cold-formed from flat strip. The outer-fibre strain in a bend is
  t / (2 Rᵢ + t); at Rᵢ = 1.5 t that is 25 %, which is about the ductility of structural
  steel, so a tighter bend risks cracking and a looser one wastes flat width. Chosen by
  this reasoning, not from any table.
- `SW-HSS-3` Round HSS: a plain tube of the stated outside diameter and wall.
- `SW-HSS-4` Weight from the drawn area (times K-1). Rectangular area is the outer rounded
  rectangle minus the inner rounded rectangle: [H B − (4 − π) Rₒ²] − [(H − 2t)(B − 2t) −
  (4 − π) Rᵢ²]. Round area is π (OD² − (OD − 2t)²) / 4.

## 8. Plates, gussets, base plates, stiffeners

- `SW-PL-1` Plates: thickness, width and length are stated by the drawing. Weight =
  t · w · L · K-1. No edge preparation, camber or mill scale is modeled.
- `SW-PL-2` Plate thickness increments: when a rule computes a plate thickness it is rounded
  up to the next 1/8 in (1/16 in below 1/2 in). Reason: plate is stocked and detailed in
  these increments; a computed 0.41 in plate is bought as 1/2 in.

Gussets:

- `SW-GP-1` A gusset is a flat plate with an outline polygon. The outline comes from the
  drawing or from a connection rule of a later stage (bracing, pipe-rack). Stage 1 provides
  the geometry and the thickness rule only.
- `SW-GP-2` Gusset thickness: t_g = roundup( max(3/8 in, 0.75 · t_member), SW-PL-2 ), where
  t_member is the thickest connected element (angle leg, HSS wall, or flange). Reason: the
  gusset must carry the member force through its Whitmore width without yielding before the
  member; matching three-quarters of the member thickness over a wider spread plate achieves
  that, and 3/8 in is the thinnest plate that welds without excessive distortion.

Base plates:

- `SW-BP-1` Plan size: N = roundup(d + 2 e, 1 in) along the column depth and
  B = roundup(bf + 2 e, 1 in) across the flanges, with edge margin e = 3 in. Reason: the
  margin must hold an anchor rod with its nut and washer beside the flange tip and leave
  room for the column-to-plate fillet weld; 3 in does this for rods up to about 1-1/4 in.
- `SW-BP-2` Thickness: the plate beyond the column acts as a cantilever of length
  l = max((N − d)/2, (B − bf)/2) under the bearing pressure f_p. Plastic bending of a plate
  strip gives t = l · sqrt(2 f_p / (0.9 F_y)), rounded up per SW-PL-2, minimum 3/4 in.
  Inputs: f_p and F_y from the drawing. Default when the drawing gives no load:
  f_p = 1.0 ksi (`SW-BP-2a`, a lightly loaded industrial column) and F_y from the grade
  stated on the drawing (SW-MAT-1). Reason: equilibrium of the cantilever strip; 0.9 is a
  SmartWeld resistance factor for bending; 3/4 in minimum keeps the plate stiff enough to
  seat on grout without dishing.
- `SW-BP-3` Anchor rods: four rods, one near each corner, on a rectangle set in 1.5 in
  from each plate edge. Reason: four rods give a column a stable base during erection
  before bracing is in place (two rods allow it to rotate about the line between them).
  This count is also believed to be required by federal steel-erection regulation
  29 CFR 1926.755; that citation is NOT claimed until the eCFR text has been read in this
  workspace (see PROVENANCE.md P-7). Until then the basis is this SmartWeld rule.
- `SW-BP-4` Rod holes in the base plate are d + 1/2 in, covered by a square plate washer
  3 d on a side and 3/8 in thick. Reason: rods cast into concrete are placed to a coarser
  tolerance than shop-drilled holes, so an oversize hole is needed, and a plate washer is
  needed to span it.
- `SW-BP-5` Grout bed under the plate: 1.5 in. Reason: thick enough for flowable grout to be
  placed and for leveling nuts under the plate; thin enough to behave as bearing material.

Stiffeners:

- `SW-ST-1` A transverse stiffener pair on a W section has width
  b_s = rounddown((bf − tw) / 2 − 1/4 in, 1/4 in) and thickness
  t_s = roundup( max(3/8 in, b_s / 15), 1/16 in ). Reason: 1/4 in clearance to the flange
  tip for fit-up; a stiffener outstand with b/t ≤ 15 will yield before it buckles; 3/8 in is
  the minimum weldable plate.
- `SW-ST-2` Corner clip (to clear the rolled fillet): c = roundup(R + 1/4 in, 1/4 in),
  minimum 3/4 in, on both inside corners. Reason: the stiffener must not bear on the fillet.
- `SW-ST-3` Stiffener length is the clear web depth T; it is fillet-welded to the web and
  to both flanges with welds sized by SW-WD-1.

## 9. Structural bolts (`B`), anchor rods (`AR`)

Bolt threads are not modeled as helices; the shank is drawn at the nominal diameter d.

- `SW-B-1` Diameter and length under head are stated by the designation.
- `SW-B-2` Heavy hex head: width across flats F = roundup(1.5 d, 1/16 in); across corners
  F / cos 30°; head height H = round(0.65 d, 1/32 in). Reason: the hex area 0.866 F² minus
  the shank area gives a bearing annulus of about 1.2 d², larger than the bolt's tensile
  stress area, so the plate under the head is not overstressed; a head height of 0.65 d gives
  a head-shear area π d H ≈ 2 d² which, at a shear strength of 0.6 times tension, carries the
  bolt tension with a margin near 2.
- `SW-B-3` Heavy hex nut: across flats F (as the head); height = round(1.0 d, 1/32 in).
  Reason: the nut threads must develop the full bolt tension by thread shear; a nut as tall
  as the bolt diameter gives a thread shear area of about 1.6 d² against a tensile area of
  about 0.6 d², which covers the nut being of weaker material than the bolt.
- `SW-B-4` Hardened washer: outside diameter 2 d, hole as SW-B-8, thickness
  roundup(0.15 d, 1/32 in) minimum 1/8 in. Reason: spreads head/nut bearing to twice the
  diameter and gives a hard, flat turning surface.
- `SW-B-5` Thread length (from the end): 2 d. Reason: one nut height plus one diameter of
  margin for grip variation.
- `SW-B-6` Thread stick-out beyond the nut: ≥ d / 4. Reason: at least two full threads
  must project past the nut for the nut to be fully engaged; with a thread pitch near d / 8
  that is d / 4.
- `SW-B-7` Bolt length selection: L = roundup(grip + washer thickness + nut height +
  d / 4, 1/4 in). Reason: SW-B-3, SW-B-4, SW-B-6 stacked on the grip; 1/4 in increments
  keep stock lengths few.
- `SW-B-8` Standard hole: d + 1/16 in. Reason: drilling and punching position tolerance
  requires clearance for a bolt to pass two mated plies.
- `SW-B-9` Minimum spacing 3 d; minimum edge distance 1.5 d. Reason: at 1.5 d the tear-out
  shear area beyond the hole (two planes of (1.5 d − d/2) t) equals 2 d t, which is enough
  to match bearing on the hole; 3 d spacing leaves 1.5 d clear between heads for a socket.

Anchor rods:

- `SW-AR-1` Diameter is stated by the drawing; default when not stated: 3/4 in (`SW-AR-1a`).
  Reason: the smallest rod that gives a base stable in erection and can be tensioned by hand
  tools without stripping.
- `SW-AR-2` Embedment into concrete: max(12 d, 12 in), with a heavy hex nut (SW-B-3) and a
  square plate washer 3 d × 3 d × 3/8 in at the embedded end. Reason: a headed rod develops
  its tension by a concrete breakout cone, whose size grows with embedment; 12 d gives a
  cone diameter of about 36 d, which keeps concrete breakout well above the rod's tension.
- `SW-AR-3` Projection above the concrete: grout (SW-BP-5) + base plate thickness +
  leveling nut (SW-B-3) + plate washer (SW-BP-4) + top nut + d / 4 stick-out, rounded up to
  1/4 in. Rod overall length = embedment + projection. Reason: stacking of the parts the rod
  passes through.

## 10. Welds (`FW`, `GW`)

Welds are real parts of the model: they have geometry, a size, a length and a weight, and
they appear in the bill of materials and in the ground-truth export.

- `SW-WD-1` Fillet leg size when not stated by the drawing:
  w = roundup(0.75 · t_thin, 1/16 in), minimum 3/16 in, and not more than t_thin − 1/16 in
  along a plate edge (so the edge is not melted away). Reason: a fillet with throat
  0.707 w of weld metal somewhat stronger than the plate develops the shear of the thinner
  plate when w ≈ 0.75 t; 3/16 in is the smallest leg that can be deposited on thick material
  without cooling so fast that it cracks.
- `SW-WD-2` Fillet geometry: an isosceles right triangle of leg w with a flat face, swept
  along the joint line. Throat = 0.707 w. Reason: true scale; no reinforcement or convexity
  is added for appearance.
- `SW-WD-3` Fillet weld weight = 0.5 w² · length · K-1.
- `SW-WD-4` Complete-penetration groove weld between plates of thickness t: single-V with
  60° included angle, root opening 1/8 in, root face 1/16 in; the weld volume is the groove
  plus a shallow reinforcement cap over the groove width, rising 1/16 in at the centre and
  modeled as a triangle (area = ½ × groove width × 1/16 in). Reason: 60° is the narrowest
  included angle that lets an electrode reach the root; the small root face and opening
  give full fusion. The reinforcement is the real deposited profile, not decoration.
- `SW-WD-5` Groove weld weight = groove cross-section area · length · K-1.

## 11. Material

- `SW-MAT-1` Steel grade is a drawing input stored as a string, with the minimum yield
  strength F_y stated on the drawing. The generator's own drawings use "Grade 36"
  (F_y = 36 ksi) for every structural element. Reason: a single conservative grade keeps
  the generated plant internally consistent; the yield value is part of the grade name the
  drawing states, not a table value.

## 12. Tests required for stage 1

- Every designation in section 3 parses and round-trips to the same string.
- For W and C: the drawn cross-section polygon area (shoelace) equals the area the
  designation weight implies (SW-W-1) within 2 % after rounding.
- For L and HSS: the drawn polygon area equals the closed-form area in SW-L-3 / SW-HSS-4
  within 0.5 % (the only difference being arc facetting).
- Every profile polygon is simple (no self-intersection) and counter-clockwise.
- Every extruded mesh is closed (each edge shared by exactly two triangles) and its
  signed volume equals profile area × length within 0.5 %.
- Every dimension carries a basis; every `rule:` basis names a rule ID that exists in this
  file.
- Bolt assemblies: SW-B-7 length ≥ grip + washer + nut + d/4.

---

# Stage 2 — Building shell (frame, cold-formed framing, cladding, roof, doors)

Written before any stage-2 code. The generator's building is described by a drawing block
whose values carry basis `drawing` (they are inputs the user can change); everything the
generator derives from them carries a rule below.

## 13. Building drawing block (`SW-BLD-*`)

- `SW-BLD-1` The building drawing states: width W out-to-out of the steel line, length L,
  number of bays and bay spacing, eave height He, roof slope (rise per 12), roof gravity
  design load (includes snow), wall design pressure, floor slab thickness, steel grades for
  hot-rolled, cold-formed and sheet steel, bolt tensile strength, and the door schedule.
  Demonstration plant values: W = 80 ft, 8 bays at 25 ft (L = 200 ft), He = 30 ft, slope
  1:12, roof gravity load 30 psf, wall pressure 20 psf, slab 6 in, Grade 36 hot-rolled
  (SW-MAT-1), "Grade 50" cold-formed and sheet (F_y = 50 ksi, the number in the grade name),
  bolts "Grade 90" (F_u = 90 ksi). Reason: inputs, stated so they can be reviewed; wind and
  seismic are not analysed in this stage (noted, not hidden).
- `SW-BLD-2` A frame line at every bay line, including both end walls; the gable is
  symmetric with the ridge at mid-width; columns stand with their outside flange face on
  the steel line; girts and purlins by-pass the columns and rafters on their outside so the
  cladding is a continuous flat plane. Reason: continuous by-pass framing makes a flat,
  simple wall and roof surface.
- `SW-BLD-4` Endwall wind posts: W sections at 20 ft spacing along each end wall (at
  z = ±20 ft for the 80 ft plant), from a base plate (SW-BP-*) to the rafter underside, with
  nominal depth roundup(height / 36, 2 in) and weight by the SW-PF-3 search for
  M = w h² / 8 where w = wall pressure × 20 ft tributary width. The post-to-rafter
  connection hardware is not modeled in this stage (stated). Endwall girts span between
  posts and corner columns. Reason: an 80 ft endwall cannot be girted in one span; posts at
  20 ft keep endwall girts within the sidewall girt rule.
- `SW-BLD-3` Floor slab: a concrete slab of the stated thickness, top at elevation 0,
  extending 6 in beyond the steel line. Column bases sit on the slab with the grout bed of
  SW-BP-5. Non-steel; not in the steel bill of materials.

## 14. Primary frames (`SW-PF-*`)

Preliminary proportioning for a visual-reference model; not a structural design.

- `SW-PF-1` Rafter nominal depth D = roundup(W / 40, 2 in) (W in inches). Reason: a depth
  near 1/40 of the gable span (1/20 of each rafter's half-span) gives a frame stiff enough
  to limit sway and roof sag; deeper members save weight but cost headroom.
- `SW-PF-2` Frame gravity load per foot: w = (roof design load + roof dead load) × bay
  spacing, where the roof dead load is computed from the model's own purlins and panels
  (SW-CL-1, SW-CF-5) plus a 10 % allowance for the rafter and connections. Design moment
  for rafter and knee: M = w W² / 12. Reason: the fixed-end moment of a uniformly loaded
  span; a portal frame with continuous knees approaches it, and because pinned bases shift
  moment from the knee to the ridge, using the fixed-end value for both rafter and column
  covers the envelope within the accuracy of this preliminary rule.
- `SW-PF-3` Required plastic modulus Z = M / (0.9 F_y). The drawn W section's plastic modulus
  is Z = bf tf (d − tf) + tw (d − 2tf)² / 4 (fillets ignored). The rafter weight is the
  lightest whole lb/ft at depth D (starting from the family reference member) whose Z meets
  the requirement, rounded up to a multiple of 5 lb/ft. Reason: equilibrium of the plastic
  stress blocks; 0.9 is the SmartWeld bending resistance factor; the 5 lb/ft step keeps the
  plant's distinct sizes few.
- `SW-PF-4` Columns use the rafter section. Reason: equal depth makes the end-plate knee a
  direct flange-to-flange joint and the knee moment is the same in both members; the axial
  load of the column is small relative to its bending at this span.
- `SW-PF-5` Knee and ridge joints are bolted end plates with no haunch (a stated
  simplification). End plate: thickness roundup(max(3/4 in, 1.25 tf), SW-PL-2), width
  bf + 1 in, bolts in 4 rows of 2 — two rows outside each flange and two inside — at
  1.75 in from the flange faces, with gauge roundup(max(bf / 2, 3 d_b), 1/2 in); plate length
  = d + 2 (1.75 in + 1.5 d_b) rounded up to 1/2 in. Bolt diameter: the four bolts nearest
  the tension flange share the flange force T = M / d; per bolt T/4 ≤ 0.75 A_b F_u gives
  A_b, hence d_b = roundup(√(4 A_b / π), 1/8 in), minimum 3/4 in. Reason: a 1.25 tf plate
  keeps prying small; 1.75 in from the flange face clears a socket; 0.75 is the SmartWeld
  tension resistance factor for threads in the tensile area (A_b taken on the nominal
  diameter, which is conservative).
- `SW-PF-6` Base plates by SW-BP-* with bearing pressure f_p = P / (N B), P = w W / 2 (the
  gravity reaction of one column). Anchor rods by SW-AR-*.
- `SW-PF-7` Column-to-base-plate weld: a fillet weld all around the column profile, sized by
  SW-WD-1 with t_thin = min(tw, tf, t_plate). Modeled as a loft from the profile outline
  offset outward by the leg on the plate to the outline at leg height on the column.
- `SW-PF-8` Rod bracing: in the first and last bay of each sidewall, X-bracing rods from the
  column bases to the eave; in the roof of the same bays, X-bracing rods between the
  rafters from the eave to the ridge. Rod diameter 3/4 in. Reason: the end bays of a
  bay-framed building are braced to carry longitudinal load to the foundations; 3/4 in is
  the smallest rod that is stiff enough to be useful and robust against accidental damage;
  wind is not analysed in this stage, so this is a proportion, not a design.

## 15. Cold-formed framing (`SW-CF-*`)

- `SW-CF-1` Grammar: Z section `Z{D}x{B}x{t}` and C section `CS{D}x{B}x{t}`: depth D, flange
  width B, sheet thickness t stated. Lip length = roundup(0.3 B, 1/8 in). Inside bend radius
  = 1.5 t, outside = 2.5 t (the cold-forming reasoning of SW-HSS-2). Reason: a stiffening
  lip about 30 % of the flange width keeps the flange edge from buckling locally.
- `SW-CF-2` Z sections have equal flanges; laps at supports are not modeled (stated).
- `SW-CF-3` Gross section properties (I, S about the strong axis) are computed from the
  drawn profile polygon by exact polygon integration; no effective-width reduction is
  applied (stated simplification).
- `SW-CF-4` Purlin spacing ≤ 5 ft measured along the slope, with the first purlin 1 ft from
  the ridge and the last at the eave strut; girt spacing ≤ 7.5 ft, first girt at 7.5 ft
  above the floor, last at the eave strut. Eave strut: a CS section of the girt size.
  Reason: the panel of SW-CL-1 spans 5 ft (checked by SW-CL-3); girts at 7.5 ft keep the
  wall panel span within the same check at the lower wall pressure.
- `SW-CF-5` Purlin and girt design: simple span over the bay spacing Lb; w = design load ×
  tributary width; M = w Lb² / 8; S_req = M / (0.9 F_y). Depth D = roundup(Lb / 30, 2 in),
  flange B = roundup(D / 4, 1/2 in), thickness the first of the series
  {4/64, 5/64, 6/64, 7/64, 8/64, 9/64 in} whose gross S ≥ S_req. Reason: span/30 depth
  keeps deflection small; the thickness series is in 1/64 in steps, chosen by SmartWeld,
  not from any gauge table.
- `SW-CF-6` Purlin and girt clips: a plate 1/4 in × 4 in × (D − 2 in) standing perpendicular
  to the supporting flange (rafter top flange, column outer flange) and parallel to the
  member web, fillet-welded to the flange along its free face (SW-WD-1), with two 1/2 in
  bolts (SW-B-*) through the web at D/2 ± 1.5 in. Purlins sit on the rafter with their web
  normal to the roof; girts lie against the column flange with their web horizontal
  (depth normal to the wall), so in both cases the same plate detail applies. Clips are
  placed 2-1/2 in inside each bay so the two members meeting at a frame have their own
  clips (laps not modeled, SW-CF-2). Reason: a bolted clip lets the secondary member be
  erected after the frame; the plate must be parallel to the web for the bolts to pass;
  1/2 in bolts carry the member reaction with margin.
- `SW-CF-7` Endwall girts use the sidewall girt section (their spans between posts are
  shorter, so the sidewall size governs). Door jambs and headers use the girt section as a
  C (`CS`) so the flanges can face away from the opening. Reason: fewer distinct sizes.

## 16. Cladding and trim (`SW-CL-*`)

- `SW-CL-1` Panel: single-skin ribbed sheet, thickness 0.025 in, rib height 1.25 in, rib
  pitch 12 in, rib top flat 1.5 in, rib sides at 30° from vertical, cover width 36 in
  (three ribs). Side laps are not modeled; sheets are placed edge to edge at the cover
  width. Reason: the rib gives the sheet its bending stiffness over the purlin spacing;
  0.025 in is the thinnest sheet that roll-forms a 1.25 in rib without edge waviness and
  resists foot traffic; the proportions are SmartWeld choices checked by SW-CL-3.
- `SW-CL-2` Wall sheets run vertically from the base trim to the eave in one length; roof
  sheets run from the eave to the ridge in one length, overhanging the wall sheet by 2 in
  at the eave and stopping 1 in short of the ridge line under the ridge cap. Sheets at the
  gable are cut to the roof line. Reason: the overhang drips clear of the wall; the ridge
  gap lets the cap seat.
- `SW-CL-3` Check (tested): the panel's gross section modulus per foot of width, from the
  drawn profile, must be ≥ M / (0.9 F_y) with M = w s² / 8 over the purlin (or girt)
  spacing s and the stated design load.
- `SW-CL-4` Fasteners (self-drilling screws) are not modeled in this stage (stated).
- `SW-CL-5` Trim is formed from the panel sheet (0.025 in) into angles with a 1.5 t inside
  bend: corner trim 4 × 4 in, base trim 3 × 2 in, eave trim 4 × 4 in, rake trim 6 × 4 in,
  ridge cap 12 in each side bent to the roof angle, door head and jamb trim with a 2 in face and a leg equal to the girt depth, formed from 1/16 in sheet (SW-DR-3).
  Lengths equal the edges they cover. Reason: legs long enough to cover the panel rib
  height plus a fastening flat.

## 17. Doors (`SW-DR-*`)

- `SW-DR-1` Door schedule (drawing): personnel doors 3 ft 0 in × 7 ft 0 in; equipment
  doors 14 ft 0 in × 16 ft 0 in roll-up. The generator places two personnel doors on each
  sidewall (at the second and seventh bays) and one equipment door centred on each end wall.
- `SW-DR-2` Framed opening: jambs of the girt section from the floor to the first girt
  above the head, a header of the girt section between the jambs at the head, both clipped
  per SW-CF-6. Girts that cross the opening are cut at the jambs. Reason: the jambs carry
  the cut girts' reactions to the floor and to the girt above.
- `SW-DR-3` Personnel door: a flush leaf 1-3/4 in thick (drawing) in a frame of 2 in face
  width formed from 1/16 in sheet (drawing), the leaf shown closed. Roll-up door: a curtain
  1/8 in thick (drawing) shown closed, with a drum 24 in in diameter (drawing) above the
  head inside the wall, on brackets of 1/4 in plate. Non-structural; weights not in the
  steel bill of materials.

## 18. Tests required for stage 2

- Cold-formed and panel profiles are simple polygons; polygon-integrated I for a plain
  rectangle equals b h³ / 12 (validates the integrator).
- Purlin thickness never decreases with span or load; SW-CL-3 passes for the demonstration
  plant's purlin and girt spacing.
- Rafter section Z ≥ required; column count = 2 × (bays + 1); every purlin spacing ≤ 5 ft
  and every girt spacing ≤ 7.5 ft; no door opening overlaps a column; bolt diameters at the
  knee ≥ 3/4 in.
- Every stage-2 rule ID used in code exists in this file (audit test extended).
- The building model is JSON-serialisable and every instance transform is finite.

---

# Stage 3 — Interior: equipment, pipe rack, platforms and access steel

Written before any stage-3 code. Per the user's decision (PROVENANCE P-22) no external source
of any kind is used for this stage: guardrail, stair and ladder proportions are SmartWeld
rules reasoned from the human body and from fall-protection logic, for visual reference.
Where such a value may coincide with a published regulation it was not taken from one.

## 19. Grating (`SW-GR-*`)

- `SW-GR-1` Welded bar grating: bearing bars 1-1/2 in deep × 3/16 in thick at 1-1/2 in
  centres, cross bars 1/4 in square at 4 in centres, set flush with the top of the bearing
  bars. Reason: a 1-5/16 in clear opening between bars stops a boot heel and most dropped
  hand tools while leaving the grating mostly open for light and drainage; 3/16 in bars
  1-1/2 in deep span the 4 ft of SW-PLT-2 under a person with a stiff feel; cross bars at
  4 in keep the bearing bars upright and spread a point load to its neighbours.
- `SW-GR-2` Panels are cut to the platform framing with a 1/2 in clearance to the toe plate
  and are 36 in wide maximum (bars run across the span); banding bars (3/16 × 1-1/2 in flat)
  close the cut ends. Reason: a 36 in panel is a two-person lift.
- `SW-GR-3` Grating stair treads: the same grating 10 in deep (bars across the tread) with a
  1-1/4 in × 3/16 in checker-plate nosing angle along the front edge, carrier plates
  3/16 × 2 in at each end bolted to the stringer with two 3/8 in bolts (SW-B-*). Reason:
  a visible, abrasive nosing marks the tread edge; the carrier plate gives a flat bolting
  face.
- `SW-GR-4` Grating weight is computed from the drawn bars (K-1).

## 20. Guardrail (`SW-HR-*`)

- `SW-HR-1` Guardrail: top rail at 42 in above the walking surface, one mid rail at half
  that height, toe plate 4 in high × 1/4 in flush with the walking surface, posts at 6 ft
  maximum spacing and at every corner and end. Reason: a tall adult's centre of gravity
  stands about 41 in above the floor, so a rail at 42 in stays above it and a person
  leaning or stumbling against it rotates back rather than over; the mid rail halves the
  opening so a crouching or falling person cannot pass under the top rail; a 4 in toe plate
  stops tools and a boot from sliding off the edge; 6 ft posts keep the rail deflection
  small under a person's weight thrown against it.
- `SW-HR-2` Members: posts and rails are round HSS 2 in OD × 1/8 in wall (`HSS2x1/8`,
  SW-HSS-*); the toe plate is `PL1/4x4` (SW-PL-*). Reason: a 2 in round section is a
  comfortable hand grip and is the same member for posts and rails; 1/8 in wall is the
  thinnest that takes a fillet weld without burn-through.
- `SW-HR-3` Posts are welded to a base plate `PL3/8x5x5` bolted to the platform framing with
  two 1/2 in bolts (SW-B-*), or welded directly to the stringer of a stair. Rails are welded
  to the posts (SW-WD-1). Reason: bolted posts can be removed for lifting access.
- `SW-HR-4` Openings for ladders and stair heads have no rail across the opening; a
  self-closing gate is not modeled (stated).

## 21. Stairs (`SW-SR-*`)

- `SW-SR-1` Rise 7-1/2 in, run 10 in (angle 36.9°), uniform in a flight; treads 36 in clear
  width between stringers; risers open. Reason: for an adult gait the sum 2 × rise + run
  near 25 in is comfortable; an industrial stair is steepened to about 37° to save floor
  space while staying walkable facing forward; 36 in lets a person carry a tool box and lets
  two people pass at a landing.
- `SW-SR-2` Stringers: channels of depth roundup(flight length along slope / 16, 2 in),
  minimum 10 in; the channel weight is the lightest whole lb/ft whose drawn web thickness
  (SW-C-*) is at least 1/4 in. Reason: the stringer is a sloped beam loaded by
  people; depth of 1/16 of its span keeps it stiff; a 1/4 in web takes the tread bolts.
- `SW-SR-3` Landings: a platform (SW-PLT-*) at least 36 in long in the direction of travel at
  every change of direction and at the top of every flight; flights are limited to 12 ft
  rise between landings. Reason: a resting point and a place to stand while opening a gate;
  12 ft limits the fall down one flight.
- `SW-SR-4` Handrail on both sides of every flight at 36 in above the tread nosing line,
  continuing at 42 in around landings (SW-HR-1); the stair-side rail is carried by the
  stringer posts. Reason: a hanging hand reaches a rail near 36 in on a slope.
- `SW-SR-5` Stringer bearing: top end bolted to the platform edge beam with a clip angle
  `L4x4x3/8` × 8 in and four 3/4 in bolts; bottom end on a `PL1/2x8x10` base plate with two
  3/4 in anchor rods (SW-AR-*). Reason: standard bolted bearing, removable.

## 22. Fixed ladders (`SW-LD-*`)

- `SW-LD-1` Rails `PL1/2x2-1/2` (flat bar on edge) at 18 in clear; rungs `RD3/4` at 12 in
  centres, welded through the rails; the rail extends 42 in above the landing it serves and
  flares to 24 in clear over that top 42 in to form a walk-through. Reason: 18 in clear fits boots and gloves between the
  rails; 12 in rungs match a comfortable climbing step; 3/4 in round is a full-hand grip
  and does not bend under a boot; the 42 in extension gives a hand hold while stepping
  onto the platform.
- `SW-LD-2` Standoff: the rung centreline is 7 in clear of the wall or vessel it climbs,
  carried by brackets `L3x3x1/4` at 8 ft maximum spacing welded or bolted to the structure.
  Reason: toe room behind the rung for a boot.
- `SW-LD-3` Cage: when the climb exceeds 20 ft, hoops of `PL1/4x2` bent to a 30 in
  diameter at 4 ft centres from 7 ft above the base to the top of the ladder, with five
  vertical straps `PL3/16x1-1/2` equally spaced around the hoop. Reason: a 30 in cage
  surrounds a climber's body so a slip is arrested against the cage rather than becoming
  a free fall; it starts at 7 ft so a person can walk under it; falls below 20 ft are short
  enough that the cage's own hazard outweighs its benefit.
- `SW-LD-4` Climbs above 30 ft are broken by an offset landing platform (SW-PLT-*) with the
  next ladder section offset sideways. Reason: limits the distance of a fall inside a cage.

## 23. Platforms (`SW-PLT-*`)

- `SW-PLT-1` A platform is a rectangle (or an annulus around a vessel, built from
  rectangular segments) of grating (SW-GR-*) on steel framing with guardrail (SW-HR-*) on
  every open edge and toe plate all around. Design load 100 psf (drawing: a crowd of people
  and hand tools).
- `SW-PLT-2` Framing: edge beams and intermediate beams at 4 ft maximum spacing (the
  grating span), of W shapes with nominal depth roundup(span / 20, 2 in), minimum 6 in,
  weight by the SW-PF-3 search for M = w L² / 8, w = 100 psf × tributary width; bolted to
  the columns and vessel clips with `L4x4x3/8` clips and two 3/4 in bolts (SW-B-*). Reason:
  span/20 is the stiffness limit for a floor people walk on; the beam sizing is the same
  rule used for the building frame.
- `SW-PLT-3` Free-standing platforms stand on W columns with nominal depth roundup(height /
  36, 2 in) (minimum 6 in) by the SW-BLD-4 search, base plates and anchor rods by SW-BP-*
  and SW-AR-*, and rod bracing (`RD3/4`) in one bay in each direction. Vessel platforms are
  carried on clips welded to the vessel shell (SW-EQ-6). Reason: as the building frame.
- `SW-PLT-4` Walking surface elevation: the top of the grating. Platform elevation is
  stated by the layout (SW-LAY-*).

## 24. Pipe rack (`SW-RK-*`)

- `SW-RK-1` Transverse bents at 20 ft spacing along the rack, each a two-column moment frame
  with one beam per tier; rack width and tier elevations stated by the layout. Reason:
  20 ft is the span pipes of 3 in and larger carry between supports without excessive sag
  (checked in stage 5); smaller lines get intermediate supports.
- `SW-RK-2` Tier beams: W shapes with nominal depth roundup(width / 20, 2 in), weight by the
  SW-PF-3 search for M = w L² / 8 with w = rack design load 40 psf (drawing) × bent
  spacing. Columns: W shapes with nominal depth roundup(height / 24, 2 in), weight by the
  SW-PF-3 search for M = the top-tier beam moment / 2 (knee continuity). Bolted end-plate
  knees as SW-PF-5. Reason: a loaded rack tier is a floor of pipe; the beam rule follows
  SW-PLT-2; the column carries half the beam's end moment in a two-column bent.
- `SW-RK-3` Longitudinal struts: W shapes of the tier-beam depth − 4 in (minimum 6 in),
  lightest weight (family reference member rounded up to 5 lb/ft), between bents at every
  tier along both column lines; rod bracing `RD3/4` in the plane of the struts in every
  fourth bay, and in the column planes in the same bays. Reason: the struts carry pipe
  anchor loads and brace the columns; the rods carry longitudinal load to the bases.
- `SW-RK-4` Base plates and anchor rods by SW-BP-* / SW-AR-* on 6 in concrete pedestals
  above the slab (non-steel). Reason: keeps the base plate above wash-down water.
- `SW-RK-5` Pipe supports on the rack are stage-5 parts: the rack provides a flat top flange
  at each tier for shoes, and the struts carry guides and anchors.

## 25. Equipment (`SW-EQ-*`)

Equipment is modeled as true-scale envelopes from the stated dimensions of the layout's
equipment list (drawing basis). Internals are not modeled. Nozzles are placed in stage 5
once the pipe interface decision is made; each item carries its nozzle schedule as data.

- `SW-EQ-1` Vertical vessel: cylindrical shell of stated inside diameter, length
  tangent-to-tangent, and wall thickness; 2:1 ellipsoidal heads (head depth = D/4) top and
  bottom; a cylindrical skirt of the shell diameter and stated height with a base ring
  `PL3/4` 6 in wide and anchor rods `AR1` (count stated, minimum 8) by SW-AR-*; the skirt
  has one access opening 24 in × 36 in. Reason: a 2:1 ellipsoidal head is the shallowest head that
  carries pressure with the shell's thickness, so it is the common choice; the skirt
  carries the vessel without a thermal short circuit to the foundation.
- `SW-EQ-2` Horizontal vessel: shell and 2:1 heads as SW-EQ-1, on two saddles of `PL1/2` web,
  `PL1/2` base 10 in wide and a wear plate 120° around the shell, at 0.2 L from each
  tangent line, centreline at the stated elevation; saddle width = D/3 (min 6 in). Reason:
  saddles near the ends use the head stiffness; a 120° wear plate spreads the load into the
  shell.
- `SW-EQ-3` Shell-and-tube exchanger: shell cylinder of stated diameter and length; channel
  of the same diameter and length D/2 with a flat cover plate of thickness D/12 (min 1 in)
  at the front; a 2:1 head at the rear; saddles as SW-EQ-2. Reason: envelope only.
- `SW-EQ-4` Centrifugal pump: a baseplate `PL1` of stated plan size on a 6 in concrete pad;
  pump casing modeled as a cylinder of stated diameter and width on a pedestal
  box; motor as a cylinder of stated diameter and length on a box foot; coupling guard a
  box between. Reason: envelope only.
- `SW-EQ-5` Flat-bottom storage tank: cylindrical shell of stated diameter, height and
  thickness on the slab, a cone roof of 3/4 in rise per 12 in of 3/16 in plate, and a
  `L2x2x1/4` top curb angle. Reason: the shallow cone
  sheds rain and needs no columns at this diameter.
- `SW-EQ-6` Vessel platform clips: `PL1/2` gusseted brackets 12 in deep welded to the shell
  at the platform beam locations. Reason: carries the platform without penetrating the
  shell.
- `SW-EQ-7` Equipment weight: from the drawn steel (K-1), empty.

## 26. Pipe supports (`SW-PS-*`) — rules parametric in pipe outside diameter `OD`

Geometry built in stage 5 once `OD` is known; rules fixed here.

- `SW-PS-1` Pipe shoe: a T 4 in high of `PL3/8` web and `PL3/8` base 4 in wide, length 12 in for OD ≤ 8 in and 18 in above, welded to the pipe
  with intermittent fillets. Reason: 4 in lifts the pipe over the beam flange with room for
  insulation; a shoe long enough to stay on the beam through thermal travel.
- `SW-PS-2` Guide: two `L3x3x1/4` × 6 in each side of the shoe with 1/8 in clearance,
  welded to the beam. Reason: lets the line slide axially and stops it moving sideways.
- `SW-PS-3` Anchor: the shoe base welded to the beam all around (SW-WD-1).
- `SW-PS-4` Trunnion, or dummy leg (for vertical runs at an elbow): a cylinder of OD × 3/8 in
  wall (round HSS of the pipe's OD, SW-HSS-*) on the riser's own axis, continued down to a `PL1/2`
  base on the floor.
  - Its top is cut to the elbow's outer surface (a saddle), so it bears on and is welded to the elbow
    all along the line where they meet.
  - Where the cut reaches the riser's side, the leg's outer wall is flush with the riser's.
  - Its designation gives the height of the bottom of the horizontal run's pipe above the floor
    (the run the elbow turns into).
  - Reason: carries a riser's weight at its lowest elbow, with the load going straight down the
    riser's axis.
  - Amended 2026-11-03 (P-64): the leg had stood under the elbow's corner point, the work point
    where the two centrelines meet. A long-radius elbow curves away from that point, so the leg
    did not touch it.
- `SW-PS-5` U-bolt (small lines, OD ≤ 2.5 in): `RD3/8` bent around the pipe with 1/16 in
  clearance, legs through the beam flange with nuts (SW-B-3). Reason: the simplest hold-down
  for a light line.
- `SW-PS-6` Cantilever bracket from a column: `W` of depth 6 in (lightest), length as
  required, welded to the column flange, with a `PL3/8` stiffener; for lines off the rack.
- `SW-PS-7` Maximum span between supports for a line (checked in stage 5): 20 ft for
  OD ≥ 3.5 in, 15 ft for OD ≥ 2.375 in, 10 ft for smaller. Reason: deflection of a water-filled
  line at these spans stays within a visually flat line; small-bore lines need more support.

## 27. Layout (`SW-LAY-*`)

The layout is the generator's drawing of where things are: it carries basis `drawing`.
The demonstration layout places, inside the stage-2 building:

- `SW-LAY-1` A pipe rack 20 ft wide down the building centreline, tiers at 16 ft and
  22 ft, bents at 20 ft from x = 20 ft to x = 180 ft.
- `SW-LAY-2` Equipment rows either side of the rack, each item on a 6 in concrete pad (pumps on a
  9 in pad) with stated plan dimensions and orientation (equipment list in code, `DEMO_LAYOUT`).
  Positions are chosen so every nozzle lies on the 6 in routing grid of SW-RT-3 (amended in
  stage 5: each item moved by at most 3 in).
- `SW-LAY-3` Access: a platform below the top head of the two vertical vessels at 23 ft 9 in
  (two square annuli joined by a bridge, with a three-flight stair tower); a mid-height and a
  top platform on the column with ladders; caged ladders to the storage tank roofs; a caged
  ladder to the rack top tier at each end of the rack. (Amended before code from "stair to the
  rack top": the tier elevations are not multiples of the stair rise, and from "top-head
  level": the guardrail must clear the rafters near the sidewall.)
- `SW-LAY-4` Clearances: 3 ft minimum walkway between equipment and the rack columns;
  7 ft 6 in minimum headroom under any platform or rack beam over a walkway. Reason: a
  person with a tool bag passes; a tall person with a hard hat walks under.

## 28. Tests required for stage 3

- Grating bar count and weight match the panel size; guardrail top rail at 42 in and posts
  ≤ 6 ft apart on every platform; stair rise and run uniform and equal to SW-SR-1; ladder
  rung pitch 12 in and cage present only on climbs over 20 ft; every platform edge not
  against a wall, vessel, stair or ladder has a guardrail.
- Rack beam and column sections meet their rule Z; headroom and walkway clearances of
  SW-LAY-4 hold for the demonstration layout; no equipment envelope intersects another or
  the rack columns.
- Every stage-3 rule ID used in code exists in this file; the interior model is plain data
  with finite transforms and closed meshes.

---

# Stage 4 — Pipe, flanges and valves

Written before any stage-4 code. Per the user's decision (PROVENANCE P-27) every interface
dimension is a SmartWeld rule. Pressure P is the class design pressure in psi at ambient
temperature; stresses are in psi unless stated.

## 29. Pipe (`SW-PIPE-*`)

- `SW-PIPE-1` Identification: `PIPE{NPS}-{class}`, e.g. `PIPE6-P300`. NPS is the nominal size
  in inches; the class is one of the SmartWeld series `P150`, `P300`, `P600`, `P1200`,
  `P2400`, `P4800`, each named by its design pressure in psi. Reason: the drawing names a
  line by size and class; a doubling series from 150 psi covers low-pressure utilities to
  high-pressure process service in six steps, and naming each class by its pressure keeps it
  self-explanatory and independent of any published rating.
- `SW-PIPE-6` Size series (nominal inches): 1/4, 3/8, 1/2, 3/4, 1, 1-1/4, 1-1/2, 2, 2-1/2, 3,
  4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 24, 30, 36, 42, 48. Reason: steps of about a third up
  to 6 in, then 2 to 6 in steps, so that each size carries roughly 1.5 to 2 times the flow of
  the one below; these are names, and in SmartWeld pipe the outside diameter equals the name.
- `SW-PIPE-2` Outside diameter OD = NPS for every class. Reason: one outside envelope per size
  lets fittings, supports, clamps and insulation be shared across classes; the bore varies.
- `SW-PIPE-3` Wall thickness t = roundup( max( P·OD / (2 S) + CA, OD/40 + 1/16 in ), 1/32 in )
  with S = F_y / 2 = 17,500 psi for "Grade 35 pipe" (drawing, SW-MAT-1) and corrosion
  allowance CA = 1/16 in. Reason: thin-wall hoop stress (Barlow) with a factor of 2 on yield,
  plus metal to lose to corrosion; the second term is the thinnest wall that can be handled,
  bevelled and welded without distortion.
- `SW-PIPE-4` Bore D = OD − 2 t. All in-line components of a class share this bore (full port).
- `SW-PIPE-5` Pipe weight from the drawn ring (K-1).

## 30. Flanges, gaskets and bolting (`SW-FLG-*`)

- `SW-FLG-1` Weld-neck flange `FLG{NPS}-{class}`: a ring with a raised face 1/16 in high on
  the gasket side and a tapered hub on the pipe side, bore = pipe bore. Reason: the hub
  carries the bending from the bolts into the pipe wall without a stress jump.
- `SW-FLG-2` Gasket: compressed-sheet ring 1/8 in thick, inside diameter = bore + 1/8 in,
  width w_g = roundup( max(1/2 in, OD/12), 1/8 in ), mean diameter G = ID + w_g. Seating
  stress y = 2,000 psi; pressure-retention factor m = 2. Reason: a soft sheet gasket flows
  into the face finish at about 2,000 psi; to stay tight it must be kept compressed to
  about twice the fluid pressure; the width grows with size so the seated area grows with the
  pressure end-force.
- `SW-FLG-3` Bolt load: W = max( W_seat, W_op ) with W_seat = π G w_g y and
  W_op = (π/4) G² P + π G w_g m P. Reason: equilibrium of the joint at seating and in service.
- `SW-FLG-4` Bolting: stud diameter d from the series 1/2 in to 4 in by 1/8 in; allowable
  stud stress = F_u / 3 on the nominal area (bolts "Grade 90", drawing); for each d the count
  n is the smallest multiple of 4 with n (π/4) d² F_u/3 ≥ W; bolt circle BC = max( RF OD + d
  + 1/4 in, 3 d n / π ), where the raised face OD = G + w_g + 1/8 in (the circle grows when
  the studs would otherwise crowd); n is then raised in fours until the pitch π BC / n ≤ 5 d;
  flange OD = BC + 3 d (edge distance 1.5 d, SW-B-9). The stud size is the smallest d whose
  count does not exceed n_max = max(4, 4 ⌈S / 4⌉), one stud per inch of joint size S rounded
  up to fours, where S is the larger of NPS and the bore of the joint (body and bonnet joints
  seal a cavity larger than the pipe) (if none does, the d giving the smallest
  flange OD). Reason for n_max: a joint is tightened by hand in a star pattern; beyond about
  one stud per inch of nominal size the extra studs only add assembly time, and many small
  studs on a large flange twist off before they stretch, so the stud is made larger instead.
  (Amended on user review: the smallest-OD choice put two dozen 1/2 in studs on 12 in
  flanges.) Reason: a third of the tensile strength leaves
  margin for preload scatter and cyclic load; a multiple of four keeps the pattern symmetric
  about both axes; pitch ≥ 3 d clears the nuts, ≤ 5 d keeps the gasket evenly loaded between
  bolts; 1/4 in clears a socket from the raised face. (Amended while extending to the P1200–P4800 classes: with the bolt
  circle pinned to the raised face no stud size could hold the required count at 3 d pitch.)
- `SW-FLG-5` Thickness: the ring carries the bolt load as a moment about the hub with arm
  a = (BC − G)/2. The load used is the bolting's preload capacity W_b = 1.5 n (π/4) d² F_u/3,
  not the design load W, because a fitter tightens the studs to what they will take, not to
  the calculated minimum. Per unit length of the gasket circle m_b = W_b a / (π G); plate
  bending gives t_f = roundup( max( √(6 m_b / (0.6 F_y)), d + 1/4 in ), 1/8 in ) with
  F_y = 36,000 psi ("Grade 36 forging", drawing). Reason: bending of the ring section under
  the preload the studs can actually deliver; 0.6 F_y is a 1.67 factor on yield for a pressure
  part; a flange thinner than the stud diameter plus 1/4 in cannot seat the nut properly.
  (Amended on user review of stage 4: the design-load basis gave flanges visibly too thin.)
- `SW-FLG-6` Hub: wall 2 t_pipe at the back of the flange tapering to t_pipe over a length
  1.5 t_f; a straight neck of 1 in to the weld bevel; weld-end bevel per SW-WD-4. Reason: the
  taper spreads the flange moment into the pipe.
- `SW-FLG-7` Studs: length = 2 t_f + gasket + 2 nut heights (SW-B-3) + 2 × d/4 stick-out,
  rounded up to 1/4 in; heavy hex nuts both ends; no washers. Reason: studs can be fitted
  from either side and replaced in place.
- `SW-FLG-8` Blind flange: same ring, no bore, thickness roundup( max( t_f, (G/2) √(1.24 P /
  (0.6 F_y)) ), 1/8 in ). Reason: a flat circular plate loaded by pressure over the gasket
  circle; 1.24 is the simply-supported plate coefficient 3(3 + ν)/8 with ν = 0.3.
- `SW-FLG-9` Flange weight from the drawn solid (K-1). Gasket is non-steel.

## 31. Valves — common rules (`SW-VLV-*`)

Valves are designed as a manufacturer designs them: from the bore, the pressure, the forces
on the closure member and the effort a person can apply. Every internal is a real part.

- `SW-VLV-1` Identification: `{TYPE}{NPS}-{class}` with TYPE one of `GATE`, `GLOBE`, `CHECK`,
  `BALL`, `BFLY`. Bore D = the pipe bore of the class (full port). Ends: integral flanges with
  the SW-FLG pattern of the size and class (BFLY is a wafer body between pipe flanges).
- `SW-VLV-2` Body wall: t_b = roundup( max( 1/4 in + D/50, P D_c / (2 S_c) + 1/8 in ), 1/16 in ) with
  S_c = F_y / 2.5 = 14,400 psi ("Grade 36 casting", drawing) and D_c the body cavity diameter.
  Reason: hoop stress with a larger factor for a casting (porosity, surface defects) plus a
  casting allowance; the minimum grows with size (1/4 in + D/50) because molten metal must run
  further through a larger mould before it freezes, so large castings cannot be poured as thin
  as small ones. (Amended with the form rules below.)
- `SW-VLV-3` Materials (drawing): body, bonnet, wedge/disc of Grade 36 casting; stems and
  seats of "Grade 60 bar" (F_y = 60 ksi); packing and soft seats "polymer" (non-steel); gaskets
  as SW-FLG-2.
- `SW-VLV-4` Operability: the rim pull on a handwheel must not exceed 80 lbf (two hands on
  the rim) and the force at the end of a lever must not exceed 50 lbf (one hand). Handwheel
  diameter D_hw = roundup( 2 T / 80 lbf, 2 in ), minimum 6 in, maximum 30 in; lever length
  L = roundup( T / 50 lbf, 2 in ), minimum 6 in, maximum 24 in. If the limit is exceeded a
  gear operator is fitted: ratio = the smallest whole number with input torque ≤ 80 lbf ×
  6 in on a 12 in handwheel. Reason: a person leans into a wheel with both hands but pulls a
  lever with one; larger wheels do not fit; beyond that, gears. (Amended on user review of
  stage 4: a one-hand limit made wheels oversized.)
  Gear input handwheel: 8 in when the output torque is at most 10,000 lb·in, 12 in up to
  50,000 lb·in, 18 in above; the ratio is the smallest whole number keeping the rim pull at
  or below 80 lbf on that wheel. Reason: a gearbox grows with the torque it carries, and a small
  gearbox cannot carry a large wheel; the ratio, not the wheel, absorbs the effort. (Amended on
  user review: a 12 in wheel on every gearbox dwarfed small valves.)
  Lever form: a flat handle tapering from 1.2 × to 0.8 × its root width with a rounded end, a
  polymer grip sleeve over the last 4 in of the bar, a boss on the stem; on butterfly valves a
  spring latch at the root engaging a toothed notch plate (ten teeth over the quarter turn); on
  plug valves the handle carries a square socket that fits over the plug head. Reason: a lever
  is a stamped or forged handle shaped to the hand; the notch plate holds the disc at a set
  opening; the socket transmits the torque to the square head.
  Gear operator form: a mounting spool, a round gear housing of radius max(3 in, 2.5 d_s) and
  height max(3 in, 1.6 d_s + 1 in) with a rounded top edge, a worm tube of radius 0.35 × the
  housing radius whose axis is horizontal and offset 0.7 × the housing radius (tangent to the
  wheel), bearing caps at both ends, the input shaft and the 12 in handwheel on one end, and a
  position indicator on top of quarter-turn units. Reason: a worm gear is how a slow,
  self-locking quarter turn or a high-torque multi-turn drive is obtained by hand; the housing
  is round because the wheel inside it is. (Amended on user review: a plain box was not a
  gearbox.)
- `SW-VLV-5` Rising stems (gate, globe): thrust F from the type rule; stem diameter
  d_s = roundup( max( √(4 F / (π · 0.25 F_y,stem)), D/8, 1/2 in ), 1/16 in ). Thread: a power
  thread with pitch p = d_s / 5 and depth 0.3 p; stem nut height 1.5 d_s. Operating torque
  T = F (d_s / 2) tan(λ + φ) + F μ_c (d_s / 2), with lead angle λ = atan(p / (π d_s)), thread
  friction φ = atan 0.15, collar friction μ_c = 0.02 (the stem nut runs on a ball thrust
  bearing in the yoke). Reason: the stem is a column under the closing thrust, so 1/4 of
  yield on area covers buckling of the exposed length; D/8 keeps the stem stiff against
  bending from the wedge; a coarse power thread makes few turns per inch of travel; the
  torque is the screw-jack formula with lubricated-steel thread friction and a rolling
  thrust bearing, which is how an outside-screw yoke is built so the wheel can be turned.
- `SW-VLV-6` Stuffing box: packing ring section s = roundup( max(1/4 in, d_s / 8), 1/16 in ),
  four rings, box bore d_s + 2 s, gland follower s deep with two gland studs of diameter
  max(3/8 in, s) (SW-B-*); packing friction adds 15 % to the stem thrust. Reason: square
  braided packing seals by radial expansion under the gland; four rings share the pressure drop.
- `SW-VLV-7` Bonnet: a cover of the body-wall thickness, dished or flat, bolted by SW-FLG-3/4
  applied to the bonnet gasket (gasket per SW-FLG-2 on the bonnet opening) with hex bolts,
  head on the cover and nut under the body flange, stick-out d/4; the bonnet flange runs into
  the neck through a fillet of radius t_b. Reason: hex bolts are what a bonnet is assembled
  with in the shop; a cast flange always has a fillet to its neck. (Amended on user review:
  double-nut studs with long stick-outs looked wrong.)
- `SW-VLV-8` Handwheel: rim of round section min(1-1/2 in, 0.06 D_hw + 1/4 in), dished so
  the hub sits 0.12 D_hw below the rim plane, 4 curved spokes (6 above 16 in) of 0.6 × rim
  section, hub 1.5 d_s long; D_hw is also not less than 3 in more than the diameter of any
  part within 3 in below the rim plane. Reason: a dished wheel keeps the knuckles clear of
  the bonnet and gives a better grip; a wheel smaller than the bonnet under it traps fingers.
  (Amended on user review.) stem nut captive in the hub (gate, globe) or the wheel
  keyed to the stem (gear input). Reason: a rim thick enough to grip; spokes carry the rim pull.
- `SW-VLV-9` Face-to-face is derived: F2F = 2 t_f + 2 h_hub + w_body, with h_hub = 1.5 t_f + 1 in
  (SW-FLG-6) and w_body the cavity width of the type rule. Reason: the length is what the
  internals need, not a tabulated figure.
- `SW-VLV-10` Weight: steel parts from the drawn solids (K-1); packing, gaskets and polymer
  seats are non-steel and listed without weight.

## 32. Valve types

Each type is a distinct design with its own proportions and operator. Shared rules:
SW-VLV-2 (walls), SW-VLV-4 (operability), SW-VLV-5/6 (stems, packing), SW-VLV-7 (bonnets),
SW-VLV-8 (handwheels), SW-VLV-9 (face-to-face from the internals).

- `SW-VLV-11` Offering (sizes and classes each type is built in), from the series of SW-PIPE-6
  and SW-PIPE-1. A general limit for every type with a closure member loaded by the full
  pressure end-force: the bore is limited so that P D² ≤ 1,800,000 lb (a stem thrust or seat
  load near a million pounds is the most a stem, yoke and seats can carry), i.e. D ≤
  √(1,800,000 / P), rounded down to the size series. Type ranges and their reasons are given
  with each type. Reason: a catalogue offers what can be made to work, not every combination.

Gate (`SW-VLV-G-*`), solid wedge, outside-screw rising stem with yoke. Sizes 1/2–48, all
classes within SW-VLV-11 (the general-purpose isolation valve).

- `G-1` Wedge: included angle 10° (5° per face), width across the seats 1.3 D, thickness at
  the seat line 0.25 D, seat faces 0.1 D wide (minimum 1/4 in) matched by seat rings of the
  same width pressed into the body. Reason: a 5° face is self-locking enough to hold tight
  shut-off yet releases with modest stem pull; 1.3 D covers the seat ring; 0.25 D resists the
  differential pressure as a plate with margin.
- `G-2` Stroke = 1.05 D (the wedge clears the bore when open). Cavity: run bore D through the
  body; wedge chamber of width w_body = D + 2 t_b across the run, extending 0.1 D below the
  bore; bonnet neck bore 1.35 D. Reason: the chamber is as wide as the bore so the wedge can
  tilt onto its seats, the seat rings can be pressed in through the ends and the casting walls
  can be cored. (Amended on user review of stage 4 from 0.45 D + 1/2 in, which gave a body
  too short for its wheel.)
- `G-3` Thrust F = P (π/4) D² (μ + tan 5°) × 1.15 + 0.25 P (π/4) D² with seat friction
  μ = 0.3. Reason: the wedge must be dragged across the downstream seat under full
  differential pressure, 15 % for packing (SW-VLV-6), and the operator wedges the gate tight
  with an extra quarter of the pressure end-force.
- `G-4` Yoke: a cast frame of two tapered arms, 0.25 D wide at the bonnet flange narrowing
  to 0.12 D at the top, 0.8 t_b thick (minimum 3/8 in), joined by a round boss of diameter
  3 d_s housing the stem nut at height = stroke + stuffing box + 2 in above the bonnet; the
  bonnet above the flange is a dome tapering to the stuffing box. Reason: the stem nut must
  clear the fully risen stem; a cast yoke tapers because the bending moment is largest at its
  root. (Amended on user review from rectangular bar arms.)

Knife gate (`SW-VLV-K-*`), lugged wafer body, flat plate gate. Sizes 2–36, class P150 only
(the thin plate and the transverse packing cannot hold more).

- `K-1` Body: a lugged ring of the pipe-flange pattern (bolted through by the line studs),
  width w = 0.12 D + 1 in (minimum 1-1/2 in), with a rectangular gate housing above the bore
  of the same width and 1.3 D wide, topped by a transverse packing box 4 s deep (SW-VLV-6)
  with a bolted gland. Gate plate thickness max(1/4 in, 0.03 D), width 1.3 D, with a rounded
  bottom edge of radius 0.52 D concentric with the bore (bevelled to a knife edge); stroke D + 0.05 D.
  The body is one casting (F-0 blends): the lugged ring, of the pipe flange's OD and drilled on
  its bolt circle, rises into a gate chest of the body width and 2 (0.65 D + t_b) across, which
  carries the packing box and ends in a flat top flange b_l + 1/2 in wider each side than the
  chest; a gland plate is drawn down onto the packing by two short studs in the top flange.
  Yoke: two straight, parallel legs of flat bar b_l = max(1 in, 0.15 D) × the body width,
  bolted to the top flange (two bolts each), joined at the top by a yoke plate carrying the
  stem-nut boss; the stem rises through the handwheel. Reason: a plate gate needs no cavity,
  which is why the body is thin and why slurries pass; the plate is sealed where it leaves the
  body, not in a bonnet; straight legs carry the stem thrust as columns. (Amended on user
  review from tapered splayed arms and box-built housing, P-48.)
- `K-2` Thrust F = P (π/4) D² × 0.3 × 1.2 (plate dragged over the seat, 20 % for the
  transverse packing); stem and handwheel by SW-VLV-5/8 on a two-bar yoke.

Globe, T-pattern (`SW-VLV-GL-*`), plug disc, inside-screw rising stem. Sizes 1/2–12, all
classes within SW-VLV-11 (above 12 in the thrust and the pressure drop make a globe
impractical and a gate or butterfly is used).

- `GL-1` Seat ring OD 1.2 D in a horizontal partition of thickness t_b; disc diameter 1.2 D
  with a 30° conical plug face; lift h = D/4 (the curtain area π D h equals the bore area at
  full lift). Reason: full flow at quarter-bore lift; a conical plug seats on a line.
- `GL-2` Cavity width w_body = 1.5 D (the S-passage needs space for the flow to turn twice).
  Thrust F = P (π/4) (1.2 D)² × 1.15 (closing against pressure under the disc).

Globe, Y-pattern (`SW-VLV-GY-*`). Sizes 1/2–16, all classes within SW-VLV-11.

- `GY-1` As GL-1/2 but the stem axis is inclined 45° toward the inlet and the seat lies in the
  run, so the flow path is nearly straight; cavity width along the run 1.5 D; bonnet, stuffing
  box and handwheel on the inclined axis. Reason: a straight-through seat gives the low
  pressure drop and self-draining line that a T-pattern cannot; the 45° stem keeps the
  handwheel reachable.

Angle globe (`SW-VLV-GA-*`). Sizes 1/2–12, all classes within SW-VLV-11.

- `GA-1` Inlet on the run axis, outlet turned 90° downward, stem vertical on the outlet axis;
  seat ring (1.2 D) horizontal at the mouth of the outlet; chamber a vertical cylinder of
  diameter 1.5 D; centre-to-face = t_f + h_hub + 0.75 D for both ends. Reason: the valve
  replaces an elbow and the flow turns only once.

Swing check (`SW-VLV-C-*`). Sizes 2–48, all classes within SW-VLV-11.

- `C-1` Body as the globe (w_body = 1.2 D); disc 1.2 D in diameter, thickness 0.15 D, hung on a
  hinge pin of diameter max(3/8 in, 0.1 D) through a hinge arm; seat ring 1.2 D OD; a bolted
  top cover (SW-VLV-7) for access; disc swings open to 70°. Reason: gravity and reverse flow
  close the disc; the cover is the only way to service it.

Lift (piston) check (`SW-VLV-CL-*`). Sizes 1/2–6, all classes (a free piston in a guide is
simple and tight in small bores; above 6 in its weight slams).

- `CL-1` Globe body (GL-2 cavity) with the seat ring in the partition; a piston disc 1.2 D in
  diameter and 0.3 D long guided in a dashpot cylinder of bore 1.2 D + 1/32 in hanging from a
  bolted cap (SW-VLV-7) with a domed top. Reason: the dashpot damps the closing stroke.

Dual-plate wafer check: withdrawn from the catalogue by SmartWeld on review (P-49); rules
CD-* retired. The swing check (C-*) and lift check (CL-*) remain.

Ball, floating (`SW-VLV-B-*`). Sizes 1/2–6, classes up to P600 (the whole pressure end-force
bears on the downstream polymer seat; above this it would extrude).

- `B-1` Ball diameter 1.5 D with a through bore D; two polymer seat rings of section 0.1 D ×
  0.1 D at mean diameter 1.2 D. Two-piece body: a centre body that is a thick cylinder along
  the flow axis around a cavity 1.5 D + 2 × 0.1 D, of outside diameter D_b = BC_j + 2.5 d_j
  where BC_j and d_j are the joint bolting of SW-FLG-3/4 applied to a gasket on the cavity
  bore, with 10 % chamfers on its outer edges; the inlet end integral (a solid collar of the
  adapter flange thickness tapering to the pipe neck); the outlet end a one-piece bolted
  adapter — a flange of diameter D_b clamped to the body face by studs tapped 1.5 d_j into the
  body (nut on the adapter, stick-out d_j/4), then a curved taper, 0.45 × its radial drop long,
  from just inside the nut circle down to a neck of radius D/2 + 2 t_b, then the pipe end
  flange (SW-FLG). Reason: the ball must cover the seat with margin in every position; the
  seats carry the ball against the downstream seat; studding the joint into the body wall
  keeps the joint diameter equal to the body, and the adapter tapers because the bolt load
  must be carried into the much smaller pipe neck. (Made self-contained when BT-* was
  withdrawn, P-49; the construction is unchanged.)
- `B-2` Torque T = P (π/4) (1.2 D)² μ_s (0.75 D) × 1.2 with seat friction μ_s = 0.1 on polymer,
  20 % for the stem seal. Stem diameter d_s = roundup( max( (16 T / (π · 0.3 F_y,stem))^(1/3),
  3/8 in ), 1/16 in ) (shear in torsion), with a square drive and a blow-out shoulder. Lever or
  gear per SW-VLV-4; lever of flat bar 0.25 D × 1/4 in minimum 1 in × 1/4 in with a 90° stop.

Ball, trunnion-mounted: withdrawn from the catalogue by SmartWeld on review (P-49); rules
BT-* retired. Ball valves are the floating ball (B-*), sizes 1/2–6; larger quarter-turn
isolation is by the butterfly valves.

Butterfly, wafer, resilient seat (`SW-VLV-BF-*`). Sizes 2–24, classes up to P300 (the
polymer liner is the seat and the body is clamped, not bolted).

- `BF-1` Wafer body width 0.3 D + 1 in, outside diameter = BC − d − 1/4 in of the flange it
  sits between (centred by the flange studs); liner 1/8 in polymer; disc diameter D (seals in
  the liner), lens section 0.15 D thick at the shaft and 0.05 D at the edge; shaft diameter
  max(1/2 in, 0.12 D) through the disc. Torque T = 0.014 P D³: the hydrodynamic torque of a
  disc at mid-opening, about 0.1 of the pressure end-force acting at D/8 from the shaft
  (0.0098 P D³), plus the friction of the disc edge in the liner, whose seal pressure must
  exceed P (0.004 P D³); lever or gear per SW-VLV-4.

Butterfly, lugged (`SW-VLV-BL-*`). Sizes 2–24, classes up to P300.

- `BL-1` As BF-1 with threaded lugs: n bosses of diameter 2 d at the bolt circle, the full
  body width, each tapped for the line stud. Reason: the valve can be bolted to one flange
  alone, so the downstream line can be removed with the valve in service as a dead-end.

Butterfly, double-flanged, double-offset, metal seat (`SW-VLV-BD-*`). Sizes 3–48, classes
up to P1200.

- `BD-1` Body with its own two flanges (SW-FLG pattern), face-to-face 0.5 D + 2 t_f; shaft
  axis offset 0.1 D behind the disc plane and 0.05 D off the bore centreline; disc 0.1 D thick
  with a machined edge seating on a metal seat ring; shaft max(5/8 in, 0.14 D) in a top neck
  with a stuffing box and a bottom bearing cover. Torque T = 0.03 P D³ (metal seating needs
  interference). Gear operator for D ≥ 8 in or by SW-VLV-4. Reason: the double offset lifts the
  disc off the seat in the first degrees of opening, so the seat does not rub and can be
  metal, which is what allows the higher classes.

Plug, lubricated taper plug (`SW-VLV-PL-*`). Sizes 1/2–12, classes up to P600.

- `PL-1` Body a block w = 1.6 D + 2 t_b wide, F2F by SW-VLV-9 with w_body = 1.6 D + 2 t_b,
  height from 0.9 D below the bore to a top gland; plug a cone frustum of mean diameter 1.3 D,
  height 1.8 D and 5° half-angle, with a square wrench head; a bolted gland cover with four
  studs; a lubricant screw fitting on the cover. Shown closed (port across the run; the port
  is a slot 0.8 D wide, not cut in this stage). Torque T = P (π/4) D² μ (0.65 D) with
  μ = 0.1 (the plug turns on its lubricant film; the gland, not the operator, seats the
  taper). Wrench lever or gear per SW-VLV-4. (Amended on user review: a 4 in plug valve is
  turned with a wrench, which the earlier μ = 0.2 × 1.5 denied.)
  Reason: a taper plug seats by its own wedging and seals on a lubricant film; the gland
  presses the plug home.

Diaphragm, weir type (`SW-VLV-DI-*`). Sizes 1/2–12, classes up to P300 (the diaphragm is
the pressure boundary).

- `DI-1` Body: run bore D with a weir rising 0.6 D at mid-length; the body rises above the
  run so that the underside of its square (bolting) flange stands 1/4 in above the rim of the
  round end flanges, i.e. its flange face at OD_end/2 + 1/4 in + the body flange thickness
  above the pipe axis (amended on user review twice: from 0.3 D, then from D/2 + t_b + 0.25 D,
  P-49, P-50: the square body and bonnet flanges must stand clear above the round end
  flanges); a round top opening of
  diameter 1.6 D with a flat bolting flange; diaphragm a polymer disc 1.6 D + 2 t_f in diameter
  and max(1/8 in, 0.03 D) thick, clamped by the bonnet flange with studs per SW-FLG-3/4 on the
  opening; bonnet a rounded dome of the flange diameter and height 0.45 × its diameter with
  a flat top boss, housing a compressor (a weir-shaped shoe) on a non-rising spindle;
  handwheel by SW-VLV-8 (so at least 3 in wider than the dome) rising with the spindle sleeve. Thrust F = P (π/4)(1.6 D)² × 0.5 (the
  diaphragm carries half its area to the weir), torque by SW-VLV-5 with a stem of diameter
  by SW-VLV-5. Reason: no packing and no cavity: the only wetted parts are body and
  diaphragm, which is why it is used for corrosive and clean services.

Needle (`SW-VLV-NE-*`). Sizes 1/4–1, all classes (small bore, bar-stock body).

- `NE-1` Body from hexagonal bar of width across flats 2 D + 3/4 in and length 3 D + 2 in
  with threaded female ports (modeled as plain bores with a counterbore 1.2 D for the thread),
  a round threaded bonnet of diameter 1.5 D + 1/2 in with a packing nut, stem of diameter
  max(1/4 in, 0.4 D) with a 30° needle tip and a fine thread of pitch d_s / 10, and a T-bar
  handle of length 3 D + 2 in. Thrust F = P (π/4) D² × 1.5; the T-bar is the operator (force
  at the bar end ≤ 25 lbf, one hand on a small valve). Reason: fine control of small flows
  needs a fine thread and a long tapered tip.

Pressure safety valve, spring-loaded (`SW-VLV-PSV-*`). Inlet sizes 1–8, all classes; set
pressure = the class pressure (drawing).

- `PSV-1` Angle body: inlet flange below (size NPS), outlet flange on the side of the next
  size up in the series, in class P150 (the outlet sees only the flare system's back-pressure,
  not the vessel's pressure; amended in stage 5); a nozzle ring inside the inlet with a flat seat of diameter 0.8 D;
  disc and disc holder on a spindle of diameter max(3/8 in, 0.2 D); a spring housing (bonnet)
  of bore D_m + d_w + 1/4 in with a bolted flange (SW-FLG-3/4 on the housing gasket); an
  adjusting screw with lock nut under a screwed cap; a lifting lever on the cap. Spring:
  seat force F = P_set (π/4)(0.8 D)²; wire diameter d_w = √(52 F / (π τ)) with τ = 90,000 psi
  (half the strength of "Grade 180 spring wire", drawing) at spring index 5 (mean coil
  diameter D_m = 5 d_w; the 52 is 8 × index × a curvature factor of 1.3), 6 active coils
  plus 2 closed, pitch 2.5 d_w. (Amended on user review: index 6 on a softer wire made
  springs too fat for their housings.) Reason: the spring must
  hold the disc shut at the set pressure and lift fully by 10 % over it; index 6 is a coil
  that winds without excessive stress at the inside of the coil.

Control valve, cage-guided globe with pneumatic diaphragm actuator (`SW-VLV-CV-*`). Sizes
1/2–12, all classes within SW-VLV-11.

- `CV-1` Body as the T-pattern globe (GL-1/2) with a cage (cylinder of bore 1.2 D and wall
  0.1 D between the seat ring and the bonnet; its flow windows are not cut in this stage) and
  a plug of diameter 1.2 D guided in it; a bonnet with an extended stuffing box (SW-VLV-6, six
  rings) and a cast yoke of two tapered legs to the actuator. Actuator: diaphragm case of two
  shallow dished halves, each 0.12 D_a deep, bolted at the rim with 3/8 in bolts at 3 in
  pitch, of diameter D_a = roundup(√(4 F_a / (π · 30 psi)), 2 in) where F_a = P (π/4)(1.2 D)²
  + 100 lb/in × π (1.2 D) (unbalanced plug plus seat load), on a 30 psi air supply
  (drawing); a range spring inside the lower case: wire by the PSV-1 stress rule for F_a at
  index 6, active coils by the coil-spring deflection formula (with
  D_m = 5 d_w, shear modulus G = E / (2 (1 + ν)) from K-2 and K-3), minimum 2, plus 2 closed
  coils, pitch d_w + 1.2 δ/n, for the travel δ = D/4 (with D_m = 5 d_w the coil count is
  n = δ G d_w / (1000 F_a)); the spring sits in a spring barrel of diameter D_m + 2 d_w + 1 in
  under the lower case, which is as long as the spring plus 1 in
  and joins the yoke; a stem connector and a travel scale on the yoke; a positioner box on
  the yoke side. (Amended on user review: a deep case is not how an actuator is built; the
  spring lives in a barrel.) Reason: the actuator must close the plug against the full pressure with the
  supply air available; the spring returns it on air failure.

## 32A. Valve form (`SW-VLV-F-*`)

Basis (PROVENANCE P-39): the generic form that every valve of a type shares — the
arrangement of body, bonnet, yoke, cover and operator that any engineer would describe for
that type — is common engineering knowledge and is drawn as such. No specific product's
design, styling, catalogue drawing or dimension is used; every size still comes from the
rules of sections 29–32.

- `F-0` Cast parts (bodies, bonnets, yokes, covers, adapters) are modeled as smooth blends of
  simple solids with blend radius max(t_b, 0.06 D), hollowed by their internal passages, so
  section views show the real wall. They are meshed by the SmartWeld polygoniser
  (`src/geometry/sdf.ts`) at a cell no larger than half the body wall where the cell cap
  allows; vertices are snapped onto the true surface and carry its exact normal; free edges
  of cast flanges and yoke arms are rounded by min(0.3 in, 0.3 × the part thickness) because a
  casting has no sharp edges; tessellation does not change the geometry rules. Machined parts (flanges with bolt
  holes, stems, seats, balls, discs, bolts) are modeled exactly.
- `F-1` Bolted joints of castings (bonnets, covers, end connectors) are drawn with the head on
  the cover side and the nut on the body side; the part of the shank inside the flanges is
  not drawn (no overlap of solids); holes in cast joint flanges are not cut.
- `F-2` Gate: run tube with hubs to the end flanges; above and below the run, a chamber of
  elliptic section, long across the flow (inner semi-axes 0.7 D across, 0.3 D along the
  flow), rising 0.6 D above the bore to an oval body–bonnet flange whose bolts lie on an
  ellipse 1.25 d + t_b outside the chamber; rounded bottom 0.15 D below the bore. Bonnet: oval
  flange, then a body tapering to the round stuffing box over max(0.75 D, the wedge travel
  above the body chamber), and a cast yoke integral with the bonnet (G-4). Gland: a flat
  gland flange of stadium outline with two swing bolts. Reason: the wedge is wide across the
  flow and thin along it, so the chamber is oval; the yoke is cast with the bonnet so the
  stem nut is held true to the stem.
- `F-3` Globe (T-pattern) and control-valve body: run tubes into a spherical bulb of radius
  0.85 D + t_b; an S-shaped partition (horizontal plate with the seat opening, a wall rising
  from it on the inlet side and a wall falling from it on the outlet side); a round neck to
  the bonnet flange; bonnet and yoke as F-2 with round flanges. Reason: the flow must turn
  under the partition, up through the seat and out over it, and a sphere is the casting that
  encloses that path with the least metal.
- `F-4` Y-globe: the F-3 bulb with the neck, bonnet, yoke and seat plate inclined 45° toward the
  inlet; the seat plate is perpendicular to the stem. Angle globe: bulb with the inlet on the
  run axis and the outlet straight down, seat at the mouth of the outlet; no partition.
- `F-5` Swing check: run tubes into a chamber of elliptic section long along the flow (inner
  semi-axes 0.62 D across, 0.75 D along) with a rounded bottom, rising to a round bolted cover
  that is a flat plate with a raised centre; hinge-pin bosses on both sides of the chamber.
  Lift check: the F-3 bulb and partition closed by a small domed cap. No operator. Reason: the
  disc must swing clear into the chamber, which therefore extends along the flow.
- `F-6` Floating ball: a cast body that is a sphere of radius (0.85 D + t_b) around the ball
  cavity, blended into the integral inlet end and into a joint collar of diameter D_b
  (B-1) on the outlet side; a bolted end connector (flange of diameter D_b and a neck
  tapering to the pipe flange) studded into the collar; a flat top pad with the stem and a
  flat-bar lever with a stop.
- `F-7` Butterfly (wafer, lug): a ring body with a cylindrical neck rising max(2-1/2 in,
  0.25 D) above the ring to a square top plate (side 2.6 × the neck radius) that carries the
  lever and notch plate or the gearbox, and a short bottom boss; the wafer body has four
  locating ears with clearance holes at four of the line studs; the lugged body has bosses of
  diameter 2 d at every line stud, drilled through. Double-offset: the same neck and boss on a body between
  two integral flanges. Reason: the neck lifts the operator clear of pipe insulation.
- `F-8` Plug: a cast body that is a rounded square prism (superellipse exponent 4) around the
  taper, blended into the run tubes, closed by a round gland cover; square wrench head and a
  wrench lever. Diaphragm: run tubes into a rounded square body with a low weir across the
  bore, a square body flange and a square bonnet flange with bolts (DI-1) clamping the
  diaphragm. The body flares smoothly from each end-flange hub into the body (a cone from the
  hub to 0.75 of the body half-width, blended), so no bare run tube shows. The bonnet rises
  from its square flange as the intersection of a square prism (tapering to 0.8 of the
  flange half-side) and a cone, so it is square at the base and round above, to a round
  spindle neck of radius max(1.2 d_s + 1/2 in, 0.3 × the flange half-side); bonnet height
  0.8 × the flange half-side + the neck. Reason: the diaphragm and its compressor are
  rectangular in plan where they meet the weir; above them only the spindle needs housing.
  (Amended on user review from a low dome on dumbbell run tubes, P-48.)
- `F-9` Safety valve: a cast angle body that blends the inlet neck (from below), a bowl around
  the nozzle and the outlet neck (to the side); a bonnet that tapers from its bolted base
  flange to the cap; a screwed cap with a lifting lever of length max(4 in, 3 × the cap radius)
  pivoted on the cap and hanging 30° below horizontal. Control valve actuator: two dished
  cases of total height about 0.4 D_a, the spring force carried by a ring of six short springs
  inside the lower case (each designed by PSV-1 for F_a / 6), a cast yoke of two arms from the
  bonnet to the lower case, a positioner box on the yoke. Reason: a ring of short springs gives
  the actuator force within a shallow case. The springs stand on the case floor where it lies
  at their radius (0.25 D_a), so they stay inside the curved case.
- `F-10` Finishes (display only, not part of the ground truth): castings painted grey,
  handwheels and levers painted red, stems and seats bright metal, bolts dark, polymer black.

## 33. Tests required for stage 4

- Pipe wall meets Barlow with CA for every size and class; bore < OD.
- Flange: bolt count multiple of 4, pitch within 3 d..5 d, OD = BC + 3 d, thickness ≥ d + 1/4,
  stud length covers the stack; blind thickness ≥ flange thickness.
- Valves: rim pull or lever force ≤ 50 lbf (or a gear operator present); gate stroke ≥ D;
  globe lift = D/4; face-to-face = 2 t_f + 2 h_hub + w_body; stem diameter ≥ D/8; every solid
  closed with positive volume; steel weight from the drawn solids.
- Every stage-4 rule ID used in code exists in this file.

---

# Stage 5 — Piping and routing

Written before any stage-5 code. Pipe, flanges and valves are the SmartWeld parts of stage 4
(`SW-PIPE-*`, `SW-FLG-*`, `SW-VLV-*`). Every line is butt-welded steel pipe; flanged joints
occur only at equipment nozzles, valves and blinds. Small-bore socket-weld and threaded fittings
are not used (stated).

## 34. Fittings (`SW-FIT-*`)

All fittings match the outside diameter and wall of the pipe they join (SW-PIPE-2/3), so the
bore is continuous and every end is a butt-weld bevel.

- `SW-FIT-1` Elbow (90° and 45°): centreline bend radius R = (5/3) OD. Reason: when a pipe is bent,
  the outer fibre of the bend stretches by (OD/2)/R; limiting that to 30 % keeps the wall from
  thinning or cracking when the fitting is formed, which needs R ≥ OD/(2 × 0.3). This value was
  derived from that strain limit; I recognised that a different radius is common practice and
  deliberately did not use it (PROVENANCE P-43).
- `SW-FIT-2` Tee (equal or reducing outlet): run length 2 C and outlet height C from the run axis,
  with C = OD_run/2 + max(1 in, OD_run/3). Reason: the outlet needs the run's half diameter to clear
  the run, plus a straight length for the weld bevel and for the blend between branch and run.
- `SW-FIT-3` Reducer (concentric or eccentric): cone half-angle 12°, with a 1 in straight at each
  end; length H = (OD_large − OD_small) / (2 tan 12°) + 2 in. Eccentric reducers keep one side
  flat: flat on top in suction lines (no vapour pocket), flat on the bottom on the rack (pipe
  stays on its shoe). Reason: flow expanding through a cone wider than about 12° separates from
  the wall and loses energy.
- `SW-FIT-4` Cap: 2:1 ellipsoidal head (depth OD/4) plus a 1 in straight. Reason: as SW-EQ-1.
- `SW-FIT-5` Weight of every fitting from its drawn solid (K-1).

## 35. Equipment nozzles (`SW-NOZ-*`)

- `SW-NOZ-1` A nozzle is a pipe of the line's size and class welded into the shell and ending in a
  weld-neck flange (SW-FLG). The flange face stands S = flange OD / 2 + 3 in from the shell surface.
  Reason: the nuts behind the flange must clear the shell and 3 in of insulation.
- `SW-NOZ-2` Nozzle positions and services are the plant's drawing (`DEMO_NOZZLES`, basis
  `drawing`). Pump suction nozzles are axial at the casing end; pump discharge nozzles are on top of
  the casing.
- `SW-NOZ-3` Relief valves stand upright on top nozzles and need their own height plus 12 in below
  the roof steel; they are therefore fitted to the drum and the tanks, not to the tall vessels and
  the column, whose tops are within a valve's height of the roof (stated layout consequence).
- `SW-NOZ-4` A relief nozzle's standout is increased (by less than 6 in) above SW-NOZ-1 so the safety valve's
  outlet centreline lands on the 6 in routing grid (SW-RT-3). Reason: the flare line leaves the valve
  outlet horizontally; on the grid its first elbow and every later one stay exactly orthogonal.

## 36. Line list (`SW-LL-*`)

- `SW-LL-1` Line number: `{NPS}"-{class}-{service}-{sequence}`, e.g. `6"-P300-P-1001`. Services:
  P process, CWS / CWR cooling water supply and return, LS low-pressure steam, SC steam condensate,
  IA instrument air, PA plant air, N nitrogen, W process water, FL flare, V vent, D drain,
  I instrument connection, SP sample, HS hose station, RV relief valve inlet.
- `SW-LL-2` Classes: process lines and steam P300; all other services P150. Sizes are stated in the
  line list (drawing).
- `SW-LL-3` Valves on each line:
  - at every equipment nozzle: an isolation valve bolted to the nozzle flange — gate for NPS ≥ 2,
    floating ball below 2 (SW-VLV-11 permitting);
  - pump suction: gate valve; pump discharge: swing check valve then gate valve (check nearest the
    pump, so it can be isolated for service);
  - control valves (lines marked `cv` in the list): a control valve with a gate valve on each side,
    in a horizontal run at the destination end (no bypass, stated);
  - utility branches: a gate or ball valve at the header take-off;
  - vents, drains, instrument and sample connections: a ball valve on the nozzle, closed by a blind
    flange;
  - pump seal flush connections: no valve at the pump; the line bolts to the flush nozzle and is
    isolated at its header take-off. Reason: the pumps' baseplates stand 30 in apart, too close for a
    valve stack across the gap (a stated layout consequence, PROVENANCE P-45);
  - hose stations: a gate or ball valve at 42 in above the floor, closed by a blind flange (as every
    other closed end in the plant; amended from "cap", P-45);
  - relief valves: the safety valve (SW-VLV-PSV) bolted to its inlet nozzle; the outlet line runs to
    the flare header.
  Reason: every line must be isolable at the equipment for maintenance, and a pump's check valve
  stops reverse flow when it stops.
- `SW-LL-4` Branches from headers take off the top of the header with a tee (SW-FIT-2). Headers are
  capped at both ends (SW-FIT-4).
- `SW-LL-5` Valve orientation: a valve in a horizontal run has its stem up; if its drawn envelope (body,
  bonnet, stem, handwheel, lever, gear or actuator) would come within 3 in of steel, equipment other
  than the equipment it is bolted to, or another line, the stem is turned to the first horizontal
  direction across the flow that is clear; in a vertical run the stem is horizontal, first clear
  direction of +x, −x, +z, −z. Never stem-down (dirt settles in the bonnet). A control valve keeps its
  actuator up and a swing check its cover up in a horizontal run; if no direction is clear the line
  is a layout failure (the nozzle schedule is changed, not the valve). Reason: operators reach
  stems from above or the side, and every valve must be operable without striking anything.

## 37. Routing (`SW-RT-*`)

- `SW-RT-1` Lines run orthogonally (along x, y, z) with 90° long-radius elbows (SW-FIT-1). Lines
  between areas run on the pipe rack: process lines on the lower tier, utility and flare headers
  on the upper tier. Each line on the rack has its own lane across the rack width; lanes may be
  shared by lines whose lengths along the rack do not overlap. A process line's lane is the one
  nearest the rack centreline whose straight and whose two drops are clear; each end leaves the rack
  at the x nearest its equipment, or the nearest clear x within 3 ft of it (6 in steps).
- `SW-RT-2` Lane pitch: the centrelines of two adjacent lines are at least
  (D_1 + D_2)/2 + 3 in apart, where D is the larger of the line's OD and the OD of the largest flange
  on a valved take-off from it. Reason: room for insulation and for a hand between pipes, and between
  a branch flange and the next pipe.
- `SW-RT-3` Away from the rack, lines are routed on a 6 in grid by a shortest-path search whose
  cost is length plus 4 ft for every elbow. Cells are forbidden where they come within 3 in of
  equipment, steel, platforms, stairs, ladders, the building or another pipe; below 8 ft above
  the floor; and less than 7 ft above any platform, landing or stair tread within its plan area —
  in both cases except within 4 ft, in plan, of the line's own end points — the end stack's face,
  the first routed point beyond it, and the rack drop point — (so a riser can climb straight up from
  a pump or nozzle at grade). Clearance is measured surface to surface between drawn envelopes: pipe
  and fittings by their OD, flanges and gaskets by the flange OD, valves by the box of their drawn
  solids. Reason: 8 ft keeps walkway headroom
  (SW-LAY-4), 7 ft keeps a person upright on a platform, and the elbow penalty gives few,
  deliberate turns.
- `SW-RT-4` Two elbows are never welded back to back: their corners are at least 2 R + 2 in apart,
  leaving at least 2 in of straight pipe, and every cut piece of pipe is at least 2 in long (an elbow
  either welds straight to an end stack's weld-neck or stands 2 in or more off it). The first leg from
  a nozzle is at least as long as the valve stack bolted to it. Reason: two butt welds closer than
  about 2 in overlap their heat-affected zones and cannot each be inspected. (Amended from
  "at least 2 R of straight pipe", which was not what the routing grid does, P-45.)
- `SW-RT-5` Pipe is supplied in lengths of at most 40 ft; longer straight runs get a butt-weld
  splice. Splices on the rack are moved in 6 in steps to stand at least 14 in from every beam that
  carries a shoe. Reason: transport and handling length; a shoe is not welded over a girth weld.
- `SW-RT-6` Every routed line is checked for clashes against structure, equipment and every other
  line; a clash is a routing failure, not a drawing note.
- `SW-RT-7` The 2 ft above each rack tier, over the rack's length and width, is kept for lines running
  along the rack: other lines may enter it only within 4 ft, in plan, of their own end or drop points
  (handled like SW-RT-3 headroom). Reason: a line crossing the rack at lane height would block every
  lane it crosses; crossings go over the upper tier or between the tiers.

## 38. Pipe supports placed on lines (`SW-PS-7..12`)

`SW-PS-1..6` (stage 3) define the support parts. Placement:

- `SW-PS-7` (as stage 3) maximum span: 20 ft for OD ≥ 3.5 in, 15 ft for OD ≥ 2.375 in, 10 ft for
  smaller.
- `SW-PS-8` On the rack, every line rests on a shoe (SW-PS-1; its height is the gap from the beam top to
  the pipe bottom, 4 to 10 in as the line's grid elevation leaves it) at each tier beam it crosses;
  tees on a rack run stand C + 8 in clear of those beams so no shoe is displaced; lines
  needing spans under 20 ft also rest on intermediate beams (SW-RK-6). One anchor per rack run, at
  the bent nearest the middle of the run (SW-PS-3); guides (SW-PS-2) at the bents on either side of
  the anchor and at the bents next to where the line leaves the rack; plain shoes elsewhere.
  Reason: the anchor fixes the line so it expands both ways from the middle; guides keep it in its
  lane.
- `SW-RK-6` Intermediate rack beams: a channel spanning between the longitudinal struts at mid-bay
  on each tier, of the strut depth (SW-RK-3), lightest weight with a 1/4 in web (SW-SR-2 rule).
  Reason: small lines need support at shorter spans than the bent spacing.
- `SW-PS-9` Off the rack, horizontal runs get a support within each span limit: if the pipe bottom
  is at most 10 ft above the floor, a stanchion — a round HSS post of the next size below the pipe
  (minimum 2 in) from a 3/8 in base plate on the floor to a curved saddle under the pipe; above
  10 ft, a hanger — a rod from the steel or roof framing directly above, with a two-piece pipe
  clamp. Rod diameter: 3/8 in for OD ≤ 4.5 in, 1/2 in ≤ 8.5 in, 5/8 in ≤ 12.75 in, 3/4 in above.
  Rods hang only from horizontal steel (beams, struts, purlins, platform framing), never from
  equipment, columns, ladders, guardrails or grating; at most 20 ft long; the rod's path must be
  clear of other lines. Supports are stepped along the run, each at the equal division of the length
  that remains, moved in 6 in steps (or to the exact point under a member) to clear fittings and welds
  and find a floor path or steel above, never more than one span from the last.
  Reason: low pipes are carried from the floor, high ones from the structure, so nobody walks into
  a hanger rod.
  Amended (stage 9, plant 2): a stanchion base may stand on an equipment pad (6 in above grade)
  as well as on the slab; a line running over the rack's top tier within the rack's width stands
  on a short stanchion whose base plate sits on the top-tier beam at a bent where the pipe bottom
  is at most 4 ft above the beam (a post welded to the beam flange, as a shoe would be bolted); and
  a hanger may hang from a roof purlin directly above, or from a bridge angle spanning the two
  purlins either side when the nearest purlin is within 30 in in plan (the purlin is a cold-formed
  Z, SW-CF-*, a member like any other for this purpose; the bridge is not modeled, its rod is).
  Reason: the end bay and the rack top of plant 2 left runs with no floor path and no hot-rolled
  steel above.
- `SW-PS-10` Vertical runs longer than 10 ft get a trunnion (SW-PS-4) under their lowest elbow,
  standing on a stanchion base when that elbow is at most 10 ft up; otherwise they hang from the
  hanger nearest their top. (Plant 2: vertical runs longer than 6 ft, since its small-bore risers
  off the rack are short and still want a base under their bottom elbow; SW-COV-2.)
- `SW-PS-11` Small-bore stubs (vents, drains, instrument connections, sample points) shorter than
  4 ft are carried by their nozzle and need no support.
- `SW-PS-12` Shoes, guides and anchors are fillet-welded (SW-WD-1); stanchion bases are anchored
  with two 1/2 in rods into the slab (SW-AR-*).
- `SW-PS-13` Trapeze: where a line runs directly under another line so a single rod cannot pass, two
  rods (SW-PS-9 diameter) at a = OD/2 + 6 in either side of the pipe carry an `L2x2x1/4` under it.
  Reason: the rods pass either side of the line above with room to spare.

## 39. Pipe welds (`SW-PW-*`)

- `SW-PW-1` A complete-penetration butt weld (SW-WD-4, on the pipe wall) at every joint of pipe,
  fitting and weld-neck flange, and at each splice (SW-RT-5). Its cap is drawn as a ring standing
  1/16 in proud of the pipe surface, as wide as the groove at the surface.
- `SW-PW-2` Each weld is shop or field. Field welds: the weld joining a line to the rack run at
  each end, the closing weld nearest each nozzle (where the routed pipe meets each end stack), and
  the weld at a branch's tee outlet; all others are shop welds. The welds of a line are derived from
  its component chain: one at every joint where pipe, a fitting or a weld-neck hub meets another. Reason: a line is
  shop-fabricated in spools that can be shipped, and closed in the field where it meets steel or
  equipment whose position is only known on site.
- `SW-PW-3` Every weld carries an identifier, its line number, type (butt or fillet), size (wall
  thickness or fillet leg), the two components it joins, its position and its shop/field status.
  These records are the ground truth for stage 6.

## 40. Tests required for stage 5

- At least 200 lines; every line is continuous (each component's end meets the next one's start
  within 1/16 in, with matching size and class).
- Every butt joint carries exactly one weld record; every flanged joint carries a gasket and bolting.
- Every elbow has the radius of SW-FIT-1; straight lengths between elbows obey SW-RT-4.
- No two lines, and no line and the structure or equipment, come closer than SW-RT-3 clearance.
- Supports: no horizontal span exceeds SW-PS-7; every rack crossing carries a shoe, guide or anchor.
- Line list numbering follows SW-LL-1; every valve is offered (SW-VLV-11) in the line's size and
  class.
- Every stage-5 rule ID used in code exists in this file.
- Every valve's drawn envelope clears steel, equipment (other than its own) and other lines by 3 in
  (SW-LL-5); the committed plant piping data equals a fresh run of the generator.

# Stage 6 — Line classes and ground-truth export

## 41. Line classes (`SW-LC-*`)

- `SW-LC-1` A line class is SmartWeld's piping specification: the set of lines that share fluid
  and pressure class and therefore every design decision of stages 4 and 5. Code
  `{fluid group}{pressure class number}`, e.g. `H300`. Fluid groups: `H` hydrocarbon process,
  `W` water (cooling water supply and return, process water), `S` low-pressure steam, `C` steam
  condensate, `G` air and gases (instrument air, plant air, nitrogen), `F` flare and relief
  outlets. Reason: fluid and pressure decide wall, flanges, gaskets, bolting, valve choice and
  insulation, so the class is the unit a line is specified, bought and checked by. The codes
  and group letters are SmartWeld's own.
- `SW-LC-2` Assignment by service (SW-LL-1): P and RV → H; CWS, CWR, W → W; LS → S; SC → C;
  IA, PA, N → G; FL → F. Services that serve another line or equipment take the group of what
  they connect to: V, D, I, SP stubs on an equipment nozzle or a process line → H, on a header →
  the header's group; HS (hose station) lines → the group of the header they tap. The pressure
  class is the line's own (SW-LL-2). Reason: a vent, drain or instrument connection carries the
  fluid of what it is attached to.
- `SW-LC-3` Each class records: pressure class and design pressure (SW-PIPE-1); pipe wall
  (SW-PIPE-2/3); flanges, gaskets and studs (SW-FLG); fittings (SW-FIT); valve choices
  (SW-LL-3, SW-VLV-11); branch connection by tee (SW-FIT-2); materials (pipe and fittings
  `Grade 35 pipe`, flanges `Grade 36 forging`, valve bodies `Grade 36 casting`, studs
  `Grade 90 stud`, gaskets compressed sheet); insulation — S and C lines are insulated (steam
  and hot condensate burn on touch and lose heat), the others are not (insulation is recorded,
  not drawn, stated); a display colour (viewer only, not ground truth).
- `SW-LC-4` A line's class covers every item from its start to its end. A branch begins at the
  weld on its tee outlet; the tee belongs to the run it is welded into. Reason: the tee is
  bought and fabricated with the run.

## 42. Item metadata (`SW-GT-1..3`)

- `SW-GT-1` Every placed item — pipe piece, fitting, flange, blind, gasket, stud set, valve,
  nozzle neck, weld and support — carries: a unique tag; its line number and line class; its
  kind; a description written from its part (e.g. `ELBOW 90° R = 5/3 OD 4" P300`); the part
  designation and part key (which rebuilds its geometry); nominal size (and branch or small size
  where it has two); pressure class; material grade; end types (BW butt-weld, RF raised face);
  cut length (pipe); weight; its spool or `loose`; its two end points and centre in plant
  coordinates; its axis direction; and the rule IDs its dimensions come from.
- `SW-GT-2` Plant coordinates: East = +x, North = −z, Elevation = 100'-0" + y, all from the
  building's south-west floor corner (inches internally; feet-inches to 1/16 in for drawings).
  Reason: elevations above a 100 ft datum stay positive for anything below the floor (pits,
  foundations), so a sign is never misread.
- `SW-GT-3` Item number: within a line, items with the same description share one item number,
  numbered in the order they are first met from the line's start; pipe is one item per size,
  its pieces carrying cut lengths.

## 43. Spools and isometric data (`SW-GT-4..6`)

- `SW-GT-4` Spools: a line is divided at every field weld (SW-PW-2) and every flanged joint. A
  shop spool is the welded assembly of pipe, fittings and weld-neck flanges between two such
  breaks, numbered `{line}-SP{nn}` from the line's start. Valves, gaskets, stud sets and blinds
  are loose items. Shop welds lie inside one spool; a field weld joins two spools (or a spool to
  a parent tee). Reason: a spool is what a fabrication shop builds and ships; loose items are
  fitted in the field.
- `SW-GT-5` Isometric data per line: the line header (number, class, service, size, pressure
  class, design pressure, insulation, from and to); the ordered centreline nodes from start to
  end (end faces, flange faces, valve ends, weld points, elbow work points, tee centres,
  reducer ends) with plant coordinates and the direction of flow; the bill of materials
  (items aggregated by item number: quantity, total pipe length, total weight); the weld list;
  the support list; the spool list.
- `SW-GT-6` Export: one JSON file per line under `public/groundtruth/lines/` (file name from the
  line number with `"` → `in` and `/` → `-`), a plant index (`index.json`: every line with its
  class, service, size and counts), the line-class table (`line-classes.json`), the equipment
  nozzle necks (`nozzles.json`, recorded as equipment items with the class of the line at their
  face) and a plant-wide bill of materials (`bom.csv`). Produced only from the plant piping model and the catalogue;
  deterministic, so a test can check the committed files equal a fresh export.

## 44. Tests required for stage 6

- Every line has exactly one line class, consistent with SW-LC-2 and its own pressure class.
- Every item of the plant model appears exactly once in the export, with every SW-GT-1 field
  filled (`loose` counts as a spool value); item weights sum to the line's BOM weight.
- Spools: every pipe, fitting and weld-neck flange is in one spool; every shop weld joins two
  items of the same spool; every field weld joins items of two different spools (or a spool and
  a parent tee); every valve, gasket, stud set and blind is loose.
- Isometric nodes run continuously from start to end; plant coordinates convert back to model
  coordinates exactly.
- The committed export equals a fresh export; every stage-6 rule ID used in code exists here.

# Stage 7 — Equipment metadata and shutdown work orders

All welding, NDE, inspection and test content of stage 7 is SmartWeld demonstration content written
from reasoning (user decision, P-52). Every page that carries it is marked **DEMONSTRATION ONLY —
NOT A QUALIFIED PROCEDURE; THE FACILITY OWNER'S QUALIFIED PROCEDURES AND APPLICABLE CODES GOVERN.**
No code, standard or published procedure was used, and none should be inferred.

## 45. Areas and equipment metadata (`SW-AREA-*`, `SW-GT-7`)

- `SW-AREA-1` The facility is divided into five maintenance areas (drawing): A100 tank farm
  (T-101, T-102), A200 vessels and column (V-101, V-102, C-101), A300 exchangers and drum
  (E-101, E-102, E-103, D-101), A400 pumps (P-101A … P-104B), A500 pipe rack (rack headers and
  their branches). Reason: a shutdown is planned, isolated and staffed area by area.
- `SW-AREA-2` A line belongs to the area of the equipment at its start; if it starts on another
  line or a header, to the area of the equipment at its end; lines with no equipment (headers,
  hose stations, header vents and drains) belong to A500.
- `SW-GT-7` Equipment items carry: tag, type, description, area, designation, every dimension
  with its basis, empty weight, material, the plant coordinates of its origin, and its nozzles
  (id, service, size, pressure class, face coordinates, and the line connected there). Written to
  `public/groundtruth/equipment.json`.

## 46. Work orders (`SW-WO-*`)

- `SW-WO-1` A work order is issued by the facility owner for one task on one area: number
  `WO-{area number}-{sequence}`, title, area, task type, priority (1 safety, 2 integrity,
  3 reliability), the scope description, the affected items (tags), the lines whose isometric
  drawings are attached, the isolation list, new welds, the welding specification, NDE,
  inspections, the test, the ITP, and the parts list. The owner's work list (which tasks, on what)
  is drawing data (`OWNER_WORK_LIST`).
- `SW-WO-2` Task types: VR valve replacement in kind; SR spool replacement; GJ flanged joint
  remake (new gasket and studs); PR relief valve removal, bench test and reinstatement;
  PO pump overhaul; VI vessel or column internal inspection; XB exchanger bundle pull, clean and
  tube-side test; TI tank internal inspection; SP pipe support replacement; UT thickness survey
  of a line.
- `SW-WO-3` Isolation list: for work on a line, the nearest valve on each side of the affected
  items along the line (or the line's end valves), each with a blind to be fitted at the flange
  next to the work; for work on equipment, the first valve on every line at every nozzle, each
  with a blind at the nozzle side. Every isolation is verified (zero pressure, drained) before
  work. Reason: positive isolation by blind, not by a valve alone, protects the people inside
  the isolation.
- `SW-WO-4` New welds: a replaced spool is re-made complete — every shop weld of the spool is a
  new shop weld, each end joint that was a field weld is a new field weld, and the outlet weld of
  every branch line on a tee of the spool is a new field weld (the branch is cut free to remove
  the spool and welded back to the new tee), numbered
  `{WO}-W{nn}` and cross-referenced to the original weld ids. A replaced valve, a remade joint and
  a relief valve need no welds.
- `SW-WO-5` Bolt-up: each stud of a remade flanged joint is tightened to a preload of
  0.5 F_u A_s (A_s the stud's unthreaded area), in at least three passes in a cross pattern.
  Reason: the same preload that sized the flange (SW-FLG-5), so the flange is never loaded
  beyond what it was proportioned for; passes in a cross pattern seat the gasket evenly.
- `SW-WO-6` Thickness monitoring locations (TMLs) for a UT survey: every elbow extrados (the
  outside of the bend at mid-arc), every tee at its branch outlet, and every pipe piece of 2 ft or
  more at its mid-length, four readings 90° apart around the pipe at each. Vessels, the column,
  the drum, exchanger shells and tanks: every nozzle neck, the centre of each head (the floor
  centre of a tank), and four readings 90° apart around the shell at every 6 ft along its length
  or height from the lower tangent (the tank floor). Reason: flow turns and impinges at the
  extrados and the tee, where wall is lost first; in equipment, corrosion follows liquid levels
  and inlets, so a regular grid with every nozzle catches both. The minimum acceptable wall is the
  facility owner's (stated per work order, not by SmartWeld).

- `SW-WO-7` Every work order is tied to objects that exist in the 3D plant model: a primary asset
  — the equipment the work is on; for work on a line, the equipment the line serves (at its start,
  else at its end); for a line with no equipment (rack headers, hose stations), the pipe-rack
  bent nearest the work (`rack-bent:{x}`) — and an asset list naming every affected item, weld,
  support, isolation point and equipment by its tag, with its description and plant location.
  Every tag must resolve to an object of the model. Reason: a work order the crew cannot find in
  the plant, or that names something that is not there, cannot be planned or closed.

## 47. Welding specification (`SW-WPS-*`) — demonstration

- `SW-WPS-1` One SmartWeld welding specification per joint family, numbered `WS-{nn}`:
  WS-01 butt welds in pipe, fittings and weld-neck flanges of the facility's pipe grade, wall
  up to 1/2 in; WS-02 the same above 1/2 in; WS-03 fillet welds attaching shoes, guides and
  anchors to pipe or steel (shielded metal arc throughout, filler `SW-F2`). Joint: SW-WD-4 single-V groove (60°, root
  opening 1/8 in, root face 1/16 in). Process: gas-shielded tungsten arc for the root (a root
  that must fuse both sides from one side needs a controllable arc), shielded metal arc for fill
  and cap (portable for field work). Filler: matching strength, low-hydrogen, named by SmartWeld
  as `SW-F1` (root wire) and `SW-F2` (covered electrode). Reason: matching strength keeps the
  weld no weaker than the pipe; low hydrogen avoids hydrogen cracking in the heat-affected zone.
- `SW-WPS-2` Thermal: preheat the joint 3 in either side to at least 30 °F above the ambient dew
  point and never below 60 °F (drives off condensation, which is the source of hydrogen, with a
  margin a contact thermometer can resolve); for WS-02 at least 150 °F (a thicker wall conducts
  heat away faster, so the weld cools faster); interpass temperature no more than 450 °F (keeps the
  heat-affected zone from softening). Post-weld heat treatment: not specified for the
  demonstration — the facility owner states it.
- `SW-WPS-3` Every welder is identified on the weld map and the weld record (welder stamp per
  weld); fit-up is checked before welding: root opening per SW-WD-4, and the two bores aligned within the
  root face (1/16 in, SW-WD-4), because a step larger than the root face leaves part of the root
  unfused.

## 48. NDE and inspection (`SW-NDE-*`) — demonstration

- `SW-NDE-1` Every new weld: 100 % visual (VT) before and after welding.
- `SW-NDE-2` Volumetric examination (radiography RT, or ultrasonic UT where radiography is
  impractical) of new butt welds by line-class consequence: H, S and F classes 100 % of new
  welds (flammable or scalding contents); C, G and W classes 10 % of new welds, at least one per
  welder per work order, chosen by the owner's inspector. Reason: the consequence of a leak sets
  the extent; a shutdown repair has no production run to sample from, so high-consequence welds
  are all examined.
- `SW-NDE-3` Fillet welds of support attachments: 100 % VT and magnetic particle (MT).
- `SW-NDE-4` Acceptance (demonstration): no crack, no lack of fusion, no incomplete
  penetration (each a planar flaw that grows under cyclic load); undercut, porosity, inclusions
  and all other indications to the owner's acceptance criteria. A rejected weld is repaired once and re-examined to the same method; a second
  rejection cuts it out.
- `SW-NDE-5` Flange faces of every opened joint are inspected visually before the new gasket
  goes in (no radial scratch across the sealing face).

## 49. Test (`SW-TEST-*`) — demonstration

- `SW-TEST-1` Lines with new welds are hydrostatically tested at 1.4 × the class design pressure
  held for 30 minutes with no leak and no pressure drop, the relief valves blinded or removed.
  Reason: a relief valve set at the design pressure lets the pressure rise while it opens and
  flows, and surges add to that; 40 % above design proves the new welds clear of both, while the
  stud preload that sized the flange (SW-FLG-5, 1.5 × the bolting's design-load capacity) still
  holds the joint closed. (Common code multipliers were recognised and deliberately not used,
  P-52.)
- `SW-TEST-2` Remade flanged joints with no new welds: a service leak test at operating pressure
  on start-up, every remade joint checked.
- `SW-TEST-3` Relief valves: bench test of set pressure (the class design pressure, PSV-1) and
  seat tightness before reinstatement; set and test recorded with the valve tag.

## 50. Inspection and test plan (`SW-ITP-*`)

- `SW-ITP-1` Every work order carries an ITP: an ordered list of activities, each with the
  reference (rule, drawing or procedure), the acceptance criterion, the record that proves it,
  and an inspection point for the contractor, the owner and the third-party inspector: H hold
  (work stops until released), W witness (notified, may attend), R review of records,
  S surveillance (spot check).
- `SW-ITP-2` Hold points: isolation verified before work; fit-up before welding of a
  high-consequence class (SW-NDE-2); NDE results before the test; the test; reinstatement of
  isolations and blinds removed before handback. Reason: these are the steps whose failure
  cannot be seen once the next step is done.
- `SW-ITP-3` Completion capture: every activity has fields for status (open, accepted, rejected,
  not applicable), signer per party, date and remark; a work order is complete when every
  activity is accepted or not applicable. The viewer records sign-offs and exports them as a
  completion record (JSON).

## 51. Isometric drawings (`SW-ISO-*`) — withdrawn 2026-11-02

**Withdrawn (PROVENANCE P-59).** The owner's own drawings, imported and matched under §53, are the
project's isometrics: the work-order packs carry their sheets (SW-IMP-8), and the generated set below
was removed. The rules are kept here as the record of what was used until then.

- `SW-ISO-1` One isometric per line, generated from the ground truth (SW-GT-5): the centreline
  projected on isometric axes (East to the lower right at 30°, North to the upper right at 30°,
  elevation vertical), not to scale; symbols for flanges, valves (by type), elbows, tees,
  reducers, caps, gaskets, welds (shop dot, field flag with number), supports; the length of every
  straight run and the elevation of every change of level written on the drawing; a north arrow,
  the bill of materials, the weld list and a title block (line, class, service, size, design
  pressure, insulation, from–to, drawing number `ISO-{line}`, revision, work order).
- `SW-ISO-2` For a work order, the isometric clouds the affected items and the new welds.

## 52. Tests required for stage 7

- Every equipment item has its metadata and its nozzles; every nozzle's connected line exists.
- Every work order has: an owner area matching its items, at least one ITP hold point, an
  isolation list for any work that opens the line or equipment, new welds exactly matching its
  replaced spools (SW-WO-4), NDE extents by SW-NDE-2, the test by SW-TEST-1..3.
- (Withdrawn with SW-ISO-1, P-59.) Every isometric contains every item, weld and support of its
  line; replaced by the stage-8 test that every pack attaches the owner's sheets holding its work.
- The committed work-order data equals a fresh run; every stage-7 rule ID used in code exists here.

## 53. Imported isometric drawings (`SW-IMP-*`) — stage 8

The owner supplies isometric drawings made outside this repository (from this model's own
ground-truth export) and asks for them to be matched to the 3D model. These rules govern the
import. The model stays the reference: a drawing never changes the model, and any disagreement is
reported for the drawing's author to resolve.

- `SW-IMP-1` Receipt: only the document is imported (the owner's instruction). Each received file
  is recorded with its name, size, page count, SHA-256 and the provenance statement printed on its
  cover page, in `public/isometrics-imported/RECEIPT.json` and in PROVENANCE.md. Nothing else from
  the drawings' origin is read or imported.
- `SW-IMP-2` Identification: each sheet is identified by its title block (line number, drawing
  number, sheet n of m). A drawing matches the model line with the same line number. The title
  block must agree with the model's line header: piping class = line class, design pressure =
  "{design pressure} PSIG", insulation YES/NONE = insulated, fluid = service code, title = the line
  class's fluid name. A small branch line (a vent, drain, instrument or sample tap off a line,
  `from = "tap {parent}"`) without its own drawing is covered by its parent's drawing. The FROM / TO
  label at an equipment end reads "{equipment} NOZ. {nozzle}"; a hose station "HOSE STATION"; a
  relief valve "PSV", or "PSV ON {equipment} NOZ. {nozzle}" for the outlet of the valve on that
  nozzle. A tap
  end is shown by its continuation block, and caps and blinds by their symbols, so these need no
  label.
- `SW-IMP-3` Position: the drawings use the model's plant coordinates (SW-GT-2). Each continuation
  point (CONT'D ON / FROM, with E / N / EL) must lie within 0.5 in of the line's centreline (its
  nodes, elbow work points included). For a continuation to another drawing, it must be within
  0.5 in of the point where the two lines meet. The reason for 0.5 in: points are printed to 1/16 in
  and break points lie on straight pipe, so a correct point is within 1/32 in. 0.5 in leaves margin
  for that rounding and still catches any whole-inch error. Each CONT'D ON must equal the next
  sheet's CONT'D FROM. The breaks divide the line, by distance along the centreline (station), into
  its sheets.
  - The sign convention is read from the drawing set. A negative value that is not a whole number
    of feet can be printed the usual way ("-11'-6"" for −138 in, the sign applying to the whole
    value) or with the sign on the feet only ("-12'-6"" for −138 in). Every point where only one
    reading lies on the centreline decides; the matcher uses the reading the set's decisive points
    agree on to place the breaks. Rev 0 of the owner's set uses the feet-only form throughout;
    revision 1 (answering fix list FL-1) uses the usual form throughout.
    Each value printed in the feet-only form is still reported, because a reader in the field
    takes "-12'-6"" as −150 in. If decisive points disagree, each point is judged on its own and
    every one in the feet-only form is reported.
- `SW-IMP-4` Content: the bill of materials on each sheet is compared, row by row and by
  description, with the model's items and supports on that sheet. These are the items whose centre
  falls between the sheet's breaks, plus the items of branch lines drawn on it. The model's pipe is
  split exactly at the breaks. The comparison is repeated for the drawing's totals. Pipe lengths
  agree when they differ by no more than 1/16 in per bill row (the printing resolution).
  - Weld labels: the line's own welds carry the model's numbers (W1…Wn). A weld of a branch line
    drawn on the sheets is labelled with the branch's service and sequence and its own number,
    as in the model's tag: "I-7001/W1" for `3/4"-P300-I-7001/W1`. Rev 0 of the owner's set instead
    continues the parent's numbering in order along the line (Wn+1…; ISO-P-1002 labels its
    branch welds W11 and W12). Both forms are accepted, and the fix list (SW-IMP-7) asks for the
    model's form, which revision 1 uses.
  - Each label must be on the sheet that holds the weld's position. A weld with no label, or a
    label repeated on a second sheet, is reported.
  - Not checked: printed dimension strings (set along the pipe at an angle, so they do not read
    reliably as text) and the drawing symbols.
- `SW-IMP-5` Storage: each drawing's sheets are copied, unchanged, into one PDF per drawing
  (`public/isometrics-imported/ISO-*.pdf`), recorded with its SHA-256 and the part and page each
  sheet came from. The matcher reads these files, so the match can be re-run from the repository.
  The received part files are not committed. The drawings stay SmartWeld's confidential documents, as their cover page states.
- `SW-IMP-6` Findings and links:
  - Every finding has a level. An error is where the drawing contradicts the model or a reader
    would be misled. A warning is something missing or repeated that does not contradict the model.
  - Each finding names the drawing, the sheet and the weld or item where there is one. Findings go
    in `match.json` and `report.md`.
  - `match.json` also maps every model line to its drawing and every weld to its label and sheet.
  - The viewer's line inspector, the work-order data and packs, and the demo package link each
    line to its imported drawing beside the generated isometric (SW-ISO-1).

- `SW-IMP-7` Fix list: every finding becomes an instruction to the drawings' author, written by
  the matcher as `FIXLIST.md` (to read) and `fixlist.json` (for the generator).
  - Each instruction names the drawing, the sheet, the item or weld by its model tag, the exact
    text to print, and the model position (plant coordinates) it belongs at. Unlabelled welds also
    name the labelled welds on either side.
  - The list states the rules the corrected set must follow and the acceptance checks. Its
    acceptance is a re-import with no error or warning.
  - Nothing in the model changes. The corrected drawings are a new revision of the same drawing
    numbers. On import, the receipt keeps the superseded revision's file hashes. When nothing is
    left to change, the fix list says so instead of listing changes.
  - The list requires the revision to be made with permissively licensed software and fonts
    only, with no copyleft licence of any kind (the user's instruction of 2026-11-02, P-57).

- `SW-IMP-8` Work-order packs carry the owner's drawings (the user's instruction of 2026-11-02:
  "the drawings should come from my generator"). For each drawing that shows a work line, either
  as its own drawing or as the parent of a small branch, the pack attaches the sheets that hold
  any of the following on that drawing: an affected item, a weld the work replaces, or an isolation
  point.
  - The sheet comes from the match: a weld's sheet, or for an item or support the sheet whose breaks
    bracket its centre along the line (SW-IMP-3/4). If none of the work lies on a drawing's sheets,
    the whole drawing is attached.
  - The sheets are copied unchanged into the pack (SW-PDF-6). Before them, a table "Where the work
    is on the owner's drawings" lists each affected item, replaced weld and isolation point with its
    drawing, sheet and weld label, so the work can be found on the sheets without marking them.
  - The HTML pack shows the same table and links each drawing's PDF. The work order lists the
    owner's drawing numbers as its isometrics.

## 54. Tests required for stage 8

- Every model line maps to one imported drawing, and every drawing to one model line.
- The committed `match.json` and `report.md` equal a fresh run over the committed per-drawing PDFs,
  whose SHA-256 match `RECEIPT.json`.
- Every sheet's bill and every drawing's totals agree with the model. Every continuation point is
  on the centreline under SW-IMP-3. No weld label is unknown to the model.
- Every work order that lists a line lists that line's imported drawing.
- The fix list holds one instruction for every finding, and every instruction names a drawing,
  sheet and tag of the model.
- Applied to the parsed sheets, the fix list leaves no finding and no change, and the corrected set
  reads with the usual sign convention (`tools/isomatch.py --selftest`).
- Every stage-8 rule ID used in code is written here.

## 55. SmartWeld's own PDF writer (`SW-PDF-*`)

Replaces the headless browser that printed the work-order packs (SW-LIC-2). Written in
`src/pdf/`; uses only Node's built-in zlib to compress streams.

- `SW-PDF-1` File: PDF 1.7 written object by object by SmartWeld code.
  - Tabloid landscape pages, 17 × 11 in (1224 × 792 pt), margins 0.4 in, as the HTML pack's print style.
  - Streams are Flate-compressed.
  - The file is deterministic: no creation date. The /ID is derived from the SHA-256 of the
    content, so a fresh run reproduces the committed file byte for byte.
- `SW-PDF-2` Font: DejaVu Sans (SW-LIC-3) is embedded as a CID TrueType font with Identity
  encoding. SmartWeld's own subsetter keeps the glyphs used, glyph 0 and the parts of composite
  glyphs, and empties the rest. The advance widths come from the font's own metrics table. A
  ToUnicode map lets the text be searched and copied. Bold is drawn by filling and stroking the
  regular glyphs (stroke 0.04 em), so only one font file is embedded. A character the font lacks
  stops the run with an error rather than printing a blank.
- `SW-PDF-3` Layout, as in the HTML pack and with the same blocks in the same order:
  - Text sizes: body 8 pt; small notes 7 pt; headings 10.5 pt with a rule under them; title 15 pt; line height 1.3.
  - Each table column gets at least its longest word and at most its full single-line text. The
    width left over is shared in proportion to the difference.
  - A column left blank for hand entry is at least 1 in wide, or the width of its heading if more.
    These are sign-off, date, welder, remark, reading and tick columns; a person writes in them, so
    they keep room for it. Rows of such a table are at least 0.3 in tall, for the same reason.
  - Text wraps at spaces; a word wider than its column is broken between characters.
  - A row never splits across pages; the header row repeats on each new page.
  - The ITP and each isometric start a new page.
  - The layout is checked as it is built: no line of text is wider than its box, and nothing
    crosses the margins.
- `SW-PDF-4` (withdrawn 2026-11-02 with SW-ISO-1, P-59.) Isometrics: the SVG that SW-ISO-1 generates is drawn into the page by converting each
  element (rect, line, polyline, polygon, circle, text) and its class style (fill, stroke, width,
  dash, font weight and size, anchor) to PDF operators, scaled to fit the page without
  distortion.
- `SW-PDF-6` Attached documents: pages of another PDF are copied into the pack unchanged. The page
  object and everything it refers to (contents, fonts, images, resources) are copied byte for byte,
  with only the object numbers renumbered. Inherited page attributes are taken from the source page
  tree. Only PDFs with classic cross-reference tables are accepted, and the owner's per-drawing files
  are of that kind (SW-IMP-5). Anything else stops with an error rather than being redrawn.
- `SW-PDF-5` Notices: every pack ends with the demonstration notice (SW-WPS-1) and the font's
  licence notice (SW-LIC-3).

## 56. SmartWeld's own renderer (`SW-REN-*`)

Replaces the headless-browser screenshots (SW-LIC-2). Written in `src/render/`; PNG files are
written with Node's built-in zlib.

- `SW-REN-1` 3D views: a depth-buffered triangle rasterizer of the model's own mesh data (the same
  part meshes the viewer draws).
  - Perspective camera; each surface is shaded by one directional light and an ambient term, in the viewer's material colours.
  - Edges are smoothed by 3 × 3 supersampling.
  - The scenes and cameras are those of the viewer's views.
  - It shows the 3D model only, without the viewer's side panels.
- `SW-REN-2` Page previews: a PDF page from SW-PDF is drawn from the same layout record that
  wrote it, so the page can be reviewed as an image.
  - Glyphs are filled from their outlines in the embedded font (quadratic curves flattened, nonzero fill).
  - Lines are stroked as quadrilaterals with round joins.
- `SW-REN-3` The images are for review and for the demo. Each image's file name and caption name
  the view, and the renderer that made it.

## 57. External test drawings (`SW-EVAL-*`)

Isometrics drawn by a third party's software from this model (for example a piping designer
importing an export of the model) are used **only to test** SmartWeld's detection model, and the
results guide SmartWeld's own generator. These rules keep that use apart from SmartWeld's clean-room
work (§0, SW-LIC-*). PROVENANCE P-61.

- `SW-EVAL-1` Test only, kept apart. External drawings are a test set and never training data.
  - They are stored only in `eval/external/` (not committed, never in a deliverable or the demo
    package) with the detection results on them (`eval/detections/`, same treatment).
  - No dataset or export may contain a file whose SHA-256 appears in an evaluation receipt.
  - The model weights are therefore trained without them.
- `SW-EVAL-2` Admission. Each received set gets a receipt (`eval/receipts/<set>.json`, committed)
  before use, recording:
  - the files and their SHA-256;
  - the software and version that drew them, and who drew them;
  - two clearances: the contract reference that gives SmartWeld the work product and allows this use,
    and the reference of the review of that software's licence for using its output to test AI.
  The harness refuses to score a set whose two clearances are not both recorded.
- `SW-EVAL-3` Answer key. What each drawing must show comes from the model alone (`eval/answer-key.json`,
  committed). For every line: its line number, and every object in SmartWeld's class list with its tag:
  - fittings: elbow, tee, reducer, cap, flange, blind;
  - valves, by type: gate, ball, check, control, relief;
  - butt welds, with the model's weld labels;
  - supports, by symbol: `support/pipe` for hangers, shoes, guides, anchors, stanchions and trapezes,
    and `support/dummy_leg` for trunnions. The owner's generator draws all six of the first group
    with one symbol and names the type in the bill of materials, so a detector can tell them apart
    only by reading the tag and the bill, not by the symbol. Each support object in the key still
    carries its type (`type`), so the model keeps every support type and the key can check the bill.
  Classes are scored coarse (valve, support) and fine (valve/gate, support/pipe).
  (Amended 2026-11-05 at the owner's instruction, PROVENANCE P-65: supports were seven classes, one
  per type, which asked a detector to tell apart symbols that are drawn the same.) Pipe runs, gaskets and stud sets are not
  scored, since an isometric does not draw them as separate symbols. A small branch line counts with
  its parent when the set draws it there; the receipt says which.
- `SW-EVAL-4` Detections arrive in SmartWeld's own format (`eval/README.md`). For each page of a
  received file, the page carries the line number the detector read and each detection's class, score,
  box and any text read. Every page must belong to a file in the receipt (by SHA-256), and every class
  must be in the class list.
- `SW-EVAL-5` Scores, per line and for the set:
  - Per class: expected count, detected count (score ≥ the threshold, 0.5 unless stated), the count
    matched (the lesser of the two), missed, extra, and precision, recall and F1.
  - Weld labels: the expected labels found among the texts read.
  - Lines: line numbers read correctly.
  - Where a hand-annotated sample of boxes exists, also box precision and recall at IoU ≥ 0.5 and the
    mean IoU. These are counted per class, each detection matched once, highest score first.
  - Count scores cannot tell an extra detection from a missed object found elsewhere on the same line
    (an extra weld can offset a missed weld). Only the box scores locate each object, so a sample of
    annotated sheets is recommended for each set.
- `SW-EVAL-6` The feedback firewall. A report holds only numbers, class names, line numbers and tags
  from the model, and notes written in SmartWeld's own words. It holds no image, crop, symbol shape,
  font, title-block layout or copied text from an external drawing.
  - A change to SmartWeld's generator made in response is written as a SmartWeld rule here, with its
    reason citing the report, never the external drawing.
  - The generator may vary its own drawings (sizes, angles, crowding, line weights, scan noise) to
    close a measured gap. It is never changed to reproduce another product's appearance.
  - The person or process that views external drawings writes the notes; whoever changes the
    generator works from the notes and the numbers only.

## 58. Exchange package for a piping designer (`SW-XCH-*`)

The model is handed to a piping designer as a neutral export in SmartWeld's own format. The designer
converts it into his software's exchange format on his side, under his own licence. SmartWeld
consults no outside format description (PROVENANCE P-62).

- `SW-XCH-1` Content, all from the ground truth (§41–44) and the plant piping:
  - one line list with every line's header;
  - one component list with every item of every line and every equipment nozzle neck: pipe,
    fittings, flanges, blinds, gaskets, stud sets, valves;
  - one weld list with the two parts each weld joins;
  - one support list.
  Each component row carries its tag, line, order along the line, type, SmartWeld part code,
  description, sizes, pressure and line class, end types, material, weight, spool and cut length.
  The files are CSV (one row per object) and the same data as one JSON file.
- `SW-XCH-2` Geometry and connection:
  - Positions are plant coordinates (SW-GT-2) in inches to 1/10 000 in, with millimetres alongside
    (× 25.4, exact).
  - Every component gives its two end points, an elbow or tee its centre point, and a tee its branch
    end point, taken from the weld that joins the tee to its branch line.
  - An angle valve (the relief valves) gives its inlet face, its body corner as the centre, and its
    outlet face, which is where its outlet line starts.
  - Components connect where their end points coincide (within 1/32 in). A branch line starts at
    its parent tee's branch end.
  - Welds name the two parts they join, so connection can also be read from the weld list.
- `SW-XCH-3` Spec request list: every distinct part per line class (one row per part code, pipe by
  size and class), with its count in the plant and every dimension the part's rules set (§29–32 and
  the fitting, flange and valve rules), with its label, value and basis. The designer builds the
  matching spec in his software from this list, so the model keeps SmartWeld's dimensions rather than
  a stock catalogue's.
- `SW-XCH-4` Pilot: the same files for three lines first, with their branch lines:
  - 6"-P150-P-1001, a routed process line with two instrument taps;
  - 1"-P150-HS-5002, a hose-station line;
  - 3"-P150-SC-2004, a rack header.
  Every line that taps into a pilot line, at its start or its end, is included too (repeatedly), so
  no tee in the pilot is left open. A pilot line
  that starts on a line outside the pilot is named in the README. The designer settles the mapping
  and spec on these before the full plant.
- `SW-XCH-5` The package's README:
  - describes every file and field;
  - asks the designer to keep the SmartWeld tag on each component as an attribute, so his drawings can
    be scored item by item (SW-EVAL-5);
  - asks him to return his bill of materials as a CSV report with the drawings;
  - states that the contents are SmartWeld's confidential work.
  A manifest lists every file with its SHA-256. The package holds no drawing and no outside material.

---

# Stage 9 — The coverage plant (plant 2), socket-weld and threaded piping, and structural erection drawings

Written before any stage-9 code, at the owner's instruction (PROVENANCE P-66): a second plant, built
so that every symbol of the owner's isometric generator appears at least 20 times, with the
structural steel of a cladded building with platforms, kept in the model but out of the package
sent to the piping designer, and with erection drawings and weld details for that steel. Plant 1
(stages 1–8) is unchanged, so revision 1 of the owner's drawings still matches it.

## 59. Plant definitions (`SW-PLANT-*`)

- `SW-PLANT-1` A plant is one data object: an identifier, a building drawing (SW-BLD-1), a layout
  (SW-LAY-*), a nozzle schedule (SW-NOZ-2), a line list (SW-LL-*), the joint type of each line
  class by size (SW-SPEC-1) and, where it has one, an outdoor area. Every generator (building,
  interior, nozzles, routing, ground truth, answer key, designer package, drawings) reads the plant
  it is given and nothing else. Plant 1, `P1`, is the demonstration plant of stages 1–8 and keeps
  its code and its files where they are. Plant 2, `P2`, is the coverage plant of this stage.
- `SW-PLANT-2` Files: plant 1 keeps `public/plant-piping.json`, `public/groundtruth/`,
  `public/workorders/`, `public/isometrics-imported/`, `eval/answer-key.json` and
  `downloads/designer-package*`. Every other plant writes the same set under
  `public/plants/<id>/`, `eval/<id>/` and `downloads/designer-package-<id>*`, and
  `public/plants/index.json` lists the plants for the viewer. Reason: nothing of plant 1 moves, so
  its drawings, receipts and hashes stay valid.
- `SW-PLANT-3` Line numbers (SW-LL-1) of plant 2 use the sequence blocks of plant 1 plus 200
  (process lines from 1201, headers from 2201, utility branches from 3201, relief from 4201,
  hose stations from 5201, equipment stubs from 6201, line taps from 7201, header drains from
  8201). Equipment tags carry the unit number 2 (V-201, P-201A …). Reason: no tag of plant 2
  can be mistaken for one of plant 1 when both are open at once.
- `SW-PLANT-4` Plant 2 building drawing (SW-BLD-1): width 100 ft out-to-out, 10 bays of 25 ft
  (250 ft), eave 32 ft, roof slope 1 in 12, roof load 30 psf, wall load 20 psf, slab 6 in,
  Grade 90 bolts, the same doors as plant 1. Reason: a wider, taller shell than plant 1 carries a
  three-tier rack with a 2 ft working space above the top tier under the rafters (SW-RT-7) and
  two equipment rows with 4 ft walkways.
- `SW-PLANT-5` Plant 2 layout (SW-LAY-*, drawing): a rack 24 ft wide on the building centreline,
  tiers at 16, 22 and 28 ft, bents at 20 ft from x = 20 ft to x = 230 ft; equipment either side on
  pads as SW-LAY-2, with every nozzle on the 6 in routing grid (SW-RT-3). The equipment list is in
  code (`PLANT2.layout`, basis drawing): two adsorber vessels V-201/V-202 with a shared platform and
  stair tower as SW-LAY-3, a column C-201 with two platforms and ladders, a knock-out drum D-201
  and an air receiver D-202, four exchangers E-201…E-204 in two pairs, ten pumps P-201A/B …
  P-205A/B, ten solids receivers R-201…R-210 (small vertical vessels) in a row along the north wall under a
  walkway, a 3 ft grating access walkway along the rack's south edge at the first tier (posts at
  every bent, guardrail, a ladder at each end: it reaches the branch valves and their drops pass
  through it in sleeves, SW-PEN-1), a 16 ft access platform over each exchanger at 20 ft and over
  the drum D-201 at 23 ft (four posts, guardrail, ladder), each just above the control stations
  on the top nozzles (SW-LL-7) so the lines come down through the grating in sleeves and the
  stations are reached from below and from the platform, and an outdoor area east of the building with two storage tanks T-201/T-202, two larger
  receivers R-211/R-212, an air receiver D-202 and a flare knock-out drum D-203 on pads on grade.
  (Amended 2026-11-05: the hopper and silos became vertical vessels, P-67.) Reason: the pairs of exchangers carry three-way diverting valves, the
  adsorbers a four-way switching valve, the hopper the rotary feeder, and the outdoor tanks give
  lines that pass through the building wall (SW-PEN-2).
- `SW-PLANT-6` Outdoor area: the routing grid extends 60 ft beyond the east end wall at grade;
  outdoor lines run on sleepers (SW-PS-9 stanchions) and through the end wall in sleeves
  (SW-PEN-2); outdoor equipment stands on 6 in pads on grade and its tanks have caged ladders as
  SW-LAY-3. Reason: a tank farm is outside the process building in practice; a short run keeps the
  routing search bounded.
  Amended (stage 9, routing): from 9 ft beyond the rack's east end outward (the 9 ft is the
  slot in which the lines leaving the rack's top fall to the band), through the end wall
  and across the outdoor area, horizontal runs lie at one elevation, a centreline of 12.5 ft
  (150 in) above grade, side by side as on a sleeper way, except within the end zone of their own
  equipment; the band crosses the end wall between its girts. There is no steel above them to
  hang from, so the stanchion of SW-PS-9 is allowed up to a pipe bottom of 14 ft from 2 ft west of
  the rack's east end outward (the end bay, where the lines fall to the band under a roof too
  high for a 20 ft rod near the ridge, and the outdoor area); further west its 10 ft limit
  stands, a hanger taking over above it. Reason: a sleeper way at grade would cross every
  walkway; one band at head height leaves the ground free, and at a single elevation no line
  runs under another, so every line in the band stands on its own post (a first cut with a
  60 in deep band stacked lines and left the upper ones unsupportable). A safety valve on a tap stands with its outlet square to the
  run it taps (so its flare line leaves across the run, clear of the next tap), and the flare
  line's lead is held in the grid as soon as the valve stands.
- `SW-RT-9` Plant 2 only, lines through the end wall: a line with one end inside the building and
  the other outside is searched in two legs that meet at a wall gate 30 in outside the steel
  line, heading straight through the wall (so its sleeve of SW-PEN-2 is square to the panel). The
  gate is at the band elevation of SW-PLANT-6 (150 in), and is tried in
  plan at the outdoor end's z moved outward in 12 in steps (within the wall's width less 5 ft),
  the first gate from which both legs route being taken; each leg is searched as SW-RT-3 with the
  gate as an end. Reason: the one-piece search of SW-RT-3 from a rack tier to a tank nozzle 60 ft
  away exhausts its budget (measured: 3.9 million expansions) because the fall to the band and the
  wall between make its straight-line estimate poor; through a gate each leg is short and the
  gate is where the sleeve is set anyway.
- `SW-RT-10` Plant 2: the roof (the plane of the rafters' top flange) and the side walls and west
  wall (the steel line) bound the routing grid as obstacles, the east wall alone being passable
  (SW-PEN-2). Reason: the cladding is not a routing obstacle (SW-RT-3 treats members only), and
  plant 2's grid reaches above the eave, so without this a line could run between purlins above
  the roof.
- `SW-PLANT-7` Areas (SW-AREA-1 applied to plant 2): A200 tank farm (outdoor), A210 adsorption
  (V-201, V-202, C-201, D-201, D-202), A220 exchangers, A230 pumps, A240 solids (H-201,
  RV-201), A250 pipe rack.

## 60. Piping specifications: socket-weld and threaded joints (`SW-SPEC-*`, `SW-SWT-*`)

Plant 1 is all butt-welded and flanged. Plant 2 adds the two small-bore joint types used in
practice, each with its own fittings. Every dimension below is proportioned from the pipe of the
size and class (SW-PIPE-2/3); nothing is taken from a published table.

- `SW-SPEC-1` Joint type by line class and size. Butt welds (SW-PW-1) for NPS ≥ 2 in every class.
  Small bore (NPS ≤ 1.5): socket welds in the hydrocarbon, steam and flare classes (H, S, F;
  reason: a welded joint for a hazardous or hot fluid), threaded joints in the air, water and
  condensate classes (G, W, C; reason: a low-hazard utility, taken apart for maintenance). A branch
  takes the joint type of its own class and size. Plant 1's classes keep butt welds at every size
  (stated).
- `SW-SWT-1` Socket: a counterbore of diameter OD + 1/16 in (so the pipe slips in) and depth
  s = roundup( max(3/8 in, OD/3), 1/16 in ). The pipe is inserted to the bottom and drawn back
  1/16 in (a gap, so the weld does not crack when the pipe expands against the socket bottom).
  The fitting's wall around the socket is t_f = roundup(1.5 t_pipe, 1/16 in), minimum 3/16 in
  (reason: a forged body is made thicker than the pipe it joins; the socket wall must carry the
  weld's shrinkage without distortion). The socket weld is a fillet at the mouth, leg
  w = roundup(1.4 t_pipe, 1/16 in): its throat (0.707 w ≈ t_pipe) then equals the pipe wall, so
  the joint is as strong as the pipe. Socket welds are weld records of type `SW` (SW-PW-3), shop
  or field by SW-PW-2.
- `SW-SWT-2` Threads: SmartWeld's pipe thread has depth h_t = 1/32 in + OD/40 and engagement length
  L_t = roundup( max(3/8 in, 0.4 OD), 1/16 in ). Pipe in a threaded class is supplied with wall
  t_th = roundup(t_pipe + h_t, 1/32 in), so the full pressure wall remains under the thread root
  (reason: the thread is cut into the wall). A threaded end on a fitting is a bore of diameter
  OD − 2 h_t over L_t; the pipe enters by L_t. Threads are not modeled as helices (as SW-B-1); a
  threaded joint has no weld record.
- `SW-SWT-3` Socket-weld and threaded elbows (90° and 45°): a forged block whose passage of bore D
  turns on a centreline radius r_c = OD (reason: the smallest radius that leaves the inner wall of
  the passage smooth is OD/2; one OD gives a gentle turn without a large block). From the tangent
  point each leg runs straight t_f (a heat sink for the weld) and then the socket s or thread L_t,
  so the centre-to-mouth A = r_c + t_f + e with e = s (SW) or L_t (TH). The body is a cylinder of
  diameter OD + 2 t_f along each leg with a sphere of the same diameter at the corner. The model
  records a forged elbow mouth to mouth, so its chord is 2 A cos(θ/2) for a turn of θ (√2 A for
  90°, 1.848 A for 45°), unlike a butt-weld elbow, recorded tangent to tangent, whose chord is
  2 R sin(θ/2) (SW-FIT-1); the checker of §40 uses each form for its kind.
- `SW-SWT-4` Socket-weld and threaded tees (equal and reducing): a forged block with run and branch
  passages; centre-to-mouth C_s = OD/2 + t_f + e on the run and the branch (reason: the body must
  pass the branch bore and leave t_f before the socket). Body cylinders of diameter OD + 2 t_f.
- `SW-SWT-5` Couplings: a full coupling is a cylinder of diameter OD + 2 t_f holding two sockets
  (or threads) back to back with a stop ring t_f wide between them, length 2 e + t_f. A half
  coupling is one socket (or thread) of length e + t_f with its other end welded. Couplings join
  two pipe lengths of a small-bore line (SW-RT-5 applied to small bore: every 20 ft; on socket-weld
  lines of plant 2 every 10 ft, the shop spool length one fitter handles, SW-COV-2), and a half
  coupling is the connection a threaded or socket-weld instrument tap (SW-LL-3 instruments)
  makes on a vessel or line where no olet is used.
- `SW-SWT-6` Branch outlets (olets): a forged outlet fitting welded to the run for a branch of at
  most half the run's size (reason: the hole removes little of the run's wall, so a tee is not
  needed; the fitting's base puts metal back around the hole). Body: a cylinder of diameter
  OD_b + 2 t_f from a base that flares to OD_b + 4 t_f over a height 2 t_f, its bottom cut to the
  run's outside surface (a saddle). Height from the run centreline to the outlet mouth:
  OD_run/2 + 4 t_f + e, with e = s (socket), L_t (threaded) or 1 in (butt-weld bevel). The branch
  weld to the run is a fillet all around the base, leg t_f, in the weld list as type `FW`.
  Branches larger than half the run keep a tee (SW-FIT-2, SW-SWT-4).
- `SW-SWT-7` Swages: a turned concentric reducing piece for small-bore size changes: ends of
  length e_1, e_2 (socket s, thread L_t or a 1 in butt-weld straight, per end) on each side of a
  cone of 12° half-angle (as SW-FIT-3), wall t_f of the larger size. Length = e_1 + e_2 +
  (OD_1 − OD_2) / (2 tan 12°).
- `SW-SWT-8` Nipples: a pipe piece of 12 in or shorter between two fittings of a small-bore line;
  its description states the end preparation: `TBE` threaded both ends, `TOE` threaded one end
  (the other plain, for a socket), `PBE` plain both ends (socket-weld). The shortest, `CLOSE`, is
  2 L_t + 1/4 in long, threaded over its whole length. Longer pieces are pipe.
- `SW-SWT-9` Plugs: a threaded plug closing a threaded end: a shank of length L_t and a head
  across flats F = OD + 2 t_f (a wrench of the fitting's size fits it), height 0.6 F; hex head, or
  square head for NPS ≤ 1/2 (reason: a square head is easier to turn with a small wrench). A
  socket plug, closing an unused socket-weld port, is a round bar of diameter OD inserted to the
  socket depth with a head of the same diameter 0.6 OD high, welded at the socket mouth (SW).
- `SW-SWT-10` Forged valves with socket-weld or threaded ends (gate, globe, check, ball, needle;
  §32): the type's internals and cavity are unchanged; the end flanges are replaced by forged
  ends: the body's hubs (length h_hub, SW-FLG-6) continue as a cylinder of diameter OD + 2 t_f
  holding the socket or thread, so the end-to-end length is w_body + 2 h_hub + 2 (t_f + e). Three-piece ball valves (SW-SWT-11) are the socket-weld ball
  valve. The part key carries the end type: `RF` (flanged, the default), `SW` or `TH`.
- `SW-SWT-11` Three-piece ball valve: the socket-weld ball valve's body is three pieces, a centre
  body holding the ball and seats and two end pieces holding the sockets, drawn with their four
  through bolts (SW-B-*, diameter max(1/4 in, D/6)), so the centre can be removed from the line
  for seat replacement. Reason: a socket-welded valve cannot otherwise be taken out.
- `SW-SWT-12` Slip-on and socket-weld flanges, spades and spectacle blinds: §61.

## 61. Flanges added, blinds between flanges, and penetrations (`SW-FLG-10..13`, `SW-PEN-*`)

- `SW-FLG-10` Slip-on flange: the SW-FLG ring of the size and class, bored to OD + 1/16 in so it
  slips over the pipe, with a hub 0.75 t_f long of wall t_f at its back. The pipe end stops
  t_pipe + 1/8 in short of the face (so the inside weld cannot foul the gasket). Two fillet welds:
  at the hub back, leg t_pipe (SW-WD-1), and inside at the pipe end, leg t_pipe. Used for NPS ≥ 2
  in the W and G classes at P150 (reason: easy to align on a low-pressure utility; two fillets
  instead of one groove). Weld records: two `FW`.
- `SW-FLG-11` Socket-weld flange: the ring with a hub of length s + t_f holding a socket
  (SW-SWT-1); one fillet at the hub mouth. Used where a socket-weld line meets a flanged valve or
  item. Weld record: one `SW`.
- `SW-FLG-12` A flanged joint is the flange, the gasket, the mating flange and the stud set
  (SW-FLG-4/7); its symbol follows its flange type (weld-neck, slip-on or socket-weld). Blind
  flanges, spades and spectacle blinds close or sit in a joint.
- `SW-FLG-13` Spade and spectacle blind: a plate inserted between two flanges with a gasket each
  side. Thickness t_sp = roundup( (G/2) √(1.24 P / (0.6 F_y)), 1/8 in ), minimum 1/4 in (the blind
  plate of SW-FLG-8 without the ring's minimum: it is held by the flanges, not bolted). The spade
  is a disc of diameter BC − d (inside the bolt circle) with a handle 2 in wide reaching 2 in
  past the flange OD, with a 3/4 in hole for hanging. The spectacle blind is a spade and a ring
  (bore D, same outside diameter) joined by a web 2 in wide, turned about one stud; the ring sits
  in the line when open. The joint's studs lengthen by t_sp + gasket (SW-FLG-7). Where: spectacle
  blinds at the battery-limit flanges of lines leaving the building and at the equipment
  isolation flanges of the adsorbers and exchangers; spades at spare nozzles and the far ends of
  headers in place of a blind flange where the header will be extended (plant 2 line list).
- `SW-PEN-1` Floor penetration: where a vertical line passes through a platform's grating, a
  sleeve of pipe of the first size in the series whose OD ≥ OD_line + 1.5 in, wall of P150, from
  1 in below the grating to 2 in above the walking surface (a curb that stops dropped objects
  and keeps insulation off the grating), welded to a `PL1/4` collar 2 in wide that rests on the
  bars (fillet SW-WD-1). The grating is cut round at the sleeve OD + 1/4 in (SW-GR-*). The sleeve
  is an item of the line (kind `penetration`, loose) in the ground truth.
- `SW-PEN-2` Wall penetration: where a line passes the building's steel line through the
  cladding, a sleeve as SW-PEN-1 from 2 in inside the panel to 2 in outside it, with a `PL1/8`
  escutcheon plate 4 in larger than the sleeve on the outer face (fasteners not modeled,
  SW-CL-4). The panel is cut round at the sleeve OD + 1/4 in. Lines pass the end walls between
  the wind posts and girts (SW-BLD-4, SW-CF-*): the routing grid treats posts and girts as
  obstacles and the panels as passable, so a line crosses the wall where the search finds it free.
- `SW-PEN-3` A penetration carries no weld to the pipe (the pipe slides in the sleeve).
- `SW-PEN-4` Plant 2 only: a vertical run may pass through a platform's grating, where it gets a
  sleeve (SW-PEN-1); horizontal runs keep out of the grating and the headroom above it (SW-RT-3), and
  the run keeps 3 in from the platform's beams. Reason: a riser through a floor is normal practice
  and is why sleeves exist; a horizontal pipe at walking level is not. Plant 1 keeps SW-RT-3 as it
  was, so its routing is unchanged.
- `SW-RT-8` Plant 2 only: where a routed line jogs sideways by at most 8 ft between two parallel runs
  (two 90° elbows back to back with a short pipe between), the jog is made with two 45° elbows
  (SW-FIT-1, or SW-SWT-3 in small bore) on a diagonal centred on the jog, when the diagonal keeps the
  SW-RT-3 clearance and no branch sits on the replaced length. Reason: two 45° elbows make a
  smoother offset with less pressure drop and no short pipe piece; it is how a designer draws an
  offset. (Amended in stage 9 from 4 ft: the first count gave seven offsets; at 8 ft the diagonal
  is 11 ft, still no longer than the two legs and the pipe it replaces.)
- `SW-LL-6` Plant 2 small-bore stacks (the item sequences of SW-LL-3 applied to SW-SPEC-1):
  - a socket-weld line meets a flanged nozzle or item through a socket-weld flange (SW-FLG-11); a
    threaded line through a weld-neck flange butt-welded to a nipple threaded at its other end
    (SW-SWT-8, `TOE`);
  - instrument connections (service I) on socket-weld lines: branch outlet or nozzle, nipple, forged
    gate valve, nipple, four-way valve with its spare port plugged (the gauge and purge manifold,
    4W-1), nipple, socket-weld flange, gasket and blind; on threaded lines: nipple, threaded gate
    valve, nipple, needle valve, plug;
  - sample points (SP): branch outlet, nipple, forged gate valve, nipple, three-way valve (purge
    port plugged), nipple, swage to the threaded needle valve, nipple, needle valve, plug;
  - vents and drains (V, D) on hydrocarbon, steam and flare lines: three-piece socket-weld ball
    valve, nipple, socket-weld flange, gasket and blind; on air, water and condensate lines:
    threaded gate valve with a plug (the drain is opened by removing the plug);
  - thermal relief on a pump discharge: branch outlet, nipple, socket-weld flange, gasket and a
    1 in safety valve, its outlet by a socket-weld flange and swage into a 1-1/2 in socket-weld line
    to the flare header;
  - utility branches to equipment (nitrogen, seal flush): at the header a threaded branch outlet,
    nipple and threaded gate valve; at the equipment a threaded check valve and a threaded globe
    valve (throttling) on nipples behind the flange;
  - hose stations (threaded): threaded gate valve at the header take-off; at the station a swage to
    3/4 in, a threaded gate valve and a plug; the riser above the station offsets 18 in outward
    (away from the rack) at 12.5 ft through two 45° elbows (SW-SWT-3), so the drop from the header
    comes down behind the station post and the valve and hose face the walkway;
  - small-bore lines are joined every 20 ft with a coupling (SW-SWT-5);
  - isolation valves by class and size (SW-LL-3 extended; amended in stage 9 for SW-COV-2):
    butterfly (wafer) on water and on air and gas lines 2 in and above and at the storage tanks'
    process nozzles (low pressure, a wafer valve is the light choice); globe valves on steam and
    condensate lines at both ends (throttled services), at the consumer's nozzle of a cooling-water
    or water supply and at the header take-off of a cooling-water return (balancing); on solids
    lines a full-bore ball valve where the line fills a vessel (ahead of the rotary valve at every
    fill and solids-inlet nozzle, and at the take-off of a fill branch) and a plug valve where it
    empties one (the receivers' outlets and the dump lines; a plug clears a solids-laden seat);
    gate elsewhere 2 in and above;
  - check valves (SW-LL-7): besides the pump discharges, a swing check ahead of the block valve at
    the destination end of every utility line that returns to a header (cooling-water return,
    condensate, air from the receiver, the conveying-air line) and of every supply into a tank or
    vessel (water to the tanks, steam to the adsorbers and exchangers);
  - control valves (SW-LL-7): as SW-LL-3 at a destination nozzle, and the same station at a
    destination header take-off where the line controls into the header (the air receiver's two
    lines, the conveying-air line, the condensate returns), plus water to the tanks and steam to
    the adsorbers;
  - spectacle blinds in the first flanged joint at every process nozzle of a vessel, column, drum,
    tank or silo and at battery limits; spades in the first joint at every exchanger nozzle and
    every pump suction (SW-FLG-13);
  - solids: a rotary valve (ROT-1), an inline flanged valve, in the stack at every solids outlet and
    solids inlet nozzle of the receivers and adsorbers (the airlock of a pneumatic conveying line).
  Reason: these are the item sequences the owner's symbol set draws, each in the place it is used
  in practice.
- `SW-LL-7` Plant 2 line-list measures for the coverage floor (SW-COV-2), each a practice choice
  that the first count (P-67) showed necessary:
  - regeneration steam to each adsorber (LS 3 in, P300, to a shell nozzle N12 with a control
    valve) and its condensate (SC 2 in from N13 to the condensate header): an adsorber is
    regenerated with steam in practice;
  - the exchangers' instrument stubs are 1 in; the drains of the vessels, column and drums are
    1-1/2 in (a larger drain empties a vessel in reasonable time); vents and drains on socket-weld
    stubs carry a socket-weld tee with a plugged branch after the valve (a flushing or steam-out
    connection); the four-way gauge manifold carries on one side port a purge needle valve on a
    one-end-threaded nipple with a plug and on the other a socket plug; drains on threaded headers
    use a threaded globe valve (a blowdown is throttled);
  - pump nozzles are one size below their lines (suction 3 in for 4 in lines, 4 in for 6 in;
    discharge 3 in for 4 in lines, 2 in for 3 in), so every suction carries an eccentric reducer
    flat on top and every discharge a concentric one (SW-LL-3): a pump's nozzles are smaller than
    its lines in practice;
  - the conveying header is 8 in and the condensate header 4 in, so their branches of half the
    size or less leave through branch outlets (SW-SWT-6);
  - the water hose stations are 1-1/2 in (swaged to 3/4 in at the station, SW-LL-6);
  - spectacle blinds also in the solids stacks of the adsorbers' solids inlets and the silos'
    outlets (positive isolation for vessel entry); the adsorbers' solids inlet nozzles are 3 in
    (the 4 in line reduces at the nozzle);
  - a control valve is one size smaller than its line where the line is 3 in or more, between two
    eccentric reducers (flat on the outer side of the station, so the station drains to the line),
    its block valves at line size: the usual sizing of a throttling valve;
  - the receivers' fluidizing-air nozzles carry the nitrogen stack of SW-LL-6 (threaded check
    and globe), since they too are a gas supply into a vessel;
  - a water or cooling-water supply has at its consumer a block (butterfly) and a throttling globe
    valve; a cooling-water return has the same pair at the header take-off;
  - solids branches carry their valve at the take-off too: a ball valve where the branch fills
    (the receivers' fill branches off the fill lines, the adsorbers' feeds) and a plug valve where
    it empties (the receivers' outlet lines into the conveying header);
  - the exchangers' tube-side nozzles are 3 in on 4 in lines (concentric reducer at a vertical
    nozzle); vents and drains stand on 2 in nozzles (receivers', tanks' and exchangers' vents;
    vessel, column and drum drains) and swage down to the stub's size in the first fitting
    (SW-SWT-7, a butt-weld swage): the larger nozzle takes a vessel's own blowdown;
  - the pumps' thermal-relief outlets are 1 in lines (the exchangers' 1-1/2 in), so the socket-weld
    flare lines come in two sizes; the tanks' and silos' vent nozzles are 3 in (swaged to the
    1 in vent), the receivers' and exchangers' 2 in;
  - control stations at a header take-off would reach the rafters above the top tier, so the lines
    into headers (the air receiver's two, the condensate returns) carry a check valve only, and
    the control valves of SW-LL-3 stand instead on the second cooler's and heater's feeds, the
    second adsorber's feed and outlet, and the column overhead to its drum.
  Reason: SW-COV-2 asks for 20 of every class over 4 lines and 2 sizes; each measure is a
  sequence a designer would draw, not a symbol placed for its own sake.

## 62. Valve types added, the rotary feeder and the hopper (§32 continued; `SW-EQ-8`)

`SW-VLV-1` is amended: TYPE is also one of `TWAY` (three-way ball), `FWAY` (four-way plug) and
`ROTARY` (rotary airlock feeder). Dimensions follow §31 and the form rules of §32A.

- `3W-1` Three-way ball valve, L-port: the ball valve (BA-*) with a third port at 90° to the run
  in the plane across the stem (local +x), the same bore, so the ball's L-shaped passage joins the
  inlet to either outlet by a quarter turn. Body: the ball valve's cavity with a third hub and end
  of the same form (flanged, or socket-weld as SW-SWT-10). Offered 1/2–4 in to P600. Reason: one
  valve diverts flow between two parallel items (the exchanger pairs) without two block valves.
- `4W-1` Four-way plug valve: the plug valve (PL-*) with four ports at 90° in the plane across the
  stem, and a plug with two separate L-passages, so a quarter turn swaps the two pairs of
  connections. Offered 1/2–4 in to P300. Where one port is not piped it is plugged (SW-SWT-9) and
  the drawing says so. Reason: a single valve switches the two adsorber vessels between service
  and regeneration.
- `ROT-1` Rotary airlock feeder of nominal size N (in): a cast housing of inside diameter
  D_r = 1.5 N and length N + 2 t_b holding a rotor of 8 vanes on a shaft of diameter max(1 in, N/6),
  with square inlet and outlet openings N × N that change to round within transitions 0.5 N
  high, ending in weld-neck-pattern flanges of size N (SW-FLG-*, as every other valve, SW-VLV-1)
  so the valve bolts into its line like every other flanged valve;
  end plates with a bearing boss each side; a gear motor on one end with a cylinder of diameter
  0.6 N and length N on a box foot. Face to face = D_r + 2 t_b + 2 × 0.5 N + 2 (t_f + h_hub).
  Body wall t_b by SW-VLV-2 with D_c = D_r. Offered 3–12 in at P150 (amended in stage 9 from
  4–12 in: the adsorbers' solids inlets are 3 in, SW-LL-7; a 3 in feeder's housing is 4.5 in
  across with a 1 in shaft, still a working rotor).
  Reason: the feeder meters solids from a hopper into a conveying line while keeping the pressure
  boundary; the rotor pockets carry the solids round, so the housing is wider than the openings.
- `SW-EQ-8` Withdrawn 2026-11-05 at the owner's instruction ("rotary valves should not have the hopper",
  PROVENANCE P-67): the solids receivers of plant 2 are vertical vessels (SW-EQ-1) and the rotary
  valves are inline flanged valves on their solids lines. The hopper part stays in the catalogue, unused. The withdrawn rule read: Solids hopper: a cylindrical bin of stated diameter and height with a conical bottom at
  60° to the horizontal (reason: dry solids slide on a slope that steep) down to a round outlet
  nozzle of the feeder's size (SW-NOZ-1), on four `W6` legs from a `PL1/2`
  outlet flange ring to base plates on a pad, with a flat top plate carrying a 20 in manway and a
  vent nozzle. Reason: 60° lets dry solids flow to the outlet; four legs clear the feeder and its
  motor.

## 63. Coverage of the owner's symbol set (`SW-COV-*`)

- `SW-COV-1` The owner's isometric generator draws a fixed set of symbols (sent as an image in chat,
  viewed only). SmartWeld's symbol classes, named in SmartWeld's own words, each map to model items
  as follows (the item type, its ends and, for supports, its kind):

  | Class | Model items |
  |---|---|
  | `gate_valve`, `globe_valve`, `check_valve`, `ball_valve`, `butterfly_valve`, `plug_valve`, `needle_valve`, `control_valve`, `relief_valve`, `three_way_valve`, `four_way_valve`, `rotary_valve` | valves by type (any end type, except where a class below separates the end type) |
  | `forged_gate_valve` (SW), `forged_gate_valve_th`, `ball_valve_3pc` (SW), `forged_check_valve_th`, `forged_globe_valve_th`, `gate_valve_th_plugged` | forged valves with the stated ends (SW-SWT-10/11); the plugged one carries a plug on its free end |
  | `flange` (weld neck), `slip_on_flange`, `sw_flange`, `nozzle_flange` | flanged joints by flange type (SW-FLG-12) |
  | `blind_flange`, `spade`, `spectacle` | blind flange; spade; spectacle blind |
  | `elbow_90`, `elbow_45`, `tee`, `reducer`, `eccentric_reducer`, `cap` | butt-weld fittings |
  | `sw_elbow_90`, `sw_elbow_45`, `sw_tee`, `socket_weld` | socket-weld fittings; every socket weld |
  | `coupling_sw`, `coupling_th` | couplings by end type |
  | `branch_outlet`, `branch_outlet_sw`, `branch_outlet_th` | olets by outlet end |
  | `swage`, `swage_sw`, `swage_th` | swages by end type (mixed ends count with their larger end) |
  | `nipple`, `plug` | nipples (TBE/TOE/CLOSE), plugs |
  | `weld`, `weld_field` | butt welds, shop and field |
  | `pipe_support`, `dummy_leg`, `anchor` | hangers, shoes, guides, stanchions, trapezes; trunnions; anchors |
  | `floor_penetration`, `wall_penetration` | sleeves (SW-PEN-1/2) |
  | `flow_arrow` | not a part (one per line) |

- `SW-COV-2` Plant 2 holds at least 20 instances of every class of SW-COV-1 except `flow_arrow`,
  spread over at least 4 lines and, where the class has sizes, at least 2 sizes. A tool counts them
  from the ground truth and a test fails below the floor. Reason: the owner's instruction
  ("captures every item at least 20 times"); 20 examples of each symbol let a detector's recall on
  it be measured to about ±10 %.
- `SW-COV-3` Plant 2's answer key (SW-EVAL-3) uses the classes of SW-COV-1 as its fine classes and
  the groups valve, flange, fitting, weld, support, penetration as its coarse classes. (`anchor` is a
  fine class only where the owner's generator gives it its own symbol; the owner's sheet draws it
  as a pipe support with the type in the bill, so for scoring it counts under `pipe_support` as
  P-65 decided.)

## 64. Structural steel erection drawings and weld details (`SW-ERD-*`)

Drawn from the plant's structural model (the building and interior generators) with SmartWeld's
own PDF writer (§55) and previewed with its own renderer (§56). Nothing of any outside drawing is
used; the conventions below are SmartWeld's.

- `SW-ERD-1` The set, one PDF per plant: (1) cover and sheet index; (2) general notes and the
  symbol legend of SW-ERD-6; (3) anchor-bolt plan; (4) column schedule and base details;
  (5) roof framing plan; (6) sidewall and endwall framing elevations; (7) typical frame
  elevation with knee and ridge details; (8) rack framing plans per tier and a rack bent
  elevation with strut, tab and bracing details; (9) platform framing plans with stair and ladder
  elevations; (10) member schedule; (11) weld details, one per joint type, and the weld
  schedule; (12) bolt schedule.
- `SW-ERD-2` Marks: every distinct part (designation and length, to 1/16 in) of the structural
  model gets one mark: C columns, R rafters, P wind posts, B beams, S struts, G girts, Z purlins,
  X bracing rods, K stair stringers, L ladder rails, H guardrail, E end plates, BP base plates,
  CL clips and tabs, AR anchor rods, numbered in the order met. Instances are counted. The
  member schedule lists mark, designation, length, count, unit and total weight (from the parts,
  K-1) and the rule that sized the part.
- `SW-ERD-3` Projections: plans look down with east to the right and north up (SW-GT-2);
  elevations look at the named face. Members are drawn as two parallel lines at their depth (or
  flange width in plan), ends cut as modeled; plates as outlines; bolts as circles at their
  positions; rods as single lines. Grid lines: letters across the width, numbers along the length,
  dimensioned between. The scale is chosen so the view fits the sheet and is stated on it
  (1/8 in = 1 ft, 1/4 in = 1 ft, or 1 in = 1 ft for details).
- `SW-ERD-4` Marks are written at each member's mid-length; a mark that repeats in a row (purlins,
  girts, rack struts) is written once with "typ." and its count. Elevations and plan dimensions
  are in feet and inches (SW-U-2) to the member centreline or the steel line as the structural
  model places them.
- `SW-ERD-5` Details: each connection type of the model is drawn once at a larger scale as a
  section through the joint showing the parts' true outlines from their profiles (§4–8), the
  bolts, and the welds with the symbols of SW-ERD-6 and their sizes from SW-WD-*. Joint types:
  column base (fillet all around, SW-PF-7), knee and ridge end plates (fillet all around, bolts
  SW-PF-5), rack beam end plates, rack strut tabs (fillet, bolts), bracing rod ends, grating
  clips, guardrail post plates, stair stringer bearings, vessel platform clips (SW-EQ-6), and
  the pipe-support welds to steel (SW-PS-12) as a note.
- `SW-ERD-6` Weld symbols (SmartWeld's own): a reference line with an arrow to the joint; a
  filled right triangle on the line for a fillet weld, the leg size written before it and the
  length after it (no length = the full joint); an open V for a complete-penetration groove
  weld with the plate thickness; a small circle where the arrow leaves the line for "all
  around"; a flag for a field weld; "typ." with a count where one symbol stands for many joints.
  The legend (sheet 2) explains each.
- `SW-ERD-7` The weld schedule lists every weld part of the structural model (fillet, fillet all
  around, groove): mark, the joint it belongs to, type, size (leg or thickness), length, count,
  unit and total weight (SW-WD-3/5), shop or field (field: every weld made at a bolted connection
  on site is a shop weld on the shipped piece, so all welds of the model are shop welds except
  the pipe-support welds to steel, which are field). The bolt schedule lists mark, diameter,
  length, grip, grade and count (SW-B-*).
- `SW-ERD-8` Output is deterministic; the drawings and their previews are regenerated by a tool and
  checked by tests: every member instance of the model appears exactly once on a framing plan or
  elevation, every weld part is in the weld schedule, and every number on the sheets comes from the
  model.
