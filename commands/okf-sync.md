---
description: Fold recent changes into the .knowledge/ concepts and restamp them
---

Reconcile the OKF memory bundle with recent work, so it reflects current truth.

Load the `okf-memory` skill and read its `references/maintenance.md` first.

## Procedure

1. **Confirm the bundle exists.** If there's no `.knowledge/index.md`, tell the user to run `/okf-init`.

2. **Find what changed.** Compare recent work against the bundle:
   - If a changed-file list was handed to you (the Stop hook names the files, or `.knowledge/.okf-dirty` lists them), target ONLY those files - this is the cheap path; do not re-scan the bundle.
   - Otherwise: `git log` / `git diff` since around the oldest concept `timestamp`, plus whatever was edited this session.
   Map changed paths to subsystems (which `arch-*.md` each touches).

3. **For each affected concept, run the after-a-change loop** (from `maintenance.md`):
   - Overwrite the body with the new current truth (present tense; delete what's no longer true). Keep it within the size budget in `references/format.md` (~150 words) - rewrite, don't accrete.
   - Restamp `timestamp` to now.
   - Update its one-line description in `index.md` if it changed.
   - Add an entry to `log.md` under today's `## YYYY-MM-DD` heading (newest-first; create the heading if absent).
   Create a new concept file if a real subsystem now has none.

4. **Reconcile `index.md`** - every concept line current, open-threads section updated.

5. **Report** which concepts were updated and which `log.md` lines were added. Don't claim a concept is fresh unless you actually re-grounded it against current code.
