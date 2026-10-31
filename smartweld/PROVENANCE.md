# SmartWeld 3D Catalogue — Provenance and audit log

Clean-room build. Every rule, decision and external resource is logged here with the date
and the reason or source. Entries are numbered `P-n` and never deleted; corrections are
appended.

## Ground rules confirmed at start (2026-10-31)

- No published dimension or property tables, no standards documents, no manufacturer or
  distributor catalogues, and no numbers recalled from memory of any of them.
- Rules are tuned only by engineering reasoning and by the user's review.
- None of the user's existing files, repositories, artifacts or connected services were
  opened, listed or read. The only git operations run against the session repository were
  `git rev-parse --abbrev-ref HEAD` and `git status --porcelain` (to confirm the branch and a
  clean tree) and a test that the directory `smartweld/` did not already exist. All work
  lives in the new directory `smartweld/` created by this session.
- Web access is used only for the official US federal regulations text (eCFR).

## Log

| ID   | Date       | Entry                                                                                                                                                                       |
|------|------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| P-1  | 2026-10-31 | Workspace `smartweld/` created inside the session repository on branch `ccr-b60fa7fe-eo6rly`. Nothing outside it was read.                                                 |
| P-2  | 2026-10-31 | Libraries installed from the public npm registry (the only network use besides the eCFR attempt): see "External resources" below. All permissive licences.               |
| P-3  | 2026-10-31 | DESIGN_BASIS.md written in full for stage 1 before any catalogue code. Rule IDs SW-U-*, SW-W-*, SW-C-*, SW-L-*, SW-HSS-*, SW-PL-*, SW-GP-*, SW-BP-*, SW-ST-*, SW-B-*, SW-AR-*, SW-WD-*, SW-MAT-*. |
| P-4  | 2026-10-31 | Physical constants K-1..K-6 recorded. Steel density 490 lb/ft³ is the density of steel (7.85 g/cm³ converted), used as a material property, not as a table value.         |
| P-5  | 2026-10-31 | Decision: W, C sections are fully parametric from the designation (depth, weight). The catalogue holds no list of "standard" sizes. Example designations shown in the viewer are chosen by the generator's own sizing rules (later stages) or typed by the user. |
| P-6  | 2026-10-31 | Noted possible coincidences with common practice, written from reasoning and NOT checked against any table: channel flange taper 1/6 (draft angle reasoning, SW-C-4); bolt hole d + 1/16 (tolerance reasoning, SW-B-8); 3 d spacing / 1.5 d edge distance (tear-out reasoning, SW-B-9). Values I recognised as table/standard values and therefore deliberately did NOT use: the HSS design-wall reduction factor (SW-HSS-1 uses the stated wall); the published minimum-fillet-size-by-thickness table (SW-WD-1 is a fresh rule with a different result); heavy-hex head/nut formulas (SW-B-2/3 derived from bearing and shear reasoning); coarse-thread pitch series (threads are not modeled; stick-out uses a pitch ≈ d/8 reasoning). |
| P-7  | 2026-10-31 | eCFR access attempted for 29 CFR 1926.755 (column anchorage) at www.ecfr.gov: blocked by the session network policy (DNS not resolved; proxy tunnel refused 403). No regulation is cited as a basis in stage 1. SW-BP-3 (four anchor rods) stands on its own reasoning until the text can be read. User must allow www.ecfr.gov before stage 3 (guardrails, stairs, ladders). |
| P-8  | 2026-10-31 | Decision: the W-family depth rule SW-W-5 uses a reference member at r₀ = 0.045 whose actual depth equals the nominal depth. Reasoning: rolling practice (constant web rolls, flange rolls opened for heavier members). Not fitted to any table. |
| P-9  | 2026-10-31 | Decision: no rolled-shape "k" distance, "T" dimension or detailing dimension is taken from anywhere but the rules above; k (flange face to end of fillet) is reported as tf + R from SW-W-3/4. |
| P-11 | 2026-10-31 | Amended SW-W-7 and SW-C-7 after the first test run: thickness rounding and channel toe radii made small sections miss the designation weight by just over 2 %; the flange thickness is now re-solved from the area balance after rounding. Also amended SW-WD-4 to say the reinforcement cap is modeled as a triangle (the code and the rule text disagreed). Reason: tests, not tables. |
| P-12 | 2026-10-31 | Observation for user review: SW-W-5 makes very heavy members of a family markedly deeper than nominal (e.g. a W14 at 211 lb/ft comes out about 16.5 in deep). This follows from the constant-T rule; not tuned against anything. |
| P-13 | 2026-10-31 | Stage 1 verified in a real browser: headless Chromium (pre-installed Playwright 1.63.0) loaded the Vite dev server, opened the column-base assembly and 13 catalogue entries, and saved `screenshots/stage1/*.png`; no page or console errors. Automated tests: 77 passing (`npm test`). |
| P-14 | 2026-10-31 | Geometry note: a plate with round holes (base plate) is meshed as one convex cell per hole so each cell is a closed ring; the cells share internal faces (faint seams in the render). Volume and BOM are unaffected. To be replaced by a general polygon-with-holes triangulation if needed. |
| P-15 | 2026-10-31 | Pending user decisions before later stages: (a) pipe and flange interface dimensions — source to be decided by the user before stage 5 (asked at the end of stage 1); (b) www.ecfr.gov must be allowed in the session network policy before stage 3 so guardrail, stair and ladder rules can cite 29 CFR 1910 Subpart D and 29 CFR 1926 Subpart R from the official text. |
| P-16 | 2026-10-31 | User approved stage 1 ("as long as everything is clean and copyright free you can proceed"). Stage 2 begun. |
| P-17 | 2026-10-31 | Stage 2 rules written to DESIGN_BASIS.md sections 13–18 (SW-BLD-*, SW-PF-*, SW-CF-*, SW-CL-*, SW-DR-*) before any stage-2 code. Building drawing block (dimensions, loads, grades, door schedule) is a reviewable input with basis `drawing`. |
| P-18 | 2026-10-31 | Values I recognised as standard/table values and deliberately did NOT use in stage 2: sheet-metal gauge thicknesses (SW-CF-5 uses a 1/64 in series; SW-CL-1 sheet is 0.025 in by reasoning); standard purlin/girt size lists (sizes come from SW-CF-5 span and load rules); bolt grade tensile strengths (the generator's drawing states "Grade 90"); roof snow/wind maps and load combinations (loads are drawing inputs; wind and seismic are not analysed, stated in the model notes); portal-frame moment coefficients from design guides (SW-PF-2 uses the fixed-end wL²/12 with stated reasoning). |
| P-19 | 2026-10-31 | Rule amendments before code, logged: SW-CF-6 clip changed from an angle to a plate (an angle cannot reach a by-pass girt web; a plate perpendicular to the supporting flange and parallel to the web works for both purlins and girts); SW-CF-7 added (endwall girts use the sidewall section; door jambs/headers as C); SW-BLD-4 added (endwall wind posts at 20 ft, because an 80 ft endwall cannot be girted in one span); SW-CL-2 amended with a 2 in eave overhang and a 1 in ridge gap. |
| P-20 | 2026-10-31 | Stage 2 verified in headless Chromium: demonstration plant (80 × 200 ft, 8 bays, eave 30 ft, 1:12) renders with 2,495 steel parts, 93.7 tons from the same part list as the bill of materials; exterior, corner, interior (walk), knee and door views saved to `screenshots/stage2/`; no page or console errors. First visual review found wall sheets removed in whole 36 in widths at doors; fixed by splitting sheets at door edges (SW-CL-2 unchanged). Tests: 93 passing. |
| P-21 | 2026-10-31 | Known simplifications stated in the model notes, for user review: no haunch at the knee (SW-PF-5); purlin/girt laps, fasteners, flange braces, sag rods not modeled; post-to-rafter and jamb-to-girt hardware not modeled; door hardware not modeled; rafter top flange is the purlin seat with no purlin clip on the far side. Frame sizing is preliminary proportioning, not a structural design (SW-PF-2). |
| P-10 | 2026-10-31 | Architecture decision: the part model is plain JSON-serialisable data (`PartSpec` with per-dimension basis tags). Geometry (`geometry/`) converts it to profile polygons and mesh arrays without any renderer dependency. The three.js viewer and the ground-truth export both consume the same data. |

## External resources

| Resource                       | Version  | Licence     | Use                                            | Logged |
|--------------------------------|----------|-------------|------------------------------------------------|--------|
| three (three.js)               | 0.170.0  | MIT         | Browser rendering only                          | P-2    |
| @types/three                   | 0.170.0  | MIT         | Type definitions for the viewer                 | P-2    |
| vite                           | 6.4.5    | MIT         | Dev server / bundler                            | P-2    |
| @types/node                    | 22.20.5  | MIT         | Type definitions for the test that reads DESIGN_BASIS.md | P-2 |
| vitest                         | 2.1.9    | MIT         | Test runner                                     | P-2    |
| typescript                     | 5.9.3    | Apache-2.0  | Compiler                                        | P-2    |
| playwright (pre-installed)     | session  | Apache-2.0  | Headless browser screenshots for verification   | P-2    |
| Node.js (pre-installed)        | 22.23.4  | MIT         | Runtime                                         | P-2    |

No other external resource of any kind was consulted.
