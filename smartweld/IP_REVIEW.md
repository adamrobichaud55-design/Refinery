# SmartWeld 3D Catalogue — IP review package (valves)

Prepared 2026-11-01 for SmartWeld's intellectual-property counsel.

**This is not a legal opinion.** It is the engineering record counsel needs to give one. It
covers three questions: where the valve designs came from, which visible features are dictated
by function (and which are free design choices), and what remains for counsel to search and
decide. The full record is in `DESIGN_BASIS.md` (every rule and its reason), `PROVENANCE.md`
(dated audit log, entries P-1 to P-41) and the git history of the `smartweld/` folder.

## 1. Clean-room record

- **Built from nothing in one session.** All work is in `smartweld/`, in commits from
  2026-10-31 onward (first commit f778800). No file outside that folder was read or used.
- **No external references.** No document, image, website, catalogue, standard, dimension
  table or existing file was consulted for any dimension or form (PROVENANCE P-22, P-27, P-39).
  The only network use was installing open-source libraries; one attempt to reach the official
  federal regulations site was blocked and never repeated.
- **Sizes** come from SmartWeld rules derived from pressure, force and hand effort
  (`DESIGN_BASIS.md` §29–32). **Shapes** come from the form rules (§32A, F-0 to F-10), written
  from general engineering knowledge of how each valve type works, and refined only by
  SmartWeld's own screenshot reviews (P-29, P-36, P-38, P-39).
- **Code.** The geometry, the casting modeller (`src/geometry/sdf.ts`) and every part builder
  were written in this session. The geometry code imports no third-party library. three.js
  (MIT licence) only draws the result.
- **Disclosure (P-41).** During the provenance audit, a history command listed the messages of
  seven pre-existing commits in this repository (dated 2026-10-13, not made in this session; one
  refers to a "catalogue photo"). Their files were never opened or used.
- **Known limit.** The AI that wrote the rules learned what valves look like from broad public
  material during its training. It did not consult or reproduce any specific product, but it
  cannot prove that no specific design influenced a detail.

## 2. Visible features and their function

Design patents and trade dress protect ornamental appearance, not features dictated by
function. Every visible feature of every valve is listed below with the rule that sets it and
the function that dictates it.

| Valve | Visible feature | Rule | Function that dictates it |
|---|---|---|---|
| All flanged | End flanges with raised face and bolt circle | SW-FLG-1..7 | Bolted, gasketed pipe joint; raised face concentrates gasket load |
| All flanged | Tapered hub from flange to body | SW-FLG-6 | Carries flange bending into the pipe wall without a stress jump |
| All cast | Smooth blends, fillets, rounded edges | F-0 | Molten metal must flow and solidify; sharp corners crack |
| All bonnets | Bolted bonnet or cover with gasket | SW-VLV-7, F-1 | Access to internals; pressure seal |
| Rising stem | Stuffing box, packing rings, gland with two bolts | SW-VLV-6 | Seals a moving stem; gland bolts adjust packing compression |
| Handwheel | Round rim, spokes, hub | SW-VLV-8 | Grip for two hands; spokes carry rim pull to the hub |
| Handwheel | Dished (hub below rim), curved spokes | SW-VLV-8 | Keeps knuckles clear of the bonnet below |
| Gate | Body chamber oval across the flow | F-2 | Wedge is wide across the flow and thin along it |
| Gate | Oval bonnet flange | F-2 | Follows the chamber it closes |
| Gate, globe | Cast yoke with two tapered arms and a nut boss | G-4 | Holds the stem nut true to the stem; bending is largest at the root |
| Gate, knife | Open yoke window | G-4, K-1 | Access to the gland; room for the rising stem |
| Knife gate | Thin lugged body, gate housing, transverse gland | K-1 | Plate gate needs no cavity; plate sealed where it leaves the body |
| Globe, control | Spherical bulb | F-3 | Encloses the S-shaped flow path with least metal |
| Y-globe | Bonnet at 45° | F-4 | Straight-through seat; handwheel within reach |
| Angle globe | Outlet turned down | F-4 | Replaces an elbow; flow turns once |
| Swing check | Chamber long along the flow, round bolted cover | F-5 | Disc must swing clear; cover is the only service access |
| Swing check | Raised centre on cover; hinge-pin bosses | F-5 | Stiffens the cover against pressure; carries the hinge pin |
| Lift check | Small domed cap | F-5 | Houses the dashpot guide; dome resists pressure |
| Floating ball | Spherical body, bolted end connector | B-1, F-6 | Encloses the ball; connector allows ball insertion |
| Ball, butterfly, plug | Flat top pad or plate | F-6, F-7, F-8 | Mounting face for the lever or gearbox |
| Butterfly | Ring body, tall neck, top plate | F-7 | Clamped between flanges; neck clears pipe insulation |
| Butterfly | Locating ears with holes; lugs | F-7, BL-1 | Centre the valve on the line studs; lugs allow dead-end service |
| Double-offset butterfly | Integral flanges, offset shaft | BD-1 | Disc lifts off a metal seat as it opens |
| Plug | Rounded square body, square head, socket wrench | F-8, PL-1 | Encloses the taper; square transmits torque |
| Diaphragm | Square body flange, four-sided bolting, dome bonnet | F-8, DI-1 | Diaphragm and compressor are rectangular where they meet the weir |
| Needle | Hex bar body, T-bar handle | NE-1 | Small bore machined from bar; fine control by hand |
| Safety valve | Angle body, tapered bonnet, cap, lifting lever | PSV-1, F-9 | Spring housing; manual test lever |
| Control valve | Shallow dished actuator, yoke, positioner | CV-1, F-9 | Diaphragm area for the required force; positioner sets travel |
| Levers | Tapered handle, grip, latch, notch plate | SW-VLV-4 | Hand grip; latch holds a set opening |
| Gear operators | Round housing, worm tube, input wheel | SW-VLV-4 | Worm gear multiplies hand torque; round because the wheel is |

