# External test drawings — protocol and scoring

Rules: `DESIGN_BASIS.md` §57 (SW-EVAL-1..6). Tool: `tools/evalscore.py` (standard library only).

Isometrics drawn by a third party's software from this model are a **test set only**. They measure
how SmartWeld's detector does on drawings it has never seen. They are never used to train it, never
shipped, and never copied into SmartWeld's generator.

## Steps

1. **Answer key** (committed): `python3 -I tools/evalscore.py key` writes `eval/answer-key.json`.
   For every line, it lists every object the drawings must show (class and tag) and the weld labels,
   all from the model.
2. **Receive a set**: `python3 -I tools/evalscore.py receive <set> --software "<name>" --version <v>
   --drawn-by "<designer>" [--branches-on-parent yes|no] <pdf files…>`.
   - The files go to `eval/external/<set>/`, which is never committed.
   - The receipt `eval/receipts/<set>.json` (committed) records their SHA-256 and who drew them with what.
3. **Clearance**: before scoring, record both references:
   `python3 -I tools/evalscore.py clear <set> --contract <ref> --licence-review <ref>`.
   - The contract gives SmartWeld the designer's work product and allows this use.
   - The licence review covers using the software's output to test AI.
   The tool refuses to score until both are present.
4. **Run the detector** on the drawings and write its results in the format below, kept in
   `eval/detections/` (never committed).
5. **Score**: `python3 -I tools/evalscore.py score <set> eval/detections/<file>.json [--annotations <file>]
   [--threshold 0.5]`. This writes `eval/reports/<set>--<detector>.json` and `.md` (committed), which
   contain numbers, class names and the model's own tags only.
6. **Notes and changes**: write observations in `eval/notes/` in your own words. Any change to the
   generator is made as a rule in `DESIGN_BASIS.md` citing the report, never the drawings.

## Classes

`elbow`, `tee`, `reducer`, `cap`, `flange`, `blind`, `valve/gate`, `valve/ball`, `valve/check`, `valve/control`,
`valve/relief`, `weld`, `support/hanger`, `support/shoe`, `support/guide`, `support/trunnion`, `support/anchor`,
`support/stanchion`, `support/trapeze`. Scored fine (as listed) and coarse (`valve`, `support`).

## Detections format (SmartWeld's own)

```json
{
  "set": "designer-set-1",
  "detector": { "name": "rfdetr-smartweld", "version": "0.1", "weightsSha256": "…" },
  "threshold": 0.5,
  "pages": [
    {
      "fileSha256": "<SHA-256 of the received PDF, as in the receipt>",
      "page": 1,
      "line": "6\"-P150-P-1001",
      "detections": [ { "class": "valve/gate", "score": 0.93, "box": [x0, y0, x1, y1], "text": null } ],
      "texts": [ "W12", "W13" ]
    }
  ]
}
```

- `line` is the line number the detector read from the sheet.
- `texts` are the labels it read (weld numbers and the like).
- Boxes are in page pixels or points, consistently within one set.

Hand-annotated boxes for a sample of pages use the same layout, with `"boxes": [ { "class": …, "box": […] } ]` per page.
