# SmartWeld plant film

An assembly film of a generated SmartWeld plant, rendered frame by frame from the real model:
a black void where the pipe rack builds ahead of the camera, the equipment drops in, a
control station assembles part by part, the finished unit stands on a reflecting floor and the building frame and cladding close over it.
The camera is one unbroken move with no cuts: keys in `src/shots.ts`, joined by a spline and smoothed in time so that its speed and
direction never jump. `node capture.mjs profile` prints its speed and turn rate through the film, and every stretch where it passes
within 40 in of a pipe centreline. 30 frames a second. Each frame is the average of up to 12 sub-frames, spread over the shutter time
(motion blur) and over the width of the lens (depth of field: the close-ups keep the valves sharp and soften what is behind them).
This folder is separate from `smartweld/`: it reads that project's sources and published plant data and writes nothing there.
It uses a headless browser and ffmpeg, which the SmartWeld project itself does not use (its PROVENANCE P-58), so keep it outside that project.

## Make the film

```
node ../smartweld/node_modules/vite/bin/vite.js --config vite.config.mjs &   # the film page, http://127.0.0.1:5199/
node capture.mjs stills --pr=1                # 24 test frames spread over the film, out/stills/ (or: stills 8 110 250 for chosen frames)
node capture.mjs frames --pr=1.5              # every frame at 1920x1080, out/frames/ (0.5 to 30 s a frame; about 75 min in all)
ffmpeg -framerate 30 -i out/frames/f%04d.png -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart smartweld-plant3-assembly.mp4
```

`node capture.mjs frames --mod=4 --rem=0` (and `--rem=1`, `2`, `3`) run as four workers side by side.
`--plant=P2` films plant 2 with the same camera path (the station that assembles is the reflux line's stack at the column in either plant).

## Files

- `src/shots.ts`: the camera script (positions in the plant's own inches), one entry per shot
- `src/film.ts`: scene, materials and lights, what is built at each moment, motion blur, the overlay, and the detail levels that keep each frame affordable
- `capture.mjs`: drives the page and saves frames

`smartweld-plant3-film.mp4` is the first cut (a plain fly-through with captions); `smartweld-plant3-assembly.mp4` is the assembly film.