## 3. Choices not dictated by function (for counsel's attention)

These elements reflect SmartWeld choices within a functional range. Each can be changed by
editing one rule in `DESIGN_BASIS.md` and its code, without touching anything else.

| Element | Where set | Why it is a choice |
|---|---|---|
| Colours: grey castings, red handwheels and levers, bright stems | F-10 | Display only, not engineering data. Red handwheels and grey castings are common conventions, but colour schemes can be trade dress. Counsel should confirm or pick another scheme. |
| Exact proportional constants (e.g. bulb 0.85 D, gate chamber 0.7 D × 0.3 D, yoke arm taper, neck height) | F-2..F-9, G-4 | The general form is functional; the specific numbers are SmartWeld's within a working range. |
| Curved (rather than straight) handwheel spokes; dish depth 0.12 D | SW-VLV-8 | Dishing is functional (knuckle clearance); the curve shape is a choice. |
| Lever outline, grip sleeve shape, notch-plate tooth count | SW-VLV-4 | Functional elements; their exact outlines are choices. |
| Positioner as a plain box | F-9 | Placeholder envelope only. |
| Edge-rounding radii | F-0 | Casting practice sets that edges are rounded; the radius is a choice. |

## 4. What counsel needs to decide or search

1. **Design patents and registered designs.** Search each of the 16 valve forms (renders in
   `screenshots/stage4/`, contact sheets `sheet-1.png`, `sheet-2.png`, all made by SmartWeld's own
   renderer) in every market where
   SmartWeld will use or sell this product. This session had no access to patent databases.
2. **Trade dress.** Review the colour scheme (§3) and any overall look against marks in use.
3. **Ownership of AI-assisted work.** Advise how far SmartWeld can claim copyright or other
   rights in AI-generated rules, code and geometry, and how best to protect them (for example as
   trade secrets or by contract). The record of SmartWeld's own creative direction is §5.
4. **AI provider terms.** Confirm SmartWeld's rights in the output under the terms of the AI
   service used.
5. **Open-source licences.** three.js (MIT) ships in the viewer and a subset of the DejaVu Sans
   font (Bitstream Vera licence, permissive) is embedded in every work-order PDF; both notices are in
   `THIRD_PARTY_NOTICES.md` and must accompany any distribution. The other libraries (Vite, Vitest,
   TypeScript, pypdf) are development tools and are not distributed. SmartWeld's licence policy
   (DESIGN_BASIS.md §0.1, SW-LIC-1..5) admits no copyleft (GPL, LGPL, AGPL, MPL, OFL or similar) code,
   tool or font: the drawing reader is SmartWeld's own code on pypdf (BSD-3-Clause); the work-order
   PDFs are written by SmartWeld's own PDF writer; the review images and contact sheets are made by
   SmartWeld's own renderer. The headless browser (which bundles an LGPL media library) and its
   OFL-font PDFs and screenshots were replaced (PROVENANCE P-57, P-58). **For counsel to confirm:**
   the line drawn in SW-LIC-4 — the cloud container's operating system, shell, git and C library
   (GPL/LGPL) run the commands but are not linked into, modified for or shipped with SmartWeld, and
   are treated as outside the policy.

## 5. Record of SmartWeld's direction (human contribution)

All dated 2026-10-31 to 2026-11-01, from the session record:

- Set the product scope, the clean-room source rules and the build order (P-1).
- Approved each stage before the next (P-16).
- Decided against citing any external source, including federal regulations (P-22).
- Decided that pipe and flange interfaces are SmartWeld rules with no external source (P-27).
- Required every valve type, in every size and class it is built in (P-32).
- Reviewed the valve renders five times and directed corrections to proportions, operators,
  construction and realism (P-29, P-36, P-37, P-38, P-39).
- Clarified that generic forms of each type are acceptable, but no one's specific design
  (P-39).

## 6. If counsel flags a feature

Every form is parametric and rule-driven. To design around a flagged feature: amend the rule
in `DESIGN_BASIS.md`, change the matching builder in `src/catalogue/parts/valves.ts`, log the
change in `PROVENANCE.md`, and run `npm test` and `npm run screenshot`. No other part of the
catalogue depends on a valve's appearance.
