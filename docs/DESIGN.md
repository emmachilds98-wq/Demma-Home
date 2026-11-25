# Design rules (N282)

The client, 24 Nov 2026: "i want a better ui for trying ideas and for them to fit and look better. can you review and really help design
real home improvement with research and knowledge of design and decor and choose close items and fit them appropriately or even build
them yourself and show me how in the build area like the living room."

The rules Ideas and the room checks use. Common guidance from the sources below; where they differ, the middle figure.

## Room to move (cm)

| Where | Keep clear | Used in |
|---|---|---|
| A main walkway through a room | 90 (60 at the least, past a corner) | the living room's check |
| In front of a wardrobe (doors open, stand to choose) | 90 | Ideas (`DZ` in `24_ideas.js`) |
| In front of drawers, a sideboard (pull out, stand) | 75 | Ideas |
| In front of shelves, a unit, a shoe rack | 60 | Ideas |
| Behind a desk's or a dining table's chair (pull out, sit) | 90 | Ideas |
| In front of a chair or sofa (legs) | 45 | Ideas |
| Sofa front to coffee table | 40–45 (30 for a lift-top you reach) | the living room's check |
| Beside a bed, at its foot | 60 | the bedrooms' check |

## Scale and placing

- **Rug:** big enough for at least the front legs of every seat round it; 20–45 cm of floor showing at the walls.
- **Coffee table:** about two thirds the sofa's length; its top within a few cm of the seat's height.
- **Side table:** its top within 5 cm of the sofa or chair arm.
- **Lamp:** a floor or table lamp at each reading seat's shoulder, within an arm's reach (about 60–100 cm).
- **TV:** sit about 1.2–1.6 × the screen's diagonal away for a 4K screen; the screen's middle near seated eye height (about 100–110).
- **Pictures:** the middle about 145–150 up; over a piece, about two thirds its width.

## Colour and light

- **60-30-10:** the walls (60), the bigger fabrics and wood (30: rug, curtains, a piece), one accent (10).
- **Dark walls** suit a screen room (less glare) and a small room you want cosy; pale walls a room short of daylight.
- **Light:** warm 2700 K to relax, 3000 K in kitchens and bathrooms, 4000 K for a desk; three layers in a living room (ceiling, lamps,
  an accent).
- Each Ideas set-up carries its own scheme (walls, rug, curtains, bedding, bulbs); "Its colours" on its card turns it on or off. The paints
  are Farrow & Ball's and Little Greene's (School House White, Skimming Stone, Setting Plaster, French Grey, Pigeon, Hague Blue, Slaked
  Lime), shown as approximate screen colours: try a tester pot on the wall.

## Each room: what it's for, what belongs (N286)

`house/places.py` (`ROOMS`, `KINDS`) holds these; Ideas puts a piece only in a place that takes it.

| Room | For | Belongs |
|---|---|---|
| Living room | sitting, the screen, the records | shelves, units, seats, lamps, tables, plants, a rug |
| Kitchen | cooking, the bar, the laundry | units, shelves, a trolley, a table and chairs (only with 90 round), plants |
| WC | a small room | slim shelves and units only |
| Hall | the way in | shoes, a bench, a console, shelves, a plant, a rug |
| Store | kept things, the washer dryer | shelves, units, chests, shoes |
| Landing | a way through | slim shelves and units, a plant, a rug |
| Bathroom | towels and the bathroom's things | units, shelves, chests |
| Bedroom 2 | the music room | shelves, units, a chair, a lamp, a rug, chests, a desk, plants |
| Master bedroom | sleeping and clothes | wardrobes, chests, bedsides, a chair, a lamp, a rug, shelves, plants |
| Office | work and drying | a desk, shelves, units, chests, a chair, a lamp, a rug, plants |
| Garage | tools and boxes | shelves, units, chests, shoes |
| Garden | eating and sitting out | garden tables, chairs, seats, plants |

Rules on a place: a wardrobe never under a window; a desk under or beside a window, never its back to the door; shoes only by a door
in; a bedside only at the bed; lamps and plants in corners; a table only on open floor with 90 round it, chairs only round a table.
Never in a door's swing, a radiator's face, over a window's sill (a piece there kept under it) or across a walk.

The shops' best for a place (N288): fit first (no more than 10 cm of its wall spare, a run of the same tall piece where it's modular),
then style (artisan oak and warm wood, cane, sage and pale mint, linen; white and painted below; black, grey and gloss last; in the garage
and store only the fit), then price. Where nothing fits well it's a gap, and N289 draws a piece to fit it.

## Sources (read 24 Nov 2026)

- Homes & Gardens, a guide to living room clearances: https://www.homesandgardens.com/interior-design/living-rooms/a-guide-to-living-room-clearances-measurements-and-spacing
- Livingetc, how much space between furniture for walking: https://livingetc.com/advice/how-much-space-between-furniture-for-walking
- John Lewis, measuring up for furniture: https://johnlewis.com/buying-guides/measuring-up-for-furniture-guide
- Houzz, measurements for furniture layout and ergonomics: https://www.houzz.com.sg/ideabooks/109239110
- Houzz, key elements for a great living room layout: https://www.houzz.co.uk/ideabooks/77167148/thumbs/key-elements-for-a-great-living-room-layout
- Designing Idea, bedroom layout clearances: https://designingidea.com/bedroom-layout/
