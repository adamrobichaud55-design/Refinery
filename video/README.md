# SmartWeld plant film

A scripted fly-through of a generated SmartWeld plant, rendered frame by frame from the real model.
This folder is separate from `smartweld/`: it reads that project's sources and published plant data and writes nothing there.
It uses a headless browser and ffmpeg, which the SmartWeld project itself does not use (its PROVENANCE P-58), so keep it outside that project.

## Make the film

```
node ../smartweld/node_modules/vite/bin/vite.js --config vite.config.mjs &   # the film page, http://127.0.0.1:5199/
node capture.mjs stills --pr=1                # three test frames per shot, out/stills/
node capture.mjs frames --pr=1.5              # every frame at 1920x1080, out/frames/ (about 8 s a frame per worker)
ffmpeg -framerate 24 -i out/frames/f%04d.png -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -movflags +faststart smartweld-plant3-film.mp4
```

`node capture.mjs frames 0 327` and `frames 327 653` run as two workers side by side.
`--plant=P2` films plant 2 with the same camera path (the captions in `src/shots.ts` name plant 3's equipment).

## Files

- `src/shots.ts`: the camera script (positions in the plant's own inches) and the captions
- `src/film.ts`: scene, materials and lights, the tracking overlay, and the detail levels that keep each frame affordable
- `capture.mjs`: drives the page and saves frames
