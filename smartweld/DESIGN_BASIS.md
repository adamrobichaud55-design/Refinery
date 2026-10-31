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
- `SW-PS-4` Trunnion (for vertical runs at an elbow): a cylinder of OD × 3/8 in wall
  (round HSS of the pipe's OD, SW-HSS-*) × 12 in long, welded to the elbow, on a `PL1/2`
  base. Reason: carries a riser's weight at its lowest elbow.
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
- `SW-LAY-2` Equipment rows either side of the rack, each item on a 6 in concrete pad with
  stated plan dimensions and orientation (equipment list in code, `DEMO_EQUIPMENT`).
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
