# Plan: walking the stairs (Emma, 27 Nov 2026)

Emma: "i cant seem to walk up the stairs from the kitchen like im hitting a wall" and "when running up the stairs sometimes i fall in the wall or into the entrance hall, i think im falling in between the office wall and stairwell floor on first floor". She wants the cause **confirmed in a real walk** before a fix ("make sure this is the issue").

## Status
Not reproduced yet (the session ran out of usage while the first probe walk was running). Nothing in the code changed yet. Branch `claude/project-thread-fdzb26`.

## Suspects (from reading the code, not yet confirmed)
Both bugs appeared on 27 Nov, right after N306 (V4.105, `1d0c804`) and N307 (V4.106, PR #394, `b35abea`).

1. **Wall on the kitchen (lower) flight.** Flight: x 382–467, z −36.3 (foot, lower floor −260) to 261 (hall door, floor 0), 13 rises of 20, going 24.61.
   - N306 rewrote `house/model.py` `stair_soffit()`: two `paint` prisms along each side (x 381.6–382.2 and 466.4–467) from the lower flight's underside up to the living room flight's underside. A body radius is 18, so they should only touch the edges; check their polygons really stay on the walls.
   - `stair_soffit()`'s `ceiling` prism over the flight (y −25 at the foot, rising): walk collision skips the ceiling **boxes** as skins (`14_views_walk.js` `hsolidSet`, `skin`), but **not prisms** (`p`, `pw`, `pb` keep every prism but `contact`). If the head (eye 160, r 12) meets it, the walk stops like a wall. Likely the quickest fix: filter `skin` materials out of `pw`/`pb` too, the same as boxes.
   - N307's `endSide` plate in `04_living_shell.js buildStairs()` is drawn only (not in the walk's solids); low suspicion.
2. **Falling through by the office wall at the top of the living room flight.** First floor: `landing_top` x 382–467, z 196–261.7; the office (`bed3`) starts at z 274.4, so its wall is z 261.7–274.4. The living room's flight data (`R.HOUSE3.living.flight`) ends at zl1 261. N306 changed `walls_for()` (the "flush on the same line" test that drops a wall's corner extension) and the landing balustrade's `paint` (now a prism from x 381.6 to `fs.x0`+0.6). Suspect: the office wall's piece over the landing lost its corner ext, leaving a gap at x≈382 / z≈262–274 with no floor (`floorAt1` finds nothing → the walk drops to the hall). Fix: give the landing a floor up to the wall, or restore that wall's extension.

## Steps for the next session
1. `pip install playwright markdown` (once), `python3 tools/build.py --fast` (~20 s after the first full build), `npm pack three@0.160.0` and untar for `THREE_LOCAL`.
2. `THREE_LOCAL=<three>/package python3 tools/probe/walk_probe.py tools/probe/stairs_up.js` walks up the lower flight at x 400/425/445 and prints where it sticks and which HSOLID box or prism blocks it (it uses `R3D._dbg`: `walkMove`, `bodyBlocked`, `floorAtCm`, `HSOLID`).
3. Add a second probe: up the living room flight to the landing, then run toward +z and sideways near x 382–390, logging `WALK.feet` (a drop below 250 = the fall).
4. Fix what the probes show (one PR, row claimed with `tools/claim.py`), re-run the probes once, `tools/checks.py --quick`, `house/privacy_check.py`, push; CI's site check already walks down and back up the lower stairs (`check_site.py` WALK, legs "lower" and "back").
5. Delete `tools/probe/` when done (keep the repo lean) and add the lesson to `docs/NOTES.md`.
