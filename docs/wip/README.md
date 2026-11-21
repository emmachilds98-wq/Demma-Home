# Work in progress from the 20–21 Nov round (not merged, not verified)

Helper agents' unfinished work, saved when the round stopped (the client, 21 Nov: "Merge current work to main and stop the upgrade").
Each was made on **main at 1eac230 (V4.33)**. To use one: `git checkout -b <branch> 1eac230 && git apply docs/wip/<file>`, finish it,
then merge main in. None has passed the checks; read it as a head start, not a result. Delete a file once its task is done.

| File | Task (`docs/REAL_PLAN.md` section 24) | What it holds | State when stopped |
|---|---|---|---|
| `N196-ktx2-partial.patch` | N196 KTX2 photos | `vendor.py` (the encoder side, from #133's f10bba7), `build_viewer.py` (a KTX2 path per photo), `02_textures.js` (a `KTX2Loader` path, JPEG the fallback), the workflow's encoder step, `checks.py` (sizes) | The agent was running the quick checks; the encoder's install and the browser load were not confirmed |
| `N196-ktx2-inflight.patch` | N196 KTX2 photos | The helper's later state (21 Nov, on b55df3f): the encoder, the build's KTX2 per photo, `KTX2Loader` with the JPEG fallback, checks and budget | Saved mid-work in case the session stops; superseded once N196 lands |
