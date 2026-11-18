# Scroll sites

Ready-to-sell websites for local businesses, in the style where a film plays as the visitor scrolls. Each folder is a
complete site: copy it to any web host and it works. Nothing needs installing or building.

| Folder | For |
| --- | --- |
| `home-services/` | A heating, plumbing, electrical, roofing or building firm. The film opens up a model house and lights each system in turn. |
| `car-dealer/` | A used-car lot. The film flies over the forecourt at dusk to three featured cars, then a car finder, a two-car comparison, a monthly-payment sum and the stock. |
| `property-listing/` | One house for sale, for an estate agent. The opening is a **walk through the property's real photographs in 3D**: each photograph has a depth map, so the camera moves into it and the next room opens out of the far part of the one before. Then facts, the gallery, rooms, a mortgage estimate and a viewing form. The sample photographs are free-licence ones of a real house, credited in `originals/CREDITS.md`. |
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

## The walk through real photographs (property-listing)

This is the one to use when a client hands over photographs. Nothing is modelled: the pictures on screen are the
photographs themselves, each laid over a surface shaped by its depth map so the camera can move into it.

1. Put the wide photographs in `property-listing/photos/` and upright ones (for phones) in `photos-upright/`, named in
   walk-through order (`01-front.webp`, `02-hall.webp` ...). About 1600 pixels on the long side is plenty.
2. Make the depth maps. This needs Python with `onnxruntime`, `numpy` and `pillow`, and the Depth Anything V2 (small)
   model file, `onnx/model.onnx` from `onnx-community/depth-anything-v2-small` on Hugging Face (Apache-2.0, about
   100 MB, not kept in this repo). `tools/depth.py` writes one `.npy` per photo and `tools/depth-to-png.py`
   turns those into the PNGs in `depth/`.
3. List the shots under `film` in `site.config.js`: the photo, its depth map, and `to`, the spot the camera heads for.
4. If the scene code changes, rebuild it: `node ../smartweld/node_modules/vite/bin/vite.js build --config tools/photo3d.vite.config.mjs`

What to expect: gentle, real camera movement and rooms that open into one another. It is not a free walk round a full
3D model: the camera can only travel a short way into each photograph before things close to it start to stretch.

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
