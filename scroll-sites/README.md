# Scroll sites

Ready-to-sell websites for local businesses, in the style where a film plays as the visitor scrolls. Each folder is a
complete site: copy it to any web host and it works. Nothing needs installing or building.

| Folder | For |
| --- | --- |
| `home-services/` | A heating, plumbing, electrical, roofing or building firm. The film opens up a model house and lights each system in turn. |
| `car-dealer/` | A used-car lot. The film flies over the forecourt at dusk to three featured cars, then a car finder, a two-car comparison, a monthly-payment sum and the stock. |
| `property-listing/` | One house for sale, for an estate agent (or one rental, for a host). **The template for making a scroll-driven house tour from a client's own photographs**: one command turns their photo folder into the tour, and the page plays it as the visitor scrolls. Then facts, the gallery, rooms, a mortgage estimate and a viewing form. The sample photographs are free-licence ones of a real house, credited in `originals/CREDITS.md`. |
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

## A house tour from a client's photographs (property-listing)

This is the template for client work. Nothing is modelled by hand: every pixel on screen comes from the client's
photographs, placed in 3D, and the camera walks through them at a steady pace as the visitor scrolls.

**Only use photographs the client has given you, with their say-so to use them on their site.**

### 1. Get the photographs

Ask for the originals, named or numbered in tour order (front of the house first). What you get decides what the tour
is like:

- **Several overlapping wide shots of a room, taken a few steps apart**: the room is rebuilt in 3D and the camera
  really walks through it. Five to eight per room is plenty. This is worth asking the client (or their photographer)
  for; a phone is fine.
- **One shot of a room** (what most listings have): the camera walks forward into that picture and on to the next.
- Close-ups of details add nothing to the tour; keep them for the gallery.

### 2. Build the tour (one command)

```
pip install pycolmap onnxruntime numpy pillow          # once
python3 -I tools/recon/build_tour.py client-photos/ work/ property-listing/walk --model model.onnx
```

`model.onnx` is the Depth Anything V2 (small) model: `onnx/model.onnx` from `onnx-community/depth-anything-v2-small` on
Hugging Face (Apache-2.0, about 100 MB, not kept in this repo). Forty photographs take a few minutes on a laptop.

It writes `work/plan.json`, the list of rooms in order, and pictures of each matched group in `work/sheets/`. **Edit
`plan.json`** to rename rooms, reorder or drop them, or change which photographs a room uses and in what order, then
run the same command again (the slow steps are remembered). Add `"push": 0.6` to a room to make the camera travel less
far into it, if things near the camera stretch.

### 3. Add the words and publish

The command prints a ready-made list of the rooms. Paste it under `tour` in `property-listing/site.config.js`, write a
title and a line for each room, fill in the rest of that file (address, price, agent), and upload the folder.

`node tools/tour-video.mjs video out --site property-listing` records the tour as a video (for a reel or a listing).
To change the viewer itself, edit `property-listing/tour-src/walk3d.js` and rebuild:
`node ../smartweld/node_modules/vite/bin/vite.js build --config tools/photo3d.vite.config.mjs`.

### What to expect

- Within a rebuilt room the camera travels between the spots the photographs were taken from, then on towards the far
  end of the room. Rooms follow one another with the next opening out of the middle of the view.
- It is a guided tour along one path, not a free roam: the visitor cannot turn round or wander off.
- Thin things close to the camera (chair legs, lamp stems, a table edge) can stretch as the camera passes.
- Photographs with no lens data are assumed to be a typical wide listing lens (`--f35 22` changes that).

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
