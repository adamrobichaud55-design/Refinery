# Scroll sites

Ready-to-sell websites for local businesses, in the style where a film plays as the visitor scrolls. Each folder is a
complete site: copy it to any web host and it works. Nothing needs installing or building.

| Folder | For |
| --- | --- |
| `home-services/` | A heating, plumbing, electrical, roofing or building firm. The film opens up a model house and lights each system in turn. |
| `car-dealer/` | A used-car lot. The film flies over the forecourt at dusk to three featured cars, then a car finder, a two-car comparison, a monthly-payment sum and the stock. |
| `property-listing/` | One home for sale (or one rental). **The template for making a scroll-driven house tour from a client's own video or photographs.** The demo is a real apartment rebuilt from a freely available capture (see its `CREDITS.md`): scrolling walks through the office, hallway, living room, kitchen, dining room and bedrooms, with the rooms named automatically. Then facts, the gallery, rooms, a mortgage estimate and a viewing form. |
| `holiday-rental/` | A holiday apartment, for a host who wants direct bookings. The opening is a **live 3D walkthrough**: scrolling walks the camera through a furnished sea-view apartment in one unbroken move, with a day / sunset / night switch and a Play tour button, ending on a view down into the whole plan. Then facts, pictures and a calendar that prices any free dates. |

`demos/` holds mock-ups made for a named business to show them what their site could be. Each says "Concept design" on
every screen and lists in its `site.config.js` what is real and what still has to be confirmed. They are for showing to
that business, not for putting online.

## Rebrand one for a client (about ten minutes)

1. Copy the folder and rename it for the client.
2. Open `site.config.js` in any text editor. It holds every word on the page: the business name, phone number, services,
   prices, opening hours, and one brand colour (`accent`). Change them and save.
3. Replace the sample reviews and example prices with the client's real ones. They are marked SAMPLE and EXAMPLES.
4. To receive bookings, put a form address in `contact.endpoint` (Formspree, Basin and Netlify Forms all work).
5. Upload the folder to a host: drag it onto Netlify Drop, or use Cloudflare Pages, GitHub Pages or the client's own hosting.

Open `index.html` through a web server to preview (for example `npx serve home-services`); opened straight from disk,
browsers block the film's files.

## Use the client's own footage

The film is a set of still frames in `frames/`. Any clip can replace it: a phone walk-through of the shop, a drone pass,
an AI-made shot. One landscape clip and, ideally, one upright clip for phones:

```
node tools/pack-frames.mjs home-services --land shop-wide.mp4 --port shop-upright.mp4
```

Or make the film from a folder of photographs (each one drifts slowly and dissolves into the next), which is the
usual route for a property listing:

```
node tools/photos-to-film.mjs property-listing --photos ./wide-photos --port-photos ./upright-photos --frames 120 --quality 40 --scale 0.8
```

Give it wide photographs for computers and, in a second folder, the same number of upright ones for phones (same
order). Without `--port-photos` the wide ones are cropped to fit a phone, which loses most of each picture.

Use the client's own photographs. Pictures on a listings portal belong to the photographer or the brokerage, so ask the
agent for the originals instead of copying them from the portal.

