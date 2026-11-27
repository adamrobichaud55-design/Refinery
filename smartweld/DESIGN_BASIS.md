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
| `K-7`    | Density of normal-weight concrete| 150 lb/ft³ (0.08681 lb/in³) | Physical property of stone-aggregate concrete, bars included (≈2.4 g/cm³). Civil catalogue (§65). |
| `K-8`    | Barrel (petroleum)               | 42 gallons of 231 in³ = 9,702 in³ = 5.6146 ft³ | Unit definition. Plant 3 (§74). |
| `K-9`    | Molar volume of an ideal gas     | 379.5 ft³ per lb-mol at 60 °F and 14.696 psi | Ideal gas law (R = 10.732 psi·ft³/lb-mol·°R). "Standard cubic feet" in §74–75 are at these conditions. |
| `K-10`   | Standard atmosphere              | 14.696 psi (760 mm of mercury) | Physical constant. Gauge pressures in §74–75 are above it. |

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
  face. Amended 2026-11-27 (the owner's decision, for every plant): the nosing angle lies
  along the tread's front edge, its top leg flush with the top of the bars and its front leg
  down the front, between the two carrier plates, against their inner faces. Reason: as
  drawn, the angle was turned the wrong way about the tread: it lay beside the tread, a whole
  tread's width off to one side, in front of the nosing line and standing above the walking
  surface, so on plant 3's ejector deck stair each nosing passed through a stringer and into
  the next flight (an in-structure check, P-95). Between the carriers, not across them,
  because the carrier is a plate welded to the angle's end, not a plate the angle runs
  through. So too the bearing bars: each runs from one carrier's inner face to the other's
  (drawn, they ran the tread's full width, through both carriers by their thickness).
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
  Amended 2026-11-27 (owner's decision, P-95): the pedestal (two thirds of the casing's
  diameter wide, from the baseplate to 2 in below the shaft) starts at the casing's suction
  face and ends 2 in behind the casing as before; it no longer starts 2 in ahead of the face.
  And the shaft stands high enough for the motor as well as for the casing: at the higher of
  two heights above the baseplate's top, half the casing's diameter and 4 in (the casing's
  underside 4 in above the baseplate, as before) and half the motor's diameter (the motor's
  underside on the baseplate). So where the motor is more than 8 in larger than its casing,
  the motor's round rests on the baseplate with its foot, 1 in high, on the baseplate under
  it, and the pump is lifted on a taller pedestal to meet the motor; no higher than that.
  Reason: the suction nozzle's neck leaves the casing's face on the shaft's line, and the
  pedestal standing 2 in ahead of the face stood under the first 2 in of every neck larger
  than 4 in across; and with
  the shaft set by the casing alone, a motor more than 8 in larger than its casing was drawn
  into its baseplate, and more than 10 in larger through it into the pad, its foot drawn
  downward from the baseplate's top into the pad (up to 6 in) and weighed as steel. An
  independent clash check of plant 3 found a suction neck 1 in (a 6 in neck) to 2 in deep in
  its pump's pedestal at 58 pumps, and a motor 1/2 in to 7 in down in its own pad at 16.
  Plants 1 and 2 (a 20 in casing, an 18 in motor, 3 in and 4 in suction necks) had neither;
  they keep their shaft at 15 in, and each of their pumps weighs 91 lb less by its shorter
  pedestal.
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
  Amended 2026-11-27 (P-95, for every plant, the owner's decision on the catalogue's own
  drawings): the web's top edge stops at the pipe's underside, the line the shoe is welded
  along. Reason: the web was drawn 0.15 in up into the pipe so that the two would read as
  joined; a web is welded along its edge to the pipe's surface, not set into the pipe wall,
  and the drawing must not put the shoe's steel inside the pipe (an independent clash check
  found it so at every shoe). The pipe's curve across the web's 3/8 in thickness leaves the
  web's two edges clear of the pipe by at most 0.015 in (at 2 in, the smallest line on a
  shoe; less on larger lines), a gap the weld fills.
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
  Amended 2026-11-27 (P-95, for every plant, the owner's decision on the catalogue's own
  drawings): the hub's wall at the back of the flange is no thicker than leaves the nuts room
  on the back face: its outside radius there at most half the bolt circle, less half a nut's
  width across its corners (SW-B-2) and the bolt hole's own clearance on its stud (1/16 in, as
  the valves keep, SW-VLV-1), and never less than t_pipe; the taper runs from there to t_pipe
  as before. Where even t_pipe would not leave that room, the bolt circle is widened to give
  it (and t_f follows from the wider circle by SW-FLG-5). Reason: SW-FLG-4 sets the bolt circle
  from the gasket and the studs' spacing only, never from the hub behind the flange, and the
  drawn nuts stood up to 0.12 in inside the hub's root at the class 1200 flanges of 4 to 12 in
  (no clash check could see it: each excuses a stud set where it passes through its own
  joint's flanges). A thinner root keeps the bolt circle, the flange's thickness and its
  length, so no joint, line or route moves; the hub keeps at least the pipe's wall and still
  tapers into it. The root is so thinned at 3 to 16 in in class 1200 (to between 1.47 and 1.96
  t_pipe) and at 4 in in classes 150, 300 and 600 (to 1.71 t_pipe, where the nuts had 0.009 in);
  no bolt circle, thickness or length changes in any class a plant uses (150 to 1200). Only in
  classes 2400 and 4800, which no plant uses, is the bolt circle widened, at five sizes. The
  rule is for pipe flanges (weld-neck flanges and nozzles); a valve's own body and bonnet
  joints, designed with the body's bore and wall, keep SW-VLV-1's room for their nuts.
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
  Amended 2026-11-27 (owner's decision, P-95): behind each end flange the valve leaves room
  for the studs and nuts of its joint (SW-FLG-7), with the clearance a bolt hole gives its
  stud (1/16 in all round: the catalogue drills every flange's stud holes d + 1/8 in on the
  bolt circle of SW-FLG-4, a hole size SW-FLG-4's text does not itself state). The room runs
  from the back of the flange over the nuts' reach (half the stud length less half the joint, that is the
  two flanges, their raised faces and the gasket: the nut and the end of the stud beyond it)
  and the clearance. Over it the hub, and the tube, neck or flare that carries it, stand no
  further from the axis than half the bolt circle less half the nut's width across corners
  (SW-B-2, SW-B-3) and the clearance, and keep their own size beyond it (a plain step); any
  other part of the casting that stands where a nut or a stud's end would (the edge of a
  cover flange) is cut back round each bolt hole to half the nut's width across corners and
  the clearance. No cut leaves less wall over the bore than SW-VLV-2 gives the bore itself
  (D_c = D); where that wall is reached first the clearance gives way (the 4 in valves of
  classes 150 to 1200 keep 0.009 in to the nuts' corners). The end flange keeps its n holes
  of d + 1/8 in on the bolt circle (SW-FLG-4), drilled as the pipe flange it bolts to;
  face-to-face, flange diameter and thickness are unchanged. Reason: a nut seats on the back of the flange and must be turned there, so the
  casting behind it stops short of the nut; drawn whole, the hub (twice the body wall at the
  flange) stood where the nuts on the valve's side sit, and an independent clash check of
  plant 3 found the stud set inside the body of flanged gate, globe, check and control
  valves from 2 in to 14 in (4,040 findings at 72 valve sizes, up to 0.6 in deep; at 12 in
  class 1200 the control valve's hub stood beyond the bolt circle itself); with the hubs cut,
  the cover flange of the 3 in swing check still stood 0.03 in into two of its nuts. The
  holes were already drilled and the studs clear of them. Not settled by this rule, and used
  in no plant: in classes 2400 and 4800 the wall comes first and the nuts still meet the hub,
  because the bolt circle of SW-FLG-4 is too small for the hub there, as it is for the pipe
  flanges' own hubs (to be reviewed with the flange rules); bolts are not cut, so where the
  bolts of a cover or bonnet stand in an end joint's room (the 36 in class 1200 swing check,
  the 5 in and 8 in class 1200 safety valves, and larger or higher-class ones of these and of
  the globes) the joint's arrangement is to be reviewed; and the Y-pattern globe's inclined
  bonnet joint (F-4) is left as drawn (its hubs are cut), because its body and bonnet
  flanges, gasket and bonnet bolts stand over the inlet joint's nuts at every size, which
  only a longer neck (a taller valve) can clear, for the owner to decide.
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
  Amended 2026-11-26 (owner's decision, P-95): a wafer or lugged body sits between two pipe
  flanges, so within their reach (the flange's outside diameter and 1/8 in about the axis)
  nothing of the body stands beyond its face-to-face width: the neck and the bottom boss are
  cut to the two faces there and keep their full round above and below it. Reason: drawn
  whole, the neck (at least 1 in in radius) and the boss stood out of a 2 in to 6 in body by
  up to 1/2 in each side and into the flanges it is clamped between; an independent clash
  check of plant 3 found it at every such valve (the disc, inside the bore, is not affected).
  Amended 2026-11-27 (owner's decision, P-95): the line studs that clamp a wafer body run
  through its width on the bolt circle, so the wafer body is drilled at every line stud, not
  only at its four ears, with the hole a flange gives its stud (d + 1/8 in, 1/16 in all
  round, as SW-VLV-1 takes it); the ring stands inside the studs (BF-1), so this cuts only
  the neck and the bottom boss where they reach the bolt circle, and the fillets that join
  them to the ring. Reason: the neck and the boss are centred on the shaft, between the two
  studs that stand half a pitch either side of the top and the bottom of the bolt circle, and
  from 10 in up the neck (0.1 D + 0.6 in in radius there) is wider than the gap between those
  studs; a part-level check of plant 3's wafer valves against the one stud set through each
  (SW-RPI-21), made while the end-flange rooms of SW-VLV-1 were reviewed, found the neck of
  the 10, 12 and 20 in valves 0.31, 0.27 and 0.70 in into those studs, which the clash
  checks had not tested (they take a stud set through a butterfly as the bolting of its
  joint). The lugged body is drilled at every stud already.
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
  Amended 2026-11-27 (plant 3, P-95): the neck runs from the back of the flange to the item's
  body as drawn, its end where its axis meets the drawn body's outer surface: never stopping
  short, so that it does not end in the air, and never running past it, into a head or a
  shell. Where a plant's rule sets a connection's face on a plane the item's body does not
  reach (a fired heater's gas connections, under its floor, where the body the gas enters is
  the burners' manifold, SW-EQC-15 and SW-EQC-53 as amended), the face stays where the rule
  sets it and the neck runs on, behind the base the face was set from, to that body. The room
  kept for the connection's valves and the extent of a run's grid are measured from the base
  and standout the face was set by, so a longer neck moves no route. A unit kept as routed
  before has its stored necks cut again to the same length, the flange and face left where
  they are (`necksToPlan`). A neck that continues an opening the item draws for it (an open
  cone's small end, a gas duct of the line's outside diameter) ends in the plane of the
  opening; whether a neck meets its body is checked through its wall at several points round
  it, not on its axis, along which such an opening shows only the item's inside. Reason: a
  nozzle is welded to the body it serves; a flange held up by nothing, or a neck standing into
  a vessel's head, cannot be built. An independent check of every nozzle of the nine units
  found necks 15 to 66 in off a column's narrower shells, one 12 in into its top head, and the
  heaters' gas connections ending in the air under their floors. Nozzle positions and services are the plant's drawing (`DEMO_NOZZLES`, basis
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
    in a horizontal run at the destination end (no bypass, stated), 18 in of pipe between the
    nozzle's block valve and the station, shortened to 6 in only where the straight stack would
    otherwise reach steel before its first elbow (amended 2026-11-06: with the stubs of SW-LL-8 (5)
    the inlet stacks of V-101 and V-102 in plant 1 grew 34 in and met the rack's edge strut);
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
  Z, SW-CF-*, a member like any other for this purpose; the bridge is not modeled, its rod is);
  and a rod may be 24 ft long for lines of 2 in and below (a 3/8 in rod carrying a light line
  sways little; the 20 ft limit stands for heavier lines).
  Reason: the end bay and the rack top of plant 2 left runs with no floor path and no hot-rolled
  steel above.
  Amended (2026-11-25, plant 3): a stanchion taller than 14 ft is a support post: its round
  post is the smallest of the post sizes whose outside diameter is at least a fortieth of its
  height (and no smaller than the post above), on a base plate as wide as the post and 6 in,
  held by four anchor rods. Reason: a post of the size below a small pipe, at 20 ft or more,
  would be a wand that sways when touched; at a fortieth of its height a round post is about
  as stocky as the shortest columns of the rack (a post's radius of gyration is about a third
  of its diameter, so its height is about 115 of them), and it carries a pipe's weight over a
  span many times over. No stanchion of plant 1 or plant 2 is taller than 12.5 ft, so none is
  changed.
- `SW-PS-10` Vertical runs longer than 10 ft get a trunnion (SW-PS-4) under their lowest elbow,
  standing on a stanchion base when that elbow is at most 10 ft up; otherwise they hang from the
  hanger nearest their top. (Plant 2: vertical runs longer than 6 ft, since its small-bore risers
  off the rack are short and still want a base under their bottom elbow; SW-COV-2.)
- `SW-PS-11` Small-bore stubs (vents, drains, instrument connections, sample points) shorter than
  4 ft are carried by their nozzle and need no support.
- `SW-PS-12` Shoes, guides and anchors are fillet-welded (SW-WD-1); stanchion bases are anchored
  with two 1/2 in rods into the slab (SW-AR-*).
- `SW-PS-13` Trapeze: where a line runs directly under another line so a single rod cannot pass, two
  rods (SW-PS-9 diameter) at a = OD/2 + 6 in either side of the pipe carry an `L2x2x1/4` under it
  (plant 2: a = OD/2 + 12 in where a line lies right beside the one above, so the rods clear both).
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
  - When the model changes after a revision was received (a rule amendment, not a drawing
    error), the lines whose items, welds or supports changed are listed in `model-changed.json`
    with the provenance entry and the rule; a drawing of such a line, or carrying such a branch,
    gets one `info` finding `model-changed` in place of its content findings and no fix
    instruction, since the next revision is drawn from the new files. The next receipt clears the
    list (amended 2026-11-06, P-71: thirty-one plant 1 lines under SW-LL-8 (5) and SW-LL-3).

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
- `SW-XCH-6` (stage 9) The package also carries `equipment.csv`: every item of equipment a line
  connects to, with its tag, type, every stated and rule-set dimension, its origin and its axis in
  plant coordinates, so the designer can stand the equipment in the modelling software before
  connecting the lines (the owner's instruction: the model sent to the designer holds the equipment
  but not the structural steel). Reason: a line's end at a nozzle is only meaningful against the
  equipment it stands on.

### The owner's joint rules from the drawing review (`SW-LL-8`, 2026-11-05/06)

- `SW-LL-8` The owner read both plants' lines from their PCF files with the owner's own generator,
  drew every line, checked the drawings against the ground truth and set these rules, which apply
  everywhere (plant 1's geometry excepted where noted, because its lines are the ones the owner's
  Revision 1 drawings of stage 8 are matched to):
  1. A plug is always threaded and only ever screws straight into a valve's end: never socket
     welded, never on a pipe run, a tee or a nipple. So a socket-weld tee's spare branch and a
     four-way valve's spare port carry a one-end-threaded nipple, a threaded gate valve and the
     plug in its end (the vent of SW-LL-7 and the purge of 4W-1 are then both valved), and a hose
     station's plug screws straight into its gate valve (SW-LL-6 amended: no nipple between).
  2. No field weld at a slip-on or socket-weld flange, or at a threaded or socket-weld valve:
     those are shop welds. Field welds are butt welds only, at the points SW-PW-* names.
  3. Every valve has the same kind of flange at both ends. An equipment nozzle is itself a
     weld-neck flange (recorded as such in the ground truth), so the flange on the other side of a
     valve at a nozzle is a weld-neck flange whatever the line's class; a slip-on class (SW-FLG-10)
     keeps its slip-on flanges where both sides of the valve are pipe.
  4. A weldolet only ever takes a weld-neck flange, butt-welded straight on.
  5. Two valves never bolt straight together: a pipe stub of 6 in, flanged at both ends with the
     valves' kind of flange, stands between them (the check and block valve of a pump discharge,
     the valves of a control station, a block and its throttling globe, a block and a rotary
     valve, a block and a check at a take-off). Both plants apply it (amended 2026-11-06 at the
     owner's follow-up: plant 1's sixteen such joints on ten lines, first left as drawn because
     the owner's Revision 1 drawings of stage 8 matched them, now take the stub too, with
     weld-neck flanges as plant 1's are; those ten lines then differ from the Revision 1 drawings
     by the stub, P-71).
  6. A blind may bolt straight onto a valve's end flange.
  7. A slip-on flange needs a pipe end to slip over: never straight on a tee, an outlet or a
     reducer. A branch leaving a tee in a slip-on class has a 6 in pipe stub between the tee and
     its slip-on flange; a branch leaving an outlet takes weld-neck flanges; where a reducer meets
     a slip-on flange (the control station of SW-LL-7 in a slip-on class, or a pump suction in
     one), a 6 in pipe stub stands between the reducer and the flange, so the flange slips over
     the stub and the stub is butt-welded to the reducer (amended 2026-11-06 after the owner's
     redraw found slip-on flanges welded straight to the control-station reducers).
  Reason: these are the owner's drawing conventions; the generator draws them and the detector is
  tested on them, so the model carries them.
- `SW-GT-7` Ground truth amended with the review: a reducer or swage records its large size as the
  item size and its small size as the branch size, and the PCF gives each end its own bore from the
  item that meets it; a branch outlet's base weld joins the run and the outlet itself; a line's joint
  type in its header is read from its own pipe pieces and nipples (butt-weld if any is
  butt-welded, else socket-weld if any is plain-ended into a socket, else threaded), not from the
  class alone, and every line carries it, a stub of nipples and fittings included; a line of
  flanged items only, with no weld, is headed by its class joint (amended 2026-11-06: the stubs
  had no header joint and were written butt-weld); a nipple whose plain end goes into a socket
  (a station's side port, a socket-weld tee's spare branch, the hose station's nipple up into its
  socket-weld line) records that end as socket-weld, so its symbol key is `NISS`, and a nipple
  whose plain end is butt-welded to a flange records it butt-weld, `NIBC`; a nipple's item code
  carries its length; an equipment nozzle record carries its flange type; the
  ground-truth kind of a branch outlet is `outlet`. Reason: the owner's reader found each of these
  ambiguous or wrong in the first files.

### Piping component files for exchange (`SW-PCF-*`, stage 9)

The owner's designer imports lines rather than modelling them, and the owner's own isometric
generator reads the same files, so one file per line serves both (owner's instruction).

- `SW-PCF-1` One PCF (piping component file, the plain-text line format isometric tools read) per
  line, written by SmartWeld's own writer (`src/exchange/pcf.ts`) from the ground truth of
  SW-GT-6: units inches (bore and coordinates) and pounds; coordinates are the plant frame of
  SW-U-4 and SW-GT-2 (E, N, EL with the floor at EL 1200 in); the pipeline reference is the line
  number and the piping spec its pressure class; the line class, fluid, service, design pressure,
  insulation, joint type, from, to and flow direction go to the pipeline attributes; the file begins
  with its units lines and names no product (the designer adds a product's own first line on his
  side if his importer insists). Reason: a designer imports a PCF in one step where a spreadsheet
  costs a modelling pass per line; no vendor's name belongs in SmartWeld's files.
- `SW-PCF-2` Every ground-truth item becomes one component record with its end points taken from
  the item's own ends (`a`, `b`), so adjacent records share a point to the model's precision; a
  bend adds its centre point (the elbow's corner, SW-FIT-1 / SW-SWT-3); a tee, a branch outlet and
  a valve station add a branch point, which is the first point of the branch line that leaves
  there (SW-SWT-6, 3W-1, 4W-1), and a four-way station's spare port the point of its blind or
  plug; a safety valve is an angle valve whose second end point is its outlet face and whose
  centre is the body's corner (SW-XCH-2). The record type and symbol key follow the mapping table
  of SW-PCF-3. Reason: a file whose points do not meet is rejected by every importer; the ground
  truth's points meet by SW-GT-3, so the writer copies them and adds nothing. Amended with the
  owner's review: a bend's centre point is its work point, where the two centre lines meet (found
  as the meeting point of the two legs either side of the bend, each leg the line through the
  bend's end along the part that touches it, whichever end that part touches; 45° bends and the
  threaded and socket-weld elbows included; amended 2026-11-06 when the hose-station risers' 45°
  elbows were found written at their chord midpoint); a tee, a three-way and a four-way valve always carry a
  branch point, from the branch line where one leaves and else from the fitting's own branch
  mouth; a four-way valve carries a second branch point at its spare port; a reducer, a swage and
  an outlet give each end its own bore, the outlet's first end point staying on the run whichever
  way the line is written; a relief valve's second end point carries its outlet bore; a support has
  a materials entry; an item without a spool carries no spool attribute.
- `SW-PCF-3` Mapping (one table, in code and in `tools/pcf-mapping.md`, and the same table the
  owner's generator reads with): each ground-truth kind and end type maps to a PCF record type
  and a four-letter symbol key written as SmartWeld's own convention, two letters for the item
  and two for its ends (BW butt-weld, SW socket-weld, SC screwed, FL flanged, PE plain), for
  example `ELBW` a butt-weld elbow, `VGFL` a flanged gate valve, `TESC` a threaded tee; items
  with no fitting type of their own (spades, spectacle blinds, sleeves) are miscellaneous
  components with their description; gaskets and stud sets are their own records at the joint;
  welds are weld records with the shop or field key; supports are support records at their
  point with the support type as the key. Reason: a symbol key names the drawing symbol, so a
  reader on either side resolves it from one table; an importer that wants its own keys remaps
  the table once. Amended with the owner's review (names the owner's reader uses): the outlet
  record is `BRANCH-OUTLET`; a nipple plain into a socket and threaded at its other end is `NISS`;
  a floor sleeve is `PFPE` and a wall sleeve `PWPE`; `FW` are the letters of a fillet weld; a
  one-ended part (plug, cap) names its one connecting end; a station's side items hang off its
  valve member.
- `SW-PCF-4` A materials block at the end of each file lists every item code of that line with
  its description, size, end type, material and weight, so the importer's bill of materials and
  the owner's generator's bill agree with the ground-truth bill of SW-GT-5. The writer is
  deterministic (tests) and writes no number it does not read from the ground truth. Reason: the
  bill is part of the answer key.

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
  through it in sleeves, SW-PEN-1), a 7 ft access platform over each exchanger's inlet nozzles at
  24 ft and a 16 ft one over the drum D-201 at 27 ft (four posts, guardrail, ladder), each just above the control stations
  on the top nozzles (SW-LL-7) so the lines come down through the grating in sleeves and the
  stations are reached from below and from the platform, an 8 ft operating platform over each
  pump row at 12.5 ft (posts in the gaps between the pumps, guardrail, ladder) reaching the tops of
  the discharge risers, which pass through it in sleeves, and an outdoor area east of the building with two storage tanks T-201/T-202, two larger
  receivers R-211/R-212, an air receiver D-202 and a flare knock-out drum D-203 on pads on grade.
  (Amended 2026-11-05: the hopper and silos became vertical vessels, P-67.) Reason: the pairs of exchangers carry three-way diverting valves, the
  adsorbers a four-way switching valve, the hopper the rotary feeder, and the outdoor tanks give
  lines that pass through the building wall (SW-PEN-2).
- `SW-PLANT-6` Outdoor area: the routing grid extends 60 ft beyond the east end wall at grade;
  outdoor lines run on sleepers (SW-PS-9 stanchions) and through the end wall in sleeves
  (SW-PEN-2); outdoor equipment stands on 6 in pads on grade and its tanks have caged ladders as
  SW-LAY-3. Reason: a tank farm is outside the process building in practice; a short run keeps the
  routing search bounded.
  (The adsorbers' skirts are 4 ft so their solids-inlet stacks, lengthened by the SW-LL-8 stubs,
  stay under the roof; the column's sample nozzle stands on the side away from its drain's valved
  tee branch; the coolers' water outlets are side nozzles, since a block, stub and globe below a
  bottom nozzle would reach the floor.)
- `SW-RK-7` Plant 2: a header's lane on the rack is 3 in wider each side than its largest branch
  flange, for the bodies of the branch valves that stand above the lane. Reason: the SW-LL-8 stubs
  put a second valve above every take-off, and a check valve's body is wider than its flanges.
  Amended (stage 9, routing): from 9 ft beyond the rack's east end outward (the 9 ft is the
  slot in which the lines leaving the rack's top fall to the band), through the end wall
  and across the outdoor area, horizontal runs lie at one elevation, a centreline of 12.5 ft
  (150 in) above grade, side by side as on a sleeper way, except within the end zone of their own
  equipment; the band crosses the end wall between its girts. There is no steel above them to
  hang from, so the stanchion of SW-PS-9 is allowed up to a pipe bottom of 14 ft from 6 ft west of
  the rack's east end outward (the end bay, where the lines fall to the band under a roof too
  high for a 20 ft rod near the ridge, and the outdoor area); further west its 10 ft limit
  stands, a hanger taking over above it. Reason: a sleeper way at grade would cross every
  walkway; one band at head height leaves the ground free, and at a single elevation no line
  runs under another, so every line in the band stands on its own post (a first cut with a
  60 in deep band stacked lines and left the upper ones unsupportable). In plant 2 the stubs on
  nozzles (vents, drains, instruments, samples) stand before any line is routed, so no line takes
  their room (a band line over the air receiver had, and its vent could not stand). A safety valve on a tap stands with its outlet square to the
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
  is an item of the line (kind `penetration`, loose) in the ground truth, and it sits round a
  straight piece of the line (a pipe or nipple) that runs through its whole length.
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
  SW-RT-3 clearance, no branch sits on the replaced length, and neither elbow would fall within
  6 in of a platform grating or of the building's wall line (SW-PEN-1/2: a sleeve needs a straight
  piece through it; amended 2026-11-06 when a floor sleeve was found round the end of a 45°
  elbow). Reason: two 45° elbows make a
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
  - sample points (SP): branch outlet, nipple, forged gate valve, nipple, three-way valve (its purge
    port carrying a one-end-threaded nipple, a threaded gate valve and a plug, SW-LL-8), nipple,
    swage to the threaded needle valve, nipple, needle valve, plug;
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
    valve; a cooling-water return has the same pair at the exchanger's outlet nozzle and a block
    and check at the header take-off (with the SW-LL-8 stubs a third valve there would reach the
    rafters);
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
  - the two sample points of a pump pair stand on the pair's common discharge line (the second
    pump's own line is a short jumper into it, with no room for instrument, relief and sample
    taps together), and one sample point stands on the column overhead;
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

## 65. Civil and concrete catalogue (`SW-CIV-*`)

Written 2026-11-23 at the owner's instruction: a catalogue of the concrete and civil work a plant
stands on, built from SmartWeld's own rules only, with plant 2 as the reference for what the
plants use (equipment pads, pump pads, rack pedestals, grout beds, the slab). As everywhere in
this document, no published table or code was consulted; where a rule lands near common practice
it was written from the reasoning given and not checked against anything (PROVENANCE P-72).
Every civil part carries its concrete volume, its formed area and its bar list, so a quantity
take-off reads straight from the catalogue.

- `SW-CIV-1` Materials. Concrete is one of two classes stated on the drawing: class A, compressive
  strength 3 ksi, for slabs, paving, curbs and fill; class B, 4 ksi, for footings, pedestals,
  pads, ring walls, piers and anything that carries steel or equipment. Density K-7. Reinforcing
  bars are "Grade 60" (minimum yield 60 ksi, a grade stated on the drawing as Grade 36 is for
  steel sections), designated `#n`: SmartWeld's own naming in which n is the bar diameter in
  eighths of an inch (so `#5` is 5/8 in), area π d²/4, weight per foot = area × K-1 (bars are
  carbon steel). Reason: two classes are enough for a plant: one for flatwork that carries
  little, one for everything that carries load; naming a bar by its diameter in eighths keeps
  the designation and the dimension the same number.
- `SW-CIV-2` Cover to the bars: 3 in where concrete is cast against earth, 2 in on a formed face
  that is buried or outdoors, 1.5 in on a slab or a pad top indoors. Reason: the bar is protected
  by the concrete between it and the wet side; earth is wettest and least controlled, a formed
  face is better, an indoor slab best.
- `SW-CIV-3` Spread footing under a column or pedestal. Plan: square, side B = roundup(√(1.1 P /
  q), 6 in), minimum 36 in, where P is the column load (kips, drawing) and q the allowable
  bearing (ksf, drawing; `SW-CIV-3a` default 3 ksf, a firm granular soil); the 1.1 carries the
  footing's own weight and the soil on it. Thickness t = roundup(max(12 in, projection), 3 in),
  projection = (B − pedestal side)/2: the load spreads at 45° from the pedestal face and reaches
  the bottom within the footing, so the footing works as a deep block and needs no bending or
  shear check. Bars: a bottom mat each way of `#5` at a spacing s = min(12 in, the spacing that
  gives 0.2 % of the gross section b·t), ends hooked 90° (a hook adds 12 d to the bar's length,
  `SW-CIV-3b`), on 3 in cover (SW-CIV-2). Reason: 0.2 % holds shrinkage cracks closed and gives
  the block some ductility; 12 in is the widest spacing that still makes a mat.
- `SW-CIV-4` Pedestal. Plan: the base plate (SW-BP-1) plus 6 in each side, rounded up to 2 in,
  minimum 12 in square; so the anchor rods (set 1.5 in in from the plate edge, SW-BP-3) have 7.5
  in of concrete beyond them, more than 6 d for the rods of SW-AR-1. Height stated (6 in above the
  slab for the rack, SW-RK-4; to the top of a footing outdoors). Bars: one `#5` vertical at each
  corner and one per further 12 in of side, hooked into the footing; `#3` ties at 12 in with the
  first tie 3 in below the top. Reason: the pedestal is a short column; the ties hold the
  verticals and confine the concrete round the anchor rods.
- `SW-CIV-5` Equipment pad (a housekeeping pad on the slab). Plan: the equipment's base plus 6 in
  each side, as plant 2 places them (a vessel's base ring plus 18 in, a pump's baseplate plus 6
  in; SW-LAY-2); height 6 in, 9 in under pumps. Bars: `#4` at 12 in each way at mid-height; `#4`
  dowels at 24 in round the perimeter, 6 in into the slab and 4 in up into the pad. Reason: a pad
  keeps base plates and grout above wash-down water; the mesh controls shrinkage; the dowels tie
  the pad to the slab so it cannot walk.
- `SW-CIV-6` Slab on grade. Thickness stated (6 in, SW-BLD-3), class A, `#4` at 18 in each way at
  mid-depth, on a 6 in compacted granular base (not modeled); a thickened edge 12 in wide and 12
  in deep along the building line with two `#5` continuous. Reason: a 6 in slab on a prepared base
  carries wheeled plant traffic; the thickened edge carries the wall line and the door jambs.
- `SW-CIV-7` Octagonal foundation for a skirt-supported vessel (SW-EQ-1). Pedestal: a regular
  octagon of across-flats width = base ring OD + 12 in, height stated, top 6 in above grade
  (the pad height of SW-LAY-2 where the vessel stands indoors on the slab); the anchor rods of
  SW-EQ-1 are cast in it. Footing: an octagon whose across-flats width comes from bearing as
  SW-CIV-3 with P = the vessel's operating weight (drawing: empty steel + contents, water-full if
  not stated, the catalogue taking the vessel's shell volume), minimum = pedestal + 24 in, and its
  thickness as SW-CIV-3. Bars: footing mat as SW-CIV-3; pedestal verticals `#6` at 12 in round the
  perimeter in one ring, `#4` ties at 12 in. Reason: an octagon is the closest shape to the round
  base ring that straight forms make; the vessel's whole weight goes to the ground through it.
- `SW-CIV-8` Ring wall under a flat-bottom tank (SW-EQ-5). A concrete ring centred under the
  shell, width 12 in, height 42 in: 36 in below grade and 6 in above so the bottom plate stays dry;
  inside the ring a 3 in sand cushion on compacted granular fill (not modeled). Bars: hoop bars
  `#5`, count = roundup(T / (0.6 · 60 ksi · A_#5)), minimum 4 (two top, two bottom), where the
  hoop tension T = ½ p H R (the fill's pressure grows from nothing at grade to p at the bottom,
  so the force on the wall is the triangle's area times the radius), p = 0.3 γ H the lateral
  pressure at the bottom of the ring (γ the fill's unit weight, drawing; `SW-CIV-8a` default 120
  lb/ft³), H the height below grade and R the ring's mean radius; `#4` verticals at 12 in. Reason: the ring carries the shell line load
  and holds the fill, which pushes outward like a silo's contents; 0.6 of yield leaves a margin.
- `SW-CIV-9` Drilled pier. Diameter D stated (minimum 18 in). Length L = max(10 ft, 1.1 P / (q_b
  · π D²/4 + f · π D)), with P the load (kips), q_b the allowable end bearing (ksf, drawing;
  `SW-CIV-9a` default 10 ksf) and f the allowable side friction (ksf; `SW-CIV-9b` default 0.5
  ksf). Cage: `#6` verticals, one per 6 in of circumference, minimum 6, full length; `#3` spiral
  at 6 in pitch; 3 in cover. Reason: the pier takes the load to a firmer stratum below; counting
  friction at a modest value keeps the length honest.
- `SW-CIV-10` Grade beam between footings or piers under a wall line: width 12 in, depth 24 in
  unless stated, two `#5` top and two bottom, `#3` stirrups at 12 in. Reason: a beam of twice its
  width spans the usual 20 to 25 ft bay with the wall's weight.
- `SW-CIV-11` Grout bed: 1.5 in (SW-BP-5) of non-shrink cementitious grout under every base plate
  and base ring, plan = the plate plus 1 in each side, edges chamfered at 45°. Density K-7.
  Reason: a plate is set on levelling nuts and the gap filled; the extra inch gives the trowel an
  edge to work to.
- `SW-CIV-12` Curb: 6 in high, 6 in wide, class A, one `#4` continuous, at door openings and
  where a slab edge meets a lower floor. Paving: 4 in class A with `#4` at 18 in each way, on
  grade outdoors under equipment access. Reason: a curb stops wash-down water and wheel loads at
  the edge; 4 in of paving carries light wheels.
- `SW-CIV-13` Trench and sump. Trench: inside width and depth stated (default 18 × 24 in), walls
  and bottom 6 in, `#4` at 12 in each way in each, with a grating cover (SW-GR-*) on an `L2x2x1/4`
  frame cast flush with the slab (the angle from the structural catalogue). Sump: inside stated
  (default 24 × 24 × 24 in), walls and bottom 8 in, `#4` at 12 in. Reason: a trench carries drains
  under the floor with its cover walkable; a sump collects them for a pump.
- `SW-CIV-14` Containment dike round tanks: a wall whose height H holds 1.1 × the largest tank's
  volume within the diked plan less the tanks' footprints, minimum 18 in, maximum 72 in; wall 8
  in thick, class B, `#4` at 12 in each way at mid-thickness, on a footing 24 in wide and 12 in
  deep with two `#5`. Reason: the dike must hold the largest spill plus rain; a wall over 6 ft
  blocks the view of the tanks and is a berm instead.
- `SW-CIV-15` Quantities. Each civil part reports: concrete volume (the drawn solid; the bars'
  displacement is ignored), concrete weight = volume × K-7, formed area (every face of the solid
  that is not the top and not cast against earth), and a bar list (designation, count, length,
  weight = count × length × area × K-1). The part's weight is the concrete plus the bars.
  Reason: these are the three quantities a civil contractor prices.
- `SW-CIV-16` Pipe and conduit sleeves through concrete are the penetration sleeves of SW-PEN-1
  and are items of the line, not of the civil catalogue; anchor rods are SW-AR-*. Reason: each
  belongs to the discipline that sets it.

## 66. Equipment catalogue (`SW-EQC-*`)

Written 2026-11-23 at the owner's instruction, alongside §65: the equipment envelopes of §25 are
kept and extended to a catalogue of the equipment a process plant has, with the parts a pressure
vessel carries. Every item is a true-scale envelope from stated principal dimensions, proportioned
by the rules here; internals are not modeled unless a rule says so; weights are the drawn steel
(SW-EQ-7). No published table was consulted (PROVENANCE P-72).

Parts a pressure vessel carries:

- `SW-EQC-1` Nozzle: a neck of pipe of the stated size and class (SW-PIPE-*) projecting 8 in from
  the shell unless stated, a weld-neck flange of the vessel's class at its end (SW-FLG-*), and for
  a nozzle of 3 in or larger a reinforcing pad of the shell's thickness and twice the neck's
  outside diameter round the opening. Reason: the pad gives back the metal the opening removed;
  8 in clears insulation and the flange's bolting.
- `SW-EQC-2` Manway: a nozzle as SW-EQC-1 of 20 or 24 in (stated), projecting 10 in, closed by a
  blind cover (SW-FLG-*) carried on a davit: a 1.5 in round bar post welded to the shell beside
  the manway, rising 12 in above the cover's top bolt, with an arm reaching the cover's centre.
  Reason: a cover of this size is swung aside, not lifted.
- `SW-EQC-3` Lifting lugs: two plate lugs, 180° apart, at the top tangent line of a vertical vessel
  (on the shell) or above each saddle of a horizontal one. Plate thickness = max(3/4 in, the
  shell's), hole diameter d_h = roundup(1 + W / 40, 1/8 in) in, W the empty weight in kips; lug
  width 4 d_h, height above the shell 3 d_h, corners rounded to d_h. Reason: the shackle pin bears
  on the hole; the plate round the hole is two pin diameters each side, which keeps the plate's
  tear-out and bearing well below its strength for a shackle sized to the weight.
- `SW-EQC-4` Legs for a small vertical vessel (ID ≤ 48 in): four round legs `HSS{OD}x1/4` with
  OD = roundup(max(3 in, ID/12), 1/2 in), at the shell on a 0.9 ID circle, each on a `PL1/2`
  8 × 8 in base plate with one anchor rod; leg length = the stated bottom-head clearance + the head
  depth. Reason: below 4 ft diameter a skirt costs more than four legs and hides nothing worth
  hiding.
- `SW-EQC-5` Support lugs for a vessel carried on steel: four gusseted brackets as SW-EQ-6 but
  with a `PL3/4` base 8 × 8 in bearing on the beams, at the stated elevation. Reason: the same
  bracket that carries a platform carries the vessel when the steel carries the vessel.
- `SW-EQC-6` Insulation support rings: a `L2x2x1/4` ring round the shell at 10 ft spacing from
  the bottom tangent line on an insulated vessel, and one 6 in below the top tangent line.
  Reason: insulation on a vertical shell slides unless it rests on something every storey.
- `SW-EQC-7` Davit for a tall vessel's top head: a 4 in pipe post 60 in high with a 48 in arm,
  on the top head beside the top manway or nozzle. Reason: lifts relief valves and internals
  without a crane. The arm swivels on its post: where a column states an angle (SW-EQC-9) the
  post stands at that angle about the column's axis and the arm is swung radially outward
  (added 2026-11-24).

Equipment items (each `make…` takes the stated dimensions; what is not stated follows the rule):

- `SW-EQC-8` Electric motor: stated frame diameter D over the fins, length 1.6 D (fan cowl 0.35 D,
  stator 1.0 D, drive-end bell and bearing boss 0.25 D), shaft centreline 0.62 D above the
  underside of its feet, shaft stub 0.15 D diameter projecting 0.4 D; the frame's parts by
  SW-DET-9 (amended 2026-11-23 from a plain cylinder on a foot box). Reason: the proportions of a
  totally enclosed fan-cooled frame, written from the reasoning that the fan cowl adds about a
  third of a diameter to the stator's length and the feet lift the frame clear of its base.
- `SW-EQC-9` Column: SW-EQ-1 with stated tray count and spacing (trays are data, not solids), a
  top davit (SW-EQC-7), lifting lugs (SW-EQC-3) and insulation rings (SW-EQC-6) where insulated.
  The davit's post stands at half the radius: on the −x side with the arm across the head, or,
  where an angle is stated, at that angle with the arm swung outward (added 2026-11-24). Reason:
  a column piped from the centre of its top head needs the arm clear of the overhead line; it
  is the same davit turned on its post.
- `SW-EQC-10` Reactor: SW-EQ-1 with a shell thickness of max(stated, ID/48) and a bottom
  catalyst-dump nozzle (SW-EQC-1) on the bottom head. Reason: a reactor runs at the highest
  pressure in the plant; ID/48 is the thickness at which the shell's own weight starts to matter.
- `SW-EQC-11` Air cooler (fin-fan): a tube bundle box of stated width W, tube length L and depth
  24 in, with 12 in header boxes at each end, on a plenum 0.5 W deep carrying n fans (stated) of
  ring diameter 0.9 W/n, on four columns `W6` of stated height with an `L3x3x1/4` brace each side;
  fan motors by SW-EQC-8 of 12 in frame below the plenum. Reason: envelope of a forced-draught
  bank; the fan ring fills the bay it serves.
  Amended 2026-11-27 (owner's decision, P-95): each brace runs on its work line from the base
  of one column to the top of the other along the tubes, its heel on that line and its legs
  below it as before, and its foot is cut level with the column bases, so that nothing of the
  angle reaches below the plane the columns stand on. The brace's section, its work line and
  its top end are unchanged. Reason: an angle whose legs hang below a work line that starts at
  a column's base passes under that base until its 3 in leg has risen clear, and so into
  whatever the cooler stands on; the cut is where its foot bears. On a bay 32 ft long on 2 ft
  columns the brace falls 3 in below the bases at the column and the cut runs 45 in along it
  (5.2 lb a brace); on the catalogue's 20 ft bay on 10 ft columns, 5.4 in (0.6 lb). An
  independent clash check of plant 3 found both braces of every air cooler bay (33 bays) 3.16
  in into the W12x40 girders of the deck the bays stand on (SW-CELL-4). Plants 1 and 2 have
  no air cooler.
- `SW-EQC-12` Centrifugal compressor package: a skid `PL1` of stated plan on a 12 in pad (SW-CIV-5
  with 12 in height); the casing a cylinder of stated diameter D and length 1.2 D along the
  shaft; a gearbox box 0.8 D cube; the motor by SW-EQC-8 of stated frame; a lube console box
  36 × 24 × 48 in beside the skid. Reason: envelope only. The shaft stands high enough for the
  casing as well as for the motor: no lower than the end covers' radius (D/2 + 1.5 in) and
  1 in above the skid's top; where that is higher than the motor's own shaft height, the motor
  stands on a sole plate of the difference, under its feet (amended 2026-11-27: with the
  shaft set by the motor alone, a 34 in casing on a smaller motor stood with its end covers
  through the skid and 0.76 in into the pad, found by the plant's clash audit; a casing no
  larger than its motor's shaft height allows is drawn as before).
- `SW-EQC-13` Reciprocating compressor: a frame box of stated length and 0.5 length wide, 0.6
  length high, with two horizontally opposed cylinders of stated bore B as cylinders of 2 B
  diameter and 3 B length, and a motor by SW-EQC-8 in line. Reason: envelope only.
- `SW-EQC-14` Blower (centrifugal fan): a scroll casing of stated wheel diameter D drawn as a
  cylinder of 1.4 D diameter and 0.5 D width with a rectangular outlet 0.5 D × 0.4 D tangential at
  the top, an inlet cone of 0.6 D at the side, on a pedestal box, with a motor by SW-EQC-8 beside
  it on a common base `PL1`. Reason: envelope of a backward-curved fan.
- `SW-EQC-15` Fired heater (vertical cylindrical): a radiant shell of stated diameter D and height
  H on four `W8` legs 8 ft high with a floor plate; a convection box 0.6 D square and 0.4 D high
  on top; a stack of 0.3 D diameter and stated height above the convection box. Burners are data.
  Reason: envelope only.
  Amended 2026-11-27 (P-95; drawn only where a plant gives the heater its gas connections, the
  catalogue's own drawing otherwise unchanged): under the floor, the burners' gas piping. Each
  gas a plant brings in has a ring of its connection's own pipe, level, about the heater's
  axis at the height of its connection, and from the ring a riser of the same pipe straight up
  into each of the four burners, whose bottom is closed by a 3/8 in plate the risers end on.
  The fuel gas ring is on the burners' circle (0.3 D). Where a waste gas is burned as well, its
  ring is 12 in below the fuel gas ring, and the two rings stand off the burners' circle, the
  fuel gas's outward and the waste gas's inward, each riser wholly within the burner's bore
  1/8 in from its wall (the two risers then at least 1/4 in apart, or the heater cannot take
  both gases and stops the unit with an error). Reason: a heater's gas connection is the inlet
  of the manifold that feeds its burners; drawn without it, the plant's connection flanges
  stood under the floor with nothing behind them (an independent check of every nozzle found
  all the heaters' gas connections so). A ring on the burners' circle lets each riser go
  straight up; a second ring lower, inside the first, keeps each gas's neck and risers clear
  of the other gas's ring.
- `SW-EQC-16` Agitated tank: a vertical vessel (SW-EQ-1, or flat-bottomed as SW-EQ-5 when stated
  on legs by SW-EQC-4) with a top-mounted agitator: a motor (SW-EQC-8) on a gearbox box 0.8 D
  cube over a 6 in nozzle at the centre, a shaft of 0.08 ID diameter down to 0.3 ID above the
  bottom tangent line, and an impeller of three flat blades of 0.33 ID span and 0.08 ID width.
  Reason: the drive and impeller are equipment, not internals, and set the nozzle's size.
- `SW-EQC-17` Filter (vertical, quick-opening): a vertical vessel on legs (SW-EQC-4) whose top
  head bolts to the shell through a pair of flanges of the shell's size (SW-FLG-*), with the
  head carried on a davit (SW-EQC-7, post 36 in). Reason: the element is changed from the top.
- `SW-EQC-18` Dust collector (baghouse): a housing box of stated plan W × L and height H on four
  `W6` legs of stated height, a pyramidal hopper below the housing at 60° to a square outlet of
  stated side, a clean-air plenum box 24 in high on top with the outlet nozzle, and a rotary
  feeder (SW-VLV-ROTARY) at the hopper outlet. Reason: envelope only; 60° keeps dust moving.
- `SW-EQC-19` Cyclone: a cylinder of stated diameter D and height 1.5 D over a 60° cone to an
  outlet of 0.25 D, a tangential inlet box 0.5 D × 0.2 D at the top of the cylinder, a vortex
  finder pipe of 0.5 D projecting 0.5 D above the top plate, on four lugs (SW-EQC-5). Reason: the
  proportions of a high-efficiency cyclone, written from the reasoning that the inlet area is
  about a tenth of the body area.
- `SW-EQC-20` Screw conveyor: a U-trough of stated screw diameter D (trough inside width D + 1 in,
  depth 1.1 D, plate 3/16 in) and length L with a flat cover, a screw of pitch D on a pipe shaft of
  0.2 D (SW-PIPE), a drive by SW-EQC-8 at the discharge end, hanger bearings and saddle supports
  on `L3x3x1/4` legs at 10 ft. Reason: a screw of pitch equal to its diameter is the common
  proportion for free-flowing solids.
- `SW-EQC-21` Bucket elevator: two casing legs of stated section W × 0.5 W and height H, a boot
  box 2 W × W × 1.5 W at the bottom with an inlet, a head box 2 W × W × 2 W at the top with a
  discharge spout and a drive by SW-EQC-8; the belt and buckets are not modeled. Reason: envelope.
- `SW-EQC-22` Silo with a cone bottom: a shell of stated diameter D and height H, a 60° cone to an
  outlet of stated size, on a skirt as SW-EQ-1 reaching from the cone's outlet level to the base
  (so the outlet stands at the stated height), a top plate with a 20 in manway and a vent nozzle.
  Reason: a cone-bottom silo discharges by gravity; the skirt carries it as a vessel's does.
  Its ladder (where it has one) stands a quarter turn from the skirt's opening, not in front of
  it (amended 2026-11-27: in front of the opening, its rails touched the flange of the outlet
  connection made through the opening and the valve bolted to it, by 0.03 in, at both
  catalyst hoppers of the cracking unit, found by the plant's clash audit). Reason: the
  opening is where the outlet's piping leaves the skirt; the ladder is climbed from the side.
  Amended 2026-11-27 (P-95; drawn only where a plant gives the silo the connections that leave
  through the skirt's opening, the catalogue's own drawing otherwise unchanged): the skirt is
  cut at its opening as SW-EQ-1's skirt is, in three pieces (below, at and above the opening),
  its cut edges at the sides on lines through the axis. The opening faces the silo's local +x;
  it is 36 in high with its sill 24 in above the base, and its width (across its centre line,
  at the skirt's outer face) is twice the larger of 12 in and, for each connection through it,
  the distance of its axis from the centre line plus half its pipe's outside diameter plus
  3 in, taken up to the 6 in module: 36 in for the cracking unit's catalyst hopper (a 3 in and
  a 2 in connection 12 in either side of the centre line), 24 in with no connections, the
  width drawn before. The plate is cut 3/8 in larger all round, and a frame of `PL3/8` bars
  3 in deep, from 2 in inside the skirt's outer face to 1 in outside it, fills that margin: a
  sill and a head bar curved to the skirt, each reaching across the whole cut, and a straight
  jamb bar at each side between them, its outer face on the plate's cut edge; bar and plate
  edge to edge, and bar to bar. Each connection's pipe passes the frame 3 in clear at least,
  or the silo cannot take it and stops the unit with an error. Where connections leave
  through the opening, the silo's own outlet is drawn inside the skirt, from the silo's sizes
  and the connections' sizes and places, which the plant gives it (each connection's size and
  class, its axis's height above the base and its distance from the opening's centre line):
  a spout of the outlet's size down the axis from the foot of the cone; a concentric reducer
  to the first connection's size; a pick-up tee of that size on the axis at the connections'
  height, its outlet up into the reducer and its run square to the opening's centre line;
  from each end of the run a pipe of its connection's size (a concentric reducer first where
  that connection's size differs from the tee's) to a 90° elbow whose corner lies on its
  connection's axis in the silo's centre plane (the plane through the axis square to the
  opening's centre line); and from each elbow a straight leg out through the opening,
  parallel to its centre line, ending 1 in outside the skirt (the frame's outer face, R + 1
  from the axis), where the plant's nozzle begins. A single connection, on the centre line,
  is turned out under the reducer by its elbow alone, the elbow's corner on the axis. The
  spout, the first reducer and the tee are of the first connection's class, each branch of
  its own; every piece is the catalogue's own pipe and fittings at their own sizes
  (SW-PIPE-2..4, SW-FIT-1..3), and where they do not fit between the cone and the
  connections (two connections on one side of the centre line, more than two, or a branch
  too short for its fittings) the unit stops with an error. Reason: a silo on a skirt empties down its axis;
  a connection ended on the skirt would put the catalyst line against plate with no way
  through. The frame drawn before was a closed skin over an uncut skirt, and the plant's
  two necks at the cracking unit's catalyst hopper ended short of it (0.99 in on their axes;
  0.8 to 1 in across their walls, and 2.2 to 2.4 in where a wall passed the frame's edge to
  the skirt), with nothing behind them that was the silo's outlet; the outlet belongs to the
  silo and must be drawn, or the connection stands in the air. The frame's outer face and its middle stay where they
  were, so the connections' faces and the routes laid to them do not move.
  Amended the same day (for every silo, the owner's decision on the catalogue's own drawings):
  the skirt's top is cut level where its inside face meets the cone's outside, 0.375 tan 60° =
  0.65 in below the cone's rim, leaving the groove for its weld at its outer edge. Reason: run
  up to the rim, the skirt plate stood 0.19 in up inside the cone's wall all round.
- `SW-EQC-23` Vertical sump pump: a motor (SW-EQC-8) on a mounting plate `PL1` of stated plan at
  grade, a column pipe of stated size and length down into the sump, a bowl cylinder of 2 × the
  column's diameter and 1.5 × its diameter long at the bottom, a discharge pipe elbowing up beside
  the column to a flange at grade. Reason: envelope only.
- `SW-EQC-24` Double-pipe (hairpin) exchanger: two hairpins of stated inner and outer pipe sizes
  and leg length, legs 12 in apart on centres joined by return bends of the outer pipe, on two
  `L3x3x1/4` cradles. Reason: envelope only.
- `SW-EQC-25` Plate exchanger: a pack of stated plate count at 1/8 in pitch between two frame
  plates `PL2` of stated width and height, on four tie rods `RD1`, with four nozzles on the fixed
  frame, on two `C6` feet. Reason: envelope only.
- `SW-EQC-26` Hopper (for a feeder stand-alone, SW-EQ-8 withdrawn for the rotary valves): kept in
  the catalogue as an item, not placed in either plant. Reason: the owner's instruction concerned
  the plants' rotary valves, not the part.

## 67. Realistic review images (`SW-REN-4..10`)

Written 2026-11-23 at the owner's instruction ("this needs to be more hyper realistic"). The images
stay SmartWeld's own renders (SW-LIC-2): the renderer of §56 gains a second shading style, `photo`,
written from the physics of light on a surface. Geometry is never altered for appearance (SW-U-5):
realism comes from light, finish and the real detail of §68. The flat style of SW-REN-1 stays for
the plan-like sheets.

- `SW-REN-4` Finishes. Every solid has a finish: a base colour, a roughness from 0 (mirror) to 1
  (matt), whether it is bare metal, and a texture. By role: structural steel, pipe, equipment,
  castings, cladding and doors are painted (not metal; roughness 0.45 to 0.7); hardware is zinc
  plated and closures and stems stainless (metal, roughness 0.25 to 0.45); welds are bare weld
  metal; concrete and grout are matt (0.95) with the concrete texture; reinforcing bars are bare
  dark steel; gratings, handrail-like parts and conveyor troughs are galvanised (metal, 0.5, spangle
  texture); insulated vessels wear an aluminium jacket; motors and driven machines a machinery
  blue; davits, guards and lifting lugs safety yellow. Structural gratings, stair treads, ladder
  cage hoops, cold-formed purlins and girts and bracing rods are galvanised whatever their role.
  A solid may name its finish; else its role gives it. Reason: a plant looks as it does because of
  what each surface is made of.
  The catalogue images of every discipline use this style: the structural sections, plates,
  hardware and welds and the valves (stages 1 and 4), the civil and equipment catalogues (stage
  10, civil parts cut by SW-REN-10), the piping catalogue as plant 2 uses it, one part of every
  family (stage 11), and structural and piping assemblies as built in plant 2, taken from the
  plant by tag or by line: a rack bent, a portal frame, the stair tower, platforms, a control
  station, a pump's piping, an instrument manifold, a hose station, a relief valve (stage 12). The structural and piping parts' geometry is unchanged by this: they are the
  parts the two plants and their ground truth are built from.
- `SW-REN-5` Light. A sun (the viewer's direction), a sky dome and the ground: direct light on a
  surface is the sun's by the cosine of its angle, cut where another surface stands between it and
  the sun (a depth map drawn from the sun, softened over neighbouring samples); indirect light is
  the sky's colour from above and the ground's from below by where the surface faces, reduced in
  corners and contacts by how much of its surroundings other surfaces block (ambient occlusion,
  measured in the depth buffer round each sample). Reason: shadows and contact shading are what
  tell the eye that a part stands on something.
- `SW-REN-6` Surface. Curved surfaces are shaded smoothly: a vertex takes the area-weighted mean
  of the faces round it that lie within 40° of each other, so a cylinder is round and an edge
  stays an edge. A highlight follows the finish's roughness (a microfacet lobe); every surface
  reflects the sky dome by Fresnel's law, metals in their own colour and coatings at 4 % rising
  toward grazing. Reason: these are what make steel look like steel and paint like paint.
- `SW-REN-7` Ground. Scenes without a floor of their own (catalogue entries, single items) stand
  on a ground plane at their lowest point, matt, catching their shadows and fading into the
  background with distance. Plants stand on their own slab. Catalogue entries are shown the way
  up they stand in a plant.
- `SW-REN-8` Texture is colour only, computed from position (three-dimensional value noise):
  concrete has aggregate speckle, trowel variation and broad tonal drift; galvanising has spangle;
  paint a slight variation. No texture moves a surface (SW-U-5).
- `SW-REN-9` Tone. Light is summed in linear units, mapped by a filmic curve and encoded with
  gamma 2.2; the background is the sky dome; edges are smoothed by supersampling.
- `SW-REN-10` Cutaway. A view may cut a part by a plane: a valve on its stem plane, or the concrete
  of a civil part with its bars and embedded steel left whole, to show what is inside. The cut face
  is closed in the part's own material wherever the cut passes through solid: a point of the plane
  is inside the part when the line of sight beyond it crosses the part's surface an odd number of
  times, so a hollow body shows its hollow and a solid block its face.

## 68. Detail on civil parts and equipment (`SW-DET-*`)

Written 2026-11-23 with §67. A detail is a part the real item has, at its true size, from a rule
here; nothing is decorative. Weights include the drawn detail (SW-EQ-7, SW-CIV-15).

- `SW-DET-1` Reinforcing bars are drawn: every bar of a civil part's bar list is a solid of its
  true diameter in its true place, at the cover of SW-CIV-2, hooks as a 90° bend of 12 d (SW-CIV-3b)
  on a bend radius of 3 d; ties, stirrups and hoops as closed loops; spirals as helices. The
  drawn bars equal the bar list in count. Their weight is the bar list's, not counted twice.
- `SW-DET-2` Chamfer: every exposed concrete edge above grade or above the slab (pad, pedestal
  top, octagonal pedestal top, ring wall top, curb, dike wall top, sump and trench rims) has a
  3/4 in chamfer. Reason: a sharp concrete arris spalls; forms carry a chamfer strip.
- `SW-DET-3` Anchor rods are drawn where a civil part carries steel: on a pedestal, the four rods
  of SW-BP-3 at the plate's corners; on an octagonal pedestal, the vessel's rods (SW-EQ-1) on the
  base ring's bolt circle; each projecting by SW-AR-3 with its nut and plate washer (SW-B-3,
  SW-BP-4) and embedded by SW-AR-2.
- `SW-DET-4` Covers and frames: a trench's grating cover is drawn bar by bar (SW-GR-1) on its
  `L2x2x1/4` frame; a sump has the same frame and cover.
- `SW-DET-5` Bolting on equipment: every flanged joint drawn on equipment (nozzle flange with its
  blind or cover, a filter's body flanges, a manway cover) carries its studs and nuts, the count
  and diameter from the flange (SW-FLG-*), each stud = joint thickness + two nuts + two thread
  pitches of d/8 each end, nuts by SW-B-3. A nozzle left open for piping carries none: the line's
  studs belong to the line (SW-STD-*).
- `SW-DET-6` Vessel seams: a pressure shell is made of rolled courses 96 in long (the last
  shorter), so a circumferential weld seam stands at each course joint and at each head; each
  course has one longitudinal seam, turned 90° from the next course's. A seam is a weld cap
  1/8 in proud and 2 t + 1/4 in wide. Reason: plate comes 8 ft wide; staggering the long seams
  keeps them from lining up.
  Amended 2026-11-27 (plant 3, P-95; with no connections given, the layout is as before): where
  a plant sets its own connections on a shell, the course joints between its two end seams are
  laid clear of them. No circumferential seam's centre stands nearer a radial connection's
  axis, along the shell, than the neck's outside radius, the shell's thickness (the nozzle's
  own weld), half the seam's width and 1 in. The joints are taken from the first end on, each
  at the farthest place within 96 in of the one before that is so clear, and at least 12 in
  from it; the longitudinal seams are laid course by course as before. On a storage tank,
  whose courses are fixed from its bottom, each course's vertical seams are turned about the
  axis together by the least angle (in quarter degrees) that keeps each clear of the
  connections on that course by the same margin, measured round the shell. Reason: the courses
  were laid every 96 in from the tangent line before any connection was placed, so a seam's
  raised cap stood under a nozzle's neck at several places (an independent check through
  every neck's wall found them; the clash checks excuse a nozzle against its own item). A
  nozzle is not set on a seam: the seam is ground and examined where nothing covers it.
- `SW-DET-7` Vessel dressing (a catalogue vessel's standard connections, where a plant does not
  give its own nozzle schedule): top head centre nozzle of ID/8 rounded up to the size series
  (minimum 2 in); a side inlet of the same size at 0.75 TT; a 24 in manway at 30 in above the
  bottom tangent line for ID ≥ 36 in (20 in below 48 in ID); a pair of 2 in level connections
  at 0.2 and 0.6 TT on one generator; a 2 in drain at the bottom head centre and a 2 in vent
  beside the top nozzle; two lifting lugs (SW-EQC-3); a nameplate 8 × 5 in of 1/16 in stainless on a
  bracket standing 2 in off the shell 60 in above the base; an earthing lug `PL1/4` 2 × 3 in on the
  skirt. All nozzles by SW-EQC-1, 180° from the manway unless stated. Reason: these are the
  connections any vessel has; a catalogue item without them is a tank of unknown purpose.
- `SW-DET-8` Skirt and anchor chairs: the skirt's access opening has a `PL3/8` frame 3 in deep;
  two 4 in vent pipes pass the skirt 6 in below the head; each anchor rod has a chair: two
  `PL3/8` gussets 6 in high either side of the rod and a `PL3/4` top plate 4 × 4 in with the rod,
  nut and washer on it (SW-AR-*).
- `SW-DET-9` Motor: the frame carries axial cooling fins, n = round(π D / 1.5 in), each 0.08 D
  high and 3/16 in thick over the stator length 1.0 D; a drive-end bell dished 0.15 D; a fan
  cowl of 1.04 D diameter and 0.35 D long at the other end with an end grille of five concentric
  slots; a terminal box 0.3 D cube with a cable gland of 0.08 D; a lifting eye of 0.14 D on top;
  two foot rails with four bolt bosses; a shaft key d/4 square over 0.75 of the stub; a
  nameplate. Reason: the parts of a fan-cooled motor; the fin count gives fins about 1.5 in apart.
- `SW-DET-10` Rotating machines: a pump or blower casing is a volute, its radius growing
  linearly by 25 % round the wheel to a tangential discharge neck; suction and discharge end in
  flanges (SW-FLG-*); the bearing frame is a cylinder of 0.35 of the casing diameter on a foot;
  the coupling guard a half-round sheet cover (safety yellow); the baseplate has a 1 in rim and
  anchor bolts at its corners. Compressor casings carry suction and discharge nozzles on top.
  Reason: what the item is recognised by.
- `SW-DET-11` Exchanger and cooler detail: a shell-and-tube exchanger's channel and shell meet in
  a pair of body flanges with bolting; shell and channel nozzles two each; saddles have a web,
  two ribs each side and a base plate with two slotted holes at the sliding end. An air cooler's
  bundle is drawn with its side frames and rows of finned tubes as cylinders of 2 in at 2.5 in
  pitch on the top row, fan blades (four per fan, 0.45 of the ring diameter long), a fan guard
  ring, and inlet and outlet nozzles on the headers.
- `SW-DET-12` Fired heater, silo, cyclone, collector and conveyors: plate stiffeners
  `L3x3x1/4` round rectangular housings at 48 in; peep doors and burners on the heater's floor as
  8 in pipe stubs (four); a caged ladder (SW-LD-*) and a top handrail on a silo over 15 ft;
  inspection doors 18 × 24 in on housings; drive guards in safety yellow.
- `SW-DET-13` Tessellation: curved solids are drawn with at least 48 segments round and 64 for
  diameters over 48 in, so a curve reads as a curve at the scale of the images.

## 69. Process units, boiler equipment and storage tanks (`SW-EQC-27..44`)

Written 2026-11-23 at the owner's instruction (the equipment catalogue lacked an exchanger with its
tube bundle, cat cracker, coker and scrubber towers, flare stacks, columns with platforms and ladders
every 15 ft, the flue gas cooler, boiler drums and components, and above-ground storage tanks).
As §66: every item is a true-scale arrangement from stated principal dimensions, the rest by the
rule; the proportions are SmartWeld's own, written from the reasoning given, from no drawing,
licensor's design, standard or table, for the owner to tune from experience (PROVENANCE P-74).

Shared parts:

- `SW-EQC-27` Column platform: a ring platform round a vertical shell at a stated elevation, over a
  stated arc (default 270°), 36 in wide from 1 in off the shell: bar grating (SW-GR-1) on radial
  `L3x3x1/4` bearers at no more than 40° apart, each on a knee brace of the same angle back to the
  shell; a kerb plate 6 in deep on the outer edge with a 4 in toe plate above the walking surface;
  a handrail 42 in high of 1.5 in pipe posts at no more than 5 ft with a top rail and a mid rail,
  round the outer edge and across the closed end. Reason: a platform is where a manway, a valve or
  an instrument is reached; 36 in is room to work and pass.
- `SW-EQC-28` Column ladder: a ladder as SW-LD-* (rails 16 in apart, rungs at 12 in, 7 in off the
  shell) from each platform to the next, each run on the side opposite the one below, rising 42
  in past the upper platform; a cage (SW-LD-2) from 7 ft above the foot. Platforms stand no more
  than 15 ft apart (the owner's practice, 2026-11-23), so no run is longer than 15 ft.
- `SW-EQC-29` Lattice tower (a derrick, or the support of a flare): four legs of `L6x6x1/2` from a
  square base of stated half-width to a stated top half-width, in panels no taller than 1.2 × their
  width, each face with a girt `L4x4x3/8` at every panel point and X bracing `L3x3x1/4`.
  Reason: a square lattice carries wind from any direction; a panel taller than it is wide makes
  the braces too steep to work.
- `SW-EQC-30` Tube bundle: straight tubes of stated outside diameter d (default 3/4 in, wall d/9)
  on a triangular pitch of 1.25 d within a circle 3/4 in inside the shell; a stationary tubesheet
  ID/12 thick (minimum 1 in) of the shell's flange gasket diameter and a floating tubesheet 1/2 in
  smaller than the shell with a dished cover; segmental baffles `PL1/4` cut 25 %, alternately top
  and bottom, at 0.4 ID (minimum 8 in); four tie rods `RD1/2`. The baffles' tube holes are not
  drawn. Reason: a quarter diameter of ligament lets a tube be expanded into the sheet and
  cleaned between rows; the triangular pitch packs the most surface into the shell.

Items:

- `SW-EQC-31` Shell-and-tube exchanger with its bundle: SW-EQ-3 in the detail of SW-DET-11 with
  the bundle of SW-EQC-30 in place; catalogue images cut the shell and channel (SW-REN-10).
- `SW-EQC-32` Platformed column: SW-EQC-9 with platforms (SW-EQC-27) from the first manway level
  every 15 ft to the top tangent line, a top platform at the top head, ladders (SW-EQC-28), a
  manway at each platform and the davit at the top. The platforms cover 270° about the manways,
  or a smaller stated arc, with the ladders at its ends either way (added 2026-11-24).
- `SW-EQC-33` Cat cracker reactor and regenerator (side by side): the regenerator a vertical
  vessel of stated diameter Dg and tangent length on a skirt, its top a cone to a flue gas outlet
  of 0.25 Dg, an air inlet of 0.2 Dg in the bottom head; the reactor (disengager) of stated
  diameter Dr set higher, its bottom a cone at 60° to a stripper of 0.5 Dr diameter and 1.5 Dr
  long, its top head carrying the vapour outlet of 0.2 Dr; a riser of 0.15 Dg diameter rising
  beside the stripper from a wye at the regenerated-catalyst standpipe's foot and entering the
  reactor's side; two standpipes of 0.12 Dg diameter, inclined no flatter than 60° to the
  horizontal, each with a slide valve (a body box 2.5 pipe diameters long with a bonnet and
  actuator cylinder): spent catalyst from the stripper to the regenerator, regenerated catalyst
  from the regenerator to the riser wye. Both vessels carry manways and platforms; the reactor
  stands on a lattice tower (SW-EQC-29) with a ring of `W14` beams under its shell, reached by
  ladders with landings up the tower (SW-EQC-28). Cyclones, grids and linings are not drawn.
  Reason: catalyst is a solid that must slide, hence the 60°; the reactor stands above the
  regenerator's bed so spent catalyst runs down by its own head.
  Stated in place of the proportions, where a plant sets its own connections on the item
  (added 2026-11-25, for plant 3; without them the item is as above): the outside diameters
  of the flue gas outlet and of the air inlet line, which are then drawn without their
  flanges, the flue gas outlet as the open top of the regenerator's cone, and the vapour
  outlet's stub not at all; and a grid, to whose next multiple the distance between the two
  vessels' centres is raised, the riser standing on multiples of it from the regenerator's
  centre (30 in short of the reactor's along the line of centres, and across it the next
  multiple beyond the 6 in it keeps clear of the stripper); and the side of the line of
  centres the riser stands on, the riser, standpipes and slide valves then being the mirror
  image of the item as drawn; and the direction in which the air inlet line leaves the
  regenerator, an angle about its axis in place of the side away from the reactor, and
  the height above the item's base at which it runs out level, in place of 0.25 Dg below
  the bottom head (it must leave the line's own bend and 6 in under that head). Reason:
  a line bolts to a nozzle
  of its own size, and the process sizes the flue gas, air and vapour lines by their flows,
  not by the vessels' diameters (42, 20 and 24 in against stubs of 56, 44 and 28 in); and a
  connection on a vessel's axis can stand on a plant's layout grid only if the axis does.
- `SW-EQC-34` Coke drums (a pair) with their structure: each drum a shell of stated diameter D and
  tangent length, a top 2:1 head with a top flange of 0.25 D for the drill stem, a bottom cone at
  60° to a bottom flange of 0.25 D, on a skirt from the cone's rim to a table; the table a steel
  frame of six `W14` columns and beams at the skirts' base, its deck open under each drum; a
  cutting deck at the top heads; above each drum a derrick (SW-EQC-29) of height 0.8 × the tangent
  length with a crown platform; stair access is by the structure's ladder runs (SW-EQC-28).
  Inlet nozzles in the cones, vapour outlets on the top heads. Reason: the drum is emptied through
  its bottom and cut from the top, so it stands on a table with a derrick over it.
- `SW-EQC-35` Flare stack: a riser pipe of stated diameter and height; self-supporting on a flared
  base (as a stack's, SW-EQC-43: a cone from 1.5 × the riser diameter at grade to the riser over
  the lowest fifth of the height, on a base ring with anchor chairs), or, when stated, guided inside a lattice tower
  (SW-EQC-29); a seal drum section of twice the riser diameter and three diameters long below the
  tip; a flare tip of 1.2 diameters with a wind shield of 1.6 diameters and three pilots of 2 in
  pipe with their gas and ignition lines running down the riser; a ladder (SW-EQC-28) with rest
  platforms every 30 ft and a service platform below the tip. Reason: the flame must stand clear
  of everything; the flared base and anchor chairs carry the wind moment.
- `SW-EQC-36` Wet scrubber tower: a vertical shell of stated diameter D and height on a flat base
  plate, its bottom 0.2 of the height a liquid sump; a gas inlet duct of 0.5 D on the side above
  the sump, sloping down toward the tower; three spray levels above the inlet, each fed through a flanged nozzle
  of 4 in from an external riser of 6 in (the headers inside are not drawn); a mist eliminator
  section in the top fifth, between two support rings, with a wash header nozzle of 2 in below it; a top cone at 45° to an outlet stack of 0.5
  D; two recirculation pumps (SW-DET-10) at the base on the suction nozzle with their discharge
  riser; manways at the sump, each spray level and the eliminator; platforms and ladders as a
  column's. Reason: gas rises against sprayed liquid; droplets are caught before the outlet. The
  gas inlet duct may be given a stated outside diameter in place of 0.5 D; it is then drawn
  level, at the height its upper end would have had, and without its flange, for a plant's
  own nozzle to stand on its end; and the pumps, their riser and the spray nozzles may be
  given a stated angle about the tower in place of 90° (added 2026-11-25, for plant 3).
  Amended 2026-11-27 (P-95): a duct of stated outside diameter is drawn of the line's own
  pipe, with that pipe's wall, not of 1/4 in plate. Reason: the plant's nozzle on its end is a
  piece of that pipe (SW-NOZ-1); against the thin duct the neck's 0.97 in wall (36 in, class
  150) overhung the duct's bore, so that part of the neck's end met nothing, a ledge inside
  the bore of a joint that could not be welded. The duct's outside and its end are unchanged,
  so the nozzle's face and the line stay where they are.
- `SW-EQC-37` Flue gas cooler (a horizontal fire-tube waste heat exchanger with its steam drum):
  a shell of stated diameter and length with tubesheets and tubes of 2 in on a 1.25 pitch; inlet
  and outlet channels as cones at 30° from the duct diameter of 0.5 D; a steam drum of 0.6 D
  diameter and 0.8 of the shell's length above the shell on two saddles, joined to it by four
  risers of 6 in and two downcomers of 8 in; saddles, nozzles (feedwater, steam outlet, two safety
  valve nozzles, blowdown), manways in the channels and the drum. Reason: hot flue gas in the
  tubes boils water in the shell; steam separates in the drum above. A duct may be given a
  stated outside diameter in place of 0.5 D (its cone then runs at 30° to that), and may be
  left without its flange where a plant sets its own nozzle on it (added 2026-11-24).
- `SW-EQC-38` Steam drum: a horizontal drum of stated diameter and length with 2:1 heads, an
  elliptical manway 12 × 16 in in each head, a steam outlet and two safety valve nozzles on top,
  a feedwater nozzle, a row of riser stubs along the upper flanks and downcomer nozzles at the
  bottom, a continuous blowdown nozzle, and a water gauge column on one head. `SW-EQC-39` Mud
  drum: as the steam drum at 0.65 of its diameter, with tube stubs along the top, a blowdown
  nozzle at the bottom and one manway.
- `SW-EQC-40` Water-tube boiler (two drums): the steam drum above the mud drum at a stated centre
  distance, joined by a bank of generating tubes of 2 in at 4 in pitch along the drums in eight
  rows fanned between them, and by two external downcomers of 8 in at the ends; a furnace beside
  the bank enclosed by water-wall tubes of 3 in at 4 in pitch from the mud drum up over the roof
  to the steam drum; a casing of `PL3/16` with `C6` buckstays at 48 in round the furnace and bank;
  a burner front of two burners (SW-EQC-42); a gas outlet duct to an economizer (SW-EQC-41) and a
  stack (SW-EQC-43); a superheater header pair of 8 in pipe with its outlet nozzle; platform and
  ladder at the steam drum. Catalogue images cut the casing. Reason: water circulates down the
  cold downcomers and up the heated tubes by density alone.
  Amended 2026-11-27 (P-95): where a plant gives the boiler's steam line, the outlet header is
  of the next pipe size above that line, and 8 in at least, drawn round enough (48 sides) that
  a neck on it meets its true surface; its supports reach to its underside. Where the plant
  brings the feed water to the economizer's inlet, that inlet's flange is not drawn (the
  plant's own connection stands there) and the header's end there is closed by a plate in its
  bore, flush with the pipe's end and as thick as the header's drawn wall, on which the
  connection's neck stands. Reason: a 10 in steam line's neck stood on the 8 in header, wider than the pipe it
  was welded to; and the 4 in feed water neck on the 6 in header's open end would have stood
  inside its bore, touching no metal.
- `SW-EQC-41` Economizer: a casing box of stated plan and height with a serpentine coil of 2 in
  tubes at 4 in pitch (return bends outside the casing in header boxes), inlet and outlet headers
  of 6 in pipe. `SW-EQC-42` Burner: a register throat of stated diameter d in a windbox 2 d
  square and d deep, a gas ring of 2 in pipe, an air duct stub d wide, a sight port and igniter
  stub. `SW-EQC-43` Stack: a self-supporting steel stack of stated diameter and height, the bottom
  fifth flared to 1.5 diameters, a breeching inlet of the diameter × 1.2 high, stiffening rings
  at 96 in, a ladder with rest platforms, a sampling platform at 0.8 of the height and a rain cap.
- `SW-EQC-44` Above-ground storage tanks. Fixed cone roof: SW-EQ-5 in detail: shell courses 96 in
  high with their seams, a bottom plate projecting 2 in, a top curb angle, the cone roof, two
  shell manways 24 in, inlet, outlet and drain nozzles, a roof manway, a gauge hatch and a
  gooseneck vent of 6 in at the roof centre, a spiral stair (rise 8 in, going 10 in, 30 in wide,
  with a handrail) to a gauger's platform at the roof edge and a rim handrail. External floating
  roof: an open-top shell with a wind girder walkway `PL1/4` 30 in wide 42 in below the top, a
  pontoon roof (an annular pontoon 0.1 D wide and 24 in deep round a single deck) floating at
  0.8 of the height, a rim seal, a rolling ladder from the gauger's platform to the roof, roof
  drain and legs, and the spiral stair. Reason: a fixed roof keeps rain out of a low-vapour
  stock; a floating roof rides on the liquid so no vapour space forms. The spiral stair's
  stringers are cut level at the floor it starts from (amended 2026-11-27: each stringer
  plate was drawn whole at its slope, and the first ones reached 3 in below the tank's
  bottom into its pad, found at five tanks by the plant's clash audit).

## 70. Piping specials (`SW-PSP-*`) — catalogue items only

Written 2026-11-23 at the owner's instruction: a comprehensive catalogue of 3D items, with nothing
that affects the isometric generator or plant 2. These parts are catalogue items: they are not in
the plants, the line lists, the ground truth or the PCF mapping (§58), and instrument tags are
out of scope (they belong to the P&ID). In-line items lie along z from one end face to the other;
flanges, pipe and bolting by SW-PIPE-*, SW-FLG-*. Proportions are SmartWeld's own, from the
reasoning given, for the owner to tune (PROVENANCE P-75).

  Amended 2026-11-27 (P-95): a tank's round shell, bottom, curb, roof, girder and pontoon are
  drawn with sides no longer than 8 in (96 sides at least), so that the drawn shell lies within
  0.02 in of its true circle whatever the tank's size. Reason: an 80 ft tank drawn with 96
  sides stood up to 0.26 in inside its circle between corners, and a connection's neck, set on
  the true circle, stopped that short of the shell drawn.
- `SW-PSP-1` Y strainer (flanged): face to face 2 flange lengths + 2.5 OD; a cast body of 1.5 OD
  diameter; a screen pocket of the pipe's bore at 45° below the run toward the outlet, 1.6 OD
  long, closed by a bolted cover with a drain plug. Reason: the pocket holds a screen as long as
  the flow area needs and empties downward.
- `SW-PSP-2` Basket strainer: a vertical body of 2 OD diameter and 3.2 OD height with in-line
  flanged nozzles 0.3 OD above its middle, a bolted cover with a lifting handle, a drain nozzle
  and three legs. `SW-PSP-3` Temporary cone strainer: a ring `PL1/8` held between flanges inside
  the bolt circle, with a handle tab past the flange rim and a cone 1.5 OD long of perforated
  plate (perforations not drawn).
- `SW-PSP-4` Steam trap, small bore: disc type, a body block 2.2 OD square (minimum 1.5 in) with a
  round cap on top and threaded ends, 2.4 body widths long; bucket type, a vertical body 2 widths
  in diameter and 2.5 high hung below the line under a bolted cover, 3.4 widths end to end.
  Reason: envelope of the two common types; the bucket needs a body wider than the line fitting.
- `SW-PSP-5` Expansion joint (bellows): stated convolutions (default 5) at a pitch of 0.2 OD
  (minimum 3/4 in), each 0.6 pitch high, of 1/16 in plate, between 2 in weld ends and flanges;
  four limit rods of 3/4 in on lugs at the flange rims. Reason: thin convolutions take movement;
  limit rods keep pressure thrust from stretching them. `SW-PSP-6` Flexible hose: the same
  corrugation at a pitch of 0.1 OD over the stated length, with a braid collar at each end.
- `SW-PSP-7` Flame arrestor (in-line): cones from the pipe to an element housing of 2 OD diameter
  and 0.8 OD length clamped between two ring flanges by eight tie bolts. Reason: the element
  needs several times the pipe's area to pass flow through its narrow passages.
- `SW-PSP-8` Sight glass: a body cross of 1.6 OD with a glass disc of 1.2 OD each side under a
  bolted retaining ring. `SW-PSP-9` Rupture disc holder: two holder rings 3/4 in thick inside
  the bolt circle with the domed disc between and a tag stem past the flange rim. `SW-PSP-10`
  Drip ring: a ring 1.5 in thick between flanges with two tapped bosses of 3/4 in, one plugged.
- `SW-PSP-11` Lateral (45°, butt weld): a run of 1.0 OD + 2 in before the branch point and 2.7 OD
  + 2 in after it, the branch 2.7 OD + 2 in long at 45° toward the outlet. `SW-PSP-12` Mitre
  bend: a 90° bend of stated pieces (default 3) on a centreline radius of 1.5 OD, each joint
  turning the same angle, the end pieces half the length of the middle ones; shown standing in
  a vertical plane, turning up. `SW-PSP-13`
  Stub-in: a branch pipe set straight on the run with a reinforcing pad of the run's thickness
  and twice the branch's outside diameter, rolled to the run. Reason: where no fitting is made.
- `SW-PSP-14` Spring hanger: a spring can 7 in in diameter and 14 in high with a load scale
  window, hung by a 3/4 in rod from a welded lug on the steel, a turnbuckle below it and a
  two-bolt pipe clamp of `PL3/8` × 2.5 in. Reason: a spring carries the pipe while it moves up
  or down with temperature.
- `SW-PSP-15` Insulation and tracing on a pipe: insulation 1 in thick to 2 in pipe, 1.5 in to 6
  in, 2 in to 12 in and 3 in above, under a 0.02 in aluminium jacket banded every 12 in; where
  traced, a 1/2 in tracer tube along the pipe at five o'clock and the insulation one size
  roomier. Shown stepped back at the ends so each layer is seen. Reason: heat loss per foot
  falls slowly with thickness, so thickness steps with size.
- `SW-PSP-16` Expansion loop: a flat U of stated width and height in the run's plane on long
  radius bends (SW-FIT-1), shown with 3 OD + 12 in of straight each side. `SW-PSP-17` Hose
  connection: a threaded quick coupling with two cam arms and a chained cap on a nipple.
- `SW-PSP-18` Weight of a piping special: the drawn metal at steel density (K-1); insulation
  and glass are drawn but not weighed. Reason: the catalogue weight is what a rigger lifts in
  steel; a light covering is not a rule-made number worth stating.

## 71. Structural assemblies (`SW-STA-*`) — catalogue items only

Written 2026-11-23 at the owner's instruction (a comprehensive catalogue of 3D items; nothing that
affects the isometric generator or plant 2). A structural assembly is a module of members drawn
in place as it stands, z up from the top of concrete, built by the rules already written for
members and access (§4–10, §19–24). These are catalogue items only: they are in no plant and no
ground truth. Arrangements and proportions are SmartWeld's own, from the reasoning given, for
the owner to tune (PROVENANCE P-76).

- `SW-STA-1` Common to every assembly. Beams and columns are W shapes sized by the SW-PF-3
  search at the depth their rule gives; where a rule says "lightest", the weight is the family
  reference member (area 0.045 D²) rounded up to 5 lb/ft. A column that carries floors is the
  lightest weight at its depth (5 lb/ft steps) whose area is at least P / (0.45 F_y), P being
  its tributary floor load on every floor above; 0.45 is half of the 0.9 used in bending,
  because a slender column buckles well before it yields. Every column stands on a base plate
  by SW-BP-1..5 with four anchor rods of 3/4 in and nuts, on its grout bed over a concrete
  pedestal 6 in high and 3 in larger than the plate all round (SW-RK-4). Bolts, clips and end
  plates of member-to-member joints are not drawn in a catalogue module (they are drawn in the
  plants by §8–10). The weight is the drawn steel (K-1); grout and concrete are drawn and not
  weighed. Reason: the module shows arrangement and true member sizes; its joints repeat
  details the catalogue already holds.
- `SW-STA-2` Guardrail on an assembly, by SW-HR-1, -2: posts and two rails of round HSS 2 in ×
  1/8 in, the top rail at 42 in and the mid rail at 21 in, posts at every end and at 6 ft at
  most, a toe plate `PL1/4x4` on every guarded edge. Grating by SW-GR-1, -2: bearing bars
  across the span between beams, cross bars at 4 in.
- `SW-STA-3` Pipe rack module: stated width, tier elevations and number of bents; bents at 20
  ft (SW-RK-1); tier beams of depth roundup(width / 20, 2 in) for 40 psf × 20 ft, columns of
  depth roundup(height / 24, 2 in) for half the beam moment (SW-RK-2); struts at every tier on
  both column lines of the beam depth − 4 in (6 in least), lightest (SW-RK-3); rod bracing
  `RD3/4` crossed in the column planes of one bay, storey by storey, and crossed in plan under
  the top tier of that bay. Reason: as §24; one braced bay holds a module of up to four.
- `SW-STA-4` Stair flight: by SW-SR-1..5. The number of risers is round(height / 7.5 in) and
  the rise is the height divided by it, the run 10 in; channel stringers of depth
  roundup(slope length / 16, 2 in), 10 in least, the lightest whole lb/ft whose web is 1/4 in;
  grating treads 36 in wide by 10 in deep with a nosing angle; a rail each side at 36 in
  above the nosing line with a mid rail, on posts at the ends and at 6 ft at most. Reason: a
  whole number of equal risers must close the height; rounding keeps the rise within a
  quarter inch of 7.5 for any flight above 10 ft.
- `SW-STA-5` Stair tower: two or more flights of equal rise, none above 12 ft (SW-SR-3), side
  by side with 4 in between and turning back at a landing 42 in long across the full width at
  each end; four W columns of depth roundup(height / 36, 2 in), 6 in least, lightest; landing
  frames and long-face ties at each landing level of W6 lightest; rod bracing `RD3/4` crossed in the two long faces storey by storey;
  the short faces are left open for entry and exit and are tied by the landing frames;
  guardrail round each landing except where a flight meets it and at the exit. Reason: a
  switchback tower takes the least ground for its height.
- `SW-STA-6` Operating platform, free-standing: stated length, width and elevation; by
  SW-PLT-1..3: edge and intermediate beams at 4 ft at most of depth roundup(span / 20, 2 in),
  6 in least, for 100 psf; columns at the corners and at 20 ft at most along the length, of
  depth roundup(height / 36, 2 in), 6 in least, lightest; rod bracing crossed in one bay each
  way; guardrail on every edge but the ladder opening; a fixed ladder by SW-LD-1..3 (caged
  above 20 ft of climb) at one end.
- `SW-STA-7` Fixed ladder as a catalogue item: stated climb; rails, rungs, walk-through, cage
  and brackets by SW-LD-1..3; the structure it climbs is not drawn.
- `SW-STA-8` Pipe bridge: a pair of parallel-chord trusses of stated span, width and depth
  carrying a tier of pipe on floor beams at the bottom chord and a second at the top chord.
  Panels: round(span / depth) equal panels. Chords: W8, the lightest weight (5 lb/ft steps)
  whose area is at least F / (0.9 F_y), with F = (w L² / 8) / depth and w = 40 psf × width for
  the two tiers shared by two trusses. Verticals and diagonals `L4x4x3/8`, the diagonals
  sloping down toward mid-span. Floor beams by SW-RK-2 at every panel point, top and bottom.
  Plan bracing `RD3/4` crossed in every top panel. End bents by SW-STA-3 at each support.
  Reason: a truss replaces a beam where the span is several times what a tier beam can
  carry; diagonals sloping to mid-span are in tension under gravity, so slender angles serve.
- `SW-STA-9` Fireproofed column: a W column cased in concrete from its base plate to a stated
  height, the casing a solid rectangle 2 in clear of the flange faces and tips with its top
  sloped 1 in to shed water. The casing is drawn and not weighed as steel; its concrete
  weight is stated (K-7). Reason: SmartWeld's own choice of cover — enough concrete that the
  steel inside heats slowly while a pool fire is fought; the owner sets the figure and height.
- `SW-STA-10` T-support and goal post for pipe at grade: posts of depth roundup(height / 20,
  2 in), 6 in least, lightest; the cross beam the same section; a T-support's arms are equal
  and, where an arm is longer than 24 in, carried by a knee brace `L3x3x1/4` at 45°; a goal
  post has a post at each end of its beam. Reason: one section for post and beam makes the
  joint flange to flange; a brace halves a long arm's moment at the post.
- `SW-STA-11` Monorail: a W beam of depth roundup(span / 15, 2 in), 8 in least, sized by
  SW-PF-3 for M = 1.25 P L / 4 with P the stated capacity, hung under the cross beams of two
  bents, running 24 in past each bent. Cross beams of depth roundup(width / 20, 2 in), 6 in
  least, sized for the same load at their own mid-span; columns of depth roundup(height / 36,
  2 in), 6 in least, lightest; each bent kneed by `L3x3x1/4` braces at 45° reaching 24 in, and
  rod bracing crossed between the bents on both column lines. End stops
  `L4x4x3/8` and a trolley hoist drawn as an envelope: two side plates on four wheels riding
  the bottom flange, a hoist body, a chain and a hook. Reason: a lifted load at mid-span
  governs; 1.25 covers the jerk of a load starting to lift; span / 15 keeps the beam stiff
  enough that the trolley does not roll to the middle.
- `SW-STA-12` Open process structure: stated plan, floor elevations and floor load (250 psf
  where the drawing states none: equipment and piping stand on a process floor, where the 100
  psf of SW-PLT-1 is for people); columns on a grid of 20 ft at most, of depth roundup(height
  / 36, 2 in), 8 in least, sized for their floors by SW-STA-1; girders along the column lines
  across the width of depth roundup(span / 20, 2 in) for the floor load × the column spacing;
  floor beams between girders at 4 ft at most, sized for the floor load; grating floors; guardrail
  on every open edge; rod bracing crossed in one bay each way in every storey; a stair tower
  (SW-STA-5) beside one long side with a landing at each floor and the guardrail open there.
  Reason: an open structure lets equipment be set by crane and leaks disperse.

## 72. Further process equipment (`SW-EQC-45..64`) — catalogue items only

Written 2026-11-23 at the owner's instruction (a comprehensive catalogue of 3D items; nothing that
affects the isometric generator or plant 2). As §66 and §69: every item is a true-scale
arrangement from stated principal dimensions; what is not stated follows the rule here;
internals are not drawn unless a rule says so; weights are the drawn steel (SW-EQ-7). The
proportions are SmartWeld's own, from the reasoning given, from no drawing, licensor's design,
maker's data, standard or table, for the owner to tune (PROVENANCE P-77). Nozzle sizes "to the
series" are rounded up to the size series of SW-PIPE-*.

Stated wall (added 2026-11-24 for plant 3). Where an item of this section or of §69 gives its
shell a wall in proportion to its diameter for want of a duty — the sphere (SW-EQC-48), the
deaerator (SW-EQC-50), the adsorber vessels (SW-EQC-55), the flue gas cooler (SW-EQC-37), the
sulfur furnace's waste heat boiler (SW-EQC-56), and the steam drum (SW-EQC-38) of these two and
of the water-tube boiler (SW-EQC-40) — the item also takes a stated wall, which
replaces the proportion and changes nothing else. Without one the item is as before, so the
catalogue's own entries are unchanged. Plant 3 states the wall of SW-PRC-14.

- `SW-EQC-45` Horizontal drum, dressed (knock-out drum, accumulator, surge drum): stated inside
  diameter and tangent length; shell ID / 96, 3/8 in least, to 1/8 in, unless stated; 2:1 heads;
  two saddles at 0.2 and 0.8 of the length, the shell's underside 36 in above grade (the
  centreline at R + 36 in) unless stated. Connections: inlet on top at 0.1 L and vapour
  outlet on top at 0.9 L, both ID / 8 to the series; liquid outlet underneath at 0.85 L, ID / 12
  to the series and 2 in least; a manway on top at mid-length, 24 in (20 in under 48 in ID); two
  2 in level connections on the side; a 2 in vent and a 2 in drain. A boot, where stated, is a
  vertical pot of ID / 3 diameter and ID / 2 length under the drum at 0.85 L with the liquid
  outlet in its bottom; the drum then stands high enough for the boot, its nozzle and 42 in
  under it. Reason: inlet and outlet at opposite ends give liquid the longest path
  to drop out; a boot collects the heavier water where it can be drawn off.
- `SW-EQC-46` Storage bullet: a drum as SW-EQC-45 with shell ID / 72, 1/2 in least; two 4 in
  relief nozzles on top; fill and outlet nozzles underneath; a grating walkway 36 in wide with
  guardrail along the top over the middle 0.6 L on posts from the shell, reached by a caged
  ladder at one end (SW-EQC-28). Reason: liquefied gas is stored under its own vapour
  pressure, so the shell is heavier and the valves on top need safe access.
- `SW-EQC-47` Desalter: a drum as SW-EQC-45 with shell ID / 96, 1/2 in least. Two transformer
  units on top at 0.3 and 0.7 L, each a box 0.25 ID square and 0.3 ID high on a frame over an
  8 in entrance bushing nozzle. An inlet header of ID / 8 pipe under the drum with three risers
  into its underside; an outlet collector of the same pipe over the drum with three risers
  from its top; a 6 in water outlet underneath at 0.9 L; four 2 in try connections up one head.
  A walkway and ladder as SW-EQC-46 over 0.8 L. Reason: salty crude enters low through a
  distributor, rises through the electric field fed from the transformers and leaves at the
  top, while the water it sheds settles and leaves at the bottom.
- `SW-EQC-48` Sphere: stated inside diameter D; shell D / 200, 1 in least, to 1/8 in. Columns of
  pipe, max(6, round(π D / 150 in)) of them, of outside diameter D / 16 to the next 2 in,
  standing so that the shell is let into them from 20° below the equator up to their caps
  just above it;
  the bottom pole clear of grade by D / 6, 60 in least; crossed rod bracing of 1-1/2 in between
  neighbouring columns; base plates. On the crown: a platform of radius D / 8 with guardrail,
  two 6 in relief nozzles, a 2 in vent and a 24 in manway; at the bottom pole an outlet of
  D / 40 to the series (4 in least) and a 2 in drain. Access: a stair spiralling round the
  columns from grade to the equator, then a stair over the crown to the platform. Reason: a
  sphere holds pressure with the least steel for its volume; columns at the equator meet the
  shell where it is vertical, so they load it in its own plane.
- `SW-EQC-49` Cooling tower, induced draft: stated cells, each of stated plan and casing height.
  A concrete basin 48 in deep under all cells, its walls 12 in thick and 24 in outside the
  casing; a casing of sheet on a frame of `W8` columns at the cell corners; air inlets with
  louvre blades at 45° over the lowest 0.3 of the height of both long faces; a fan deck on
  top; over each cell a fan stack of 0.6 of the cell width in diameter and 0.25 of it high,
  flared out by a tenth at top and bottom, a fan of six blades of 0.55 of the cell width, a
  right-angle gear under the hub and a drive shaft to a motor on the deck outside the stack; a
  riser of stated size up one end to a header along the deck with a branch into each cell;
  guardrail round the deck and a caged ladder. Fill and drift eliminators are not drawn.
  Reason: the fan on top pulls air up against the falling water; the tall stack carries the
  wet air clear of the inlets.
- `SW-EQC-50` Deaerator: a storage drum as SW-EQC-45 with a deaerating dome on top at
  mid-length: a vertical shell of 0.5 ID diameter and 0.75 ID height with a 2:1 head, on a
  neck of 0.25 ID; a water inlet of 6 in on the dome's side, a 2 in vent on its head, a steam
  inlet of ID / 8 to the series on the drum's top at 0.2 L, a 4 in relief nozzle at 0.8 L and
  the outlet underneath; saddles carrying the centreline at a stated height. Reason: water
  falls through steam in the dome and gives up its dissolved gas, which leaves by the vent;
  the drum below stores the stripped water high enough to feed the pumps.
  Amended 2026-11-27 (owner's decision, P-95): the vent stands upright on the dome's head
  halfway out from its axis to its rim (a quarter of the dome's diameter from the axis), on
  the side opposite the water inlet, its neck set into the head as deep as the head falls
  away under it; the crown is left free. Reason: a plant brings its largest water connection
  in at the crown (SW-RPI-2, the deaerator), to spray it down through the steam; with the vent
  on the crown as well the two stood one inside the other. An independent clash check of
  plant 3 found V-1904's 6 in make-up connection round the drawn 2 in vent, 3.9 in into the
  vent's flange (1.5 in by the checker's own measure). Halfway out the vent is still high on
  the head, where the stripped gas gathers; on V-1904 its flange's rim stands 6.1 in clear,
  in plan, of the rim of the 6 in connection at the crown.
- `SW-EQC-51` Steam turbine driver: from a stated wheel diameter d. A casing split on the
  horizontal joint, 1.5 d in diameter and 0.8 d long, with a joint flange 2 in thick standing
  3 in proud; a steam chest 0.5 d × 0.4 d × 0.4 d on top with an inlet flange of d / 6 to the
  series facing sideways; an exhaust nozzle of d / 3 to the series facing the other side, below the joint;
  a bearing housing 0.45 d in diameter and 0.35 d long at each end; a shaft d / 8 in diameter
  with a coupling half at the drive end and a governor housing at the other; pedestals to a
  baseplate 1.3 d wide and 2.6 d long, the shaft 0.9 d above it. Reason: envelope of a
  single-stage driver; steam enters high and leaves low.
  Amended 2026-11-27 (owner's decision, P-95): the side pedestal under the exhaust is cut round
  it: a square window through the pedestal about the exhaust's axis, each side 1 in clear of
  the flange's rim (half the flange's outside diameter and 1 in from the axis), leaving the
  pedestal below, above and either side of the window; a piece left thinner than 1 in is left
  out. The 1 in is the clearance of SW-RPI-17, as for the cabin heater's buckstays (SW-EQC-53).
  The exhaust is the item's own (d / 3 to the series, 0.3 d under the shaft, at the casing's
  middle) or, where a plant states it, the plant's: its size and class, its height under the
  shaft and its place along the casing, and the exhaust is then drawn there, out of the
  casing's side. The other pedestals and the casing are as before. Reason: a pipe cannot pass
  through a pedestal, and the exhaust's flange is bolted from behind it. An independent clash
  check of plant 3 found the exhaust necks of K-1401 (10 in) and K-1702 (14 in) through the
  side pedestal, 5.0 in and 7.0 in in from the neck's wall (6.3 in and 5.8 in by the checker's
  own measure); the item's own exhaust passed through it as well. On K-1401 the pedestal now
  stands 7.6 in high under the window, 2.7 in over it and 3.1 in before it; on K-1702, whose
  14 in flange is as long as the pedestal, 9.8 in high under it only.
- `SW-EQC-52` Steam jet ejector: from the suction size (outside diameter OD). A suction
  chamber 1.6 OD in diameter and 2 OD long with the suction nozzle on its side; the motive
  steam nozzle on the axis at the back, a third of the suction size to the series, 1 in
  least; a diffuser of a converging cone 2 OD long to a throat of 0.45 OD, a throat 1 OD
  long and a diverging cone 5 OD long to a discharge flange of the suction size. Reason: the
  jet entrains the suction gas; the diverging cone is long so the flow stays attached while
  it slows and regains pressure.
  Where a duty states them (SW-PRC-18; added 2026-11-24), the discharge flange and the
  motive steam nozzle are of the stated sizes, and the diverging cone ends at the discharge's
  diameter; an item with neither stated is as before.
- `SW-EQC-53` Cabin heater: a radiant box of stated length, width and height standing 84 in
  above grade on `W8` columns at its corners and at 20 ft at most; floor burners in one row on
  the centreline at a spacing of half the width, each by SW-EQC-42 with a throat of 0.12 of
  the width; a hip of 0.25 of the width in height narrowing to a convection section 0.4 of
  the width wide and half the radiant height high, the full length, with a header box 12 in
  deep at each end; a breeching cone to a stack of 0.25 of the width in diameter, standing
  1.5 radiant heights above the convection section; buckstays `W6` on the long walls at 8 ft
  at most; a platform 36 in wide along one long wall at the hip with a ladder. Tubes and
  refractory are not drawn. Reason: burners fire up between tube walls; the gas turns into
  the convection section above, where the remaining heat is taken, and leaves by the stack.
  Amended 2026-11-27 (P-95; drawn only where a plant gives the heater its gas connections):
  under the floor, a header for each gas along the burner row, of its connection's own pipe,
  level at its connection's height, inside the columns of the wall the connections pass
  through by 1 in from the columns' flange edges. The burners are shared between the gases by
  which connection each is nearer along the row; each header runs from 3 in short of its
  nearer end burner's branch, or of its own connection, to 3 in past the other, and is capped;
  two headers end to end stand at least 3 in apart. From a header a 2 in branch runs to each of
  its burners' gas inlet flanges (SW-EQC-42), across under the floor at the flange's height
  and up into the header, its bend of 1.5 OD radius, ending in a 2 in flange bolted to the
  burner's, a 1/8 in gasket between. Reason: as for SW-EQC-15 as amended: the connections
  stood under the floor with nothing behind them; each burner fires the gas of the header it
  is on (a cabin with two gases burns the waste gas in the burners nearer its connection).
  Amended 2026-11-27 (owner's decision, P-95): where a plant states a connection that passes
  out through a long wall of the radiant box (the point where its axis meets the wall, and its
  flange's outside diameter), no buckstay comes within 1 in of the flange's rim, seen along
  the connection's axis: a buckstay that would stops where its nearer flange edge meets the
  circle of half the flange's outside diameter and 1 in about the axis, and goes on from the
  far side of that circle; a piece of it left shorter than 1 in is left out. The buckstays
  keep their places, 8 ft apart at most, and no other buckstay changes. The 1 in is the
  clearance a support's post or rod keeps from every line and solid (SW-RPI-17). Reason: a
  pipe cannot pass through a member, and the flange is bolted from behind it, so its studs
  and nuts must be reached round the whole rim. An independent clash check of plant 3 found
  the coil outlets of H-1101 (24 in) and H-1201 (36 in), which leave the wall that faces the
  rack 2 ft above the floor and a quarter of the box's length from its middle (SW-RPI-2), each
  with a buckstay through its neck: 10.8 in and 18 in in from the neck's wall (6.3 in by the
  checker's own measure). That buckstay of H-1101 now stops 92.0 in above the heater's base and
  starts again at 124.0 in; that of H-1201 starts at 131.3 in (the 0.7 in left under the circle,
  on the floor, is left out).
- `SW-EQC-54` Reformer furnace, top fired: a box of stated length, width and height standing
  96 in above grade on `W10` columns. Catalyst tubes of 5 in outside diameter in
  round(width / 96 in) rows along the length at 12 in pitch, through the roof and the floor:
  36 in above the roof to an inlet header of 8 in pipe over each row, each tube fed by a
  pigtail of 1 in pipe; 24 in below the floor into an outlet manifold of 12 in pipe under
  each row, the manifolds joined to a transfer line of 24 in. Roof burners (SW-EQC-42, 12 in
  throat, firing down) in lines between and outside the rows at 48 in. A flue duct from the
  box's end at the floor to a convection section 0.3 of the width wide beside it, the full
  height, and a stack of 0.2 of the width in diameter one box height above it. Guardrail round the roof and
  a ladder with landings. The penthouse over the headers is not drawn, so the tube tops are
  seen. Reason: the reaction takes heat
  along the whole tube, so burners fire down beside the tubes and the gas leaves at the floor.
- `SW-EQC-55` Pressure swing adsorption unit: stated beds (4 where not stated) of vertical
  vessels on skirts (SW-EQ-1) in a row at 1.75 outside diameters; a nozzle of ID / 8 to the
  series in each head; two headers of that size along the row below (feed, tail gas) and two
  above (product, equalising), each with a branch to every bed; header supports at grade.
  Switching valves are catalogue valves and are not drawn. Reason: each bed takes feed, is
  let down, purged and repressured in turn, so every bed joins every header.
- `SW-EQC-56` Sulfur plant reaction furnace with waste heat boiler: a furnace chamber of
  stated diameter and length on saddles, its front a flat end with a burner on the axis
  (SW-EQC-42, throat 0.3 D) and its rear a 30° cone to the gas duct of a fire-tube boiler by
  SW-EQC-37 of the same diameter and a stated length with its steam drum. Refractory is not
  drawn. Reason: acid gas is burnt with a third of its air in the chamber and the hot gas is
  cooled at once, raising steam. The boiler's outlet duct may be stated as in SW-EQC-37
  (added 2026-11-24).
- `SW-EQC-57` Sulfur condenser: a shell-and-tube exchanger by SW-EQC-26 with a sulfur outlet
  of 4 in under its outlet channel dropping to a seal pot 18 in in diameter and 36 in high at
  grade. Reason: liquid sulfur drains by gravity through a seal that holds back the gas.
- `SW-EQC-58` Incinerator: a horizontal chamber of stated diameter and length on saddles with a
  burner on its front (SW-EQC-42, throat 0.3 D) and its rear entering the breeching of a stack
  by SW-EQC-43 of 0.6 D diameter and stated height. Reason: tail gas is burnt at the front and
  the products rise in the stack for dispersion.
- `SW-EQC-59` Electrostatic precipitator: a casing of stated length, width and height; fields
  = round(length / 144 in); two hoppers across by one per field, each an inverted pyramid 0.6
  of its plan side high to a 12 in outlet; an inlet and an outlet transition, each a pyramid
  0.4 of the length long from 0.8 of the casing face to a duct of half that; on the roof an
  insulator compartment each side of every field and a transformer-rectifier at each; `W10`
  columns under the hopper corners with 96 in clear under the outlets; guardrail round the
  roof and a caged ladder. Plates and electrodes are not drawn. Reason: dust charged in the
  field falls from the plates into hoppers; the long transitions spread the gas evenly.
- `SW-EQC-60` Vent silencer: a vertical shell of stated diameter D and 3 D high with a cone to
  an inlet nozzle of D / 3 to the series underneath, an open top under a weather hood on four
  posts, four support lugs at mid-height (SW-EQC-5) and a 1 in drain. Reason: the gas expands
  into a body several pipe diameters across and leaves upward through the absorber.
- `SW-EQC-61` Duct run: a rectangular duct of stated section in 3/16 in plate with angle frames
  `L3x3x1/4` at its ends and stiffener frames at 36 in at most; a 90° mitred elbow; a fabric
  expansion joint 12 in long between frames; a louvre damper 18 in long with blades of 9 in at
  most across the shorter side, their shafts through the wall to a link bar and lever.
  Reason: flat plate needs frames to stay flat under draught; fabric takes up growth that
  plate cannot.
- `SW-EQC-62` Multi-bed reactor: a vertical vessel of stated inside diameter, tangent length,
  wall and skirt, with stated beds (3 where not stated) of equal height. An inlet of ID / 8
  to the series on the top head with an elbow; an outlet of the same size on the bottom head;
  between beds a 4 in quench nozzle and a 24 in manway; at the foot of each bed a 6 in
  catalyst dump nozzle; at the middle of each bed three 2 in thermowell nozzles round the
  shell. Platforms (SW-EQC-27) at every manway and at the top, none more than 15 ft above
  the last, with ladders between (SW-EQC-28). Reason: the reaction gives out heat, so the
  catalyst is split into beds and cold gas is added between them.
- `SW-EQC-63` Kettle reboiler: from a stated bundle diameter Db and tube length. A channel
  and tubesheet of the bundle's diameter; an eccentric cone, flat along the bottom, 0.6 Db
  long to a shell of 1.6 Db; the shell 1.15 tube lengths long with a 2:1 head; two vapour
  nozzles on top (Db / 3 to the series) and a liquid outlet underneath beyond the tube ends,
  a feed nozzle underneath near the cone; two saddles. The bundle and weir are inside and
  not drawn. Reason: the wide shell leaves space above the boiling bundle for vapour to
  leave without carrying liquid; the bottom is flat so the bundle draws straight out.
- `SW-EQC-64` Vertical in-line pump: suction and discharge flanges of stated size in one line;
  a casing of 2.4 suction outside diameters across and one deep between them; a motor support
  head of the casing's width and one motor frame high with two hand holes; the motor
  (SW-EQC-8) standing on it, shaft down; a base ring under the casing. Reason: the pump sits
  in the line like a valve and needs no baseplate.
- `SW-EQC-65` Swaged tower (vacuum or crude column): three shells of stated diameters and
  lengths, bottom to top, joined by cones at 30° to the axis; a skirt of the bottom diameter;
  2:1 heads; an overhead nozzle of a third of the top diameter (to the series, 24 in at most)
  on the top head; a feed nozzle of a quarter of the middle diameter low on the middle shell;
  a bottoms nozzle of ID / 8 of the bottom shell; three side draws of 6 in; platforms and
  ladders as SW-EQC-32 at 15 ft at most, each platform ringing the shell at its own height,
  with a manway at each. Reason: under vacuum the vapour volume is greatest where the feed
  flashes, so the tower is widest there and necks in where the traffic is less.
- `SW-EQC-66` Turbine-driven compressor package (added 2026-11-24): the skid, casing, gearbox
  and lube console of SW-EQC-12 with a steam turbine of SW-EQC-51, of stated wheel diameter
  d, in the motor's place, coupled to the gearbox. The shaft stands 0.9 d and the turbine's
  4 in baseplate above the skid, and the gearbox is as tall as that needs; the skid is at
  least 2 D + 2.55 d + 20 in long. Reason: a recycle or wet gas compressor of some thousand
  horsepower is driven by steam the plant makes; the driver sets the shaft's height.
- `SW-EQC-67` Top loading station, for a road tanker (added 2026-11-24): a gantry platform 8 ft
  square, its floor at a stated height (12 ft where not stated) on four `W8x24` columns with
  a frame of the same section under a grating floor, handrail on the three sides away from
  the vehicle and a caged ladder up the far side; beside its open edge a loading arm of the
  stated size: a riser from 1 ft above grade to 4 ft 6 in above the floor, a swivel at its
  top, a boom of stated reach (8 ft where not stated) out over the vehicle and a drop pipe
  4 ft long ending in a spout cone, a swivel at the boom's end. Reason: a tanker is filled
  through its top hatch from a platform level with it; the arm swings and drops to reach
  the hatch. The riser's inlet is the plant's to place; heating of a sulfur arm is not
  drawn.
- `SW-EQC-68` Vacuum ejector set (added 2026-11-24): the ejectors and surface condensers of
  SW-PRC-18 as one assembly with the pipework between them, from each stage's stated sizes
  (the ejector's suction, discharge and steam connection; the condenser's shell diameter and
  wall, its vent, water connections and drain) and the sizes of the set's steam and water
  connections. Heights are above the steel the saddles stand on.
  - Condensers (SW-DET-11, tubes 20 ft): side by side on their saddles, tubesheets in one
    line, shell undersides 4 ft up; the first stage's at one side and the later stages' in
    order beside it, 30 in between the body flanges of the first and second (a way through)
    and 18 in between later ones, each spacing to the next 6 in. Reason: saddles in one line
    stand on two beams; 4 ft leaves room under a channel for its water connection and the
    turn into it.
  - On each shell: the vapour inlet on top near the tubesheet (the inlet's own diameter and
    6 in from the body flange, to the next 6 in; later stages 18 in further along for each
    stage, so that their steam branches lie apart); the vent on top at 0.9 of the tube
    length; under the shell at the same station a condensate boot, a pipe of twice the
    drain's size (6 in least) and 12 in long, closed at the bottom, on which the drain
    stands; water in under the channel and out on top of it, at the channel's mid-length
    (the first stage's to the nearest 6 in). Reason: vapour enters at one end and what will
    not condense leaves at the other, having passed the whole bundle; condensate collects in
    the boot clear of the tubes; water enters low and leaves high so the channel stays full.
  - The first ejector (SW-EQC-52) lies above its condenser, pointing at the tubesheet end,
    its suction on top, and turns down into the vapour inlet through a flanged bend of
    radius 1.5 diameters; a straight piece of up to 6 in in that bend sets the suction on
    the 6 in module from the tubesheet line. Beyond the condenser's rear head it rests on
    two frames of `W8x24`, posts either side and a beam under it: one under the suction
    chamber, one under the middle of the throat. Reason: at ten diameters it is longer than its
    condenser, and a horizontal ejector is reached along its length from one floor.
  - Each later ejector stands on its condenser's vapour inlet, discharging straight down,
    its suction facing the stage before. Reason: a small ejector stands on its own flange;
    upright, it needs no bend and no floor of its own.
  - Vents: from the top of each condenser a pipe of the next ejector's suction size rises
    to that suction's height, turns toward the next condenser, runs back along the gap
    beside it and turns in to the suction; bends of 1.5 diameters, a flange at each end.
  - Steam: one pipe of the set's steam size rises through the floor between the first and
    second condensers at the tubesheet line, turns along the set at the first ejector's
    height, and turns in to that ejector's steam connection behind it; a branch runs across
    from it and down to the top of each later ejector.
  - Cooling water: a supply pipe of the set's water size runs under the channels and turns
    up into the first condenser's water inlet, with a branch up to each later one; a return
    pipe leaves the first condenser's outlet, runs over the channels and takes a branch
    from each later one. Both turn down beyond the last condenser, 42 in apart, and pass
    through the floor.
  - The steam and water pipes end 24 in below the steel, each with a flange; the drains
    and the first ejector's suction are flanged nozzles. In a plant these seven connections
    are the plant's to make (SW-CELL-4), and the item is used without them.
  - Each straight piece and each bend of the pipework is a solid of its own, so that a plant
    holds each by its own box. A flanged end stands a gasket's thickness off the face it
    meets; gaskets and bolts of these joints, and the set's valves and instruments, are not
    drawn; the tubes are inside and not drawn.
  Reason for the whole: the condensers are the heavy items and fix the plan; each ejector is
  as near its condenser's inlet as its shape allows; every connection a plant must meet is
  either on top (the suction) or under the floor (drains, steam and water), where a line
  can come to it without crossing the set.

## 73. Further civil and concrete items (`SW-CIV-17..28`) — catalogue items only

Written 2026-11-23 at the owner's instruction (a comprehensive catalogue of 3D items; nothing that
affects the isometric generator or plant 2). As §65: every part is a true-scale concrete solid
with its bars drawn in place and its quantities (SW-CIV-15); class B concrete unless a rule says
otherwise; covers by SW-CIV-2. The proportions are SmartWeld's own, from the reasoning given, from
no code, table or published detail, for the owner to tune (PROVENANCE P-78).

- `SW-CIV-17` Walls and slabs of the items below, unless their rule says otherwise: `#5` at 12 in
  each way, in one layer at mid-thickness where the member is 12 in thick or less and in each
  face where it is thicker. Reason: a thin member has room for one layer with cover both sides;
  a thick one cracks at its faces, so the steel goes there.
- `SW-CIV-18` Pile cap: stated piles per side (2 gives four piles, 3 gives nine), pile diameter
  d (16 in where not stated) and pile length. Piles at 3 d centres; the cap's edge d / 2 + 9 in
  beyond the outer piles' centres; cap thickness = the pile spacing rounded up to 3 in, 30 in
  least; piles let 6 in into the cap. Cap bars: a bottom mat of `#7` at 8 in each way, hooked up,
  3 in above the pile heads, and a top mat of `#5` at 12 in. Piles: cages as SW-CIV-9 (`#6`
  verticals one per 6 in of circumference, 6 least, `#3` spiral at 6 in pitch), the verticals
  running 24 in into the cap. Reason: a cap as deep as the piles are apart carries the column
  load to them along struts no flatter than 45°; three diameters keeps each pile's ground its own.
- `SW-CIV-19` Cantilever retaining wall: stated retained height H and length. Stem thickness
  roundup(H / 10, 1 in), 12 in least; base thickness the same; base width roundup(0.6 (H + base
  thickness), 6 in) with a third of it as toe in front of the stem and the rest, less the stem,
  as heel under the retained earth; the toe covered by 12 in of earth; the stem 6 in higher
  than the retained grade. Bars: `#5` verticals at 12 in on the earth face of the stem, hooked
  into the heel; `#4` horizontals at 12 in on them; `#5` at 12 in across the bottom of the base
  full width and across the top of the heel; `#4` longitudinals at 12 in in the base. Reason:
  the earth on the heel holds the wall down against the earth pushing it over; a base of six
  tenths of the height is where SmartWeld starts, and the owner sets it for the soil.
- `SW-CIV-20` Catch basin: a sump by SW-CIV-13 of stated inside size (24 × 24 × 36 in deep
  where not stated) with its grating cover, and an outlet pipe of 8 in through one wall with
  its invert 12 in above the floor. Reason: surface water falls through the grating, grit
  settles below the outlet and the water leaves above it.
- `SW-CIV-21` Manhole: round, of stated inside diameter (48 in where not stated) and depth; wall
  8 in; a base slab 8 in thick and 6 in wider all round; a top slab 8 in thick with a 24 in
  opening against one side under a cast frame and cover 26 in across; step rungs of `RD3/4`, 16
  in wide and 6 in out from the wall, at 12 in below the opening; two pipe stubs of 12 in
  opposite each other with inverts 6 in above the floor. Bars: `#4` verticals at 12 in round
  the wall and `#4` hoops at 12 in; `#4` at 12 in each way in each slab. Reason: a person
  climbs in beside the wall, so the opening and rungs are at one side.
- `SW-CIV-22` Pipe sleeper: a stem 12 in wide of stated length and height above grade (12 in
  where not stated), running 12 in below grade to a footing 24 in wide and 12 in deep; a steel
  strip `PL3/8x6` cast flush in its top with 1/2 in studs 4 in long at 12 in. Bars: stem, two
  `#5` top and two bottom with `#3` ties at 12 in; footing, three `#5` along and `#4` across at
  12 in. Reason: lines at grade rest on sleepers; the steel strip is a wear face a pipe shoe
  can slide on without crumbling the concrete edge.
- `SW-CIV-23` Machine foundation block: stated machine weight and base plan. Plan 12 in larger
  than the base all round; weight of the block 3 times the machine's for a rotating machine and
  5 times for a reciprocating one, so depth = that weight / (K-7 × plan), rounded up to 6 in,
  36 in least; where the depth would pass 0.6 of the block's width, the margin round the base
  is widened 6 in at a time until it does not; the top 12 in above grade. Bars: `#5` at 12 in each way on every face. Eight
  anchor rods of 1 in round the base, 3 in in from its edge, and a grout bed 2 in thick under
  it. Reason: a block several times heavier than the machine moves little when the machine
  shakes it; a reciprocating machine shakes hardest; a squat block rocks less than a deep,
  narrow one. The factors are SmartWeld's own starting points for the owner to tune.
- `SW-CIV-24` Table-top foundation for a machine set above grade: stated deck length, width and
  height. A deck slab of depth roundup(column spacing / 4, 6 in), 36 in least, with an opening
  a third of its length and width at its centre; columns under the long edges, two per side
  up to 20 ft of deck and three above, square of side roundup(height / 8, 6 in), 24 in least;
  a mat of the deck's depth 24 in larger than the deck all round, its top at grade. Bars: deck
  and mat `#6` at 12 in each way top and bottom; columns eight `#8` verticals with `#4` ties at
  12 in. Reason: the machine stands a storey up so its condenser and piping fit below; the
  deck is deep so it is stiff under the running machine.
- `SW-CIV-25` Gravity separator basin: stated channels (two where not stated), each of stated
  inside width, liquid depth and length, side by side. Walls and base 12 in; the walls 12 in
  above the liquid. An inlet bay 60 in long across all channels and an outlet bay 48 in long;
  in each channel an under-flow baffle at its head and an oil-retention baffle near its end,
  each from the wall top down to 24 in above the floor, and an outlet weir wall rising to 12 in
  below the liquid surface; a slotted skimmer pipe of 8 in across each channel ahead of the
  oil baffle; a grating walkway 36 in wide with guardrail across the basin there; inlet and
  outlet pipe stubs of 12 in. Bars by SW-CIV-17. Reason: oil rises to the surface in slow,
  even flow, so the channels are long; the baffles hold the oil back while the water passes
  beneath, and the skimmer draws the oil off.
- `SW-CIV-26` Sulfur pit: stated inside length, width and depth; walls and base 12 in; a roof
  slab 10 in thick with its top 12 in above grade, with a pump opening and an access opening,
  each 30 in square under a steel cover plate, and a vent of 8 in pipe rising 60 in. Steam
  coils of 2 in pipe on the floor at 12 in centres, 6 in above it. Bars by SW-CIV-17.
  Reason: liquid sulfur is kept hot below grade by steam coils and pumped out through the roof.
  The pump's discharge pipe may be left out where a plant's own line starts at the pump's
  head (added 2026-11-24).
- `SW-CIV-27` Box culvert: stated inside span, rise and length; walls and slabs of thickness
  roundup(span / 12, 1 in), 8 in least; a headwall 12 in thick at each end, 24 in wider than
  the box each side and 12 in higher. Bars by SW-CIV-17, the transverse bars as closed hoops
  round the box. Reason: the box carries a road or a pipeway over a drain; the hoops carry
  the roof's load round into the walls.
- `SW-CIV-28` Duct bank: stated rows and columns of 4 in conduits and length; conduits at 7.5 in
  centres (3 in of concrete between), 3 in of concrete outside the outer conduits; class A;
  four `#4` longitudinals at the corners with `#3` ties at 24 in; the conduits 6 in proud at
  each end. Reason: encasing cables' conduits protects them under paving and traffic.

## 74. Plant 3, the coastal refinery: scope, sources and process configuration (`SW-REF-*`)

Written 2026-11-24 at the owner's instruction: a full-scale refinery model about ten times plant 2,
"based on real life petroleum engineering expertise and common industry knowledge", at real scale
on real-life topography, in which every component contributes to the refining process and each
section is distinguished by its process; pressure-boundary vessels and piping carry their code
records; "never use any external references or infringe on anyone else's existing design"; "the
model you design should exist nowhere in real life". Three decisions were put to the owner before
anything was written (PROVENANCE P-79): the code layer is applied from the assistant's own
knowledge and flagged (§76); the refinery is of 60,000 barrels a day without a coker; it is set on
the Atlantic coast of New Brunswick.

What does not change: section 0 governs every dimension of every part. No published dimension
table, standard or catalogue shapes any geometry, and nothing was looked up for this plant.

What is new, and is kept apart from geometry:

- **Process knowledge** (this section and §75). How a refinery is configured, what each unit does,
  what conditions it runs at and how equipment is sized for a duty is general petroleum-refining
  engineering knowledge. It is used here from the assistant's own understanding, as the owner
  asked. The crude, the yields, the operating conditions and the sizing figures are round
  demonstration values chosen by SmartWeld with the reasoning given; no handbook, licensor's
  design, published flow scheme, assay or correlation was opened, and none is reproduced. They
  size a demonstration model and are for the owner to tune; they are not a process design to
  build from.
- **The code layer** (§76). Names of codes, report designations, fluid service categories and
  registration numbers on pressure equipment and piping, recalled from general knowledge at the
  owner's instruction and flagged as such on every record.

- `SW-REF-1` Identity. Plant 3, id `R3`, "SmartWeld coastal refinery". It is invented: its crude,
  yields, equipment list, plot and ground exist nowhere. It is not a model, copy or adaptation of
  any existing refinery, licensed process or published flow scheme. Process steps are named by
  what they do, never by a licensor's or product's name. Its site is not a real place and takes
  no real place's name, map or survey; New Brunswick is the jurisdiction its code-layer labels
  are written for, and the kind of coast its terrain is drawn after.
- `SW-REF-2` Separation from plants 1 and 2. Plant 3's code is under `src/refinery/`, its tools
  are `tools/refinery-*.ts` and its files are written under `public/refinery/`, `docs/` and
  `screenshots/refinery/`. It is not in the plant list (`PLANTS`), in `public/plants/index.json`
  or in any designer package. It uses the catalogue, the router and the piping generator as they
  are; no file under `src/generator/` or `src/exchange/` is changed for it, and plants 1 and 2
  regenerate byte for byte. Reason: the owner's instruction that nothing done here may affect
  the isometric generator or plant 2.
- `SW-REF-3` Tags. Equipment: `{letter}-{unit, two digits}{sequence, two digits}` with a letter
  suffix for installed spares, e.g. `P-1104B`. Letters: `C` column, `V` vertical vessel, `D`
  horizontal drum, `R` reactor, `E` shell-and-tube exchanger, `A` air cooler, `H` fired heater,
  `B` boiler, `P` pump, `K` compressor or blower, `T` storage tank, `S` sphere or bullet, `F`
  filter, `J` ejector, `X` package or special item. Line numbers by SW-LL-1 with the sequence
  = unit × 1000 + a running number, e.g. `8"-P300-P-11017`. Reason: four-digit tags and
  five-digit sequences cannot be mistaken for those of plants 1 and 2 (SW-PLANT-3).
- `SW-REF-4` Units and design rates (barrels per stream day unless stated):

  | Unit | Section | Design rate |
  |---|---|---|
  | 11 | Crude distillation (atmospheric) | 60,000 |
  | 12 | Vacuum distillation | 25,500 |
  | 13 | Naphtha hydrotreater and splitter | 13,500 |
  | 14 | Catalytic reformer, fixed bed, with hydrogen purification | 9,300 |
  | 15 | Kerosene hydrotreater | 6,300 |
  | 16 | Diesel hydrotreater | 12,300 |
  | 17 | Fluid catalytic cracker with gas concentration | 17,700 |
  | 18 | Sulfur block: amine regeneration, sour water stripping, sulfur recovery | 45 long tons of sulfur a day |
  | 19 | Utilities: steam, boiler feed water, cooling water, air, nitrogen, fuel gas | |
  | 20, 21 | Tank farm: crude; intermediates, components and products; liquefied gas | |
  | 22 | Marine terminal | |
  | 23 | Truck loading | |
  | 24 | Wastewater treatment | |
  | 25 | Flare | |
  | 26 | Fire water | |
  | 27 | Buildings, substations and site works | |

  Reason: this is the smallest set that turns a medium sour crude into finished gasoline, jet,
  diesel, liquefied gas, fuel oil, asphalt and sulfur: distillation separates, hydrotreating
  removes sulfur, reforming and cracking make gasoline from naphtha and gas oil, and the sulfur
  block turns the removed sulfur into a product. With no coker the vacuum residue leaves as
  heavy fuel oil and asphalt, which a coastal plant ships by sea.
- `SW-REF-5` Design crude: 60,000 barrels a day of an invented medium sour crude given as nine
  cuts. The crude's own gravity and sulfur follow from the cuts (about 31.8 °API, 1.6 % sulfur by
  weight). Mass = volume × specific gravity × K-5; API gravity = 141.5 / SG − 131.5 is a unit
  definition.

  | Cut | Boiling range, °F | Volume % | Specific gravity | Sulfur, weight % |
  |---|---|---|---|---|
  | Light ends (four carbons and lighter) | below 90 | 1.8 | 0.560 | 0 |
  | Light naphtha | 90–180 | 5.6 | 0.670 | 0.02 |
  | Heavy naphtha | 180–360 | 15.2 | 0.755 | 0.05 |
  | Kerosene | 360–480 | 10.4 | 0.805 | 0.25 |
  | Diesel | 480–650 | 18.6 | 0.850 | 1.05 |
  | Atmospheric gas oil | 650–720 | 6.0 | 0.885 | 1.60 |
  | Light vacuum gas oil | 720–850 | 6.4 | 0.905 | 1.90 |
  | Heavy vacuum gas oil | 850–1,020 | 17.0 | 0.935 | 2.20 |
  | Vacuum residue | above 1,020 | 19.0 | 1.012 | 3.40 |

  The light ends are taken as 20 % two carbons and lighter, 30 % three carbons and 50 % four
  carbons by mass.
- `SW-REF-6` Unit yields, as mass per cent of each unit's fresh feed, so that every balance closes
  by construction; volumes follow from the specific gravities given.
  - Crude and vacuum units: the cuts of SW-REF-5. The atmospheric residue is the three heaviest.
    The two-carbon-and-lighter fifth of the light ends leaves the crude unit's accumulator as
    gas; the rest leaves dissolved in the naphtha, is driven off in unit 13's stripper and is
    recovered as liquefied gas in unit 17.
  - Naphtha hydrotreater (feed: light and heavy naphtha, and the wild naphtha of units 15 and
    16): hydrogen taken up 0.10; sour gas 0.60; the rest leaves as light and heavy naphtha in the
    proportion they entered, split by the splitter.
  - Reformer (feed: hydrotreated heavy naphtha): hydrogen 2.1, two carbons and lighter 2.4, three
    carbons 3.3, four carbons 4.4, reformate 87.8 at SG 0.795.
  - Kerosene hydrotreater: hydrogen taken up 0.25; treated kerosene 99.20, wild naphtha 0.45,
    sour gas 0.60.
  - Diesel hydrotreater (feed: diesel and a third of the light cycle oil): hydrogen taken up
    0.65; diesel 97.90, wild naphtha 1.20, sour gas 1.55.
  - Fluid catalytic cracker (feed: atmospheric and vacuum gas oils): dry gas 4.0, three carbons
    5.3 (SG 0.515), four carbons 9.9 (SG 0.585), gasoline 47.6 (SG 0.750), light cycle oil 19.0
    (SG 0.950), slurry oil 8.8 (SG 1.070), coke 5.4, burned in the regenerator.
  - Sulfur recovery: 96 % of the hydrogen sulfide fed leaves as liquid sulfur.
  Reason: these are ordinary yields for such units on such feeds, rounded; fixing them by mass
  makes the balance exact and leaves volumes to follow.
- `SW-REF-7` Hydrogen and sulfur. Hydrogen made by the reformer is the plant's only supply: the
  naphtha and kerosene hydrotreaters take reformer net gas as it comes, the diesel hydrotreater
  takes hydrogen purified by pressure swing adsorption (87 % recovered), and the balance must
  show a surplus, which goes to fuel gas. Two thirds of the light cycle oil is not hydrotreated
  but cuts the vacuum residue to fuel oil viscosity. Sulfur removed as hydrogen sulfide: all of
  the naphtha's, 95 % of the kerosene's, 99 % of the diesel hydrotreater feed's and 40 % of the
  cracker feed's (the rest of the cracker's leaves in its liquid products and, as oxides, in the
  regenerator flue gas, which is scrubbed); sour water stripper gas adds 100 lb/h. Sulfur leaves
  the hydrocarbon as hydrogen sulfide, 34.08 / 32.06 of the sulfur's mass (the ratio of the
  molecular weights), the difference being hydrogen the unit took up; each unit's sour gas
  includes it, and fuel gas is the gases less the hydrogen sulfide amine takes out. Reformer
  net gas is the hydrogen made with four fifths of the reformer's two-carbon-and-lighter gas;
  the hydrocarbon that rides with it into the naphtha and kerosene hydrotreaters leaves in
  their stripper gas. With these two statements the fuel gas of the unit flowsheets (unit 17's
  treated gas, the stabiliser gas, the surplus hydrogen and the adsorbers' tail gas) equals the
  fuel gas of the balance, which a test checks. Reason: a plant of this size without a
  cracked-stock hydrotreater can live on its reformer's hydrogen; the model checks that it does
  rather than assuming it.
- `SW-REF-8` Product routes. Liquefied gas: three-carbon and four-carbon streams to pressure
  storage. Gasoline: light naphtha, reformate, cracked gasoline and butane, blended. Jet:
  treated kerosene. Diesel: hydrotreated diesel. Heavy fuel oil and asphalt: vacuum residue,
  with slurry oil and light cycle oil as cutter for the fuel oil. Fuel gas: the dry gases,
  amine-treated, burned in the plant's heaters and boilers, with purchased gas making up the
  balance at the boilers. Coke on the cracking catalyst is burned in the regenerator and
  raises steam in the flue gas cooler.
- `SW-REF-9` Storage (days of the stream's rate; SmartWeld's own figures): crude 14 (a tanker's
  parcel and more); unit feeds held between units 3; gasoline components 4; finished products
  10; heavy fuel oil 12 and asphalt 20 (seasonal lifting); liquefied gas 5; slop 2 % of crude
  for 5 days. Tank count and sizes follow by SW-PRC-13. The unit feeds held are straight-run
  naphtha (unit 13), hydrotreated heavy naphtha (unit 14, through a rundown cooler, because it
  leaves the splitter too hot for a tank), diesel (unit 16) and gas oil (unit 17, on the cooled
  light vacuum gas oil line, sized for three days of the cracker's whole feed); each tank
  stands on the line between two units, taking the rundown when the unit downstream is down and
  feeding it when the unit upstream is. Kerosene and atmospheric residue run unit to unit:
  the kerosene hydrotreater follows the crude unit's rate, and the crude and vacuum units run
  as one. Fire water: two tanks, each four hours at 6,000 US gallons a minute.
- `SW-REF-10` Process scheme of each unit. Every equipment item in the model has a duty in one
  of these schemes; the list, with tags, duties and conditions, is drawing data in
  `src/refinery/` and is printed in `docs/REFINERY-PROCESS.md`. Pressures are gauge.
  - **11 Crude distillation.** Crude at 60 °F is pumped to 300 psi through a cold exchanger
    train (against top pumparound, kerosene, diesel and diesel pumparound) to 270 °F, washed in
    a desalter at 150 psi, boosted, heated in a first hot train (against gas oil and the bottom
    pumparound) to 400 °F, flashed in a preflash drum whose vapour goes straight to the column,
    pumped through a second hot train (against vacuum gas oil pumparound and vacuum residue
    from unit 12) to 505 °F and through the crude heater to 680 °F. The atmospheric column
    (flash zone 670 °F and 22 psi; top 250 °F and 15 psi) has three pumparounds and three side
    draws, each steam-stripped in a section of a stacked side stripper. Overhead is condensed
    by air and trim coolers to 100 °F in an accumulator with a water boot: reflux returns,
    naphtha goes to unit 13, sour water to unit 18, gas to the unit 17 wet gas compressor.
    Kerosene and diesel are cooled and sent to units 15 and 16; gas oil goes hot to unit 17;
    residue goes hot, at 650 °F, to the vacuum heater. Vacuum residue, having preheated the
    crude, raises 50 psi steam on its way to the tanks.
  - **12 Vacuum distillation.** Residue is heated to 750 °F and flashed at 30 mm of mercury
    (20 mm at the top) in a swaged column (stripping section, wide flash and wash zone,
    narrower top). Light and heavy
    vacuum gas oil pumparounds give their heat to crude preheat and steam generation; the gas
    oils go to unit 17. Vacuum residue is quenched, pumped through crude preheat and coolers and
    sent hot to fuel oil and asphalt tanks. A three-stage steam ejector set with surface
    condensers holds the vacuum; its hotwell separates slop oil and sour water, and its gas is
    burned in the vacuum heater.
  - **13 Naphtha hydrotreater and splitter.** Naphtha from a surge drum is pumped to 460 psi,
    joined by hydrogen-rich gas, heated against reactor effluent and in a charge heater to
    600 °F, and passed through one reactor bed. Effluent is washed with stripped water and
    cooled to 100 °F; a separator at 350 psi returns gas through a recycle compressor; the
    liquid is stripped in a reboiled stripper (its gas to the unit 17 wet gas compressor, and
    so to amine treating) and split into light naphtha (to gasoline blending) and heavy naphtha
    (hot to unit 14, or through a rundown cooler to its feed tank).
  - **14 Catalytic reformer.** Heavy naphtha and recycle gas are heated against effluent and
    passed through three reactors at 950 °F and 300 psi with a fired heater ahead of each (the
    reactions absorb heat). Effluent is cooled to 100 °F; a separator at 250 psi returns recycle
    gas through a turbine-driven compressor; net gas is boosted to 530 psi for the
    hydrotreaters and a four-bed pressure swing adsorption unit; the liquid is stabilised in a
    debutaniser (liquefied gas and fuel gas overhead, reformate bottoms). The heaters' flue gas
    raises steam in a convection section with a steam drum.
  - **15 Kerosene hydrotreater.** As unit 13, at the same pressures and 600 °F, with one
    reactor, a steam stripper and a product coalescer; treated kerosene to jet storage. The
    stripper's feed is heated against its bottoms and then against reactor effluent: a steam
    stripper has no reboiler, so its bottoms leave cooler than its feed and cannot heat it all
    the way.
  - **16 Diesel hydrotreater.** Feed is filtered, pumped to 900 psi, heated against effluent
    and in a charge heater to 610 °F and passed through a two-bed reactor with hydrogen quench
    between the beds, at 800 psi, leaving at 650 °F. Effluent is cooled, washed and separated
    at 770 psi; recycle gas is scrubbed with amine in a high-pressure absorber and
    recompressed; the liquid is flashed, heated against stripper bottoms and reactor effluent
    (as in unit 15), steam-stripped, dried and cooled to storage.
    The pressures of units 13, 15 and 16 are chosen so that each reactor circuit, with its
    charge pump blocked in (SW-PRC-2), stays within one pressure class, and the temperatures so
    that only the reformer's circuit takes the hot-service class step of SW-PRC-3.
  - **17 Fluid catalytic cracker.** Gas oil from a surge drum is preheated to 450 °F against
    the main column's pumparounds and cracked on hot catalyst in a riser at 980 °F and 30 psi.
    Spent catalyst is steam-stripped and regenerated by burning its coke with air from a main
    air blower at 1,300 °F; fresh and equilibrium catalyst stand in hoppers. Regenerator flue
    gas raises steam in a flue gas cooler and is washed in a wet scrubber before its stack.
    Reactor vapour is quenched and fractionated in the main column into slurry oil, light cycle
    oil (steam-stripped), and an overhead of gasoline and gas. A two-stage turbine-driven wet
    gas compressor lifts the gas to 200 psi; a primary absorber, a sponge absorber, a stripper,
    a debutaniser and a depropaniser separate fuel gas, three-carbon and four-carbon liquefied
    gas and stabilised gasoline; fuel gas and liquefied gas are amine-treated and the gasoline
    and liquefied gas caustic-washed.
  - **18 Sulfur block.** Rich amine from the absorbers of units 16 and 17 is flashed,
    heated against lean amine and regenerated in a steam-reboiled column; lean amine is cooled,
    a tenth of it filtered, and returned. Sour water from every unit is collected, degassed,
    heated and steam-stripped; stripped water returns as wash water to the desalter and the
    hydrotreaters, and the rest goes to wastewater treatment. The flash drum's and degassing
    drum's gases are burned in the incinerator. Acid gas from both goes to a sulfur recovery train:
    a reaction furnace with waste heat boiler, then two catalytic stages, each of reheater,
    converter and sulfur condenser, with a final condenser; liquid sulfur drains through seal
    pots to a heated pit and is loaded to trucks; tail gas is burned in an incinerator with a
    stack. A tail gas treating unit is not modeled (stated).
  - **19 Utilities.** Two water-tube boilers, one carrying the load and one standing by, raise
    600 psi steam at 650 °F; let-down gives 150 psi and 50 psi steam, and the process units'
    own steam generators and turbine exhausts feed the same headers. Raw water from the intake
    is stored, filtered and demineralised; condensate and demineralised make-up are deaerated
    with 50 psi steam and pumped as boiler feed water to the boilers and to the units' steam
    generators. A four-cell cooling tower and its circulating pumps serve every water cooler.
    Three air compressors with dryers and receivers give instrument and plant air; nitrogen is
    held as liquid and vaporised; caustic is held in a tank and pumped to unit 17. A fuel gas
    drum mixes the plant's gases with purchased gas. Service water and fire water tank make-up
    come from the raw water pumps.
  - **20, 21 Tank farm.** Floating-roof tanks for crude, naphthas and gasolines; cone-roof
    tanks for kerosene, diesel, gas oils and fuel oils, the black oils heated; spheres for
    liquefied gas and bullets at its truck rack; transfer, blending and shipping pumps on slabs
    outside the dikes. Crude is boosted to unit 11 and its settled water drawn off. Gasoline
    components run down to their own tanks and are pumped together, with butane, into a blend
    header that fills the gasoline tanks. Vacuum residue goes to asphalt tanks and, cut with
    light cycle oil and slurry oil and cooled, to fuel oil tanks. Slop from every unit is
    collected and worked off into the crude.
  - **22 Marine terminal.** A trestle carries the lines to a berth in deep water with three
    arms for crude discharge at 25,000 barrels an hour and three for loading gasoline and jet
    fuel, diesel, and fuel oil at 5,000 to 10,000 barrels an hour, with dolphins, walkways and
    a slop drum.
  - **23–27.** Truck loading racks for gasoline, jet fuel, diesel, asphalt and liquefied gas; a
    wastewater plant (separator basin, equalisation, flotation, biological treatment and
    clarifier) at the low point of the site; a derrick-supported flare with knock-out and seal
    drums, remote, sized for a relief of 400,000 lb/h; fire water tanks and pumps (two engine
    driven and one motor driven, any two giving 6,000 US gallons a minute) with a ring main;
    control building, substations, workshops, stores, laboratory and offices.
- `SW-REF-12` Streams between units. A stream that crosses a unit's battery limit carries one
  name in the unit it leaves and in the unit it enters, and the model lists every such stream
  with the units at each end (`src/refinery/process.ts`). A steady stream's sources and sinks
  balance to the pound; several units may feed one stream (sour water, rich amine, stripper
  gas, wild naphtha) or draw from one (lean amine, stripped water, reformer net gas). A stream
  arrives within 10 °F of the temperature it left at and at no higher pressure. The others
  are named for how they flow: an alternate route used when a unit is down; an intermittent
  transfer (a ship or trucks loading, a tank being refilled), given at its rate while it runs;
  a collected stream (slop oil, the flare header), whose line is sized for its largest
  contributor. A tank that stands on a line between two units appears at both ends of that
  stream, and takes no part in its balance. Streams that cross the site boundary are raw water
  and purchased gas in, and treated effluent out. Utilities are headers: unit 19 supplies
  each (or, for condensate and cooling water return, receives it), other units add what they
  make, and a test checks that supply and make cover every use. Reason: the pipeways are
  drawn from this list, so a stream that did not balance would be a line with nowhere to go.
- `SW-REF-11` Out of scope, stated: instrumentation and control (the owner's instruction: it is
  shown on other drawings); electrical cable and trays; catalyst and chemical handling beyond
  the hoppers and tanks named; tail gas treating; small-bore piping beyond the vent, drain,
  instrument-connection and sample stubs of SW-LL-*; underground sewers (the ring main and
  sewers are noted, not drawn).

## 75. Plant 3: process conditions and sizing for duty (`SW-PRC-*`)

These rules turn the process of §74 into sizes: of lines, vessels, exchangers, heaters, pumps,
compressors and tanks. They are engineering heuristics written from general process-engineering
understanding, each with the physical reason it rests on, as round demonstration figures. No
handbook, standard, vendor table or correlation was opened for them and none was reproduced; where
a figure coincides with common practice it was not checked against anything. They are for the
owner to tune from experience (PROVENANCE P-79). Once a size is fixed, the part itself is built by
the catalogue's own geometry rules (§25, §29–34, §66, §69, §72), which are unchanged.

- `SW-PRC-1` Fluids. Every stream is one of the plant's fluids, each with a name, a phase at its
  conditions, a density (liquids by specific gravity, gases by molecular weight through the ideal
  gas law, K-9), a specific heat, and a hazard: flammable; toxic (bearing hydrogen sulfide in
  quantity); harmful on contact (amine, caustic, liquid sulfur, steam and hot condensate); or
  benign (water, air, nitrogen). The list is drawing data in `src/refinery/fluids.ts`. Reason:
  density sizes the line, specific heat the exchanger, and the hazard sets the line class and
  the code layer's fluid service (§76).
- `SW-PRC-2` Design conditions. Design pressure = the larger of 1.1 × the highest operating
  pressure and that pressure + 25 psi, rounded up to 5 psi, and never below 50 psi; a pump's
  discharge system is designed for the pump blocked in: its suction design pressure plus 1.25 ×
  its differential. Equipment that runs under vacuum is designed for full vacuum as well.
  Design temperature = the highest operating temperature + 50 °F, never below 150 °F. Reason: a
  relief valve set at the design pressure must stay shut in normal running, which wants a
  margin above the highest operating pressure, a tenth of it or 25 psi when the pressure is
  low; a centrifugal pump blocked in makes about a quarter more head than at its rating; metal
  runs hotter than the fluid in upsets. A pump's discharge system is the run from the pump to
  the first control valve station downstream (SW-LL-3), through any exchangers, filters and
  branches on the way, and to the first vessel, column or tank where there is no such valve;
  past it, the relief valve of the receiving equipment protects the line. Equipment lined
  with refractory (the cracker's reactor and regenerator, fired heaters' fireboxes, the sulfur
  furnace, the incinerator, and flue gas lines above 1,000 °F) is designed for a shell
  temperature of 650 °F: the lining keeps the steel cool. Design conditions are taken side by
  side: an exchanger's shell and tubes, a heater's process coil, steam coil and fuel, and the
  steam side of a steam generator each have their own. A vessel, column or tank is designed
  for the pressure of what leaves it, since what enters comes through a valve or from
  something at a higher pressure; a nozzle takes the class of its line. Storage tanks,
  basins, pits, the cooling tower, hoppers, loading arms and stacks are open to the
  atmosphere and have no design pressure; their connections are of the lowest class.
  At a battery limit (added 2026-11-24, with §80). A stream's line (SW-REF-12) and the unit
  lines that meet it with no control valve station between them are one run of pipe with a
  block valve in it, and are designed together. The stream's line takes the highest design
  pressure among the lines of the units that receive it and of the units that send it
  without a control valve station at their limit, and the highest design temperature of all
  the lines that meet it. Each of those unit lines takes the stream's design pressure and
  temperature where they are higher than its own. In a unit that receives the stream, that
  pressure is carried on from the limit as a pump's blocked-in pressure is: through
  exchangers, filters and branches as far as the first control valve station, vessel,
  column, tank or pump, each side of an exchanger on the way designed for it. A stream that
  such a run then feeds at the unit's limit carries it into the next unit in the same way
  (the vacuum gas oil pumparound leaves the vacuum unit, passes an exchanger of the crude
  unit and returns: both lines between the units, the exchanger's shell and the return as
  far as its control valve are designed for the pumparound pump blocked in). Reason: a
  closed valve at the far end puts the sender's blocked-in pressure on everything up to it,
  and a battery limit is a line on a drawing, not a break in the pipe. Not carried
  upstream: where a receiving unit's own pump raises the pressure of a stream's line (none
  does since the cutter stock of the fuel oil blend was put under flow control), the
  sending unit's line at the limit takes the stream's pressure but the equipment behind it
  does not; a test checks that no sending line is raised in this way. A connection of an
  item open to the atmosphere still takes the class of its line where no control valve
  station stands between (a loading arm at the end of a ship-loading pump's discharge is
  of that pump's class); a tank filled through its level valve has its connection past
  the valve, of the lowest class (SW-RPI-9).
- `SW-PRC-3` Pressure class of equipment nozzles and lines: the smallest SmartWeld class
  (SW-PIPE-1) whose pressure is at least the design pressure, and one class higher where the
  design temperature is above 700 °F. Reason: SmartWeld's wall and flange rules carry no
  temperature term; steel has lost a good part of its strength by then, and a class step
  restores the margin.
- `SW-PRC-4` Line size: the smallest size, from 3/4, 1, 1-1/2, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18,
  20, 24, 30, 36, 42 and 48 in of SW-PIPE-6, whose bore keeps the flowing velocity within:
  liquid to a pump suction or flowing by gravity, 4 ft/s; other liquid, 8 ft/s; gas, vapour,
  steam and mixed phase, ρ v² ≤ 4,000 lb/ft·s² on the flowing density and v ≤ 200 ft/s.
  Lines of the flowsheet, which run between equipment and on the racks, are 3 in at least
  whatever they carry (a smaller pipe cannot span the 15 to 20 ft between the supports of a rack
  or of a yard crossing, SW-PS-7); a utility take-off to a single item is 2 in at least,
  butt-welded pipe as the process lines are (amended 2026-11-24: take-offs of 3/4 to 1-1/2 in
  were socket-welded small bore, which hangs from 10 ft supports the yard does not have and
  is of the scale of instrument and tracing lines, outside this model). Reason: liquid velocity sets friction loss and wear, and a
  slow suction keeps a pump from cavitating; in gas the momentum ρ v² is what shakes and
  erodes a line, whatever the pressure.
- `SW-PRC-5` Pumps. Rated flow 1.1 × normal; head = pressure rise × 144 / (SG × K-5); hydraulic
  power = flow × head × density; shaft power = hydraulic / 0.70 (0.55 below 100 gallons a
  minute); motor the next rating in the series 1, 1.5, 2, 3, 5, 7.5 × a power of ten
  horsepower. Speed: two-pole (3,560 rpm at 60 hertz) to 3,000 US gallons a minute, four-pole
  (1,780 rpm) above. Impeller diameter from the head: tip speed u = √(g H / 0.5),
  D = 60 u / (π N); stages of equal head so that no impeller passes 16 in at two-pole speed or
  24 in at four-pole. Motor frame diameter = 10 in × (horsepower /
  10)^(1/3). Every process pump has an installed spare. Suction and discharge nozzles are one
  size below their lines (SW-LL-7), 2 in at least (the smallest check valve). Reason: an impeller's head is about half its tip speed
  squared over g; torque sets a motor's size and grows with its volume.
- `SW-PRC-6` Drums. Liquid hold-up at half full: feed surge drums 15 minutes of feed; reflux
  accumulators 5 minutes of reflux plus product; separators and flash drums 5 minutes of liquid.
  Horizontal, length three diameters, diameter in 6 in steps and 36 in at least, unless the
  vapour sets it; 12 ft long at least where two liquids leave it underneath, so that both
  outlets stand between its saddles. A drop settles at u = 0.18 √((ρ_L − ρ_V) / ρ_V) ft/s. In a horizontal drum the
  gas crosses lengthwise over the liquid, and a drop need only fall the half diameter while the
  gas travels the length, so the gas may move at u × length / half diameter = 6 u through the
  upper half of the cross-section. In a vertical drum the gas rises against the drop, so it
  may move at u through the whole cross-section; a vertical drum is three diameters between
  tangents. Knock-out drums are sized on these velocities alone, with five minutes of whatever
  liquid they catch. Drums that hold a stated time (slop and drain drums, 30 minutes) use it.
  Reason: hold-up gives the operator time; the velocity is the settling speed of a 0.2 mm drop
  in turbulent drag (drag coefficient 0.44) taken at 70 %.
  Amended 2026-11-27 (P-95): a horizontal drum is at least as long as the connections on its
  top need: 18 in inside each tangent line and, between neighbours, half the sum of their
  flanges and 12 in, to the 6 in (SW-RPI-2). The fuel gas mixing drum of the utilities unit,
  whose four gases enter on its top and whose mixed gas leaves there too, is so stated 132 in
  between tangents (3 D would give 108). Reason: on 108 in its gas outlet, once it stood on
  top as a gas outlet does, came on the same spot as the fourth inlet.
- `SW-PRC-7` Columns. Diameter from the largest vapour load in each section at
  u = 0.25 √((ρ_L − ρ_V) / ρ_V) ft/s over 85 % of the cross-section (the rest is downcomers), in
  6 in steps. Height: the stated number of trays at 24 in, plus 12 ft for the sump and feed
  zone and 8 ft above the top tray; skirt 15 ft where the bottoms feed a pump. Tray counts are
  stated per column. The vapour loads are the stated one and what each reboiler boils. The
  column is also wide enough that the largest liquid stream on its trays (a draw, or the
  bottoms with what the reboiler boils from it) passes down at no more than 0.05 ft/s on the
  whole cross-section. Platforms, ladders and manways by SW-EQC-32. The vacuum column is given
  as three sections (stripping, flash and wash, top), each with its own vapour load and a
  stated height, joined by cones. A column in which two liquids pass (the liquefied gas amine
  contactor) is sized for the light liquid rising at 0.05 ft/s. Reason: the velocity is that
  of a 0.5 mm spray drop at about 60 % of its settling speed, which keeps liquid from being
  carried up to the tray above; the skirt gives the bottoms pump its suction head.
- `SW-PRC-8` Shell-and-tube exchangers. Duty Q = flow × specific heat × temperature change (plus
  latent heat where stated); surface A = Q / (0.9 U ΔT_lm), with U in Btu/h·ft²·°F by the pair of
  fluids: heavy oil both sides 40; heavy oil to water or to boiling water 50; light oil to oil,
  gas to gas at pressure, and gas to water, 60; oil to cooling water or boiling water 70;
  condensing vapour to water 90; steam to oil 100; amine to amine 100; water or amine to water
  150; steam to water or amine 250; gas below 50 psi to water or boiling water 20. Heavy oils
  are crude, gas oil, residue and slurry. ΔT_lm
  is the logarithmic mean of the temperature differences at the two ends in counter-flow,
  5 °F at least at either end; steam condenses at about 490 °F at 600 psi, 365 °F at 150 psi
  and 300 °F at 50 psi, and water boils in a steam generator at the same temperatures
  (properties of water, round figures); the steam a generator raises leaves it saturated, at
  that temperature. Tubes 3/4 in on the bundle rule of SW-EQC-30, 20 ft
  long; shells from 12 to 60 in inside diameter in 6 in steps; the fewest shells, then the
  smallest diameter, that give the surface, and no shell smaller than three times its largest
  connection (a nozzle that is most of a shell's width leaves the flow no room to turn into
  the bundle). Reason: heat flows in proportion to surface, temperature difference and how
  readily the two films pass it, which thick oils do poorly and condensing steam does well.
  A gas at less than 50 psi that flows inside the tubes (the sulfur unit's condensers and
  reheaters, the cracker's flue gas cooler) passes through them no faster than 100 ft/s at its
  mean temperature, and the shell is enlarged until it does. Reason: such a gas has only a
  fraction of a psi to spend on friction in each item. The flue gas cooler is the catalogue's
  fire-tube item (SW-EQC-37), whose tubes are 2 in at 2.5 in centres, wall d / 9 as SW-EQC-30:
  its shell, from 36 in up in 6 in steps, is the smallest that gives both the surface and that
  velocity.
- `SW-PRC-9` Air coolers. A bay is 14 ft wide with tubes 32 ft long and two fans, four rows of
  1 in tubes at 2.5 in centres; duty per bay = 80 Btu/h·ft²·°F × its bare tube surface × ΔT_lm
  against air rising from 90 °F to 130 °F; bays = duty / that, rounded up. Process is cooled
  by air to 140 °F and by water below that. Bays stand beside the unit's pipe rack on their own
  columns (SW-CELL-4). Reason:
  air is free but cannot cool below its own temperature plus an approach; fins raise the
  outside surface so the bare-tube coefficient is as good as a water cooler's.
- `SW-PRC-10` Fired heaters. Fired duty = absorbed duty / 0.85. The radiant section absorbs 70 %
  of the duty at 10,000 Btu/h per ft² of tube surface, on 6 in tubes at 12 in centres in one
  row along each long wall (π/2 ft² of tube per ft² of wall). Above 30 million Btu/h absorbed
  the heater is a cabin (SW-EQC-53): width 16 ft to 50 million Btu/h and 20 ft above, radiant
  height twice the width, length = wall surface needed / (2 × height), 20 ft at least; at or
  below 30 million it is a vertical cylinder (SW-EQC-14) of height 2.5 diameters whose shell
  gives that wall surface, 6 ft across at least. Reason: tube metal sets how much heat a square foot may take, and
  the firebox is as big as the tube surface it must hold.
- `SW-PRC-11` Reactors. Catalyst volume = liquid feed volume an hour / space velocity: naphtha
  hydrotreater 6, kerosene 3, diesel 1.2 (two beds), reformer 1.6 over three reactors in the
  ratio 2 : 3 : 5. A vessel's inside diameter is the 6 in step at which its beds stand three
  diameters high in all (reformer reactors two); tangent length = bed height + one diameter
  for distribution and collection. Reason: the harder the sulfur is to remove, the longer the
  oil must stay on the catalyst; reforming's first reactions are fast, so the catalyst is
  weighted to the last reactor.
- `SW-PRC-12` Compressors and blowers. Gas power = moles × R × T₁ × k/(k − 1) × (r^((k−1)/k) − 1)
  / 0.75, k = 1.3 for hydrocarbon gas and 1.4 for hydrogen-rich gas and air; one stage up to a
  pressure ratio of 3.5, more of equal ratio beyond, cooled back to the suction temperature
  between stages, so that the power is the stages' sum. The wet gas compressor's two stages
  are two casings on one turbine's shaft. Driver by SW-PRC-5's motor series, or a
  steam turbine where stated (wheel diameter 12 in × (horsepower / 100)^(1/3)). Reason: the
  work of compression from the gas law; a stage's temperature rise limits its ratio.
- `SW-PRC-13` Storage. Working volume = days of SW-REF-9 × the stream's rate / 0.85 (heel and
  freeboard), shared by the stated number of tanks. Shell height 48 ft (six courses of 8 ft,
  SW-EQC-44), less where the diameter would fall below the height, when tank is as tall as it
  is wide; diameter in 5 ft steps, 180 ft at most. Such a small tank's height is the whole
  number of 8 ft courses next below that width, two courses at least, and its diameter follows.
  Floating roof for stocks that boil below 350 °F; cone roof for the rest; black oils heated.
  Liquefied gas in spheres of 60 ft at most, to the next foot (SW-EQC-48), and in bullets six
  diameters long, to the next 6 in. Dikes by SW-CIV-14.
- `SW-PRC-14` Wall of a pressure vessel: t = P R / S + corrosion allowance, in 1/8 in steps, not
  below the larger of 3/8 in and inside diameter / 250; S = 18,000 psi (half the yield of
  Grade 36 plate) up to 650 °F design temperature, falling in a straight line to half that at
  1,000 °F; corrosion allowance 1/8 in. Vessels designed for vacuum are at least inside
  diameter / 150 thick. Heads take the shell's thickness. Reason: thin-wall hoop stress with
  a factor of two on yield, as SW-PIPE-3; steel keeps most of its strength to about 650 °F and
  about half near 1,000 °F; a thin large shell must still hold its shape when lifted and under
  external pressure.
  - A sphere: t = P R / 2 S + corrosion allowance, 3/4 in at least, with no floor of
    diameter / 250. Reason: across any great circle the pressure's force P π R² is carried by
    the whole rim 2 π R t, half the stress of a cylinder's hoop; a shell curved both ways holds
    its shape.
  - An exchanger's shell, channels and heads are drawn at one thickness: the larger of what its
    two sides need, each at its own pressure and temperature. The same holds for a steam
    generator whose shell holds the boiling water (the sulfur condensers, the sulfur furnace's
    waste heat boiler, the cracker's flue gas cooler).
  - Packaged vessels take their wall from this rule too: the four adsorbers of the hydrogen
    purifier, the deaerator, the liquid nitrogen vessel (its inner vessel; the vacuum jacket is
    not drawn).
  - Steam drums take their wall from this rule at the design temperature of the saturated
    steam they hold (its condensing temperature of SW-PRC-8 + 50 °F), whatever the superheated
    steam leaving the boiler is designed for.
  - Where the catalogue fixes a wall by a rule of its own (the cracker's vessels at 1 in, the
    boilers' mud drums), a test checks that P R / (t − corrosion allowance) does not exceed S
    at the item's design temperature.
- `SW-PRC-15` Utility and safety connections on equipment: water coolers take cooling water
  supply and return; steam heaters and reboilers take steam and return condensate; every pump
  has a seal flush connection; every pressure vessel has a relief valve to the flare header, a
  vent, a drain and two instrument connections (SW-LL-3, SW-LL-6); hose stations for steam,
  air, water and nitrogen stand along each unit's rack. Reason: as plants 1 and 2.
- `SW-PRC-17` Other vessels sized for their duty.
  - Desalter: horizontal, four diameters long, holding 20 minutes of the crude. Reason: salt
    water drops need that long to settle out of the oil in the electric field.
  - Deaerator: a horizontal storage vessel three diameters long holding 10 minutes of boiler
    feed water at half full, with a vertical heater section on it of half its diameter and one
    diameter tall. Reason: the storage rides out a short loss of make-up.
  - Treating vessels (ion exchangers, caustic wash drums, air dryers): vertical, 2.5 diameters
    between tangents, holding 10 minutes of a liquid or 20 seconds of a gas at its conditions;
    36 in at least; in parallel where a number is stated.
  - Filters: a vertical housing two diameters tall through whose cross-section a liquid passes
    at 0.1 ft/s and a gas at the vertical-drum velocity of SW-PRC-6; 24 in at least.
  - Air receivers hold 30 seconds of the compressors' flow at pressure; a steam drum holds
    5 minutes of the feed water it receives.
  - Sulfur converters: horizontal, three diameters long, the gas passing down through a bed
    3 ft deep at 1 ft/s on the bed's plan (diameter × length).
  Diameters in 6 in steps. Reason: each is a residence time or a velocity the service needs.
- `SW-PRC-16` Cooling tower. One cell for each 5,000 US gallons a minute circulated, and one
  more; a cell is square, of the plan area that passes its water at 4 gallons a minute per
  square foot, to the next foot: 36 ft. Water returns at 105 °F and leaves at 85 °F; a fiftieth
  of the circulation evaporates (a thousand Btu a pound against a 20 °F range), and blowdown
  holds the dissolved solids at about five times the make-up's. Circulating pumps share the
  flow with one spare. Reason: the fill wets only so much water per square foot before it
  floods; the extra cell lets one be taken out for cleaning in summer.
- `SW-PRC-18` Vacuum ejector set (added 2026-11-24). A steam jet compresses the gas it draws
  by a limited ratio, and the steam it needs rises steeply with that ratio. A vacuum is
  therefore held by stages in series, with a surface condenser after each stage to take out
  the steam before the next stage has to compress it.
  - Water's vapour pressure: ln(p / 14.696) = −(L M / R)(1/T − 1/671.67), p in psia and T in
    °R, with L = 1,000 Btu/lb, M = 18 and R = 1.986 Btu/lbmol·°R. This is the
    Clausius–Clapeyron relation from the boiling point at one atmosphere (212 °F) and the
    latent heat the cooling tower rule takes (SW-PRC-16). SmartWeld's own relation: no table
    of steam properties is used or checked against.
  - The first condenser's pressure is that at which steam condenses 15 °F above the
    temperature the cooling water leaves at (so at 120 °F). Reason: the first stage compresses
    the whole load at its largest volume, so it is asked for as little as the water allows;
    water cannot condense steam colder than itself and needs a difference to work with.
  - From there to the hotwell's pressure the further stages compress by equal ratios, as few
    stages as keep each ratio at five or less. The first stage's own ratio is five at most
    too: a column held at a lower pressure than that allows would need a stage with no
    condenser after it, which is not built here.
  - Each condenser's vent leaves 10 °F warmer than the water enters (at 95 °F): the gas that
    does not condense, carrying the water vapour that saturates it at that temperature, moles
    of vapour = moles of gas × p_w / (p − p_w). That vent is the next stage's load. The oil in
    the column's overhead condenses in the first condenser. The gas that leaves the last
    condenser is carried on the flowsheet dry.
  - Motive steam: the flowsheet's quantity, shared among the stages in proportion to
    n T ln r of each (moles of load, absolute suction temperature, compression ratio), which
    is the work of compressing the load at one temperature.
  - A condenser's duty is the water it condenses × L (the oil's own heat, about a hundredth
    of it, is left out). Each condenser takes cooling water in parallel, 85 to 105 °F, so the
    set's water is the sum of the duties / 20 Btu/lb. Surface and shells by SW-PRC-8
    (condensing vapour to water, U 90), the steam condensing at the temperature of its
    pressure; the shell not smaller than three times its ejector's discharge, as far as
    SW-PRC-8's shells go.
  - Condensate leaves each condenser at its condensing temperature. The last condenser's
    leaves together with the gas, as one mixed stream. The hotwell's contents are at the
    mixed temperature of what it receives, to 5 °F.
  - Sizes. An ejector's suction is the line size (SW-PRC-4) for its load at its suction
    pressure and temperature. Its discharge is the line size for load and steam together at
    the condenser's pressure and their mass-weighted mean temperature (the steam arrives at
    its header's temperature). Its steam connection is the line size for its steam, 2 in at
    least. A condenser's water connections are the line size for its water, 2 in at least.
  - Tail pipes. A condenser at less than the hotwell's pressure can drain only down a leg
    tall enough to balance the difference. Its drain stands above the hotwell's liquid, taken
    at the hotwell's centre line, by (hotwell's pressure − condenser's pressure) × 144 / K-5
    ft of water, and 5 ft more. Each stage's condensate has a tail pipe of its own to the
    hotwell, sized as a gravity line: legs at different pressures joined above their seals
    would pass vapour from one condenser back to another.
    The hotwell is at least 4 ft longer than its tail pipes are apart, to the next foot:
    the flowsheet states the length, and a test checks it against the set as built.
  Reason: each figure is what the service asks, as stated with it; the ratios and
  temperature differences are round figures of general practice, SmartWeld's own choice.
- `SW-PRC-19` The plant's utility headers (added 2026-11-25, with SW-PWY-11). Each utility of
  SW-REF-10 is one system of pipe: unit 19's line to it or from it, a header the length of
  the main rack, and the header of each unit that takes from it or makes into it
  (SW-RPI-5), with nothing between them but block valves.
  - Design conditions. As a stream at a battery limit (SW-PRC-2), the system is designed
    together: every header of it, every connection to it and the side of each item so
    connected take the highest design pressure and the highest design temperature among
    unit 19's line and the connections of the items on it. Reason: with the valves open,
    the boiler feed water pump blocked in, or the boilers' steam, stands on every flange
    of its system. (Before this a unit's header took the class of its own items: the
    crude unit's boiler feed water header, 300 class, would have bolted to the 1200 class
    line that feeds it.)
  - Control stations. A connection whose item is fed under control, or drains under it,
    has a control valve station (SW-RPI-9), which is its specification break: boiler feed
    water to a steam generator (the generator's level); condensate from a steam heater
    (the level of its condensate pot); caustic, service water and instrument air to a
    process item (a flow). Between header and station the connection is of the header's
    conditions; beyond the station of the item's own, as it was. Steam, cooling water and
    fuel gas connections have none: a heater's steam side, a cooler's water side and a
    burner's gas side see their header. Reason: feed water at 800 psi enters a generator
    raising steam at 150 psi through its level valve and no other way; condensate at a
    heater's pressure reaches a header at 30 psi through the valve that holds the
    heater's level.
  - Size. A header is the size of unit 19's line to it or from it, which is sized for
    what unit 19 can send or take (SW-PRC-4); or larger where a stretch of it carries
    more (the parties in their order along the rack, each with what it makes less what it
    takes and unit 19's line with the balance: the largest running total), or where a
    unit's header that joins it is larger. It keeps that size from end to end. Reason:
    the low-pressure steam is mostly made in the units (the cracker's turbine exhausts
    60,000 lb/h of it) and crosses the plant to the deaerator and the sulfur block, more
    than unit 19's own let-down sends; a branch cannot be larger than what it joins; and
    one size lets a unit be joined anywhere along the rack.
  - Not modelled, and said so where the headers are listed: more low-pressure steam is
    made than used in this balance, and what a plant does with the rest (a vent
    condenser) is not drawn; the steam that flashes from condensate let down to its
    header is not sized for; and the growth of a hot header (by general knowledge a steel
    line 1,100 ft long at 650 °F grows about 4 ft) would be taken up in expansion loops,
    which this model does not draw.
  These are SmartWeld's own rules from the reasoning given; nothing was looked up.

## 76. Plant 3: the code layer (`SW-REG-*`) — recalled from general knowledge, flagged, for the owner to verify

The owner's instruction of 2026-11-24: pressure vessels carry a manufacturer's data report under
ASME Section VIII and Section I; pressure piping carries its registration (CRN) and its fluid
service under ASME B31.3 (Category D, Normal, Category M). This is the content of published codes
and of a regulator's practice, which section 0 excludes from every dimension. The owner chose,
when asked (PROVENANCE P-79), to have it applied from the assistant's own knowledge and flagged.

So this section is different in kind from every other in this document, and is kept apart:

- Everything in it is the assistant's recollection of general industry practice, written in its
  own words. No code, form, interpretation, regulation, regulator's publication or registry was
  opened, quoted or checked. It may be wrong, incomplete or out of date.
- It sets labels, classifications and record fields on demonstration data. It shapes no
  geometry: no dimension, thickness, weight or position anywhere in the model comes from it.
  Sizes remain SmartWeld's (§75), so a record may name a code while its thickness is SmartWeld's
  own figure; the record says so.
- Every record it produces is marked DEMONSTRATION, carries `"source": "recalled"` on each
  code-derived field, and is not a manufacturer's data report, a registration, a certificate
  or an engineering document. No form of any code body is reproduced: the records are in
  SmartWeld's own layout and words.
- The owner, who holds the codes, verifies each item below before relying on it (`SW-REG-0`).

- `SW-REG-1` Which code an item is labelled with.
  - Pressure vessels — columns, drums, reactors, the shells and channels of exchangers, air
    cooler headers, filters, adsorber beds, spheres and bullets, the waste heat boiler and
    condensers of the sulfur unit, and with them the desalter, the deaerator, the treating
    vessels, the liquid nitrogen vessel, the cracker's two vessels and the condensers of the
    vacuum ejector set — "ASME Boiler and Pressure Vessel Code, Section VIII, Division 1".
  - Power boilers and their pressure parts — the two water-tube boilers with their steam and
    mud drums and economizers, and the cracker's flue gas cooler with its steam drum —
    "ASME Boiler and Pressure Vessel Code, Section I".
  - Piping — all process and utility piping — "ASME B31.3 Process Piping"; the steam and
    feed water piping from a Section I boiler out to its first stop valves is boiler external
    piping, labelled "ASME Section I / B31.1".
  - Fired heater coils. As recalled, the Canadian standard for boilers, pressure vessels and
    pressure piping counts the coil of a fired process heater (its tubes, return bends,
    crossovers and manifolds inside the casing) as pressure equipment whose design is
    registered. Each heater's coil is listed in the registration index with a design number,
    labelled "ASME B31.3 Process Piping (fired heater pressure coil)", with its design
    conditions and material label; it is not a vessel and gets no vessel record.
  - Storage tanks at atmospheric pressure, catalyst hoppers, basins and pits (open to the
    atmosphere, SW-PRC-2), pumps, compressors and structures are outside this layer: they are
    not labelled and get no record. As recalled, the casings of rotating machines are not
    registered as vessels or fittings.
  - Packaged items that are neither vessels nor piping runs — the steam let-down and
    desuperheating stations, the nitrogen vaporisers, the ejectors — are counted with the
    fittings, in category H of SW-REG-6.
- `SW-REG-2` Report designation named on a record. Section VIII Division 1: `U-1` for a vessel of
  more than one chamber or one assembled in the field (exchangers, among them the sulfur
  condensers, the sulfur furnace with its waste heat boiler and the ejector condensers; columns;
  reactors; the cracker's reactor vessel and its regenerator, a record each; spheres); `U-1A`
  for a single-chamber vessel finished in the shop (drums, filters, treating vessels, the
  desalter, the deaerator, each adsorber, the liquid nitrogen vessel, bullets, and each air
  cooler bay's bundle of headers and tubes). Section I: `P-3` for a water-tube boiler unit, its drums listed on
  it and carrying `P-4` as parts; `P-4A` for the boiler external piping.
- `SW-REG-3` A pressure equipment record carries the content such a report carries, in
  SmartWeld's layout: tag and service; a fictional fabricator ("Demonstration Fabricator A"
  to "F", no real company), serial number and year; code and report designation; registration
  number (SW-REG-6); maximum allowable working pressure at its temperature (the design pressure
  and temperature of SW-PRC-2); minimum design metal temperature, −20 °F unless the service is
  colder; test pressure; corrosion allowance; shell and head material, thickness, diameter and
  length; radiography and joint efficiency; heat treatment after welding; each nozzle with its
  service, size and class; supports; relief valve tag and set pressure; empty weight and
  volume; lethal-service flag; and, where a certified report has a manufacturer's and an
  inspector's signature, the words "demonstration record: not certified, not signed". Values
  that are the model's own (dimensions, thickness, weight, nozzles, design conditions) are
  taken from the model; the rest are recalled, by these rules:
  - test pressure: 1.3 × the working pressure for Section VIII Division 1; 1.5 × for Section I;
  - radiography: full, joint efficiency 1.0, where the wall is over 1-1/4 in, the service is
    hydrogen above 600 psi or the vessel is in lethal service; otherwise spot, efficiency 0.85;
  - heat treatment after welding: where the wall is over 1-1/4 in, or the service is amine,
    caustic or wet hydrogen sulfide;
  - lethal service: vessels whose contents are Category M by SW-REG-4;
  - minimum design metal temperature colder than −20 °F: −50 °F for the storage of three-carbon
    liquefied gas (propane boils at about −44 °F at atmospheric pressure, a property of the
    substance from general knowledge, and a vessel let down to the atmosphere chills to it);
    −320 °F for the liquid nitrogen vessel (nitrogen boils at about −320 °F);
  - corrosion allowance: the 1/8 in of SW-PRC-14; none on the stainless nitrogen vessel.
  What the model's own values mean on a record:
  - thickness is the wall the body is drawn with (SW-PRC-14, or the catalogue's own rule where
    it fixes one); a test checks every record's P R / t (P R / 2 t for a sphere) against S;
  - empty weight is the catalogue's weight of the body as drawn (shell, heads, supports, and
    platforms where it has them), to which a shell-and-tube exchanger's tubes are added (their
    number × length × the tube section of SW-EQC-30), since its body is drawn without them. An
    air cooler bay's record is of its pressure parts only: its tubes (four rows of 1 in tubes,
    wall d / 9, SW-PRC-9) and two header boxes, each drawn 12 in × 24 in × the bay's width and
    weighed as 1 in plate; the catalogue's weight of a bay counts a solid block standing for
    the bundle and is not used;
  - volume is the shell's cylinder and its two 2:1 heads, or the sphere; it is not stated for
    exchangers, boilers and air coolers;
  - nozzles are the item's process and utility connections of SW-PRC-15 with the size and class
    of their lines; manways, vents, drains and instrument connections are not listed;
  - the relief valve is named after the vessel's number and set at the working pressure; one
    is named for each chamber. The valves themselves enter the model with the piping.
- `SW-REG-4` Fluid service of a line, the categories of B31.3 as recalled:
  - **Category D**: the fluid is not flammable, not toxic and not damaging to human tissue; the
    design pressure is 150 psi or less; the design temperature is from −20 °F to 366 °F.
  - **Category M**: a toxic fluid of which a single exposure to a very small quantity, by
    leakage, can do serious irreversible harm; it is the owner who designates it.
  - **Normal**: everything else that is not under the high-pressure, high-purity or
    elevated-temperature provisions, none of which is used in this plant.
  Designation in this model, by SmartWeld standing in for the owner: Category D for cooling,
  service, raw, potable and fire water, plant and instrument air, nitrogen, and steam and
  condensate within the limits above; Category M for acid gas and sour water stripper gas
  (hydrogen sulfide-rich streams to the sulfur unit); Normal for every hydrocarbon, hydrogen,
  amine, sour water, caustic, liquid sulfur, boiler feed water, flare, and steam or condensate
  beyond the Category D limits. Recorded with each category, as recalled: examination of
  welds (D: visual; Normal: visual and 5 % random radiography of girth butt welds; M: visual and
  20 % random radiography, with a sensitive leak test); leak test (hydrostatic at 1.5 × design
  pressure; D may take an initial service test); and for M, no threaded joints (its small bore
  is socket-welded or butt-welded in this model). A line whose design temperature is 800 °F or
  more (heater outlets and reactor circuits of the reformer, the hot ends of the crude, vacuum
  and cracking units) is marked "elevated-temperature provisions may apply: for the owner to
  decide"; the model designates no line under them, and 800 °F is SmartWeld's round figure, not
  the code's threshold.
- `SW-REG-5` Material designations on records are labels, recalled, and change no geometry
  (SmartWeld's own grades remain the basis of every wall): carbon steel plate `SA-516-70`,
  pipe `A106-B`, fittings `A234-WPB`, forgings and flanges `A105`, studs `A193-B7` with
  `A194-2H` nuts, exchanger tubes `SA-179`; for hot hydrogen service (reactor circuits of units
  13 to 16: hydrogen or reactor effluent at a design temperature above 500 °F) plate
  `SA-387-11` and pipe `A335-P11` with fittings `A234-WP11` and flanges `A182-F11`; for hot
  sulfur-bearing oil above 550 °F (heater outlets and transfer lines of units 11, 12 and 17: a
  flammable stream at a design temperature above 600 °F) pipe `A335-P5` with fittings
  `A234-WP5` and flanges `A182-F5`; for amine regenerator and sour water overheads
  `A312-TP316L` with fittings `A403-WP316L` and flanges `A182-F316L`; for the liquid nitrogen
  vessel plate `SA-240-304`. A fired heater's coil takes the pipe label of its unit's hot
  service (`A335-P5` in units 11 and 12, `A335-P11` in units 13 to 16).
- `SW-REG-6` Registration numbers. As recalled: in Canada a pressure vessel, boiler or
  exchanger design, a pressure piping system's design, and each type of fitting are registered
  with the province's boiler and pressure vessel regulator and given a Canadian Registration
  Number: for vessels and piping, a letter and four digits; for fittings, a zero, a category
  letter and five digits (A pipe fittings; B flanges; C line valves; D expansion joints and
  flexible connections; E strainers, filters, separators and steam traps; F measuring devices;
  G relief devices; H other pressure-retaining components); then a decimal point and a digit
  for each province of registration, the first being the province of first registration —
  7 for New Brunswick. In this model: every vessel record has a design number; every piping
  line class in every unit has a piping system number, carried by each of its lines and pipe
  pieces; every fitting, flange and valve carries the number of its fitting category for its
  class and fictional maker, of which there are three ("Demonstration Maker 1" to "3", no real
  company). The piping system number is keyed by unit and line class (SW-REG-8). **Every number is invented** by a rule from the item's own tag,
  issued by no regulator and looked up nowhere; it may by accident equal a real number and
  means nothing if it does. Each is stored with `"demonstration": true`.
- `SW-REG-7` Files: `public/refinery/registry/` holds the equipment records, the line records
  and the registration index as JSON; printable records are written by SmartWeld's own PDF
  writer (SW-PDF-*) with the band "DEMONSTRATION DATA — not a manufacturer's data report, not a
  registration" on every page.
- `SW-REG-8` Line class and severity (SmartWeld's own scheme, not recalled; the owner's
  instruction that line classes be told apart by working pressure and by the risk of what
  flows). A plant 3 line class is written `{group}{rating}-{material}-{service}{rank}`:
  - group and rating as the generator's line class (SW-LC-*): the fluid group's letter (`H`
    process, `W` water, `S` steam, `C` condensate and boiler feed water, `G` air and nitrogen,
    `F` flare) and the pipe class number, which follows from the design pressure and
    temperature (SW-PRC-3);
  - material: `CS` carbon steel, `C1` the 1-1/4 Cr alloy steel label, `C5` the 5 Cr alloy steel
    label, `SS` the stainless steel label (SW-REG-5);
  - service: `D`, `N` or `M`, the fluid service of SW-REG-4, followed by the medium rank below.
  So `H600-C1-N4`, `W150-CS-D1`, `H150-SS-M5`: the class name itself carries the working
  pressure (its rating) and the risk of the medium (its last digit). Each class has a severity
  level from 1 to 5, the larger of two ranks:
  - pressure rank by pipe class: P150 1, P300 2, P600 3, P1200 4, higher 5;
  - medium rank: 1 a Category D fluid; 2 a fluid that is neither flammable nor toxic but is
    beyond Category D or harmful on contact (steam, condensate and boiler feed water at
    pressure, amine, caustic, liquid sulfur, sour water);
    3 a flammable liquid; 4 a flammable gas or a liquid that flashes to one (any flammable
    stream that is vapour or two-phase in its line, liquefied gas, hydrogen and reactor
    effluent, flare); 5 Category M.
  Reason: a leak's consequence grows with the pressure behind it and with what escapes; taking
  the larger rank keeps a low-pressure toxic line and a high-pressure water line both in view.
  The level is a label for sorting and for choosing how closely to look; it sets no
  examination by itself (SW-REG-4 does).
- `SW-REG-9` The piping register of a piped unit. Once a unit is piped (§79), every line the
  generator built and every component of every line is given its record, so that no piece of
  the pressure boundary is without one.
  - A line record for each generated line, as SW-REG-4, -5 and -8 give it for the flowsheet
    line or utility connection it is, or is part of. The part of a line after its control
    station (SW-RPI-9) has its own pipe class and design pressure and so may fall in another
    line class, with another piping system number; an installed spare's connection and a
    branch's root connection (SW-RPI-8) take the record of the line they complete; a utility
    header takes its fluid's, at the largest design conditions of the connections it serves.
  - A component record for each component: its line; what it is (the catalogue's own
    description of it), its size and class; the material label of its kind for its line's
    material; and its registration. Labels, recalled, as SW-REG-5: pipe, fittings, and
    flanges with the line blanks clamped between them, as written there; valve bodies
    `A216-WCB` on carbon steel lines, `A217-WC6` on the 1-1/4 Cr label, `A217-C5` on the
    5 Cr label, `A351-CF8M` on the stainless label; studs `A193-B7` with `A194-2H` nuts.
    A gasket is listed as the catalogue draws it (a flat ring of compressed sheet, SW-FLG-2),
    with no label of its own. Registration, as
    SW-REG-6: a piece of pipe carries its line's piping system number; an elbow, tee,
    reducer, cap, branch outlet fitting, swage, nipple, coupling or union carries its
    maker's number in category A; a flange of any kind, and a spade or spectacle blind,
    category B (recalled: line blanks are counted here with the flanges they are clamped
    between; they may belong in H, for the owner to verify); a valve of any type, category C;
    studs and gaskets carry none (recalled: bolting and gaskets are not registered as
    fittings) and are listed so that the count of the joint is whole. The maker is one of
    the three fictional makers of SW-REG-6, taken by a rule from the component's catalogue
    description, so that every piece of one description in the plant is one maker's and
    carries one number.
  - Each weld is counted under its line's fluid service with the examination SW-REG-4 records
    for it. The register does not say which welds a random sample takes: that is drawn when
    the work is done, not in a model.
  - Files: `public/refinery/registry/piping/unit-NN.json`, one for each piped unit, and a
    table for each unit in `docs/REFINERY-REGISTRY.md`. Every value is marked as the
    model's, recalled or invented, as in the rest of the layer.

## 77. Plant 3: site, terrain and plot plan (`SW-SITE-*`)

The site is invented. It is drawn after the kind of coast the owner chose — rock headlands, coves,
a large tide, ground rising inland — and after no real place: no map, chart, survey, satellite
image or elevation data was used, and its shoreline and contours are a formula written here. The
spacings are SmartWeld's own, from the reasoning given; no spacing standard, insurer's table or
company practice was consulted, and they are for the owner to tune (PROVENANCE P-79).

- `SW-SITE-1` Frame and datum. Site x is east, z is south, y is up (SW-U-4); the origin is the
  north-west corner of the property; elevations are feet above the model's mean sea level.
  The site is 5,000 ft east to west and 5,400 ft north to south, the southern part of it water.
  Site data are written in feet and the model is built in inches, as everything else is.
  Plant coordinates in every export: E = x, N = −z, EL = y. A unit or pipeway is built in its own
  level local frame and set on the site by a turn about the vertical in quarter turns, a shift
  and its bench elevation (SW-CELL-*, to follow).
- `SW-SITE-2` Natural ground, a formula in `src/refinery/terrain.ts`, in feet, with the bell
  b(t) = (1 − t²)² for |t| < 1 and 0 beyond.
  - Shoreline: z = 3,900 + 420 b((x − 1,200) / 750) − 300 b((x − 3,900) / 650): it runs east–west
    with a headland pushed 420 ft seaward in the south-west and a cove drawn 300 ft inland in
    the south-east.
  - Inland, at a distance d from the shoreline: a rock bank rising 38 − 28 b((x − 3,900) / 650) ft
    in the first 60 ft (38 ft generally, 10 ft at the cove, where there is a beach); then a
    plateau climbing at 1.5 % for 1,900 ft and at 4.5 % beyond; a hill of 60 ft and 700 ft
    radius in the north-west corner; a ravine 260 ft across along the east boundary, 10 ft deep
    at the north and 28 ft where it reaches the cove; and undulations of up to 4 ft.
  - Seaward the bed falls at 4 %, at 9 % off the headland and at 2 % in the cove.
  - The tide ranges 11 ft either side of mean sea level.
  Reason: deep water close to a headland is where a berth goes; a plateau above a rock bank
  keeps the plant above the sea; a gentle plateau takes the process units on one level with
  little earth moved, and the steeper ground behind it terraces the tanks above them; ground
  that falls to one side gives the drainage a way out.
- `SW-SITE-3` Benches. Each area stands on a level bench cut and filled into the natural ground,
  with slopes of 2 horizontal to 1 vertical running out to meet it. A bench's elevation is the
  mean of the natural ground over it, to the foot, so cut about balances fill; two benches
  stand at least twice their difference in elevation apart, so that the slope between them
  fits. Roads between benches are graded the same way, as ribbons with 2 : 1 side slopes.
  Benches are drawn level: the falls for drainage within a bench (a few inches) are not
  modeled. Reason: equipment and
  racks want level ground; a 2 : 1 slope stands in soil and weathered rock without a wall.
- `SW-SITE-4` Where each area goes, and why.
  - Process units, on one bench at mid-height: on both sides of a main pipeway that runs
    east–west in a corridor 60 ft wide (the rack, 30 ft, and 15 ft either side of it), each
    unit's own rack at right angles to it, the unit's battery limit at the corridor's edge.
    (Amended 2026-11-24 at the owner's instruction, "the units are all too segregated, they
    should be together and more intertwined to where they all connect with one another":
    the corridor was 100 ft, which left 30 ft of open ground between a unit's valve bay and
    the rack its lines cross to; at 10 ft a line steps from the unit's last bent to the main
    rack's column line in one span, and the way along the pipeway is under the rack itself.) Fired heaters stand at the outer end of their unit, away from the
    pipeway and from equipment that can leak. The crude and vacuum units stand side by side,
    since they exchange hot streams; the hydrogen users stand beside the reformer that feeds
    them; the sulfur block stands downwind of the others; room is left for one more unit.
  - Utilities at the west end of the process bench, upwind in the prevailing west-south-west
    wind, so their fired boilers and air intakes stand in clean air.
  - The cooling tower at the east end, downwind, its length across the wind, so its plume and
    winter ice fall clear of the units and roads.
  - Tank farm on terraces above the process bench to the north, each tank or group in a dike
    (SW-CIV-14), an intercepting ditch and a road between the terraces and the process bench.
    Crude tanks to the west of the terraces, toward the marine terminal.
  - Liquefied gas spheres at the north-east, beside the ravine and lower than the tank
    terraces, so that a heavy vapour release drains away from the plant and down the ravine.
  - The flare on the north-west hill, at least 500 ft from every tank, unit, building and
    boundary, with a sterile circle of 300 ft radius kept bare. Its knock-out drum stands at
    the low end of the flare header, at the west end of the process bench, so that what
    condenses in the header drains to the drum and what condenses in the line climbing to the
    flare drains back to it; the water seal drum stands at the foot of the stack.
  - The marine terminal off the south-west headland, where the bed reaches 60 ft at low water
    within 900 ft of the shore.
  - Wastewater treatment at the low south-east, where every drain reaches it by gravity, with a
    storm pond beside it above the cove.
  - Offices, laboratory, workshops, stores, fire station and the main gate at the west
    boundary, upwind and at least 500 ft from the nearest unit; the control building between
    them and the units, 250 ft from the nearest unit; truck loading at the north-west with its
    own gate, so road tankers do not pass through the plant.
- `SW-SITE-5` Spacing kept on the plot (clear distances): unit to unit 50 ft, with a road
  between (amended 2026-11-24 at the owner's instruction, from 100 ft: a road 20 ft wide
  and 15 ft either side of it is room for a fire engine or a crane to stand and work
  between two units; the units along the pipeway are one plant and share its rack); a
  unit's plot is no wider than its unit, to the next 10 ft (added 2026-11-24: the plots
  were drawn before the units were built, twice as wide as the units came to be, so that
  neighbours stood 200 to 300 ft apart and read as separate plants); equipment to a fired
  heater 50 ft; tank shell to tank shell half the larger
  diameter, 50 ft at least; tank shell to its dike's inner toe half its height, 15 ft at least;
  tanks to a process unit 250 ft; spheres and bullets one diameter from each other and 200 ft
  from anything else; units and tanks to the property line 200 ft. Tanks of one kind of stock
  stand in a row in one dike, which is widened beyond the toe clearance where its wall would
  otherwise pass the 6 ft of SW-CIV-14; dikes stand 100 ft apart with a road between. Reason: a fire in one unit, tank or dike should not carry to the next
  before it is fought, and fire-fighters need a road and room between.
- `SW-SITE-6` Roads: primary roads 24 ft wide and secondary 20 ft, on their own graded benches
  at 6 % at most, with a road round the process bench, round each tank terrace and to every
  area; pipeways cross roads on bridges with 20 ft clear (SW-STA-8), except the road across
  the main pipeway, which passes under its rack between two bents (SW-PWY-2; amended
  2026-11-24). A chain-link fence on
  posts runs 50 ft inside the property line. Reason: every unit and tank must be reachable by
  a fire engine from two directions.
- `SW-SITE-7` The plot plan — the rectangle, bench elevation and orientation of every area — is
  drawing data in `src/refinery/site.ts`, checked against SW-SITE-5 by test, and printed in
  `docs/REFINERY-PLOT.md`.

## 78. Plant 3: equipment bodies and the arrangement of a unit (`SW-CELL-*`)

How each sized item of §75 becomes a body in the model, and how the items of one unit are arranged
on its plot. SmartWeld's own arrangement, from general plant-layout understanding with the reason
for each choice; no layout standard, company practice or existing plant was consulted
(PROVENANCE P-82). The bodies are the catalogue's (§25, §66, §69, §72), built at the sizes of §75 by
their own geometry rules, which are unchanged.

- `SW-CELL-1` A unit's frame. A unit is built level in its own frame, in inches: x from its battery
  limit outward along its pipe rack, z across the rack, y up from its bench; the rack's centre line
  is z = 0. It is set on the site by a quarter turn about the vertical, a shift to its plot and its
  bench's elevation (SW-SITE-1). Equipment centres and rack bents stand on a 6 in grid (SW-LAY-2).
  Across its plot the unit is centred to the nearest 6 in (amended 2026-11-24, with §80), so
  that the lanes of its rack, and the spools on them at its limit, stand on the 6 in grid of
  the main pipeway's frame: the generator pipes the pipeway on that grid (SW-RT-*), and a
  unit centred to the fraction its own extent gave stood up to 3 in off it.
- `SW-CELL-2` The unit's rack: bents at 20 ft, 24 ft wide, tiers at 16, 22 and 28 ft (as SW-RK-*,
  the rack of plants 1 and 2). It is 30 ft wide, or 36 ft, where the unit's lines would
  load three tiers of a narrower rack beyond 60 % of their lanes: the lines that run more
  than 20 ft along it, a pipe's width and 3 in each, counted at the busiest section between
  the centres of the bodies they join, with 5 ft for the utility headers, or the lanes its
  own headers take on the top tier where that is more (each as wide as its pipe, or as its
  largest connection's flange and 6 in, and 3 in between: SW-RPI-5), shared among
  three tiers of the rack's width less 4 ft (amended 2026-11-24: the crude unit's lines do
  not fit a 24 ft rack on three tiers; amended 2026-11-25: the cracking unit's ten headers,
  two of them 20 in, take 17 ft 5 in of a top tier, not 5 ft, and on a 24 ft rack its lines
  found no lane on the two tiers left to them; no other unit's rack is changed by it). Its lanes begin 30 ft from the battery limit and run as far as
  the unit's longest row of equipment, and where heaters stand beyond it, on to 10 ft short of
  their pads, so that their lines have steel under them; one bay more of the same steel stands ahead of them,
  from 10 ft to 30 ft from the battery limit: the valve bay, where the unit's isolation valves
  stand (SW-RPI-4). Reason: the rack is the
  unit's spine; every line between items runs on it.
  The kit stands a caged ladder outside each end bent of a rack (SW-LAY-3). The one at the
  battery-limit end is not built (amended 2026-11-24, with §80): the lines to the main
  pipeway pass out between the columns there, and in the crude unit the outermost spool's
  line ran straight into the cage. The ladder at the rack's far end stays.
- `SW-CELL-3` Rows. From the rack outward on each side: pumps in a row, shafts square to the rack
  and suction ends 5 ft from its column line, or as far out as the largest suction valve set
  on that side needs to end outside that line (amended 2026-11-24: a 14 in suction's spade,
  reducer and gate valve reach 7 ft from the casing, and one ran into a column's footing);
  an access way 8 ft wide; then, on one side,
  shell-and-tube exchangers square to the rack with their channel ends outward; on the other side the vessels: drums parallel to the rack, columns, reactors
  and other vertical vessels, their centres on one line. Compressors stand in the exchanger row
  beyond the last exchanger. Fired heaters stand beyond the outer end of the rack, 50 ft from the
  nearest equipment. Items follow one another along the rack in the order the process meets
  them, 4 ft apart (8 ft between vessels with platforms). Pumps stand on the side of the vessels
  they draw from where they draw from one, otherwise on the exchanger side; on the vessel side
  each pump with its spare stands opposite the vessel it draws from, as near that vessel's
  centre along the rack as the pumps already placed allow, so that its suction line runs
  straight down to it and never over the rack. A reboiler (the exchanger from which a line
  enters a column at its "reboiler return") stands in the vessels' row, next after the column
  it boils for and 3 ft clear of that column's platforms, square to the rack as the other
  exchangers are, its channel end away from the rack (amended 2026-11-24: reboilers stood in
  the exchanger row across the rack, and a 16 in return of boiling amine had to climb to the
  rack, cross it and come down again to reach its column). Its two lines to the column are
  then less than 20 ft apart at their ends and are laid direct, not on the rack (SW-RT-1).
  A sulfur pit stands beyond the outer ends of the sulfur condensers that drain into it,
  across an 8 ft way, its middle at theirs along the rack (amended 2026-11-24: it stood
  with the vessels across the rack, and the rundowns ran 175 ft of the rack to reach it;
  next after the condensers in their row they were still sent over the rack). Each
  rundown is then a few feet of pipe from under a condenser's outer end to the pit's roof,
  laid direct (SW-RT-1); liquid sulfur runs down to its pit and is not lifted. A unit's storage tanks (20 ft across and more) stand after its other vessels, at the far
  end of the row or in a row behind it (amended 2026-11-24: two tanks 30 and 50 ft across
  stood in the middle of the sulfur unit's first row and pushed its stripper, furnace and
  converters 110 ft from the rack; a tank has three or four connections, a column a dozen).
  An ejector set stands behind the column it draws from, in a row of its own 10 ft further
  from the rack, its first ejector's suction at the column's station along the rack and
  its condensers' channels toward the heater end (added 2026-11-24). Reason: a vacuum
  column's overhead is the unit's largest line, and under vacuum every foot and every
  turn of it costs pressure the ejectors must make up: it runs straight back from the
  column's top and falls onto the first ejector; and the generator sends along the rack any
  process line whose ends are more than 20 ft apart along it (SW-RT-*), which this line
  must never be.
  A hotwell stands under the ejector set that drains into it, square to the rack, its axis
  under the set's row of drains and its middle under the middle of that row (added
  2026-11-24). Reason: a tail pipe is a leg of liquid held up by the vacuum above it, and
  must fall straight, with no level run for vapour to lodge in.
  Where the flowsheet states that an item stands after another (its parameter `after`), it
  stands next after that item in that item's row, whatever the order the process meets them
  in; and an item stated to begin a row (`row: 'new'`) begins one, though the row before it
  is not full (added 2026-11-25). The cracking unit is laid out with these and with the
  order its items are declared in. Next the rack, from the battery limit: the feed drum;
  the compressor's interstage drum and the main fractionator's receiver, its side stripper
  and the fractionator itself, under the air coolers and across the rack from the
  compressors and exchangers that serve them; the reactor and regenerator; the flue gas
  cooler; the scrubber with its stack; and after the scrubber the two catalyst hoppers and the
  slurry filter. Behind
  the three drums, in a row of its own that ends before the side stripper, the head of the
  gas plant in the order the gas goes through it: the high-pressure separator, the primary
  and sponge absorbers and the fuel gas amine absorber. The rest of the gas plant stands
  across the rack (next paragraph), in the order the gas, the gasoline and the liquefied
  gas go through it: the fuel gas knock-out drum; the stripper with its reboiler; the
  debutaniser with its reboiler and its receiver; the liquefied gas amine contactor and
  its caustic wash drum; the depropaniser with its reboiler and its receiver; and the
  gasoline's caustic wash drum. The air blower stands after the last exchanger of its
  row, across the rack from the regenerator.
  Where the flowsheet states that a vessel stands across the rack (its parameter
  `across`), it stands on the exchangers' side: the vessels so stated in one row on one
  centre line, in the order they are declared, 8 ft beyond the pumps' row as the exchangers
  are, and beginning where the exchangers' and machines' row ends, or 4 ft beyond the
  station of a regenerator that stands across the rack where that is further along: its
  blower's discharge runs along the row to that station before it turns under the rack
  (SW-RPI-3), and the ground it runs over is left to it. A reboiler goes with its column. A
  pump that draws from a vessel across the rack stands on that side too, opposite its
  vessel, as the pumps of the vessels' side stand opposite theirs (added 2026-11-25).
  Reason: a reactor and regenerator with their tower are a wall beside the rack, here 48 ft
  long and 126 ft high, and a main fractionator with its platforms one 23 ft long and
  115 ft high; what stands in a row behind either has no way to the rack but round its
  ends, where a drum on its saddles is passed over. As first laid out, the fuel gas
  knock-out drum and the stripper stood behind the side stripper and the fractionator, and
  twelve more items behind the cracker, the flue gas cooler and the scrubber. The
  generator takes a line off the rack at the station of the item it goes to, or within 3 ft
  of it (SW-RT-1); the debutaniser's station lay inside the reactor's tower, its 12 in
  overhead could not be brought to the rack there, and the search for a way round ran to
  the limit of what the generator looks at without finding one (the first full routing
  run, 2026-11-25). The side of the rack opposite the converter was empty beyond the last
  exchanger. The items moved there stand each with the rack before it and nothing between,
  along from the condensers and coolers that serve them; the two hoppers and the filter,
  at the end of the cracker's own row, have the rack before them as well; and the four
  items left in the second row stand behind the feed drum, the interstage drum and the
  receiver.
  The cracker stands with its reactor toward the fractionator it feeds: where that stands
  before it in the row the item is turned end for end, and built with its riser on the
  other side of its line of centres (SW-EQC-33), so that the riser still faces the rack.
  Its air inlet line leaves the regenerator toward the rack, where the blower stands. The
  flue gas cooler's inlet end faces the item its gas comes from; the scrubber's inlet duct
  faces the item its gas comes from, the tower turned end for end where that stands before
  it and its pumps then built on the other side (SW-EQC-36), away from the rack. The
  main fractionator's overhead condenser stands last of the air coolers, next the
  fractionator (`after`).
  The regenerator and its cooler stand clear of one another by what the duct between them
  needs in one plane: 2 ft beside the regenerator's platforms, the duct's elbow, and at the
  cooler's inlet the connection itself and the length the generator needs straight at a
  connection for the valve it stands there (which is not built, SW-RPI-14, but is in its
  way while it routes: a gate valve's length, two pipe sizes and 1 ft), 23 ft in all. The
  cooler and the scrubber stand apart by twice that straight length and their two
  connections, and 1 ft, 28 ft: the duct between them is one straight piece, for the
  cooler stands on piers that bring its axis to the height of the scrubber's inlet duct
  (SW-CELL-4). Reason: the regenerator's flue gas goes through its cooler to the scrubber
  and the reactor's vapour to the main fractionator, in the unit's largest and hottest
  lines, and each of those lines should have the turns it needs and no more; a column's
  overhead system stands where its air coolers are; and the gas plant begins beside the
  compressor that feeds it. Laid out in the order the flowsheet first named its items, the
  cooler stood in the second row, 35 ft behind the others and 90 ft along from the
  regenerator; the hoppers and the scrubber stood between the reactor and the
  fractionator; the fractionator's overhead ran 175 ft back along the rack to its air
  coolers, the wet gas 260 ft to the compressor and as far back again twice more; and three
  tiers of a 30 ft rack had no lane left for the last of the lines sent along it. And laid
  out with the cooler 20 ft from the regenerator and 15 ft from the scrubber, on its pad,
  the 42 in duct went round the regenerator's air inlet by a dog-leg of 12 ft and the
  36 in duct came back on itself, because the two valves the generator stands at the ends
  of each, 12 and 10 ft long, left its elbows no room between them.
  Reason: pumps under
  the edge of the rack have the shortest suction and discharge; a channel end facing the access
  way lets a tube bundle be pulled; heaters away from equipment that can leak keep a leak from
  its flame; a reboiler is fed by nothing but the head of liquid standing in the column's
  base, and every foot of pipe and every turn between the two is taken from that head, while a
  boiling return carried up and over a rack would collect liquid in its low legs and surge.
- `SW-CELL-4` Bodies.
  - Pumps (SW-EQ-4): casing diameter 1.5 × the impeller of SW-PRC-5, 10 in least; casing width
    half the impeller for each stage, 6 in least; motor of SW-PRC-5's frame diameter, 1.8
    diameters long; a baseplate 12 in wider than the larger of them and long enough for both and
    the coupling; a concrete pad 9 in high, 6 in larger all round.
    Amended 2026-11-27 (owner's decision, P-95): the shaft's height above the baseplate is the
    catalogue's (SW-EQ-4, amended the same day), taken from it rather than worked out again
    here, and the pad, 9 in at least, is still raised until the shaft is on the 6 in grid
    (SW-RPI-2). Reason: the cell had set the shaft by the casing alone, as the catalogue did,
    and so stood 16 pumps' motors in their own pads (P-1104A/B by 7 in). A pump whose motor is
    more than 8 in larger than its casing now stands higher on its pedestal (18 pumps; the
    other 46 whose motor is the larger stand as they did): 12 of the 18 keep their shaft
    where it was on a pad made up less (9 1/2 in to 10 1/2 in high), and in unit 11 the shafts
    of P-1101A/B and P-1103A/B rise 6 in and those of P-1104A/B 12 in, their suction and
    discharge nozzles with them, so the lines to those six are routed again.
  - Horizontal drums (SW-EQ-2) and the desalter and deaerator (SW-EQC-47, -50): the shell's
    underside 4 ft above grade, and 10 ft where a pump draws from the drum, on concrete piers
    under the saddles; higher where a connection underneath needs more for its valve and
    the turn after it, as an exchanger's does (so under the desalter, 5 ft at least, by its
    12 in inlet; and under a horizontal reactor by its outlet; amended 2026-11-24, when
    both stood at a fixed height and their bottom valves ended below grade).
    Reason: the height is the pump's suction head.
  - Shell-and-tube exchangers (SW-EQ-3): centre line 4 ft above grade plus the shell radius; a
    second shell stands on the first. The 4 ft becomes what the largest connection's valve needs
    under the shell where that is more, counting the throttling globe valve the generator
    adds where a water connection from a header arrives and where a cooling water return
    leaves (SW-LL-7).
  - Columns, reactors and other vertical vessels (SW-EQ-1): on skirts (15 ft for columns as
    SW-PRC-7, 8 ft for reactors, 5 ft for others), with platforms every 15 ft and ladders
    (SW-EQC-32) where the vessel stands more than 30 ft high. The swaged vacuum column is
    SW-EQC-65. Walls by SW-PRC-14. The platforms cover the half of the shell away from the
    rack (180° about the manways), the ladders stand at their ends, and the davit stands on
    that half with its arm swung outward (amended 2026-11-24 from the catalogue's 270° and its
    arm across the head). Reason: the half that faces the rack is the piping's: every
    connection stands there and every line rises or falls there, and the manways, platforms
    and ladders are reached from the other side. With 270° the ladders stood within 25° of the
    rack's direction, and on a 6 ft column a ladder's cage came within 4 in of the centre line
    the connections stand on; the davit's arm lay over the top nozzle.
  - Air coolers (SW-EQC-11): each bay 14 ft by 32 ft with two fans. The bays stand side by
    side over the rack from its second bay on, their tubes across it, on a deck 9 ft above the
    top tier: posts `W8x31` on the rack's columns at each bent under the bays, a beam `W14x48`
    32 ft long across the rack on each pair of posts, and two girders `W12x40` along the rack
    15 ft either side of its centre line, on which the catalogue cooler stands on legs of 2 ft.
    Reason: over the rack a cooler's lines rise beside the rack's columns from the lanes below
    and are carried all the way; beside the unit, beyond the exchangers, they had no supported
    way to it. The 9 ft clears the take-offs that rise from the headers on the top tier and
    lets the fans draw air. Sizes by span / 20 for the beams' depth, as the rack's own steel
    (SW-RK-2). (SW-PRC-9's "over the rack" stands again.)
    Amended 2026-11-27 (owner's decision, P-95): each cooler's columns stand on the girders'
    tops as the girders are drawn. A girder is set by its nominal depth, its centre 6 in under
    the deck's 9 ft, and drawn at its own depth (SW-W-5: 12.33 in for the `W12x40`), so its top
    stands 0.165 in above the 9 ft; the cooler's columns are that much shorter than 2 ft
    (23.835 in) and stand there, and the cooler's plenum, bundle, header boxes and every
    connection stay where they were. Nothing of the deck moves. Reason: the cooler had been set
    with its column bases at the 9 ft, inside the girders' top flanges; an independent clash
    check of plant 3 found the four columns of every bay (33 bays) 0.165 in into the girders
    (0.17 in to 0.34 in by the checkers' own measures). Shortening the columns, rather than
    raising the cooler or lowering the deck, leaves every line to a cooler, and every support
    hung from or resting on the deck, where it was.
    Amended again 2026-11-27 (P-95): the deck's beams and posts are stacked by their drawn
    depths from the girders down. The girders stay where they are (their tops, where the
    coolers' columns stand, and their undersides, where lines hang, do not move). Each beam is
    set with its top flange on the girders' undersides: its centre is the girders' underside
    less half its own drawn depth (SW-W-5: 14.31 in for the `W14x48`). Each post is cut to
    stand from the rack's top tier to the beam's underside. With `W12x40` girders: girder
    underside 431.835 in, beam centre 424.68 in (was 425), beam underside and post top
    417.525 in, post 81.525 in (was 82). A line hung from a beam's underside follows it
    (SW-RPI-20). This supersedes, for the beams and posts, the first amendment's "nothing of
    the deck moves"; the girders, the coolers and every support under the girders stay where
    they were. Reason: a rolled member is as deep as it is drawn, not as the number in its
    name. Stacked by nominal depths, each beam stood 0.32 in into the girders and each post
    0.155 in into its beam (74 and 74 in units 11 to 18, found within one structure by the
    plant's clash audit). Members that bear flange on flange are whole sections, bolted
    through and never cut into; the post is the piece cut to length to suit. Raising the
    girders instead would leave short the 85 hangers that hang from their undersides; lowering
    the beams moves one hanger's top, by 0.32 in.
  - Fired heaters: vertical cylinders (SW-EQC-15) with a stack 0.6 of the firebox height, and
    cabins (SW-EQC-53), at the sizes of SW-PRC-10.
    Amended 2026-11-27 (owner's decision, P-95): a cabin is given its coil outlet as a
    connection through its wall (SW-EQC-53, amended the same day), where SW-RPI-2 sets it: on
    the wall that faces the rack, 2 ft above the floor (to the 6 in grid) and a quarter of the
    box's length (to 6 in) from its middle, with the outlet's flange diameter, so that its
    buckstays stand clear of it. Its other connections are above the hip, where it has no
    buckstays, or under the floor. No connection and nothing else of the heater moves.
  - Compressors and blowers (SW-EQC-12, -14): casing diameter 14 in × (gas horsepower / 100)^(1/3),
    10 in least; driver of SW-PRC-5's frame diameter or SW-PRC-12's turbine wheel; a skid under
    both.
    Amended 2026-11-27 (owner's decision, P-95): a turbine driver is given its exhaust
    (SW-EQC-51, amended the same day) where SW-RPI-2 sets it: on the casing's side away from
    the lube console, its pipe's radius and 3 in (to 6 in) under the shaft, at the casing's
    middle on the 6 in grid, of its line's size and class, so that the side pedestal under it
    is cut round it. No connection moves, and the package's footprint is as before.
  - Storage tanks (SW-EQC-44), spheres (SW-EQC-48) and bullets (SW-EQC-46) at the sizes of
    SW-PRC-13.
  - The cracker (SW-EQC-33): regenerator diameter for its flue gas rising at 3 ft/s, to 6 in,
    and 1.5 diameters between tangents; reactor vessel 0.6 of the regenerator's diameter and
    1.2 of its height. Its flue gas outlet and air inlet line are of the outside diameters of
    the lines that join them, its vapour outlet is the plant's own connection, and its two
    vessels and riser stand on the 6 in grid (SW-EQC-33's stated inputs; added 2026-11-25);
    it is set so that the regenerator's axis is on the grid along and across the rack and
    the air inlet line's axis in height (SW-CELL-7). That line runs out 3 ft under the
    rack's lowest tier (amended 2026-11-25): its line from the blower across the rack
    passes under that tier's beams, 14 in deep, with the pipe's radius and a foot to spare,
    and comes into the regenerator at the height it crossed at. At the item's own
    proportion the inlet stood 6 ft 6 in higher, level with the space between two tiers:
    the line dipped under the rack and climbed again, two more elbows, and the generator's
    search, which found that way on the first layout, ran out on the second without
    finding it. The wet scrubber (SW-EQC-36): diameter for the flue gas at 10 ft/s, eight
    diameters high, its gas inlet duct level and of its line's outside diameter. The flue gas
    cooler's two ducts are of their lines' outside diameters, without flanges, and the steam
    outlet its drum is drawn with gives way to the plant's own connection; where its gas goes
    on to a scrubber it stands on concrete piers under its saddles, as high as brings its
    axis to that scrubber's inlet duct (11 ft 6 in), so that the duct between the two is
    straight (added 2026-11-25).
    The flue gas cooler (SW-EQC-37), sulfur furnace and condensers (SW-EQC-56,
    -57), incinerator (SW-EQC-58), adsorbers (SW-EQC-55), boilers (SW-EQC-40), cooling tower
    (SW-EQC-49) and flare (SW-EQC-35) are the catalogue's items at the size their flow or duty
    gives; packages with no body of their own are shown as a vessel of their volume. The
    adsorbers are four vessels of 72 in × 20 ft between tangents; the sulfur furnace is 72 in
    with 15 ft of chamber and 15 ft of waste heat boiler; a boiler's steam drum is 54 in × 25 ft.
    The reaction furnace's boiler outlet duct is of its line's size, the plant's nozzle
    standing on it. Amended 2026-11-27 (owner's decision, P-95): the steam outlet the waste heat
    boiler's drum is drawn with gives way to the plant's own connection, as the flue gas
    cooler's does. Reason: the plant's steam connection stands on the drum's top at its middle
    on the grid (SW-RPI-2), 2 in along the drum from the drawn 8 in outlet, and an independent
    clash check of plant 3 found the two 2.8 in into each other's flanges and the valve, gasket
    and studs bolted at the plant's (line 4"-P1200-LS-18508) 0.4 to 0.6 in into the drawn one;
    the drawn outlet was the catalogue's, which the plant's takes the place of. The sulfur
    loading station is SW-EQC-67 with an arm of its line's size,
    its vehicle bay on the side away from the rack; the sulfur pit is 32 ft × 15 ft × 8 ft inside (15 ft, so that its steam
    coil has an even number of passes and both its ends stand at one end of the pit), its
    pump without the catalogue's discharge pipe. The pit stands in the ground, the top of
    its roof slab 1 ft above grade (amended 2026-11-24: it had been set down on the ground,
    9 ft high, in the way of the furnace's outlet; sulfur runs down into a pit).
    Each adsorber is a vessel of its own (amended 2026-11-24 from the catalogue's package,
    SW-EQC-55, whose headers are part of the item: the plant's lines could not meet them on
    the grid, and the headers are piping, which the generator makes with its welds and valves).
    Each takes the wall of SW-PRC-14 where the catalogue lets a wall be stated (§72).
  - The vacuum ejector set (SW-EQC-68 at the sizes of SW-PRC-18; added 2026-11-24) stands on
    a steel deck of its own, built of catalogue members as the rack is, its long axis along
    the rack and the later condensers toward the rack (where it stands: SW-CELL-3). Its
    seven connections are left off, as every body's are.
    - Height. The deck's floor is where the first condenser's boot stands the tail pipe's
      height of SW-PRC-18 above the hotwell's centre line, raised to a whole number of
      equal stair flights (12 ft at most each, risers of 7.5 in: SW-SR-1, -3).
    - Plan. The deck reaches 30 in beyond the set's widest part on the side away from the
      rack (the way along the set), 24 in beyond the water pipes on the rack side, 48 in
      beyond the channel covers (room to take a cover off) and 36 in beyond the steam pipe
      behind the first ejector; each to the next foot.
    - Steel, sized as §71 sizes its structures, for a floor load of 250 psf (SW-STA-12).
      Beams across the deck, of depth span / 20 to 2 in, each sized for that load on what
      it carries (SW-PF-3): one under each line of saddles and each ejector frame, which
      also takes its equipment as a load at mid-span × 1.25 (a condenser is weighed with
      its tubes and full of water; a frame takes a third of the first ejector); between
      those, beams at 4 ft at most (SW-PLT-2). Where pipes pass through the floor the two
      beams either side of their row stand 4 ft apart about its middle. A girder under each
      long edge, of the beams' depth, for the floor load on half the width and the heaviest
      beam's end as a load at mid-span. Columns under the girders at 20 ft at most, of
      depth height / 36 to 2 in (SW-PLT-3), on base plates and pads. Struts between the
      columns at the height of each stair landing: along each line (8 in), and across
      (depth span / 30 to 2 in). Crossed rods in every storey of the end bay of each line
      next the channel covers and of both end frames (no line hangs from a rod). Grating (SW-GR-1) cut round the
      saddles, the frames' posts and the set's own pipes (an inch clear), and under each
      boot for the sleeve of the tail pipe that falls from it (SW-PEN-1); guardrail on
      every edge. A pipe's hole is an inch clear of the pipe where it passes between the
      grating's faces, its bend included where a bend begins below the floor (amended
      2026-11-27: sized to the straight leg alone, the hole left the cooling water supply's
      first bend 0.4 in inside the grating, found by the plant's clash audit).
    - A stair of those flights stands along the deck's far side, a landing at each end of
      each flight on posts of its own, its top landing against the deck beside the
      condensers, where the guardrail is open. Each stringer is cut level at the floor and
      plumb at the landing, on both sides of a flight (amended 2026-11-27: the stair kit cuts
      a flight's second stringer, which it turns to face the first, as that one's mirror, and
      the bottom flight's second stringer stood 11.2 in below grade, found by the plant's
      clash audit; plant 3 cuts it again, its own, and leaves the kit as plants 1 and 2 use it).
    Reason: the set must stand a tail pipe's height above its hotwell; a deck gives its
    condensers and ejectors a floor to be reached, lifted and cleaned from, and leaves the
    ground under it to the hotwell and the tail pipes.
    Amended 2026-11-27 (P-95): every member of the deck, and of its stair's frame, ends at the
    face of the member it is joined to; no two are drawn through each other. The deck draws no
    connection material (no coped stub, clip angle or cap plate), so each member is drawn to
    where its full section ends.
    - (a) The stair kit stands a column on its pad and counts the column's top from the pad's
      top. Plant 3's elevations are from grade, so each column is given the elevation of the
      underside of what it carries less the pad's 6 in: a deck column's top is its girder's
      underside, a landing post's the underside of the beams of the highest landing it
      carries. Passed as they were, every column ran 6 in up into the steel it carries.
    - (b) A beam across the deck, of the girders' nominal depth and flush on top with them, is
      drawn from the girders' flange tips to their flange tips; a deeper one (the `W18x95`
      carrying beams) hangs 0.52 in below the girders' underside and ends at the same planes.
      Two flanges at one level cannot pass each other: the real beam is coped clear of the
      girder's flanges and clipped to its web.
    - (c) A strut between the columns ends at the face it is clipped to: along a line of
      columns, their web faces between their flanges; across the deck, their flange faces.
      Drawn to the columns' centre lines, a strut ran through its column, and the two struts at
      a column through each other.
    - (d) A landing's frame. A beam ends at the face of a post that carries on up past the
      landing: its flange face for a beam in the post's depth, its web face for a beam across
      it. A closing beam between the span beams ends at their flange tips. Over a post whose
      top carries the landing, the span beam runs on to the corner. Where the top landing meets
      the deck, the deck's girder is its edge: the landing has no edge beam of its own there,
      and its span beams end at the girder's flange tips. The kit draws a platform's beams to
      its corner points, which is right only where all of them rest on caps.
    - (e) Where a flight's top end comes to a post's web, the flight's top clip (SW-SR-5)
      stands on the stringer's side of that web, one leg flat on the web and the other on the
      stringer web's outer face. Where the kit sets it, on the landing's side, half its leg lay
      inside the post's web and it touched none of the stringer.
    Reason: two pieces of steel cannot occupy one place; the plant's clash audit, looking
    within one structure, found 311 such overlaps in the deck and its stair's frame (to
    0.585 in). The kit is left as plants 1 and 2 use it; plant 3 sets these ends itself.
  - A hotwell (SW-CELL-3) is a horizontal drum as any other, turned square to the rack.
  - Every body stands on an equipment pad 6 in high and 12 in larger all round, as in plants 1
    and 2 (SW-LAY-*). Nozzles are not part of a body: the piping stage adds each one from the
    nozzle schedule, so that the nozzle and the line that meets it are of one size and class.
    A compressor's lube oil piping is left out with its nozzles: the generator holds every
    solid by its bounding box, and that pipe's box spans the casing. A vessel's level
    connections are left out too: they carry instruments, which are outside this model's
    scope (the owner, 2026-11-23), and a flange with nothing on it would stand open.
- `SW-CELL-5` A unit's equipment lies within its plot (SW-SITE-7), which a test checks.
- `SW-CELL-6` Yard supports. Along each side of the rack that has equipment beyond its pumps
  runs a line of support steel, 18 in outside the pumps' row (6 ft 6 in from the rack's columns
  where there are no pumps): a post `W8x31` on a pedestal at each bent of the rack and a beam
  `W12x40` along the rack on the posts, its underside 30 ft 6 in above grade. Reason: a line
  crossing between a vessel or an exchanger and the rack is 25 to 40 ft long and needs carrying
  on the way; it hangs from this beam where it passes under it (SW-PS-9), which halves the
  span, and the posts stand at the edge of the access way, in line with the rack's own. Under
  the rack's lowest tier a stringer `W8x18` runs along its centre line from bent to bent, its
  top level with the tier's steel: a line crossing under the rack, 24 ft from column line to
  column line, hangs from it midway.
  Where a body stands in a row behind the first (an ejector set, SW-CELL-3), the same steel
  leads to it (added 2026-11-24): beams of the same section and height, parallel to the
  rack, at 15 ft at most between the yard's line and the body's own steel; each as long as
  the body's connections toward the rack and its hotwell reach along the rack, with 6 ft
  over at either end, on posts at 20 ft at most. Reason: the set's water, steam and hotwell
  lines cross 45 ft of open ground between the yard's line and its deck, three times what a
  pipe of their size spans; 15 ft is what the smallest of them, 3 in, spans (SW-PS-7).
  Amended 2026-11-27 (P-95): a yard post reaches the underside of the beam it carries as that
  beam is drawn, not as its name would put it. The beam is set by its nominal depth, its centre
  6 in above 30 ft 6 in, and drawn at its own depth (SW-W-5: 12.33 in for the `W12x40`), so its
  drawn underside is 30 ft 5.835 in above grade. Each post, on its 6 in pedestal, is cut square
  there (359.835 in long), and the beam's bottom flange bears on the post's cut end, the two
  touching at that face only; so too the posts under the beams that lead to a body behind the
  first row, which are of the same section at the same height. Reason: a column is cut to
  length from the height of what it carries, measured on that member. Drawn 360 in long, every
  post stood 0.165 in up into the beam's bottom flange (260 posts in the nine units and the
  cooling tower's cell), which the plant's clash audit found within one structure. The beam
  keeps its place: the lines that cross under it hang from its drawn underside, and raising it
  would leave their rods short.
- `SW-CELL-7` Footprints (added 2026-11-24). A body's footprint in its row is not a figure
  given beforehand but what its solids and pads cover: every body is built once at the origin
  and measured there, and its row keeps that width and depth about the body's datum (a
  shell's axis, a shaft's line). A body with no datum that connections are set from — a
  package, a furnace, a boiler, a scrubber, the cracker — stands by its measured extent
  instead: its lowest solid (anchor rods and bolts apart) on the top of a pad that reaches
  6 in beyond everything standing on it, and the whole centred on its spot. Pits and basins
  stand in the ground with no pad. Reason: figures given by hand had left bodies off their
  pads and over their neighbours' ground (the sulfur furnace by 25 ft, the adsorbers by
  6 ft, a compressor's lube console by 18 in); a test now holds every body within its
  footprint. The connections of such a body are set on its own solids, taken as boxes in
  the unit's frame (SW-RPI-2). Where a connection must stand on the axis of one of them (a
  burner, a duct, a casing's outlet), the body is moved by up to 3 in so that that solid's
  centre is on the 6 in grid along and across the rack, and its pad made up to 6 in thicker
  so that it is in height. The scrubber, the flue gas cooler and the cracker's regenerator
  stand with their axes on their row's own centre line across the rack, not the nearest
  grid line to where their extents would put them (added 2026-11-25): a duct runs from each
  to the next along the row, and with the scrubber centred by its extent, which its two
  pumps make lopsided, its axis stood 36 in to one side of the cooler's, a jog a 36 in duct
  has no room to make between them. Their footprints are measured about that axis.
- `SW-CELL-8` Joints within a rack's steel (added 2026-11-27, P-95). The kit builds a unit's
  rack (SW-RK-*, as plants 1 and 2 use it) and plant 3 adds the stringers of SW-CELL-6; the
  main pipeway's rack is built the same way, with the stringers of SW-PWY-9. In plant 3's
  racks three joints are made as below, after the kit has built the rack. The kit, and plants 1
  and 2, are unchanged.
  - A stringer and the bay's intermediate beam (SW-RK-6). Where a stringer meets the channel
    at mid-bay within the channel's depth, the channel runs through whole and the stringer is
    framed to it: each bay's stringer is drawn as two lengths, the first ending square against
    the back of the channel's web, the second starting square at the plane of the toes of its
    flanges, each touching the channel there and entering it nowhere. In a unit's rack the
    stringer is set with its top at the tier (as drawn, 8.22 in deep, it stands 0.11 in above
    the channel's top); in the main pipeway its top stands 2.11 in up into the 14 in channel.
    Only the stringer's steel inside the channel's outline is taken out (3.02 in at a
    `C12x20`, 3.51 in at a `C14x27`), and nothing moves. Reason: two pieces of steel cannot
    occupy one place. The channel carries the tier's small lines across the whole rack and is
    not cut; the stringer carries only lines hung from it at points, and is the member cut, as
    a lighter member framing into a heavier one is. From the channel's open side the stringer
    could reach the web only with its flange coped, which the model does not draw, so that
    length stops at the toes. The connections (clips or an end plate through the web on the
    back side, a plate across the toes on the open side) are not drawn, as no stringer
    connection is. Drawn whole, every stringer ran through its bay's channel (406 in the main
    pipeway, 121 in the units' racks).
  - A rack-end ladder's bracket (SW-LD-2, SW-LAY-3). The kit starts each bracket at the plane
    of the column's flange tips. Where a tier beam's flange, wider than the column's, stands
    out beyond that plane at the bracket's height, the bracket is cut back at that end to the
    plane of the beam's flange tip (0.295 in under a `W16x40`, 0.695 in under a `W18x50`, the
    column a `W14x35`) and welded to it there. Reason: a bracket cannot pass into the flange
    it bears against; cut to that steel, it keeps its place at the rail, and the rung line its
    7 in standoff. One bracket of every unit's ladder stood in its tier beam's flange.
  - A cage hoop (SW-LD-3). Each hoop ends, at each side, where its inner face meets the plane
    of the outer face of the ladder's side rail, and is welded to that face; the rest is as the
    kit draws it (a 30 in hoop centred 12 in in front of the rung line, at 4 ft, with its five
    straps). The kit opens the hoop on the 18 in chord between the rails' inner faces, which
    lays the last 2.4 deg of each end through the rail's 1/2 in thickness and 0.2 in behind it.
    The hoop's drawing allows only a radial end, so its inner edge lies on the rail's face along
    the bar's full 2 in and the wedge beside it (0.16 in at most) is the weld's place; no face of
    the hoop bears flat on the rail, and nothing overlaps. Reason: the hoop is a bent flat bar
    carried by the two rails. It reaches each from outside the ladder, so it stops against the
    rail's outer face; a solid bar cannot pass into a solid rail, and the rail, which carries
    the ladder, is never notched for it. Every hoop of plant 3 (76) stood 0.23 in in its rails.

## 79. Plant 3: piping of a unit (`SW-RPI-*`)

How a unit of §78 is piped. SmartWeld's own arrangement from general piping understanding, with
the reason for each choice; no piping standard, company practice or existing plant was consulted
(PROVENANCE P-84). The routing, the fittings and valves at each end, the welds and the supports
are those of plants 1 and 2 (§35–§47, §59–§61): the same generator pipes the unit, unchanged.
What this section adds is what that generator is given.

- `SW-RPI-1` A unit is a plant to the generator: its cell (SW-CELL-1) with no building, its rack,
  its bodies as obstacles, a nozzle schedule and a line list. Each unit is piped in its own
  frame and set on the site with its equipment. The rules of plant 2 apply (SW-SPEC-*,
  SW-FLG-10, SW-PEN-4, SW-LL-6..8): butt welds from 2 in up; small bore socket-welded in process,
  steam and flare lines and threaded in water, air and condensate lines.
- `SW-RPI-2` Nozzle schedule. Every connection of an item (SW-PRC-15) is a nozzle of its line's
  size and class, its axis on the 6 in grid (SW-LAY-2), standing out from the shell by SW-NOZ-1.
  Where it stands, by the kind of body:
  - Pump: suction on the shaft's line at the casing's end, facing the rack; discharge on top of
    the casing in its centre plane. To put both on the grid the pump's pad is raised above 9 in
    until the shaft is on it, and the pump is set along its shaft until the casing's centre
    plane is (so suction ends stand within 6 in of the line of SW-CELL-3).
  - Compressor: as a pump: suction on the shaft's line at the casing's free end, facing the
    rack; discharge on top of the casing in its centre plane; pad and position adjusted as a
    pump's. A turbine driver (SW-EQC-66) takes its steam on top of the steam chest and
    exhausts from the side of its casing away from the lube console, below the joint. Reason: a machine and its spare side by side are then fed from the rack by one line
    and a tee, as pumps are.
  - Shell-and-tube exchanger: tube-side connections on the channel, in its centre plane, which
    stands on the grid. Of the two shell-side connections the one on top stands at the channel
    end, inside the tubesheet by 1 ft at least and far enough from the tube-side connection
    beside it for a gate valve's handwheel to lie between them; the one underneath stands 1 ft
    inside the rear end, clear of the saddles' piers. On either side, what is heated enters
    below and leaves on top, and what is cooled enters on top and leaves below. Reason: a
    warming fluid rises and a cooling one falls, so the flow helps the exchange and vapour or
    condensate leaves by itself.
  - Horizontal drum: what enters, on top from the end nearer the battery limit; gas on top at
    the far end; liquids below at the far end; neighbours apart by half the sum of their
    flanges plus 12 in. Reason: the length between inlet and outlets is the settling path.
    The desalter is the other way up (added 2026-11-24): the crude enters underneath at the
    near end, where its distributor lies below the electrodes, the desalted oil leaves on
    top at the far end, and the brine leaves underneath at the far end. Reason: the water
    settles downward through the oil rising to the outlet; an inlet on top would drop the
    emulsion through the settled oil.
    Amended 2026-11-27 (P-95): on a drum, an outlet whose stream is all vapour is gas, on top,
    whatever it is called (as a vertical drum's is; a horizontal converter's gas leaves below
    its bed, as before); and every connection stands between 18 in inside
    each tangent line, a drum too short for its connections stopping the unit with an error.
    Reason: a fuel gas drum's gas outlet, named only "outlet", was laid underneath with the
    liquids, and stepped along past the saddle's pier it came 6 in beyond the tangent line,
    under the head, where its neck met the head 4.5 in short of its end on one side and could
    not meet it at all on the other.
  - Vertical vessel or column: every shell connection faces the rack, on the shell's centre
    line; a column's platforms and ladders are on the other half (SW-CELL-4). The one vapour
    outlet (a reactor's inlet; and a drum's outlet where what leaves it is all vapour, as a
    knock-out or surge drum's gas is, whatever the connection is called: added 2026-11-24)
    is on the top head, standing out far enough that its flange is
    54 in above the top platform's floor, over the handrail. Where a vessel without
    platforms is too short for its shell connections one above another and its top head is
    free, the uppermost of them stands on the top head instead (added 2026-11-24: a 24 in
    filter housing 4 ft tall on an 8 in line). On the shell, from the bottom
    upward: liquid outlets 12 in above the bottom tangent; the reboiler draw; stripping steam
    and gas inlets; the reboiler return; then the feeds, draws and returns of the middle in
    the order of their streams' temperatures, the hottest lowest, a return directly above the
    draw it belongs to (a pumparound's return; the vapour return of a side stripper), spread
    evenly from 20 % to 90 % of the height, a single one at mid-height; reflux and lean
    liquids 12 in below the top tangent. A vessel whose connections are named for two or more
    sections (a stacked side stripper) is divided into that many equal sections, the hottest
    lowest; in each the liquid leaves at 8 % of the section's height, the steam enters at
    20 %, the liquid enters at 80 % and the vapour leaves at 92 %. Connections are 36 in apart
    at least and 12 in from the tangent lines where the shell is long enough for that (on a
    short one, a small filter's, they close up to the handwheel's clearance and to 6 in from
    the tangent lines), and far enough for the handwheel of the valve below to clear the
    flange above
    (a gate valve's handwheel stands 4 sizes and 8 in from its pipe's axis at most, a bound on
    SW-VLV-* that a test checks), on the grid: where the wanted elevations stand closer than
    that they are moved apart upward from the bottom, and then downward from the top if the
    highest would pass the top tangent; a shell too short for all of them stops the unit with
    an error. Reason: a column is hottest at its base and coolest at its top, so its streams
    leave and enter in the order of their temperatures; a pumparound cools the liquid it draws
    and returns it a few trays higher; a stripper's vapour re-enters above the tray its liquid
    left. (Amended 2026-11-24. Before, the middle connections stood in the order the
    flowsheet met them, which put every pumparound above the product draws; and none could
    stand within a band about each platform floor, because the generator holds a 270° ring by
    its bounding box, which covers the open quarter too. On the crude column the 17 shell
    connections did not fit between the bands and four were set below the shell, one below
    grade; nothing checked for it. A test now holds every shell connection between its
    vessel's tangent lines.)
    Amended 2026-11-27 (P-95): on a column whose shells are of different diameters (the
    swaged tower of SW-EQC-65) the tangent lines are the drawn ones: the bottom one the bottom
    head's depth (half the bottom shell's outside radius) above the skirt, the top one above
    it by the shells' stated lengths and the two cones at 30° to the axis, each |ΔR| / tan 30°
    long, not rounded. Each connection stands out from the shell at its own height, its base
    on the outside of the shell it stands on, and the top connection's on the crown of the
    top head (the top tangent line and half the top shell's outside radius). The feed stands
    where the catalogue draws its own, 36 in above the lower cone on the middle shell, where
    it flashes; any other connection whose pipe would come within 6 in of a cone (its axis
    nearer a cone's end than half its outside diameter and 6 in) moves along its shell to the
    nearer elevation clear of the cone, on the grid, the spacing above then kept again; and
    the item's own drawn connections give way to the plant's, its side draws too (SW-CELL-4).
    Reason: the connections stood as on a column of the middle shell's diameter and of the
    sizing's tangent-to-tangent height, whose cones are rounded up to 6 in. The necks on the
    two narrower shells stood 15 to 66 in off them in the air, the feed came on the bottom
    shell 12 in under the lower cone, the bottoms outlet on the bottom head, and the
    overhead's neck ran 12 in down into the top head; three of the catalogue's own 6 in side
    draws stood open on the rack side, not taken out with its other nozzles (an independent
    check of every nozzle against its item's drawn body found them, which the clash checks
    excuse as a nozzle on its own item).
  - Adsorber (one of the four of the hydrogen purification unit): as a vertical vessel, the
    feed and the tail gas low on the shell and the hydrogen from the top head. The first
    vessel takes the unit's three lines and the others join them with tees, as parallel
    bodies do (SW-LL-3), each connection behind its own valve. Reason: a bed is fed from
    below and gives its product from above; the valves at each bed are the ones that switch
    it.
  - Storage tank: every connection low on the shell where it faces the rack, its axis 2 ft
    above the bottom or a flange's radius and 1 ft where that is more, side by side a flange
    and 18 in apart (to the foot), each parallel to the one at the middle. Reason: a tank is
    filled and emptied near its floor; the stair and the manways stand elsewhere on the
    shell (SW-EQC-44).
  - Sulfur condenser (an exchanger body with gas through its tubes from end to end): the gas
    enters on top 18 in inside the end toward the rack and leaves on top of the channel at
    the outer end, where the sulfur drains from underneath, toward its pit (amended
    2026-11-24 from the other way round, when the pit stood elsewhere); the steam leaves on
    top at mid-length and the feed water enters underneath there. Reason: gas above, liquid sulfur below; water boils in the
    shell.
  - Vacuum ejector set (SW-EQC-68; added 2026-11-24): each connection where the catalogue
    item has it. The column's overhead enters on top of the first ejector's suction chamber;
    each tail pipe, and the last condenser's outlet, leaves under its condenser's boot;
    motive steam and cooling water are met at the lower ends of the set's own pipes, under
    its deck. The set stands so that all seven are on the grid (SW-CELL-4).
  - Hotwell (SW-CELL-3; added 2026-11-24): each tail pipe, and the last condenser's outlet,
    enters on top directly under the boot it comes from; gas leaves on top midway between
    the last two of them, the end toward the rack; water leaves underneath midway between
    the first two, and oil underneath below the second tail pipe, toward the rack and its
    pumps. Reason: a tail pipe falls straight (SW-CELL-3); oil floats to the far end from
    where most of the water arrives; the gas line leaves from the end nearest the deck's
    edge, within a span of the first steel it can hang from (as first written the gas left
    beside the first tail pipe, 18 ft from that steel, and its run to the rack had no
    support at all).
  - Reaction furnace with its waste heat boiler: the combustion air into the top of the
    burner's windbox; the acid gas into the windbox's side toward the rack and a second
    gas into its other side, both at the axis's height; the process gas from the end of the
    boiler's outlet duct, on the axis; the steam from the top of the steam drum at
    mid-length and the feed water into its top 3 ft along. Reason: each stands where the
    stream enters or leaves the item as the catalogue draws it.
  - Incinerator: the largest waste gas into the top of the chamber 3 ft from its front; the
    others into its two sides there, at the axis's height; the fuel gas into the side of
    the burner's windbox toward the rack.
  - Sulfur pit: the rundowns enter through the roof in a row 5 ft from the pit's centre
    line on the side of the rack (the side of its condensers), 5 ft apart about the pit's
    middle; the sulfur leaves
    from the side of the pump's head that faces the rack; the steam coil's two ends are its
    own, where they rise through the roof.
  - Blower: the discharge on its casing's outlet flange, which is brought onto the grid.
  - Steam boiler (SW-EQC-38; added 2026-11-24): the steam from the top of the superheater's
    outlet header, where the catalogue draws its outlet (the plant's own connection stands
    in place of the drawn flange); the feed water into the economizer's lower header, at its
    flange, which faces away from the burners; the blowdown from the end of the mud drum
    that faces the rack, on its axis; the fuel gas into the side of the lower burner's
    windbox, on the side away from the drums (the pipe from there to the upper burner is
    not drawn). Reason: each stands where the stream enters or leaves the boiler as the
    catalogue draws it: water through the economizer to the drum, steam from the
    superheater, the sludge from the lowest drum.
    Amended 2026-11-27 (P-95): the feed water's connection stands on the lower header's own
    axis at the end of its pipe, its neck continuing the header, and the economizer is drawn
    without its inlet flange there; the boiler is set by SW-CELL-7 so that this axis lies on
    the 6 in grid, moved along the rack and lifted on a thicker pad as that needs. The steam
    leaves the top of the outlet header at the grid line nearest its axis, its neck's end on the
    header's drawn surface there. Reason: as first coded, the feed water stood 9.45 in above
    the lower header's axis (taken from the box of both headers) and 1.75 in beside it, so
    that its neck met nothing at all; and the steam's neck ended at the height of the header's
    crown, 1.2 in off the crown, where the header's surface lies lower.
  - Deaerator (SW-EQC-50; added 2026-11-24): on its dome, the water it deaerates and the
    steam that does it. The largest water connection enters the dome's top; the heating
    steam enters the dome's side toward the battery limit and a second steam the opposite
    side; the second water the side that faces the rack; each side connection at the
    dome's mid-height. The deaerated water leaves under the storage shell, over the pumps
    that draw it, as a drum's does. Reason: the water is sprayed in at the top of the dome
    and falls through steam rising from below it; the storage shell under the dome only
    holds what has been deaerated.
  - Air compressor that draws from the atmosphere: its one connection, the discharge, on
    top of the casing as a compressor's outlet is.
  - Loading station: the inlet in the side of the arm's riser that faces the rack, 2 ft
    above its pad; the line reaches it under the gantry.
  - Vertical cylindrical heater: the coil enters the convection box and leaves the radiant
    shell 2 ft above its floor, the fuel gas enters under the floor; a waste gas it burns
    enters beside the fuel gas, 3 ft along; a steam coil's two ends stand in the convection
    box's two side faces. Amended 2026-11-27 (P-95): the waste gas enters 1 ft along from the
    fuel gas and 1 ft below it, at its own ring (SW-EQC-15 as amended); each gas's neck runs
    in to its ring (SW-NOZ-1 as amended), the faces of the fuel gas where they were. Reason:
    3 ft along, the waste gas's axis ran through a leg (on a 114 in heater the legs stand 36.06
    in either side of the centre), so no neck could reach a manifold inside them.
  - Cabin heater: every connection on the wall that faces the rack: the coil enters the
    convection section at mid-height, a quarter of the heater's length to one side of its
    centre, and leaves the radiant box 2 ft above its floor a quarter to the other side; fuel
    gas and the waste gases it burns enter 2 ft below the floor, 4 ft apart about the centre; a
    steam coil's two ends stand in the convection section beside the outlet's side. Amended
    2026-11-27 (P-95): each gas's neck runs in to its header inside the wall's columns
    (SW-EQC-53, SW-NOZ-1 as amended); the gases enter 18 in below the floor instead where, at
    2 ft, a branch from the burners' gas inlet flanges could not rise into its header with its
    bend (the header's axis less than the bend's radius and the header's radius above the
    flanges'). Reason: on a narrow cabin the burners are smaller and their inlet flanges stand
    higher; on the 180 in cabin of unit 12 they stood 1.85 in under a header 2 ft below the
    floor, too near for a bend and too far for a branch to run straight into it.
  - Air cooler bay: two passes side by side in one header, the header on the side of the
    rack its inlet line comes from. The inlet stands on top of the header, 3 ft to one side
    of the bay's centre, over one pass; the outlet stands in the header's outer face at
    mid-height, 3 ft to the other side, at the other pass. Reason: what condenses leaves
    low and sideways while the vapour enters on top; under the header the bay's plenum and
    legs leave a valve no room. (Amended 2026-11-24 from both on top: four upright valve
    stacks in a row on two bays' headers left a second bay's outlet no way to the first's
    line.)
  - Reactor and regenerator (SW-EQC-33; added 2026-11-25). The flue gas leaves the open top
    of the regenerator's cone, upward on the vessel's axis. The air enters the end of the air
    inlet line, on its axis. The reactor's vapour leaves the top of the reactor's head on
    its axis, its flange 54 in above the top platform's floor, as a column's top connection
    stands. The feed enters the side of the riser that faces the rack, 8 ft above the place
    where the regenerated catalyst's standpipe meets the riser, and the riser's steam enters
    2 ft above that place; the riser stands inside the plan of the reactor's tower, so each
    of the two stands out until its face is 6 in beyond the tower's face, and is moved up
    the riser 6 in at a time until its flange passes 3 in clear of the tower's girts and
    bracing. Catalyst is withdrawn from, and fresh catalyst blown into, the regenerator's
    shell on its centre line where it faces the rack: the withdrawal in the lowest stretch
    of shell that lies between two platform levels, the fresh catalyst in the next stretch
    above, each at the middle of the room between the handrail below (and its own flange)
    and the platform above (and its valve's handwheel), on the grid. Reason: each stands
    where the stream enters or leaves the item: air under the bed, flue gas from the top of
    the regenerator, oil into the foot of the riser above the hot catalyst with steam under
    it to lift and spread it, vapour from the top of the disengager, catalyst to and from
    the bed. The regenerator's platforms are the catalogue's, about its manways, and cover
    the side toward the rack; a connection between two of them leaves under one and over
    the other's handrail.
  - Catalyst hopper (the silo of SW-EQC-22; added 2026-11-25). Catalyst leaves, and the air
    that carries it enters, through the skirt's opening: two connections on the skirt's
    face at the opening's mid-height (to the grid), 24 in apart about its centre line (12 in at first: the catalyst line once laid, the generator held the air connection's first point too near it), the
    catalyst's the one toward the rack. The hopper's own outlet from the foot of the cone to
    the opening is inside the skirt (at first not drawn; drawn as amended below). Catalyst arriving enters through the
    roof at its centre, its flange 54 in above the roof, over the handrail. Reason: a hopper
    on a skirt is emptied through the skirt's opening, where the carrying air picks the
    catalyst up; it is filled from the top.
    Amended 2026-11-27 (P-95): the hopper's own outlet is drawn by SW-EQC-22 as amended, the
    plant giving the silo the connections that leave through the opening, in the order their
    places are set here (the outlets first, then the inlet of the carrying air): each one's
    size and class, its axis's height in the silo's frame (the opening's middle brought to
    the grid as the connections stand, less the height of the silo's base once it stands on
    its pad) and its distance from the opening's centre line, 12 in to the side its
    connection stands. Each of the outlet's legs ends 1 in outside the skirt, at the frame's
    outer face, where its connection's neck begins, and the frame's outer face and middle are
    where they were, so the connections' faces, their standouts and the routes laid to them
    do not move. Reason: with the outlet not drawn, both necks ended short of a closed frame
    drawn over an uncut skirt (0.99 in on their axes, more where their walls passed the
    frame's edge to the skirt), with nothing behind them that was the hopper's outlet:
    the catalyst line ran against plate with no way through, and the air line led nowhere.
  - Wet scrubber (SW-EQC-36; added 2026-11-25): the flue gas enters the end of the gas
    inlet duct, on its axis; make-up water and caustic enter the sump, on the shell's centre
    line where it faces the rack, under its lowest platform: the water 2 ft above the base,
    to the grid, and the caustic 3 ft above the water. The stack is open.
  - Flue gas cooler (SW-EQC-37; added 2026-11-25): the gas enters the end of the inlet duct
    and leaves the end of the outlet duct, on the shell's axis; the steam leaves the top of
    the steam drum at mid-length and the feed water enters its top 3 ft along, toward the
    gas inlet. Reason: as the sulfur furnace's boiler.
- `SW-RPI-3` Line list. Each line of the flowsheet is one line of the generator with its size
  and class of SW-PRC-3 and -4, its service letter by its fluid's group (SW-PRC-1), and its
  number by SW-REF-3. An end at an item is that item's nozzle; a branch is a tap on its run; an
  end at the battery limit is a spool of SW-RPI-4. A control valve asked for by the flowsheet
  is a station (SW-LL-3) where the catalogue offers the valve (to 12 in), standing at grade
  under the rack (SW-RPI-9); where the valve is not offered the line is piped without it and
  the omission recorded. Every line of the flowsheet is numbered and built as a process line
  (service P) whatever it carries (amended 2026-11-24): the generator gives a lane on the
  rack to process lines only (SW-RT-1), and a flowsheet line joins items that may stand
  anywhere along it (a combustion air line from the blowers to the sulfur furnace, 145 ft
  along the rack, was sent free across the unit and never arrived). The letters of water,
  steam, condensate, air and nitrogen are borne by the utility headers and the connections
  that tap them (SW-RPI-5), which the generator valves by their service; of those, water
  and plant gases of class P600 and above are built as process lines too: the butterfly
  valves the generator gives water and air lines are offered to class P300 only
  (SW-VLV-11). So are steam and condensate lines over 12 in (added 2026-11-25, with the
  plant's 14 in low-pressure steam header, SW-PWY-11): the globe valves the generator
  gives steam and condensate lines are offered to 12 in, and a line larger than that is
  shut by a gate valve. So is a water connection over 12 in to or from the item it
  serves (added 2026-11-25, with the debutaniser condenser's 14 in cooling water): the
  generator stands a throttling globe valve at a water consumer (SW-LL-7), offered to
  12 in, and has no other valve for that duty; such a connection has a gate valve at the
  item and is not throttled in this model. It has no valve at its take-off: one of that
  size is as wide as two lanes of the top tier, the generator moves it along the header
  to where the smaller take-offs' valves leave it room (3 ft 6 in from the item's station
  for the condenser's return), and a 14 in line cannot step that little aside to meet it. The water headers
  keep their letter at any size: nothing is valved on them. What a line carries is on its
  record (§76), not in its number. An installed spare, and each further body of an item in parallel,
  joins the first body's line with a tee (SW-LL-3), numbered from unit × 1000 + 301; where
  the first body's line is itself a branch that ends at a tee on another line, the further
  body joins that other line with a tee of its own (amended 2026-11-24: an injection
  pump's connection, no longer than its valves, left its spare no straight piece to join),
  unless the branch has a root spool on the rack (SW-RPI-8). Where the flowsheet states
  that an item is met at its nearest body (`nearest`), a line to it runs to the body nearest
  the line's other end along the rack, and the others join in the order of their distance
  from it (added 2026-11-25, for the main fractionator's condenser: its overhead comes to
  its three bays from one end and its condensate leaves from the other, and with both
  lines made to the same bay one of them had to pass the other two bays' connections to
  reach it, which the overhead could not and the outlet did only by leaving a bay's branch
  no place to join). Each line
  carries beside the generator's record the fluid, design conditions and origin that the code
  layer needs (§76).
  A line of the flowsheet that must not be sent along the rack, though its ends stand more
  than 20 ft apart along it, is numbered and built with the letter V in place of P (added
  2026-11-25): the generator routes free any line that is not a process line, and V is a
  letter of its own that, on a line tapping no other, stands for the process group, so the
  line's joints, flanges and valves are those of a process line of its class. They are five,
  all in the cracking unit: the regenerator's flue gas to its cooler, the cooled flue gas
  to the scrubber, the reactor's vapour to the main fractionator, the regenerator's air
  from its blower, and a line into an item the flowsheet states is met direct (`direct`):
  the main fractionator's overhead to its condenser. Reason: sent along the rack, a 42 in
  duct would come down from the regenerator's top onto the top tier and climb off it again
  30 ft on, and the 24 in vapour line would fall 100 ft to the rack and rise 25 ft to the
  fractionator; each goes straight from the one item to the other, over nothing but their
  own ground. The air line, sent along the rack for the 26 ft between the blower's station
  and the regenerator's, took eleven elbows to get on and off it; free, it goes under the
  rack and up. The fractionator's overhead, whose condenser bays reach 45 ft along the
  rack, could not rise from a lane on the rack to connections on top of the bays that
  stand over it; free, it crosses over the bays at their own level (SW-RPI-6), with a
  branch down to each, as the crude unit's does from a column that stands beside its bays.
  Each is routed in a run of its own before every other line of the unit, the largest
  first (SW-RPI-7), so that the smaller lines find their way round it. While such a line
  is laid, the way down before each side connection of a vertical vessel that a later
  line will leave by is held for that line: from where its valves end, 6 ft further out
  from the shell, a pipe and 1 ft wide, from 9 ft over the rack's top tier (or from above
  the valve such a line has on a side connection of the same vessel) up to the
  connection (added 2026-11-25: with the fractionator's chase made deeper, SW-RPI-6, its
  24 in overhead came down the middle of it, before every side connection, and the
  pumparound draw 53 ft up had no way down but with a step aside that the generator's
  search did not reach). A branch that joins
  such a line for a further body in parallel carries the same letter: the generator routes
  the branches of process lines before any line that is not one, and would look for the
  tee on a line it had not yet laid.
- `SW-RPI-4` Battery limit. Each stream entering or leaving the unit ends at a spool in the valve
  bay, the rack's bay nearest the battery limit (SW-CELL-2): two nozzles back to back, 24 in face
  to face, 30 in inside the bay's first bent, at the elevation its line runs at on its tier
  (SW-RPI-7; the lowest for a line that does not run the rack). The unit's line bolts to the
  spool's inner face behind a block valve; the pipeway's line will bolt to the outer face. Tag
  `BL-{unit}{sequence}`. A line to an item of the unit that stands on another plot (the
  cooling tower and its pumps, SW-SITE-4) ends at such a spool too, named after the item's
  connection; a line with no end on this plot is that plot's, and is not piped here. Each spool stands on the lane its line runs in, so that the line
  passes the limit straight (amended 2026-11-24: the spools stood together about the rack's
  centre line, and in the crude unit, whose rack is 30 ft wide, the lines fanning out to
  their lanes crossed in front of their neighbours' valves and left them no room). Where
  two neighbours' flanges would be closer than 6 in, or their valves' handwheels (as wide
  as the catalogue draws them, some of them geared and wider than the flange) closer than
  3 in, the row is spread just enough, keeping
  its order and its middle, and slid as a whole to stay within the rack; each tier's row
  stands above the one below. Within the rack means two things (the second added
  2026-11-24, with §80): the outermost flange 12 in inside the rack's half-width, and the
  outermost line 3 in clear of the columns of the bay's first bent, which the pipeway's
  line passes on its way out (a 3 in spool 18 in inside the half-width of a 24 ft rack
  left its line 2.5 in from the column's flange, and the generator no room for it). Where a row cannot be on its lanes within the rack's width
  its spools stand a flange and 6 in apart about the centre line instead, and where that is
  still too wide, in two rows taken in turn, the second just beyond the bay's mid beam, each
  line of the first row passing between two valves of the second, a pipe's width and 4 in from
  their flanges. A line that takes no lane of
  its own (one that taps another, or ends within 20 ft) stands beyond the row's end on the
  side of the rack its far end is on. A valve at the limit stands stem up, the only way its
  neighbours leave it room: a line whose valve would then reach within 1 ft of the tier
  above (a gate valve's reach against the tiers' 6 ft: 14 in and larger) runs on the top
  tier, and one with no lane has its spool on the highest tier in use.
  On the top tier (amended 2026-11-25, with SW-RPI-15) every spool stands on its own lane
  and none is moved off it: a header's spool can stand nowhere but in its header's lane.
  The spools are taken in turn across the rack into two rows, the first 30 in inside the
  bay's first bent and the second at the bay's middle, so that neighbours' valves stand
  7 ft 6 in apart along the rack: a line then passes its neighbour's flange a pipe's width
  and 4 in off, and only every second spool stands beside it, a flange and 6 in or the
  handwheels and 3 in away. (Side by side, two 10 in gate valves, whose handwheels the
  catalogue draws 26 in wide, want 30 in, and their headers' lanes are 24 in apart.) A
  spool with no lane stands beyond the row's end as on the other tiers. A row that does
  not meet those distances on its lanes is an error, not spread. The lanes
  are those each line is given beforehand (SW-RPI-7; amended 2026-11-24: they were the
  generator's own choice, worked out beforehand by its rule, and where a run showed a line
  in another lane the spools were set again and the unit piped a second time). Reason: a
  valve and a removable spool at the limit let a unit be cut off from the pipeway for a
  turnaround; valves need a flange's width each, which the lanes of a rack, a pipe's width
  apart, do not give, so they stand together in a bay of their own and the lines close up
  beyond it.
- `SW-RPI-5` Utilities in a unit. Each utility the unit's items use (SW-PRC-15) has a header on
  the rack's top tier, sized for the sum of what they take and not smaller than its largest
  take-off, of the class of its most demanding take-off; each item's connection taps it through
  a valve, numbered from unit × 1000 + 501; headers are numbered from unit × 1000 + 401.
  Amended 2026-11-25 (SW-PRC-19): a header's class and design conditions are those of the
  plant's header it joins, not of its own take-offs; a connection that has a control
  station is divided at it as a process line is (SW-RPI-9); and each header ends at the
  unit's limit in a block valve and a spool (SW-RPI-15). A header is sized for the
  larger of what its items take from it and what they make into it, not for the sum of
  the two as before: no stretch of a header carries more than the larger, and the sum
  gave a unit that both makes steam and uses it (the crude unit, the vacuum unit, the
  cracker) a header a size or two larger than any flow in it, and the plant's header,
  which is no smaller than a header that joins it (SW-PRC-19), with it.
  The generator lays a unit's headers in the order it is given them, each in the first lane
  from the centre line that is free; a header of 12 in and larger whose lane would so set its
  spool at the limit, where the unit meets the main pipeway, nearer a column of the main
  rack than its branch can pass is given to it earlier, at the first place in the order where
  every such header is clear (the headers are numbered in that order): the branch's radius, the 3 in of SW-RT-3, the round the
  generator holds the column by (half the diagonal of its section) and half a square of
  its grid (added 2026-11-25). Such a branch comes off the main rack straight at its
  spool's station, for it cannot step aside by less than two of its elbows' radii; a
  smaller one steps round a column within its elbows. Reason: the cracking unit's 14 in
  low-pressure steam header was first given the lane whose spool stood 12 in from a column;
  its branch stepped 5 ft aside to pass the column, into the way of three smaller branches
  beside it, which were then left one unsupported and one over the top tier.
- `SW-RPI-6` Where lines may travel. The generator's routing takes the shortest way with the
  fewest turns, which from a column's top is as readily straight out over the unit as down the
  column. A pipe is carried by steel, so the generator is shown solid blocks that leave open
  only where there is some:
  - from 9 ft above the rack's top tier upward, everywhere except in the room a body with a
    connection up there (or one whose valve, standing up from it, reaches there) needs for
    its lines: for a vertical vessel a chase on the side that
    faces the rack, 2 ft wider than the shell on either hand and reaching 10 ft beyond it.
    A vessel that a line routed free (SW-RPI-3) joins at its side has the wider and deeper
    chase too (added 2026-11-25): the main fractionator's 24 in feed and the 24 in leg of
    its overhead cross before it 10 ft from its shell, where the narrower chase ends, and
    the lines that come down from its upper connections had no way past them but a
    step aside the generator's search did not find.
    Such a chase holds two rows of risers 2 ft apart across its width; a vessel with more
    connections than that has one as wide as its own footprint along the rack (a column's
    platforms and 12 in on either hand) and reaching toward the rack as far as the yard's
    support beam, under which its lines pass (amended 2026-11-24: the crude column's 18
    connections left 13 risers standing in the narrower chase and no way down for its
    24 in overhead line; the wider one given to every column made the generator's search
    in a small column's chase several times longer for nothing);
    and in any case as far from the shell as the valve set on its largest connection
    toward the rack, and the turn after it, reach (added 2026-11-24: the vacuum column's 36 in
    feed, whose valve set ends 12 ft from the shell, outside a room 10 ft deep);
    for any other body, 6 ft all round, and for an air cooler bay further on the side a
    connection faces where that connection's valve set ends further out: to that end, half
    the pipe and 1 ft (added 2026-11-25: the valve at a 16 in outlet of the main
    fractionator's condenser ends 6 ft 6 in from the bay, 6 in outside the room, and the
    line had nowhere to turn down; no bay of the units piped before has a connection
    larger than 10 in, and none of their rooms is changed by it); each as high as that body's highest connection
    needs for its valve and the turn after it, with 6 ft over, and closed again above.
    Where a line joins connections up there on two bodies (a column's top and the air
    cooler it feeds), the way between their two rooms is open as well, over the width they
    share and as high as the lower room: the line crosses at the cooler's level, on the
    steel that carries the cooler (added 2026-11-24: without it the crude column's overhead
    line had to come down under the rack's top tier and rise again to the cooler, and the
    generator's search, pulled straight toward the cooler, spent itself in the column's
    chase before it found that way). The room of an ejector set reaches as high as the room
    of the column whose overhead it takes (added 2026-11-24): that line runs back from the
    column's top at the top's own level and falls onto the first ejector (SW-CELL-3). A
    line leaving a column's top comes down in the chase, beside the column's other lines,
    before it turns away (the 9 ft leaves room for
    the valved take-offs that rise from the headers on the top tier). (Amended 2026-11-24
    from 12 ft all round any such body: the generator's search for a line is bounded, at 2.5
    million steps, and an open space 24 ft square the height of a column exhausted it before
    a way down past the column's other lines was found.)
  - beyond the yard's support beams (SW-CELL-6), from 18 in above 30 ft 6 in up to that
    level, with the same exception: every line crossing between equipment and rack passes
    under a beam, from which it hangs.
  The blocks are not part of the model and are in no drawing, count or check; no hanger hangs
  from one.
- `SW-RPI-7` The rack's tiers and lanes (added 2026-11-24; the way the generator is run
  amended the same day, see the end). The generator runs every process line that travels
  more than 20 ft along the rack in a lane of the lowest tier it is given (SW-RT-1), and
  picks the lane itself: the first from the rack's centre line that is free and clear over
  the whole run (SW-RT-2). One tier of a 24 ft rack holds 20 ft of lanes; the crude unit's
  lines need 31 ft of width at their busiest section. So each line that runs the rack is
  given a tier and a lane beforehand, and the generator is run once for each such line,
  with every lane but its own shut to it:
  - Tier. The lines are taken largest first (of one size, the longer run first; before
    them all, the lines whose valve at the limit is too tall for any tier but the top,
    SW-RPI-4). Each goes on the first of the tiers allowed it where a lane is free over
    its run (next item) and where, with it, the lines at the busiest section along its run
    take no more than 6 ft of width, a pipe's width and 3 in each. The top tier's count
    starts with the utility headers (SW-RPI-5), which alone take more than 6 ft of it in
    most units; a line whose first tier is the top (below) may load it to 85 % of its
    lanes. Where the tiers at 6 ft do not take all a unit's lines the width is raised a
    foot at a time until they do, to 85 % of the tier's lanes at most (17 ft on a 24 ft rack); beyond that the unit is not piped and the error
    says so. The tiers allowed a line, in the order they are tried:
    - A line of 14 in and larger: the lowest tier, then the top; the top first where one
      of its connections stands above the rack's top tier (the crude heater's 24 in line
      to the column's feed connection 40 ft up was first given the lowest tier, which it
      could leave neither upward nor, to reach that connection, downward). Reason: a
      line leaves its lane by an elbow up or down and a second elbow that turns it across the rack, which
      between them move its centre line 3 nominal diameters (two long-radius elbows).
      Under the tier above there are the 6 ft between tiers less that tier's beam, the
      line's own height on its tier and the clearances: room for the 36 in of a 12 in line
      and not for the 42 in of a 14 in line. Below the lowest tier and above the top one
      nothing stands in its way.
    - A 12 in line both of whose ends are connections standing above the lowest tier:
      the top tier only (added 2026-11-25). Reason: the generator keeps a straight of two
      elbow radii and 2 in, rounded up to its 6 in grid, between two elbows (SW-RT-4): 42 in
      for a 12 in line, 48 in for a 14 in line, and under the tier above there are 36 in.
      So a 12 in line cannot turn in between two tiers either, whatever the paragraph
      above allows it by the elbows' own lengths: in the eight units routed before the
      cracking unit every 12 in line on the lowest tier came up into it from below. An
      end that stands above that tier reaches it only by going down under the tier and
      up again. One such end the generator finds its way from, as it did in the crude
      unit; with both ends above (the debutaniser's overhead, from the top of its column
      to the top of its condenser) the line belongs on the top tier, which it enters
      from above at both ends.
    - A line of 12 in and larger whose riser into the lowest tier would foul a beam: the
      top tier only (added 2026-11-25). Such a line comes up into the lowest tier at the
      station of its end and nowhere else: the generator looks 3 ft either side of that
      station for a clear place, and a line whose elbows must stand 42 or 48 in apart
      cannot step aside by less. At every bent the tier's beam crosses the rack, and
      midway between bents an intermediate beam (SW-RK-6). A riser is held to foul one
      where its axis is nearer the beam's axis, along the rack, than the radius the
      generator holds the beam at (half the diagonal of its section), the pipe's radius,
      the 3 in clearance of SW-RT-3 and half a square of the generator's grid, which is
      how closely it measures. The same beams stand under every tier, so a line that
      cannot come up beside one cannot come down past the one above it either; the top
      tier it reaches from above, past none. A connection that stands on the rack itself
      (a battery limit or root spool) has no riser, and one that points along the rack
      is not tested: its line's station is where the valves on it end, which the
      generator decides. In the cracking unit the wet gas line, 14 in, leaves the top of
      the main fractionator's receiver 12 in along from an intermediate beam; given the
      lowest tier it was not routed (the first full routing run, 2026-11-25).
    - A line to or from an air cooler: the top tier, then the tiers below it in turn.
      Reason: the coolers stand on the rack's top; their lines leave the rack upward and
      then pass no other tier's lanes.
    - Any other line: the lowest tier, then upward. Reason: the largest lines are the
      heaviest and their branches the stiffest, so they go lowest, where the columns carry
      them with the least moment and the drops to equipment are shortest.
  - Lane. A lane's centre lies on the 6 in grid, no nearer the rack's edge than 2 ft, and
    no nearer the rack's columns than the generator will lay that pipe (added 2026-11-25):
    it holds a column as the squares of its 6 in grid whose centres lie within the column's
    half-diagonal and a square's half-diagonal of the column's axis, and keeps a line's
    centre its radius and 3 in from the nearest such centre (less whatever of the column's
    own half-diagonal reaches beyond that centre). This plan makes the same test at a bent
    for each lane it would give. By it the lane 2 ft inside the edge takes a pipe to 6 in on
    a tier the columns pass through, and to 10 in on the top tier, over the columns' tops;
    the next lane inward takes any to 18 in. The outermost lane had carried only 6 in lines
    until the cracking unit, whose ten headers fill its top tier nearly to the last: the
    compressor's 12 in discharge, given that lane, found none (2026-11-25). On its tier a
    line takes the lane nearest the rack's centre line that is free
    over its run; where both its ends stand on one side of the rack, the lanes of that half
    are tried before the others, so that it leaves the rack on its own side and does not
    pass under the other half's lanes to do it. A line sent to the top tier because its riser
    would foul a beam (above), which would otherwise have had the lowest tier first, and
    whose ends stand on the two sides of the rack, tries first
    the half its higher end stands on (added 2026-11-25): it comes onto the rack from that
    side, and the other half is left to the lines of that side. (In the cracking unit the wet gas line, from the receiver on one side
    to the compressor on the other, took the last lane a 12 in pipe can have on the
    compressor's half; the compressor's discharge to its cooler, both on that half, was
    given a lane across the headers, which it could not reach.) On the lowest tier no lane lies nearer
    the rack's centre line than the pipe's radius and 9 in: under that line runs the
    stringer of SW-CELL-6, which the generator holds 9 in wide of its axis, and a line
    leaves the lowest tier downward where it can (a 14 in line of the reformer, given
    the centre lane there, could leave it neither downward past the stringer nor upward
    under the tier above). A lane is free where its centre is far
    enough from every lane taken on that tier over the same stretch: by the generator's own
    spacing (half the two widths and 3 in, SW-RT-2), and by the room the generator needs to
    pass a pipe beside a solid it holds as a box, which is how it holds the pipes of an
    earlier run and the lanes kept for later ones (below): the pipe's radius, 3 in, and the
    box's half-width as the 6 in grid holds it, 6 × floor((half-width + 3)/6) + 3 in. The
    second is taken both ways between two lanes and the distance rounded up to the grid.
    So, with the catalogue's own pipe diameters (SW-PIPE-2), lines of 4 in and smaller lie
    12 in apart; a line of 6 to 12 in lies 18 in from any line of 12 in or smaller; a line
    of 14 or 16 in 18 in from one of 4 in or smaller and 24 in from one of 6 to 16 in; a
    line of 18 to 24 in 24 in from one of 12 in or smaller and 30 in from a larger. Among
    themselves the headers, which are laid in one run, keep the generator's
    spacing alone; a header's lane is as wide as its valved take-offs (SW-RPI-5), a root
    spool's place as wide as its valves (SW-RPI-8). Reason: the generator measures a
    pipe of its own run by the pipe's true radius, and anything it is shown as a solid by
    the grid cells the solid touches, each taken to reach 3 in beyond its centre; a lane
    6 in nearer than this is one the generator finds shut. The cost is 6 in of rack for
    each line of 6 in and larger.
  - Runs. First each column's overhead line that does not run the rack, in a run of its
    own: it is the largest line at the column and takes the straightest way down its
    chase, and the others stand around it. Then each line that runs the rack, and each
    line that rises to a connection high on a body without running the rack (above the
    level of SW-RPI-6: in a column's chase), the largest first (of one size the lower
    tier first), in a run of its own with the branches that tap it (a spare's connection,
    a root spool's connection, SW-RPI-8). Last, in one run, the utility headers, their
    take-offs and every other line. (The lines that rise in a chase had been left to the
    last run; in the crude unit a 10 in line from its control station to a connection
    85 ft up the column then found the chase taken by the smaller lines routed before
    it, and no way up.) A run is given:
    - the rack from the line's tier upward, so that the tier is the lowest the generator
      sees and its lanes the ones it looks for;
    - a fence: the line's tier closed from end to end of the rack over the height its
      pipes lie at (from 4 in above the tier's steel to the top of its largest line), but
      for a slot along the line's own lane, just wide enough that the generator finds the
      lane clear and the lanes 6 in either side of it shut, and for an opening about each
      root spool on that tier that a line of this run starts at or comes to (SW-RPI-8),
      as wide as the spool's valves, which are wider than the slot. Every other lane the
      generator tries from the centre outward is shut, and the line takes its own; it
      leaves the lane upward or downward, since it cannot move to one side at that
      height; and neither it nor a branch of it can stand where a lane beside it is still
      to be taken. (A wall at one place along the run was tried first and did give the
      line its lane. The fence from end to end was put in its place by reasoning, not
      because of a failure met: with the wall alone a line may still step 6 in sideways
      at its lane's height before it rises, and stand 12 in from a small lane that its
      solid, held as a box, then shuts.)
    - the lanes kept: along the lane of every line that runs the rack and is not yet
      routed, on every tier, a solid from 3 ft beyond each end of its run (2 ft inside an
      end that is a spool on the rack, where its own valves stand), reaching above and
      below the pipe's axis by 6 × ceil((radius + 3)/6) − 3 in. To a run whose line is on
      the same tier it is as wide as the pipe; to every other run it reaches as far to
      either side as it does above and below. No line of an earlier run can then cross a
      lane that a later one will need, at the lanes' elevation or through it; and one that
      passes over, under or beside it does so far enough off for the lane's own pipe to
      pass it afterwards, when the passing line is in its turn a solid held by the grid
      cells it touches. (With a solid only as high as the pipe, a 4 in line of the
      sulfur unit found its lane shut after larger lines had been routed across it; with
      the height above it did not. The width to other runs follows from the same
      reasoning and was not met as a failure by itself.) The lanes of one tier are
      spaced for pipes as wide as themselves (above), and a line of that tier leaves it
      at its own lane, so to it they need be no wider;
    - the pipes, fittings, valves and supports of the runs before it as solids, each
      component by the shape the generator's own checks hold it by (§40), each support
      by the box of its part; a shoe, guide or anchor under a pipe on the rack no wider
      than its pipe (its base is an inch or two wider, and held as it is the grid took
      it out to the lane 12 in off, which the line of that lane then found shut at every
      beam);
    - the room each later line's first valves will need at its nozzles: along the nozzle's
      axis from the shell, a flange wide, to a gate valve's length, two sizes and 24 in
      beyond the face (twice that at a pump's discharge, for the check valve; 12 sizes and
      8 ft where a control valve station will stand). At a spool, on the rack or a
      control station's under it, the room is as wide as the valve's handwheel and as
      high as its stem over the length the valve itself stands in: a valve there can
      only stand stem up, its neighbours on either hand (the connection to a root spool,
      routed with the parent line, had passed over the spool where the branch's valve
      was to stand). Reason: within one run the
      generator sets every line's first valves at its nozzles before it routes any line;
      across runs it cannot know of the later ones;
    - the way of each later line whose two connections stand on one vertical, one facing
      down and the other up (a tail pipe from a condenser's boot to the hotwell under it,
      SW-RPI-2): the space straight between the two faces, a flange wide. Added
      2026-11-24: the hotwell's gas line, which runs the rack and so is routed first,
      crossed under the last condenser's boot on its way, and the line from that boot,
      which is meant to drop straight into the hotwell, came down round it through a
      12 in offset;
    - the headers' lanes, held clear until the last run with 4 ft above them for the
      valved take-offs. The headers are laid in the last run in lanes the generator gives
      them by width alone, before it looks at anything else; those lanes are worked out
      beforehand by its rule (SW-RT-2, SW-RK-7), and a header found in another is reported;
    - a grid cut to the run: 30 ft beyond the run's connections along and across the
      rack (the lane included), and 20 ft above the highest of them or of the rack's top
      tier. Reason: before it routes anything the generator works out the distance from
      every cell of its grid to the nearest solid, about a second for each million cells,
      and a unit's whole grid has 20 to 100 million; a line's own neighbourhood has 2 to
      12 million. A line that finds no way in its cut grid is run again on the unit's
      whole grid before it is reported.
    None of these solids is part of the model.
  - The runs' results are one model. The checks (§40) are run on all of it at once
    against the real steel and equipment, so a clash between lines of different runs is
    found as any other would be; and each rack line's lane is compared with the one it
    was given, any other being reported.
  - What this replaces (2026-11-24). The generator was first run once for each tier,
    lowest first, each tier's lines together and choosing their own lanes, which were
    worked out beforehand by its rule so that the battery limit spools could stand on them
    (SW-RPI-4); the top tier was closed to the earlier runs over the lanes foreseen on it,
    and thin lines that run far were put there. Three units showed what that left open.
    In the crude unit lines of 10, 12 and 24 in on the lowest tier rose through the middle
    tier, empty when they were routed, and three lines of the middle tier then found
    every lane cut. In the sulfur unit the top tier, with seven headers as wide as their
    take-offs, had lanes for ten of the twelve lines put on it, and the lines routed first
    left their lanes level across the outer ones (the generator lets a line cross the tier
    at the lanes' own elevation within 6 ft of its lane, SW-RT-7), which closed those to
    four thin lines that run 200 ft and more. In the reformer one line of the middle tier
    found no lane for the same cause. A lane given to a line and kept for it removes the
    cause: no line can be in another's lane, a line leaves its lane upward or downward
    because the lanes beside it are solid, and a tier is never loaded beyond the lanes it
    has. The second pass of a unit, made where lines had taken other lanes than foreseen
    so that their spools could be moved under them, is no longer needed.
  A line whose lane the generator finds shut at the outset (it reports no lane with clear
  drops and names no route it tried) is given another, once all three grids of a run have
  failed (added 2026-11-25): the nearest lane on the same tier, on the 6 in grid and no nearer
  the rack's edge than 2 ft, that keeps from every other lane given on that tier over the
  same stretch the spacing above, and that nothing the earlier runs left stands within the
  pipe's radius and 9 in of over the run. The run is made again on it; the move is kept where
  the line is then routed, and the report names it (the lane given, the lane taken, why).
  Reason: the generator sets a hanger where a run crosses steel, and a rod hung from the top
  tier's stringers passes down through the tiers below it without regard to the lanes held
  there for lines still to come: on the main pipeway, with the cracking unit joined, the rod
  of a 6 in branch crossing under the rack stood 7 in from the centre of the lane held for
  the lean amine line to the cracker, and that line found its lane shut. Which runs will
  leave a rod where is not known when the lanes are given.
- `SW-RPI-8` Branch roots (added 2026-11-24). The generator runs a line in a lane of the rack
  only if both its ends are nozzles (SW-RT-1); a line that leaves or joins another at a tee
  it routes as it finds its way, which serves the short connections of plants 1 and 2 and
  fails for one that must travel the rack (the quench gas of the diesel hydrotreater, 140 ft
  from the recycle gas line to the reactor: the search gave out). So a branch whose far end
  stands more than 20 ft along the rack beyond its parent's run starts, or ends, at a root
  spool on the rack: two nozzles back to back, 24 in face to face, tag `RS-{unit}{sequence}`,
  at the middle of the bay where the parent's run ends nearest the far end (clear of the
  bents' beams), in the branch's lane on its tier. The
  branch runs from the spool's far face as a line between nozzles, and a connection of the
  branch's size, numbered from unit × 1000 + 601, joins the spool's near face to the tee on
  the parent. Each face carries the block valve the generator sets at a nozzle, so the
  branch can be shut at its root on either side of a spool that can be taken out. Reason:
  the branch keeps its own size and number (making the long leg the run instead would carry
  the parent's size all the way); a block valve at the root of a long branch is common
  practice in any case. The parent's run is taken as the stretch of rack between its
  nozzles, or, where it ends at a tee itself, from its nozzle to the nearest point of the
  line it taps.
  Amended 2026-11-27 (SW-RPI-22): where a root spool stands on its parent's tier and the
  connection's tee on the parent points across the rack at it, the spool stands no nearer
  the parent's lane than that tee's lead point toward it and one grid step (the tee's
  centre-to-end of its outlet and the connection's elbow radius, rounded out to the 6 in
  grid, and 6 in: 36 in for a 10 in connection), its branch in the nearest lane free at that
  distance, and the lines planned after it around it. Reason: the hydrotreater's 10 in
  connection had its spool 24 in from its parent's lane, where the tee's lead point stands
  30 in out; the two lead elbows lay on each other, so every way the generator could give
  passed through the line itself, and its loop of six elbows came back up 6 in beside its
  first drop. Of the units' 25 root connections that tee into a parent, five stand on the
  parent's tier, and only that one's tee points across at its spool.
- `SW-RPI-9` Control stations (added 2026-11-24). The generator stands a control valve station
  at a line's destination nozzle, along that nozzle's axis. Given an item's own nozzle, that
  put stations upright on top of drums and exchangers and straight out from columns 50 ft
  up, carried by nothing and reached by no one. So each line with a station is divided at a
  station spool: two nozzles back to back, 24 in face to face, tag `CS-{unit}{sequence}`,
  lying along the rack at grade, its axis 36 in above it, under the rack 3 ft inside the
  line of its columns on the side of the line's destination (then on the same file of the
  other side; then on the files 3 ft further in, the destination's side first, and so
  inward to the middle, where a file is full, or where the valves'
  handwheels, half a gate valve's reach wide, would not clear the columns by 6 in), as near along the rack to the destination as the stations
  already set allow, and clear of the rack's braced bays, whose rods come down to the
  column bases. (The outer files come first, amended 2026-11-24: a line rising from a
  station on a middle file came up under the lowest tier's middle lanes, which fill first,
  and the generator's search spent itself under the rack looking for a way past them.)
  A station stands on its destination's side of the rack, or on the centre line, wherever
  a place is free there within 20 ft along the rack of the nearest; failing that, on
  whichever file has the nearest free place, the other side's from the centre outward
  (amended 2026-11-24, twice. First the outermost file was searched from end to end
  before the next was tried, and a station was set 155 ft from the drum it feeds, its
  line running the rack back to it. Then the files of the two sides were taken in turn at
  each place, which set two to seven stations of every unit across the rack from what
  they feed; in the crude unit a 10 in line from such a station, crossing under the rack
  and rising 85 ft up the column, was more than the generator's search found a way for.) Two stations whose lengths overlap along the rack stand apart by a
  gate valve's reach for each and 3 in (amended 2026-11-24 from half a reach each: a valve
  that cannot stand stem up lies over on its side, a full reach wide, and one lay across
  the end of the station on the next file). A station whose line comes from or goes on
  to a connection beyond the rack's far end (a heater's) stands 15 ft short of that end
  at least (added 2026-11-24: the generator runs a line whose ends are more than 20 ft
  apart along the rack in a lane, SW-RT-1, and needs some feet of rack to do it; a
  station at the very end left the reformer's tail gas line to its heater 5 ft of rack,
  and the generator no lane). A station whose onward line climbs to a connection above
  the lowest tier, and whose far face looks toward that connection, does not stand
  between 20 ft and 20 ft and its own outlet's length (a gate valve, two pipe sizes, 4 ft)
  short of the connection along the rack (added 2026-11-25). Reason: the generator measures
  the 20 ft of SW-RT-1 from where the pieces it stands on the spool's face end, some feet
  nearer the connection than the spool; in that stretch this plan counted the line a rack
  line and gave it a lane, and the generator sent it free. A short line on the level it
  finds its way with either way; the main fractionator's reflux, sent free from under the
  rack to a connection 106 ft up a column whose rack side already carried five lines, was
  more than its search found a way for (the cracking unit, 2026-11-25). From a lane the
  same line is two short searches, one at each end.
  A station whose line comes down to it from a connection more than 9 ft above the rack's
  top tier, on a vessel whose chase a line routed free crosses (SW-RPI-6), stands either
  within 5 ft along the rack of that connection or far enough from it for the generator
  to run the line on the rack, measured from the end of the station on its near face
  (added 2026-11-25: the main fractionator's heavy cycle oil draw, 84 ft up, sent free to
  a station 20 ft along, was not routed).
  The stations take their places in the order their lines come; but one whose onward line
  is not a process line, which the generator routes free however far it must go, is 3 in
  or larger (2 in lines it has routed free for 125 ft in the units piped before), and that
  finds no place within 20 ft along the rack of the item it serves, takes its place before
  all the others, which are then placed again (added 2026-11-25: under the cracking unit's
  rack, with 39 stations and every fourth bay braced, the feed water station of the slurry
  steam generator stood 112 ft from it, and its line was not routed).
  The line as the flowsheet numbers it runs from its source to the
  spool's near face, which looks toward the source, and carries the station there; the rest
  runs from the far face to the destination under a number from unit × 1000 + 701. A branch
  joins or leaves such a line ahead of its station; a spare at the line's destination joins
  the part after it. Reason: a control valve is watched and worked on from grade; under the
  edge of the rack it is clear of the access ways and beside the columns that carry its line
  down to it and up again. (This replaces the earlier choice of the lower of a line's ends
  as the station's seat, and with it the lines given to the generator end for end.) The
  station is also the line's specification break: the part after it, and the destination's
  nozzle with it, take the class of the destination's design pressure at the line's design
  temperature where that is lower than the line's. Reason: past its letdown valve a line
  sees what it feeds, and a tank's or a low-pressure drum's nozzle is of that vessel's
  class, not of the pump's upstream (a 600 class line had arrived at an atmospheric tank).
  Where the line's destination is the battery limit (added 2026-11-24, with §80), the part
  after the station takes the design pressure, design temperature and class of the stream's
  line (SW-PRC-2, SW-REF-12), higher or lower than the line's own, and the block valve and
  spool at the limit with it. Reason: the pipeway's line bolts to that spool flange to
  flange, and flanges of two classes do not bolt together; what stands beyond the station
  is the stream's line in everything but its number. (Before this a sour water line left
  the diesel hydrotreater's limit in the 1200 class, valve and spool, to join a 150 class
  header, and 36 of the 62 streams met a unit's line of another class than their own.)
  A test checks that every spool at a limit is of its stream's class.
  A utility connection with a control station (SW-PRC-19; added 2026-11-25) is divided in
  the same way. One that takes from a header: the part from the header's take-off valve to
  the spool is of the header's class and conditions and carries the station; the part
  beyond is the item's own. One that returns to a header: the part from the item to the
  spool is the item's own and carries the station; the part beyond, to the header's
  valve, is of the header's. Both parts are of one size, the larger of what each alone
  would be. The part beyond the station is numbered from unit × 1000 + 551, among the
  utility numbers (SW-REF-3). Their stations are set after those of the process lines, in
  the places those leave.
- `SW-RPI-10` No piece of pipe longer than 40 ft (added 2026-11-24). The generator cuts a
  long straight run into equal pieces of 40 ft at most (SW-RT-5) and then moves each splice
  off the rack's beams by up to 2 ft, so that every beam can carry a shoe; on a run long
  enough for its equal pieces to be within 2 ft of 40 ft (a utility header 270 ft from its
  first take-off was the first) one piece is left longer than 40 ft, which the generator's
  own check then reports. In plant 3 such a piece is cut again after the generator has run:
  in two, as near its middle as keeps the new joint 14 in from every support of its line
  (the generator's own clearance for a splice), with a shop butt weld as the line's other
  splices have. What was welded to the piece's far end is welded to its second half. The
  pieces so cut are listed in the unit's notes. Reason: pipe is rolled and shipped in
  lengths of 40 ft at most; the generator of plants 1 and 2 is not changed for plant 3, so
  the cut is made on its result.
- `SW-RPI-11` No make-up piece shorter than 2 in (added 2026-11-24). The generator sets a
  branch's tee on its parent's run and afterwards turns a short jog of that run into a pair
  of 45° elbows (SW-RT-8); where the tee stands at the jog this can leave less than 2 in of
  pipe between the tee and the first elbow, which the generator's own check then reports
  (the utilities unit: two pieces of 1.43 in beside the tees of installed spares). In plant
  3 the pair, with the pipe between its elbows, is moved along the run until that piece is
  2 in, and the pipe beyond the pair gives up what was added; the welds at the pair move
  with it. The pieces so lengthened are listed in the unit's notes. Reason: a piece
  shorter than 2 in cannot be welded at both ends without the two welds' heat running
  together; as SW-RPI-10, the correction is made on the generator's result.
- `SW-RPI-12` Header caps (added 2026-11-24). The generator lays the utility headers
  without a look at what is there and does not hold their end caps on its grid, so a line
  of the last run passing the rack's end on the top tier may come within 3 in of a cap. In
  the last run a block stands about each cap, 3 in larger than the header all round, which
  the lines of that run keep clear of. As the other blocks (SW-RPI-6), it is no part of the
  model.
- `SW-RPI-13` Clearances measured again (added 2026-11-24). The generator's clearance
  checks (§40, SW-RT-3) hold a 45° elbow by the two legs of a 90° one, hold whatever
  they measure against a valve's box by that piece's own bounding box, and hold a 90°
  elbow by its two straight legs, which meet at a corner the elbow itself cuts off by
  R(√2 − 1), 3.7 in for a 6 in elbow. All three are on the safe side, and exact for
  straight pieces square to the axes; for a piece at 45° (the elbows and the pipe of an
  offset, SW-RT-8) and at an elbow's corner they reach beyond the piece and can report a
  clash that is not there (the utilities unit: a 45° piece of a steam line 11.9 in from
  a valve was reported at 0 in, and a 6 in elbow passing a rack column at 2.34 in from
  its corner). In plant 3 a pair so reported is measured again: a 45° elbow by its own
  two legs (R tan 22.5° each); a piece askew to the axes against a valve's box from
  points every 1/4 in along its axis; a 90° elbow against steel or equipment from
  points every 5° along the arc of its centre line. A pair still nearer than 3 in stays
  in the report; every other finding of the checks stands as the generator gives it.
  Reason: the checks are the generator's and are not changed for plant 3; what is
  reported must be what is there. Amended 2026-11-24: the checks also hold a steel
  member as a round about its axis, of its section's half-diagonal, which reaches
  beyond the flange tips of a column or beam on every side but the diagonals. A piece
  reported against a member that lies square to the axes (a column, a beam, a strut;
  not a bracing rod) is measured again against that member's own section, its depth by
  its flange width, and stays reported if that is nearer than 3 in (the crude unit: a
  6 in line stepping round a rack column at 2.34 in from the round, 5 in from the
  column's flange). Each finding set aside this way is written in the unit's notes
  with both distances.
- `SW-RPI-14` Valves not built (added 2026-11-24). The generator stands an isolation valve at
  every equipment connection (SW-LL-6), which is right for most and wrong for a few. On the
  generator's result, at the ends named here, the valve and what stands with it between the
  nozzle and the line's own flange (blind or spade, a second valve, their gaskets and studs)
  are taken out, the flange is brought up to the nozzle with one gasket and one set of
  studs, and the pipe behind it is lengthened by what was taken out; its field weld moves
  with the flange. Nothing else of the line changes, and the piece is cut again if that made
  it longer than 40 ft (SW-RPI-10).
  - Both ends of the line from a fired heater's process outlet to the column or reactor it
    feeds. Reason: a transfer line carries the unit's whole charge, hot and part vapour; a
    valve there could shut a fired coil in, and nothing is ever isolated between the two.
  - Both ends of the line from a column's top to its condenser, air cooler or ejector set.
    Reason: the column's relief is by way of its overhead; a valve there could shut it in,
    and at a vacuum column's size would itself leak air into the vacuum.
  - Both ends of each tail pipe and of the last condenser's outlet of an ejector set.
    Reason: a shut drain floods its condenser and the vacuum is lost.
  - The ejector set's end of its motive steam and cooling water lines. Reason: that end is
    under the set's deck, where no one could reach a valve; each of these lines has its
    valve at the header it leaves (SW-RPI-5), and the set's own valves, at each ejector and
    each channel, belong to the set and are not drawn (SW-EQC-68).
  - Both ends of the flue gas line from a regenerator to its cooler and of the line from
    that cooler to the scrubber (added 2026-11-25). Reason: the regenerator's pressure is
    held by a slide valve in this duct, which is the item's own and is not drawn; nothing
    else may ever stand shut between the regenerator and the stack.
  - Both ends of the line from a reactor's top to the fractionator it feeds (added
    2026-11-25). Reason: it carries the whole of the cracked vapour at 980 °F, and coke
    forms wherever that vapour stands still; the two are parted by a blind set in the line
    at a shutdown, not by a valve.
  - The regenerator's end of the air line from the blower (added 2026-11-25). Reason: the
    air's one block valve is at the blower's discharge; at the regenerator the line runs
    straight into the air grid.
  Where the line is of another size than the nozzle, the reducer the generator stands
  behind that flange moves up with it (added 2026-11-24, with §80). The generator's own code is not changed; the correction is plant 3's, made in
  `src/refinery/pipingReport.ts`, and each end corrected is named in the unit's notes. This
  is the second of the two ways put to the owner on 2026-11-24 (PROVENANCE P-86), taken as
  said there unless told otherwise. What it leaves as the generator made it: every other
  equipment connection has its valve, including those a designer would leave out for a
  relief path's sake, since this model carries no relief valves (SW-RPI-3).
- `SW-RPI-15` A header at the battery limit (added 2026-11-25, with SW-PWY-11). Each utility
  header of a unit ends at the limit in a block valve and a spool, as every other line does
  (SW-RPI-4): the spool on the top tier in the valve bay, in the header's own lane, so
  that the header runs straight through its valve; tag `BL-{unit}{sequence}`, after the
  unit's other spools. The plant's header joins it on the pipeway's side (SW-PWY-12).
  The generator lays a header from cap to cap along the rack (SW-RT-1) and has no valve to
  set in its length. It is given the valve as a stub on the spool's inner face (gasket,
  valve, gasket and a blind, SW-LL-6), and on its result the two are made one line: the
  blind becomes a weld-neck flange of the header's size and class on the same gasket and
  studs; the header's cap at that end is taken off; its first piece is carried back to the
  flange and welded to it as it was welded to the cap; the valve's pieces go to the head
  of the header's list, and the header then runs from the spool to its far cap. A shoe
  like the header's others is set on each beam the lengthened piece crosses: the tier beam
  of the rack's first full bent and, for a header the generator carries at mid-bay too
  (SW-PS-7), the valve bay's mid-bay beam. The piece is cut again if that made it longer
  than 40 ft (SW-RPI-10). While the generator runs, a block stands where the piece will
  lie, from the spool to the cap, so that no line routed through the valve bay takes its
  place; as the other blocks (SW-RPI-6), it is no part of the model.
  Reason: a unit is cut off from the plant's steam, water and gas at its limit as from
  every stream; and in line, because the header already lies on the axis the plant's
  branch arrives on: a branch into its side would rise over it and come down again
  through a tee to reach the place where its end already is. The generator's own code is
  not changed; the correction is plant 3's, made in `src/refinery/pipingReport.ts`, and
  each unit's notes name the headers joined.

## 80. Plant 3: the main pipeway and the lines between units (`SW-PWY-*`)

Written 2026-11-24 at the owner's instruction: "the units are all too segregated, they should be
together and more intertwined to where they all connect with one another". The units stand
closer (§77, amended the same day); this section joins them. The main pipeway is piped by the
generator of plants 1 and 2, unchanged, as each unit is (§79): it is given a rack, the units'
battery-limit spools as connections and a line for every stream between units. Nothing was
looked up; the arrangement and its round figures are SmartWeld's own, from the reasoning given
(PROVENANCE P-88).

- `SW-RPI-16` The last run tried again (added 2026-11-25). The generator plans every end of
  every line of a run before it routes any, and each valve's stem takes the first direction
  in which the valve strikes nothing planned before it; it does not look for the 3 in of
  SW-RT-3, nor does it plan a pump's two suction valves together. Where the unit's last run
  (the "rest") reports a valve that strikes in every stem direction, or a valve less than
  3 in from a header, that run is made again, once, and the second result kept where it
  has fewer findings:
  - the lines named in a failure, with the lines they tap and the branches that tap them
    (amended 2026-11-26: the generator plans a branch's take-off on its parent in the same
    run, and a main of the cooling water mains, SW-CWM-4, was the first line named that has
    branches), are routed first, in a run of
    their own on the same plant, and stand as solids for the rest of the run;
  - beside a header that a valve came within 3 in of, a solid 3 in thick is laid along the
    header's side facing the valve, as long as the valve's box and 3 in more each way and
    as high as the header, so that the valve's stem is turned another way.
  - where the valve that strikes, as it stands, meets a valve an earlier run left, that
    valve's stem is first turned to the first other direction square to its run in which it
    comes within 3 in of nothing (a correction on the earlier run's result: the valve, its
    run and its joints stay where they are);
  A run with no such finding is not made again, so a unit routed clean is untouched.
  Reason: in the cracking unit the spare stripper feed pump's suction valve, planned after
  its discharge stack, found every direction struck, though with the two pumps' four lines
  routed by themselves it stood clear: the discharge valve, routed in an earlier run, had
  its stem toward the suction and over it; and two 8 in steam take-off valves turned their
  stems toward a 20 in water header and stood 2.7 in from it.
  Amended 2026-11-27 (SW-RPI-22): the last run is also made again, once, where a line of it
  passes through the body of a valve of its own end stack, or through its own nozzle's
  flange or neck, which no turn of a stem clears. That line, the line it taps and that
  line's other branches are routed first, in a run of their own, with the box the
  generator holds the valve by and the nozzle's flange and neck held as solids, tagged as
  part of the equipment the stack is bolted to (the generator's test of that stack's own
  valves passes its equipment's solids, so they keep their stems), stopping the pipe's
  radius and 6 in short of the stack's lead point, and no part of the model. The second
  result is kept where it has fewer findings, SW-RPI-22's counted. Reason: in the
  hydrotreater the spare's 12 in suction branch took off with its first point inside its
  own pump's suction gate and passed through the gate's body by 9.3 in; with the gate held
  it came round clear (a probe of 2026-11-27).
- `SW-RPI-17` Supports where the generator's stepping stopped (added 2026-11-25). The generator
  sets the supports of a run by stepping along it from its start (SW-PS-9) and stops at the
  first stretch where it finds no steel above and no floor within reach; what lies beyond is
  left unsupported, though steel may cross it further on. Plant 3's own correction, on the
  finished model, takes each stretch of a horizontal run longer than its line's span and steps
  along it from both its ends, as the generator steps (each support at the equal division of
  what remains, never more than a span from the last, moved in 6 in steps to clear fittings
  and welds by 5 in), and at each place sets the first of these that stands clear:
  - a hanger, from a horizontal member of steel above whose bottom is at least the pipe's
    radius and 6 in over the pipe's axis and at most 20 ft over it, its rod 1 in clear of
    every line and solid on its way up (SW-PS-9);
  - a stanchion on a horizontal member of steel directly below (a strut, an intermediate or
    tier beam of a rack, a yard beam), its base plate on the member's top, at most 10 ft under
    the pipe, its post 1 in clear of every line and solid, as plant 2's rule stands one on a
    top-tier beam (SW-PS-9 as amended for plant 2);
  - a stanchion from the floor below, the top of a pad or grade, where its post, as wide as
    its base plate, is 1 in clear of every line and solid from the floor to the pipe; to 10 ft
    the stanchion of SW-PS-9, taller a support post (SW-PS-9 as amended 2026-11-25), to 50 ft.
  Where no place within a span has any of these, a pipe frame is set (added 2026-11-26, the
  owner's choice for the stretches left): a goalpost square to the run, two posts and a beam
  across under the pipe, the pipe on a shoe on the beam (SW-PS-1, 4 in high). The beam's top
  is the shoe's height under the pipe, the beam set down from it by the depth the catalogue
  draws its section at, and each post reaching the beam's underside so (amended 2026-11-27:
  set by the section's name, 8 in for a W8x31 and 12 in for a W12x40, the beams stood 0.2 in
  and 0.17 in into their shoes, 130 shoes in all, found by the plant's clash audit); each post stands on the floor below its own place, a
  concrete pedestal 20 in square and 6 in high on grade or the top of a pad, and is set out
  from the pipe on its own side, the nearest place, from the pipe's radius and 1 ft out to
  15 ft in 6 in steps, where the post and its pedestal are 1 in clear of every line and solid;
  the beam, as long as the two posts are apart and 4 in more each end, 30 ft at most, must be
  1 in clear of everything but the shoe. Posts `W8x31` to 30 ft, `W10x49` taller, to 50 ft;
  beam `W8x31` to 20 ft long, `W12x40` longer (the yard support's beam). Reason: the stretches left run over another line or an item of equipment,
  with no steel above; a post cannot stand under them, but one beside the line below, or
  beside the item, can, and a beam across carries the pipe over what lies beneath, as a pipe
  is carried across an access way. The sections are those of the yard support steel
  (SW-CELL-6), the posts' heavier for heights a yard post does not reach. Frames are plant 3's
  own steel: the generator's model has no place for them, so a unit's report lists each with
  its parts, and the views and documents draw and count them.
  Where a post can stand on one side only, within 4 ft of the pipe's axis, the frame is that
  post and its beam cantilevered from it, reaching 4 in past the pipe (as the bracket of
  SW-PS-6 reaches from a column): a short arm of `W8x31` under one pipe.
  Where no frame either stands clear, the stretch is still listed. The correction adds
  supports and frames only: no line, joint or component moves.
- `SW-RPI-18` Supports that strike (added 2026-11-26). The generator tests a hanger's rod
  against what it has routed when it sets it, and a line routed later, or another line's
  support set at the same place, may still pass through it; nor does it test a stanchion's
  post or a trunnion's leg against every line. A clash check of the whole plant found 42
  rods through other lines' pipes (to 7.4 in), 22 pairs of hangers in one place and rods
  through rack struts. Plant 3's own correction, on the finished model and before SW-RPI-17,
  takes each hanger, stanchion, trunnion and trapeze and tests the tall member of its part (a
  rod, a post or a leg), less 3 in at each of its ends where it bears or is clamped, against
  every piece of every other line, every solid of the steel, concrete and equipment, and
  the tall member of every support set before it: where it overlaps any of them, the support
  is taken out. So is one whose base plate (a stanchion's or a trunnion's) lies more than
  0.05 in inside a solid of the plant rather than on it (amended the same day: stanchions
  set at grade stood with their base plates up to 3.5 in inside an equipment pad).
  The base is every solid of the part within 1 in of its lowest point and no more than 1 in
  high, its plate (amended 2026-11-27: the anchor rods, which go into the member or the
  foundation by design and are not tested, reach 1/2 in below the plate, and the plate itself
  had gone untested: posts stood up to 1.7 in inside channels and pads); and the pipe frames of
  SW-RPI-17, which stand in a unit's report and not among its cell's solids, are solids of
  the plant for this test and for SW-RPI-17 (supports set later stood up to 2.2 in inside
  a frame's pedestal). The tall member is tested against the pieces of its own line too
  (amended the same day: on the models as they stood, five stanchions' posts rose from the
  floor through a flange, gasket, valve or pipe of their own line's battery-limit spool, which
  runs under the run they carry); its ends, left out, hold the piece it carries; a trunnion's
  leg is tested against its own line but the elbow it is welded into (amended the same day:
  first tested against other lines only, a leg stood through its own line's reducer and
  flange below the elbow, by 1.3 in). A support whose solids, any of them, overlap a solid
  of a support set before it, of its own line or another, by more than 0.02 in is taken out
  too (amended the same day: two shoes of one line stood in one place, and two trunnions'
  base plates overlapped by 0.5 in); and SW-RPI-17 tests each support it would set so, its
  own line's supports included. A pipe frame of SW-RPI-17 is tested as a support is
  (amended the same day: frames set for two lines side by side stood with their pedestals
  up to 5.6 in inside each other's, and a post through a nozzle's spool): its pedestals,
  posts and beam against every piece of every line but the run its shoe carries, every
  solid of the plant, and the frames tested before it; a frame that overlaps any of them by
  more than 0.02 in is taken out with its shoe, and with any support that bears on it or
  hangs from it (amended the same day: a hanger left hanging from a frame taken out hung from
  nothing), and SW-RPI-17 may then set another support there; SW-RPI-17 sets no frame whose parts would be taken out so (amended the same day:
  frames it set stood with a post through a support of another line, and were taken out
  only at the next making), nor one whose parts meet a piece of any line or of a nozzle's
  spool by its true shape (amended the same day: tested by the generator's rounds, which
  miss an elbow's inside and hold no spool, two frames set had posts 0.2 and 0.5 in into an
  elbow and a spool). A part's tall members
  are each of its solids that stands more than 6.5 in and is taller than it is wide, each
  tested on its own (amended the same day: the tallest solid alone had been taken, and on a
  line of 12 in or more that is a hanger's clamp ring, as tall as it is wide, so the test had
  found the hanger's own pipe inside its "rod", 26 hangers falsely; and a trapeze's two rods,
  which its part holds as one solid, had been taken as one box across the pipe between them,
  11 trapezes falsely); a trapeze's rods are taken one by one, each at its side of that solid,
  as wide as the solid is thick and as long as its own rod (the part's two rod lengths).
  Each piece is tested by its true shape, SW-RPI-22's (a pipe or flange a flat-ended
  cylinder, an elbow the tube about its arc, a valve its part's solids), and the nozzles'
  spools are pieces too (amended the same day: held as the generator's checks hold them, a
  pipe as a round about its axis that reaches its radius past each end, the riser above a
  trunnion's elbow had seemed to reach 5 in down into the leg, 88 trunnions falsely; and a
  frame's post stood through a nozzle's spool unseen). An oblique cylinder and an arc are
  held by the round swept along them short of their ends by their radius, which lies within
  the piece; the piece joined to each end is tested as well. A hanger's lug, rod and top
  plate, and a trapeze's rods and top plates, are tested too against the true solids of the
  steel, concrete and equipment (a member by its own drawn solids where it lies along an axis
  of the plant, a round bar by its own radius), the rods to their tops, but the member the
  support hangs from (the solid its top plate is in or bears against from below) (amended
  the same day: the generator holds a member by a round about its axis that reaches past its
  flanges, so the rods' top 3 in were left out; twelve hangers' top plates stood 0.37 in into a
  rack bay's bracing rods, and rods passed up to 0.3 in into the girder beside the beam they
  hung from).
  Amended again 2026-11-27 (P-95): where a solid of one support overlaps a solid of another
  by their boxes, the two parts are measured again by their drawn surfaces, and the support
  is taken out only where those surfaces cross or one lies inside the other. Reason: a part
  holds a trapeze's two rods as one solid, whose box spans the space between them; another
  line's hanger rod passing between the rods, clear of both, was taken out at each making
  and set again by SW-RPI-17 at the next (one hanger in unit 14 and one in unit 17, each
  measured at no crossing of their drawn surfaces).
  SW-RPI-17 sets no support this test would take out (amended the same day): a stanchion on
  steel stands on the member's true top, from its own box, not on the generator's estimate
  of it (the centre and seven tenths of the round it holds the member by, which for a 12 in
  girder lies an inch inside it); and each support it would set is tested so first. SW-RPI-17 then sets a support where the span that leaves is longer than the
  line's span, clear by its own 1 in. Only supports move; no line or component does.
- `SW-RPI-19` Valves that strike (added 2026-11-26). The generator turns a valve's stem to
  the first direction in which its box strikes nothing it has planned, and does not see the
  true parts of what it is shown as cells: a clash check of the whole plant found 14 valves
  whose handwheels stood inside the concrete pier of the exchanger they serve (to 11.8 in).
  Plant 3's own correction, on the finished model: a valve whose body, bonnet, stem or
  handwheel (its part's solids) overlaps a solid of the steel, concrete or equipment or a
  piece of another line is turned about its own run to the first other direction square to
  the run, up first, in which none of its solids comes within 1 in of a solid of the plant
  or within 3 in of another line (SW-RT-3; with 1 in, a valve turned in unit 19 came within
  the generator's 3 in of a line); the valve and its joints stay where they are. A valve with
  no such direction stays, and is listed. Amended the same day: the valve's own line counts
  too, but for the pieces of its own stack (those on its run's axis, and those joined end to
  end with them): the generator turns a valve's stem before its line is routed, and the line
  may then turn its riser beside the stack, on the stem's side, through its own handwheel
  (a design panel's survey found 17 lines so, in eight units).
  Amended again 2026-11-27 (SW-RPI-22): an elbow is never part of the valve's own stack,
  even joined end to end with a piece on its axis, and the own line's elbows are measured by
  their arcs (three cooling water take-offs turned their first elbow, at the take-off's
  lead, into their own butterfly valve's lever, on the inside of the bend); and no
  direction is stem down (SW-LL-5): the turn takes the first of up, +x, -x, +z and -z square
  to the valve's run, as SW-RPI-16's turn of an earlier run's valve does.
  Amended 2026-11-27 (SW-RPI-18 as amended): whether a valve strikes is judged by the true
  shapes, the plant's true solids and the other lines' pieces as they are (a pipe a
  flat-ended cylinder, an elbow its arc's tube); held by the generator's rounds, four valves
  of the cracking unit seemed to strike pipes of other lines they stood clear of, and were
  listed as having no clear direction. The test of a direction to turn to is as before. The
  nozzle a valve's line ends at, which its stack bolts to, is no other line's piece for this
  test (amended the same day: held so, eight valves of the cracking unit bolted to their
  nozzles were turned at every making, up and then aside and back).
  Amended again 2026-11-27: an item's solid is judged by its drawn surface, not by its box.
  A valve whose solid (held by its box) overlaps the box of one of an item's solids strikes
  it only where a triangle of that item's drawn solids meets the valve's box, or the box
  lies inside one of them. Reason: held by its box, a ring platform's kerb, a curved shell
  or a frame fills the space it encloses, and six valves standing in such space (in a
  column's platform's open quarter, beside the sulfur pit and beside the sulfur unit's
  reaction furnace) were listed as striking items whose drawn triangles none of them comes
  near (measured, P-95). A valve
  so cleared is neither turned nor listed. The test of a direction to turn to is as before.
- `SW-RPI-20` A hanger's top at the steel it hangs from (added 2026-11-26). The generator
  takes the underside of the member a rod hangs from as the member's centre less seven tenths
  of the round it holds it by, which for a wide-flange beam lies inside the beam: its top
  plate stood 1.5 to 2.3 in up in the beam (an independent clash check counted 864 such seats
  in the plant). Plant 3's own correction, on the finished model: each hanger's rod is cut,
  or lengthened, so that its top plate's upper face meets the underside of the horizontal
  member it hangs from, found as the lowest member over the rod whose underside lies within
  6 in of the plate, or where none is over the rod, over its top plate (amended 2026-11-27:
  the generator hangs a rod within six tenths of the round it holds a member by, which for a
  wide-flange member reaches up to 1.2 in past the edge of its flange; 79 hangers so had their
  plates up to 1.7 in inside the flange of the beam, strut or girder beside them, left by this
  correction as it was first written); the clamp and the pipe stay. A hanger with no such
  member is left. It is made before SW-RPI-18's test (amended the same day), which would
  otherwise find the plates in the steel they hang from, and again after SW-RPI-17. A
  trapeze's two rods are each made so, to the member over that rod or its plate (amended the
  same day: left at the generator's estimate, 13 trapezes' rods and plates stood up to 2 in
  inside the beams they hang from). Amended again 2026-11-27: the rod is cut to the underside
  however short it comes out, provided at least 3 in of rod stands clear between its lower
  attachment (a hanger's clamp ears, a trapeze's crossbar under the pipe) and its top plate.
  Reason: a rod carries a nut at each end, each about as tall as the rod is thick, with thread
  showing past it, and needs room between them to turn one; 3 in is our own least for the
  sizes used here (3/8 to 3/4 in). Where the member's underside leaves less than that, the
  support cannot hang there and is taken out (SW-RPI-18), its span then counted by the
  supports check. As first written the correction kept the generator's estimate wherever the
  rod would have come out under 8 in, a limit that was in the code and not here: so one
  trapeze's rods (3 in line, unit 19) stood 0.69 in up inside the rack strut it hangs from.
  Amended the same day: a hanger, or a trapeze rod, with no such member over its rod or its
  plate, and no drawn solid of any kind standing over its plate with its underside at most
  1/2 in above it (or with the plate in it), is taken out (SW-RPI-18), no longer left as it
  was: a rod that hangs from nothing cannot carry anything. Two were so: a hanger in unit 11 left under the place of
  a pipe frame that was set again elsewhere when the lines at the raised pumps were carried up
  (SW-RPI-26), its plate 38 ft up under nothing; and a hanger in the main pipeway whose rod the
  generator hung 5.7 in off the axis of a junction frame's beam, its plate 0.11 in clear of
  the beam's flange edge in plan.
- `SW-RPI-21` One stud set through a wafer valve (added 2026-11-26). A wafer body is clamped
  between its two flanges by one set of studs through both, as its rule says (BF-1). The
  generator builds the joint on each side of the body as a joint of its own, each with its
  stud set, so that the two sets' nuts met inside the joint, in the same holes (116 found).
  Plant 3's own correction: the two sets are made one, from the back of one flange to the
  back of the other, its length by the catalogue's rule for a stack (SW-FLG-13).
- `SW-RPI-24` A weld bead square to its joint (added 2026-11-27). The generator orients the
  weld at a joint by the direction from one end of the second piece to its other end, which
  at an elbow is the elbow's chord, 45° off the pipe's own direction at that end: the bead,
  drawn as a ring square to that, stood tilted through the elbow and the piece beside it (an
  independent clash check found 123 such beads at elbows, to 2 in). Plant 3's own
  correction, on the finished model: each weld is set square to the axis of the joint it
  closes, the direction of the straight piece it joins (a pipe first; else a flange, reducer
  or tee run, and at a tee's outlet the outlet's axis), or, between two elbows, the elbows'
  common tangent there; its place stays (amended the same day: taken first from a tee it
  joined at its outlet, a weld was set square to the tee's run, across its own branch).
- `SW-RPI-25` A slip-on flange's inside weld at the pipe's end (added 2026-11-27). SW-FLG-10
  stops the pipe t_pipe + 1/8 in short of a slip-on flange's face and lays the inside fillet
  there, so that the weld cannot foul the gasket; the generator records that weld at the
  face itself, its bead standing t_pipe out of the flange through the gasket and into what
  the flange bolts to (an independent clash check found 46 such welds in 47 contacts, 0.125 in into gaskets and up to
  0.2 in into wafer valves' bodies, at the units' cooling water spools). Plant 3's own
  correction, on the finished model, made with SW-RPI-24: each slip-on flange's inside weld
  is moved from the face into the flange by t_pipe + 1/8 in, to the pipe's end, its bead
  toward the face, ending 1/8 in short of it; the weld at the hub's back stays.
- `SW-RPI-26` Lines at connections that rose, carried up with them (added 2026-11-27). Where a
  correction of an item's drawing raises some of its connections by a height Δ and moves
  nothing else in a unit, the lines at those connections are not routed again. Walking from
  the connection along each such line, its pieces rise by Δ with it up to the first vertical
  pipe that can take the change (one going up that stays 2 in long or more once cut shorter
  by Δ, or one coming down, made longer by Δ), and that pipe is cut so; a take-off on a piece
  that rose rises with it, and its branch walks from it the same way; a support on a piece
  that rose is taken off, and SW-RPI-17 sets the line's supports again. The welds at the
  joints that rose rise with them. Each line so changed must hold every check of §40 and
  SW-RPI-22, or the unit is routed again. Reason: routed afresh after its six charge and
  product pumps rose 6 and 12 in (SW-EQ-4 as amended), the crude unit left two lines
  unrouted that had been routed before (a spare's take-off set over its parent's own valve,
  a side draw whose search ran out), every route depending on every one before it; and
  routed again alone, the twelve lines at those pumps came out worse (a suction looping round
  its own valve's stem and shutting its spare's way). Carried up, they keep the routes that
  held every check, and only the lengths next to the pumps change.
- `SW-RPI-27` A spade's handle opposite the stem of the valve beside it (added 2026-11-27). The
  generator turns a spade's handle and the stem of the valve on the other side of the gasket
  the same way; at the units' cooling water spools, where the valve is a wafer and its neck
  stands out from its faces, the handle met the neck (an independent clash check found 15,
  0.07 to 0.25 in). Plant 3's own correction, on the finished model: a spade whose handle
  points as the stem of a valve next to it in its stack (no more than a gasket between) is
  turned half round its run, its handle the other way; its place stays.
- `SW-RPI-28` A shoe or guide off the welds of the steel it stands on (added 2026-11-27). The
  generator sets a shoe or guide on a beam where its run crosses it, which may be where the
  beam is welded to its column; there the guide's angle stood 0.2 in in the bent's fillet
  welds at four places on the pipeway. Plant 3's own correction, on the finished model: a
  shoe, guide or anchor any of whose solids meets a weld of the steel by more than 0.02 in is
  moved along its run, an inch at a time up to 6 in either way, to the nearest place where
  none does and it stands on the same member; one with no such place is left and listed.
  Amended the same day: so too a shoe, guide or anchor not wholly on one straight pipe of its
  own line, its length within the pipe and 1 in clear of each of the pipe's ends. Reason:
  the generator steps a shoe to where its run crosses a beam, which may be under a butt weld
  (whose bead stands proud of the pipe), a reducer or the start of an elbow's bend; there the
  web stood up to 0.27 in in the elbow, 0.15 in in the reducer and 0.19 in in the bead (an
  independent clash check, 25 shoes). A shoe is welded to straight pipe, and never across a
  girth weld, which must stay open to inspection.
  Amended again 2026-11-27: the generator's own check of a shoe at every bent that a run on
  the rack passes looks for one on the bent's centre line exactly; a shoe, guide or anchor
  this correction moved stands on the same beam, within 6 in of that line, and the bent
  counts as shod by it. Reason: two guides so moved, by 1 and 3 in, were listed by that check
  as missing from their bents.
- `SW-RPI-22` Pieces of one line clear of each other (added 2026-11-27). The generator keeps
  a line 3 in from every other line but never measures a line against itself: its search
  passes every cell held under the line's own number (its end stacks, their valves' boxes
  and its leads), the cells it is laying join the grid only when it returns, so a loop it is
  driven into may come back through its own first leg, and its clearance check (§40)
  compares only pieces of two different lines. An independent clash check of the nine units
  found 32 lines whose pieces passed through pieces of the same line, to 18.4 in, none of
  them reported: branches to installed spares looping back through their own first leg,
  risers through their own valve's handwheel, lead elbows into their own butterfly valve's
  lever, two lines whose lead points passed each other, a 45° offset laid over its own tee,
  and the vacuum unit's 36 in transfer line turning about over its own end and down through
  its own flange. Each unit's checks (and the pipeway's and the mains') therefore measure
  each line against itself, the flange and neck of each nozzle it ends at with it: a pipe,
  reducer or tee's run by its cylinder, a tee's outlet by its stub, a 90° elbow by its arc,
  a 45° elbow by its two legs (SW-RPI-13), a flange, gasket, blind or spade by the flange's
  diameter, a valve by its part's solids; studs are not measured. Not compared: two pieces
  joined to each other; two with nothing between them but gaskets, a joint's blind and
  studs; two on one axis whose lengths overlap by no more than 0.05 in (the valves of a
  stack or station stand so by their own rules, SW-LL-3, SW-LL-7). A pair that shares more
  than 0.05 in is a finding, "pieces of one line clear of each other", and a unit is clean
  only where these come to zero. Reason: two pieces of steel cannot stand in one place.
- `SW-RPI-23` A line through itself, corrected on the result (added 2026-11-27). Each
  correction acts only on a line SW-RPI-22 reports, on the merged model after SW-RPI-14 and
  before SW-RPI-11 and SW-RPI-10, is named in the unit's notes, and moves nothing but that
  line (and for (a) the parent's fitting and the two pipes beside it). Every new piece is at
  true scale, every straight at least 2 in (SW-RT-4), 3 in from every other line, steel and
  equipment (SW-RT-3) and clear of its own line (SW-RPI-22); welds follow from the pieces as
  the generator derives them; a support on a piece taken out goes with it, and SW-RPI-18
  and SW-RPI-17 set the line's supports again; head room is kept (a new piece lower than
  8 ft above the floor, or 7 ft above a platform, lies within 4 ft in plan of the line's own
  end points, SW-RT-3; none enters the 2 ft over a rack tier, SW-RT-7). Where none serves,
  the line is left and listed.
  - (a) A take-off nearer its far end than one elbow spacing. The generator sets a branch's
    take-off at the place on its parent nearest the branch's far end, and its search needs
    one elbow spacing of straight before every turn but the first (SW-RT-4: two elbow radii
    and 2 in on the 6 in grid; 24 in at 6 in, 30 at 8, 36 at 10, 42 at 12, 54 at 14). Where
    the take-off's first point and the far end's first point stand nearer than that on every
    axis, the branch has no way of fewer than four elbows, and the cheapest the search finds
    may come back through its own first leg. Where a branch passes through itself so, its
    fitting, with what stands on its outlet, is moved along the same straight piece of its
    parent 6 in at a time away from the far end's first point, to the first place from which
    the branch runs out along the outlet and into its far end's stack with at most two
    elbows, keeping the generator's margins for a take-off (the fitting's half-length, the
    parent's elbow radius and 3 in from a corner; two fittings' half-lengths and 2 in apart;
    a branch flange 3 in from another). The parent's two pipes beside it are cut again.
    Reason: an installed spare's suction tee stood 18 to 42 in above the spare's suction axis
    on the first pump's drop, a little less than the branch's elbow spacing (in unit 11's
    14 in branch 42 in where 54 were needed); the branch ran past the spare, rose, came back
    and dropped through its own first leg by 13.6 in. With the tee 12 in higher it goes out
    55.0 in and down 7.3 in into the stack; given a solid at the old place, the generator
    itself took exactly that way. Nine suction and two discharge spares were so.
  - (b) Two ends on one axis. Where a line's two end stacks, or an end stack and a
    take-off's outlet, stand on one axis facing each other with 2 in or more between them,
    the pieces between become one straight pipe. Reason: the generator joins two lead
    points, each an elbow radius beyond its stack; where they pass each other it loops back
    through its own stack (a spare's discharge under the tee on the first pump's discharge,
    whose straight is 24.5 in).
  - (c) A turn-about at a bare end. Where a line passes through itself, or its own nozzle's
    flange or neck, at a connection left without its valve (SW-RPI-14), and the run before
    the turn-about lies parallel to the connection's axis, offset in one plane by 8 ft or
    less, the pieces from that run's last elbow to the flange are laid as a 45° offset as
    SW-RT-8 lays one (two 45° elbows on a diagonal centred between them on the 6 in grid, not
    within 6 in of a grating, every new piece within the plan area and no lower than the
    pieces it replaces). Reason: the vacuum column's 36 in feed arrives 8 ft below its
    nozzle, and two 90° elbows of that size need 10.5 ft between them; the generator rose
    18.5 ft, came back over its own end and dropped through its own flange.
  - (d) A 45° offset over a take-off. SW-RT-8 lays no offset where a branch sits on the
    length it replaces, but the generator tests only the take-off's centre against the
    offset's two corners. Where an offset it laid leaves less than 2 in of pipe between one
    of its elbows and a take-off's fitting on the same run, or runs past it, the corner is
    laid as the generator routed it, two 90° elbows at the path's corners. Reason: in the
    hydrotreater's 12 in suction the second 45° elbow ended 6.3 in past the start of the
    spare's tee, and the pipe between them was laid backward through both.
  - (e) A loop through its own leg (added the same day). Where two straight legs of a line's
    route cross, the loop between them is taken out and the line turns at the crossing,
    from the first leg onto the second, its pieces laid as the generator lays them and taken
    only where every test above holds; only the pieces between the elbow before the first
    leg and the elbow after the second are laid again, the rest keep their places (laid
    again whole, a short make-up pipe the generator had left at its end stack could not be
    laid again at 2 in). Reason: routed again with its lanes moved, the
    utilities unit's 4 in feed ran 18 in past a corner, rose, came back and fell through its
    own first leg; none of (a) to (d) served.
  The corrections are plant 3's own (src/refinery/ownLine.ts), made in a unit's run and by
  tools/refinery-selfx.ts on the models on disk; the generator's code is not changed.
- `SW-RPI-29` A line within 3 in of a member, routed again (added 2026-11-27, P-95). Where the
  lines of one of the generator's runs (SW-RPI-7), as routed, pass nearer than 3 in to a steel
  member (the generator's own check, §40, measured again by SW-RPI-13), the run is routed once
  more with each such member also held as a solid: its section's box widened by 3 in all
  round. The second routing is kept where it has no more failures and fewer such findings than
  the first, and is said in the notes. Reason: the generator is not shown the tier beams of the
  first bent of a unit's rack in the main pipeway (SW-PWY-8), and once the main rack's lanes
  were kept clear of the bent beams' end welds (SW-PWY-5 as amended), a 3 in line crossing to
  the utilities unit was routed 0.23 in under that unit's top tier beam. Held for that run only,
  the member is avoided by its lines, and nothing else changes.
- `SW-PWY-1` Frame. The main pipeway is built level in its own frame, as a unit is (SW-CELL-1),
  in inches: x east along the rack from its west end, z south across it from its centre line,
  y up from the bench. It is set on the site by a shift alone. Area number 10; its lines are
  numbered `10nnn` (SW-LL-1): a stream's line from 10001, a branch from 10101, the valve and
  blind beyond a limit spool from 10801.
- `SW-PWY-2` The rack. One rack down the middle of the corridor between the two rows of units
  (SW-SITE-4): 30 ft wide, bents at 20 ft, built as a unit's rack is (SW-RK-*, 40 psf a tier),
  from 15 ft west of the first unit's plot to beyond the last, a whole number of bays. (First
  drawn 40 ft wide, then 36 ft. The kit sizes a tier beam at a twentieth of its span, 24 in
  deep at 40 ft and 22 in at 36 ft, and the generator holds a beam as a round of its
  section's half-diagonal on a 6 in grid: at those depths the round reaches the level the
  pipes on the tier lie at, by 0.04 in at 22 in, and no lane was free at any bent. At 30 ft
  the beams are 18 in, as on the crude unit's rack, which the generator pipes.) Its
  first and last bays are limit bays (SW-PWY-4); the lines run on the bays between. Tiers at
  20, 26 and 33 ft: the lower two 4 ft above the tiers of the units' racks (16, 22 and
  28 ft), the top one 5 ft. Reason: a line that turns from a unit's rack onto the main rack
  changes height as it turns, so that it crosses the lines already running there instead of
  meeting them. The lines of a unit's tier pass under the steel of the main tier above
  them (its beams are 18 in deep, the struts along its column lines 14 in) and over the
  lines of the main tier 2 ft below, and a line rises 4 ft to the first or falls 2 ft to the
  second: 4 ft is two elbows of a 12 in line and a make-up piece, 2 ft two elbows of a 6 in
  line. The top tier stands a foot higher because the crude feed, 16 in, comes off the crude
  unit's top tier and its two elbows take 5 ft. (First written with the tiers at 19, 25 and
  31 ft, 3 ft from the units' either way; a 6 in line then passed under the struts with
  1 in to spare and a 16 in line not at all.) The road across the pipeway (SW-SITE-6) passes
  under the rack between two bents, 18 ft under the lowest tier's steel, and the way along
  the pipeway is under the rack between its column lines: no line of the pipeway runs lower
  than the lowest tier of the units' racks.
- `SW-PWY-3` What runs on it. Each stream between units (SW-REF-12) that has a party on the
  process bench is a line of the size, class and design conditions the process model gives
  that stream (SW-PRC-2). It runs from the battery-limit spool (SW-RPI-4) of each unit that
  sends it to the spool of each unit that receives it. Where a stream has two parties that
  is one line. Where it has more (sour water from six units to one), the line runs between
  the two parties furthest apart along the pipeway and every other party joins it by a
  branch from its own spool, of that spool's size, with a tee where the branch meets it;
  where an end party's spool is smaller than the line, the line is reduced at that spool.
  Reason: a collected or distributed stream is a header along the rack with a connection at
  each unit it passes. A tank farm that both takes a stream and returns it (straight-run
  naphtha to and from intermediate tankage) has two connections on the one line. A line of
  the utilities unit to an item of its own on another plot (the cooling tower's make-up)
  runs the pipeway in the same way. Streams with no party on the process bench (between
  the tank farm, the marine terminal, the loading racks and wastewater treatment) are for
  those areas' own pipeways, a later stage, and are listed as such.
- `SW-PWY-4` Limit spools. A party that has no battery-limit spool yet is met at a limit spool
  of the pipeway's own: two nozzles back to back, 24 in face to face, as a unit's spool is,
  tag `PL-10{sequence}`. The pipeway's line bolts to its near face; on its far face stand a
  block valve and a blind flange, which are the party's until it is piped. For a unit on the
  pipeway not yet piped (the cracker; the cooling tower's plot) the spools stand in that
  unit's valve bay where its own will, on its lowest tier, spaced as a unit's are (a
  flange and 6 in, or the valves' handwheels and 3 in), about the rack's centre line, a
  second row on the next tier where one is too wide. For the areas beyond the bench they
  stand in the limit bay at that end of the main rack, each on the lane its line runs in,
  5 ft inside the rack's last bent so that neither valve stands over a beam: at the east
  end the tank farms, the liquefied gas bench, the loading racks and wastewater treatment,
  whose pipeways leave from there (SW-SITE-4); at the west end the flare, the fire water
  tanks, the raw water intake and the gas main. Reason: every line of the pipeway can then
  be built whole, and is met at its flange when the area beyond is piped; a blind behind a
  valve is how a line is left for a later tie-in.
- `SW-PWY-5` Tiers and lanes. Each line that runs the main rack is given its tier and lane
  beforehand, as on a unit's rack (SW-RPI-7): the largest first, each on the first tier
  allowed it that it does not load beyond the same width as the others, the lowest first;
  lanes from the centre line outward, on the side of the rack its parties stand on where
  they stand on one (every lane on that side, tier by tier, before any on the far side: a
  line on the far side crosses under the whole rack to reach it); spacing by the same rule. The top tier is kept for the utility
  headers of the next stage (SW-PWY-10), as a unit's top tier is for its headers: a
  process line lies on it only where its spools leave it no other tier, or where the two
  below cannot take it. A line over 10 in that comes onto the rack from a unit lies in
  the outermost lane on that unit's side, and the lane of the tier below its spool's level
  is kept clear beneath where it comes in: so large a line does not cross over the lanes
  kept on the tier 2 ft below it (the generator holds a kept lane 9 in above its pipe,
  SW-RPI-7; the crude feed, given the centre lane of the lowest tier, found no way down to
  it). A line may lie on the main tier 4 ft above
  the unit tier of each of its spools or 2 ft below it where its elbows allow (SW-PWY-2);
  one of 8 in or less may lie on any tier, rising or falling to its spool's level in the
  strip between the rack and the unit; a larger one that can lie on neither tier next to
  its spools lies on the lowest, and the lanes it passes on its way down are kept clear
  where it passes. Where a valve at a limit bay would reach the lines of the tier above,
  that tier's lane over it is kept clear too. No lane lies over a stringer (SW-PWY-9),
  nor under one of the tier above (added 2026-11-25, when the top tier's stringers were
  moved, SW-PWY-12: a 3 in line of the middle tier, in a lane under one of them, could
  not rise at its ends to its units' top tiers).
  The middle of the top tier is the utility headers' (SW-PWY-11, added 2026-11-25): the
  band their lanes take, and 3 ft either side of it where their branches come down
  (SW-PWY-12), are no lane of any other line.
  Amended 2026-11-27: no lane lies so near a bent's end that a guide in it (SW-PS-2, the
  outer edges of its angles 5 1/8 in from the pipe's axis, as the catalogue draws them)
  would stand on the beam's end connection: a lane's centre is no nearer the rack's edge
  than leaves the guide's outer angle 1 in clear of the toe of the fillet weld at the
  beam's end plate, measured on the bent as drawn. Reason: the generator sets a guide at
  any bent of a line's run (next to its anchor, at the run's ends), so every lane may
  carry one; the pipeway's columns, deeper than a unit's because its top tier is higher
  (SW-RK-2), bring the beam's end plate 19 in inside the rack's edge, and in the lane 2 ft
  inside it a guide's outer angle stood 0.2 in in that weld at every bent it was set on
  (four guides of one line, found by SW-RPI-28's test, P-95), where no place along the run
  could clear it: the weld spans the beam's whole flange. A unit's rack, its columns
  shallower, leaves the guide clear in its outermost lane (measured, P-95), and no unit's
  lane changes by this.
- `SW-PWY-6` The generator is run once for each line that runs the rack, with the branches
  that join it, on the tier and in the lane given it, the lanes of the lines still to come
  kept and its own tier fenced but for its lane; then once for what remains: the lines
  between units that face each other across the corridor or stand within 20 ft along it,
  which the generator lays direct (SW-RT-*), the valves and blinds beyond the limit
  spools, and the utility headers with their branches (SW-PWY-11, SW-PWY-12; added
  2026-11-25). As SW-RPI-7, with the same kept room for the valves of lines still to come.
  A lane kept for a line still to be laid is held, while a line of another tier is routed,
  as a solid a pipe's radius and 6 in to either side of its centre (amended 2026-11-25 from
  the pipe's radius alone: with the cracking unit joined, a 4 in line coming down from the
  tier above at unit 18's limit passed 6 in from the centre of the lane kept for the lean
  amine line to the cracker, and that line then found its lane shut).
- `SW-PWY-7` At a spool. The pipeway's line bolts to the spool's face flange to flange, a
  unit's spool or a limit spool: the valve the generator stands there is not built (as
  SW-RPI-14, by the same correction on its result; where the line is reduced at the spool
  the reducer moves up with the flange). Reason: the valve on the spool's other face is the
  block at the limit, and the spool between the two flanges is the piece taken out to part
  them; a second valve a pipe's length from the first would shut nothing more. A spool's
  class is its stream's (SW-RPI-9), so the two flanges are of one class.
- `SW-PWY-8` Where the pipeway's lines may travel. In the corridor, from the level of the
  units' lowest tier upward; and, to reach a spool, in the valve bay of that spool's unit
  between the unit's limit and the spool, no wider than the unit's rack between its column
  lines. Everywhere else the generator is shown the solid blocks of SW-RPI-6. The steel of
  each unit that stands in its valve bay is shown to it as it stands, except the tier
  beams of the rack's first bent: the valve the generator stands at a spool, which is not
  built (SW-PWY-7), would stand over such a beam with less than the clearance asked, and
  the pipe that takes its place clears it. The result is checked against all the steel as
  it stands, those beams included. A line that passes over one of those beams on its way
  to its spool rests on it: a shoe is set there on the generator's result, as the
  generator sets one on a rack beam (added 2026-11-25: with a unit's top-tier spools in
  two rows, SW-RPI-4, a line to the further row ran 21 ft from the junction frame to its
  flange with that beam under it and no support on it). Where the line passes over the
  first bent's top-tier beam higher than a shoe stands, by 4 ft at most, and nothing lies
  between, a post stands on the beam under it, as the generator stands one on a top-tier
  beam of a rack (SW-PS-9). And the run is stepped again from there. The generator steps
  along a run from its start and, where a step finds no steel within what the line spans,
  leaves the rest of the run as it is (SW-PS-7); not shown the first bent, it finds none
  from a spool of the further row, though the junction frame, the rack's strut and the
  stringers stand over the run further on. So, on the result, on a run that crosses a
  first bent: where the stretch between two supports, or from a support to the run's end,
  is longer than the line spans, a hanger is set at a member that crosses over the run
  within the span of the support before, the one nearest the equal division of what
  remains, and so on along the stretch, from its other end where nothing is found from
  the first. The conditions are the generator's own (SW-PS-9): steel a rod can hang from,
  its underside more than 6 in above the pipe and not more than 20 ft over its centre
  line; the rod's way up clear of every other line by 1 in; the place more than 5 in from
  every weld and fitting of the line. Where a weld stands at the member's line the hanger
  moves along the run under the member, half an inch at a time, no further from the
  member's line than the generator itself takes steel to reach (six tenths of the round
  it holds the member by). What this does not close stays in the list of spans (added
  2026-11-25: three 3 in condensate branches from spools of the further row stood 45 ft
  with one shoe; a 3 in line's splice weld stood 1 in from the strut's line, where its
  hanger belonged; a 4 in line was 0.2 in over its span once the valve at its spool was
  left out, SW-RPI-14; a boiler feed water branch passed 28 in over the first bent).
  Each unit's cooling water header spools (SW-RPI-15), which the cooling water mains join
  (§81), stand as solids while the pipeway is routed (added 2026-11-26), and with each the
  room its branch from the mains will need in front of its face: from 3 in behind its far
  face to a gate valve's length, 6 in, an elbow's radius and 12 in beyond its near face, as
  wide and as high as its flange (the generator keeps its 3 in from it besides; with 3 in
  more each way, two small branches of the cracking unit, in the lanes beside its 20 in
  spools, were sent up over them to 18 in under the main rack's top tier). Reason: routed without them, three of
  the pipeway's branches lay against the bodies of spools that stood unconnected (a 3 in
  branch 0.3 in under the 20 in return spool of the cracking unit, a 4 in one through the
  12 in return spool of the vacuum unit, a 4 in one beside the 6 in supply spool of unit
  16), and another stood where the 20 in supply branch of the cracking unit has to leave
  its spool. The pipeway's checks did not look at the units' spools; these were found when
  the mains were checked against everything built. A post the pipeway sets on a first
  bent's beam (above) stands 1 in clear of these too: one, under a 4 in branch that the
  spool's room had moved up over unit 16's supply spool, came down through the place of
  the mains' branch.
  Every piece each unit has built in its valve bay stands as a solid while the pipeway is
  routed, as its steel does (added 2026-11-26): its lines' pieces and supports, and the
  bodies of its spools but those the pipeway's own lines bolt to, each held by its box.
  Reason: the pipeway had been shown only the units' steel; with the spools' room added, one
  of its branches was routed through the vacuum unit's 12 in cooling water return header
  behind its spool, which a clash check of the whole plant found (the generator's checks
  look at one model at a time).
- `SW-PWY-9` Supports. The generator carries each line on the main rack's beams (SW-PS-*)
  and hangs what crosses under steel from that steel. So that a line crossing from a unit
  has steel over it within what it spans: 2 ft inside the corridor from each unit's limit
  stands a junction frame, two posts in line with the columns of the unit's rack and a
  beam between them at the level of each main tier (a line may cross to the rack at any
  of the three levels, whatever tier its spool stands on);
  and along the main rack, under each tier, run two stringers 5 ft either side of the
  centre line, bay by bay, as a unit's rack has one under its lowest tier (SW-CELL-6);
  under the top tier three, on the centre line and 8 ft either side of it (amended
  2026-11-25: at 5 ft they stood under the very places where the branches of the utility
  headers come down beside their band, SW-PWY-12). A
  line from a spool then hangs at the junction frame (13 ft 6 in from its flange), at the
  rack's strut (13 ft 9 in on) and at each stringer it passes (10 ft at most): within the
  15 ft a 3 in line spans (SW-PS-7).
  Each stringer is framed to its bay's intermediate channel, and each cage hoop of the rack's
  end ladders ends at its rails, as in a unit's rack (SW-CELL-8, added 2026-11-27).
  A junction beam's depth is a twentieth of its span, to the next 2 in, and its weight
  2.75 lb/ft for each inch of depth, to the next 5 lb; a post is of the next depth below
  the beam's that is 10 in at least. These are SmartWeld's own proportions, from the same
  reasoning as SW-RK-2 (depth by span); nothing was looked up. What remains unsupported is
  listed, as for a unit.
- `SW-PWY-10` Checks, records and exports as for a unit (§40, SW-REG-9, SW-GT-*, SW-PCF-*):
  the pipeway is one more piped area, shown with the units in every view of the plant.
  (Until 2026-11-25 a unit's headers ended capped at its battery limit, SW-RPI-12; they
  are now joined to the plant's headers, SW-PWY-11.)
- `SW-PWY-11` Utility headers (added 2026-11-25). On the top tier lies a header for each
  utility (SW-PRC-19) that a unit on the pipeway other than unit 19 takes or makes: high-,
  medium- and low-pressure steam, condensate, boiler feed water and fuel gas; and
  instrument air, service water and caustic, which only the cracker takes. Each is laid by
  the generator as it lays a unit's headers (SW-RT-1, SW-RPI-5): straight, from a cap 1 ft
  inside the first bent beyond the west limit bay to a cap 1 ft inside the last before the
  east one, in lanes from the centre line outward by the generator's own spacing, the
  largest first, carried on every bent's top tier beam. Lines from 10401. Reason: a
  header the length of the rack passes every unit on it, and one that is added later.
  Not on the rack:
  - Plant air and nitrogen. No unit's flowsheet takes either yet (hose stations and purge
    connections are a later stage); their lines end at unit 19's spools.
  - Cooling water. Its two mains are 30 in, and the pair of them full weighs 1,055 lb a
    foot (the catalogue's pipe, K-1, K-5) against the 1,200 lb a foot a tier is built for
    (SW-PWY-13). They start at the cooling tower, whose plot is not piped yet. Where they
    run (buried along the corridor below the frost, as mains of that size commonly are,
    or on sleepers beside the rack) is put to the owner with that stage. Each unit's
    cooling water headers end at their valves and spools meanwhile (SW-RPI-15).
  - What the areas beyond the bench take (the flare's steam, gas and water; the tank
    farm's heating steam, and its condensate back): each header ends in a cap at either
    limit bay and is carried on from there with those areas' pipeways.
- `SW-PWY-12` A header's branches (added 2026-11-25). Each party joins its header by a
  branch of its spool's size, 3 in at least (a 2 in pipe spans 10 ft, SW-PS-7, and from
  the rack's strut to the junction frame is 14 ft: the first run left thirteen 2 in
  branches with no support the generator could give; a smaller spool is met with a
  reducer at its flange, as SW-PWY-3): unit 19's spool for that utility, the header spool of each
  unit (SW-RPI-15), and for a unit not yet piped a limit spool on its top tier (SW-PWY-4)
  of the size its header will be (SW-RPI-5). A branch leaves the top of the header (the
  generator's rule for a header's take-offs: a tee, or a branch fitting where the branch
  is half the header's size or less), with no valve there: the block valve is at the
  unit's limit 40 ft on, and one on the main rack's top tier, 34 ft up, could not be
  reached. It rises, crosses over the headers that lie between it and the edge of their
  band on its party's side, comes down beside the band to the level of the unit's top
  tier, 5 ft below, and crosses out under the main rack's top tier to its spool as the
  lines between units do, hung from the same steel (SW-PWY-9). The generator finds that
  way because the space over the top tier is shown to it closed (SW-PWY-8, SW-RPI-6):
  everywhere from 6 ft above the tier, and from the tier's level upward outside the
  headers' band and the 3 ft either side of it, as far as the junction frames. Reason:
  steam, air and gas are taken from the top of a header so that what condenses or settles
  in it stays out of the branch, and the water lines are taken the same way for one rule.
  Over the top tier there is no steel to carry a pipe across the rack; under it there is.
  The generator keeps head room over each tier of a rack and lets a line through it only
  within 6 ft of that line's own end (SW-RT-3). A branch therefore comes down within 6 ft
  of its header: beside the band on the side nearer its header, and from there under the
  band to a unit on the other side. Each header has such a place: 12 in clear of the
  band, 18 in from a stringer of the top tier and 18 in inside the strip (first run: the
  low-pressure steam header, on the centre line, had its only places over the stringers,
  which then stood 5 ft either side, and five of its seven branches found no way down).
  A branch has no valve of its own, and the service of a line decides nothing else in the
  generator but its valves: so a branch, and the valve and blind beyond a limit spool, are
  numbered and built as process lines (SW-RPI-3), branches from 10601. (As steam lines
  they were given globe valves at their spools, to be taken out again, SW-PWY-7; one, longer
  than a gate valve, struck a column of the unit's first bent.)
  Three things make the way of a branch across the centre line from its header, the
  longest there is, one the generator finds within its search (each added after a run in
  which such a branch found none). Those branches are routed first, the largest first,
  and the others after them. In the last run, where only the headers and their branches
  are routed, the space under the rack is shown closed from the lowest tier's level to
  6 in below the units' top tiers: a branch crosses under the top tier, and has nothing
  to do under the tiers below (one had gone under the lowest tier and up through two
  tiers of lanes). And the limit spools of a unit not yet piped, for its headers, stand
  in one row at the middle of its valve bay, a valve's width apart and each 2 ft at least
  from the line of a bent or mid-bay beam of the main rack, past which its branch must
  go where it comes through the top tier; those of the headers across the centre line
  from the unit stand last, at the row's east end. The headers and their branches are routed in the
  generator's last run (SW-PWY-6). Until then the band and the strips beside it are held
  on the top tier (SW-RPI-7); in the last run a block stands about each cap (SW-RPI-12).
- `SW-PWY-13` Tier loads (added 2026-11-25). For each tier of the main rack, the weight of
  the pipe that lies along it and of what it holds (a liquid or two-phase line full of
  its liquid, a steam or gas line empty; insulation and the branches that cross the
  rack are not weighed, SW-PSP-18), bay by bay, is set against what the
  tier is built for: 40 psf over the rack's width (SW-PWY-2), 1,200 lb a foot. The
  heaviest bay of each tier is given in the pipeway's document, and a tier over its
  figure is listed there. Reason: the kit sizes a tier's beams for that load whatever is
  laid on them (SW-RK-2), so what is laid on them is checked against it.

## 81. Plant 3: the cooling water mains (`SW-CWM-*`)

Written 2026-11-26 at the owner's instruction for this stage: the cooling water mains and the
tower's piping, in one day, on sleepers at grade along the corridor (the owner accepted
sleepers over buried mains), joined to each unit's existing supply and return header spools at
its limit so that no unit is routed again. The figures are SmartWeld's own, from the reasoning
given; nothing was looked up (PROVENANCE P-94). The mains are piped by the generator of plants
1 and 2, unchanged, as the pipeway is (§80).

- `SW-CWM-1` The area. The two mains, cooling water supply and cooling water return, and the
  branches from them to the units are area 27 of the line numbers (20 to 26 are the areas beyond the bench, SW-PWY-4),
  numbered and built as process lines (`30"-P150-P-27001`), as the pipeway's streams and
  branches are (SW-PWY-12): the service decides nothing in the generator but its valves, and
  a line of the process letter is the one it lays in a rack lane (SW-RT-2),
  piped as a plant of their own in the main pipeway's frame moved 234 in north, so that the
  supply's lane is its centre line (the generator gives a rack line its lane outward from the
  rack's centre line, SW-RT-2). Each is of its plant header's conditions
  and size (SW-PRC-19: 30 in, class 150). Reason: the pipeway's top tier does not take them
  (SW-PWY-11, SW-PWY-13: each is about 410 lb a foot full of water, the pair two thirds of
  what a whole tier is built for), and the pipeway is routed clean as it stands: a plant of
  their own leaves it, and the units, as they are.
- `SW-CWM-2` Where they lie: on concrete sleepers at grade in the corridor's north strip,
  between the main rack's north column line and the junction frames at the north units'
  limits: the supply 234 in north of the rack's centre line, the return 54 in further north
  (a 30 in valve's pitch, SW-PWY-4: the valves at the mains' west ends and beyond their
  spools stand side by side). The supply then clears a column of the rack by more than 2 ft
  and the return a junction frame's post by more than 2 ft. North, because the cooling tower stands north of the corridor (SW-SITE-*). A sleeper
  is a plain concrete beam on grade square to the way, 12 in along it, as long as the two
  pipes and 12 in beyond each (one that would come within 3 in of the steel of a junction
  frame is left out, and the next carries the span), its top 11 in above grade; one on each bent line of the main
  rack over the way's length (20 ft apart: the span of SW-PS-7 for a pipe of 3.5 in and
  more), from a bent line west of the west spools to 10 ft short of the tower's spools.
  The way is the mains' own: the pipeway's supports (SW-RPI-17) stand clear of it, the strip
  from the return's far side to the supply's, as wide as the sleepers and 6 in more each
  side, from grade to 6 ft, being a solid while they are set (amended 2026-11-27: a pipe
  frame the pipeway's correction set stood with a post 20 in from the supply's lane, and the
  supply, routed after, was laid 6 in off its lane and came back at its west end in a loop
  through itself, the loop the owner had called impossible).
  Between the corridor and the tower's plot, off the way, the mains cross the open ground
  at 11 ft on posts and come down onto the way where it ends: away from a rack the
  generator keeps every line 8 ft clear of the ground but within 4 ft of its own ends
  (SW-RT-3), which here keeps that ground open to walk and drive across. Each main rests on a 4 in shoe on each sleeper (SW-PS-1), its axis 30 in above
  grade and its bottom 15 in: room to paint it and to look under it, and the generator's
  rule for a line on a tier (the tier, 4 in, the pipe's radius, on the 6 in grid) gives
  that height from an 11 in top. The generator would give the return the next lane, 3 in
  clear of the supply (SW-RT-2), too close for those valves: while the return is routed, a
  fence along the way between the two lanes, at the mains' height and 12 in clear of the
  return's pipe (6 in and the generator held the lane itself shut, gave the return the next
  lane 6 in further out and looped it back to its west spool), holds it in its own,
  from 20 ft east of the west spools (clear of their valves) to 10 ft short of the tower's.
  The way is given to the generator as a rack 16 ft wide, so that the return's lane is
  among those it tries.
- `SW-CWM-3` Their ends. Each main runs from a limit spool at the edge of the cooling
  tower's plot to a limit spool 20 ft west of its westernmost branch, on its lane, facing
  east; each spool is two nozzles back to back, 24 in face to face, as SW-PWY-4's, tag
  `PL-27{sequence}`, and on its far face stand a block valve and a blind flange. At the
  tower's plot the two spools stand on its south edge, facing the corridor, at the height
  the mains lie at, about the middle of the plot's width, the supply east of the return by
  a flange and 6 in or the valves' width and 3 in (SW-PWY-4's pitch), so that neither line
  crosses the other where they turn along the way. The valve and blind beyond the tower's
  spools are the plot's until it is piped; those at the west end are where the mains are
  carried on to the areas beyond the bench. The generator's valve at each spool's near
  face is not built (SW-PWY-7).
- `SW-CWM-4` The branches. Each unit's supply and return header spools at its limit
  (SW-RPI-15) are joined by a branch from the main of that service, of the spool's size
  (3 in at least, SW-PWY-12), with no valve of its own: the unit's block valve stands
  behind its spool. The generator routes each branch from a take-off it chooses on the main
  to the spool's face, the largest first: from the main up to the level of the unit's top
  tier and across into its valve bay for a north unit; for a south unit, across under the
  main rack at low level and up in the south strip. The generator's valve at the spool is
  not built (SW-PWY-7).
- `SW-CWM-5` Where the lines may travel: in the corridor from grade to 6 ft above the
  units' top tiers, or as high as the stem of the generator's valve at a unit's spool
  reaches and 6 in where that is higher (the pipeway's headers lie above, as solids), in the valve bays of the
  units that have cooling water spools as far as their spools and 18 in beyond, and over
  the open ground between the corridor and the tower's plot within 10 ft either side of
  the two tower spools. Over the main rack, from 2 ft below its lowest tier upward, the space is closed to
  the mains' lines while they are routed (added 2026-11-27), so that a branch to a south unit
  crosses under the rack as SW-CWM-4 says: routed without that, two such branches crossed
  over the pipeway's top tier, above its utility headers, where no support could stand
  clear of them (a post on the tier's beams passed through the headers; nothing stands
  above to hang from). Everything the pipeway and the units have built stands as a solid:
  the rack, its stringers and junction frames, the units' steel in their valve bays, every
  piece and support of the pipeway's lines and of the units' lines in their valve bays (as
  the checks hold them, SW-RPI-7), but the pieces of each cooling water spool itself, which
  the branch bolts to; and the pipe frames SW-RPI-17 set for those lines (amended
  2026-11-27: a frame stands in its model's report and not among its solids, and the clash
  audit found two of the mains through the post of a frame the pipeway's correction had set,
  by up to 4.5 in).
- `SW-CWM-6` Two runs. The supply's main with its branches and the valves beyond its
  spools are routed first; the generator's valves that are not built are taken out of the
  result (SW-PWY-7); then that result stands as solids (SW-RPI-7) while the return's lines
  are routed. Reason: the generator stands a valve at every spool while it routes, and the
  supply and return spools of a unit stand two to seven feet apart, too close for two such
  valves at once (in the first run of both together, the generator found every stem
  direction struck at the spools of units 12 and 17). For the same reason, while it routes
  the generator is shown the tier beams of the units' first bents only as solids 4 in
  short of their tops (SW-PWY-8 keeps them from the pipeway's runs altogether; a branch
  routed with them kept away passed through one), nor the part of any piece of the pipeway's or a unit's lines that
  stands where its valve at a unit's spool stands with its stem up (only that part: a 3 in
  pipe hidden whole, its end in that space, let a 20 in elbow pass 0.5 in over it): from the spool's face
  the valve's length and 6 in, its width and 3 in either side, from a flange's half below
  its axis to its stem's reach and 3 in above, and 3 in more all round (the generator holds
  a box out to 3 in). Nor is it shown the sleepers: it holds a box out to 3 in, and a main
  on its 4 in shoe is 4 in over a sleeper's top, as a rack line is over its tier's beam
  (which the generator holds by its axis, not as a box). The checks are made against them
  all.
- `SW-CWM-7` Supports and checks as for a unit (§40, SW-RPI-17): the mains on their
  sleepers as on a rack tier, the branches by the generator's own stepping and then
  SW-RPI-17's correction. The checks are run against the area's own lines and against
  everything SW-CWM-5 shows as solid, the first bents' beams included. Those solids are
  real, not routing aids: SW-RPI-17 sets no support through them (held as aids at first,
  a stanchion it set for the mains stood through the pipeway's 14 in steam header), so a clash with the pipeway or a unit is found.
- `SW-CWM-8` Not in this stage: the tower plot's own piping (basin outlet, the four
  circulating pumps, the side-stream filter, blowdown and make-up); the mains end at its
  edge (SW-CWM-3). Each unit's header spools for cooling water stay as they are.
