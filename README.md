# Demma's Home · V1

Emma and Dave's whole house in 3D: every room from their photos and words, what's still to measure, the projects (the artisan oak media
wall first), and what to buy. Open it, look round, tap a piece, change its size, type in a measurement: it's saved for both of you.

**Open the app:** https://emmachilds98-wq.github.io/Demma-Home/ · **the shared page:** https://claude.ai/artifact/8M7ZmKP8m1kEDTZnuL3cyK

| Home | The house | A room | Edit | Measure | A project |
|---|---|---|---|---|---|
| Next up, the rooms, the projects | The 3D by floor; tap a room | In it · From above · On its own | Tap a piece, step its sizes | Every guessed size, a box each | Plan · Build · Shop |

## How it's made

- `house/`: the house as data (`survey_data.py`, every size with its source) and geometry (`model.py`), and the house file the app reads
  (`export_house.py`, every door, window, radiator and piece named, with where its size comes from).
- `media-wall/`: the living room in full detail and the media wall project (the plan, the build guide, the fit proof, the 3D room).
- `app/`: the app (five places: Home, House, Projects, Shop, Measure; the design system in `app/tokens.css`).
- `tools/`: `build.py` (everything into `_site/`), `checks.py` (every check), `round.py` (a round in one command), `pull_edits.py`.
- Nothing built is committed: the workflow builds, checks and publishes on every push (`.github/workflows/build.yml`); each version's PDFs
  go on a GitHub Release.

```bash
python3 -m pip install -r media-wall/requirements.txt && python3 -m playwright install chromium
python3 tools/build.py && python3 tools/checks.py      # then open _site/index.html through a local server
```

**Agents:** start with `CLAUDE.md`, then `docs/V1_PLAN.md` (the plan and its status board) and `docs/STATE.md` (what's true now).
The history (rounds 1–82) is in `docs/HISTORY.md` and the old `DIY` repository.