Both tools need `ffmpeg`. Then adjust the `frames: [from, to]` numbers on each chapter in `site.config.js` so the words match
the new film (it has 240 frames; a chapter's text shows between its two numbers).

## What is in a site folder

- `index.html`, `styles.css`: the page and its look.
- `site.config.js`: all the content.
- `app.js`: builds the page from the config and runs the tools on it.
- `film.js`: the scroll film player. No libraries; frames are decoded on demand so phones do not run out of memory.
- `frames/`: the film, packed into a few files (each `.webp` there is a run of frames, not one picture), plus the first frame as a poster.

## The 3D package: one scan, one scene, three deliveries (property-listing)

This is the offer for photographers and agents: scan the home once and deliver it three ways.

| Delivery | What the client gets | File |
| --- | --- | --- |
| **Scroll site** | The listing page. It opens on the whole home seen from above with its ceiling off, dives in, and walks the visitor through room by room | `index.html` |
| **Floor plan** | On the listing page: the home from above with each room named and measured, and a table of room sizes | drawn from `scene/plan.webp` |
| **3D view** | The same home to look around freely: drag to look, tap a spot to walk there, a little plan to jump around by, an *Overview* to see it all and tap into a room; on a headset, an *Enter VR* button | `explore.html` |
| **Video** | The same opening and walk as a film for a reel or a listing | made by `tools/tour-video.mjs` |

All three are drawn from one folder, `property-listing/scene/`, which one command builds from the scan.

**1. Capture.** An iPhone or iPad Pro (the models with a depth sensor) and the free Stray Scanner app. Walk slowly
through every room, sweeping the phone over walls, floor and furniture; point down each room as well as at what is
beside you. Ten minutes covers an apartment. Copy the scan's folder off the phone: `rgb.mp4`, `odometry.csv`,
`camera_matrix.csv`, `depth/`, `confidence/`.

**2. Build the scene.**

```
pip install open3d numpy pillow onnxruntime tokenizers           # once; ffmpeg is needed too
python3 -I tools/scene/build_scene.py scan-folder/ work/ property-listing/scene --clip clip/
```

It fuses the scan's depth pictures into one solid model of the home and keeps a few hundred of its sharpest
photographs with the exact place each was taken; the site projects the photographs onto the model, so the picture
has their detail and holds together from any angle. From the model alone it then:

- draws the **floor plan** and splits it into rooms (a room is somewhere wide enough to stand clear of the walls; a
  doorway is not, so it parts two rooms), measuring each wall to wall;
- **names the rooms** by what the photographs taken in each one show (a bed makes a bedroom; a hob, a sink and a
  fridge make a kitchen), which needs `--clip`;
- plans a **walking route** that visits each part once, keeps clear of furniture, and looks where there is something
  to see instead of at the nearest wall.

**3. Check the rooms.** The command prints the rooms it found, with their sizes and what it saw in each. If a name is
wrong, correct `label` under `plan.rooms` and under `chapters` in `property-listing/scene/scene.json`. Give each
room name its words under `rooms` in `site.config.js`. The sizes are measured from the scan and are approximate:
say so to the client, as the page does.

**4. Check and deliver.** Serve the folder (`python3 -m http.server 5197` from `scroll-sites`) and open
`property-listing/` and `property-listing/explore.html`. For the video:

```
node tools/tour-video.mjs video out --site property-listing --page scene-dev.html --frames 1560
ffmpeg -framerate 24 -i out/f%04d.png -c:v libx264 -crf 20 -pix_fmt yuv420p tour.mp4
```

Upload the `property-listing` folder to any static host. A client's footage is theirs: `scene/` is not kept in this
repository (it is in `.gitignore`), so each job's scene lives with that job.

What to expect: thin things the depth sensor misses (a pendant lamp, chair legs, plants) can look smeared or doubled;
mirrors, windows and screens confuse it; and anything the scan never looked at shows as a soft patch. A slow,
thorough scan is the cure for all three. The VR button has not been tried on a headset yet.

**Fitting a model that already exists.** If the client has a model of the place (an architect's, a CAD export,
something built in Blender), `tools/scene/align_model.py` finds where it sits in the scan, which way round, and at
what size, whatever its units:

```
python3 -I tools/scene/align_model.py property-listing/scene client-model.obj fitted/ --merge 0.06
```

It writes the placement (`fit.json`), the model moved into place (`model.ply`) and, with `--merge`, a `mesh.glb`
that uses the client's model wherever the scan agrees with it and the scan everywhere else. In a test where a
plain shell of the scanned apartment was moved, turned and rescaled five ways (metres, millimetres, feet, inches,
one third size), it was put back to within 1.4 cm and 0.11% of its size every time. That shell came from the same
scan, so it matched by construction; a model drawn separately has not been tried yet. It expects a place with a
floor and upright surfaces. Merging only improves the picture where the model is more accurate than the scan: the
plain shell (`tools/scene/shell_from_scan.py`, flat ceiling, no detail) made this apartment's ceiling worse.

With no `scene/` folder the page falls back to the photo walk described next.

## A house tour from a client's video or photographs (property-listing)

This is the template for client work. Nothing is modelled by hand: every pixel on screen comes from the client's own
footage, placed in 3D, and the camera walks through it at a steady pace as the visitor scrolls.

**Only use footage the client has given you, with their say-so to use it on their site.**

There are two builders. Which one to use depends on what the client can give you.

| The client gives you | Use | What the tour is like |
| --- | --- | --- |
| A **phone scan** (iPhone or iPad Pro, Stray Scanner app): a video in which the phone tracked itself and measured depth | `build_walk.py --once` | The most reliable: every frame is placed exactly, with no matching step, so frames line up and the view can be wider. |
| A **video** of someone walking through the home, or **hundreds of overlapping photographs** | `build_walk.py` | The best: one smooth walk along the real route, rooms named automatically. |
| The usual **listing photographs** (a few per room) | `build_tour.py` | Rooms with several overlapping shots are rebuilt and walked through; a room with one shot gets a short walk into the picture. |

### Asking for a video (the better route)

A phone is enough. Tell the client: walk slowly, about one step a second; hold the phone level and steady, at chest
height, landscape; keep moving forward and turn slowly; go through every room once, without doubling back more than
you must; lights on, curtains open. Two to four minutes covers most homes. Fast, shaky or blurred footage cannot be
placed, and the builder says so when that happens.

**Better still, a scan.** With an iPhone or iPad Pro (the models with a depth sensor) and the free Stray Scanner app,
the recording comes with the phone's own tracking and measured depth. Copy the scan's folder off the phone (`rgb.mp4`,
`odometry.csv`, `camera_matrix.csv`, `depth/`, `confidence/`) and give that folder to the builder in place of a video.
Scan slowly, at chest height, pointing along each room and not at the wall beside you; holding the phone upright gives
a taller picture, which suits visitors on phones. Sweeping about and doubling back does no harm: with `--once` the
builder plans its own route that visits each part of the home once.

### Build it (one command)

```
pip install pycolmap onnxruntime numpy pillow tokenizers        # once; ffmpeg is needed for video

python3 -I tools/recon/build_walk.py scan-folder/ work/ property-listing/walk --model depth.onnx --clip clip/ --once --view 0.8,0.92
python3 -I tools/recon/build_walk.py walkthrough.mp4 work/ property-listing/walk --model depth.onnx --clip clip/
python3 -I tools/recon/build_tour.py client-photos/ work/ property-listing/walk --model depth.onnx
```

Two model files are needed, downloaded once from Hugging Face and not kept in this repo:

- `depth.onnx`: `onnx/model.onnx` from `onnx-community/depth-anything-v2-small` (Apache-2.0, about 100 MB).
- `clip/`, only for `build_walk.py`'s room names: `onnx/vision_model_quantized.onnx`, `onnx/text_model_quantized.onnx` and
  `tokenizer.json` from `Xenova/clip-vit-base-patch32` (MIT, about 155 MB).

**`build_walk.py`** cuts the video into frames, works out where each was taken, and plans one continuous path along
the route (ironing out wobbles and pauses, keeping a steady height, looking where the footage looks). Where the footage
jumps, it joins the pieces along a way the camera really went at some other moment. Parts the footage covers well are
walked; parts it covers thinly become **bridges**, which the site crosses several times faster with the picture
streaked by the motion, so one room flows into the next without a cut. Nothing in a bridge is invented: it is the real
route, seen quickly. The script also estimates depth for the frames it uses and names the rooms along the way (living
room, kitchen, bedroom ...). With `--sparse <folder>` it uses an existing COLMAP reconstruction of the frames instead
of making its own.

**`build_tour.py`** matches the photographs, groups them into rooms and writes `work/plan.json`, the list of rooms in
order, with pictures of each matched group in `work/sheets/`. Edit `plan.json` to rename, reorder or drop rooms, or to
change which photographs a room uses, then run the same command again (the slow steps are remembered). Add
`"push": 0.6` to a room to make the camera travel less far into it.

### Check the walk before anyone sees it

```
python3 -m http.server 5197 &                                  # from the scroll-sites folder
node tools/tour-check.mjs property-listing --report work/check.json
node tools/tour-check.mjs property-listing --from work/check.json --fix
```

The first line measures every camera position of the tour: how much of the picture the two nearest photographs do not
really show (this is where torn edges come from, typically a door frame passing close to the camera) and how much no
photograph shows at all. The second turns broken parts in the middle of the walk into bridges and cuts broken parts
off its ends. Slivers that no photograph shows are filled by the viewer from the colours around them, so they read as
wall and not as holes. Then record the video (below) and watch it once from start to finish.

### Add the words and publish

In `property-listing/site.config.js`: for a video tour, give each room name its words under `rooms` (a name with no
entry is shown on its own); for a photo tour, paste the list the command prints under `tour` and write a line for
each. Fill in the rest of that file (address, price, agent) and upload the folder.

`node tools/tour-video.mjs video out --site property-listing` records the tour as a video (for a reel or a listing).
To change the viewer itself, edit `property-listing/tour-src/walk3d.js` and rebuild:
`node ../smartweld/node_modules/vite/bin/vite.js build --config tools/photo3d.vite.config.mjs`.

### What to expect

- It is a guided tour along one path, not a free roam: the visitor cannot turn round or wander off.
- Where the footage does not cover the view well enough, the walk is cut and picks up again further on, with the next
  stretch opening out of the middle of the view. Better footage means fewer cuts.
- Thin things close to the camera (chair legs, lamp stems) can stretch as the camera passes.
- Mirrors, windows and shiny floors confuse the depth estimate a little.
- A long walk is heavy: the demo is about 30 MB, loaded a little at a time as the visitor scrolls.

## The 3D walkthrough (holiday-rental)

The apartment is not a video or a set of pictures: it is a 3D scene drawn live in the visitor's browser with three.js,
so the camera moves continuously and the light can change. It is all in `holiday-rental/tour-src/tour3d.js`: the walls,
furniture, textures, sea and sky are built in code, with no model or image files. The camera's stops are the `KEYS`
list near the end of that file, and the page's captions point at them by number (see `site.config.js`).

After changing the scene, build it into the one file the site loads, and (optionally) make a video of it:

```
node ../smartweld/node_modules/vite/bin/vite.js build --config tools/tour.vite.config.mjs
python3 -m http.server 5197 &                                    # in scroll-sites/
node tools/tour-video.mjs video out-frames                        # then the ffmpeg line printed at the top of that file
```

For a client, the scene has to be rebuilt from their floor plan and photographs: the room sizes, where the doors and
windows are, the furniture and the colours. That is the work being sold.

## Where the footage comes from

`studio/` holds the 3D scenes the two films are rendered from. They are built in code from simple shapes with three.js
(MIT licence), with no bought or borrowed models, pictures or logos, so the footage is yours to sell with the site.
The fonts are Google Fonts under the Open Font License.

```
node ../smartweld/node_modules/vite/bin/vite.js --config studio/vite.config.mjs &     # the studio page
cd studio && node capture.mjs frames housephotos photo                                    # twelve pictures of the model house (an all-original alternative to stock photographs)
cd studio && node capture.mjs frames house land && node capture.mjs frames house port   # render (about 20 minutes each; the car lot is "carlot", its stock photos "carcard card")
cd .. && node tools/pack-frames.mjs home-services --land studio/out/house-land --port studio/out/house-port
```
