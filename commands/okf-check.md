---
description: Audit the .knowledge/ bundle for staleness, contradictions, and gaps
---

Audit the OKF memory bundle. Report findings; do not silently rewrite - surface issues and let the user decide, unless they ask you to fix.

Load the `okf-memory` skill and read its `references/maintenance.md` first.

## Checks

1. **Freshness.** For each concept, compare its `timestamp` against `git log` on the paths it describes. List any concept older than the code it covers. Offer to re-verify each against source, then overwrite + restamp.

2. **Contradiction.** Compare concepts against each other and against their `index.md` line. Flag any disagreement. The freshest `timestamp` is presumed correct; call out the stale side.

3. **Coverage.**
   - Real subsystems (from the 3-layer structure) with no concept file - propose creating them.
   - Concept files for subsystems that no longer exist - propose deleting them.

4. **Format.** Any concept missing a required frontmatter field (`type`, `title`, `description`, `tags`, `timestamp`) or using an unknown `type` - flag it.

5. **Size budget** (see `references/format.md`). Flag any concept body over ~150 words / ~30 lines, any `index.md` line over 15 words, or an `index.md` with more than ~40 concepts. Propose tightening or splitting - an oversized concept usually covers two subsystems.

## Output

A short report: stale concepts, contradictions (with which side wins), coverage gaps, format issues. End with the specific fixes you'd apply and ask whether to apply them.
