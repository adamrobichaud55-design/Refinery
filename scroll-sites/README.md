# Scroll sites

Ready-to-sell websites for local businesses, in the style where a film plays as the visitor scrolls. Each folder is a
complete site: copy it to any web host and it works. Nothing needs installing or building.

| Folder | For |
| --- | --- |
| `home-services/` | A heating, plumbing, electrical, roofing or building firm. The film opens up a model house and lights each system in turn. |
| `car-dealer/` | A used-car lot. The film flies over the forecourt at dusk to three featured cars, then a car finder, a two-car comparison, a monthly-payment sum and the stock. |
| `property-listing/` | One house for sale, for an estate agent. The opening is a **walk through the house rebuilt in 3D from its own photographs**: overlapping photos of each room are matched to work out where each was taken and the shape of the room, and scrolling moves the camera through that. Then facts, the gallery, rooms, a mortgage estimate and a viewing form. The sample photographs are free-licence ones of a real house, credited in `originals/CREDITS.md`. |
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

## The walk through a house rebuilt from its photographs (property-listing)

This is the one to use when a client hands over photographs. Nothing is modelled by hand: every pixel on screen comes
from the photographs, placed in 3D.

What the photographs must be like: **several of each room, overlapping, taken from different spots** (walk a few steps
between shots and keep the last view partly in frame). Five to ten wide shots per room is plenty. A single photo of a
room, or close-ups of details, cannot be rebuilt.

The steps, all in `tools/recon/` (Python with `pycolmap`, `onnxruntime`, `numpy`, `pillow`; plus the Depth Anything V2
small model, `onnx/model.onnx` from `onnx-community/depth-anything-v2-small` on Hugging Face, Apache-2.0, not kept here):

```
python3 -I tools/recon/sfm.py photos/ meta.json work/           # where was each photo taken? groups them into rooms
python3 -I tools/recon/fuse.py work/sparse/0 photos/ model.onnx fused/m0     # depth for each photo, in the room's scale
python3 -I tools/recon/curate.py fused/m0 property-listing/walk/living        # pick the camera's path (--path 3,0,7 by hand)
```

`meta.json` gives each photo's 35 mm-equivalent focal length from its EXIF (`{"IMG_1.jpg": {"f35": 24}, ...}`).
Then list the rooms under `tour` in `site.config.js`, with the words for each. To change the viewer itself, edit
`property-listing/tour-src/walk3d.js` and rebuild: `node ../smartweld/node_modules/vite/bin/vite.js build --config tools/photo3d.vite.config.mjs`.
`node tools/tour-video.mjs video out --site property-listing --q walk=living,dining` makes a video of the walk.

What to expect: real camera movement through each room, between the spots the photos were taken from. Rooms that share
no photographs are joined by a moving dissolve. Thin objects close to the camera (chair legs, lamp stems) can smear as
the camera passes them. `tour-src/photo3d.js` is an older, simpler viewer for a single photo per room (a short push into
each picture); it is still in the bundle but the demo no longer uses it.

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
