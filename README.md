# Demma's Home

Emma and Dave's whole house in 3D: every room from their photos and words, what's still to measure, the projects (the artisan oak media
wall first; each room gets its own in time), and what to buy. It opens on the whole house; tap a floor, then a room, to go in.

**Open it:** https://emmachilds98-wq.github.io/Demma-Home/ · **the shared page:** https://claude.ai/artifact/8M7ZmKP8m1kEDTZnuL3cyK

| The whole house | A floor | A room | The living room | Measure |
|---|---|---|---|---|
| The house in 3D, Outside · First · Ground · Lower | Its rooms as pills; tap one | In it · Above · On its own | The media wall: Plan · Build · Buy, View · Room · Look · Edit | Every guessed size, a box each |

## How it's made

- `house/`: the house as data (`survey_data.py`, every size with its source) and geometry (`model.py`), and the house file
  (`export_house.py`, every door, window, radiator and piece named, with where its size comes from).
- `media-wall/`: the page (`src/build_viewer.py`, `page.css`, `room3d_page.py`, the 3D in `room3d.js`, Measure in `measure.js`), the living
  room in full detail and the media wall project (the plan, the build guide, the fit proof).
- `tools/`: `build.py` (everything into `_site/`), `checks.py` (every check), `round.py` (a round in one command), `pull_edits.py`.
- Nothing built is committed: the workflow builds, checks and publishes on every push (`.github/workflows/build.yml`); each version's PDFs
  go on a GitHub Release.

```bash
python3 -m pip install -r media-wall/requirements.txt && python3 -m playwright install chromium
python3 tools/build.py && python3 tools/checks.py      # then open _site/index.html through a local server
```

**Agents:** start with `CLAUDE.md`, then `docs/V1_PLAN.md` (the plan and its status board) and `docs/STATE.md` (what's true now).
The history (rounds 1–82) is in `docs/HISTORY.md` and the old `DIY` repository.
