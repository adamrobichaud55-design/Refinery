# Photoreal pictures for the listing concept

Twelve prompts for an AI image generator (Midjourney, Flux, ChatGPT images, Firefly, Imagen and similar). They describe
one made-up house, so the set looks like a single property and shows no real home or real address.

## How to use them

1. Generate picture 1 first. If your tool takes a reference image, give it picture 1 for every exterior after that,
   and picture 4 for the other rooms, so the house stays the same.
2. Make each picture twice: wide (3:2) for computers and the gallery, upright (9:16) for phones.
3. Paste the **style line** on the end of every prompt.
4. Save them as `01-front.jpg`, `02-from-above.jpg` and so on, in the order below.
5. Put the wide ones in a folder and run: `node tools/photos-to-film.mjs property-listing --photos <that folder>`.
   (Or send them back in the chat and they will be built into the site for you.)

Check your generator's terms before selling work that uses the pictures. Paid plans on most of them give you
commercial rights to what you make; free plans often do not.

## The house (keep this wording the same in every prompt)

> a two-storey white clapboard family home with a dark grey standing-seam metal roof, black-framed windows, a covered
> front porch and an attached single garage, on a quiet tree-lined lane in Atlantic Canada

## Style line (add to the end of every prompt)

> professional real-estate photography, shot on a full-frame camera with a 16mm tilt-shift lens, straight verticals,
> natural colour, soft even exposure, sharp detail, no people, no text, no watermark, no logos

## The twelve pictures

1. **Front, twilight.** Exterior of [the house], seen from the lane at blue hour, every window glowing warm, porch
   light on, wet driveway reflecting the lights, mature maples and spruce behind.
2. **From above.** Drone photograph of [the house] from 30 metres up at golden hour, showing the roof, the paved
   drive for three cars, a hedged back garden with a stone patio, neighbouring trees.
3. **Front door.** Close view of the covered front porch of [the house] in soft afternoon light, wide dark-painted
   front door, two planters, stone path leading up to the steps.
4. **Living room.** Bright open-plan living room on the main floor, large front window with black frames, light oak
   floor, pale walls, a grey sectional sofa, oak coffee table, wool rug, floor lamp, framed prints, daylight from the
   left.
5. **Living room towards the kitchen.** The same living room looking the other way, past the sofa to an oak
   staircase and through to a white kitchen with an island, pendant lights on.
6. **Dining.** Dining area beside glazed patio doors, oak table for six, a single pendant light above it, garden
   visible outside, late-afternoon light.
7. **Kitchen.** White shaker kitchen with a quartz-topped island and two wooden stools, stainless-steel fridge and
   range, window over the sink, two globe pendant lights, a bowl of oranges on the island.
8. **Main bedroom.** Calm upstairs bedroom under a sloping ceiling, king bed with linen bedding and a dark green
   throw, oak bedside tables with lit lamps, large window to the garden, soft morning light.
9. **Second bedroom.** Smaller upstairs bedroom with a double bed, a desk and chair under the window, pale walls, one
   framed print, daylight.
10. **Bathroom.** Upstairs bathroom with a white built-in tub, white vanity with a round mirror, grey floor tile, a
    frosted window, chrome towel rail, bright and clean.
11. **Back garden.** Rear of [the house] at dusk, stone patio with a table and four chairs, glazed doors lit from
    inside, clipped hedge around a lawn.
12. **Drive and garage.** Three-quarter view of [the house] from the end of the drive on an overcast day, attached
    single garage with a white panelled door, paved drive, front lawn.
